"use client";

import {
  LayoutDashboard,
  Clock,
  DollarSign,
  History,
  User,
  LogOut,
  Menu,
  X,
  Radio,
  Wifi,
  TrendingUp,
  Package,
  Settings,
  Plus,
  BanknoteArrowUp,
  CheckCircle,
  ChevronDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  CircleStop,
  TimerOff,
  Loader2,
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, db, storage, onAuthStateChanged } from "../../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment, serverTimestamp, setDoc, orderBy, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import SettingsTab from "./components/tabs/SettingsTab";
import ProfileTab from "./components/tabs/ProfileTab";

// Loading fallback component
function DashboardLoading() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <span className="text-gray-600">Loading dashboard...</span>
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRemaining, setTimeRemaining] = useState(0); // Time remaining in seconds
  
  // Billing and purchase state
  const [billingRatePerMinute, setBillingRatePerMinute] = useState(0.175);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [isPurchaseConfirmOpening, setIsPurchaseConfirmOpening] = useState(false);
  const [isPurchaseConfirmClosing, setIsPurchaseConfirmClosing] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [isPurchaseSuccessOpening, setIsPurchaseSuccessOpening] = useState(false);
  const [isPurchaseSuccessClosing, setIsPurchaseSuccessClosing] = useState(false);
  const [showPurchaseError, setShowPurchaseError] = useState(false);
  const [isPurchaseErrorOpening, setIsPurchaseErrorOpening] = useState(false);
  const [isPurchaseErrorClosing, setIsPurchaseErrorClosing] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  
  // Top-up state
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [isTopUpModalClosing, setIsTopUpModalClosing] = useState(false);
  const [isTopUpModalOpening, setIsTopUpModalOpening] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpReferenceId, setTopUpReferenceId] = useState("");
  const [topUpPaymentMethod, setTopUpPaymentMethod] = useState("GCASH");
  const [topUpReceipt, setTopUpReceipt] = useState(null);
  const [topUpReceiptPreview, setTopUpReceiptPreview] = useState(null);
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [receiptPreviewLoading, setReceiptPreviewLoading] = useState(true);
  
  // Top-up history state
  const [topUpHistory, setTopUpHistory] = useState([]);
  const [topUpHistoryLoading, setTopUpHistoryLoading] = useState(false);
  const [selectedTopUpRequest, setSelectedTopUpRequest] = useState(null);
  const [topUpHistorySearchQuery, setTopUpHistorySearchQuery] = useState("");
  const [topUpHistoryPage, setTopUpHistoryPage] = useState(1);
  const [topUpHistoryFilter, setTopUpHistoryFilter] = useState("all"); // "all", "requests", "manual"
  const [topUpHistoryStatusFilter, setTopUpHistoryStatusFilter] = useState("all"); // "all", "pending", "approved", "rejected"
  const topUpHistoryItemsPerPage = 10;
  
  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionsSearchQuery, setTransactionsSearchQuery] = useState("");
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsFilter, setTransactionsFilter] = useState("all"); // "all", "pack1", "pack2", "pack3", "pack4"
  const transactionsItemsPerPage = 10;
  
  // End session state
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const [showEndSessionSuccess, setShowEndSessionSuccess] = useState(false);
  const [showEndSessionError, setShowEndSessionError] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [endSessionError, setEndSessionError] = useState("");
  const [savedTimeMinutes, setSavedTimeMinutes] = useState(0);
  
  // Payment Methods Configuration
  const PAYMENT_METHODS = {
    MAYA: {
      number: "09266301717",
      name: "Sonny S.",
      prefix: "MAYA"
    },
    GCASH: {
      number: "09266301717",
      name: "Sonny S.",
      prefix: "GCASH"
    },
    MARIBANK: {
      number: "1963 708 5042",
      name: "SONNY SARCIA",
      prefix: "MARI"
    },
    GOTYME: {
      number: "0142 0666 6695",
      name: "SONNY SARCIA",
      prefix: "GOTYME"
    }
  };

  // Fetch billing rate
  useEffect(() => {
    const fetchBillingRate = async () => {
      try {
        const configDocRef = doc(db, "system_config", "global_settings");
        const configSnap = await getDoc(configDocRef);
        
        if (configSnap.exists()) {
          const config = configSnap.data();
          setBillingRatePerMinute(config.billingRatePerMinute || 0.175);
        }
      } catch (error) {
        console.error("Error fetching billing rate:", error);
      }
    };
    
    fetchBillingRate();
  }, []);

  // Check authentication and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user data from Firestore using authUid (document ID is RFID)
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("authUid", "==", currentUser.uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Get the first matching document
            const userDoc = querySnapshot.docs[0];
            const userDataObj = userDoc.data();
            // Include the document ID (RFID) in the user data
            setUserData({
              ...userDataObj,
              rfidCardId: userDoc.id, // Document ID is the RFID
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
        setLoading(false);
      } else {
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Calculate and update time remaining
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = Date.now();
      
      // Check if there's an active session (sessionEndTime > now)
      if (userData?.sessionEndTime) {
        const sessionEndTime = userData.sessionEndTime;
        let endTime = null;
        
        if (sessionEndTime instanceof Date) {
          endTime = sessionEndTime.getTime();
        } else if (typeof sessionEndTime === 'number') {
          endTime = sessionEndTime;
        } else if (sessionEndTime && typeof sessionEndTime.toMillis === 'function') {
          endTime = sessionEndTime.toMillis();
        }
        
        // If there's an active session (endTime > now), calculate remaining time
        if (endTime && endTime > now) {
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          setTimeRemaining(remaining);
          return;
        }
      }
      
      // No active session - check for saved time (time that was saved when session ended)
      // This time should NOT be deducting, it's just stored for the next session
      if (userData?.savedRemainingTimeSeconds && userData.savedRemainingTimeSeconds > 0) {
        // Display saved time without deducting it
        setTimeRemaining(userData.savedRemainingTimeSeconds);
        return;
      }
      
      // No active session and no saved time
      setTimeRemaining(0);
    };

    // Update immediately
    updateTimeRemaining();

    // Update every second (but only deduct if there's an active session)
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [userData?.sessionEndTime, userData?.savedRemainingTimeSeconds]);

  // Fetch top-up history for the current user (both topup_requests and manual_topup)
  useEffect(() => {
    const fetchTopUpHistory = async () => {
      if (activeTab !== "topup-history" || !userData?.rfidCardId) {
        console.log("⏸️ Skipping fetch - activeTab:", activeTab, "rfidCardId:", userData?.rfidCardId);
        return;
      }
      
      console.log("🔍 Fetching top-up history for user:", userData.rfidCardId);
      
      try {
        setTopUpHistoryLoading(true);
        const history = [];
        
        // Fetch top-up requests
        const topUpRequestsRef = collection(db, "topup_requests");
        let querySnapshot;
        try {
          const q = query(
            topUpRequestsRef,
            where("userId", "==", userData.rfidCardId),
            orderBy("requestedAt", "desc")
          );
          querySnapshot = await getDocs(q);
        } catch (error) {
          console.warn("OrderBy failed for topup_requests, using simple query:", error);
          const q = query(
            topUpRequestsRef,
            where("userId", "==", userData.rfidCardId)
          );
          querySnapshot = await getDocs(q);
        }
        
        console.log("📋 Found", querySnapshot.size, "top-up requests");
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("📄 Request doc:", doc.id, "userId:", data.userId);
          history.push({
            id: doc.id,
            documentId: doc.id,
            type: "request", // Mark as request type
            amount: data.amount || 0,
            status: data.status || "",
            paymentMethod: data.paymentMethod || "",
            referenceId: data.referenceId || "",
            receiptURL: data.receiptURL || "",
            requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : new Date()),
            processedAt: data.processedAt?.toDate ? data.processedAt.toDate() : (data.processedAt ? new Date(data.processedAt) : null),
          });
        });
        
        // Fetch manual top-ups
        const manualTopUpRef = collection(db, "manual_topup");
        let manualQuerySnapshot;
        try {
          const q = query(
            manualTopUpRef,
            where("userId", "==", userData.rfidCardId),
            orderBy("requestedAt", "desc")
          );
          manualQuerySnapshot = await getDocs(q);
        } catch (error) {
          console.warn("OrderBy failed for manual_topup, using simple query:", error);
          const q = query(
            manualTopUpRef,
            where("userId", "==", userData.rfidCardId)
          );
          manualQuerySnapshot = await getDocs(q);
        }
        
        console.log("📋 Found", manualQuerySnapshot.size, "manual top-ups");
        manualQuerySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("📄 Manual doc:", doc.id, "userId:", data.userId);
          history.push({
            id: doc.id,
            documentId: doc.id,
            type: "manual", // Mark as manual type
            amount: data.amount || 0,
            status: "approved", // Manual top-ups are always approved
            paymentMethod: data.paymentMethod || "",
            referenceId: data.referenceId || "",
            receiptURL: data.receiptURL || "",
            requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : new Date()),
            processedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : (data.requestedAt ? new Date(data.requestedAt) : null), // Use requestedAt as processedAt for manual
            note: data.note || "",
          });
        });
        
        // Sort by requestedAt in descending order
        history.sort((a, b) => {
          const dateA = a.requestedAt instanceof Date ? a.requestedAt : new Date(a.requestedAt);
          const dateB = b.requestedAt instanceof Date ? b.requestedAt : new Date(b.requestedAt);
          return dateB - dateA;
        });
        
        setTopUpHistory(history);
        console.log("✅ Top-up history fetched:", history.length, "items");
      } catch (error) {
        console.error("❌ Error fetching top-up history:", error);
      } finally {
        setTopUpHistoryLoading(false);
      }
    };

    fetchTopUpHistory();
  }, [activeTab, userData?.rfidCardId]);

  // Fetch transactions for the current user
  useEffect(() => {
    const fetchTransactions = async () => {
      if (activeTab !== "transactions" || !userData?.rfidCardId) {
        console.log("⏸️ Skipping transactions fetch - activeTab:", activeTab, "rfidCardId:", userData?.rfidCardId);
        return;
      }
      
      console.log("🔍 Fetching transactions for user:", userData.rfidCardId);
      
      try {
        setTransactionsLoading(true);
        const transactionsRef = collection(db, "transactions");
        
        let querySnapshot;
        try {
          const q = query(
            transactionsRef,
            where("userId", "==", userData.rfidCardId),
            orderBy("timestamp", "desc")
          );
          querySnapshot = await getDocs(q);
        } catch (error) {
          console.warn("OrderBy failed for transactions, using simple query:", error);
          const q = query(
            transactionsRef,
            where("userId", "==", userData.rfidCardId)
          );
          querySnapshot = await getDocs(q);
        }
        
        const allTransactions = [];
        console.log("📋 Found", querySnapshot.size, "transactions");
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp ? new Date(data.timestamp) : new Date());
          
          // Determine package number from document ID
          let packageNumber = null;
          if (doc.id.startsWith("PACK1")) {
            packageNumber = 1;
          } else if (doc.id.startsWith("PACK2")) {
            packageNumber = 2;
          } else if (doc.id.startsWith("PACK3")) {
            packageNumber = 3;
          } else if (doc.id.startsWith("PACK4")) {
            packageNumber = 4;
          }
          
          allTransactions.push({
            id: doc.id,
            documentId: doc.id,
            amount: data.amount || 0,
            type: (data.type || "").trim(),
            description: data.description || "",
            minutesPurchased: data.minutesPurchased || 0,
            timestamp: timestamp,
            packageNumber: packageNumber,
            refunded: data.refunded || false,
            refundedTransactionId: data.refundedTransactionId || null,
          });
        });
        
        // Sort by timestamp in descending order
        allTransactions.sort((a, b) => {
          const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
          const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
          return dateB - dateA;
        });
        
        setTransactions(allTransactions);
        console.log("✅ Transactions fetched:", allTransactions.length, "items");
      } catch (error) {
        console.error("❌ Error fetching transactions:", error);
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, [activeTab, userData?.rfidCardId]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Generate random alphanumeric string for transaction ID
  const generateRandomAlphanumeric = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Get package number based on minutes
  const getPackageNumber = (minutes) => {
    const packageMap = {
      5: 1,
      10: 2,
      30: 3,
      60: 4,
    };
    return packageMap[minutes] || 1;
  };

  // Top-up handlers
  const openTopUpModal = () => {
    setIsTopUpModalClosing(false);
    setIsTopUpModalOpening(false);
    setShowTopUpModal(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsTopUpModalOpening(true);
      });
    });
  };

  const closeTopUpModal = () => {
    if (isTopUpModalClosing || isSubmittingTopUp) return;
    setIsTopUpModalOpening(false);
    setIsTopUpModalClosing(true);
    setTimeout(() => {
      setShowTopUpModal(false);
      setTopUpAmount("");
      setTopUpReferenceId("");
      setTopUpPaymentMethod("GCASH");
      setTopUpReceipt(null);
      setTopUpReceiptPreview(null);
      setShowReceiptPreview(false);
      setIsTopUpModalClosing(false);
      setTopUpSuccess(false);
    }, 300);
  };

  // Handle receipt file upload
  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setTopUpReceipt(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTopUpReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove uploaded receipt
  const handleRemoveReceipt = () => {
    setTopUpReceipt(null);
    setTopUpReceiptPreview(null);
    const fileInput = document.getElementById('receipt-upload-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle receipt preview click
  const handleReceiptPreviewClick = () => {
    if (topUpReceiptPreview) {
      setReceiptPreviewLoading(true);
      setShowReceiptPreview(true);
    }
  };

  // Close receipt preview
  const handleCloseReceiptPreview = () => {
    setShowReceiptPreview(false);
    setReceiptPreviewLoading(true);
  };

  // Handle receipt preview image load
  const handleReceiptPreviewImageLoad = () => {
    setReceiptPreviewLoading(false);
  };

  // Submit top-up request
  const handleSubmitTopUp = async () => {
    // Validation
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (!topUpReferenceId || topUpReferenceId.trim() === "") {
      alert(`Please enter the ${topUpPaymentMethod} reference ID`);
      return;
    }
    if (!topUpReceipt) {
      alert("Please attach your payment receipt");
      return;
    }
    if (!topUpPaymentMethod || !PAYMENT_METHODS[topUpPaymentMethod]) {
      alert("Please select a payment method");
      return;
    }

    setIsSubmittingTopUp(true);

    try {
      console.log("📤 Uploading receipt to Firebase Storage...");
      
      // 1. Upload receipt to Firebase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_${topUpReceipt.name}`;
      const storageRef = ref(storage, `receipts/${userData?.rfidCardId}/${fileName}`);
      
      const uploadResult = await uploadBytes(storageRef, topUpReceipt);
      console.log("✅ Receipt uploaded to Storage");
      
      // 2. Get the download URL
      const receiptURL = await getDownloadURL(uploadResult.ref);
      console.log("✅ Receipt URL:", receiptURL);
      
      // 3. Generate document ID: PAYMENT_METHOD_PREFIX-(reference number)
      const selectedMethod = PAYMENT_METHODS[topUpPaymentMethod];
      const documentId = `${selectedMethod.prefix}-${topUpReferenceId.trim()}`;
      
      // 4. Save top-up request to Firestore with custom document ID
      const topUpRequest = {
        userId: userData?.rfidCardId,
        userName: userData?.fullName || "Unknown",
        userEmail: userData?.email || user?.email || "N/A",
        amount: parseFloat(topUpAmount),
        referenceId: topUpReferenceId.trim(),
        receiptURL: receiptURL,
        receiptFileName: topUpReceipt.name,
        receiptStoragePath: `receipts/${userData?.rfidCardId}/${fileName}`,
        status: "pending",
        requestedAt: serverTimestamp(),
        paymentMethod: topUpPaymentMethod,
        type: "topup_request",
      };

      const requestDocRef = doc(db, "topup_requests", documentId);
      await setDoc(requestDocRef, topUpRequest);
      console.log("✅ Top-up request submitted with document ID:", documentId);

      // Show success state
      setTopUpSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setTopUpSuccess(false);
        closeTopUpModal();
        setTopUpAmount("");
        setTopUpReferenceId("");
        setTopUpPaymentMethod("GCASH");
        setTopUpReceipt(null);
        setTopUpReceiptPreview(null);
        setIsSubmittingTopUp(false);
      }, 2000);

    } catch (error) {
      console.error("❌ Error submitting top-up request:", error);
      
      if (error.code === 'storage/unauthorized') {
        alert("Failed to upload receipt. Storage permissions error. Please contact admin.");
      } else if (error.code === 'storage/quota-exceeded') {
        alert("Storage quota exceeded. Please contact admin.");
      } else {
        alert(`Failed to submit request: ${error.message}`);
      }
      
      setIsSubmittingTopUp(false);
    }
  };

  // Handle time package click
  const handleTimePackageClick = (minutes) => {
    const cost = minutes * billingRatePerMinute;
    const currentBalance = typeof userData?.balance === 'number' ? userData.balance : 0;
    
    if (currentBalance < cost) {
      setPurchaseMessage(`Insufficient balance! You need ₱${cost.toFixed(2)} but only have ₱${currentBalance.toFixed(2)}`);
      setIsPurchaseErrorClosing(false);
      setIsPurchaseErrorOpening(false);
      setShowPurchaseError(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPurchaseErrorOpening(true);
        });
      });
      return;
    }
    
    setSelectedMinutes(minutes);
    setIsPurchaseConfirmClosing(false);
    setIsPurchaseConfirmOpening(false);
    setShowPurchaseConfirm(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsPurchaseConfirmOpening(true);
      });
    });
  };

  // Purchase time package
  const purchaseTimePackage = async () => {
    if (!selectedMinutes || !userData?.rfidCardId) return;
    
    const durationSeconds = selectedMinutes * 60;
    const cost = selectedMinutes * billingRatePerMinute;
    const currentBalance = typeof userData?.balance === 'number' ? userData.balance : 0;
    
    if (currentBalance < cost) {
      setPurchaseMessage(`Insufficient balance! You need ₱${cost.toFixed(2)} but only have ₱${currentBalance.toFixed(2)}`);
      setShowPurchaseError(true);
      setShowPurchaseConfirm(false);
      return;
    }
    
    setIsPurchasing(true);
    
    try {
      const userDocRef = doc(db, "users", userData.rfidCardId);
      
      // Get current user data to check for saved time and grace period
      const userSnap = await getDoc(userDocRef);
      const currentUserData = userSnap.exists() ? userSnap.data() : {};
      
      // Check for saved time
      const savedRemainingTime = currentUserData.savedRemainingTimeSeconds || 0;
      const savedTimeDate = currentUserData.savedTimeDate || null;
      const today = new Date().toISOString().split('T')[0];
      const isNewDay = savedTimeDate !== today;
      
      // Check for grace period eligibility
      const lastGracePeriodDate = currentUserData.lastGracePeriodDate || null;
      const canGrantGracePeriod = lastGracePeriodDate !== today;
      
      const now = Date.now();
      let newEndTime;
      let actualStartTime;
      let timeToAdd = durationSeconds; // Start with purchased time
      
      // If there's saved time and no active session, include it
      const currentSessionEndTime = currentUserData.sessionEndTime;
      const hasActiveSession = currentSessionEndTime && currentSessionEndTime > now;
      
      if (savedRemainingTime > 0 && !hasActiveSession) {
        timeToAdd += savedRemainingTime;
        console.log(`💾 Including ${Math.floor(savedRemainingTime / 60)} minutes of saved time`);
        
        // If it's a new day and grace period is available, add grace period too
        if (isNewDay && canGrantGracePeriod) {
          timeToAdd += 300; // 5 minutes grace period
          console.log(`🎁 Including 5-minute grace period (new day)`);
        }
      }
      
      // Calculate new session end time
      if (hasActiveSession) {
        // Active session exists - add new time to existing end time
        let existingEndTime = now;
        if (currentSessionEndTime instanceof Date) {
          existingEndTime = currentSessionEndTime.getTime();
        } else if (typeof currentSessionEndTime === 'number') {
          existingEndTime = currentSessionEndTime;
        } else if (currentSessionEndTime && typeof currentSessionEndTime.toMillis === 'function') {
          existingEndTime = currentSessionEndTime.toMillis();
        }
        newEndTime = existingEndTime + (timeToAdd * 1000);
        actualStartTime = currentUserData.sessionStartTime || now;
        console.log(`➕ Adding ${Math.floor(timeToAdd / 60)} minutes to existing session`);
      } else {
        // No active session - start new session from now
        newEndTime = now + (timeToAdd * 1000);
        actualStartTime = now;
        console.log(`🆕 Starting new session with ${Math.floor(timeToAdd / 60)} minutes`);
      }
      
      // Prepare update data
      const updateData = {
        balance: increment(-cost),
        sessionStartTime: actualStartTime,
        sessionEndTime: newEndTime,
        updatedAt: serverTimestamp(),
      };
      
      // Clear saved time if it was included
      if (savedRemainingTime > 0 && !hasActiveSession) {
        updateData.savedRemainingTimeSeconds = null;
        updateData.savedTimeDate = null;
      }
      
      // Record grace period if it was granted
      if (savedRemainingTime > 0 && isNewDay && canGrantGracePeriod && !hasActiveSession) {
        updateData.lastGracePeriodDate = today;
      }
      
      // Update Firestore
      await updateDoc(userDocRef, updateData);
      
      // Generate custom document ID: PACK{number}-{6 random alphanumeric characters}
      const packageNumber = getPackageNumber(selectedMinutes);
      const randomChars = generateRandomAlphanumeric(6);
      const customDocumentId = `PACK${packageNumber}-${randomChars}`;
      
      // Save transaction to Firebase
      const transactionData = {
        userId: userData.rfidCardId,
        type: "Deducted",
        amount: cost,
        minutesPurchased: selectedMinutes,
        timestamp: serverTimestamp(),
        description: `Purchased ${selectedMinutes} minutes of internet`,
      };
      
      const transactionDocRef = doc(db, "transactions", customDocumentId);
      await setDoc(transactionDocRef, transactionData);
      console.log("✅ Transaction saved with custom ID:", customDocumentId);
      
      // Refresh user data
      const updatedUserSnap = await getDoc(userDocRef);
      if (updatedUserSnap.exists()) {
        const updatedData = updatedUserSnap.data();
        setUserData({
          ...updatedData,
          rfidCardId: userData.rfidCardId,
        });
      }
      
      // Close confirmation modal with animation
      setIsPurchaseConfirmOpening(false);
      setIsPurchaseConfirmClosing(true);
      setTimeout(() => {
        setShowPurchaseConfirm(false);
        setIsPurchaseConfirmClosing(false);
        setSelectedMinutes(null);
        setIsPurchasing(false);
        
        // Show success modal
        const totalMinutes = Math.floor(timeToAdd / 60);
        setPurchaseMessage(`${selectedMinutes} ${selectedMinutes === 1 ? 'minute' : 'minutes'} purchased! Total time available: ${totalMinutes} ${totalMinutes === 1 ? 'minute' : 'minutes'}`);
        setIsPurchaseSuccessClosing(false);
        setIsPurchaseSuccessOpening(false);
        setShowPurchaseSuccess(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsPurchaseSuccessOpening(true);
          });
        });
      }, 300);
      
    } catch (error) {
      console.error("❌ Error purchasing time:", error);
      setIsPurchasing(false);
      setShowPurchaseConfirm(false);
      setSelectedMinutes(null);
      
      setPurchaseMessage("Failed to purchase time package. Please try again.");
      setIsPurchaseConfirmOpening(false);
      setIsPurchaseConfirmClosing(true);
      setTimeout(() => {
        setShowPurchaseConfirm(false);
        setIsPurchaseConfirmClosing(false);
        setIsPurchaseErrorClosing(false);
        setIsPurchaseErrorOpening(false);
        setShowPurchaseError(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsPurchaseErrorOpening(true);
          });
        });
      }, 300);
    }
  };

  // Handle end session
  const handleEndSession = () => {
    // Check if there's an active session
    if (!userData?.sessionEndTime) {
      setEndSessionError("No active session to end.");
      setShowEndSessionError(true);
      return;
    }
    
    const sessionEndTime = userData.sessionEndTime;
    let endTime = null;
    
    if (sessionEndTime instanceof Date) {
      endTime = sessionEndTime.getTime();
    } else if (typeof sessionEndTime === 'number') {
      endTime = sessionEndTime;
    } else if (sessionEndTime && typeof sessionEndTime.toMillis === 'function') {
      endTime = sessionEndTime.toMillis();
    }
    
    const now = Date.now();
    if (!endTime || endTime <= now) {
      setEndSessionError("No active session to end.");
      setShowEndSessionError(true);
      return;
    }
    
    // Show confirmation modal
    setShowEndSessionConfirm(true);
  };

  const confirmEndSession = async () => {
    if (!userData?.sessionEndTime || !userData?.rfidCardId) {
      setShowEndSessionConfirm(false);
      setEndSessionError("No active session to end.");
      setShowEndSessionError(true);
      return;
    }
    
    const sessionEndTime = userData.sessionEndTime;
    let endTime = null;
    
    if (sessionEndTime instanceof Date) {
      endTime = sessionEndTime.getTime();
    } else if (typeof sessionEndTime === 'number') {
      endTime = sessionEndTime;
    } else if (sessionEndTime && typeof sessionEndTime.toMillis === 'function') {
      endTime = sessionEndTime.toMillis();
    }
    
    const now = Date.now();
    if (!endTime || endTime <= now) {
      setShowEndSessionConfirm(false);
      setEndSessionError("No active session to end.");
      setShowEndSessionError(true);
      return;
    }
    
    setIsEndingSession(true);
    const timeToSave = Math.max(0, Math.floor((endTime - now) / 1000));
    const minutesToSave = Math.floor(timeToSave / 60);
    
    if (timeToSave <= 0) {
      setShowEndSessionConfirm(false);
      setIsEndingSession(false);
      setEndSessionError("No time remaining to save.");
      setShowEndSessionError(true);
      return;
    }
    
    try {
      const userDocRef = doc(db, "users", userData.rfidCardId);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get session start time for history
      const userSnap = await getDoc(userDocRef);
      const currentUserData = userSnap.exists() ? userSnap.data() : {};
      const sessionStartTime = currentUserData.sessionStartTime || now;
      let actualStartTime = now;
      
      if (sessionStartTime instanceof Date) {
        actualStartTime = sessionStartTime.getTime();
      } else if (typeof sessionStartTime === 'number') {
        actualStartTime = sessionStartTime;
      } else if (sessionStartTime && typeof sessionStartTime.toMillis === 'function') {
        actualStartTime = sessionStartTime.toMillis();
      }
      
      const sessionEndTimeDate = new Date();
      const actualDuration = Math.floor((sessionEndTimeDate.getTime() - actualStartTime) / 1000);
      
      // 1. Save remaining time to Firebase
      console.log("💾 Saving remaining time to Firebase...");
      await updateDoc(userDocRef, {
        savedRemainingTimeSeconds: timeToSave, // Save remaining seconds
        savedTimeDate: today, // Save the date when time was saved
        sessionStartTime: null, // Clear session start time
        sessionEndTime: null, // Clear active session
        updatedAt: serverTimestamp(),
      });
      
      console.log(`✅ Saved ${timeToSave} seconds (${minutesToSave} minutes) to Firebase`);
      
      // 2. Save session history to session_history collection
      const sessionHistoryData = {
        userId: userData.rfidCardId,
        userName: userData?.fullName || "Unknown",
        sessionStartTime: new Date(actualStartTime),
        sessionEndTime: sessionEndTimeDate,
        durationSeconds: actualDuration,
        timeRemainingSeconds: timeToSave,
        timeRemainingMinutes: minutesToSave,
        action: "ended_with_time_saved",
        savedForNextSession: true,
        savedTimeDate: today,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
      };
      
      const sessionHistoryRef = await addDoc(collection(db, "session_history"), sessionHistoryData);
      console.log("✅ Session history saved:", sessionHistoryRef.id);
      
      // 3. Update local state
      const updatedUserSnap = await getDoc(userDocRef);
      if (updatedUserSnap.exists()) {
        const updatedData = updatedUserSnap.data();
        setUserData({
          ...updatedData,
          rfidCardId: userData.rfidCardId,
        });
      }
      
      setSavedTimeMinutes(minutesToSave);
      setShowEndSessionConfirm(false);
      setIsEndingSession(false);
      setShowEndSessionSuccess(true);
      
      // Auto-close success modal after 5 seconds
      setTimeout(() => {
        setShowEndSessionSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error("❌ Error ending session:", error);
      setIsEndingSession(false);
      setShowEndSessionConfirm(false);
      setEndSessionError("Failed to end session. Please try again.");
      setShowEndSessionError(true);
    }
  };

  const menuItems = [
    {
      id: 1,
      name: "Overview",
      icon: LayoutDashboard,
      tab: "overview",
    },
    {
      id: 2,
      name: "Time Packages",
      icon: Package,
      tab: "packages",
    },
    {
      id: 3,
      name: "Top-up History",
      icon: BanknoteArrowUp,
      tab: "topup-history",
    },
    {
      id: 4,
      name: "Transactions",
      icon: History,
      tab: "transactions",
    },
    {
      id: 5,
      name: "Profile",
      icon: User,
      tab: "profile",
    },
    {
      id: 6,
      name: "Settings",
      icon: Settings,
      tab: "settings",
    },
  ];

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <main className="w-full h-dvh bg-white overflow-x-hidden flex relative overflow-hidden">
      {/* ===== ANIMATED BACKGROUND PATTERN ===== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-50 via-white to-blue-50 opacity-60"></div>
        {/* Animated lines pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="lines"
              patternUnits="userSpaceOnUse"
              width="50"
              height="50"
            >
              <path
                d="M 0 0 L 50 50 M 50 0 L 0 50"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lines)" />
        </svg>
      </div>

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`fixed lg:sticky lg:top-0 lg:z-40 left-0 top-0 h-full lg:h-screen w-72 bg-white/80 backdrop-blur-md border-r border-emerald-100 z-40 lg:flex-shrink-0 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <Image
                src="/favicon.ico"
                alt="EZ-Vendo Logo"
                width={40}
                height={40}
                className=""
              />
              <span className="font-bold text-xl">
                <span className="text-green-500">EZ</span>-Vendo
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="flex flex-col gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.tab);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-emerald-100">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-emerald-50/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                {userData?.fullName
                  ? userData.fullName.charAt(0).toUpperCase()
                  : user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userData?.fullName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-150"
            >
              <LogOut className="size-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MOBILE SIDEBAR OVERLAY ===== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-emerald-100">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              {sidebarOpen ? (
                <X className="size-6 text-gray-700" />
              ) : (
                <Menu className="size-6 text-gray-700" />
              )}
            </button>
            <h1 className="text-xl font-bold text-slate-900">
              {menuItems.find((item) => item.tab === activeTab)?.name ||
                "Dashboard"}
            </h1>
            <div className="w-10"></div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Welcome Card */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 p-6 sm:p-8 text-white shadow-lg">
                <div className="relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                    Welcome back, {userData?.fullName || "User"}!
                  </h2>
                  <p className="text-emerald-50">
                    Manage your Wi-Fi access and time packages
                  </p>
                </div>
                <div className="absolute top-4 right-4 opacity-20">
                  <Radio className="size-24 text-white" />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 shadow-sm relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <button
                      onClick={openTopUpModal}
                      className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      title="Top-up Balance"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">
                    Current Balance
                  </h3>
                  <p className="text-3xl font-bold text-slate-900">
                    ₱{typeof userData?.balance === 'number' ? userData.balance.toFixed(2) : "0.00"}
                  </p>
                </div>

                {/* Time Remaining Card */}
                <div className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 shadow-sm relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">
                    {(() => {
                      // Check if there's an active session
                      if (userData?.sessionEndTime) {
                        const sessionEndTime = userData.sessionEndTime;
                        let endTime = null;
                        
                        if (sessionEndTime instanceof Date) {
                          endTime = sessionEndTime.getTime();
                        } else if (typeof sessionEndTime === 'number') {
                          endTime = sessionEndTime;
                        } else if (sessionEndTime && typeof sessionEndTime.toMillis === 'function') {
                          endTime = sessionEndTime.toMillis();
                        }
                        
                        const now = Date.now();
                        if (endTime && endTime > now) {
                          return "Time Remaining";
                        }
                      }
                      // No active session - show saved time label
                      if (userData?.savedRemainingTimeSeconds && userData.savedRemainingTimeSeconds > 0) {
                        return "Saved Time";
                      }
                      return "Time Remaining";
                    })()}
                  </h3>
                  <p className="text-3xl font-bold text-slate-900">
                    {(() => {
                      if (timeRemaining === 0) return "0h 0m";
                      const hours = Math.floor(timeRemaining / 3600);
                      const minutes = Math.floor((timeRemaining % 3600) / 60);
                      const seconds = timeRemaining % 60;
                      if (hours > 0) {
                        return `${hours}h ${minutes}m`;
                      } else if (minutes > 0) {
                        return `${minutes}m ${seconds}s`;
                      } else {
                        return `${seconds}s`;
                      }
                    })()}
                  </p>
                  {(() => {
                    // Show indicator if this is saved time (not active session)
                    if (userData?.savedRemainingTimeSeconds && userData.savedRemainingTimeSeconds > 0) {
                      const sessionEndTime = userData.sessionEndTime;
                      let endTime = null;
                      
                      if (sessionEndTime) {
                        if (sessionEndTime instanceof Date) {
                          endTime = sessionEndTime.getTime();
                        } else if (typeof sessionEndTime === 'number') {
                          endTime = sessionEndTime;
                        } else if (typeof sessionEndTime.toMillis === 'function') {
                          endTime = sessionEndTime.toMillis();
                        }
                      }
                      
                      const now = Date.now();
                      // Only show "Saved" if there's no active session
                      if (!endTime || endTime <= now) {
                        return (
                          <p className="text-xs text-gray-500 mt-1">
                            Saved for next session
                          </p>
                        );
                      }
                    }
                    return null;
                  })()}
                  
                  {/* End Session Button - Only show if there's an active session */}
                  {(() => {
                    if (userData?.sessionEndTime) {
                      const sessionEndTime = userData.sessionEndTime;
                      let endTime = null;
                      
                      if (sessionEndTime instanceof Date) {
                        endTime = sessionEndTime.getTime();
                      } else if (typeof sessionEndTime === 'number') {
                        endTime = sessionEndTime;
                      } else if (sessionEndTime && typeof sessionEndTime.toMillis === 'function') {
                        endTime = sessionEndTime.toMillis();
                      }
                      
                      const now = Date.now();
                      if (endTime && endTime > now) {
                        return (
                          <button
                            onClick={handleEndSession}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-colors duration-150"
                          >
                            <TimerOff className="size-4" />
                            End Session & Save Time
                          </button>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>

                {/* Status Card */}
                <div className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 shadow-sm relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                      <Wifi className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">
                    Account Status
                  </h3>
                  <p className="text-3xl font-bold text-slate-900">
                    {userData?.isRegistered === true ? "Registered" : "Unregistered"}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 relative z-10">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("packages")}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all duration-150"
                    >
                      <Package className="size-5" />
                      <span>Buy Time Package</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("transactions")}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-emerald-600 text-emerald-600 font-semibold hover:bg-emerald-50 transition-all duration-150"
                    >
                      <History className="size-5" />
                      <span>View Transactions</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 relative z-10">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Account Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">RFID Card</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {userData?.rfidCardId || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Email</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {userData?.email || user?.email || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Registered</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {userData?.registeredAt
                          ? (() => {
                              const date = userData.registeredAt.toDate
                                ? userData.registeredAt.toDate()
                                : new Date(userData.registeredAt);
                              return date.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              });
                            })()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "packages" && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header Card */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 p-6 sm:p-8 text-white shadow-lg">
                <div className="relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                    Time Packages
                  </h2>
                  <p className="text-emerald-50">
                    Purchase internet time packages (₱{billingRatePerMinute.toFixed(2)}/min)
                  </p>
                </div>
                <div className="absolute top-4 right-4 opacity-20">
                  <Package className="size-24 text-white" />
                </div>
              </div>

              {/* Balance Info */}
              <div className="p-6 rounded-2xl bg-white/95 backdrop-blur-sm border border-gray-200 shadow-sm relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">
                      Current Balance
                    </h3>
                    <p className="text-3xl font-bold text-slate-900">
                      ₱{typeof userData?.balance === 'number' ? userData.balance.toFixed(2) : "0.00"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Time Packages Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 5 Minutes */}
                <button
                  onClick={() => handleTimePackageClick(5)}
                  disabled={!userData || (typeof userData?.balance === 'number' ? userData.balance : 0) < (5 * billingRatePerMinute)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white transition-all duration-150 shadow-md hover:shadow-lg transform hover:-translate-y-1 relative z-10"
                >
                  <span className="text-4xl font-bold mb-2">5</span>
                  <span className="text-sm mb-1">minutes</span>
                  <span className="text-xs font-semibold">₱{(5 * billingRatePerMinute).toFixed(2)}</span>
                </button>
                
                {/* 10 Minutes */}
                <button
                  onClick={() => handleTimePackageClick(10)}
                  disabled={!userData || (typeof userData?.balance === 'number' ? userData.balance : 0) < (10 * billingRatePerMinute)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white transition-all duration-150 shadow-md hover:shadow-lg transform hover:-translate-y-1 relative z-10"
                >
                  <span className="text-4xl font-bold mb-2">10</span>
                  <span className="text-sm mb-1">minutes</span>
                  <span className="text-xs font-semibold">₱{(10 * billingRatePerMinute).toFixed(2)}</span>
                </button>
                
                {/* 30 Minutes */}
                <button
                  onClick={() => handleTimePackageClick(30)}
                  disabled={!userData || (typeof userData?.balance === 'number' ? userData.balance : 0) < (30 * billingRatePerMinute)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white transition-all duration-150 shadow-md hover:shadow-lg transform hover:-translate-y-1 relative z-10"
                >
                  <span className="text-4xl font-bold mb-2">30</span>
                  <span className="text-sm mb-1">minutes</span>
                  <span className="text-xs font-semibold">₱{(30 * billingRatePerMinute).toFixed(2)}</span>
                </button>
                
                {/* 60 Minutes */}
                <button
                  onClick={() => handleTimePackageClick(60)}
                  disabled={!userData || (typeof userData?.balance === 'number' ? userData.balance : 0) < (60 * billingRatePerMinute)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white transition-all duration-150 shadow-md hover:shadow-lg transform hover:-translate-y-1 relative z-10"
                >
                  <span className="text-4xl font-bold mb-2">60</span>
                  <span className="text-sm mb-1">minutes</span>
                  <span className="text-xs font-semibold">₱{(60 * billingRatePerMinute).toFixed(2)}</span>
                </button>
              </div>

              {/* Info Card */}
              <div className="p-6 rounded-2xl bg-white/95 backdrop-blur-sm border border-blue-200 shadow-sm relative z-10">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-semibold">ℹ️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">How it works</h3>
                    <p className="text-sm text-gray-700">
                      When you purchase a time package, it will be added to your account. 
                      The time will be activated when you scan your RFID card at the captive portal. 
                      If you have saved time from a previous session, it will be included automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "topup-history" && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header Card */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 p-6 sm:p-8 text-white shadow-lg">
                <div className="relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                    Top-up History
                  </h2>
                  <p className="text-blue-50">
                    View all your top-up requests and their status
                  </p>
                </div>
                <div className="absolute top-4 right-4 opacity-20">
                  <BanknoteArrowUp className="size-24 text-white" />
                </div>
              </div>

              {/* Search Bar and Filter Buttons */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4 relative z-10">
                <form className="flex flex-col sm:flex-row gap-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center sm:w-auto">
                    Search:
                  </label>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={topUpHistorySearchQuery}
                      onChange={(e) => setTopUpHistorySearchQuery(e.target.value)}
                      placeholder="Search by transaction ID, reference ID, or payment method..."
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {topUpHistorySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTopUpHistorySearchQuery("")}
                        className="absolute top-2.5 right-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <X className="size-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </form>
                
                {/* Filter Buttons */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-500">
                    Filters
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Type Filters */}
                    <button
                      onClick={() => {
                        setTopUpHistoryFilter("all");
                        setTopUpHistoryPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        topUpHistoryFilter === "all"
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setTopUpHistoryFilter("requests");
                        setTopUpHistoryPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        topUpHistoryFilter === "requests"
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      Top-up Requests
                    </button>
                    <button
                      onClick={() => {
                        setTopUpHistoryFilter("manual");
                        setTopUpHistoryPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        topUpHistoryFilter === "manual"
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      Manual Top-ups
                    </button>
                    
                    {/* Divider */}
                    <span className="text-gray-400 mx-1">|</span>
                    
                    {/* Status Filters */}
                    <button
                      onClick={() => {
                        setTopUpHistoryStatusFilter("all");
                        setTopUpHistoryPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        topUpHistoryStatusFilter === "all"
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      All Status
                    </button>
                    <button
                      onClick={() => {
                        setTopUpHistoryStatusFilter("pending");
                        setTopUpHistoryPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        topUpHistoryStatusFilter === "pending"
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => {
                        setTopUpHistoryStatusFilter("approved");
                        setTopUpHistoryPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        topUpHistoryStatusFilter === "approved"
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      Approved
                    </button>
                    <button
                      onClick={() => {
                        setTopUpHistoryStatusFilter("rejected");
                        setTopUpHistoryPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        topUpHistoryStatusFilter === "rejected"
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      Rejected
                    </button>
                  </div>
                </div>
              </div>

              {/* Top-up History Table/Cards */}
              {topUpHistoryLoading ? (
                <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm relative z-10">
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                    <span className="text-gray-600">Loading top-up history...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Filtered and paginated history */}
                  {(() => {
                    // Filter history based on type filter
                    let filteredByType = topUpHistory;
                    if (topUpHistoryFilter === "requests") {
                      filteredByType = topUpHistory.filter((item) => item.type === "request");
                    } else if (topUpHistoryFilter === "manual") {
                      filteredByType = topUpHistory.filter((item) => item.type === "manual");
                    }
                    
                    // Filter history based on status filter
                    let filteredByStatus = filteredByType;
                    if (topUpHistoryStatusFilter === "pending") {
                      filteredByStatus = filteredByType.filter((item) => item.status?.toLowerCase() === "pending");
                    } else if (topUpHistoryStatusFilter === "approved") {
                      filteredByStatus = filteredByType.filter((item) => item.status?.toLowerCase() === "approved");
                    } else if (topUpHistoryStatusFilter === "rejected") {
                      filteredByStatus = filteredByType.filter((item) => item.status?.toLowerCase() === "rejected");
                    }
                    
                    // Filter history based on search query
                    const filteredHistory = filteredByStatus.filter((item) => {
                      if (!topUpHistorySearchQuery) return true;
                      const query = topUpHistorySearchQuery.toLowerCase();
                      return (
                        item.documentId?.toLowerCase().includes(query) ||
                        item.referenceId?.toLowerCase().includes(query) ||
                        item.paymentMethod?.toLowerCase().includes(query) ||
                        item.status?.toLowerCase().includes(query)
                      );
                    });

                    // Pagination
                    const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / topUpHistoryItemsPerPage));
                    const startIndex = (topUpHistoryPage - 1) * topUpHistoryItemsPerPage;
                    const endIndex = startIndex + topUpHistoryItemsPerPage;
                    const paginatedHistory = topUpHistorySearchQuery
                      ? filteredHistory
                      : filteredHistory.slice(startIndex, endIndex);

                    return (
                      <>
                        {/* Mobile Card View */}
                        <div className="xl:hidden flex flex-col gap-3">
                          {paginatedHistory.length === 0 ? (
                            <div className="p-8 rounded-2xl bg-white/95 backdrop-blur-sm border border-gray-200 shadow-sm text-center">
                              <BanknoteArrowUp className="size-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-600">No top-up requests found</p>
                            </div>
                          ) : (
                            paginatedHistory.map((request) => (
                              <div
                                key={request.id}
                                onClick={() => setSelectedTopUpRequest(request)}
                                className="p-4 rounded-xl border border-gray-300 bg-white shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-150 cursor-pointer relative z-10"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-sm text-gray-800">
                                      {request.documentId}
                                    </span>
                                    {request.type === "manual" && (
                                      <span className="text-xs text-emerald-600 font-medium">
                                        Manual Top-up
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      request.status === "approved"
                                        ? "bg-green-100 text-green-700"
                                        : request.status === "rejected"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}
                                  >
                                    {request.status}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1 text-xs text-gray-600">
                                  <span>
                                    <span className="font-medium">Amount:</span> ₱{request.amount.toFixed(2)}
                                  </span>
                                  <span>
                                    <span className="font-medium">Payment:</span> {request.paymentMethod}
                                  </span>
                                  <span>
                                    <span className="font-medium">Date:</span>{" "}
                                    {request.requestedAt.toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden xl:flex rounded-xl overflow-hidden border border-gray-300 w-full bg-white shadow-sm relative z-10">
                          <div className="overflow-x-auto w-full">
                            <table className="w-full text-sm text-left min-w-full">
                              <thead className="border-b border-gray-300 bg-gray-50">
                                <tr>
                                  <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Transaction ID</th>
                                  <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Type</th>
                                  <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Amount</th>
                                  <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Payment Method</th>
                                  <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Status</th>
                                  <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedHistory.length === 0 ? (
                                  <tr>
                                    <td colSpan="6" className="px-4 xl:px-6 py-8 text-center text-gray-500">
                                      No top-up requests found
                                    </td>
                                  </tr>
                                ) : (
                                  paginatedHistory.map((request) => (
                                    <tr
                                      key={request.id}
                                      onClick={() => setSelectedTopUpRequest(request)}
                                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                                    >
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800 font-mono text-xs">
                                        {request.documentId}
                                      </td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4">
                                        {request.type === "manual" ? (
                                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">
                                            Manual
                                          </span>
                                        ) : (
                                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                                            Request
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800 font-medium">
                                        ₱{request.amount.toFixed(2)}
                                      </td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800">
                                        {request.paymentMethod}
                                      </td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4">
                                        <span
                                          className={`text-xs px-2 py-1 rounded-full font-medium inline-block ${
                                            request.status === "approved"
                                              ? "bg-green-100 text-green-700"
                                              : request.status === "rejected"
                                              ? "bg-red-100 text-red-700"
                                              : "bg-yellow-100 text-yellow-700"
                                          }`}
                                        >
                                          {request.status}
                                        </span>
                                      </td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-600">
                                        {request.requestedAt.toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Pagination */}
                        {!topUpHistorySearchQuery && (() => {
                          const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / topUpHistoryItemsPerPage));
                          return historyTotalPages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setTopUpHistoryPage(Math.max(1, topUpHistoryPage - 1))}
                                disabled={topUpHistoryPage === 1}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronLeft className="size-5" />
                              </button>
                              {Array.from({ length: Math.min(5, historyTotalPages) }, (_, i) => i + 1).map((page) => (
                                <button
                                  key={page}
                                  onClick={() => setTopUpHistoryPage(page)}
                                  className={`px-4 py-2 rounded-lg border transition-colors ${
                                    topUpHistoryPage === page
                                      ? "border-emerald-500 bg-emerald-500 text-white"
                                      : "border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {page}
                                </button>
                              ))}
                              <button
                                onClick={() => setTopUpHistoryPage(Math.min(historyTotalPages, topUpHistoryPage + 1))}
                                disabled={topUpHistoryPage === historyTotalPages}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronRight className="size-5" />
                              </button>
                            </div>
                          );
                        })()}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header Card */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 p-6 sm:p-8 text-white shadow-lg">
                <div className="relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                    Transaction History
                  </h2>
                  <p className="text-emerald-50">
                    View all your package purchases and transactions
                  </p>
                </div>
                <div className="absolute top-4 right-4 opacity-20">
                  <History className="size-24 text-white" />
                </div>
              </div>

              {/* Search Bar and Filter Buttons */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4 relative z-10">
                <form className="flex flex-col sm:flex-row gap-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center sm:w-auto">
                    Search:
                  </label>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={transactionsSearchQuery}
                      onChange={(e) => setTransactionsSearchQuery(e.target.value)}
                      placeholder="Search by transaction ID, type, or description..."
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {transactionsSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTransactionsSearchQuery("")}
                        className="absolute top-2.5 right-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <X className="size-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </form>
                
                {/* Filter Buttons */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-500">
                    Filter by package
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setTransactionsFilter("all");
                        setTransactionsPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        transactionsFilter === "all"
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setTransactionsFilter("pack1");
                        setTransactionsPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        transactionsFilter === "pack1"
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      Package 1
                    </button>
                    <button
                      onClick={() => {
                        setTransactionsFilter("pack2");
                        setTransactionsPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        transactionsFilter === "pack2"
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      Package 2
                    </button>
                    <button
                      onClick={() => {
                        setTransactionsFilter("pack3");
                        setTransactionsPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        transactionsFilter === "pack3"
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      Package 3
                    </button>
                    <button
                      onClick={() => {
                        setTransactionsFilter("pack4");
                        setTransactionsPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                        transactionsFilter === "pack4"
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      Package 4
                    </button>
                  </div>
                </div>
              </div>

              {/* Transactions Table/Cards */}
              {transactionsLoading ? (
                <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm relative z-10">
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                    <span className="text-gray-600">Loading transactions...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Filtered and paginated transactions */}
                  {(() => {
                    // Filter transactions based on package filter
                    let filteredByPackage = transactions;
                    if (transactionsFilter === "pack1") {
                      filteredByPackage = transactions.filter((item) => item.packageNumber === 1);
                    } else if (transactionsFilter === "pack2") {
                      filteredByPackage = transactions.filter((item) => item.packageNumber === 2);
                    } else if (transactionsFilter === "pack3") {
                      filteredByPackage = transactions.filter((item) => item.packageNumber === 3);
                    } else if (transactionsFilter === "pack4") {
                      filteredByPackage = transactions.filter((item) => item.packageNumber === 4);
                    }
                    
                    // Filter transactions based on search query
                    const filteredTransactions = filteredByPackage.filter((item) => {
                      if (!transactionsSearchQuery) return true;
                      const query = transactionsSearchQuery.toLowerCase();
                      return (
                        item.documentId?.toLowerCase().includes(query) ||
                        item.type?.toLowerCase().includes(query) ||
                        item.description?.toLowerCase().includes(query)
                      );
                    });

                    // Pagination
                    const transactionsTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / transactionsItemsPerPage));
                    const startIndex = (transactionsPage - 1) * transactionsItemsPerPage;
                    const endIndex = startIndex + transactionsItemsPerPage;
                    const paginatedTransactions = transactionsSearchQuery
                      ? filteredTransactions
                      : filteredTransactions.slice(startIndex, endIndex);

                    return (
                      <>
                        {/* Mobile Card View */}
                        <div className="xl:hidden flex flex-col gap-3 relative z-10">
                          {paginatedTransactions.length === 0 ? (
                            <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm text-center">
                              <History className="size-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-600">No transactions found</p>
                            </div>
                          ) : (
                            paginatedTransactions.map((transaction) => (
                              <div
                                key={transaction.id}
                                onClick={() => setSelectedTransaction(transaction)}
                                className="p-4 rounded-xl border border-gray-300 bg-white shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-150 cursor-pointer"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-sm text-gray-800">
                                      {transaction.documentId}
                                    </span>
                                    {transaction.packageNumber && (
                                      <span className="text-xs text-emerald-600 font-medium">
                                        Package {transaction.packageNumber}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      transaction.type === "Deducted"
                                        ? "bg-red-100 text-red-700"
                                        : transaction.type === "Refund"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {transaction.type}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1 text-xs text-gray-600">
                                  <span>
                                    <span className="font-medium">Amount:</span> ₱{transaction.amount.toFixed(2)}
                                  </span>
                                  {transaction.minutesPurchased > 0 && (
                                    <span>
                                      <span className="font-medium">Minutes:</span> {transaction.minutesPurchased}
                                    </span>
                                  )}
                                  <span>
                                    <span className="font-medium">Date:</span>{" "}
                                    {transaction.timestamp.toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden xl:flex rounded-xl overflow-hidden border border-gray-300 w-full bg-white shadow-sm relative z-10">
                          <div className="overflow-x-auto w-full">
                            <table className="w-full text-sm text-left min-w-full">
                              <thead className="border-b border-gray-300 bg-gray-50">
                                <tr>
                                  <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Transaction ID</th>
                                  <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Package</th>
                                  <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Type</th>
                                  <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Amount</th>
                                  <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Minutes</th>
                                  <th className="px-4 xl:px-6 py-3 font-semibold text-gray-700">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedTransactions.length === 0 ? (
                                  <tr>
                                    <td colSpan="6" className="px-4 xl:px-6 py-8 text-center text-gray-500">
                                      No transactions found
                                    </td>
                                  </tr>
                                ) : (
                                  paginatedTransactions.map((transaction) => (
                                    <tr
                                      key={transaction.id}
                                      onClick={() => setSelectedTransaction(transaction)}
                                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                                    >
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800 font-mono text-xs">
                                        {transaction.documentId}
                                      </td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4">
                                        {transaction.packageNumber ? (
                                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">
                                            Package {transaction.packageNumber}
                                          </span>
                                        ) : (
                                          <span className="text-xs text-gray-400">-</span>
                                        )}
                                      </td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4">
                                        <span
                                          className={`text-xs px-2 py-1 rounded-full font-medium inline-block ${
                                            transaction.type === "Deducted"
                                              ? "bg-red-100 text-red-700"
                                              : transaction.type === "Refund"
                                              ? "bg-green-100 text-green-700"
                                              : "bg-blue-100 text-blue-700"
                                          }`}
                                        >
                                          {transaction.type}
                                        </span>
                                      </td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-800 font-medium">
                                        ₱{transaction.amount.toFixed(2)}
                                      </td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-600">
                                        {transaction.minutesPurchased > 0 ? transaction.minutesPurchased : "-"}
                                      </td>
                                      <td className="px-4 xl:px-6 py-3 sm:py-4 text-gray-600">
                                        {transaction.timestamp.toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Pagination */}
                        {!transactionsSearchQuery && (() => {
                          const transactionsTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / transactionsItemsPerPage));
                          return transactionsTotalPages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setTransactionsPage(Math.max(1, transactionsPage - 1))}
                                disabled={transactionsPage === 1}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronLeft className="size-5" />
                              </button>
                              {Array.from({ length: Math.min(5, transactionsTotalPages) }, (_, i) => i + 1).map((page) => (
                                <button
                                  key={page}
                                  onClick={() => setTransactionsPage(page)}
                                  className={`px-4 py-2 rounded-lg border transition-colors ${
                                    transactionsPage === page
                                      ? "border-emerald-500 bg-emerald-500 text-white"
                                      : "border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {page}
                                </button>
                              ))}
                              <button
                                onClick={() => setTransactionsPage(Math.min(transactionsTotalPages, transactionsPage + 1))}
                                disabled={transactionsPage === transactionsTotalPages}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronRight className="size-5" />
                              </button>
                            </div>
                          );
                        })()}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <ProfileTab 
              userData={userData}
              user={user}
              setUserData={setUserData}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab 
              billingRatePerMinute={billingRatePerMinute}
              userData={userData}
              setUserData={setUserData}
            />
          )}
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      {showPurchaseConfirm && selectedMinutes && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
            isPurchaseConfirmClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={() => {
            if (!isPurchasing) {
              setIsPurchaseConfirmOpening(false);
              setIsPurchaseConfirmClosing(true);
              setTimeout(() => {
                setShowPurchaseConfirm(false);
                setIsPurchaseConfirmClosing(false);
                setSelectedMinutes(null);
              }, 300);
            }
          }}
        >
          <div 
            className={`rounded-2xl relative bg-white w-full max-w-5xl flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
              isPurchaseConfirmClosing 
                ? "translate-y-[150vh] opacity-0 scale-95" 
                : isPurchaseConfirmOpening
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-[20px] opacity-0 scale-[0.95]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON - Top Middle */}
            <button
              onClick={() => {
                if (!isPurchasing) {
                  setIsPurchaseConfirmOpening(false);
                  setIsPurchaseConfirmClosing(true);
                  setTimeout(() => {
                    setShowPurchaseConfirm(false);
                    setIsPurchaseConfirmClosing(false);
                    setSelectedMinutes(null);
                  }, 300);
                }
              }}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD */}
            <div className="flex relative rounded-t-2xl p-4 sm:p-5 text-white bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold">
                  Confirm Purchase
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    Time Package Purchase
                  </span>
                  <span className="text-xs text-gray-100">
                    Review your purchase details before confirming
                  </span>
                </div>
              </div>
              <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-emerald-600/40 shadow-emerald-600/40">
                <Package className="size-5 sm:size-6" />
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex flex-col gap-3 p-4 rounded-lg border border-gray-300 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-500">Time Package:</span>
                  <span className="text-sm sm:text-base font-semibold">{selectedMinutes} {selectedMinutes === 1 ? 'minute' : 'minutes'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-500">Cost:</span>
                  <span className="text-sm sm:text-base font-semibold text-emerald-600">₱{(selectedMinutes * billingRatePerMinute).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-500">Current Balance:</span>
                  <span className="text-sm sm:text-base font-semibold">₱{typeof userData?.balance === 'number' ? userData.balance.toFixed(2) : "0.00"}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-300 pt-3">
                  <span className="text-xs sm:text-sm text-gray-500">Balance After:</span>
                  <span className={`text-sm sm:text-base font-semibold ${
                    (typeof userData?.balance === 'number' ? userData.balance : 0) - (selectedMinutes * billingRatePerMinute) < 0 
                      ? 'text-red-600' 
                      : 'text-gray-800'
                  }`}>
                    ₱{((typeof userData?.balance === 'number' ? userData.balance : 0) - (selectedMinutes * billingRatePerMinute)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 items-center justify-end w-full mt-2">
                <button
                  onClick={() => {
                    if (!isPurchasing) {
                      setIsPurchaseConfirmOpening(false);
                      setIsPurchaseConfirmClosing(true);
                      setTimeout(() => {
                        setShowPurchaseConfirm(false);
                        setIsPurchaseConfirmClosing(false);
                        setSelectedMinutes(null);
                      }, 300);
                    }
                  }}
                  disabled={isPurchasing}
                  className="bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Discard
                </button>
                <button
                  onClick={purchaseTimePackage}
                  disabled={isPurchasing || (typeof userData?.balance === 'number' ? userData.balance : 0) < (selectedMinutes * billingRatePerMinute)}
                  className="bg-emerald-500 text-white rounded-lg px-4 py-2 hover:bg-emerald-500/90 active:bg-emerald-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Success Modal */}
      {showPurchaseSuccess && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
            isPurchaseSuccessClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={() => {
            setIsPurchaseSuccessOpening(false);
            setIsPurchaseSuccessClosing(true);
            setTimeout(() => {
              setShowPurchaseSuccess(false);
              setIsPurchaseSuccessClosing(false);
            }, 300);
          }}
        >
          <div 
            className={`rounded-2xl relative bg-white w-full max-w-5xl flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
              isPurchaseSuccessClosing 
                ? "translate-y-[150vh] opacity-0 scale-95" 
                : isPurchaseSuccessOpening
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-[20px] opacity-0 scale-[0.95]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON - Top Middle */}
            <button
              onClick={() => {
                setIsPurchaseSuccessOpening(false);
                setIsPurchaseSuccessClosing(true);
                setTimeout(() => {
                  setShowPurchaseSuccess(false);
                  setIsPurchaseSuccessClosing(false);
                }, 300);
              }}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD */}
            <div className="flex relative rounded-t-2xl p-4 sm:p-5 text-white bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold">
                  Purchase Successful
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    Time Package Purchased
                  </span>
                  <span className="text-xs text-gray-100">
                    {purchaseMessage}
                  </span>
                </div>
              </div>
              <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-emerald-600/40 shadow-emerald-600/40">
                <CheckCircle className="size-5 sm:size-6" />
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col gap-4 p-4 sm:p-5 items-center justify-center min-h-[200px]">
              <div className="rounded-full p-4 bg-emerald-100">
                <Package className="size-8 sm:size-10 text-emerald-600" />
              </div>
              <div className="flex flex-col text-center gap-2">
                <span className="text-lg sm:text-xl font-semibold text-emerald-600">
                  Success!
                </span>
                <span className="text-sm sm:text-base text-gray-600">
                  {purchaseMessage}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsPurchaseSuccessOpening(false);
                  setIsPurchaseSuccessClosing(true);
                  setTimeout(() => {
                    setShowPurchaseSuccess(false);
                    setIsPurchaseSuccessClosing(false);
                  }, 300);
                }}
                className="mt-4 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-medium text-sm sm:text-base transition-all duration-150 shadow-md hover:shadow-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Error Modal */}
      {showPurchaseError && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
            isPurchaseErrorClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={() => {
            setIsPurchaseErrorOpening(false);
            setIsPurchaseErrorClosing(true);
            setTimeout(() => {
              setShowPurchaseError(false);
              setIsPurchaseErrorClosing(false);
            }, 300);
          }}
        >
          <div 
            className={`rounded-2xl relative bg-white w-full max-w-5xl flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
              isPurchaseErrorClosing 
                ? "translate-y-[150vh] opacity-0 scale-95" 
                : isPurchaseErrorOpening
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-[20px] opacity-0 scale-[0.95]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON - Top Middle */}
            <button
              onClick={() => {
                setIsPurchaseErrorOpening(false);
                setIsPurchaseErrorClosing(true);
                setTimeout(() => {
                  setShowPurchaseError(false);
                  setIsPurchaseErrorClosing(false);
                }, 300);
              }}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD */}
            <div className="flex relative rounded-t-2xl p-4 sm:p-5 text-white bg-gradient-to-r from-red-500 via-red-400 to-red-500">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold">
                  Purchase Failed
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    Error
                  </span>
                  <span className="text-xs text-gray-100">
                    {purchaseMessage}
                  </span>
                </div>
              </div>
              <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-red-600/40 shadow-red-600/40">
                <X className="size-5 sm:size-6" />
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col gap-4 p-4 sm:p-5 items-center justify-center min-h-[200px]">
              <div className="rounded-full p-4 bg-red-100">
                <X className="size-8 sm:size-10 text-red-600" />
              </div>
              <div className="flex flex-col text-center gap-2">
                <span className="text-lg sm:text-xl font-semibold text-red-600">
                  Error
                </span>
                <span className="text-sm sm:text-base text-gray-600">
                  {purchaseMessage}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsPurchaseErrorOpening(false);
                  setIsPurchaseErrorClosing(true);
                  setTimeout(() => {
                    setShowPurchaseError(false);
                    setIsPurchaseErrorClosing(false);
                  }, 300);
                }}
                className="mt-4 px-6 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-medium text-sm sm:text-base transition-all duration-150 shadow-md hover:shadow-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top-up Request Modal */}
      {showTopUpModal && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
            isTopUpModalClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeTopUpModal}
        >
          <div 
            className={`rounded-2xl relative bg-white w-full max-w-5xl flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
              isTopUpModalClosing 
                ? "translate-y-[150vh] opacity-0 scale-95" 
                : isTopUpModalOpening
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-[20px] opacity-0 scale-[0.95]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON - Top Middle */}
            <button
              onClick={closeTopUpModal}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
              disabled={isSubmittingTopUp}
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {topUpSuccess ? (
              // Success State
              <>
                {/* HEADER CARD - Success State */}
                <div className="flex relative rounded-t-2xl p-4 sm:p-5 text-white bg-gradient-to-r from-green-500 via-green-400 to-green-500">
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-xl sm:text-2xl font-bold">
                      Request Submitted!
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        Top-Up Request
                      </span>
                      <span className="text-xs text-gray-100">
                        Your request has been sent to the admin for approval
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-green-600/40 shadow-lg">
                    <CheckCircle className="size-5 sm:size-6" />
                  </div>
                </div>

                {/* MAIN CONTENT - Success */}
                <div className="flex flex-col gap-3 p-4 sm:p-5">
                  <div className="flex flex-col items-center justify-center gap-4 py-4">
                    <div className="rounded-full p-3 bg-green-500 text-white">
                      <CheckCircle className="size-6 sm:size-7" />
                    </div>
                    <div className="flex flex-col text-center gap-1">
                      <span className="text-base sm:text-lg font-semibold text-green-600">
                        Success
                      </span>
                      <span className="text-gray-500 text-xs sm:text-sm">
                        Your top-up request has been sent to the admin for approval
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={closeTopUpModal}
                    className="w-full bg-green-500 px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </>
            ) : (
              // Form State
              <>
                {/* HEADER CARD */}
                <div className="flex relative rounded-t-2xl p-4 sm:p-5 text-white bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500">
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-xl sm:text-2xl font-bold">
                      Top-Up Request
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        Request Form
                      </span>
                      <span className="text-xs text-gray-100">
                        Fill out the form below after sending payment
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-blue-600/40 shadow-lg">
                    <BanknoteArrowUp className="size-5 sm:size-6" />
                  </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex flex-col gap-3 p-4 sm:p-5 max-h-[70vh] overflow-y-auto">
                  {/* Payment Method Selection */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-500">
                      Payment Method <span className="text-red-500">*</span>
                    </span>
                    <select
                      value={topUpPaymentMethod}
                      onChange={(e) => setTopUpPaymentMethod(e.target.value)}
                      className="px-3 sm:px-4 py-2 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150"
                      disabled={isSubmittingTopUp}
                    >
                      <option value="MAYA">MAYA</option>
                      <option value="GCASH">GCASH</option>
                      <option value="MARIBANK">MARIBANK</option>
                      <option value="GOTYME">GOTYME</option>
                    </select>
                  </div>

                  {/* Payment Info */}
                  <div className="flex flex-col gap-2 p-2.5 sm:p-3 rounded-lg border border-blue-300 bg-blue-50">
                    <span className="text-xs sm:text-sm font-semibold text-blue-900">Send payment to:</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-800">
                        <span className="font-semibold">{topUpPaymentMethod}:</span> {PAYMENT_METHODS[topUpPaymentMethod]?.number}
                      </span>
                      <span className="text-xs text-gray-800">
                        <span className="font-semibold">Name:</span> {PAYMENT_METHODS[topUpPaymentMethod]?.name}
                      </span>
                    </div>
                  </div>

                  {/* Form Fields Section */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-500">
                      Request Details
                    </span>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      {/* Amount */}
                      <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                        <span className="text-gray-500 text-xs mb-0.5">
                          Amount (₱) <span className="text-red-500">*</span>
                        </span>
                        <input
                          type="number"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          placeholder="e.g. 100"
                          min="1"
                          step="0.01"
                          className="font-semibold text-xs sm:text-sm border-0 outline-none bg-transparent p-0"
                          disabled={isSubmittingTopUp}
                        />
                      </div>

                      {/* Reference ID */}
                      <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                        <span className="text-gray-500 text-xs mb-0.5">
                          {topUpPaymentMethod} Reference ID <span className="text-red-500">*</span>
                        </span>
                        <input
                          type="text"
                          value={topUpReferenceId}
                          onChange={(e) => setTopUpReferenceId(e.target.value)}
                          placeholder="Enter reference number"
                          className="font-semibold text-xs sm:text-sm border-0 outline-none bg-transparent p-0"
                          disabled={isSubmittingTopUp}
                        />
                      </div>
                    </div>

                    {/* Receipt Upload */}
                    <div className="flex flex-col gap-2 p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Payment Receipt <span className="text-red-500">*</span>
                      </span>
                      <input
                        id="receipt-upload-input"
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="text-xs sm:text-sm text-gray-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        disabled={isSubmittingTopUp}
                      />
                      {topUpReceiptPreview && (
                        <div className="mt-2 relative rounded-lg overflow-hidden border border-gray-300 group">
                          {/* Remove Button */}
                          <button
                            onClick={handleRemoveReceipt}
                            disabled={isSubmittingTopUp}
                            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            title="Remove receipt"
                          >
                            <X className="size-4" />
                          </button>
                          
                          {/* Clickable Receipt Preview */}
                          <div
                            onClick={handleReceiptPreviewClick}
                            className="cursor-pointer hover:opacity-90 transition-opacity duration-150"
                          >
                            <img
                              src={topUpReceiptPreview}
                              alt="Receipt preview"
                              className="w-full h-48 object-contain"
                            />
                            {/* Overlay hint */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors duration-150">
                              <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-black/50 px-3 py-1.5 rounded-lg">
                                Click to preview
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={handleSubmitTopUp}
                      disabled={isSubmittingTopUp}
                      className="w-full bg-green-500 px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmittingTopUp ? (
                        <>
                          <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Uploading...
                        </>
                      ) : (
                        "Submit Request"
                      )}
                    </button>
                    <button
                      onClick={closeTopUpModal}
                      disabled={isSubmittingTopUp}
                      className="w-full bg-gray-500 px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:bg-gray-500/90 active:bg-gray-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceiptPreview && topUpReceiptPreview && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 sm:p-5 z-[60] overflow-y-auto"
          onClick={handleCloseReceiptPreview}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={handleCloseReceiptPreview}
              className="absolute top-4 right-4 p-2 cursor-pointer rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors duration-150 text-white z-10"
            >
              <X className="size-5 sm:size-6" />
            </button>

            {/* Image Container */}
            <div className="relative w-full flex items-center justify-center">
              {receiptPreviewLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 animate-pulse">
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={topUpReceiptPreview}
                alt="Receipt Preview"
                className={`max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl ${receiptPreviewLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                onLoad={handleReceiptPreviewImageLoad}
                onError={() => setReceiptPreviewLoading(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Top-up Request Details Modal */}
      {selectedTopUpRequest && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300`}
          onClick={() => setSelectedTopUpRequest(null)}
        >
          <div 
            className={`rounded-2xl relative bg-white w-full max-w-2xl flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON - Top Middle */}
            <button
              onClick={() => setSelectedTopUpRequest(null)}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD */}
            <div className={`flex relative rounded-t-2xl p-4 sm:p-5 text-white ${
              selectedTopUpRequest.status === "approved"
                ? "bg-gradient-to-r from-green-500 via-green-400 to-green-500"
                : selectedTopUpRequest.status === "rejected"
                ? "bg-gradient-to-r from-red-500 via-red-400 to-red-500"
                : "bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500"
            }`}>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold">
                  Top-up Request
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    Transaction ID: {selectedTopUpRequest.documentId}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-100">
                      {selectedTopUpRequest.requestedAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {selectedTopUpRequest.type === "manual" && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/20 text-white">
                        Manual Top-up
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={`absolute top-3 right-3 rounded-full p-2.5 sm:p-3 ${
                selectedTopUpRequest.status === "approved"
                  ? "bg-green-600/40 shadow-green-600/40"
                  : selectedTopUpRequest.status === "rejected"
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
                      ₱{selectedTopUpRequest.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-xs sm:text-sm text-gray-500">Status</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        selectedTopUpRequest.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : selectedTopUpRequest.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {selectedTopUpRequest.status}
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
                      Payment Method
                    </span>
                    <span className="font-semibold text-xs sm:text-sm">
                      {selectedTopUpRequest.paymentMethod}
                    </span>
                  </div>

                  {/* Reference Number - Only show if payment method is not Cash */}
                  {selectedTopUpRequest.paymentMethod?.toLowerCase() !== "cash" && (
                    <div className="col-span-1 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Reference Number
                      </span>
                      <span className="font-semibold text-xs sm:text-sm break-all">
                        {selectedTopUpRequest.referenceId || "N/A"}
                      </span>
                    </div>
                  )}

                  {selectedTopUpRequest.processedAt && (
                    <div className="col-span-2 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Processed At
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {selectedTopUpRequest.processedAt.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {selectedTopUpRequest.note && (
                    <div className="col-span-2 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Note
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {selectedTopUpRequest.note}
                      </span>
                    </div>
                  )}

                  {/* Proof of payment - Only show if payment method is not Cash */}
                  {selectedTopUpRequest.paymentMethod?.toLowerCase() !== "cash" && (
                    <div className="col-span-2 flex flex-col rounded-lg gap-2">
                      <span className="text-gray-500 text-xs sm:text-sm">
                        Proof of payment
                      </span>
                      {selectedTopUpRequest.receiptURL ? (
                        <div 
                          className="border border-gray-300 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:border-emerald-500 transition-colors duration-150 relative"
                          onClick={() => {
                            setTopUpReceiptPreview(selectedTopUpRequest.receiptURL);
                            setShowReceiptPreview(true);
                            setReceiptPreviewLoading(true);
                          }}
                        >
                          <img
                            src={selectedTopUpRequest.receiptURL}
                            alt="Receipt"
                            className="w-full h-64 sm:h-72 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 bg-gray-100 rounded-lg h-64 sm:h-72 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No receipt image</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300`}
          onClick={() => setSelectedTransaction(null)}
        >
          <div 
            className={`rounded-2xl relative bg-white w-full max-w-2xl flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON - Top Middle */}
            <button
              onClick={() => setSelectedTransaction(null)}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD */}
            <div className={`flex relative rounded-t-2xl p-4 sm:p-5 text-white ${
              selectedTransaction.type === "Deducted"
                ? "bg-gradient-to-r from-red-500 via-red-400 to-red-500"
                : selectedTransaction.type === "Refund"
                ? "bg-gradient-to-r from-green-500 via-green-400 to-green-500"
                : "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"
            }`}>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold">
                  Transaction Details
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    Transaction ID: {selectedTransaction.documentId}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-100">
                      {selectedTransaction.timestamp.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {selectedTransaction.packageNumber && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/20 text-white">
                        Package {selectedTransaction.packageNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={`absolute top-3 right-3 rounded-full p-2.5 sm:p-3 ${
                selectedTransaction.type === "Deducted"
                  ? "bg-red-600/40 shadow-red-600/40"
                  : selectedTransaction.type === "Refund"
                  ? "bg-green-600/40 shadow-green-600/40"
                  : "bg-blue-600/40 shadow-blue-600/40"
              }`}>
                <History className="size-5 sm:size-6" />
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
                      selectedTransaction.type === "Deducted"
                        ? "text-red-600"
                        : selectedTransaction.type === "Refund"
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}>
                      {selectedTransaction.type === "Deducted" ? "-" : selectedTransaction.type === "Refund" ? "+" : ""}₱{selectedTransaction.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-xs sm:text-sm text-gray-500">Type</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        selectedTransaction.type === "Deducted"
                          ? "bg-red-100 text-red-700"
                          : selectedTransaction.type === "Refund"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {selectedTransaction.type}
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
                  {selectedTransaction.packageNumber && (
                    <div className="col-span-1 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Package
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        Package {selectedTransaction.packageNumber}
                      </span>
                    </div>
                  )}

                  {selectedTransaction.minutesPurchased > 0 && (
                    <div className="col-span-1 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Minutes Purchased
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {selectedTransaction.minutesPurchased} minutes
                      </span>
                    </div>
                  )}

                  {selectedTransaction.description && (
                    <div className="col-span-2 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Description
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {selectedTransaction.description}
                      </span>
                    </div>
                  )}

                  <div className="col-span-2 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs mb-0.5">
                      Date & Time
                    </span>
                    <span className="font-semibold text-xs sm:text-sm">
                      {selectedTransaction.timestamp.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>

                  {selectedTransaction.refunded && (
                    <div className="col-span-2 flex flex-col p-2.5 sm:p-3 rounded-lg border border-green-300 bg-green-50">
                      <span className="text-green-600 text-xs mb-0.5 font-semibold">
                        Refund Status
                      </span>
                      <span className="text-green-700 font-semibold text-xs sm:text-sm">
                        This transaction has been refunded
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Session Confirmation Modal */}
      {showEndSessionConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <TimerOff className="size-8 text-orange-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">End Session & Save Time</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Are you sure you want to end your current session? Your remaining time will be saved for your next visit.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="text-orange-600 size-5" />
                    <span className="font-semibold text-orange-900">
                      {(() => {
                        if (timeRemaining === 0) return "0 minutes";
                        const hours = Math.floor(timeRemaining / 3600);
                        const minutes = Math.floor((timeRemaining % 3600) / 60);
                        if (hours > 0) {
                          return `${hours}h ${minutes}m`;
                        } else {
                          return `${minutes} minutes`;
                        }
                      })()}
                    </span>
                    <span className="text-orange-700 text-sm">
                      will be saved
                    </span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-sm">Note</span>
                  <span className="text-gray-600 text-xs block mt-1">
                    Your internet access will be disconnected. Saved time will be available on your next scan.
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndSessionConfirm(false)}
                disabled={isEndingSession}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEndSession}
                disabled={isEndingSession}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isEndingSession ? (
                  <>
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Ending...
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Success Modal */}
      {showEndSessionSuccess && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="size-8 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-green-600 mb-2">Session Ended Successfully!</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Your remaining time has been saved.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="text-green-600 size-5" />
                    <span className="font-bold text-lg text-green-600">
                      {savedTimeMinutes} {savedTimeMinutes === 1 ? 'minute' : 'minutes'}
                    </span>
                    <span className="text-gray-600 text-sm">
                      saved for next visit
                    </span>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-green-200">
                    <div className="flex items-center justify-center min-w-6 min-h-6 bg-green-500 rounded-full mt-0.5">
                      <span className="text-white text-sm font-semibold">✓</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm">Session Ended</span>
                      <span className="text-gray-600 text-xs">
                        Your session has been ended. Saved time will be available on your next scan.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowEndSessionSuccess(false)}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* End Session Error Modal */}
      {showEndSessionError && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <X className="size-8 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-red-600 mb-2">Error Ending Session</h3>
                <p className="text-gray-600 text-sm">
                  {endSessionError || "An error occurred while ending your session. Please try again."}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowEndSessionError(false);
                setEndSessionError("");
              }}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// Main export with Suspense boundary
export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

