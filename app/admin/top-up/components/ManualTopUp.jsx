"use client";

import {
  BanknoteArrowUp,
  CircleAlert,
  CircleCheckBig,
  UserX,
  Users,
  ChevronDown,
  UserRound,
  ChevronLeft,
  ChevronRight,
  Radio,
} from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "../../../../firebase";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, increment, setDoc, serverTimestamp, orderBy } from "firebase/firestore";

export default function ManualTopUp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [totalTopUps, setTotalTopUps] = useState(0);
  const [topUpsLoading, setTopUpsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("search"); // "search" or "topups"
  const [manualTopUps, setManualTopUps] = useState([]);
  const [topUpsListLoading, setTopUpsListLoading] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState("all"); // "all", "Cash", "Gcash", "Maya", "Maribank", "GoTyme"
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});
  const [showGlobalError, setShowGlobalError] = useState(false);

  // NFC Reading states
  const [nfcModal, setNfcModal] = useState(false);
  const [isNfcClosing, setIsNfcClosing] = useState(false);
  const [isNfcOpening, setIsNfcOpening] = useState(false);
  const [isReadingNfc, setIsReadingNfc] = useState(false);
  const [nfcResult, setNfcResult] = useState(null); // "success" or "error"
  const [nfcMessage, setNfcMessage] = useState("");
  const [showNfcResult, setShowNfcResult] = useState(false);

  const paymentMethod = [
    { id: 1, method: "Cash" },
    { id: 2, method: "Gcash" },
    { id: 3, method: "Maya" },
    { id: 4, method: "Maribank" },
    { id: 5, method: "GoTyme" },
  ];

  // Get prefix for payment method
  const getPaymentPrefix = (paymentMethod) => {
    switch (paymentMethod) {
      case "Gcash":
        return "GCASH";
      case "Maya":
        return "MAYA";
      case "Maribank":
        return "MARI";
      case "GoTyme":
        return "GOTYME";
      default:
        return "";
    }
  };

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

  // Fetch total manual top-ups count
  useEffect(() => {
    const fetchTotalTopUps = async () => {
      try {
        setTopUpsLoading(true);
        const manualTopUpRef = collection(db, "manual_topup");
        const querySnapshot = await getDocs(manualTopUpRef);
        setTotalTopUps(querySnapshot.size);
      } catch (error) {
        console.error("Error fetching total manual top-ups:", error);
        setTotalTopUps(0);
      } finally {
        setTopUpsLoading(false);
      }
    };

    fetchTotalTopUps();
  }, []);

  // Fetch manual top-ups list
  useEffect(() => {
    const fetchManualTopUps = async () => {
      if (viewMode !== "topups") return;
      
      try {
        setTopUpsListLoading(true);
        const manualTopUpRef = collection(db, "manual_topup");
        let querySnapshot;
        try {
          const q = query(manualTopUpRef, orderBy("requestedAt", "desc"));
          querySnapshot = await getDocs(q);
        } catch (error) {
          console.warn("OrderBy failed for manual_topup, using simple query:", error);
          querySnapshot = await getDocs(manualTopUpRef);
        }

        const topUpsData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const requestedAt = data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : new Date());
          
          topUpsData.push({
            id: doc.id,
            documentId: doc.id,
            name: data.userName || "",
            rfid: data.userId || "",
            amount: data.amount || 0,
            paymentMethod: data.paymentMethod || "",
            referenceId: data.referenceId || "",
            transactionId: formatTransactionId(doc.id),
            datetime: requestedAt,
          });
        });
        
        // Sort by datetime descending
        topUpsData.sort((a, b) => {
          const dateA = a.datetime instanceof Date ? a.datetime : new Date(a.datetime);
          const dateB = b.datetime instanceof Date ? b.datetime : new Date(b.datetime);
          return dateB - dateA;
        });
        
        setManualTopUps(topUpsData);
      } catch (error) {
        console.error("Error fetching manual top-ups:", error);
      } finally {
        setTopUpsListLoading(false);
      }
    };

    fetchManualTopUps();
  }, [viewMode]);

  // Fetch all users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      const startTime = Date.now();
      try {
        setSearchLoading(true);
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        
        const usersData = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          usersData.push({
            id: doc.id,
            rfid: doc.id, // Document ID is the RFID
            name: userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown",
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            balance: userData.balance || 0,
            email: userData.email || "",
          });
        });
        
        setAllUsers(usersData);

        // Ensure minimum 0.65 second loading time for smooth transition
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 650; // 0.65 seconds
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        
        // Ensure minimum loading time even on error
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 650;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } finally {
        setSearchLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // DEBOUNCE LOGIC
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

  // REAL-TIME FILTERING
  useEffect(() => {
    if (!effectiveQuery) {
      setFilteredUsers([]);
      return;
    }

    // Split by comma and trim each query
    const queries = effectiveQuery.split(',').map(q => q.trim()).filter(q => q.length > 0);
    
    const filtered = allUsers.filter((user) => {
      // Check if user matches any of the comma-separated queries
      return queries.some((q) => {
        const queryLower = q.toLowerCase();
        return (
          user.name.toLowerCase().startsWith(queryLower) ||
          user.rfid?.toLowerCase().startsWith(queryLower) ||
          user.email?.toLowerCase().startsWith(queryLower) ||
          user.lastName?.toLowerCase().startsWith(queryLower) ||
          user.firstName?.toLowerCase().startsWith(queryLower)
        );
      });
    });

    setFilteredUsers(filtered);
  }, [effectiveQuery, allUsers]);

  // OPEN MODAL
  const openFormModal = async (user) => {
    try {
      setIsClosing(false); // Reset closing state when opening
      setIsOpening(false); // Start in initial position
      
      // Fetch latest user data to get current balance
      const userDocRef = doc(db, "users", user.rfid);
      const userDocSnap = await getDoc(userDocRef);
      
      let userData;
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        userData = {
          ...user,
          balance: data.balance || 0,
          name: data.fullName || user.name,
        };
      } else {
        userData = user;
      }
      
      setSelectedUser(userData);
      
      // Trigger opening animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpening(true);
        });
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      setSelectedUser(user);
      // Trigger opening animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpening(true);
        });
      });
    }
  };

  // CLOSE MODAL with animation
  const closeFormModal = () => {
    if (isClosing) return; // Prevent multiple close calls
    setIsOpening(false); // Stop opening animation
    setIsClosing(true);
    setTimeout(() => {
      setSelectedUser(null);
      setAmount("");
      setMethod("Cash");
      setReference("");
      setNote("");
      setErrors({});
      setShowGlobalError(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  // Clear search handler
  const handleClear = () => {
    setSearchQuery("");
    setDebouncedQuery("");
  };

  // Open NFC Modal
  const openNfcModal = () => {
    setIsNfcClosing(false);
    setIsNfcOpening(false);
    setNfcResult(null);
    setNfcMessage("");
    setShowNfcResult(false);
    setIsReadingNfc(false);
    setNfcModal(true);
    
    // Check NFC support immediately
    const supportCheck = checkNfcSupport();
    if (!supportCheck.supported) {
      setNfcResult("error");
      setNfcMessage(supportCheck.message);
      setShowNfcResult(true);
    }
    
    // Trigger opening animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsNfcOpening(true);
      });
    });
  };

  // Close NFC Modal
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
    // First check if we're on HTTPS or localhost (required for Web NFC) - this is the most common issue
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
        
        // Close NFC modal after a short delay, then open user modal if found
        setTimeout(() => {
          closeNfcModal();
          
          // After closing NFC modal, find and open the user modal
          setTimeout(() => {
            // Find the user in allUsers by RFID (case-insensitive)
            const foundUser = allUsers.find(user => 
              user.rfid?.toUpperCase() === cleanedRfid.toUpperCase()
            );
            
            if (foundUser) {
              // Open the manual top-up modal for the found user
              openFormModal(foundUser);
            }
          }, 350); // Wait for NFC modal to fully close
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

  // Stop NFC Reading
  const stopNfcReading = () => {
    setIsReadingNfc(false);
    // Note: NDEFReader doesn't have a direct stop method, but we can close the modal
    closeNfcModal();
  };

  // Auto-generate reference number when Cash is selected or set prefix for other methods
  useEffect(() => {
    const generateUniqueCashReference = async () => {
      if (method === "Cash") {
        let newReference;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;
        
        // Generate a unique reference number
        while (!isUnique && attempts < maxAttempts) {
          newReference = "CASH-" + Math.floor(100000 + Math.random() * 900000);
          const checkDocRef = doc(db, "manual_topup", newReference);
          const checkDoc = await getDoc(checkDocRef);
          
          if (!checkDoc.exists()) {
            isUnique = true;
            setReference(newReference);
          }
          attempts++;
        }
        
        // If couldn't find unique after max attempts, just set the last generated one
        if (!isUnique) {
          setReference(newReference || "CASH-" + Math.floor(100000 + Math.random() * 900000));
        }
      } else {
        // For non-Cash methods, set the prefix with a dash (fixed prefix)
        const prefix = getPaymentPrefix(method);
        if (prefix) {
          // Always set to prefix + dash, user will type after it
          setReference(prefix + "-");
        } else {
          setReference("");
        }
      }
    };
    
    generateUniqueCashReference();
  }, [method]);

  // Handle reference number input - prefix is fixed and cannot be deleted
  const handleReferenceChange = (e) => {
    if (method === "Cash") {
      // Cash is auto-generated, don't allow manual input
      return;
    }
    
    const inputValue = e.target.value;
    const prefix = getPaymentPrefix(method);
    
    if (!prefix) {
      setReference(inputValue);
      return;
    }
    
    const prefixWithDash = prefix + "-";
    
    // If user tries to delete the prefix, prevent it
    if (inputValue.length < prefixWithDash.length || !inputValue.startsWith(prefixWithDash)) {
      // Restore the prefix
      setReference(prefixWithDash);
      return;
    }
    
    // Allow user to type after the prefix
    setReference(inputValue);
  };

  // Handle keydown to prevent deletion of prefix
  const handleReferenceKeyDown = (e) => {
    if (method === "Cash") return;
    
    const prefix = getPaymentPrefix(method);
    if (!prefix) return;
    
    const prefixWithDash = prefix + "-";
    
    // If cursor is at the start or within the prefix, prevent deletion
    const input = e.target;
    const cursorPosition = input.selectionStart;
    
    if (cursorPosition <= prefixWithDash.length) {
      // If backspace or delete is pressed within the prefix area
      if (e.key === "Backspace" && cursorPosition > 0) {
        e.preventDefault();
        // Keep cursor at the end of prefix
        setTimeout(() => {
          input.setSelectionRange(prefixWithDash.length, prefixWithDash.length);
        }, 0);
      } else if (e.key === "Delete" && cursorPosition < prefixWithDash.length) {
        e.preventDefault();
      } else if (e.key === "ArrowLeft" && cursorPosition <= prefixWithDash.length) {
        // Prevent moving cursor left of the prefix
        e.preventDefault();
        input.setSelectionRange(prefixWithDash.length, prefixWithDash.length);
      }
    }
  };

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

      // Check if reference number already exists
      const manualTopUpDocRef = doc(db, "manual_topup", reference);
      const existingDoc = await getDoc(manualTopUpDocRef);
      
      if (existingDoc.exists()) {
        alert("This reference number already exists. Please use a different reference number.");
        setProcessing(false);
        return;
      }

      // Create manual_topup document in Firestore with reference number as document ID
      await setDoc(manualTopUpDocRef, {
        amount: Number(amount),
        paymentMethod: method,
        processedAt: serverTimestamp(),
        referenceId: reference,
        requestedAt: serverTimestamp(),
        status: "approved",
        type: "manual",
        userEmail: selectedUser.email || "",
        userId: selectedUser.rfid,
        userName: selectedUser.name,
      });

      // Update user balance in Firestore
      const userRef = doc(db, "users", selectedUser.rfid);
      await updateDoc(userRef, {
        balance: increment(Number(amount)),
      });

      // Format transaction ID from document ID (reference number)
      const transactionId = formatTransactionId(reference);

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

      // Refresh total top-ups count
      const manualTopUpCollection = collection(db, "manual_topup");
      const refreshQuerySnapshot = await getDocs(manualTopUpCollection);
      setTotalTopUps(refreshQuerySnapshot.size);
      
      // Refresh manual top-ups list if in topups view mode
      if (viewMode === "topups") {
        const refreshTopUpsData = [];
        refreshQuerySnapshot.forEach((doc) => {
          const data = doc.data();
          const requestedAt = data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : new Date());
          
          refreshTopUpsData.push({
            id: doc.id,
            documentId: doc.id,
            name: data.userName || "",
            rfid: data.userId || "",
            amount: data.amount || 0,
            paymentMethod: data.paymentMethod || "",
            referenceId: data.referenceId || "",
            transactionId: formatTransactionId(doc.id),
            datetime: requestedAt,
          });
        });
        
        refreshTopUpsData.sort((a, b) => {
          const dateA = a.datetime instanceof Date ? a.datetime : new Date(a.datetime);
          const dateB = b.datetime instanceof Date ? b.datetime : new Date(b.datetime);
          return dateB - dateA;
        });
        
        setManualTopUps(refreshTopUpsData);
      }

      // Show success modal
      setShowSuccess(true);

      // Reset form and close modal after success
      setTimeout(() => {
        setAmount("");
        setMethod("Cash");
        setReference("");
        setNote("");
        setErrors({});
        setShowGlobalError(false);
        setShowSuccess(false);
        setProcessing(false);
        closeFormModal(); // Close the modal after success
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

  // Empty State for No Search Results (when search query exists)
  const EmptySearchState = () => (
    <div className="flex flex-col gap-2 items-center justify-center p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-100 lg:bg-gray-50 w-full">
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center justify-center p-4 rounded-full bg-gray-300 text-gray-600">
          <UserX className="size-7 sm:size-8" />
        </div>
      </div>
      <div className="flex flex-col text-center pb-2">
        <span className="text-base sm:text-lg font-semibold">
          User Not Found
        </span>
        <span className="text-gray-500">There is no user found</span>
      </div>
    </div>
  );

  // Empty State for No Search Query Yet
  const EmptySearchPromptState = () => (
    <div className="flex flex-col gap-2 items-center justify-center p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-100 lg:bg-gray-50 w-full">
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center justify-center p-4 rounded-full bg-gray-300 text-gray-600">
          <Users className="size-7 sm:size-8" />
        </div>
      </div>
      <div className="flex flex-col text-center pb-2">
        <span className="text-base sm:text-lg font-semibold">
          Search for Users
        </span>
        <span className="text-gray-500">Start typing in the search field to find users</span>
      </div>
    </div>
  );

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Total Manual Top-ups Skeleton */}
      <div className="flex relative rounded-2xl overflow-hidden bg-gradient-to-r from-green-500 via-green-400 to-green-500 p-5 text-white animate-pulse">
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-8 sm:h-10 w-16 bg-green-600/50 rounded"></div>
          <div className="h-4 w-48 bg-green-600/50 rounded"></div>
          <div className="h-3 w-32 bg-green-600/50 rounded"></div>
        </div>
        
        {/* Icon Skeleton - Positioned at right edge, vertically centered */}
        <div className="absolute top-1/2 -translate-y-1/2 right-[60px] sm:right-[80px] rounded-full p-3 bg-green-600/40">
          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-green-700/50 rounded-full"></div>
        </div>
        
        {/* Tab Switcher Button Skeleton - Full Height at Rightmost Edge */}
        <div className="absolute top-0 right-0 bottom-0 rounded-tr-2xl rounded-br-2xl px-4 sm:px-6 flex items-center justify-center bg-green-600/40">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-700/50 rounded"></div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-col gap-4">
        {/* Search Bar Skeleton */}
        <form className="flex">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between mt-4">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </form>

        {/* Search Results Cards Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
          
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-gray-300 flex items-center animate-pulse"
              >
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="h-5 w-32 bg-gray-200 rounded"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-1 gap-4 relative">
      {/* Skeleton Loader with fade transition */}
      <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${
        searchLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        <SkeletonLoader />
      </div>
      
      {/* Content with fade transition */}
      <div className={`transition-opacity duration-500 ${
        searchLoading ? "opacity-0" : "opacity-100"
      }`}>
        {/* Total Manual Top-ups Card */}
        <div className="flex relative rounded-2xl overflow-hidden bg-linear-to-r from-green-500 via-green-400 to-green-500 p-5 text-white">
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-2xl sm:text-3xl font-bold">
              {topUpsLoading ? "..." : totalTopUps}
            </span>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-semibold text-white">
                Total Manual Top-ups
              </span>
              <span className="text-xs text-gray-100">
                As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
          
          {/* Icon - Positioned at right edge, vertically centered */}
          <div className="absolute top-1/2 -translate-y-1/2 right-[60px] sm:right-[80px] rounded-full p-3 shadow-600/40 bg-green-600/40 shadow-green-600/40">
            <BanknoteArrowUp className="size-6 sm:size-7" />
          </div>
          
          {/* Tab Switcher Button - Full Height at Rightmost Edge */}
          <button
            onClick={() => {
              if (viewMode === "search") {
                setViewMode("topups");
                setCurrentPage(1);
              } else {
                setViewMode("search");
                setCurrentPage(1);
              }
            }}
            className="absolute top-0 right-0 bottom-0 rounded-tr-2xl rounded-br-2xl px-4 sm:px-6 flex items-center justify-center transition-colors duration-150 bg-green-600/40 hover:bg-green-600/50 active:bg-green-600/60 cursor-pointer"
          >
            <ChevronRight className="size-5 sm:size-6 text-white" />
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex flex-col gap-4">
          {viewMode === "search" ? (
            <>
              {/* SEARCH BAR */}
              <form className="flex">
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between mt-4">
                    <label className="text-xs sm:text-sm font-semibold text-gray-500">
                      Search users
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
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                      }}
                    />

                    {searchQuery.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="absolute px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-100/90 active:bg-gray-200 cursor-pointer transition-colors duration-150 top-2 right-2 text-xs"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {/* SEARCH RESULTS */}
              <div className="flex flex-col gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-500 mt-2">
                  List of Users
                </span>
                
                <div className="flex flex-col gap-3">
                  {searchLoading ? (
                    <div className="flex flex-col gap-4 items-center justify-center p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-100 lg:bg-gray-50">
                      <div className="flex items-center justify-center pt-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                      </div>
                      <div className="flex flex-col text-center pb-2">
                        <span className="font-semibold">Loading...</span>
                      </div>
                    </div>
                  ) : searchQuery.length === 0 ? (
                    <EmptySearchPromptState />
                  ) : filteredUsers.length === 0 ? (
                    <EmptySearchState />
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => openFormModal(user)}
                        className="p-5 cursor-pointer rounded-2xl border border-gray-300 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
                      >
                        <div className="flex flex-1 text-left flex-col gap-3">
                          <div className="flex flex-col">
                            <span className="font-semibold">{user.name}</span>
                            <span className="text-xs sm:text-sm text-gray-500">
                              RFID No: {user.rfid}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <div className="flex items-center px-4 py-1 rounded-full text-xs text-white bg-green-500">
                            <span>Select</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* MANUAL TOP-UPS LIST */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-500 mt-2">
                    All Manual Top-ups
                  </span>
                  
                  {/* Payment Method Filter Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setPaymentFilter("all");
                        setCurrentPage(1); // Reset to first page when filter changes
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        paymentFilter === "all"
                          ? "bg-green-500 text-white border border-green-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    {paymentMethod.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setPaymentFilter(item.method);
                          setCurrentPage(1); // Reset to first page when filter changes
                        }}
                        className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                          paymentFilter === item.method
                            ? "bg-green-500 text-white border border-green-500"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                        }`}
                      >
                        {item.method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtered top-ups */}
                {(() => {
                  const filteredTopUps = paymentFilter === "all" 
                    ? manualTopUps 
                    : manualTopUps.filter(topup => topup.paymentMethod === paymentFilter);
                  
                  // Pagination calculations
                  const totalPages = Math.max(1, Math.ceil(filteredTopUps.length / itemsPerPage));
                  const indexStart = (currentPage - 1) * itemsPerPage;
                  const paginatedTopUps = filteredTopUps.slice(indexStart, indexStart + itemsPerPage);

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
                  
                  return filteredTopUps.length === 0 ? (
                  <div className="flex flex-col gap-2 items-center justify-center p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-100 lg:bg-gray-50 w-full">
                    <div className="flex items-center justify-center py-2">
                      <div className="flex items-center justify-center p-4 rounded-full bg-gray-300 text-gray-600">
                        <BanknoteArrowUp className="size-7 sm:size-8" />
                      </div>
                    </div>
                    <div className="flex flex-col text-center pb-2">
                      <span className="text-base sm:text-lg font-semibold">
                        {paymentFilter === "all" 
                          ? "No Manual Top-ups"
                          : `No manual top-ups with ${paymentFilter}`
                        }
                      </span>
                      <span className="text-gray-500">
                        {paymentFilter === "all"
                          ? "There are no manual top-ups yet"
                          : `There are no manual top-ups with ${paymentFilter} payment method`
                        }
                      </span>
                    </div>
                  </div>
                  ) : (
                    <>
                      {/* MOBILE VIEW - Cards */}
                      <div className="flex xl:hidden flex-col gap-3">
                        {paginatedTopUps.map((topup) => (
                        <div
                          key={topup.id}
                          className="p-5 rounded-2xl border border-gray-300 flex flex-col gap-3"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-xs sm:text-sm font-medium text-green-600">
                              Reference: {topup.referenceId}
                            </span>
                            <span className="font-semibold">{topup.name}</span>
                            <span className="text-xs sm:text-sm text-gray-500">
                              RFID No: {topup.rfid}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-gray-500">Amount</span>
                              <span className="font-semibold text-green-600">
                                ₱{topup.amount?.toLocaleString() || "0.00"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <span className="text-xs text-gray-500">Date</span>
                              <span className="text-xs sm:text-sm">
                                {topup.datetime.toLocaleDateString('en-US')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-gray-500">Payment Method</span>
                              <span className="text-xs sm:text-sm font-medium">
                                {topup.paymentMethod}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* DESKTOP VIEW - Table */}
                    <div className="hidden xl:flex rounded-2xl overflow-hidden border border-gray-300 w-full">
                      <table className="w-full text-sm text-left text-body">
                        <thead className="border-b border-gray-300 bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 font-medium">Reference</th>
                            <th className="px-6 py-3 font-medium">Name</th>
                            <th className="px-6 py-3 font-medium">RFID No.</th>
                            <th className="px-6 py-3 font-medium">Amount</th>
                            <th className="px-6 py-3 font-medium">Payment Method</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedTopUps.map((topup) => (
                            <tr key={topup.id} className="border-b border-gray-300">
                              <td className="px-6 py-4 font-medium">{topup.referenceId}</td>
                              <td className="px-6 py-4">{topup.name}</td>
                              <td className="px-6 py-4">{topup.rfid}</td>
                              <td className="px-6 py-4 text-green-600 font-semibold">
                                ₱{topup.amount?.toLocaleString() || "0.00"}
                              </td>
                              <td className="px-6 py-4">{topup.paymentMethod}</td>
                              <td className="px-6 py-4">
                                {topup.datetime.toLocaleDateString('en-US')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* PAGINATION */}
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
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* =========================== */}
      {/* MANUAL TOP-UP FORM MODAL */}
      {/* =========================== */}

      {selectedUser && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
            isClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeFormModal}
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
              onClick={closeFormModal}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD - Matching Total Users Card Design */}
            <div className="flex relative rounded-t-2xl p-4 sm:p-5 text-white bg-linear-to-r from-green-500 via-green-400 to-green-500">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold">
                  {selectedUser.name}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    RFID No. {selectedUser.rfid}
                  </span>
                  <span className="text-xs text-gray-100">
                    Manual Top-up
                  </span>
                </div>
              </div>
              <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-green-600/40 shadow-green-600/40">
                <UserRound className="size-5 sm:size-6" />
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              {/* User Info Card - Compact Design */}
              <div className="flex flex-col gap-3 p-4 rounded-lg border border-gray-300 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs sm:text-sm text-gray-500">Current Balance</span>
                    <span className="font-semibold text-base text-green-600">
                      ₱{selectedUser.balance?.toLocaleString() || "0.00"}
                    </span>
                  </div>
                </div>
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
                    onChange={handleReferenceChange}
                    onKeyDown={handleReferenceKeyDown}
                    onFocus={(e) => {
                      // When focused, move cursor to end of prefix if it's within the prefix area
                      if (method !== "Cash") {
                        const prefix = getPaymentPrefix(method);
                        if (prefix) {
                          const prefixWithDash = prefix + "-";
                          const cursorPosition = e.target.selectionStart;
                          if (cursorPosition < prefixWithDash.length) {
                            setTimeout(() => {
                              e.target.setSelectionRange(prefixWithDash.length, prefixWithDash.length);
                            }, 0);
                          }
                        }
                      }
                    }}
                    placeholder={
                      method === "Cash"
                        ? "Auto-generated"
                        : `Enter complete reference (e.g., ${getPaymentPrefix(method)}-1234567890)`
                    }
                    className={
                      method === "Cash"
                        ? "px-3 sm:px-4 py-2 w-full border border-gray-300 bg-gray-100 outline-none rounded-lg placeholder:text-gray-500 transition-colors duration-150"
                        : fieldClass(errors.reference)
                    }
                  />
                  {method !== "Cash" && getPaymentPrefix(method) && (
                    <span className="text-xs text-gray-500">
                      Format: {getPaymentPrefix(method)}-XXXXXXXXXX (prefix is fixed)
                    </span>
                  )}
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
                <div className="flex gap-2 items-center justify-end w-full mt-2">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 cursor-pointer"
                  >
                    Discard
                  </button>

                  <button 
                    type="submit"
                    disabled={processing}
                    className="bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? "Processing..." : "Confirm"}
                  </button>
                </div>
              </form>
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

      {/* NFC Reading Modal */}
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
                      onClick={stopNfcReading}
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
