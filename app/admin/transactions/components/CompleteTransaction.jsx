import { useState, useEffect, useMemo } from "react";
import {
  ArchiveX,
  BanknoteArrowUp,
  Plus,
  ReceiptText,
  X,
  ListFilter,
} from "lucide-react";
import { db } from "../../../../firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

export default function CompletedTransactions() {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [err, setErr] = useState(false);
  const [toggleFilter, setToggleFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [transactions, setTransactions] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleToggleFilter = () => {
    setToggleFilter((prev) => !prev);
  };

  // Format transaction ID
  const formatTransactionId = (documentId) => {
    if (!documentId) return "EZ-000000";
    const firstSix = documentId.substring(0, 6).toUpperCase();
    return `EZ-${firstSix}`;
  };

  // Fetch completed transactions from Firestore
  useEffect(() => {
    const fetchCompletedTransactions = async () => {
      try {
        setLoading(true);
        const allTransactions = [];

        // Fetch manual top-ups (all are approved/completed)
        try {
          const manualTopUpRef = collection(db, "manual_topup");
          let querySnapshot;
          try {
            const q = query(manualTopUpRef, orderBy("requestedAt", "desc"));
            querySnapshot = await getDocs(q);
          } catch (error) {
            console.warn("OrderBy failed for manual_topup, using simple query:", error);
            querySnapshot = await getDocs(manualTopUpRef);
          }

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const requestedAt = data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : new Date());
            
            allTransactions.push({
              id: formatTransactionId(doc.id),
              documentId: doc.id,
              type: "manual",
              name: data.userName || "",
              rfid: data.userId || "",
              amount: data.amount || 0,
              date: requestedAt.toLocaleDateString('en-US'),
              time: requestedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
              transactionId: formatTransactionId(doc.id),
              paymentMethod: data.paymentMethod || "",
              refNo: data.referenceId || "",
              status: "Completed",
              color: "bg-green-500",
              textColor: "text-green-500",
              datetime: requestedAt,
            });
          });
        } catch (error) {
          console.error("Error fetching manual top-ups:", error);
        }

        // Fetch top-up requests (approved only)
        try {
          const topUpRequestsRef = collection(db, "topup_requests");
          let querySnapshot;
          try {
            const q = query(
              topUpRequestsRef,
              where("status", "==", "approved"),
              orderBy("processedAt", "desc")
            );
            querySnapshot = await getDocs(q);
          } catch (error) {
            console.warn("OrderBy failed for topup_requests, using simple query:", error);
            const q = query(
              topUpRequestsRef,
              where("status", "==", "approved")
            );
            querySnapshot = await getDocs(q);
          }

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const processedAt = data.processedAt?.toDate ? data.processedAt.toDate() : (data.processedAt ? new Date(data.processedAt) : new Date());
            
            allTransactions.push({
              id: formatTransactionId(doc.id),
              documentId: doc.id,
              type: "topup_request",
              name: data.userName || "",
              rfid: data.userId || "",
              amount: data.amount || 0,
              date: processedAt.toLocaleDateString('en-US'),
              time: processedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
              transactionId: formatTransactionId(doc.id),
              paymentMethod: data.paymentMethod || "",
              refNo: data.referenceId || "",
              status: "Completed",
              color: "bg-green-500",
              textColor: "text-green-500",
              datetime: processedAt,
            });
          });
        } catch (error) {
          console.error("Error fetching top-up requests:", error);
        }

        // Sort transactions based on sortBy and sortOrder
        allTransactions.sort((a, b) => {
          let comparison = 0;
          
          if (sortBy === "date") {
            const dateA = a.datetime instanceof Date ? a.datetime : new Date(a.datetime);
            const dateB = b.datetime instanceof Date ? b.datetime : new Date(b.datetime);
            comparison = dateB.getTime() - dateA.getTime(); // Newest first by default
          } else if (sortBy === "amount") {
            comparison = b.amount - a.amount; // Highest first by default
          } else if (sortBy === "name") {
            comparison = a.name.localeCompare(b.name); // A-Z by default
          }
          
          return sortOrder === "desc" ? comparison : -comparison;
        });

        setTransactions(allTransactions);
      } catch (error) {
        console.error("Error fetching completed transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedTransactions();
  }, [sortBy, sortOrder]);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    if (!dateFrom && !dateTo) {
      return transactions;
    }

    return transactions.filter((t) => {
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
  }, [transactions, dateFrom, dateTo]);

  const displayedTransactions = Array.isArray(filteredTransactions) ? filteredTransactions : [];

  // ------------------------------------------------------
  // REUSABLE COMPONENTS (inside same file - no new files)
  // ------------------------------------------------------

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
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* TOTAL CARD */}
      <div className="flex relative rounded-2xl bg-linear-to-r from-green-500 via-green-400 to-green-500 p-5 text-white">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-2xl sm:text-3xl font-bold">
            {loading ? "..." : displayedTransactions.length}
          </span>

          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-medium">
              Completed Transactions
            </span>
            <span className="text-xs text-gray-100">
              As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="absolute top-3 right-3 rounded-full p-3 bg-green-600 shadow-green-600">
          <BanknoteArrowUp className="size-6" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex">
          {toggleFilter ? (
            <button
              onClick={handleToggleFilter}
              className="flex cursor-pointer w-full sm:w-auto justify-center items-center  gap-2 rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
            >
              <X className="size-4 sm:size-5" />
              Close filter
            </button>
          ) : (
            <button
              onClick={handleToggleFilter}
              className="flex cursor-pointer w-full sm:w-auto justify-center items-center  gap-2 rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
            >
              <ListFilter className="size-4 sm:size-5" />
              Filter options
            </button>
          )}
        </div>

        {toggleFilter && (
          <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 rounded-2xl bg-gray-50 border border-dashed border-gray-300">
            {/* sort by*/}
            <form className="flex flex-col gap-1 flex-1">
              <label htmlFor="" className={labelClass}>
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-3 sm:px-4 py-2 w-full border ${
                  err ? "border-red-500" : "border-gray-300"
                } outline-none bg-white rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150`}
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="name">Name</option>
              </select>
            </form>

            {/* sort order */}
            <form className="flex flex-col gap-1 flex-1">
              <label htmlFor="" className={labelClass}>
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={`px-3 sm:px-4 py-2 w-full border ${
                  err ? "border-red-500" : "border-gray-300"
                } outline-none bg-white rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150`}
              >
                <option value="desc">Newest to Oldest</option>
                <option value="asc">Oldest to Newest</option>
              </select>
            </form>
          </div>
        )}

        {toggleFilter && (
          <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 rounded-2xl bg-gray-50 border border-dashed border-gray-300">
            {/* date from */}
            <form className="flex flex-col gap-1 flex-1">
              <label htmlFor="" className={labelClass}>
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={`px-3 sm:px-4 py-2 w-full border ${
                  err ? "border-red-500" : "border-gray-300"
                } outline-none bg-white rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150`}
              />
            </form>

            {/* date to */}
            <form className="flex flex-col gap-1 flex-1">
              <label htmlFor="" className={labelClass}>
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className={`px-3 sm:px-4 py-2 w-full border ${
                  err ? "border-red-500" : "border-gray-300"
                } outline-none bg-white rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150`}
              />
            </form>
          </div>
        )}
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="flex flex-col gap-2">
        <span className="text-xs sm:text-sm font-semibold text-gray-500">
          Completed Transactions
        </span>

        {/* MOBILE */}
        <div className="flex xl:hidden flex-col gap-2">
          {loading ? (
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
          ) : displayedTransactions.length === 0 ? (
            <NoTransactions message="There are no completed transactions available." />
          ) : (
            displayedTransactions.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTransaction(t)}
                className="rounded-2xl border border-gray-300 p-5 flex items-center hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
              >
                <div className="flex flex-1 flex-col gap-4 text-start">
                  <div className="flex flex-col">
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-gray-500 text-xs">
                      RFID No. {t.rfid}
                    </span>
                  </div>

                  <div className="flex text-white">
                    <div
                      className={`text-center px-4 py-1 text-xs rounded-full ${t.color}`}
                    >
                      {t.status}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-1 text-green-500 font-semibold text-base">
                    <Plus className="size-5" />P{t.amount}.00
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* DESKTOP */}
        <div className="hidden xl:flex w-full">
          {loading ? (
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
          ) : displayedTransactions.length === 0 ? (
            <NoTransactions message="There are no completed transactions available." />
          ) : (
            <div className="rounded-2xl overflow-hidden border border-gray-300 w-full">
              <table className="w-full text-sm text-left text-body">
                <thead className="border-b border-gray-300 bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">RFID No.</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Date and Time</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-gray-300">
                      <td className="px-6 py-4">{t.name}</td>
                      <td className="px-6 py-4">{t.rfid}</td>
                      <td className="px-6 py-4 flex">
                        <div
                          className={`text-center text-xs px-4 py-1 rounded-full text-white ${t.color}`}
                        >
                          {t.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-green-500">P{t.amount}.00</td>
                      <td className="px-6 py-4">
                        {t.date} {t.time}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedTransaction(t)}
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
      </div>

      {/* -------------------------------------------------- */}
      {/* SELECTED TRANSACTION MODAL */}
      {/* -------------------------------------------------- */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-4 sm:gap-5 mt-2 mb-2">
            {/* Close */}
            <button
              onClick={() => setSelectedTransaction(null)}
              className="p-2 cursor-pointer rounded-full hover:bg-gray-50 active:bg-gray-100 text-gray-500 absolute top-2 sm:top-3 right-2 sm:right-3"
            >
              <X className="size-4 sm:size-5" />
            </button>

            {/* status */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
              <div
                className={`px-4 py-1 text-xs sm:text-sm text-white rounded-full ${selectedTransaction.color}`}
              >
                {selectedTransaction.status}
              </div>
            </div>

            {/* Icon + Title */}
            <div className="flex flex-col items-center justify-center gap-4 pt-2">
              <div
                className={`rounded-full p-3  text-white ${selectedTransaction.color}`}
              >
                <ReceiptText className="size-6 sm:size-7" />
              </div>

              <div className="flex flex-col text-center">
                <span
                  className={`text-base sm:text-lg font-semibold ${selectedTransaction.textColor}`}
                >
                  Transaction Details
                </span>

                <span className="text-gray-500 text-xs sm:text-sm">
                  {selectedTransaction.date} {selectedTransaction.time}
                </span>
              </div>
            </div>

            {/* Name + RFID + Transaction ID */}
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
                  {selectedTransaction.transactionId}
                </span>
              </div>
            </div>

            {/* Amount + Payment Info */}
            <div className="flex flex-col gap-4 pb-2">
              <div className="flex flex-col gap-1 items-center justify-center py-4">
                <div
                  className={`text-xl sm:text-2xl font-semibold flex items-center gap-2 ${selectedTransaction.textColor}`}
                >
                  <Plus className="size-4 sm:size-5" />P{" "}
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
                    {selectedTransaction.paymentMethod}
                  </span>
                </div>

                <div className="flex flex-1 flex-col text-xs sm:text-sm text-end">
                  <span className="text-gray-500">Reference number</span>
                  <span className="font-semibold">
                    {selectedTransaction.refNo}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
