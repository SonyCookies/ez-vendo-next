"use client";

import {
  ArchiveX,
  BanknoteArrowUp,
  CircleAlert,
  CircleCheckBig,
  Plus,
  ReceiptText,
  Trash2,
  UserSearch,
  UserX,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "../../../../firebase";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, increment, addDoc, serverTimestamp, orderBy } from "firebase/firestore";

export default function ManualTopUp() {
  const [searchModal, setSearchModal] = useState(false);
  const [query, setQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // Validation errors
  const [errors, setErrors] = useState({});
  const [showGlobalError, setShowGlobalError] = useState(false);

  const paymentMethod = [
    { id: 1, method: "Cash" },
    { id: 2, method: "Gcash" },
    { id: 3, method: "Maya" },
    { id: 4, method: "SeaBank" },
    { id: 5, method: "GoTyme" },
  ];

  // Format transaction ID (EZ-****** where ****** is first 6 chars of document ID)
  const formatTransactionId = (documentId) => {
    if (!documentId) return "EZ-000000";
    const firstSix = documentId.substring(0, 6).toUpperCase();
    return `EZ-${firstSix}`;
  };

  // Format date time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return date.toLocaleString('en-US', options);
  };

  // Fetch all manual top-up transactions from Firestore
  useEffect(() => {
    const fetchManualTopUps = async () => {
      try {
        setTransactionsLoading(true);
        const manualTopUpRef = collection(db, "manual_topup");
        
        let querySnapshot;
        try {
          const q = query(
            manualTopUpRef,
            orderBy("requestedAt", "desc")
          );
          querySnapshot = await getDocs(q);
        } catch (error) {
          console.warn("OrderBy failed, using simple query:", error);
          querySnapshot = await getDocs(manualTopUpRef);
        }
        
        const fetchedTransactions = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const requestedAt = data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : new Date());
          
          fetchedTransactions.push({
            id: formatTransactionId(doc.id),
            documentId: doc.id,
            name: data.userName || "",
            rfid: data.userId || "",
            amount: data.amount || 0,
            method: data.paymentMethod || "",
            reference: data.referenceId || "",
            datetime: requestedAt,
            status: data.status || "approved",
          });
        });
        
        // Sort by date if not already sorted
        fetchedTransactions.sort((a, b) => {
          const dateA = a.datetime instanceof Date ? a.datetime : new Date(a.datetime);
          const dateB = b.datetime instanceof Date ? b.datetime : new Date(b.datetime);
          return dateB - dateA;
        });
        
        setTransactions(fetchedTransactions);
      } catch (error) {
        console.error("Error fetching manual top-ups:", error);
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchManualTopUps();
  }, []); // Fetch on mount and after successful top-up

  // Search users in Firestore
  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setFilteredUsers([]);
        return;
      }

      try {
        setSearchLoading(true);
        const usersRef = collection(db, "users");
        const searchTerm = query.trim().toUpperCase(); // RFID is uppercase
        const searchTermLower = query.trim().toLowerCase(); // For name search
        const results = [];

        // First, try to search by RFID (Document ID)
        // Check if search term looks like an RFID (alphanumeric, typically uppercase)
        const isLikelyRFID = /^[A-Z0-9]+$/i.test(query.trim());
        
        if (isLikelyRFID) {
          try {
            const userDocRef = doc(db, "users", searchTerm);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              results.push({
                id: userDocSnap.id,
                rfid: userDocSnap.id,
                name: userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown",
                balance: userData.balance || 0,
                email: userData.email || "",
              });
            }
          } catch (error) {
            console.log("RFID search failed:", error);
          }
        }

        // Search by name - get all users and filter client-side for better flexibility
        const allUsersSnapshot = await getDocs(usersRef);
        allUsersSnapshot.forEach((doc) => {
          // Skip if already added from RFID search
          if (results.find(u => u.id === doc.id)) return;

          const userData = doc.data();
          const fullName = userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "";
          const firstName = (userData.firstName || "").toLowerCase();
          const lastName = (userData.lastName || "").toLowerCase();
          const rfidLower = doc.id.toLowerCase();
          
          // Check if matches name or RFID
          if (
            fullName.toLowerCase().includes(searchTermLower) ||
            firstName.includes(searchTermLower) ||
            lastName.includes(searchTermLower) ||
            rfidLower.includes(searchTermLower) ||
            doc.id.toUpperCase().includes(searchTerm)
          ) {
            results.push({
              id: doc.id,
              rfid: doc.id, // Document ID is the RFID
              name: fullName || "Unknown",
              balance: userData.balance || 0,
              email: userData.email || "",
            });
          }
        });

        // Remove duplicates and limit results
        const uniqueResults = results
          .filter((user, index, self) => index === self.findIndex((u) => u.id === user.id))
          .slice(0, 20); // Limit to 20 results for performance

        setFilteredUsers(uniqueResults);
      } catch (error) {
        console.error("Error searching users:", error);
        setFilteredUsers([]);
      } finally {
        setSearchLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchModal = () => {
    setSearchModal((prev) => !prev);
    setQuery("");
  };

  const handleSelectUser = async (user) => {
    try {
      // Fetch latest user data to get current balance
      const userDocRef = doc(db, "users", user.rfid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setSelectedUser({
          ...user,
          balance: userData.balance || 0,
          name: userData.fullName || user.name,
        });
      } else {
        setSelectedUser(user);
      }
      setSearchModal(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setSelectedUser(user);
      setSearchModal(false);
    }
  };

  // Auto-generate reference number when Cash is selected
  useEffect(() => {
    if (method === "Cash") {
      setReference("CASH-" + Math.floor(100000 + Math.random() * 900000));
    } else {
      setReference("");
    }
  }, [method]);

  // validations
  const validateForm = () => {
    const newErrors = {};

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      newErrors.amount = "Amount required";
    }

    if (method !== "Cash" && !reference.trim()) {
      newErrors.reference = "Reference number required";
    }

    setErrors(newErrors);
    setShowGlobalError(Object.keys(newErrors).length > 0);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm() || !selectedUser || processing) return;

    try {
      setProcessing(true);

      // Create manual_topup document in Firestore
      const manualTopUpRef = collection(db, "manual_topup");
      const manualTopUpDoc = await addDoc(manualTopUpRef, {
        amount: Number(amount),
        paymentMethod: method,
        processedAt: serverTimestamp(),
        referenceId: reference,
        requestedAt: serverTimestamp(),
        status: "approved",
        userEmail: selectedUser.email || "",
        userId: selectedUser.rfid,
        userName: selectedUser.name,
      });

      // Update user balance in Firestore
      const userRef = doc(db, "users", selectedUser.rfid);
      await updateDoc(userRef, {
        balance: increment(Number(amount)),
      });

      // Format transaction ID from document ID
      const transactionId = formatTransactionId(manualTopUpDoc.id);
      const now = new Date();

      // Refresh user balance
      const userDocSnap = await getDoc(userRef);
      let updatedBalance = selectedUser.balance;
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        updatedBalance = userData.balance || 0;
        setSelectedUser({
          ...selectedUser,
          balance: updatedBalance,
        });
      }

      // Refresh transactions from Firestore
      const manualTopUpCollection = collection(db, "manual_topup");
      let refreshQuerySnapshot;
      try {
        const refreshQ = query(manualTopUpCollection, orderBy("requestedAt", "desc"));
        refreshQuerySnapshot = await getDocs(refreshQ);
      } catch (error) {
        console.warn("OrderBy failed, using simple query:", error);
        refreshQuerySnapshot = await getDocs(manualTopUpCollection);
      }
      
      const refreshedTransactions = [];
      refreshQuerySnapshot.forEach((doc) => {
        const data = doc.data();
        const requestedAt = data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : new Date());
        refreshedTransactions.push({
          id: formatTransactionId(doc.id),
          documentId: doc.id,
          name: data.userName || "",
          rfid: data.userId || "",
          amount: data.amount || 0,
          method: data.paymentMethod || "",
          reference: data.referenceId || "",
          datetime: requestedAt,
          status: data.status || "approved",
        });
      });
      
      // Sort by date if not already sorted
      refreshedTransactions.sort((a, b) => {
        const dateA = a.datetime instanceof Date ? a.datetime : new Date(a.datetime);
        const dateB = b.datetime instanceof Date ? b.datetime : new Date(b.datetime);
        return dateB - dateA;
      });
      
      setTransactions(refreshedTransactions);

      // Show success modal
      setShowSuccess(true);

      // Reset form after success (keep user selected so they can add more)
      setTimeout(() => {
        setAmount("");
        setMethod("Cash");
        setReference("");
        setNote("");
        setErrors({});
        setShowGlobalError(false);
        setShowSuccess(false);
        setProcessing(false);
      }, 2000);
    } catch (error) {
      console.error("Error processing top-up:", error);
      alert("Failed to process top-up. Please try again.");
      setProcessing(false);
    }
  };

  // styling helpers
  const fieldClass = (err) =>
    `px-3 sm:px-4 py-2 w-full border ${
      err ? "border-red-500" : "border-gray-300"
    } outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150`;

  const labelClass = "text-xs sm:text-sm text-gray-500";

  return (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* search user*/}
      {!selectedUser && (
        <div className="flex flex-col gap-2">
          {/* label */}
          <span className="font-semibold text-gray-500 text-xs sm:text-sm">
            Search User
          </span>

          <div className="border border-dashed border-gray-300 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-4 sm:gap-5 bg-gray-50">
            <div className="flex items-center justify-center pt-2">
              <div className="flex items-center justify-center p-4 bg-gray-200 rounded-full">
                <BanknoteArrowUp className="size-7 sm:size-8" />
              </div>
            </div>

            <div className="flex flex-col text-center">
              <span className="text-base sm:text-lg font-semibold">
                Manual Top-up
              </span>
              <span className="text-gray-500 text-xs sm:text-sm">
                Enter user's name or RFID No. to add balance.
              </span>
            </div>

            <div className="flex items-center justify-center pb-2">
              <button
                onClick={handleSearchModal}
                className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-500/90 active:bg-green-600 cursor-pointer transition-colors duration-150"
              >
                Search user
              </button>
            </div>
          </div>
        </div>
      )}

      {/* manual top-up form */}
      {selectedUser && (
        <div className="flex flex-col gap-2">
          {/* label */}
          <span className="font-semibold text-gray-500 text-xs sm:text-sm">
            Manual Top-up Form
          </span>
          <div className="border border-gray-300 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center md:items-start justify-center gap-5 sm:gap-6 ">
            {/* user info */}
            <div className="flex flex-col gap-4 w-full md:w-96 xl:w-1/2 p-4 md:p-5 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="flex flex-col gap-3 py-2">
                <div className="flex items-center justify-center">
                  <div className="size-24 rounded-full bg-green-500"></div>
                </div>

                <div className="flex md:flex-col md:gap-4 items-center ">
                  <div className="flex flex-1 flex-col text-start md:text-center">
                    <span className="font-semibold">{selectedUser.name}</span>
                    <span className="text-gray-500 text-xs sm:text-sm">
                      RFID No. {selectedUser.rfid}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col text-end md:text-center">
                    <span className="text-xs sm:text-sm text-gray-500">
                      Current balance
                    </span>
                    <span className="font-semibold">
                      P{selectedUser.balance}.00
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* form */}
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center justify-center">
                <span className="font-semibold">Top-up Form</span>
              </div>

              {/* GLOBAL ERROR */}
              {showGlobalError && (
                <div className="border-l-4 px-4 py-2 rounded-lg bg-red-100 text-red-500 flex items-center gap-3">
                  <CircleAlert className="size-5 sm:size-6" />
                  <span className="text-xs sm:text-sm">
                    Please fix the errors below.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* amount & method */}
                <div className="grid grid-cols-2 gap-3">
                  {/* amount */}
                  <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
                    <label className={labelClass}>Amount</label>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className={fieldClass(errors.amount)}
                    />
                    {errors.amount && (
                      <span className="text-xs text-red-500">
                        {errors.amount}
                      </span>
                    )}
                  </div>

                  {/* payment method */}
                  <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
                    <label className={labelClass}>Payment method</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className={fieldClass(false)}
                    >
                      {paymentMethod.map((item) => (
                        <option key={item.id} value={item.method}>
                          {item.method}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* reference number */}
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Reference number</label>
                  <input
                    type="text"
                    value={reference}
                    disabled={method === "Cash"}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Enter reference number"
                    className={
                      method === "Cash"
                        ? "px-3 sm:px-4 py-2 w-full border border-gray-300 bg-gray-100 outline-none rounded-lg placeholder:text-gray-500 transition-colors duration-150"
                        : fieldClass(errors.reference)
                    }
                  />
                  {errors.reference && (
                    <span className="text-xs text-red-500">
                      {errors.reference}
                    </span>
                  )}
                </div>

                {/* note */}
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Note (optional)</label>
                  <textarea
                    rows="4"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={fieldClass(false)}
                    placeholder="Enter note"
                  />
                </div>

                {/* buttons */}
                <div className="flex gap-2 items-center justify-center md:justify-end w-full mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setErrors({});
                      setShowGlobalError(false);
                    }}
                    className="bg-red-500 w-full md:w-auto text-white rounded-lg px-4 py-2 hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 cursor-pointer"
                  >
                    Discard
                  </button>

                  <button 
                    type="submit"
                    disabled={processing}
                    className="bg-green-500 w-full md:w-auto text-white rounded-lg px-4 py-2 hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? "Processing..." : "Confirm"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* transactions */}
      <div className="flex flex-col gap-2">
        <div className="flex items-centerr">
          {/* label */}
          <span className="font-semibold text-gray-500 text-xs sm:text-sm">
            All Manual Top-up
          </span>
          {/* see all link */}
        </div>

        {/* mobile */}
        <div className="flex xl:hidden flex-col gap-2">
          {transactionsLoading ? (
            <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50">
              <div className="flex items-center justify-center pt-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              </div>
              <div className="flex flex-col text-center pb-2">
                <span className="text-base sm:text-lg font-semibold">
                  Loading...
                </span>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50">
              <div className="flex items-center justify-center pt-2">
                <div className="flex items-center justify-center p-4 bg-gray-200 rounded-full">
                  <ArchiveX className="size-7 sm:size-8" />
                </div>
              </div>

              <div className="flex flex-col text-center pb-2">
                <span className="text-base sm:text-lg font-semibold">
                  No Transactions
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  There are no transactions made.
                </span>
              </div>
            </div>
          ) : (
            transactions.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTransaction(t)}
                className="rounded-2xl border border-gray-300 p-5 sm:p-5 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 cursor-pointer"
              >
                <div className="flex flex-1 flex-col text-start">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-gray-500 text-xs sm:text-sm">
                    RFID No. {t.rfid}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-1 text-green-500 font-semibold text-base sm:text-lg">
                    <Plus className="size-5 sm:size-6" />P{t.amount}.00
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* desktop */}
        <div className="hidden xl:flex rounded-2xl overflow-hidden  w-full">
          {transactionsLoading ? (
            <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 w-full">
              <div className="flex items-center justify-center pt-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              </div>
              <div className="flex flex-col text-center pb-2">
                <span className="text-base sm:text-lg font-semibold">
                  Loading...
                </span>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 w-full">
              <div className="flex items-center justify-center pt-2">
                <div className="flex items-center justify-center p-4 bg-gray-200 rounded-full">
                  <ArchiveX className="size-7 sm:size-8" />
                </div>
              </div>

              <div className="flex flex-col text-center pb-2">
                <span className="text-base sm:text-lg font-semibold">
                  No Transactions
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  There are no transactions made.
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-gray-300 w-full">
              <table className="w-full text-sm text-left rtl:text-right text-body">
                <thead className="border-b border-gray-300 bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">RFID No.</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Date and Time</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-gray-300">
                      <td className="px-6 py-4">{t.name}</td>
                      <td className="px-6 py-4">{t.rfid}</td>
                      <td className="px-6 py-4">
                        <span className="text-green-500">P{t.amount}.00</span>
                      </td>
                      <td className="px-6 py-4">
                        {t.datetime instanceof Date ? formatDateTime(t.datetime) : t.datetime?.toLocaleString() || ""}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedTransaction(t)}
                          className="rounded-lg px-4 py-1 bg-green-500 text-white text-xs cursor-pointer transition-colors duration-150 hover:bg-green-500/90 active:bg-green-600"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* search user name or RFID */}
      {searchModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-4 sm:gap-5 mt-2 mb-2">
            {/* close */}
            <button
              onClick={handleSearchModal}
              className="p-2 cursor-pointer rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 text-gray-500 absolute top-2 sm:top-3 right-2 sm:right-3"
            >
              <X className="size-4 sm:size-5" />
            </button>

            {/* content */}
            <div className="flex flex-col items-center justify-center gap-4 pt-2 ">
              <div className="rounded-full p-3 bg-gray-200 shadow-gray-600">
                <UserSearch className="size-6 sm:size-7" />
              </div>
              <div className="flex flex-col text-center">
                <span className="text-base sm:text-lg font-semibold">
                  Search User
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  Enter user's name or RFID No.
                </span>
              </div>
            </div>

            <form action="" className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm">Name or RFID No.</label>
                <input
                  type="text"
                  className={fieldClass(false)}
                  placeholder="Enter name or RFID No."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {/* results */}
              <div className="flex flex-col gap-1 pb-2">
                <span className="text-xs sm:text-sm text-gray-500 font-semibold">
                  List of Users
                </span>

                {searchLoading ? (
                  <div className="flex flex-col gap-4 items-center justify-center p-4 border border-dashed border-gray-300 bg-gray-100 rounded-lg">
                    <div className="flex items-center justify-center pt-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                    </div>
                    <div className="flex flex-col text-center pb-2">
                      <span className="font-semibold">Searching...</span>
                    </div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col gap-4 items-center justify-center p-4 border border-dashed border-gray-300 bg-gray-100 rounded-lg">
                    <div className="flex items-center justify-center pt-2">
                      <div className="flex items-center justify-center p-3 rounded-full bg-gray-300">
                        <UserX className="size-5 sm:size-6" />
                      </div>
                    </div>

                    <div className="flex flex-col text-center pb-2">
                      <span className="font-semibold">No User Found</span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {query.trim() ? "No user found matching your search." : "Enter a name or RFID to search."}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className="px-6 py-4 rounded-lg border border-gray-300 hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition-colors duration-150 flex flex-col text-start"
                      >
                        <span className="text-sm sm:text-base font-semibold">
                          {u.name}
                        </span>
                        <span className="text-gray-500 text-xs sm:text-sm">
                          RFID No. {u.rfid}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-4 sm:gap-5 mt-2 mb-2">
            {/* Close */}
            <button
              onClick={() => setSelectedTransaction(null)}
              className="p-2 cursor-pointer rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 text-gray-500 absolute top-2 sm:top-3 right-2 sm:right-3"
            >
              <X className="size-4 sm:size-5" />
            </button>

            {/* Icon + Title */}
            <div className="flex flex-col items-center justify-center gap-4 pt-2">
              <div className="rounded-full p-3 bg-green-500 shadow-green-600 text-white">
                <ReceiptText className="size-6 sm:size-7" />
              </div>
              <div className="flex flex-col text-center">
                <span className="text-base sm:text-lg font-semibold text-green-500">
                  Transaction Details
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  {selectedTransaction.datetime instanceof Date ? formatDateTime(selectedTransaction.datetime) : selectedTransaction.datetime?.toLocaleString() || ""}
                </span>
              </div>
            </div>

            {/* Name, RFID, Transaction ID */}
            <div className="flex items-center pt-2">
              <div className="flex flex-1 flex-col text-start">
                <span className="text-xs sm:text-sm font-semibold">
                  {selectedTransaction.name}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">
                  RFID No. {selectedTransaction.rfid}
                </span>
              </div>

              <div className="flex flex-1 flex-col text-end">
                <span className="text-xs sm:text-sm text-gray-500">
                  Transaction ID
                </span>
                <span className="font-semibold text-xs sm:text-sm">
                  {selectedTransaction.documentId ? formatTransactionId(selectedTransaction.documentId) : selectedTransaction.id}
                </span>
              </div>
            </div>

            {/* Amount + Payment Info */}
            <div className="flex flex-col gap-4 pb-2">
              <div className="flex flex-col gap-1 items-center justify-center py-4">
                <div className="text-xl sm:text-2xl font-semibold flex items-center gap-2 text-green-500">
                  <Plus className="size-4 sm:size-5" />P
                  {selectedTransaction.amount}.00
                </div>
                <span className="text-gray-500 text-xs sm:text-sm">
                  Amount Top-up
                </span>
              </div>

              <div className="flex items-center p-4 rounded-lg bg-gray-100">
                <div className="flex flex-1 flex-col text-xs sm:text-sm text-start">
                  <span className="text-gray-500">Payment method</span>
                  <span className="font-semibold">
                    {selectedTransaction.method}
                  </span>
                </div>

                <div className="flex flex-1 flex-col text-xs sm:text-sm text-end">
                  <span className="text-gray-500">Reference number</span>
                  <span className="font-semibold">
                    {selectedTransaction.reference}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* manual top-up success modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-4 sm:gap-5 mt-2 mb-2">
            <div className="flex flex-col items-center justify-center gap-4 py-2 ">
              <div className="rounded-full p-3 bg-green-500 shadow-green-600 text-white">
                <CircleCheckBig className="size-6 sm:size-7" />
              </div>
              <div className="flex flex-col text-center">
                <span className="text-base sm:text-lg font-semibold">
                  Top-up Successful
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  Successfully added a new balance to user account
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
