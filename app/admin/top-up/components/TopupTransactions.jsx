import { useState, useEffect, useMemo } from "react";
import { ArchiveX, BanknoteArrowUp, Plus, ReceiptText, X, ChevronDown, Radio, Search, CircleCheckBig, CircleAlert } from "lucide-react";
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
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // NFC Reading states
  const [nfcModal, setNfcModal] = useState(false);
  const [isNfcClosing, setIsNfcClosing] = useState(false);
  const [isNfcOpening, setIsNfcOpening] = useState(false);
  const [isReadingNfc, setIsReadingNfc] = useState(false);
  const [nfcResult, setNfcResult] = useState(null); // "success" or "error"
  const [nfcMessage, setNfcMessage] = useState("");
  const [showNfcResult, setShowNfcResult] = useState(false);
  
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

  // DEBOUNCE LOGIC
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery]);

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

    // Apply search filter
    if (debouncedQuery.trim()) {
      const queryLower = debouncedQuery.trim().toLowerCase();
      filtered = filtered.filter(t => {
        if (!t) return false;
        return (
          t.name?.toLowerCase().includes(queryLower) ||
          t.rfid?.toLowerCase().includes(queryLower) ||
          t.documentId?.toLowerCase().includes(queryLower) ||
          t.paymentMethod?.toLowerCase().includes(queryLower) ||
          t.refNo?.toLowerCase().includes(queryLower)
        );
      });
    }

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
  }, [transactions, filterType, filterPaymentMethod, sortBy, sortOrder, debouncedQuery]);

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

  const anyModalOpen = selectedTransaction !== null || showImagePreview || nfcModal;
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [anyModalOpen]);

  // NFC Modal Functions
  const openNfcModal = () => {
    setNfcModal(true);
    setIsNfcClosing(false);
    setIsNfcOpening(false);
    setIsReadingNfc(false);
    setNfcResult(null);
    setNfcMessage("");
    setShowNfcResult(false);
    
    // Trigger opening animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsNfcOpening(true);
      });
    });
  };

  const closeNfcModal = () => {
    if (isNfcClosing) return;
    setIsNfcOpening(false);
    setIsNfcClosing(true);
    setIsReadingNfc(false);
    setTimeout(() => {
      setNfcModal(false);
      setIsNfcClosing(false);
      setNfcResult(null);
      setNfcMessage("");
      setShowNfcResult(false);
    }, 300);
  };

  // Check NFC Support
  const checkNfcSupport = () => {
    // First check if we're on HTTPS or localhost (required for Web NFC)
    const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isSecure) {
      return {
        supported: false,
        message: "NFC requires a secure connection (HTTPS). You're currently accessing via HTTP. Please access this page via HTTPS (https://...) or use localhost for development."
      };
    }

    // Check if NDEFReader is available
    if (!("NDEFReader" in window)) {
      const userAgent = navigator.userAgent.toLowerCase();
      const isChrome = userAgent.includes("chrome") && !userAgent.includes("edg");
      const isEdge = userAgent.includes("edg");
      const isAndroid = userAgent.includes("android");
      
      let browserInfo = "";
      if (isChrome && isAndroid) {
        browserInfo = "Your browser may need to be updated. Please ensure you're using Chrome 89+ on Android.";
      } else if (isEdge && isAndroid) {
        browserInfo = "Your browser may need to be updated. Please ensure you're using Edge 89+ on Android.";
      } else if (isAndroid) {
        browserInfo = "Please use Chrome 89+ or Edge 89+ on Android for NFC support.";
      } else {
        browserInfo = "NFC is only available on Android devices using Chrome 89+ or Edge 89+.";
      }
      
      return {
        supported: false,
        message: `NFC is not supported in this browser. ${browserInfo}`
      };
    }

    // Check if we're on a mobile device (NFC is typically only available on mobile)
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      return {
        supported: false,
        message: "NFC reading is only available on mobile devices. Please use Chrome on Android or Edge on Android."
      };
    }

    return { supported: true };
  };

  // Start NFC Reading
  const startNfcReading = async () => {
    // Check support first
    const supportCheck = checkNfcSupport();
    if (!supportCheck.supported) {
      setNfcResult("error");
      setNfcMessage(supportCheck.message);
      setShowNfcResult(true);
      setIsReadingNfc(false);
      return;
    }

    try {
      setIsReadingNfc(true);
      const ndef = new NDEFReader();
      
      await ndef.scan();
      
      ndef.addEventListener("reading", ({ message, serialNumber }) => {
        // Clean the serial number (remove colons and convert to uppercase)
        const cleanedRfid = serialNumber.replace(/:/g, "").toUpperCase();
        
        // Set the search query with the cleaned RFID
        setSearchQuery(cleanedRfid);
        setDebouncedQuery(cleanedRfid);
        
        // Show success
        setNfcResult("success");
        setNfcMessage(`RFID read successfully: ${cleanedRfid}`);
        setShowNfcResult(true);
        setIsReadingNfc(false);
        
        // Close NFC modal after a short delay
        setTimeout(() => {
          closeNfcModal();
        }, 1500);
      });

      ndef.addEventListener("readingerror", (error) => {
        console.error("NFC reading error:", error);
        setNfcResult("error");
        setNfcMessage("Failed to read NFC tag. Please ensure the tag is close to your device and try again.");
        setShowNfcResult(true);
        setIsReadingNfc(false);
      });

    } catch (error) {
      console.error("NFC reading error:", error);
      let errorMessage = "Failed to start NFC reading.";
      
      if (error.name === "NotAllowedError" || error.name === "NotSupportedError") {
        errorMessage = "NFC permission denied or not supported. Please check your device settings and ensure NFC is enabled.";
      } else if (error.name === "SecurityError") {
        errorMessage = "NFC requires a secure connection (HTTPS). Please access this page via HTTPS.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setNfcResult("error");
      setNfcMessage(errorMessage);
      setShowNfcResult(true);
      setIsReadingNfc(false);
    }
  };

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
        
        {/* Icon Skeleton - Positioned at right edge, vertically centered */}
        <div className="absolute top-1/2 -translate-y-1/2 right-3 rounded-full p-3 bg-yellow-600/40">
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
              As of {new Date().toLocatheleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-3 rounded-full p-3 bg-yellow-500 shadow-yellow-500">
          <BanknoteArrowUp className="size-6" />
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">


          {/* SEARCH BAR */}
          <form className="flex">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between mt-3">
                <label className="text-xs sm:text-sm font-semibold text-gray-500">
                  Search transactions
                </label>
                <button
                  type="button"
                  onClick={openNfcModal}
                  className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xs sm:text-sm font-medium transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  <Radio className="size-4 sm:size-5" />
                  <span>Scan NFC</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Supports comma-separated search."
                  className="px-3 sm:px-4 py-3 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 pe-20 sm:pe-21"
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
                    className="absolute px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-100/90 active:bg-gray-200 cursor-pointer transition-colors duration-150 top-2 right-2 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </form>

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

      {/* -------------------------------------------------- */}
      {/* NFC MODAL */}
      {/* -------------------------------------------------- */}
      {nfcModal && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
            isNfcClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeNfcModal}
        >
          <div 
            className={`rounded-2xl relative bg-white w-full max-w-5xl flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
              isNfcClosing 
                ? "translate-y-[150vh] opacity-0 scale-95" 
                : isNfcOpening
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-[20px] opacity-0 scale-[0.95]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON - Top Middle */}
            <button
              onClick={closeNfcModal}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD */}
            <div className="flex relative rounded-t-2xl p-4 sm:p-5 text-white bg-gradient-to-r from-green-500 via-green-400 to-green-500">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold">
                  NFC Scanner
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    Scan RFID Tag
                  </span>
                  <span className="text-xs text-gray-100">
                    Bring your NFC tag close to your device
                  </span>
                </div>
              </div>
              <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-green-600/40 shadow-green-600/40">
                <Radio className="size-5 sm:size-6" />
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col gap-4 p-4 sm:p-5 items-center justify-center min-h-[300px]">
              {showNfcResult ? (
                /* Result Display */
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  {nfcResult === "success" ? (
                    <>
                      <div className="rounded-full p-4 bg-green-100">
                        <CircleCheckBig className="size-8 sm:size-10 text-green-600" />
                      </div>
                      <div className="flex flex-col text-center gap-2">
                        <span className="text-lg sm:text-xl font-semibold text-green-600">
                          RFID Read Successfully
                        </span>
                        <span className="text-sm sm:text-base text-gray-600">
                          {nfcMessage}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-full p-4 bg-red-100">
                        <CircleAlert className="size-8 sm:size-10 text-red-600" />
                      </div>
                      <div className="flex flex-col text-center gap-2">
                        <span className="text-lg sm:text-xl font-semibold text-red-600">
                          NFC Read Failed
                        </span>
                        <span className="text-sm sm:text-base text-gray-600">
                          {nfcMessage}
                        </span>
                      </div>
                      <button
                        onClick={startNfcReading}
                        className="mt-4 px-6 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-medium text-sm sm:text-base transition-all duration-150 shadow-md hover:shadow-lg"
                      >
                        Try Again
                      </button>
                    </>
                  )}
                </div>
              ) : (
                /* Reading State */
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <div className="relative">
                    <div className="rounded-full p-6 bg-green-100 animate-pulse">
                      <Radio className="size-12 sm:size-14 text-green-600" />
                    </div>
                    {isReadingNfc && (
                      <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-75"></div>
                    )}
                  </div>
                  <div className="flex flex-col text-center gap-2">
                    <span className="text-lg sm:text-xl font-semibold text-gray-800">
                      {isReadingNfc ? "Reading NFC Tag..." : "Ready to Scan"}
                    </span>
                    <span className="text-sm sm:text-base text-gray-600">
                      {isReadingNfc 
                        ? "Bring your NFC tag close to your device" 
                        : "Click the button below to start scanning"}
                    </span>
                  </div>
                  {!isReadingNfc && (
                    <button
                      onClick={startNfcReading}
                      className="mt-4 px-6 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-medium text-sm sm:text-base transition-all duration-150 shadow-md hover:shadow-lg"
                    >
                      Start Scanning
                    </button>
                  )}
                  {isReadingNfc && (
                    <button
                      onClick={closeNfcModal}
                      className="mt-4 px-6 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-medium text-sm sm:text-base transition-all duration-150 shadow-md hover:shadow-lg"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

