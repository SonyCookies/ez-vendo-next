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
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { db } from "../../../../firebase";
import { collection, getDocs, query, where, orderBy, doc, updateDoc, getDoc, increment } from "firebase/firestore";

export default function TopUpRequests() {
  // 1. State to manage the currently viewed request data (and modal visibility)
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(true);
  const [previewImageLoading, setPreviewImageLoading] = useState(true);
  
  // Data state
  const [topUpRequests, setTopUpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Top-up logs state (approved/rejected)
  const [topUpLogs, setTopUpLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Pagination (active only when not searching)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Sort state
  const [sortBy, setSortBy] = useState("date"); // "date", "name", "rfid"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc", "desc"

  // Fetch topup requests from Firestore
  useEffect(() => {
    const fetchTopUpRequests = async () => {
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
      } catch (error) {
        console.error("Error fetching topup requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopUpRequests();
  }, []);

  // Fetch top-up logs (approved/rejected) from Firestore
  useEffect(() => {
    const fetchTopUpLogs = async () => {
      try {
        setLogsLoading(true);
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
          console.warn("OrderBy failed, using simple query:", error);
          const q = query(
            topUpRequestsRef,
            where("status", "in", ["approved", "rejected"])
          );
          querySnapshot = await getDocs(q);
        }
        
        const logs = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const requestedAt = data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : new Date());
          const processedAt = data.processedAt?.toDate ? data.processedAt.toDate() : (data.processedAt ? new Date(data.processedAt) : requestedAt);
          
          logs.push({
            id: doc.id,
            documentId: doc.id,
            userName: data.userName || "",
            userId: data.userId || "",
            amount: data.amount || 0,
            status: data.status || "",
            paymentMethod: data.paymentMethod || "",
            referenceId: data.referenceId || "",
            receiptURL: data.receiptURL || "",
            requestedAt: requestedAt,
            processedAt: processedAt,
          });
        });
        
        // Sort by processedAt in descending order
        logs.sort((a, b) => {
          const dateA = a.processedAt instanceof Date ? a.processedAt : new Date(a.processedAt);
          const dateB = b.processedAt instanceof Date ? b.processedAt : new Date(b.processedAt);
          return dateB - dateA;
        });
        
        setTopUpLogs(logs);
      } catch (error) {
        console.error("Error fetching top-up logs:", error);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchTopUpLogs();
  }, []);

  // Refresh data after approve/reject
  const refreshData = async () => {
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
    } catch (error) {
      console.error("Error refreshing topup requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format transaction ID (EZ-****** where ****** is first 6 chars of document ID)
  const formatTransactionId = (documentId) => {
    if (!documentId) return "EZ-000000";
    const firstSix = documentId.substring(0, 6).toUpperCase();
    return `EZ-${firstSix}`;
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

  const effectiveQuery =
    searchQuery.trim().length < 3
      ? searchQuery.trim().toLowerCase()
      : debouncedQuery.trim().toLowerCase();

  const filteredAndSortedItems = useMemo(() => {
    let items = pendingRequestsItems;
    
    // Apply search filter
    if (effectiveQuery) {
      items = items.filter((item) => {
        const q = effectiveQuery;
        return (
          item.name.toLowerCase().includes(q) ||
          item.paymentMethod.toLowerCase().includes(q) ||
          formatTransactionId(item.documentId).toLowerCase().includes(q) ||
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

  // Pagination

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedItems.length / itemsPerPage)
  );
  // Ensure currentPage in range when search cleared/filtered length changes
  useEffect(() => {
    if (searchQuery.trim().length > 0 || debouncedQuery.trim().length > 0) {
      // when searching we show ALL filtered results (no pagination)
      setCurrentPage(1);
    } else {
      // clamp current page to totalPages when not searching
      if (currentPage > totalPages) setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, debouncedQuery, totalPages]);

  const isSearching = effectiveQuery.length > 0;

  const paginatedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const itemsToDisplay = isSearching ? filteredAndSortedItems : paginatedItems;

  const anyModalOpen = selectedRequest !== null || showRejectModal || showImagePreview;
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [anyModalOpen]);

  const handleViewRequest = (requestItem) => {
    setSelectedRequest(requestItem);
    setShowRejectModal(false);
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

      // Close modals and refresh data
      closeAllModals();
      await refreshData();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request. Please try again.");
    } finally {
      setProcessing(false);
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
        alert("User not found. Cannot approve request.");
        setProcessing(false);
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

      // Close modals and refresh data
      closeAllModals();
      await refreshData();
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const closeAllModals = () => {
    setSelectedRequest(null);
    setShowRejectModal(false);
    setShowImagePreview(false);
    setPreviewImageUrl("");
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

  // JSX Helper (retained)
  const fieldClass ="px-3 sm:px-4 py-3 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 pe-20 sm:pe-21";

  // Skeleton Loading Components
  const SkeletonRow = () => (
    <div className="p-5 rounded-2xl border border-gray-300 flex items-center gap-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </div>
  );

  const TableSkeleton = () => (
    <div className="w-full">
      <div className="border-b border-gray-300 bg-gray-100 h-12"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border-b border-gray-300 py-4 px-6 animate-pulse">
          <div className="flex gap-4">
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const ModalSkeleton = () => (
    <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-lg flex flex-col gap-6 mt-2 mb-2 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 items-center justify-center py-2">
        <div className="rounded-full p-3 bg-gray-200 w-16 h-16"></div>
        <div className="flex flex-col gap-2 items-center">
          <div className="h-5 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-40"></div>
        </div>
      </div>

      {/* Name and Amount Skeleton */}
      <div className="flex py-2 items-center">
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-5 bg-gray-200 rounded w-40"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>

      {/* Transaction Details Skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-1 flex flex-col p-3 rounded-lg border border-gray-300 gap-2">
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="col-span-1 flex flex-col p-3 rounded-lg border border-gray-300 gap-2">
            <div className="h-3 bg-gray-200 rounded w-28"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="col-span-2 flex flex-col p-3 rounded-lg border border-gray-300 gap-2">
            <div className="h-3 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-36"></div>
          </div>
          {/* Image Skeleton */}
          <div className="col-span-2 flex flex-col rounded-lg mb-2 gap-2">
            <div className="h-3 bg-gray-200 rounded w-28"></div>
            <div className="border border-gray-300 bg-gray-100 rounded-lg h-64 sm:h-72 flex items-center justify-center">
              <div className="w-full h-full bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
        {/* Buttons Skeleton */}
        <div className="flex gap-2 items-center w-full">
          <div className="h-10 bg-gray-200 rounded flex-1"></div>
          <div className="h-10 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>
    </div>
  );

  const ImageSkeleton = () => (
    <div className="border border-gray-300 bg-gray-100 rounded-lg h-64 sm:h-72 flex items-center justify-center animate-pulse">
      <div className="w-full h-full bg-gray-200 rounded-lg"></div>
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
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Total Pending Request Card (unchanged) */}
      <div className="flex relative rounded-2xl bg-linear-to-r from-yellow-400 via-yellow-300 to-yellow-400 p-5">
        <div className="flex flex-1 flex-col gap-2 ">
          <span className="text-2xl sm:text-3xl font-bold">
            {loading ? "..." : pendingRequestsItems.length}
          </span>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base text-gray-800 font-medium">
              Total Pending Requests
            </span>
            <span className="text-xs text-gray-600 ">
              As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="absolute top-3 right-3 rounded-full p-3 bg-yellow-500 shadow-yellow-500">
          <BanknoteArrowUp className="size-6 sm:size-7" />
        </div>
      </div>

      {/* content (unchanged) */}
      <div className="flex flex-col gap-4">
        {/* search bar and sort filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <form action="" className="flex flex-1">
            <div className="flex flex-col gap-1 w-full">
              <label
                htmlFor=""
                className="text-xs sm:text-sm font-semibold text-gray-500"
              >
                Search users
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search by Name or RFID No."
                  className={fieldClass}
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-100/90 active:bg-gray-200 cursor-pointer transition-colors duration-150 top-2 right-2 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </form>
          
          {/* Sort Filter */}
          <div className="flex flex-col gap-1 md:w-48">
            <label
              htmlFor="sort"
              className="text-xs sm:text-sm font-semibold text-gray-500"
            >
              Sort by
            </label>
            <div className="relative">
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 sm:px-4 py-3 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 transition-colors duration-150 appearance-none bg-white pr-10"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="rfid">RFID No.</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4 pointer-events-none" />
            </div>
          </div>
          
          {/* Sort Order */}
          <div className="flex flex-col gap-1 md:w-36">
            <label
              htmlFor="sortOrder"
              className="text-xs sm:text-sm font-semibold text-gray-500"
            >
              Order
            </label>
            <div className="relative">
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 sm:px-4 py-3 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 transition-colors duration-150 appearance-none bg-white pr-10"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs sm:text-sm font-semibold text-gray-500">
            Pending requests
          </span>

          {/* items (mobile) */}
          <div className="flex xl:hidden flex-col gap-3">
            {loading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </>
            ) : itemsToDisplay.length === 0 ? (
              <EmptyState />
            ) : (
              itemsToDisplay.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewRequest(item)}
                  className="p-5 cursor-pointer rounded-2xl border border-gray-300 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
                >
                  {/* name, rfid, status */}
                  <div className="flex flex-1 text-left flex-col gap-3">
                    {/* name and rfid details */}
                    <div className="flex flex-col">
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
            {loading ? (
              <div className="w-full">
                <TableSkeleton />
              </div>
            ) : itemsToDisplay.length === 0 ? (
              <EmptyState />
            ) : (
              <table className="w-full text-sm text-left rtl:text-right text-body">
                <thead className="border-b border-gray-300 bg-gray-100 ">
                  <tr>
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
              <div className="inline-flex text-xs">
                <button
                  onClick={() =>
                    currentPage > 1 && setCurrentPage(currentPage - 1)
                  }
                  className="rounded-tl-2xl rounded-bl-2xl border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  disabled={currentPage <= 1}
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <div className="border-t border-b border-gray-300 px-4 py-2 flex items-center">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() =>
                    currentPage < totalPages && setCurrentPage(currentPage + 1)
                  }
                  className="rounded-tr-2xl rounded-br-2xl border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  disabled={currentPage >= totalPages}
                  aria-label="Next Page"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top-up Logs Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs sm:text-sm font-semibold text-gray-500">
            Top-up Logs
          </span>

          {/* items (mobile) */}
          <div className="flex xl:hidden flex-col gap-3">
            {logsLoading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </>
            ) : topUpLogs.length === 0 ? (
              <EmptyState />
            ) : (
              topUpLogs.map((item) => {
                const dateTime = item.processedAt instanceof Date ? item.processedAt : new Date(item.processedAt);
                const formattedDate = dateTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                const formattedTime = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewRequest(item)}
                    className="p-5 cursor-pointer rounded-2xl border border-gray-300 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
                  >
                    <div className="flex flex-1 text-left flex-col gap-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{item.userName}</span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          RFID No: {item.userId}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className={`flex items-center px-4 py-1 rounded-full text-xs text-white ${
                          item.status === "approved" ? "bg-green-500" : "bg-red-500"
                        }`}>
                          <span>{item.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-1 text-green-500">
                        <Plus className="size-5 sm:size-6" />
                        <span className="text-base sm:text-lg font-semibold">
                          {item.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* items (table) */}
          <div className="hidden xl:flex rounded-2xl overflow-hidden border border-gray-300 w-full">
            {logsLoading ? (
              <div className="w-full">
                <TableSkeleton />
              </div>
            ) : topUpLogs.length === 0 ? (
              <EmptyState />
            ) : (
              <table className="w-full text-sm text-left rtl:text-right text-body">
                <thead className="border-b border-gray-300 bg-gray-100">
                  <tr>
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
                      Date and Time
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topUpLogs.map((item) => {
                    const dateTime = item.processedAt instanceof Date ? item.processedAt : new Date(item.processedAt);
                    const formattedDateTime = dateTime.toLocaleString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    });
                    
                    return (
                      <tr key={item.id} className="border-b border-gray-300">
                        <td scope="row" className="px-6 py-4">
                          {item.userName}
                        </td>
                        <td className="px-6 py-4">{item.userId}</td>
                        <td className="px-6 py-4 flex">
                          <div className={`text-xs px-4 py-1 rounded-full text-white ${
                            item.status === "approved" ? "bg-green-500" : "bg-red-500"
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
                          {formattedDateTime}
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
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* pending request modal (Conditionally Rendered) */}
      {selectedRequest && !showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-start lg:items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-lg flex flex-col gap-6 mt-2 mb-2">
            {/* close button */}
            <button
              onClick={closeAllModals}
              className="p-2 cursor-pointer rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 text-gray-500 absolute top-2 sm:top-3 right-2 sm:right-3"
            >
              <X className="size-4 sm:size-5" />
            </button>
            {/* header */}
            <div className="flex flex-col gap-4 items-center justify-center py-2">
              <div className="rounded-full p-3 bg-yellow-400 shadow-yellow-500">
                <BanknoteArrowUp className="size-6 sm:size-7" />
              </div>

              <div className="flex flex-col text-center">
                <span className="text-base sm:text-lg font-semibold text-yellow-500">
                  Pending Request
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  {selectedRequest.date} {selectedRequest.time || ""}
                </span>
              </div>
            </div>

            {/* name + amount */}
            <div className="flex py-2 items-center">
              <div className="flex flex-1 flex-col">
                <span className="font-semibold">{selectedRequest.name}</span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  RFID No. {selectedRequest.rfid}
                </span>
              </div>

              <div className="flex items-center gap-1 text-green-500">
                <Plus className="size-5 sm:size-6" />
                <span className="text-xl sm:text-2xl font-semibold">
                  {selectedRequest.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* transaction details */}
            <div className="flex flex-col gap-3">
              <span className="text-xs sm:text-sm font-semibold text-gray-500">
                Transaction Details
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1 flex flex-col p-3 rounded-lg border border-gray-300">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Transaction ID
                  </span>
                  <span className="font-semibold text-sm sm:text-base">
                    {formatTransactionId(selectedRequest.documentId)}
                  </span>
                </div>

                <div className="col-span-1 flex flex-col p-3 rounded-lg border border-gray-300">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Payment Method
                  </span>
                  <span className="font-semibold text-sm sm:text-base">
                    {selectedRequest.paymentMethod}
                  </span>
                </div>

                <div className="col-span-2 flex flex-col p-3 rounded-lg border border-gray-300">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Reference Number
                  </span>
                  <span className="font-semibold text-sm sm:text-base">
                    {selectedRequest.referenceNumber}
                  </span>
                </div>

                <div className="col-span-2 flex flex-col rounded-lg mb-2 gap-2">
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

              {/* buttons */}
              <div className="flex gap-2 items-center w-full">
                <button
                  onClick={() => handleReject(selectedRequest)}
                  disabled={processing}
                  className="rounded-lg w-full cursor-pointer px-4 py-2 border border-red-500 bg-red-500 text-white hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>

                <button 
                  onClick={handleApprove}
                  disabled={processing}
                  className="rounded-lg w-full cursor-pointer px-4 py-2 border border-green-500 bg-green-500 text-white hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Processing..." : "Approve"}
                </button>
              </div>
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
    </div>
  );
}
