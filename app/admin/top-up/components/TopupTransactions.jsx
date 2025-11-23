import { useState, useEffect, useMemo } from "react";
import { ArchiveX, BanknoteArrowUp, Plus, ReceiptText, X, ChevronDown } from "lucide-react";
import { db } from "../../../../firebase";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";

export default function TopupTransactions() {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // "all", "manual", "topup_request"
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all"); // "all", "cash", "gcash", "maya", "maribank", "gotyme"
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [transactions, setTransactions] = useState([]);
  
  // Modal states
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(true);
  const [previewImageLoading, setPreviewImageLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);


  // Fetch all transactions from Firestore (only once on mount)
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const manualTransactions = [];
        const topupRequestTransactions = [];

        // Fetch all manual top-ups separately
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
            
            manualTransactions.push({
              id: doc.id,
              documentId: doc.id,
              type: "manual",
              name: data.userName || "",
              rfid: data.userId || "",
              amount: data.amount || 0,
              date: requestedAt.toLocaleDateString('en-US'),
              time: requestedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
              transactionId: doc.id,
              paymentMethod: data.paymentMethod || "",
              refNo: data.referenceId || "",
              receiptURL: "", // Manual top-ups don't have receipt images
              status: "Completed",
              color: "bg-green-500",
              textColor: "text-green-500",
              datetime: requestedAt,
            });
          });
        } catch (error) {
          console.error("Error fetching manual top-ups:", error);
        }

        // Fetch all top-up requests (approved/rejected) separately
        try {
          const topUpRequestsRef = collection(db, "topup_requests");
          let querySnapshot;
          try {
            const q = query(
              topUpRequestsRef,
              where("status", "in", ["approved", "rejected"]),
              orderBy("processedAt", "desc")
            );
            querySnapshot = await getDocs(q);
          } catch (error) {
            console.warn("OrderBy failed for topup_requests, using simple query:", error);
            const q = query(
              topUpRequestsRef,
              where("status", "in", ["approved", "rejected"])
            );
            querySnapshot = await getDocs(q);
          }

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const processedAt = data.processedAt?.toDate ? data.processedAt.toDate() : (data.processedAt ? new Date(data.processedAt) : new Date());
            const status = data.status || "";
            
            topupRequestTransactions.push({
              id: doc.id,
              documentId: doc.id,
              type: "topup_request",
              name: data.userName || "",
              rfid: data.userId || "",
              amount: data.amount || 0,
              date: processedAt.toLocaleDateString('en-US'),
              time: processedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
              transactionId: doc.id,
              paymentMethod: data.paymentMethod || "",
              refNo: data.referenceId || "",
              receiptURL: data.receiptURL || "",
              status: status === "approved" ? "Completed" : "Rejected",
              color: status === "approved" ? "bg-green-500" : "bg-red-500",
              textColor: status === "approved" ? "text-green-500" : "text-red-500",
              datetime: processedAt,
            });
          });
        } catch (error) {
          console.error("Error fetching top-up requests:", error);
        }

        // Combine both arrays
        const allTransactions = [...manualTransactions, ...topupRequestTransactions];
        setTransactions(allTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []); // Only fetch once on mount

  // Filter and sort transactions client-side
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return [];
    }

    let filtered = [...transactions];

    // Apply type filter - ensure strict matching with explicit type checking
    if (filterType === "manual") {
      filtered = filtered.filter(t => t && t.type === "manual");
    } else if (filterType === "topup_request") {
      filtered = filtered.filter(t => t && t.type === "topup_request");
    }
    // If filterType === "all", show all transactions (no filtering)

    // Apply payment method filter - case-insensitive matching
    if (filterPaymentMethod !== "all") {
      filtered = filtered.filter(t => {
        if (!t || !t.paymentMethod) return false;
        const paymentMethod = t.paymentMethod.toLowerCase().trim();
        const filterMethod = filterPaymentMethod.toLowerCase();
        return paymentMethod === filterMethod;
      });
    }
    // If filterPaymentMethod === "all", show all transactions (no filtering)

    // Sort transactions based on sortBy and sortOrder
    const sorted = [...filtered].sort((a, b) => {
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

    return sorted;
  }, [transactions, filterType, filterPaymentMethod, sortBy, sortOrder]);

  const displayedTransactions = useMemo(() => {
    return Array.isArray(filteredTransactions) ? filteredTransactions : [];
  }, [filteredTransactions]);

  // ------------------------------------------------------
  // REUSABLE COMPONENTS
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

  // Get title text based on filter type
  const getTitleText = () => {
    switch (filterType) {
      case "manual":
        return "Manual Top-up Transactions";
      case "topup_request":
        return "Via Request Top-up Transactions";
      default:
        return "All Top-up Transactions";
    }
  };

  // Format date and time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return { date: "", time: "", fullDateTime: "" };
    
    // Handle Firestore Timestamp or Date object
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
    
    const dateOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    
    const datePart = date.toLocaleDateString('en-US', dateOptions);
    const timePart = date.toLocaleTimeString('en-US', timeOptions);
    const fullDateTime = `${datePart} ${timePart}`;
    
    return { date: datePart, time: timePart, fullDateTime };
  };

  const handleViewTransaction = (transaction) => {
    setIsClosing(false);
    setIsOpening(false);
    setSelectedTransaction(transaction);
    // Trigger opening animation on next frame
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
      setShowImagePreview(false);
      setPreviewImageUrl("");
      setIsClosing(false);
    }, 300);
  };

  const handleImageClick = (imageUrl) => {
    setPreviewImageUrl(imageUrl);
    setShowImagePreview(true);
    setPreviewImageLoading(true);
  };

  const handleCloseImagePreview = () => {
    setShowImagePreview(false);
    setPreviewImageUrl("");
    setPreviewImageLoading(true);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handlePreviewImageLoad = () => {
    setPreviewImageLoading(false);
  };

  // Reset image loading state when selectedTransaction changes
  useEffect(() => {
    if (selectedTransaction?.receiptURL) {
      setImageLoading(true);
    }
  }, [selectedTransaction]);

  const anyModalOpen = selectedTransaction !== null || showImagePreview;
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [anyModalOpen]);

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Total Card Skeleton */}
      <div className="flex relative rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 p-5 text-white animate-pulse">
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-9 sm:h-10 w-20 bg-yellow-600/50 rounded"></div>
          <div className="flex flex-col gap-0.5">
            <div className="h-4 sm:h-5 w-56 bg-yellow-600/50 rounded"></div>
            <div className="h-3 w-36 bg-yellow-600/50 rounded"></div>
          </div>
        </div>
        
        {/* Icon Skeleton - Positioned at right edge */}
        <div className="absolute top-3 right-3 rounded-full p-3 bg-yellow-600/40">
          <div className="w-6 h-6 bg-yellow-700/50 rounded-full"></div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-col gap-4">
        {/* Section Title and Filter Buttons Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
          
          {/* Filter Buttons Skeleton - Type and Payment Method on same row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter Buttons Skeleton */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse"
              ></div>
            ))}
            
            {/* Divider Skeleton */}
            <div className="h-4 w-1 bg-gray-300 mx-1"></div>
            
            {/* Payment Method Filter Buttons Skeleton */}
            {[...Array(6)].map((_, i) => (
              <div
                key={`payment-${i}`}
                className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
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
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
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
              {getTitleText()}
            </span>
            <span className="text-xs text-gray-600">
              As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="absolute top-3 right-3 rounded-full p-3 bg-yellow-500 shadow-yellow-500">
          <BanknoteArrowUp className="size-6" />
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <span className="text-xs sm:text-sm font-semibold text-gray-500 mt-2">
            All Top-up Transactions
          </span>

          {/* Filter Buttons - Type and Payment Method */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter Buttons */}
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                filterType === "all"
                  ? "bg-green-500 text-white border border-green-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("manual")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                filterType === "manual"
                  ? "bg-green-500 text-white border border-green-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setFilterType("topup_request")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                filterType === "topup_request"
                  ? "bg-green-500 text-white border border-green-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              Via Request
            </button>

            {/* Divider */}
            <span className="text-gray-400 mx-1">|</span>

            {/* Payment Method Filter Buttons */}
            <button
              onClick={() => setFilterPaymentMethod("all")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                filterPaymentMethod === "all"
                  ? "bg-blue-500 text-white border border-blue-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              All Payment
            </button>
            <button
              onClick={() => setFilterPaymentMethod("cash")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                filterPaymentMethod === "cash"
                  ? "bg-blue-500 text-white border border-blue-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              Cash
            </button>
            <button
              onClick={() => setFilterPaymentMethod("gcash")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                filterPaymentMethod === "gcash"
                  ? "bg-blue-500 text-white border border-blue-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              GCash
            </button>
            <button
              onClick={() => setFilterPaymentMethod("maya")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                filterPaymentMethod === "maya"
                  ? "bg-blue-500 text-white border border-blue-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              Maya
            </button>
            <button
              onClick={() => setFilterPaymentMethod("maribank")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                filterPaymentMethod === "maribank"
                  ? "bg-blue-500 text-white border border-blue-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              Maribank
            </button>
            <button
              onClick={() => setFilterPaymentMethod("gotyme")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                filterPaymentMethod === "gotyme"
                  ? "bg-blue-500 text-white border border-blue-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              GoTyme
            </button>
          </div>
        </div>

        {/* MOBILE */}
        <div className="flex xl:hidden flex-col gap-2">
          {displayedTransactions.length === 0 ? (
            <NoTransactions message="There are no top-up transactions available." />
          ) : (
            displayedTransactions.map((t) => (
              <button
                key={t.id}
                onClick={() => handleViewTransaction(t)}
                className="rounded-2xl border border-gray-300 p-5 flex items-center hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
              >
                <div className="flex flex-1 flex-col gap-4 text-start">
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs sm:text-sm">
                      {t.documentId}
                    </span>
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
          {displayedTransactions.length === 0 ? (
            <NoTransactions message="There are no top-up transactions available." />
          ) : (
            <div className="rounded-2xl overflow-hidden border border-gray-300 w-full">
              <table className="w-full text-sm text-left text-body">
                <thead className="border-b border-gray-300 bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Transaction ID</th>
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
                      <td className="px-6 py-4">{t.documentId}</td>
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
                : "translate-y-[20px] opacity-0 scale-[0.95]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON - Top Middle */}
            <button
              onClick={closeModal}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD - Dynamic based on status */}
            <div className={`flex relative rounded-t-2xl p-4 sm:p-5 text-white ${
              selectedTransaction?.status?.toLowerCase() === "completed" || selectedTransaction?.status?.toLowerCase() === "approved"
                ? "bg-linear-to-r from-green-500 via-green-400 to-green-500"
                : selectedTransaction?.status?.toLowerCase() === "rejected"
                ? "bg-linear-to-r from-red-500 via-red-400 to-red-500"
                : "bg-linear-to-r from-yellow-500 via-yellow-400 to-yellow-500"
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
                    {selectedTransaction.date} {selectedTransaction.time || ""}
                  </span>
                </div>
              </div>
              <div className={`absolute top-3 right-3 rounded-full p-2.5 sm:p-3 shadow-600/40 ${
                selectedTransaction?.status?.toLowerCase() === "completed" || selectedTransaction?.status?.toLowerCase() === "approved"
                  ? "bg-green-600/40 shadow-green-600/40"
                  : selectedTransaction?.status?.toLowerCase() === "rejected"
                  ? "bg-red-600/40 shadow-red-600/40"
                  : "bg-yellow-600/40 shadow-yellow-600/40"
              }`}>
                <BanknoteArrowUp className="size-5 sm:size-6" />
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              {/* Amount Card */}
              <div className="flex flex-col gap-3 p-4 rounded-lg border border-gray-300 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs sm:text-sm text-gray-500">Amount</span>
                    <span className="font-semibold text-base text-green-600">
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
                      Payment Method
                    </span>
                    <span className="font-semibold text-xs sm:text-sm">
                      {selectedTransaction.paymentMethod}
                    </span>
                  </div>

                  <div className="col-span-2 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs mb-0.5">
                      Reference Number
                    </span>
                    <span className="font-semibold text-xs sm:text-sm break-all">
                      {selectedTransaction.refNo}
                    </span>
                  </div>

                  {/* Proof of payment - Only show for topup_request type */}
                  {selectedTransaction.type === "topup_request" && selectedTransaction.receiptURL && (
                    <div className="col-span-2 flex flex-col rounded-lg gap-2">
                      <span className="text-gray-500 text-xs sm:text-sm">
                        Proof of payment
                      </span>
                      <div 
                        className="border border-gray-300 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:border-green-500 transition-colors duration-150 relative"
                        onClick={() => handleImageClick(selectedTransaction.receiptURL)}
                      >
                        {imageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                            <div className="w-full h-full bg-gray-200"></div>
                          </div>
                        )}
                        <img
                          src={selectedTransaction.receiptURL}
                          alt="Receipt"
                          className={`w-full h-64 sm:h-72 object-contain ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                          onLoad={handleImageLoad}
                          onError={() => setImageLoading(false)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && previewImageUrl && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 sm:p-5 z-[60] overflow-y-auto"
          onClick={handleCloseImagePreview}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={handleCloseImagePreview}
              className="absolute top-4 right-4 p-2 cursor-pointer rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors duration-150 text-white z-10"
            >
              <X className="size-6 sm:size-7" />
            </button>
            
            {/* Image */}
            <div 
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {previewImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 animate-pulse">
                  <div className="w-64 h-64 bg-gray-700 rounded-lg"></div>
                </div>
              )}
              <img
                src={previewImageUrl}
                alt="Receipt Preview"
                className={`max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl ${previewImageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                onLoad={handlePreviewImageLoad}
                onError={() => setPreviewImageLoading(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

