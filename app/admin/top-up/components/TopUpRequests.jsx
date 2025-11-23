"use client";
import {
  BanknoteArrowUp,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  Plus,
  Trash2,
  X,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Radio,
  CircleCheckBig,
  CircleAlert,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { db } from "../../../../firebase";
import { collection, getDocs, query, where, orderBy, doc, updateDoc, getDoc, increment } from "firebase/firestore";

export default function TopUpRequests() {
  // Tab state
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "history"
  
  // 1. State to manage the currently viewed request data (and modal visibility)
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(true);
  const [previewImageLoading, setPreviewImageLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  
  // Success/Error Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  
  // Data state
  const [topUpRequests, setTopUpRequests] = useState([]);
  const [topUpHistory, setTopUpHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  

  // Pagination (active only when not searching)
  const [currentPage, setCurrentPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [debouncedHistoryQuery, setDebouncedHistoryQuery] = useState("");
  
  // Sort state
  const [sortBy, setSortBy] = useState("date"); // "date", "name", "rfid"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc", "desc"
  const [historySortBy, setHistorySortBy] = useState("date");
  const [historySortOrder, setHistorySortOrder] = useState("desc");
  
  // Status filter for history
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all"); // "all", "approved", "rejected"
  
  // NFC Reading states
  const [nfcModal, setNfcModal] = useState(false);
  const [isNfcClosing, setIsNfcClosing] = useState(false);
  const [isNfcOpening, setIsNfcOpening] = useState(false);
  const [isReadingNfc, setIsReadingNfc] = useState(false);
  const [nfcResult, setNfcResult] = useState(null); // "success" or "error"
  const [nfcMessage, setNfcMessage] = useState("");
  const [showNfcResult, setShowNfcResult] = useState(false);
  const [nfcActiveTab, setNfcActiveTab] = useState("pending"); // Track which tab's search to populate

  // Fetch topup requests from Firestore (pending)
  useEffect(() => {
    const fetchTopUpRequests = async () => {
      const startTime = Date.now();
      try {
        setLoading(true);
        const topUpRequestsRef = collection(db, "topup_requests");
        
        // Try with orderBy first, fallback to just where if index is missing
        let querySnapshot;
        try {
          const q = query(
            topUpRequestsRef,
            where("status", "==", "pending"),
            orderBy("requestedAt", "desc")
          );
          querySnapshot = await getDocs(q);
        } catch (error) {
          // If orderBy fails (likely missing index), just filter by status
          console.warn("OrderBy failed, using simple query:", error);
          const q = query(
            topUpRequestsRef,
            where("status", "==", "pending")
          );
          querySnapshot = await getDocs(q);
        }
        
        const requests = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          requests.push({
            id: doc.id, // Document ID
            documentId: doc.id, // Keep document ID for transaction ID formatting
            userName: data.userName || "",
            userId: data.userId || "",
            amount: data.amount || 0,
            status: data.status || "pending",
            paymentMethod: data.paymentMethod || "",
            referenceId: data.referenceId || "",
            receiptURL: data.receiptURL || "",
            requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : new Date()),
          });
        });
        
        // Sort by requestedAt in descending order (most recent first)
        requests.sort((a, b) => {
          const dateA = a.requestedAt instanceof Date ? a.requestedAt : new Date(a.requestedAt);
          const dateB = b.requestedAt instanceof Date ? b.requestedAt : new Date(b.requestedAt);
          return dateB - dateA; // Descending order
        });
        
        setTopUpRequests(requests);

        // Ensure minimum 0.65 second loading time for smooth transition
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 650;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } catch (error) {
        console.error("Error fetching topup requests:", error);
        
        // Ensure minimum loading time even on error
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 650;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "pending") {
      fetchTopUpRequests();
    }
  }, [activeTab]);

  // Fetch top-up history (approved and rejected)
  useEffect(() => {
    const fetchTopUpHistory = async () => {
      if (activeTab !== "history") return;
      
      const startTime = Date.now();
      try {
        setHistoryLoading(true);
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
          console.warn("OrderBy failed for history, using simple query:", error);
          const q = query(
            topUpRequestsRef,
            where("status", "in", ["approved", "rejected"])
          );
          querySnapshot = await getDocs(q);
        }
        
        const history = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const processedAt = data.processedAt?.toDate ? data.processedAt.toDate() : (data.processedAt ? new Date(data.processedAt) : new Date());
          history.push({
            id: doc.id,
            documentId: doc.id,
            userName: data.userName || "",
            userId: data.userId || "",
            amount: data.amount || 0,
            status: data.status || "",
            paymentMethod: data.paymentMethod || "",
            referenceId: data.referenceId || "",
            receiptURL: data.receiptURL || "",
            requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : new Date()),
            processedAt: processedAt,
          });
        });
        
        // Sort by processedAt in descending order
        history.sort((a, b) => {
          const dateA = a.processedAt instanceof Date ? a.processedAt : new Date(a.processedAt);
          const dateB = b.processedAt instanceof Date ? b.processedAt : new Date(b.processedAt);
          return dateB - dateA;
        });
        
        setTopUpHistory(history);

        // Ensure minimum 0.65 second loading time
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 650;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } catch (error) {
        console.error("Error fetching top-up history:", error);
        
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 650;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchTopUpHistory();
  }, [activeTab]);


  // Refresh data after approve/reject
  const refreshData = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      const topUpRequestsRef = collection(db, "topup_requests");
      
      let querySnapshot;
      try {
        const q = query(
          topUpRequestsRef,
          where("status", "==", "pending"),
          orderBy("requestedAt", "desc")
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        console.warn("OrderBy failed, using simple query:", error);
        const q = query(
          topUpRequestsRef,
          where("status", "==", "pending")
        );
        querySnapshot = await getDocs(q);
      }
      
      const requests = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          documentId: doc.id,
          userName: data.userName || "",
          userId: data.userId || "",
          amount: data.amount || 0,
          status: data.status || "pending",
          paymentMethod: data.paymentMethod || "",
          referenceId: data.referenceId || "",
          receiptURL: data.receiptURL || "",
          requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : new Date()),
        });
      });
      
      requests.sort((a, b) => {
        const dateA = a.requestedAt instanceof Date ? a.requestedAt : new Date(a.requestedAt);
        const dateB = b.requestedAt instanceof Date ? b.requestedAt : new Date(b.requestedAt);
        return dateB - dateA;
      });
      
      setTopUpRequests(requests);

      // Also refresh history if history tab is active
      if (activeTab === "history") {
        setHistoryLoading(true);
        try {
          let historyQuerySnapshot;
          try {
            const historyQ = query(
              topUpRequestsRef,
              where("status", "in", ["approved", "rejected"]),
              orderBy("processedAt", "desc")
            );
            historyQuerySnapshot = await getDocs(historyQ);
          } catch (error) {
            console.warn("OrderBy failed for history refresh, using simple query:", error);
            const historyQ = query(
              topUpRequestsRef,
              where("status", "in", ["approved", "rejected"])
            );
            historyQuerySnapshot = await getDocs(historyQ);
          }
          
          const history = [];
          historyQuerySnapshot.forEach((doc) => {
            const data = doc.data();
            const processedAt = data.processedAt?.toDate ? data.processedAt.toDate() : (data.processedAt ? new Date(data.processedAt) : new Date());
            history.push({
              id: doc.id,
              documentId: doc.id,
              userName: data.userName || "",
              userId: data.userId || "",
              amount: data.amount || 0,
              status: data.status || "",
              paymentMethod: data.paymentMethod || "",
              referenceId: data.referenceId || "",
              receiptURL: data.receiptURL || "",
              requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : new Date()),
              processedAt: processedAt,
            });
          });
          
          history.sort((a, b) => {
            const dateA = a.processedAt instanceof Date ? a.processedAt : new Date(a.processedAt);
            const dateB = b.processedAt instanceof Date ? b.processedAt : new Date(b.processedAt);
            return dateB - dateA;
          });
          
          setTopUpHistory(history);
        } catch (error) {
          console.error("Error refreshing history:", error);
        } finally {
          setHistoryLoading(false);
        }
      }

      // Ensure minimum 0.65 second loading time
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 650;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    } catch (error) {
      console.error("Error refreshing topup requests:", error);
      
      // Ensure minimum loading time even on error
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 650;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    } finally {
      setLoading(false);
    }
  };

  // Format transaction ID (PAYMENTMETHOD-FULLDOCUMENTID)
  const formatTransactionId = (paymentMethod, documentId) => {
    if (!documentId) return "N/A-000000";
    
    // Clean payment method - remove any dashes and trim
    let method = paymentMethod ? paymentMethod.toUpperCase().trim().replace(/-/g, '') : "N/A";
    
    // Check if documentId already has the format PAYMENTMETHOD-XXXXX
    // If it does, return it as-is to avoid duplication
    if (method !== "N/A" && documentId.toUpperCase().startsWith(method + "-")) {
      return documentId;
    }
    
    // Otherwise, format as PAYMENTMETHOD-DOCUMENTID
    return `${method}-${documentId}`;
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

  // Transform data for display
  const pendingRequestsItems = useMemo(() => {
    return topUpRequests.map((item) => {
      const { date, time } = formatDateTime(item.requestedAt);
      return {
        id: item.id,
        documentId: item.documentId,
        name: item.userName,
        rfid: item.userId,
        amount: item.amount,
        status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        paymentMethod: item.paymentMethod,
        referenceNumber: item.referenceId,
        receiptURL: item.receiptURL,
        date,
        time,
        requestedAt: item.requestedAt,
      };
    });
  }, [topUpRequests]);

  // Transform history data for display
  const historyItems = useMemo(() => {
    return topUpHistory.map((item) => {
      const { date, time } = formatDateTime(item.processedAt);
      return {
        id: item.id,
        documentId: item.documentId,
        name: item.userName,
        rfid: item.userId,
        amount: item.amount,
        status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        paymentMethod: item.paymentMethod,
        referenceNumber: item.referenceId,
        receiptURL: item.receiptURL,
        date,
        time,
        processedAt: item.processedAt,
      };
    });
  }, [topUpHistory]);

  useEffect(() => {
    // if short query (<3 chars) we keep instant behavior and skip debounce
    if (searchQuery.trim().length < 3) {
      setDebouncedQuery(searchQuery);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // History search debounce
  useEffect(() => {
    if (historySearchQuery.trim().length < 3) {
      setDebouncedHistoryQuery(historySearchQuery);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedHistoryQuery(historySearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [historySearchQuery]);

  const effectiveQuery =
    searchQuery.trim().length < 3
      ? searchQuery.trim().toLowerCase()
      : debouncedQuery.trim().toLowerCase();

  const effectiveHistoryQuery =
    historySearchQuery.trim().length < 3
      ? historySearchQuery.trim().toLowerCase()
      : debouncedHistoryQuery.trim().toLowerCase();

  const filteredAndSortedItems = useMemo(() => {
    let items = pendingRequestsItems;
    
    // Apply search filter
    if (effectiveQuery) {
      items = items.filter((item) => {
        const q = effectiveQuery;
        return (
          item.name.toLowerCase().includes(q) ||
          item.paymentMethod.toLowerCase().includes(q) ||
          formatTransactionId(item.paymentMethod, item.documentId).toLowerCase().includes(q) ||
          item.referenceNumber.toLowerCase().includes(q) ||
          item.rfid.toString().toLowerCase().includes(q) ||
          `${item.date} ${item.time}`.toLowerCase().includes(q)
        );
      });
    }
    
    // Apply sorting
    const sortedItems = [...items].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "date") {
        const dateA = a.requestedAt instanceof Date ? a.requestedAt : new Date(a.requestedAt);
        const dateB = b.requestedAt instanceof Date ? b.requestedAt : new Date(b.requestedAt);
        comparison = dateB.getTime() - dateA.getTime(); // Positive when B is newer (descending by default)
        // For dates: desc = newest first, asc = oldest first
        return sortOrder === "asc" ? -comparison : comparison;
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name); // Negative when A < B (ascending by default)
        // For names: asc = A-Z, desc = Z-A
        return sortOrder === "desc" ? -comparison : comparison;
      } else if (sortBy === "rfid") {
        comparison = a.rfid.toString().localeCompare(b.rfid.toString()); // Negative when A < B (ascending by default)
        // For RFID: asc = 0-9/A-Z, desc = Z-A/9-0
        return sortOrder === "desc" ? -comparison : comparison;
      }
      
      return comparison;
    });
    
    return sortedItems;
  }, [pendingRequestsItems, effectiveQuery, sortBy, sortOrder]);

  // History filtering and sorting
  const filteredAndSortedHistoryItems = useMemo(() => {
    let items = historyItems;
    
    // Apply status filter
    if (historyStatusFilter !== "all") {
      items = items.filter((item) => {
        return item.status.toLowerCase() === historyStatusFilter.toLowerCase();
      });
    }
    
    // Apply search filter
    if (effectiveHistoryQuery) {
      items = items.filter((item) => {
        const q = effectiveHistoryQuery;
        return (
          item.name.toLowerCase().includes(q) ||
          item.paymentMethod.toLowerCase().includes(q) ||
          formatTransactionId(item.paymentMethod, item.documentId).toLowerCase().includes(q) ||
          item.referenceNumber.toLowerCase().includes(q) ||
          item.rfid.toString().toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q) ||
          `${item.date} ${item.time}`.toLowerCase().includes(q)
        );
      });
    }
    
    // Apply sorting
    const sortedItems = [...items].sort((a, b) => {
      let comparison = 0;
      
      if (historySortBy === "date") {
        const dateA = a.processedAt instanceof Date ? a.processedAt : new Date(a.processedAt);
        const dateB = b.processedAt instanceof Date ? b.processedAt : new Date(b.processedAt);
        comparison = dateB.getTime() - dateA.getTime();
        return historySortOrder === "asc" ? -comparison : comparison;
      } else if (historySortBy === "name") {
        comparison = a.name.localeCompare(b.name);
        return historySortOrder === "desc" ? -comparison : comparison;
      } else if (historySortBy === "rfid") {
        comparison = a.rfid.toString().localeCompare(b.rfid.toString());
        return historySortOrder === "desc" ? -comparison : comparison;
      }
      
      return comparison;
    });
    
    return sortedItems;
  }, [historyItems, historyStatusFilter, effectiveHistoryQuery, historySortBy, historySortOrder]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedItems.length / itemsPerPage)
  );

  const historyTotalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedHistoryItems.length / itemsPerPage)
  );
  
  // Ensure currentPage in range when search cleared/filtered length changes
  useEffect(() => {
    if (effectiveQuery.length > 0) {
      setCurrentPage(1);
    } else {
      if (currentPage > totalPages) setCurrentPage(1);
    }
  }, [effectiveQuery, totalPages, currentPage]);

  useEffect(() => {
    if (effectiveHistoryQuery.length > 0) {
      setHistoryPage(1);
    } else {
      if (historyPage > historyTotalPages) setHistoryPage(1);
    }
  }, [effectiveHistoryQuery, historyTotalPages, historyPage]);

  // Reset page when status filter changes
  useEffect(() => {
    setHistoryPage(1);
  }, [historyStatusFilter]);

  const isSearching = effectiveQuery.length > 0;
  const isHistorySearching = effectiveHistoryQuery.length > 0;

  const paginatedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedHistoryItems = filteredAndSortedHistoryItems.slice(
    (historyPage - 1) * itemsPerPage,
    historyPage * itemsPerPage
  );

  const itemsToDisplay = isSearching ? filteredAndSortedItems : paginatedItems;
  const historyItemsToDisplay = isHistorySearching ? filteredAndSortedHistoryItems : paginatedHistoryItems;

  // Handle page number click
  const handlePageClick = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages && pageNum <= 5) {
      setCurrentPage(pageNum);
    }
  };

  // Handle history page number click
  const handleHistoryPageClick = (pageNum) => {
    if (pageNum >= 1 && pageNum <= historyTotalPages && pageNum <= 5) {
      setHistoryPage(pageNum);
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

  // Generate visible history page numbers (limited to 5)
  const getVisibleHistoryPages = () => {
    const pages = [];
    const maxVisible = 5;
    const maxPageToShow = Math.min(historyTotalPages, maxVisible);
    
    for (let i = 1; i <= maxPageToShow; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const anyModalOpen = selectedRequest !== null || showRejectModal || showImagePreview || nfcModal;
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [anyModalOpen]);

  // NFC Modal Functions
  const openNfcModal = (tab = "pending") => {
    setNfcModal(true);
    setIsNfcClosing(false);
    setIsNfcOpening(false);
    setIsReadingNfc(false);
    setNfcResult(null);
    setNfcMessage("");
    setShowNfcResult(false);
    setNfcActiveTab(tab);
    
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
        
        // Set the search query with the cleaned RFID based on active tab
        if (nfcActiveTab === "pending") {
          setSearchQuery(cleanedRfid);
          setDebouncedQuery(cleanedRfid);
        } else {
          setHistorySearchQuery(cleanedRfid);
          setDebouncedHistoryQuery(cleanedRfid);
        }
        
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

  const handleViewRequest = (requestItem) => {
    setIsClosing(false);
    setIsOpening(false);
    setSelectedRequest(requestItem);
    setShowRejectModal(false);
    // Trigger opening animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsOpening(true);
      });
    });
  };

  const handleReject = (item) => {
    setSelectedRequest(item);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest || processing) return;

    try {
      setProcessing(true);
      
      // Update topup_requests status to "rejected"
      const requestRef = doc(db, "topup_requests", selectedRequest.documentId);
      await updateDoc(requestRef, {
        status: "rejected",
        processedAt: new Date(),
      });

      // Close reject modal
      setShowRejectModal(false);
      
      // Show success modal and refresh data
      setModalMessage("Top-up request has been successfully rejected.");
      setShowSuccessModal(true);
      await refreshData();
    } catch (error) {
      console.error("Error rejecting request:", error);
      setProcessing(false);
      setShowRejectModal(false);
      setModalMessage("Failed to reject request. Please try again.");
      setShowErrorModal(true);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || processing) return;

    try {
      setProcessing(true);
      
      // Find user by RFID card ID (userId in topup_requests)
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("rfidCardId", "==", selectedRequest.rfid));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        setProcessing(false);
        setModalMessage("User not found. Cannot approve request.");
        setShowErrorModal(true);
        return;
      }

      const userDoc = userSnapshot.docs[0];

      // Update user balance using increment for atomic operation
      const userRef = doc(db, "users", userDoc.id);
      await updateDoc(userRef, {
        balance: increment(selectedRequest.amount),
      });

      // Update topup_requests status to "approved"
      const requestRef = doc(db, "topup_requests", selectedRequest.documentId);
      await updateDoc(requestRef, {
        status: "approved",
        processedAt: new Date(),
      });

      // Show success modal and refresh data
      setModalMessage("Top-up request has been successfully approved.");
      setShowSuccessModal(true);
      await refreshData();
    } catch (error) {
      console.error("Error approving request:", error);
      setProcessing(false);
      setModalMessage("Failed to approve request. Please try again.");
      setShowErrorModal(true);
    }
  };

  const closeAllModals = () => {
    if (isClosing) return;
    setIsOpening(false);
    setIsClosing(true);
    setTimeout(() => {
      setSelectedRequest(null);
      setShowRejectModal(false);
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

  // Reset image loading state when selectedRequest changes
  useEffect(() => {
    if (selectedRequest?.receiptURL) {
      setImageLoading(true);
    }
  }, [selectedRequest]);


  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Total Card Skeleton with integrated button */}
      <div className={`flex relative rounded-2xl overflow-hidden text-white animate-pulse ${
        activeTab === "pending"
          ? "bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500"
          : "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"
      }`}>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className={`h-9 sm:h-10 w-20 rounded ${
            activeTab === "pending" ? "bg-yellow-600/50" : "bg-blue-600/50"
          }`}></div>
          <div className="flex flex-col gap-0.5">
            <div className={`h-4 sm:h-5 w-56 rounded ${
              activeTab === "pending" ? "bg-yellow-600/50" : "bg-blue-600/50"
            }`}></div>
            <div className={`h-3 w-36 rounded ${
              activeTab === "pending" ? "bg-yellow-600/50" : "bg-blue-600/50"
            }`}></div>
          </div>
        </div>
        {/* Tab Switcher Button Skeleton */}
        {/* Icon Skeleton - Positioned at right edge, vertically centered */}
        <div className={`absolute top-1/2 -translate-y-1/2 right-[60px] sm:right-[80px] rounded-full p-3 ${
          activeTab === "pending" ? "bg-yellow-600/40" : "bg-blue-600/40"
        }`}>
          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${
            activeTab === "pending" ? "bg-yellow-700/50" : "bg-blue-700/50"
          }`}></div>
        </div>
        
        {/* Tab Switcher Button Skeleton - Full Height */}
        <div className="flex pr-0">
          <div className={`rounded-tr-2xl rounded-br-2xl px-4 sm:px-6 py-5 flex items-center justify-center ${
            activeTab === "pending" ? "bg-yellow-600/40" : "bg-blue-600/40"
          }`}>
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded ${
              activeTab === "pending" ? "bg-yellow-700/50" : "bg-blue-700/50"
            }`}></div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-col gap-4">
        {/* Search Bar and Sort Filters Skeleton */}
        <div className="flex flex-col gap-4">
          {/* Search Bar Skeleton */}
          <div className="flex flex-col gap-1 w-full">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Sort Filters Skeleton */}
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-9 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-9 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* Section Title and Status Filter Buttons Skeleton (for history tab) */}
          {activeTab === "history" && (
            <div className="flex flex-col gap-2">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
              
              {/* Status Filter Buttons Skeleton */}
              <div className="flex items-center gap-2 flex-wrap">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          )}
          
          {/* Section Title Skeleton (for pending tab) */}
          {activeTab === "pending" && (
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
          )}

          {/* Mobile View Skeleton */}
          <div className="flex xl:hidden flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-gray-300 flex items-center animate-pulse"
              >
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="h-5 w-32 bg-gray-200 rounded"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded"></div>
                    <div className="h-4 w-36 bg-gray-200 rounded"></div>
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
                  {[...Array(6)].map((_, i) => (
                    <th key={i} className="px-6 py-3">
                      <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-300">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Skeleton */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="inline-flex h-8 w-48 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col gap-2 items-center justify-center p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-100 lg:bg-gray-50 w-full">
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center justify-center p-4 rounded-full bg-gray-300 text-gray-600">
          <PackageOpen className="size-7 sm:size-8" />
        </div>
      </div>
      <div className="flex flex-col text-center pb-2">
        <span className="text-base sm:text-lg font-semibold">
          No Available Data
        </span>
        <span className="text-gray-500">There is no available data</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-1 gap-4 relative">
      {/* Skeleton Loader with fade transition */}
      <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${
        (loading || historyLoading) ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        <SkeletonLoader />
      </div>
      
      {/* Content with fade transition */}
      <div className={`transition-opacity duration-500 ${
        (loading || historyLoading) ? "opacity-0" : "opacity-100"
      }`}>
        {/* Total Card - Dynamic based on active tab with integrated tab button */}
        <div className={`flex relative rounded-2xl overflow-hidden text-white ${
          activeTab === "pending"
            ? "bg-linear-to-r from-yellow-500 via-yellow-400 to-yellow-500"
            : "bg-linear-to-r from-blue-500 via-blue-400 to-blue-500"
        }`}>
          <div className="flex flex-1 flex-col gap-2 p-5">
            <span className="text-2xl sm:text-3xl font-bold">
              {activeTab === "pending"
                ? pendingRequestsItems.length
                : historyItems.length}
            </span>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-semibold text-white">
                {activeTab === "pending"
                  ? "Total Pending Requests"
                  : "Total Top-up Requests History"}
              </span>
              <span className="text-xs text-gray-100">
                As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
          
          {/* Icon - Positioned at right edge, vertically centered */}
          <div className={`absolute top-1/2 -translate-y-1/2 right-[60px] sm:right-[80px] rounded-full p-3 shadow-600/40 ${
            activeTab === "pending"
              ? "bg-yellow-600/40 shadow-yellow-600/40"
              : "bg-blue-600/40 shadow-blue-600/40"
          }`}>
            <BanknoteArrowUp className="size-6 sm:size-7" />
          </div>
          
          {/* Tab Switcher Button - Full Height */}
          <div className="flex pr-0">
            <button
              onClick={() => {
                if (activeTab === "pending") {
                  setActiveTab("history");
                  setHistoryLoading(true); // Set loading immediately
                  setHistoryPage(1);
                  setHistorySearchQuery("");
                  setDebouncedHistoryQuery("");
                } else {
                  setActiveTab("pending");
                  setLoading(true); // Set loading immediately
                  setCurrentPage(1);
                  setSearchQuery("");
                  setDebouncedQuery("");
                }
              }}
              className={`rounded-tr-2xl rounded-br-2xl px-4 sm:px-6 py-5 flex items-center justify-center transition-colors duration-150 ${
                activeTab === "pending"
                  ? "bg-yellow-600/40 hover:bg-yellow-600/50 active:bg-yellow-600/60"
                  : "bg-blue-600/40 hover:bg-blue-600/50 active:bg-blue-600/60"
              }`}
            >
              <ChevronRight className="size-5 sm:size-6 text-white" />
            </button>
          </div>
        </div>

        {/* content */}
        <div className="flex flex-col gap-4">
        {activeTab === "pending" ? (
          <>
          {/* search bar and sort filter */}
          <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <form className="flex">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between mt-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-500">
                  Search users
                </label>
                <button
                  type="button"
                  onClick={() => openNfcModal("pending")}
                  className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xs sm:text-sm font-medium transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  <Radio className="size-4 sm:size-5" />
                  <span>Scan NFC</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Supports comma-separated search"
                  className="px-3 sm:px-4 py-3 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 pe-20 sm:pe-21"
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-100/90 active:bg-gray-200 cursor-pointer transition-colors duration-150 top-2 right-2 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </form>
          
          {/* Sort Filters */}
          <div className="flex flex-col gap-2">
            <span className="text-xs sm:text-sm font-semibold text-gray-500">
              Sort filters
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort By Filter Buttons */}
              <button
                onClick={() => setSortBy("date")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                  sortBy === "date"
                    ? "bg-green-500 text-white border border-green-500"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy("name")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                  sortBy === "name"
                    ? "bg-green-500 text-white border border-green-500"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                Name
              </button>
              <button
                onClick={() => setSortBy("rfid")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                  sortBy === "rfid"
                    ? "bg-green-500 text-white border border-green-500"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                RFID No.
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs sm:text-sm font-semibold text-gray-500">
            Pending requests
          </span>

          {/* items (mobile) */}
          <div className="flex xl:hidden flex-col gap-3">
            {itemsToDisplay.length === 0 ? (
              <EmptyState />
            ) : (
              itemsToDisplay.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewRequest(item)}
                  className="p-5 cursor-pointer rounded-2xl border border-gray-300 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
                >
                  {/* transaction id, name, rfid, status */}
                  <div className="flex flex-1 text-left flex-col gap-3">
                    {/* transaction id, name and rfid details */}
                    <div className="flex flex-col">
                      {/* transaction id */}
                      <span className="font-semibold text-xs sm:text-sm">
                        {formatTransactionId(item.paymentMethod, item.documentId)}
                      </span>
                      {/* name */}
                      <span className="font-semibold">{item.name}</span>
                      {/* rfid */}
                      <span className="text-xs sm:text-sm text-gray-500">
                        RFID No: {item.rfid}
                      </span>
                    </div>
                    {/* status */}
                    <div className="flex items-center">
                      <div className="flex items-center px-4 py-1 rounded-full text-xs text-white bg-yellow-400">
                        <span>{item.status}</span>
                      </div>
                    </div>
                  </div>
                  {/* amount top-up */}
                  <div className="flex items-center justif-center">
                    <div className="flex items-center gap-1 text-green-500">
                      <Plus className="size-5 sm:size-6" />
                      <span className="text-base sm:text-lg font-semibold">
                        {item.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* items (table) */}
          <div className="hidden xl:flex rounded-2xl overflow-hidden border border-gray-300 w-full">
            {itemsToDisplay.length === 0 ? (
              <EmptyState />
            ) : (
              <table className="w-full text-sm text-left rtl:text-right text-body">
                <thead className="border-b border-gray-300 bg-gray-100 ">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Transaction ID
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      RFID No.
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itemsToDisplay.map((item) => (
                    <tr key={item.id} className="border-b border-gray-300">
                      <td scope="row" className="px-6 py-4">
                        {formatTransactionId(item.paymentMethod, item.documentId)}
                      </td>
                      <td className="px-6 py-4">
                        {item.name}
                      </td>
                      <td className="px-6 py-4">{item.rfid}</td>
                      <td className="px-6 py-4 flex">
                        <div className="text-xs px-4 py-1 rounded-full text-white bg-yellow-400">
                          {item.status}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-500">
                          P{item.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewRequest(item)}
                          className="rounded-lg px-4 py-1 bg-green-500 text-white text-xs cursor-pointer transition-colors duration-150 hover:bg-green-500/90 active:bg-green-600"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* pagination */}
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
        </>
        ) : (
          <>
          {/* History Tab Content */}
          {/* search bar and sort filter */}
          <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <form className="flex">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between mt-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-500">
                  Search history
                </label>
                <button
                  type="button"
                  onClick={() => openNfcModal("history")}
                  className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xs sm:text-sm font-medium transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  <Radio className="size-4 sm:size-5" />
                  <span>Scan NFC</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => {
                    setHistorySearchQuery(e.target.value);
                    setHistoryPage(1);
                  }}
                  placeholder="Supports comma-separated search"
                  className="px-3 sm:px-4 py-3 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 pe-20 sm:pe-21"
                />
                {historySearchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistorySearchQuery("");
                      setHistoryPage(1);
                    }}
                    className="absolute px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-100/90 active:bg-gray-200 cursor-pointer transition-colors duration-150 top-2 right-2 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </form>
          
          {/* Sort Filters */}
          <div className="flex flex-col gap-2">
            <span className="text-xs sm:text-sm font-semibold text-gray-500">
              Sort filters
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort By Filter Buttons */}
              <button
                onClick={() => setHistorySortBy("date")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                  historySortBy === "date"
                    ? "bg-green-500 text-white border border-green-500"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setHistorySortBy("name")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                  historySortBy === "name"
                    ? "bg-green-500 text-white border border-green-500"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                Name
              </button>
              <button
                onClick={() => setHistorySortBy("rfid")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                  historySortBy === "rfid"
                    ? "bg-green-500 text-white border border-green-500"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                RFID No.
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <span className="text-xs sm:text-sm font-semibold text-gray-500">
              Top-up History
            </span>
            
            {/* Status Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setHistoryStatusFilter("all")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                  historyStatusFilter === "all"
                    ? "bg-green-500 text-white border border-green-500"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setHistoryStatusFilter("approved")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                  historyStatusFilter === "approved"
                    ? "bg-green-500 text-white border border-green-500"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setHistoryStatusFilter("rejected")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                  historyStatusFilter === "rejected"
                    ? "bg-green-500 text-white border border-green-500"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* items (mobile) */}
          <div className="flex xl:hidden flex-col gap-3">
            {historyItemsToDisplay.length === 0 ? (
              <EmptyState />
            ) : (
              historyItemsToDisplay.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewRequest(item)}
                  className="p-5 cursor-pointer rounded-2xl border border-gray-300 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
                >
                  {/* transaction id, name, rfid, status */}
                  <div className="flex flex-1 text-left flex-col gap-3">
                    {/* transaction id, name and rfid details */}
                    <div className="flex flex-col">
                      {/* transaction id */}
                      <span className="font-semibold text-xs sm:text-sm">
                        {formatTransactionId(item.paymentMethod, item.documentId)}
                      </span>
                      {/* name */}
                      <span className="font-semibold">{item.name}</span>
                      {/* rfid */}
                      <span className="text-xs sm:text-sm text-gray-500">
                        RFID No: {item.rfid}
                      </span>
                    </div>
                    {/* status */}
                    <div className="flex items-center">
                      <div className={`flex items-center px-4 py-1 rounded-full text-xs text-white ${
                        item.status.toLowerCase() === "approved" 
                          ? "bg-green-500" 
                          : "bg-red-500"
                      }`}>
                        <span>{item.status}</span>
                      </div>
                    </div>
                  </div>
                  {/* amount top-up */}
                  <div className="flex items-center justif-center">
                    <div className="flex items-center gap-1 text-green-500">
                      <Plus className="size-5 sm:size-6" />
                      <span className="text-base sm:text-lg font-semibold">
                        {item.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* items (table) */}
          <div className="hidden xl:flex rounded-2xl overflow-hidden border border-gray-300 w-full">
            {historyItemsToDisplay.length === 0 ? (
              <EmptyState />
            ) : (
              <table className="w-full text-sm text-left rtl:text-right text-body">
                <thead className="border-b border-gray-300 bg-gray-100 ">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Transaction ID
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      RFID No.
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historyItemsToDisplay.map((item) => (
                    <tr key={item.id} className="border-b border-gray-300">
                      <td scope="row" className="px-6 py-4">
                        {formatTransactionId(item.paymentMethod, item.documentId)}
                      </td>
                      <td className="px-6 py-4">
                        {item.name}
                      </td>
                      <td className="px-6 py-4">{item.rfid}</td>
                      <td className="px-6 py-4 flex">
                        <div className={`text-xs px-4 py-1 rounded-full text-white ${
                          item.status.toLowerCase() === "approved" 
                            ? "bg-green-500" 
                            : "bg-red-500"
                        }`}>
                          {item.status}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-500">
                          P{item.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewRequest(item)}
                          className="rounded-lg px-4 py-1 bg-blue-500 text-white text-xs cursor-pointer transition-colors duration-150 hover:bg-blue-500/90 active:bg-blue-600"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* pagination */}
          {!isHistorySearching && (
            <div className="flex items-center justify-center lg:justify-end">
              <div className="inline-flex text-xs items-center gap-1">
                <button
                  onClick={() => {
                    if (historyPage > 1) {
                      setHistoryPage(historyPage - 1);
                    }
                  }}
                  className="rounded-tl-2xl rounded-bl-2xl border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
                  disabled={historyPage <= 1}
                >
                  <ChevronLeft className="size-4" />
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center border-t border-b border-gray-300">
                  {getVisibleHistoryPages().map((page) => (
                    <button
                      key={page}
                      onClick={() => handleHistoryPageClick(page)}
                      className={`px-3 py-2 border-x border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 ${
                        historyPage === page
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
                    if (historyPage < historyTotalPages && historyPage < 5) {
                      setHistoryPage(historyPage + 1);
                    }
                  }}
                  className="rounded-tr-2xl rounded-br-2xl border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
                  disabled={historyPage >= historyTotalPages || historyPage >= 5}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>
      </div>

      {/* pending request modal (Conditionally Rendered) */}
      {selectedRequest && !showRejectModal && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
            isClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeAllModals}
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
              onClick={closeAllModals}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD - Dynamic based on active tab */}
            <div className={`flex relative rounded-t-2xl p-4 sm:p-5 text-white ${
              activeTab === "pending"
                ? "bg-linear-to-r from-yellow-500 via-yellow-400 to-yellow-500"
                : selectedRequest?.status?.toLowerCase() === "approved"
                ? "bg-linear-to-r from-green-500 via-green-400 to-green-500"
                : "bg-linear-to-r from-red-500 via-red-400 to-red-500"
            }`}>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold">
                  {selectedRequest.name}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    RFID No. {selectedRequest.rfid}
                  </span>
                  <span className="text-xs text-gray-100">
                    {selectedRequest.date} {selectedRequest.time || ""}
                  </span>
                </div>
              </div>
              <div className={`absolute top-3 right-3 rounded-full p-2.5 sm:p-3 shadow-600/40 ${
                activeTab === "pending"
                  ? "bg-yellow-600/40 shadow-yellow-600/40"
                  : selectedRequest?.status?.toLowerCase() === "approved"
                  ? "bg-green-600/40 shadow-green-600/40"
                  : "bg-red-600/40 shadow-red-600/40"
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
                      ₱{selectedRequest.amount?.toLocaleString() || selectedRequest.amount.toFixed(2)}
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
                      {formatTransactionId(selectedRequest.paymentMethod, selectedRequest.documentId)}
                    </span>
                  </div>

                  <div className="col-span-1 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs mb-0.5">
                      Payment Method
                    </span>
                    <span className="font-semibold text-xs sm:text-sm">
                      {selectedRequest.paymentMethod}
                    </span>
                  </div>

                  {/* Reference Number - Only show if payment method is not Cash */}
                  {selectedRequest.paymentMethod?.toLowerCase() !== "cash" && (
                    <div className="col-span-2 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Reference Number
                      </span>
                      <span className="font-semibold text-xs sm:text-sm break-all">
                        {selectedRequest.referenceNumber}
                      </span>
                    </div>
                  )}

                  <div className="col-span-2 flex flex-col rounded-lg gap-2">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Proof of payment
                    </span>
                    {selectedRequest.receiptURL ? (
                      <div 
                        className="border border-gray-300 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:border-green-500 transition-colors duration-150 relative"
                        onClick={() => handleImageClick(selectedRequest.receiptURL)}
                      >
                        {imageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                            <div className="w-full h-full bg-gray-200"></div>
                          </div>
                        )}
                        <img
                          src={selectedRequest.receiptURL}
                          alt="Receipt"
                          className={`w-full h-64 sm:h-72 object-contain ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                          onLoad={handleImageLoad}
                          onError={() => setImageLoading(false)}
                        />
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-300 bg-gray-100 rounded-lg h-64 sm:h-72 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No receipt image</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* buttons - Only show for pending tab */}
              {activeTab === "pending" && (
                <div className="flex gap-2 items-center justify-end w-full mt-2">
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    disabled={processing}
                    className="bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>

                  <button 
                    onClick={handleApprove}
                    disabled={processing}
                    className="bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? "Processing..." : "Approve"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="rounded-2xl bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-6 mt-2 mb-2">
            {/* content */}
            <div className="flex flex-col items-center justify-center gap-4 pt-2 ">
              <div className="rounded-full p-3 bg-red-500 shadow-red-600 text-white">
                <Trash2 className="size-6 sm:size-7" />
              </div>
              <div className="flex flex-col text-center gap-1">
                <span className="text-base sm:text-lg font-semibold text-red-500">
                  Reject Request
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  Are you sure you want to reject this pending request?
                </span>
              </div>
            </div>

            {/* buttons */}
            <div className="flex gap-2 items-center w-full">
              <button
                onClick={closeAllModals}
                className="rounded-lg w-full cursor-pointer px-4 py-2 border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
              >
                Cancel
              </button>

              <button 
                onClick={handleRejectConfirm}
                disabled={processing}
                className="rounded-lg w-full cursor-pointer px-4 py-2 border border-red-500 bg-red-500 text-white hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Confirm"}
              </button>
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
                // Close main modal after success
                closeAllModals();
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
              onClick={() => {
                setShowErrorModal(false);
                // If error happens, close the reject modal if it's open
                if (showRejectModal) {
                  setShowRejectModal(false);
                }
              }}
              className="rounded-lg w-full cursor-pointer px-4 py-2 border border-red-500 bg-red-500 text-white hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150"
            >
              OK
            </button>
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
