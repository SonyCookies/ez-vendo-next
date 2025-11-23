import { useState, useEffect, useMemo } from "react";
import { ArchiveX, BanknoteArrowUp, Minus, Plus, ReceiptText, ChevronDown, CheckCircle2, XCircle, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { db } from "../../../../firebase";
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc, increment, setDoc } from "firebase/firestore";

export default function AllTransactions({ packageFilter = "all" }) {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // "all", "Deducted", etc.
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [transactions, setTransactions] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Success/Error Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Format date and time to "11/23/2025 02:18:16 PM" format
  const formatDateTime = (timestamp) => {
    if (!timestamp) return { date: "", time: "", fullDateTime: "" };
    
    let date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) {
      return { date: "", time: "", fullDateTime: "" };
    }
    
    // Format: MM/DD/YYYY HH:MM:SS AM/PM
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const formattedHours = String(displayHours).padStart(2, '0');
    
    const datePart = `${month}/${day}/${year}`;
    const timePart = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
    const fullDateTime = `${datePart} ${timePart}`;
    
    return { date: datePart, time: timePart, fullDateTime };
  };

  // Fetch transactions from Firestore
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const transactionsRef = collection(db, "transactions");
        
        let querySnapshot;
        try {
          const q = query(transactionsRef, orderBy("timestamp", "desc"));
          querySnapshot = await getDocs(q);
        } catch (error) {
          console.warn("OrderBy failed for transactions, using simple query:", error);
          querySnapshot = await getDocs(transactionsRef);
        }

        const allTransactions = [];
        const userCache = {}; // Cache user data to avoid repeated fetches

        // Process transactions
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp ? new Date(data.timestamp) : new Date());
          const userId = data.userId || "";
          
          // Get user name from cache or fetch
          let userName = "Unknown User";
          if (userId) {
            if (userCache[userId]) {
              userName = userCache[userId];
            } else {
              try {
                const userDocRef = doc(db, "users", userId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                  const userData = userDocSnap.data();
                  userName = userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown User";
                  userCache[userId] = userName;
                }
              } catch (error) {
                console.error("Error fetching user:", error);
              }
            }
          }

          const { date, time, fullDateTime } = formatDateTime(timestamp);
          
          allTransactions.push({
            id: docSnap.id,
            documentId: docSnap.id,
            name: userName,
            rfid: userId,
            amount: data.amount || 0,
            description: data.description || "",
            minutesPurchased: data.minutesPurchased || 0,
            type: (data.type || "").trim(),
            date,
            time,
            fullDateTime,
            datetime: timestamp,
            refunded: data.refunded || false,
            refundedTransactionId: data.refundedTransactionId || null,
          });
        }

        // Sort transactions
        allTransactions.sort((a, b) => {
          let comparison = 0;
          
          if (sortBy === "date") {
            const dateA = a.datetime instanceof Date ? a.datetime : new Date(a.datetime);
            const dateB = b.datetime instanceof Date ? b.datetime : new Date(b.datetime);
            comparison = dateB.getTime() - dateA.getTime();
          } else if (sortBy === "amount") {
            comparison = b.amount - a.amount;
          } else if (sortBy === "name") {
            comparison = a.name.localeCompare(b.name);
          }
          
          return sortOrder === "desc" ? comparison : -comparison;
        });

        setTransactions(allTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [sortBy, sortOrder]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const effectiveQuery =
    searchQuery.trim().length < 3
      ? searchQuery.trim().toLowerCase()
      : debouncedQuery.trim().toLowerCase();

  // Filter transactions by type, package, date range, and search
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply package filter - filter by document ID prefix (PACK1, PACK2, PACK3, PACK4) or refund
    if (packageFilter !== "all") {
      filtered = filtered.filter(t => {
        const documentId = (t.documentId || "").toUpperCase();
        const transactionType = (t.type || "").trim();
        
        // Handle refund filter
        if (packageFilter === "refund") {
          return documentId.startsWith("REFUND") || transactionType === "Refund";
        }
        
        // Map "Package 1" -> "PACK1", "Package 2" -> "PACK2", etc.
        if (packageFilter === "Package 1") {
          return documentId.startsWith("PACK1");
        } else if (packageFilter === "Package 2") {
          return documentId.startsWith("PACK2");
        } else if (packageFilter === "Package 3") {
          return documentId.startsWith("PACK3");
        } else if (packageFilter === "Package 4") {
          return documentId.startsWith("PACK4");
        }
        return false;
      });
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((t) => {
        const transactionDate = t.datetime instanceof Date ? t.datetime : new Date(t.datetime);
        transactionDate.setHours(0, 0, 0, 0);
        
        let fromDate = null;
        let toDate = null;
        
        if (dateFrom) {
          fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
        }
        
        if (dateTo) {
          toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
        }
        
        if (fromDate && toDate) {
          return transactionDate >= fromDate && transactionDate <= toDate;
        } else if (fromDate) {
          return transactionDate >= fromDate;
        } else if (toDate) {
          return transactionDate <= toDate;
        }
        
        return true;
      });
    }

    // Apply search filter
    if (effectiveQuery) {
      // Split by comma and trim each query
      const queries = effectiveQuery.split(',').map(q => q.trim()).filter(q => q.length > 0);
      
      filtered = filtered.filter((t) => {
        // Check if transaction matches any of the comma-separated queries
        return queries.some((q) => {
          const queryLower = q.toLowerCase();
          return (
            (t.documentId || "").toLowerCase().includes(queryLower) ||
            (t.name || "").toLowerCase().includes(queryLower) ||
            (t.rfid || "").toLowerCase().includes(queryLower) ||
            (t.description || "").toLowerCase().includes(queryLower) ||
            (t.type || "").toLowerCase().includes(queryLower)
          );
        });
      });
    }

    return filtered;
  }, [transactions, filterType, dateFrom, dateTo, packageFilter, effectiveQuery]);

  // Pagination logic
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / itemsPerPage)
  );

  // Ensure currentPage in range when search cleared/filtered length changes
  useEffect(() => {
    if (effectiveQuery.length > 0) {
      setCurrentPage(1);
    } else {
      if (currentPage > totalPages) setCurrentPage(1);
    }
  }, [effectiveQuery, totalPages, currentPage]);

  const isSearching = effectiveQuery.length > 0;

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const displayedTransactions = isSearching ? filteredTransactions : paginatedTransactions;

  // Handle page number click
  const handlePageClick = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages && pageNum <= 5) {
      setCurrentPage(pageNum);
    }
  };

  // Generate visible page numbers (limited to 5)
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    const maxPageToShow = Math.min(totalPages, maxVisible);
    
    for (let i = 1; i <= maxPageToShow; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // Get unique transaction types for filter
  const transactionTypes = useMemo(() => {
    const types = new Set();
    transactions.forEach(t => {
      if (t.type) types.add(t.type);
    });
    return Array.from(types).sort();
  }, [transactions]);

  const handleViewTransaction = (transaction) => {
    setIsClosing(false);
    setIsOpening(false);
    setSelectedTransaction(transaction);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsOpening(true);
      });
    });
  };

  const closeModal = () => {
    if (isClosing) return;
    setIsOpening(false);
    setIsClosing(true);
    setTimeout(() => {
      setSelectedTransaction(null);
      setIsClosing(false);
    }, 300);
  };

  // Find refund transaction ID for a given transaction
  const findRefundTransactionId = (transactionDocumentId) => {
    const refundTransaction = transactions.find(
      (t) => t.refundedTransactionId === transactionDocumentId
    );
    return refundTransaction ? refundTransaction.documentId : null;
  };

  // Handle viewing refund transaction
  const handleViewRefundTransaction = (transactionDocumentId) => {
    const refundTransactionId = findRefundTransactionId(transactionDocumentId);
    if (refundTransactionId) {
      setSearchQuery(refundTransactionId);
      setDebouncedQuery(refundTransactionId);
      closeModal();
    }
  };

  // Handle refund
  const handleRefund = async () => {
    if (!selectedTransaction || processing) return;

    try {
      setProcessing(true);
      
      // Find user by RFID card ID (userId in transaction)
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("rfidCardId", "==", selectedTransaction.rfid));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        setProcessing(false);
        setModalMessage("User not found. Cannot process refund.");
        setShowErrorModal(true);
        return;
      }

      const userDoc = userSnapshot.docs[0];

      // Refund the amount to user balance using increment for atomic operation
      const userRef = doc(db, "users", userDoc.id);
      await updateDoc(userRef, {
        balance: increment(selectedTransaction.amount),
      });

      // If transaction has minutes purchased, create a deduction transaction to "take back" the minutes
      if (selectedTransaction.minutesPurchased > 0) {
        // Extract the 6 alphanumeric characters from the original transaction ID
        // Format: PACK1-XXXXXX or PACK2-XXXXXX -> extract XXXXXX
        const originalId = selectedTransaction.documentId || "";
        let alphanumeric = "";
        
        // Check if the ID contains a dash and extract the part after it
        if (originalId.includes("-")) {
          const parts = originalId.split("-");
          if (parts.length > 1) {
            // Take the last part (should be the 6 alphanumeric characters)
            alphanumeric = parts[parts.length - 1].substring(0, 6).toUpperCase();
          }
        } else {
          // If no dash, take the last 6 characters
          alphanumeric = originalId.substring(originalId.length - 6).toUpperCase();
        }
        
        // If we couldn't extract 6 characters, generate random ones as fallback
        if (alphanumeric.length !== 6) {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          alphanumeric = '';
          for (let i = 0; i < 6; i++) {
            alphanumeric += chars.charAt(Math.floor(Math.random() * chars.length));
          }
        }
        
        const refundDocumentId = `REFUND-${alphanumeric}`;
        
        const transactionRef = doc(db, "transactions", refundDocumentId);
        await setDoc(transactionRef, {
          userId: selectedTransaction.rfid,
          amount: Number(selectedTransaction.amount) || 0, // Ensure it's a number
          type: "Refund",
          description: `Refunded ${selectedTransaction.minutesPurchased} minute(s) from transaction ${selectedTransaction.documentId}`,
          minutesPurchased: -selectedTransaction.minutesPurchased, // Negative to deduct
          timestamp: new Date(),
          refundedTransactionId: selectedTransaction.documentId,
        });

        // Recalculate total time from all transactions and update sessionEndTime
        const allTransactionsQuery = query(
          collection(db, "transactions"),
          where("userId", "==", selectedTransaction.rfid),
          orderBy("timestamp", "desc")
        );
        const allTransactionsSnapshot = await getDocs(allTransactionsQuery);
        
        let totalMinutes = 0;
        allTransactionsSnapshot.forEach((txDoc) => {
          const txData = txDoc.data();
          if (txData.minutesPurchased) {
            totalMinutes += Number(txData.minutesPurchased) || 0;
          }
        });
        
        // Calculate new session end time based on total minutes
        const now = Date.now();
        const totalSeconds = totalMinutes * 60;
        const newSessionEndTime = totalSeconds > 0 ? now + (totalSeconds * 1000) : null;
        
        // Update user's sessionEndTime
        await updateDoc(userRef, {
          sessionEndTime: newSessionEndTime,
        });
      }

      // Update transaction to mark as refunded (add refunded field)
      const transactionRef = doc(db, "transactions", selectedTransaction.documentId);
      await updateDoc(transactionRef, {
        refunded: true,
        refundedAt: new Date(),
      });

      // Show success modal and refresh data
      const refundMessage = selectedTransaction.minutesPurchased > 0
        ? `Refund of ₱${selectedTransaction.amount.toFixed(2)} and ${selectedTransaction.minutesPurchased} minute(s) has been successfully processed.`
        : `Refund of ₱${selectedTransaction.amount.toFixed(2)} has been successfully processed.`;
      setModalMessage(refundMessage);
      setShowSuccessModal(true);
      
      // Refresh transactions
      const transactionsRef = collection(db, "transactions");
      let querySnapshot;
      try {
        const q = query(transactionsRef, orderBy("timestamp", "desc"));
        querySnapshot = await getDocs(q);
      } catch (error) {
        console.warn("OrderBy failed for transactions, using simple query:", error);
        querySnapshot = await getDocs(transactionsRef);
      }

      const allTransactions = [];
      const userCache = {};

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp ? new Date(data.timestamp) : new Date());
        const userId = data.userId || "";
        
        let userName = "Unknown User";
        if (userId) {
          if (userCache[userId]) {
            userName = userCache[userId];
          } else {
            try {
              const userDocRef = doc(db, "users", userId);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                userName = userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown User";
                userCache[userId] = userName;
              }
            } catch (error) {
              console.error("Error fetching user:", error);
            }
          }
        }

        const { date, time, fullDateTime } = formatDateTime(timestamp);
        
        allTransactions.push({
          id: docSnap.id,
          documentId: docSnap.id,
          name: userName,
          rfid: userId,
          amount: data.amount || 0,
          description: data.description || "",
          minutesPurchased: data.minutesPurchased || 0,
          type: (data.type || "").trim(),
          date,
          time,
          fullDateTime,
          datetime: timestamp,
          refunded: data.refunded || false,
          refundedTransactionId: data.refundedTransactionId || null,
        });
      }

      allTransactions.sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === "date") {
          const dateA = a.datetime instanceof Date ? a.datetime : new Date(a.datetime);
          const dateB = b.datetime instanceof Date ? b.datetime : new Date(b.datetime);
          comparison = dateB.getTime() - dateA.getTime();
        } else if (sortBy === "amount") {
          comparison = b.amount - a.amount;
        } else if (sortBy === "name") {
          comparison = a.name.localeCompare(b.name);
        }
        
        return sortOrder === "desc" ? comparison : -comparison;
      });

      setTransactions(allTransactions);
      setProcessing(false);
    } catch (error) {
      console.error("Error processing refund:", error);
      setProcessing(false);
      setModalMessage("Failed to process refund. Please try again.");
      setShowErrorModal(true);
    }
  };

  const anyModalOpen = selectedTransaction !== null;
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [anyModalOpen]);

  // ------------------------------------------------------
  // REUSABLE COMPONENTS
  // ------------------------------------------------------

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Total Card Skeleton */}
      <div className="flex relative rounded-2xl overflow-hidden bg-linear-to-r from-yellow-400 via-yellow-300 to-yellow-400 p-5 text-white animate-pulse">
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-9 sm:h-10 w-20 bg-yellow-600/50 rounded"></div>
          <div className="flex flex-col gap-0.5">
            <div className="h-4 sm:h-5 w-56 bg-yellow-600/50 rounded"></div>
            <div className="h-3 w-36 bg-yellow-600/50 rounded"></div>
          </div>
        </div>
        
        {/* Icon Skeleton - Positioned at right edge, vertically centered */}
        <div className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-3 bg-yellow-600/40">
          <div className="w-6 h-6 bg-yellow-700/50 rounded-full"></div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-col gap-4">
        {/* Search Bar Skeleton */}
        <div className="flex flex-col gap-1 w-full">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Mobile View Skeleton */}
        <div className="flex xl:hidden flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-gray-300 flex items-center animate-pulse"
            >
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-36 bg-gray-200 rounded"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-40 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Desktop Table Skeleton */}
        <div className="hidden xl:flex rounded-2xl overflow-hidden border border-gray-300 w-full">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-gray-300 bg-gray-100">
              <tr>
                {[...Array(7)].map((_, i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => (
                <tr key={i} className="border-b border-gray-300">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const NoTransactions = ({ message }) => (
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
        <span className="text-gray-500 text-xs sm:text-sm">{message}</span>
      </div>
    </div>
  );

  // styling helpers
  const fieldClass = (err) =>
    `px-3 sm:px-4 py-2 w-full border ${
      err ? "border-red-500" : "border-gray-300"
    } outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150`;

  const labelClass = "text-xs sm:text-sm text-gray-500";

  // ------------------------------------------------------
  // MAIN RETURN
  // ------------------------------------------------------

  return (
    <div className="flex flex-col xl:flex-1 gap-4 relative">
      {/* Skeleton Loader with fade transition */}
      <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${
        loading ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        <SkeletonLoader />
      </div>
      
      {/* Content with fade transition */}
      <div className={`transition-opacity duration-500 ${
        loading ? "opacity-0" : "opacity-100"
      }`}>
      {/* TOTAL CARD */}
      <div className="flex relative rounded-2xl bg-linear-to-r from-yellow-400 via-yellow-300 to-yellow-400 p-5 ">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-2xl sm:text-3xl font-bold">
            {loading ? "..." : displayedTransactions.length}
          </span>

          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-medium">
              {packageFilter === "all" 
                ? "All Transactions"
                : packageFilter === "Package 1"
                ? "Package 1 Transactions"
                : packageFilter === "Package 2"
                ? "Package 2 Transactions"
                : packageFilter === "Package 3"
                ? "Package 3 Transactions"
                : packageFilter === "Package 4"
                ? "Package 4 Transactions"
                : packageFilter === "refund"
                ? "Refund Transactions"
                : "All Transactions"}
            </span>
            <span className="text-xs text-gray-600">
              As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-3 bg-yellow-500 shadow-yellow-500">
          <ReceiptText className="size-6" />
        </div>
      </div>

      {/* SEARCH BAR */}
      <form className="flex">
        <div className="flex flex-col gap-1 w-full">
          <label className="text-xs sm:text-sm font-semibold text-gray-500 mt-4">
            Search transactions
          </label>

          <div className="relative">
            <input
              type="text"
              placeholder="Supports comma-separated search."
              className={`px-3 sm:px-4 py-3 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 ${
                searchQuery.length > 0 ? "pe-20 sm:pe-21" : ""
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedQuery("");
                }}
                className="absolute px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-100/90 active:bg-gray-200 cursor-pointer transition-colors duration-150 top-2.5 right-2 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </form>

      {/* TRANSACTIONS TABLE */}
      <div className="flex flex-col gap-2">
        <span className="text-xs sm:text-sm font-semibold text-gray-500 mt-2">
          All Transactions
        </span>

        {/* MOBILE */}
        <div className="flex xl:hidden flex-col gap-3">
          {displayedTransactions.length === 0 ? (
            <NoTransactions message="There are no transactions available." />
          ) : (
            displayedTransactions.map((t) => (
              <button
                key={t.id}
                onClick={() => handleViewTransaction(t)}
                className="p-5 cursor-pointer rounded-2xl border border-gray-300 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
              >
                <div className="flex flex-1 text-left flex-col gap-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs sm:text-sm">
                      {t.documentId}
                    </span>
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      RFID No: {t.rfid}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className={`flex items-center gap-1 font-semibold text-base sm:text-lg ${
                    t.type === "Refund" ? "text-green-500" : "text-red-500"
                  }`}>
                    {t.type === "Refund" ? <Plus className="size-5 sm:size-6" /> : <Minus className="size-5 sm:size-6" />}
                    ₱{t.amount.toFixed(2)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* DESKTOP */}
        <div className="hidden xl:flex w-full">
          {displayedTransactions.length === 0 ? (
            <NoTransactions message="There are no transactions available." />
          ) : (
            <div className="rounded-2xl overflow-x-auto border border-gray-300 w-full">
              <table className="w-full text-sm text-left text-body">
                <thead className="border-b border-gray-300 bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Transaction ID</th>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">RFID No.</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Date and Time</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-gray-300">
                      <td className="px-6 py-4">{t.documentId}</td>
                      <td className="px-6 py-4">{t.name}</td>
                      <td className="px-6 py-4">{t.rfid}</td>
                      <td className={`px-6 py-4 ${
                        t.type === "Refund" ? "text-green-500" : "text-red-500"
                      }`}>
                        <div className="flex items-center gap-1">
                          {t.type === "Refund" ? <Plus className="size-4" /> : <Minus className="size-4" />}
                          <span>₱{t.amount.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-block text-xs px-2 py-0.5 rounded-full text-white ${
                          t.type === "Refund" ? "bg-green-500" : "bg-red-500"
                        }`}>
                          {t.type?.trim() || t.type}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {t.fullDateTime}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewTransaction(t)}
                          className="rounded-lg px-4 py-1 bg-green-500 text-white text-xs hover:bg-green-500/90 active:bg-green-600 cursor-pointer"
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

        {/* Pagination */}
        {!isSearching && (
          <div className="flex items-center justify-center lg:justify-end">
            <div className="inline-flex text-xs items-center gap-1">
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                className="rounded-tl-2xl rounded-bl-2xl border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="size-4" />
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center border-t border-b border-gray-300">
                {getVisiblePages().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={`px-3 py-2 border-x border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 ${
                      currentPage === page
                        ? "bg-green-500 text-white hover:bg-green-600 font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (currentPage < totalPages && currentPage < 5) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
                className="rounded-tr-2xl rounded-br-2xl border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
                disabled={currentPage >= totalPages || currentPage >= 5}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* SELECTED TRANSACTION MODAL */}
      {/* -------------------------------------------------- */}
      {selectedTransaction && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
            isClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeModal}
        >
          <div 
            className={`rounded-2xl relative bg-white w-full max-w-5xl flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
              isClosing 
                ? "translate-y-[150vh] opacity-0 scale-95" 
                : isOpening
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-5 opacity-0 scale-[0.95]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON - Top Middle */}
            <button
              onClick={closeModal}
              className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD */}
            <div className={`flex relative rounded-t-2xl p-4 sm:p-5 text-white ${
              selectedTransaction.type === "Refund" 
                ? "bg-linear-to-r from-green-500 via-green-400 to-green-500" 
                : "bg-linear-to-r from-red-500 via-red-400 to-red-500"
            }`}>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold">
                  {selectedTransaction.name}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    RFID No. {selectedTransaction.rfid}
                  </span>
                  <span className="text-xs text-gray-100">
                    {selectedTransaction.fullDateTime || `${selectedTransaction.date} ${selectedTransaction.time || ""}`}
                  </span>
                </div>
              </div>
              <div className={`absolute top-3 right-3 rounded-full p-2.5 sm:p-3 ${
                selectedTransaction.type === "Refund" 
                  ? "bg-green-600/40 shadow-green-600/40" 
                  : "bg-red-600/40 shadow-red-600/40"
              }`}>
                <ReceiptText className="size-5 sm:size-6" />
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              {/* Amount Card */}
              <div className="flex flex-col gap-3 p-4 rounded-lg border border-gray-300 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs sm:text-sm text-gray-500">Amount</span>
                    <span className={`font-semibold text-base ${
                      selectedTransaction.type === "Refund" ? "text-green-600" : "text-red-600"
                    }`}>
                      ₱{selectedTransaction.amount?.toLocaleString() || selectedTransaction.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="flex flex-col gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-500">
                  Transaction Details
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-1 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs mb-0.5">
                      Transaction ID
                    </span>
                    <span className="font-semibold text-xs sm:text-sm">
                      {selectedTransaction.documentId}
                    </span>
                  </div>

                  <div className="col-span-1 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs mb-0.5">
                      Type
                    </span>
                    <span className="font-semibold text-xs sm:text-sm">
                      {selectedTransaction.type?.trim() || selectedTransaction.type}
                    </span>
                  </div>

                  <div className="col-span-2 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs mb-0.5">
                      Description
                    </span>
                    <span className="font-semibold text-xs sm:text-sm">
                      {selectedTransaction.description}
                    </span>
                  </div>

                  {selectedTransaction.minutesPurchased > 0 && (
                    <div className="col-span-2 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Minutes Purchased
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {selectedTransaction.minutesPurchased} {selectedTransaction.minutesPurchased === 1 ? "minute" : "minutes"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Refund Button */}
              {!selectedTransaction.refunded && selectedTransaction.type !== "Refund" && (
                <div className="flex gap-2 items-center justify-end w-full mt-2">
                  <button
                    onClick={handleRefund}
                    disabled={processing}
                    className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-500/90 active:bg-blue-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? "Processing..." : "Refund"}
                  </button>
                </div>
              )}

              {/* Refunded Badge */}
              {selectedTransaction.refunded && (
                <div className="flex items-center justify-center w-full mt-2">
                  <div className="flex flex-col sm:flex-row items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 border border-blue-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-blue-600" />
                      <span className="text-blue-600 text-sm font-medium">This transaction has been refunded</span>
                    </div>
                    {findRefundTransactionId(selectedTransaction.documentId) && (
                      <button
                        onClick={() => handleViewRefundTransaction(selectedTransaction.documentId)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium transition-colors duration-150"
                      >
                        <span>View refund</span>
                        <ExternalLink className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-[70] overflow-y-auto">
          <div className="rounded-2xl bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-6 mt-2 mb-2">
            <div className="flex flex-col items-center justify-center gap-4 pt-2">
              <div className="rounded-full p-3 bg-green-500 text-white">
                <CheckCircle2 className="size-6 sm:size-7" />
              </div>
              <div className="flex flex-col text-center gap-1">
                <span className="text-base sm:text-lg font-semibold text-green-500">
                  Success
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  {modalMessage}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                closeModal();
              }}
              className="rounded-lg w-full cursor-pointer px-4 py-2 border border-green-500 bg-green-500 text-white hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-[70] overflow-y-auto">
          <div className="rounded-2xl bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-6 mt-2 mb-2">
            <div className="flex flex-col items-center justify-center gap-4 pt-2">
              <div className="rounded-full p-3 bg-red-500 text-white">
                <XCircle className="size-6 sm:size-7" />
              </div>
              <div className="flex flex-col text-center gap-1">
                <span className="text-base sm:text-lg font-semibold text-red-500">
                  Error
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  {modalMessage}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowErrorModal(false)}
              className="rounded-lg w-full cursor-pointer px-4 py-2 border border-red-500 bg-red-500 text-white hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
