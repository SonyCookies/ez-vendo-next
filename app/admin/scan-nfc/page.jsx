"use client";

import {
  Radio,
  CircleCheckBig,
  CircleAlert,
  User,
  CreditCard,
  Clock,
  TrendingUp,
  Package,
  History,
  FileText,
  Activity,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Users,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import AdminNavbar from "../components/AdminNavbar";

export default function ScanNfc() {
  const [nfcModal, setNfcModal] = useState(false);
  const [isNfcClosing, setIsNfcClosing] = useState(false);
  const [isNfcOpening, setIsNfcOpening] = useState(false);
  const [isNfcOpen, setIsNfcOpen] = useState(false); // Track if modal is fully open
  const [isReadingNfc, setIsReadingNfc] = useState(false);
  const [nfcResult, setNfcResult] = useState(null);
  const [nfcMessage, setNfcMessage] = useState("");
  const [showNfcResult, setShowNfcResult] = useState(false);

  const [scannedRfid, setScannedRfid] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  // User summary data
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);
  const [manualTopUps, setManualTopUps] = useState([]);
  const [packagesBought, setPackagesBought] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [registrationAttempts, setRegistrationAttempts] = useState(0);
  const [totalTopUp, setTotalTopUp] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [averageSession, setAverageSession] = useState(0);
  const [mostCommonPayment, setMostCommonPayment] = useState("");

  // Format date time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "N/A";

    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return date.toLocaleString("en-US", options);
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "0 minutes";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  };

  // Check NFC Support
  const checkNfcSupport = () => {
    // Check if we're on HTTPS or localhost
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isSecure) {
      return {
        supported: false,
        message:
          "NFC requires a secure connection (HTTPS). Please access this page via HTTPS.",
      };
    }

    // Check if NDEFReader is available
    if (!("NDEFReader" in window)) {
      const userAgent = navigator.userAgent;
      const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
      const isEdge = /Edg/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);

      let browserInfo = "";
      if (isChrome && isAndroid) {
        browserInfo =
          "Your browser may need to be updated. Please ensure you're using Chrome 89+ on Android.";
      } else if (isEdge && isAndroid) {
        browserInfo =
          "Your browser may need to be updated. Please ensure you're using Edge 89+ on Android.";
      } else if (isAndroid) {
        browserInfo = "Please use Chrome 89+ or Edge 89+ on Android for NFC support.";
      } else {
        browserInfo =
          "NFC is only available on Android devices using Chrome 89+ or Edge 89+.";
      }

      return {
        supported: false,
        message: `NFC is not supported in this browser. ${browserInfo}`,
      };
    }

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    if (!isMobile) {
      return {
        supported: false,
        message:
          "NFC reading is only available on mobile devices. Please use Chrome on Android or Edge on Android.",
      };
    }

    return { supported: true };
  };

  // Start NFC Reading
  const startNfcReading = async () => {
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
        const cleanedRfid = serialNumber.replace(/:/g, "").toUpperCase();

        setScannedRfid(cleanedRfid);
        setNfcResult("success");
        setNfcMessage(`RFID read successfully: ${cleanedRfid}`);
        setShowNfcResult(true);
        setIsReadingNfc(false);

        setTimeout(() => {
          closeNfcModal();
          fetchUserData(cleanedRfid);
        }, 1500);
      });

      ndef.addEventListener("readingerror", (error) => {
        console.error("NFC reading error:", error);
        setNfcResult("error");
        setNfcMessage(
          "Failed to read NFC tag. Please ensure the tag is close to your device and try again."
        );
        setShowNfcResult(true);
        setIsReadingNfc(false);
      });
    } catch (error) {
      console.error("NFC reading error:", error);
      let errorMessage = "Failed to start NFC reading.";

      if (
        error.name === "NotAllowedError" ||
        error.name === "NotSupportedError"
      ) {
        errorMessage =
          "NFC permission denied or not supported. Please check your device settings and ensure NFC is enabled.";
      } else if (error.name === "SecurityError") {
        errorMessage =
          "NFC requires a secure connection (HTTPS). Please access this page via HTTPS.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setNfcResult("error");
      setNfcMessage(errorMessage);
      setShowNfcResult(true);
      setIsReadingNfc(false);
    }
  };

  // Open NFC Modal
  const openNfcModal = () => {
    setNfcModal(true);
    setIsNfcOpening(true);
    setIsNfcClosing(false);
    setIsNfcOpen(false);
    setShowNfcResult(false);
    setNfcResult(null);
    setNfcMessage("");
    setIsReadingNfc(false);

    requestAnimationFrame(() => {
      setTimeout(() => {
        setIsNfcOpening(false);
        setIsNfcOpen(true);
      }, 10);
    });
  };

  // Close NFC Modal
  const closeNfcModal = () => {
    setIsNfcClosing(true);
    setIsNfcOpen(false);
    setIsReadingNfc(false);

    setTimeout(() => {
      setNfcModal(false);
      setIsNfcClosing(false);
      setIsNfcOpening(false);
      setShowNfcResult(false);
      setNfcResult(null);
      setNfcMessage("");
    }, 300);
  };

  // Fetch User Data
  const fetchUserData = async (rfid) => {
    setLoading(true);
    try {
      // Initialize payment methods tracking (used across all queries)
      const paymentMethods = {};
      
      // Fetch user document
      const userDocRef = doc(db, "users", rfid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const userDataObj = userDocSnap.data();
      setUserData({
        id: rfid,
        ...userDataObj,
      });

      // Fetch pending top-up requests
      const pendingRequestsQuery = query(
        collection(db, "topup_requests"),
        where("userId", "==", rfid),
        where("status", "==", "pending")
      );
      const pendingSnapshot = await getDocs(pendingRequestsQuery);
      const pendingData = [];
      pendingSnapshot.forEach((doc) => {
        pendingData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setPendingRequests(pendingData);

      // Fetch top-up request history
      const historyQuery = query(
        collection(db, "topup_requests"),
        where("userId", "==", rfid)
      );
      const historySnapshot = await getDocs(historyQuery);
      const historyData = [];
      historySnapshot.forEach((doc) => {
        const data = doc.data();
        historyData.push({
          id: doc.id,
          ...data,
        });
        
        // Track payment methods from top-up requests
        if (data.paymentMethod) {
          const method = data.paymentMethod.toLowerCase();
          paymentMethods[method] = (paymentMethods[method] || 0) + 1;
        }
      });
      // Sort by date descending
      historyData.sort((a, b) => {
        const dateA = a.requestedAt?.toDate
          ? a.requestedAt.toDate()
          : new Date(a.requestedAt || 0);
        const dateB = b.requestedAt?.toDate
          ? b.requestedAt.toDate()
          : new Date(b.requestedAt || 0);
        return dateB - dateA;
      });
      setRequestHistory(historyData);

      // Fetch manual top-ups
      const manualTopUpQuery = query(
        collection(db, "manual_topup"),
        where("userId", "==", rfid)
      );
      const manualSnapshot = await getDocs(manualTopUpQuery);
      const manualData = [];
      
      manualSnapshot.forEach((doc) => {
        const data = doc.data();
        manualData.push({
          id: doc.id,
          ...data,
        });
        
        // Track payment methods from manual top-ups
        if (data.paymentMethod) {
          const method = data.paymentMethod.toLowerCase();
          paymentMethods[method] = (paymentMethods[method] || 0) + 1;
        }
      });
      // Sort by date descending
      manualData.sort((a, b) => {
        const dateA = a.requestedAt?.toDate
          ? a.requestedAt.toDate()
          : new Date(a.requestedAt || 0);
        const dateB = b.requestedAt?.toDate
          ? b.requestedAt.toDate()
          : new Date(b.requestedAt || 0);
        return dateB - dateA;
      });
      setManualTopUps(manualData);

      // Fetch transactions (packages bought)
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("userId", "==", rfid)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const packagesData = [];
      let totalTopUpAmount = 0;

      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === "Top-up" || data.type === "Deducted") {
          totalTopUpAmount += data.amount || 0;
        }

        // Track payment methods from transactions
        if (data.paymentMethod) {
          const method = data.paymentMethod.toLowerCase();
          paymentMethods[method] = (paymentMethods[method] || 0) + 1;
        }

        // Only include package purchases
        if (doc.id.startsWith("PACK")) {
          packagesData.push({
            id: doc.id,
            ...data,
          });
        }
      });

      // Sort packages by date descending
      packagesData.sort((a, b) => {
        const dateA = a.timestamp?.toDate
          ? a.timestamp.toDate()
          : new Date(a.timestamp || 0);
        const dateB = b.timestamp?.toDate
          ? b.timestamp.toDate()
          : new Date(b.timestamp || 0);
        return dateB - dateA;
      });
      setPackagesBought(packagesData);

      // Calculate most common payment method
      const mostCommon = Object.entries(paymentMethods).sort(
        (a, b) => b[1] - a[1]
      )[0];
      
      // Normalize payment method name
      let normalizedPayment = "N/A";
      if (mostCommon) {
        const method = mostCommon[0].toLowerCase();
        if (method === "gcash" || method === "gcash") {
          normalizedPayment = "GCash";
        } else if (method === "maya") {
          normalizedPayment = "Maya";
        } else if (method === "maribank" || method === "mari") {
          normalizedPayment = "Maribank";
        } else if (method === "gotyme") {
          normalizedPayment = "GoTyme";
        } else if (method === "cash") {
          normalizedPayment = "Cash";
        } else {
          normalizedPayment = mostCommon[0].charAt(0).toUpperCase() + mostCommon[0].slice(1);
        }
      }
      setMostCommonPayment(normalizedPayment);

      // Add manual top-up amounts to total
      manualData.forEach((topup) => {
        totalTopUpAmount += topup.amount || 0;
      });
      historyData.forEach((request) => {
        if (request.status === "approved") {
          totalTopUpAmount += request.amount || 0;
        }
      });
      setTotalTopUp(totalTopUpAmount);

      // Fetch session history
      const sessionQuery = query(
        collection(db, "session_history"),
        where("userId", "==", rfid)
      );
      const sessionSnapshot = await getDocs(sessionQuery);
      const sessionData = [];
      let totalSessionSeconds = 0;

      sessionSnapshot.forEach((doc) => {
        const data = doc.data();
        const duration = data.durationSeconds || 0;
        totalSessionSeconds += duration;
        sessionData.push({
          id: doc.id,
          ...data,
        });
      });

      // Sort by date descending
      sessionData.sort((a, b) => {
        const dateA = a.sessionStartTime?.toDate
          ? a.sessionStartTime.toDate()
          : a.timestamp?.toDate
          ? a.timestamp.toDate()
          : new Date(a.timestamp || 0);
        const dateB = b.sessionStartTime?.toDate
          ? b.sessionStartTime.toDate()
          : b.timestamp?.toDate
          ? b.timestamp.toDate()
          : new Date(b.timestamp || 0);
        return dateB - dateA;
      });
      setSessionHistory(sessionData);
      setTotalSessionTime(totalSessionSeconds);
      setAverageSession(
        sessionData.length > 0
          ? Math.floor(totalSessionSeconds / sessionData.length)
          : 0
      );

      // Fetch registration attempts (count documents in users collection with same RFID before registration)
      // This is a simplified approach - you might need to adjust based on your data structure
      const registrationAttemptsQuery = query(
        collection(db, "users"),
        where("rfidCardId", "==", rfid)
      );
      const attemptsSnapshot = await getDocs(registrationAttemptsQuery);
      setRegistrationAttempts(attemptsSnapshot.size);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getButtonClass = (tabName) => {
    const baseClasses =
      "rounded-lg cursor-pointer px-4 py-3 transition-colors duration-150";
    const isActive = activeTab === tabName;

    return isActive
      ? `${baseClasses} border border-green-500 bg-green-500 text-white`
      : `${baseClasses} border border-gray-300 text-gray-800 hover:bg-gray-100`;
  };

  return (
    <div className="h-dvh flex flex-col lg:flex-row text-sm sm:text-base relative overflow-hidden">
      <AdminNavbar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <AdminDesktopNavbar />

        <div className="flex flex-col xl:flex-row px-3 py-4 sm:p-4 md:p-5 gap-4 xl:gap-5">
          {/* Tabs Container - Horizontal scroll on mobile, vertical on desktop */}
          <div className="flex xl:flex-col xl:w-72 gap-2 overflow-x-auto xl:overflow-x-visible scrollbar-hide xl:scrollbar-default scroll-smooth">
            <div className="flex xl:flex-col items-center gap-2 min-w-max xl:min-w-0">
              {/* Scan NFC Button */}
              <button
                onClick={openNfcModal}
                className="rounded-lg cursor-pointer px-4 py-3 transition-colors duration-150 border border-green-500 bg-green-500 text-white hover:bg-green-600 active:bg-green-700 flex-shrink-0 xl:w-full flex items-center justify-center gap-2"
              >
                <Radio className="size-5" />
                <span>Scan NFC</span>
              </button>

              {scannedRfid && userData && (
                <>
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`${getButtonClass("overview")} flex-shrink-0 xl:w-full`}
                  >
                    Overview
                  </button>

                  <button
                    onClick={() => setActiveTab("personal")}
                    className={`${getButtonClass("personal")} flex-shrink-0 xl:w-full`}
                  >
                    Personal Info
                  </button>

                  <button
                    onClick={() => setActiveTab("account")}
                    className={`${getButtonClass("account")} flex-shrink-0 xl:w-full`}
                  >
                    Account Info
                  </button>

                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`${getButtonClass("pending")} flex-shrink-0 xl:w-full`}
                  >
                    Pending Requests
                  </button>

                  <button
                    onClick={() => setActiveTab("history")}
                    className={`${getButtonClass("history")} flex-shrink-0 xl:w-full`}
                  >
                    Request History
                  </button>

                  <button
                    onClick={() => setActiveTab("manual")}
                    className={`${getButtonClass("manual")} flex-shrink-0 xl:w-full`}
                  >
                    Manual Top-ups
                  </button>

                  <button
                    onClick={() => setActiveTab("packages")}
                    className={`${getButtonClass("packages")} flex-shrink-0 xl:w-full`}
                  >
                    Packages Bought
                  </button>

                  <button
                    onClick={() => setActiveTab("sessions")}
                    className={`${getButtonClass("sessions")} flex-shrink-0 xl:w-full`}
                  >
                    Session Activity
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {!scannedRfid ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
                <div className="rounded-full p-6 bg-gray-100">
                  <Radio className="size-12 text-gray-400" />
                </div>
                <div className="flex flex-col text-center gap-2">
                  <span className="text-xl font-semibold text-gray-800">
                    No RFID Scanned
                  </span>
                  <span className="text-sm text-gray-600">
                    Click "Scan NFC" to start scanning an RFID tag
                  </span>
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <span className="text-gray-600">Loading user data...</span>
              </div>
            ) : !userData ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
                <div className="rounded-full p-6 bg-red-100">
                  <CircleAlert className="size-12 text-red-500" />
                </div>
                <div className="flex flex-col text-center gap-2">
                  <span className="text-xl font-semibold text-red-600">
                    User Not Found
                  </span>
                  <span className="text-sm text-gray-600">
                    No user found with RFID: {scannedRfid}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Header Card */}
                <div className="flex relative rounded-2xl p-4 sm:p-5 text-white bg-gradient-to-r from-green-500 via-green-400 to-green-500">
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-xl sm:text-2xl font-bold">
                      User Summary
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        {userData.fullName || "N/A"}
                      </span>
                      <span className="text-xs text-gray-100">
                        RFID: {scannedRfid}
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-green-600/40 shadow-green-600/40">
                    <User className="size-5 sm:size-6" />
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === "overview" && (
                  <div className="flex flex-col gap-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl border border-gray-300 p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-gray-500">
                            Total Top-up
                          </span>
                          <DollarSign className="size-5 text-green-500" />
                        </div>
                        <span className="text-xl sm:text-2xl font-bold">
                          ₱{totalTopUp.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-300 p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-gray-500">
                            Total Sessions
                          </span>
                          <Activity className="size-5 text-blue-500" />
                        </div>
                        <span className="text-xl sm:text-2xl font-bold">
                          {sessionHistory.length}
                        </span>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-300 p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-gray-500">
                            Total Session Time
                          </span>
                          <Clock className="size-5 text-purple-500" />
                        </div>
                        <span className="text-xl sm:text-2xl font-bold">
                          {formatDuration(totalSessionTime)}
                        </span>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-300 p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-gray-500">
                            Average Session
                          </span>
                          <TrendingUp className="size-5 text-orange-500" />
                        </div>
                        <span className="text-xl sm:text-2xl font-bold">
                          {formatDuration(averageSession)}
                        </span>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-300 p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-gray-500">
                            Most Common Payment
                          </span>
                          <CreditCard className="size-5 text-indigo-500" />
                        </div>
                        <span className="text-xl sm:text-2xl font-bold">
                          {mostCommonPayment}
                        </span>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-300 p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-gray-500">
                            Registration Attempts
                          </span>
                          <Users className="size-5 text-pink-500" />
                        </div>
                        <span className="text-xl sm:text-2xl font-bold">
                          {registrationAttempts}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "personal" && (
                  <div className="bg-white rounded-xl border border-gray-300 p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-gray-500">
                        Personal Information
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                          <span className="text-gray-500 text-xs mb-0.5">
                            Full Name
                          </span>
                          <span className="font-semibold text-xs sm:text-sm">
                            {userData.fullName || "N/A"}
                          </span>
                        </div>

                        <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                          <span className="text-gray-500 text-xs mb-0.5">
                            Birthday
                          </span>
                          <span className="font-semibold text-xs sm:text-sm">
                            {userData.birthday || "N/A"}
                          </span>
                        </div>

                        <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                          <span className="text-gray-500 text-xs mb-0.5">
                            Age
                          </span>
                          <span className="font-semibold text-xs sm:text-sm">
                            {userData.age || "N/A"}
                          </span>
                        </div>

                        <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                          <span className="text-gray-500 text-xs mb-0.5">
                            Gender
                          </span>
                          <span className="font-semibold text-xs sm:text-sm">
                            {userData.gender || "N/A"}
                          </span>
                        </div>

                        <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                          <span className="text-gray-500 text-xs mb-0.5">
                            Phone
                          </span>
                          <span className="font-semibold text-xs sm:text-sm">
                            {userData.phone || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                        <span className="text-gray-500 text-xs mb-0.5">
                          Email
                        </span>
                        <span className="font-semibold text-xs sm:text-sm break-all">
                          {userData.email || "N/A"}
                        </span>
                      </div>

                      <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                        <span className="text-gray-500 text-xs mb-0.5">
                          Address
                        </span>
                        <span className="font-semibold text-xs sm:text-sm break-words">
                          {userData.address || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "account" && (
                  <div className="bg-white rounded-xl border border-gray-300 p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-gray-500">
                        Account Information
                      </span>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                          <span className="text-gray-500 text-xs mb-0.5">
                            RFID Card ID
                          </span>
                          <span className="font-semibold text-xs sm:text-sm">
                            {scannedRfid}
                          </span>
                        </div>

                        <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                          <span className="text-gray-500 text-xs mb-0.5">
                            Account Status
                          </span>
                          <div
                            className={`inline-flex text-xs px-3 py-1 rounded-full text-white font-medium w-fit ${
                              userData.status === "active"
                                ? "bg-green-500"
                                : userData.status === "blacklisted"
                                ? "bg-red-500"
                                : "bg-gray-500"
                            }`}
                          >
                            {userData.status === "active"
                              ? "Active"
                              : userData.status === "blacklisted"
                              ? "Blacklisted"
                              : userData.status || "Unknown"}
                          </div>
                        </div>

                        {userData.balance !== undefined && (
                          <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                            <span className="text-gray-500 text-xs mb-0.5">
                              Current Balance
                            </span>
                            <span className="font-semibold text-xs sm:text-sm text-green-600">
                              ₱{userData.balance?.toLocaleString() || "0.00"}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                          <span className="text-gray-500 text-xs mb-0.5">
                            Registered
                          </span>
                          <span className="font-semibold text-xs sm:text-sm">
                            {userData.isRegistered ? "Yes" : "No"}
                          </span>
                        </div>

                        {userData.registeredAt && (
                          <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                            <span className="text-gray-500 text-xs mb-0.5">
                              Date Registered
                            </span>
                            <span className="font-semibold text-xs sm:text-sm">
                              {userData.registeredAt?.toDate
                                ? userData.registeredAt
                                    .toDate()
                                    .toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                : "N/A"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "pending" && (
                  <div className="bg-white rounded-xl border border-gray-300 p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-semibold">
                        Pending Requests ({pendingRequests.length})
                      </span>
                    </div>
                    {pendingRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No pending requests
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {pendingRequests.map((request) => (
                          <div
                            key={request.id}
                            className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                ₱{request.amount?.toFixed(2) || "0.00"}
                              </span>
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                                Pending
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Payment: {request.paymentMethod || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              Date: {formatDateTime(request.requestedAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="bg-white rounded-xl border border-gray-300 p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-semibold">
                        Request History ({requestHistory.length})
                      </span>
                    </div>
                    {requestHistory.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No request history
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {requestHistory.map((request) => (
                          <div
                            key={request.id}
                            className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                ₱{request.amount?.toFixed(2) || "0.00"}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  request.status === "approved"
                                    ? "bg-green-100 text-green-700"
                                    : request.status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {request.status || "N/A"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Payment: {request.paymentMethod || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              Date: {formatDateTime(request.requestedAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "manual" && (
                  <div className="bg-white rounded-xl border border-gray-300 p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-semibold">
                        Manual Top-ups ({manualTopUps.length})
                      </span>
                    </div>
                    {manualTopUps.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No manual top-ups
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {manualTopUps.map((topup) => (
                          <div
                            key={topup.id}
                            className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                ₱{topup.amount?.toFixed(2) || "0.00"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {topup.paymentMethod || "N/A"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Date: {formatDateTime(topup.requestedAt)}
                            </div>
                            {topup.note && (
                              <div className="text-xs text-gray-500">
                                Note: {topup.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "packages" && (
                  <div className="bg-white rounded-xl border border-gray-300 p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-semibold">
                        Packages Bought ({packagesBought.length})
                      </span>
                    </div>
                    {packagesBought.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No packages bought
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {packagesBought.map((pkg) => (
                          <div
                            key={pkg.id}
                            className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                {pkg.id || "N/A"}
                              </span>
                              <span className="font-semibold">
                                ₱{pkg.amount?.toFixed(2) || "0.00"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Minutes: {pkg.minutesPurchased || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              Date: {formatDateTime(pkg.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sessions" && (
                  <div className="bg-white rounded-xl border border-gray-300 p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-semibold">
                        Session Activity ({sessionHistory.length})
                      </span>
                    </div>
                    {sessionHistory.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No session history
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {sessionHistory.map((session) => (
                          <div
                            key={session.id}
                            className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                {formatDuration(session.durationSeconds || 0)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Start:{" "}
                              {formatDateTime(
                                session.sessionStartTime || session.timestamp
                              )}
                            </div>
                            {session.sessionEndTime && (
                              <div className="text-xs text-gray-500">
                                End: {formatDateTime(session.sessionEndTime)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
                : isNfcOpen
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

