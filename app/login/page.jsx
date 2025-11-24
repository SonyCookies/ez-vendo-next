"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, db, onAuthStateChanged } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import {
  LogIn,
  Mail,
  Lock,
  CircleAlert,
  CircleCheckBig,
  ArrowLeft,
  Radio,
  X,
} from "lucide-react";

export default function UserLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // NFC Login states
  const [nfcModal, setNfcModal] = useState(false);
  const [isReadingNfc, setIsReadingNfc] = useState(false);
  const [nfcError, setNfcError] = useState("");
  const [nfcResult, setNfcResult] = useState(null); // "success" or "error"
  const [nfcMessage, setNfcMessage] = useState("");
  const [showNfcResult, setShowNfcResult] = useState(false);
  const [scannedRfid, setScannedRfid] = useState("");
  const [scannedUserName, setScannedUserName] = useState("");
  const [pinModalRfid, setPinModalRfid] = useState(""); // RFID specifically for PIN modal
  const [pinModal, setPinModal] = useState(false);
  const [pin, setPin] = useState(""); // Keep for backward compatibility
  const [pinBoxes, setPinBoxes] = useState(["", "", "", ""]);
  const [activePinBox, setActivePinBox] = useState(0);
  const pinBoxRefs = useRef([null, null, null, null]);
  const [pinError, setPinError] = useState("");
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);
  
  // Auto-focus first PIN box when modal opens
  useEffect(() => {
    if (pinModal && !pinSuccess) {
      setTimeout(() => {
        setActivePinBox(0);
        if (pinBoxRefs.current[0]) {
          pinBoxRefs.current[0].focus();
        }
      }, 100);
    }
  }, [pinModal, pinSuccess]);
  
  // Handle paste event for PIN
  useEffect(() => {
    const handlePaste = (e) => {
      if (!pinModal || pinSuccess) return;
      
      const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
      if (pastedText.length === 4) {
        const newBoxes = pastedText.split("");
        setPinBoxes(newBoxes);
        setActivePinBox(3);
        setPinError("");
        e.preventDefault();
      }
    };
    
    if (pinModal) {
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }
  }, [pinModal, pinSuccess]);

  // Redirect if already authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is already logged in, redirect to dashboard
        router.replace("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess(true);
      router.replace("/dashboard");
    } catch (err) {
      const code = err.code || "auth/error";
      let message = "Failed to sign in";
      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found"
      )
        message = "Invalid email or password";
      if (code === "auth/wrong-password") message = "Incorrect password";
      if (code === "auth/too-many-requests")
        message = "Too many attempts. Try later.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }
  
  const checkNfcSupport = () => {
    if (typeof window === "undefined") return false;
    if (!("NDEFReader" in window)) {
      return false;
    }
    // Check if HTTPS or localhost
    const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    return isSecure;
  };
  
  const openNfcModal = () => {
    if (!checkNfcSupport()) {
      setNfcResult("error");
      setNfcMessage("NFC is not supported in this browser or requires HTTPS. Please use Chrome on Android or a compatible browser with HTTPS.");
      setShowNfcResult(true);
      setNfcModal(true);
      return;
    }
    setNfcError("");
    setNfcResult(null);
    setNfcMessage("");
    setShowNfcResult(false);
    setNfcModal(true);
  };
  
  const closeNfcModal = () => {
    setNfcModal(false);
    setIsReadingNfc(false);
    setNfcError("");
    setNfcResult(null);
    setNfcMessage("");
    setShowNfcResult(false);
    // Don't clear scannedRfid here - it's preserved in pinModalRfid for PIN verification
    // Only clear if user manually cancels (handled in cancel button)
  };
  
  const startNfcReading = async () => {
    if (!checkNfcSupport()) {
      setNfcError("NFC is not supported in this browser or requires HTTPS.");
      return;
    }
    
    setIsReadingNfc(true);
    setNfcError("");
    
    try {
      const ndef = new window.NDEFReader();
      await ndef.scan();
      
      ndef.addEventListener("reading", async ({ message, serialNumber }) => {
        try {
          // Clean the serial number (remove colons and convert to uppercase)
          const cleanedRfid = serialNumber.replace(/:/g, "").toUpperCase();
          
          setIsReadingNfc(false);
          
          // Find user by RFID
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("rfidCardId", "==", cleanedRfid));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            setNfcResult("error");
            setNfcMessage("RFID not found. Please check your card or contact support.");
            setShowNfcResult(true);
            return;
          }
          
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          
          // Check if RFID login is enabled
          if (!userData.rfidLoginEnabled) {
            setNfcResult("error");
            setNfcMessage("RFID login is not enabled for this account. Please use email and password.");
            setShowNfcResult(true);
            return;
          }
          
          // Check if PIN is set
          if (!userData.rfidPin) {
            setNfcResult("error");
            setNfcMessage("PIN not set for this account. Please set a PIN in settings.");
            setShowNfcResult(true);
            return;
          }
          
          // Show success feedback with user name
          setScannedRfid(cleanedRfid);
          const userName = userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User";
          setScannedUserName(userName);
          setNfcResult("success");
          setNfcMessage(`RFID read successfully: ${userName}`);
          setShowNfcResult(true);
          
          // Store RFID for PIN modal (separate state to ensure it persists)
          setPinModalRfid(cleanedRfid);
          
          // Close NFC modal after a short delay, then open PIN modal
          setTimeout(() => {
            closeNfcModal();
            
            // After closing NFC modal, open PIN modal
            setTimeout(() => {
              setPinModal(true);
            }, 350); // Wait for NFC modal to fully close
          }, 1500);
          
        } catch (err) {
          console.error("Error reading NFC:", err);
          setNfcResult("error");
          setNfcMessage("Failed to read RFID. Please try again.");
          setShowNfcResult(true);
          setIsReadingNfc(false);
        }
      });
      
      ndef.addEventListener("readingerror", (error) => {
        console.error("NFC reading error:", error);
        setNfcResult("error");
        setNfcMessage("Failed to read RFID. Please ensure the tag is close to your device and try again.");
        setShowNfcResult(true);
        setIsReadingNfc(false);
      });
      
    } catch (err) {
      console.error("NFC error:", err);
      let errorMessage = "Failed to start NFC reading.";
      
      if (err.name === "NotAllowedError" || err.name === "NotSupportedError") {
        errorMessage = "NFC permission denied or not supported. Please check your device settings and ensure NFC is enabled.";
      } else if (err.name === "SecurityError") {
        errorMessage = "NFC requires a secure connection (HTTPS). Please access this page via HTTPS.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setNfcResult("error");
      setNfcMessage(errorMessage);
      setShowNfcResult(true);
      setIsReadingNfc(false);
    }
  };
  
  const handlePinSubmit = async () => {
    const pinValue = pinBoxes.join("");
    if (!pinValue || pinValue.length !== 4) {
      setPinError("PIN must be exactly 4 digits");
      return;
    }
    
    // Use pinModalRfid (passed from NFC scan) or fallback to scannedRfid
    const rfidToUse = pinModalRfid || scannedRfid;
    
    // Check if RFID is available
    if (!rfidToUse || rfidToUse.trim() === "") {
      console.error("No scanned RFID available", { pinModalRfid, scannedRfid });
      setPinError("RFID not found. Please scan your card again.");
      setVerifyingPin(false);
      return;
    }
    
    setVerifyingPin(true);
    setPinError("");
    
    try {
      // Find user by scanned RFID
      const usersRef = collection(db, "users");
      const cleanedScannedRfid = rfidToUse.trim().toUpperCase();
      
      console.log("PIN Verification - Searching for user:", {
        pinModalRfid: pinModalRfid,
        scannedRfid: scannedRfid,
        rfidToUse: rfidToUse,
        cleanedScannedRfid: cleanedScannedRfid,
        pinValue: pinValue,
        rfidType: typeof rfidToUse,
        rfidLength: rfidToUse?.length
      });
      
      // Try both field names in case the document ID is the RFID
      let q = query(usersRef, where("rfidCardId", "==", cleanedScannedRfid));
      let querySnapshot = await getDocs(q);
      
      // If not found, try searching by document ID
      if (querySnapshot.empty) {
        console.log("Not found by rfidCardId, trying document ID...");
        try {
          const userDocRef = doc(db, "users", cleanedScannedRfid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            // Create a mock query snapshot with this document
            querySnapshot = {
              empty: false,
              size: 1,
              docs: [userDocSnap]
            };
            console.log("Found user by document ID");
          }
        } catch (docError) {
          console.log("Document ID lookup failed:", docError);
        }
      }
      
      console.log("Query result:", {
        empty: querySnapshot.empty,
        size: querySnapshot.size,
        docs: querySnapshot.docs.map(doc => ({
          id: doc.id,
          rfidCardId: doc.data().rfidCardId,
          documentId: doc.id
        }))
      });
      
      if (querySnapshot.empty) {
        // Try case-insensitive search as fallback
        const allUsersSnapshot = await getDocs(usersRef);
        const matchingUser = allUsersSnapshot.docs.find(doc => {
          const userRfid = String(doc.data().rfidCardId || "").trim().toUpperCase();
          return userRfid === cleanedScannedRfid;
        });
        
        if (matchingUser) {
          console.log("Found user with case-insensitive search");
          const userDoc = matchingUser;
          const userData = userDoc.data();
          
          // Verify PIN
          const storedPin = String(userData.rfidPin || "").trim();
          const enteredPin = String(pinValue).trim();
          
          console.log("PIN Verification:", {
            scannedRfid: cleanedScannedRfid,
            storedPin,
            enteredPin,
            match: storedPin === enteredPin,
            userData: {
              rfidLoginEnabled: userData.rfidLoginEnabled,
              hasRfidPin: !!userData.rfidPin,
            }
          });
          
          if (storedPin !== enteredPin) {
            setPinError("Incorrect PIN. Please try again.");
            setVerifyingPin(false);
            setPinBoxes(["", "", "", ""]);
            setActivePinBox(0);
            setTimeout(() => {
              if (pinBoxRefs.current[0]) {
                pinBoxRefs.current[0].focus();
              }
            }, 100);
            return;
          }
          
          // PIN is correct - continue with sign in
          if (!userData.email || !userData.encryptedPassword) {
            setPinError("Account not properly configured. Please enable RFID login in settings.");
            setVerifyingPin(false);
            return;
          }
          
          try {
            const decryptedPassword = atob(userData.encryptedPassword);
            await signInWithEmailAndPassword(auth, userData.email, decryptedPassword);
            
            setPinSuccess(true);
            setPinError("");
            
            setTimeout(() => {
              setPinModal(false);
              setPin("");
              setPinBoxes(["", "", "", ""]);
              setActivePinBox(0);
              setScannedRfid("");
              setScannedUserName("");
              setPinModalRfid("");
              setPinSuccess(false);
              router.replace("/dashboard");
            }, 1500);
          } catch (err) {
            console.error("Sign in error:", err);
            const code = err.code || "auth/error";
            if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
              setPinError("Authentication failed. Please contact support.");
            } else {
              setPinError("Failed to sign in. Please try again.");
            }
            setVerifyingPin(false);
            setPinSuccess(false);
          }
          return;
        }
        
        setPinError(`User not found. Scanned RFID: ${cleanedScannedRfid}. Please scan your card again.`);
        setVerifyingPin(false);
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Verify PIN - compare as strings
      const storedPin = String(userData.rfidPin || "").trim();
      const enteredPin = String(pinValue).trim();
      
      console.log("PIN Verification:", {
        scannedRfid,
        storedPin,
        enteredPin,
        match: storedPin === enteredPin,
        userData: {
          rfidLoginEnabled: userData.rfidLoginEnabled,
          hasRfidPin: !!userData.rfidPin,
        }
      });
      
      if (storedPin !== enteredPin) {
        setPinError("Incorrect PIN. Please try again.");
        setVerifyingPin(false);
        // Clear PIN boxes on incorrect entry
        setPinBoxes(["", "", "", ""]);
        setActivePinBox(0);
        setTimeout(() => {
          if (pinBoxRefs.current[0]) {
            pinBoxRefs.current[0].focus();
          }
        }, 100);
        return;
      }
      
      // PIN is correct - sign in with email and encrypted password
      if (!userData.email || !userData.encryptedPassword) {
        setPinError("Account not properly configured. Please enable RFID login in settings.");
        setVerifyingPin(false);
        return;
      }
      
      try {
        // Decrypt password (simple base64 decode - match encryption in SettingsTab)
        const decryptedPassword = atob(userData.encryptedPassword);
        
        await signInWithEmailAndPassword(auth, userData.email, decryptedPassword);
        
        // Show success feedback
        setPinSuccess(true);
        setPinError("");
        
        // Close PIN modal and redirect after a short delay
        setTimeout(() => {
          setPinModal(false);
          setPin("");
          setPinBoxes(["", "", "", ""]);
          setActivePinBox(0);
          setScannedRfid("");
          setScannedUserName("");
          setPinModalRfid("");
          setPinSuccess(false);
          router.replace("/dashboard");
        }, 1500);
      } catch (err) {
        console.error("Sign in error:", err);
        const code = err.code || "auth/error";
        if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
          setPinError("Authentication failed. Please contact support.");
        } else {
          setPinError("Failed to sign in. Please try again.");
        }
        setVerifyingPin(false);
        setPinSuccess(false);
      }
      
    } catch (err) {
      console.error("Error verifying PIN:", err);
      setPinError("Failed to verify PIN. Please try again.");
      setVerifyingPin(false);
    }
  };

  return (
    <main className="w-full min-h-dvh bg-white overflow-x-hidden relative">
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

      {/* ===== NAVIGATION ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between relative z-10">
          <Link href="/" className="flex sm:hidden relative items-center gap-2">
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
          </Link>
          <Link
            href="/"
            className="hidden sm:flex relative items-center gap-2"
          >
            <Image
              src="/favicon.ico"
              alt="EZ-Vendo Logo"
              width={50}
              height={50}
              className=""
            />
            <span className="font-bold text-2xl">
              <span className="text-green-500">EZ</span>-Vendo
            </span>
          </Link>

          <Link href="/">
            <button className="px-6 py-2 rounded-full border-2 border-emerald-600 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 transition-all duration-150 cursor-pointer flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </Link>
        </div>
      </nav>

      {/* ===== LOGIN SECTION ===== */}
      <section className="relative w-full min-h-screen flex items-center justify-center px-6 sm:px-8 pt-32 pb-20 z-10">
        <div className="max-w-md mx-auto w-full">
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Header Card */}
            <div className="flex relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 p-4 sm:p-5 text-white shadow-lg">
              <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-2xl xl:text-3xl font-bold">
                  Welcome Back
                </span>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm xl:text-base font-semibold text-white/90">
                    Sign in to your account
                  </span>
                </div>
              </div>
              <div className="absolute top-1/2 right-3 sm:right-4 -translate-y-1/2 rounded-full p-2.5 sm:p-3 bg-emerald-600/40 shadow-lg">
                <LogIn className="size-5 sm:size-6 xl:size-7" />
              </div>
            </div>

            {/* Login Form Card */}
            <div className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-xl shadow-xl">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-xs sm:text-sm">
                  <CircleAlert className="size-4 sm:size-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 text-green-700 text-xs sm:text-sm">
                  <CircleCheckBig className="size-4 sm:size-5 flex-shrink-0" />
                  <span>Signed in successfully</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
                {/* Email Field */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-xs sm:text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="size-4 sm:size-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm sm:text-base"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-xs sm:text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="size-4 sm:size-5" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm sm:text-base"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-sm sm:text-base cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-xs text-gray-500">OR</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {/* NFC Login Button */}
              <button
                onClick={openNfcModal}
                disabled={loading}
                className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-sm sm:text-base cursor-pointer hover:shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Radio className="w-4 h-4" />
                <span>Login with NFC</span>
              </button>

              {/* Additional Info */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs sm:text-sm text-gray-600 text-center">
                  Don't have an account?{" "}
                  <span className="text-emerald-600 font-medium">
                    Contact your administrator
                  </span>
                </p>
              </div>
            </div>

            {/* Feature Highlight */}
            <div className="relative mt-4 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/20 via-blue-400/20 to-emerald-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-75"></div>
              <div className="relative rounded-2xl p-6 border border-emerald-100/50 bg-white/80 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      RFID-Powered Access
                    </h3>
                    <p className="text-xs text-gray-600">
                      Fast, secure, contactless
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Access your Wi-Fi instantly with your RFID card. No passwords,
                  no hassle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NFC Modal */}
      {nfcModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">NFC Login</h3>
                    <p className="text-xs text-gray-500">Scan your RFID card</p>
                  </div>
                </div>
                <button
                  onClick={closeNfcModal}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

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
                        onClick={() => {
                          setShowNfcResult(false);
                          setNfcResult(null);
                          setNfcMessage("");
                          setIsReadingNfc(false);
                        }}
                        className="mt-4 px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium text-sm sm:text-base transition-all duration-150 shadow-md hover:shadow-lg"
                      >
                        Try Again
                      </button>
                    </>
                  )}
                </div>
              ) : (
                /* Reading State */
                <>
                  {!isReadingNfc && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Click "Start Scanning" and bring your RFID card close to your device.
                      </p>
                      <button
                        onClick={startNfcReading}
                        className="px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
                      >
                        Start Scanning
                      </button>
                    </div>
                  )}

                  {isReadingNfc && (
                    <div className="text-center py-8">
                      <div className="relative w-32 h-32 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Radio className="w-12 h-12 text-blue-500" />
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Scanning...
                      </p>
                      <p className="text-xs text-gray-500">
                        Bring your RFID card close to your device
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={closeNfcModal}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {pinModal && (
        <div className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto pt-20 sm:pt-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mt-auto sm:mt-0 mb-auto sm:mb-0">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Enter PIN</h3>
                    <p className="text-xs text-gray-500">Enter your 4-digit PIN</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPinModal(false);
                    setPin("");
                    setPinBoxes(["", "", "", ""]);
                    setActivePinBox(0);
                    setPinError("");
                    setScannedRfid("");
                    setScannedUserName("");
                    setPinModalRfid("");
                    setPinSuccess(false);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {pinSuccess ? (
                /* Success Display */
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <div className="rounded-full p-4 bg-green-100">
                    <CircleCheckBig className="size-8 sm:size-10 text-green-600" />
                  </div>
                  <div className="flex flex-col text-center gap-2">
                    <span className="text-lg sm:text-xl font-semibold text-green-600">
                      Login Successful
                    </span>
                    <span className="text-sm sm:text-base text-gray-600">
                      Redirecting to dashboard...
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {pinError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-xs">
                      <CircleAlert className="size-4 flex-shrink-0" />
                      <span>{pinError}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-gray-500 text-xs font-medium text-center">
                        Enter 4-digit PIN
                      </label>
                      <div className="flex items-center justify-center gap-3">
                        {pinBoxes.map((digit, index) => (
                          <input
                            key={index}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              if (value.length <= 1) {
                                const newBoxes = [...pinBoxes];
                                newBoxes[index] = value;
                                setPinBoxes(newBoxes);
                                setPinError("");
                                
                                // Auto-focus next box if digit entered
                                if (value && index < 3) {
                                  setActivePinBox(index + 1);
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              // Handle backspace
                              if (e.key === "Backspace" && !pinBoxes[index] && index > 0) {
                                setActivePinBox(index - 1);
                              }
                            }}
                            onFocus={(e) => {
                              setActivePinBox(index);
                              e.target.select();
                              
                              // Scroll input into view on mobile when keyboard appears
                              if (window.innerWidth < 640) {
                                setTimeout(() => {
                                  e.target.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'center',
                                    inline: 'nearest'
                                  });
                                }, 300); // Delay to allow keyboard to appear first
                              }
                            }}
                            ref={(input) => {
                              pinBoxRefs.current[index] = input;
                              if (input && activePinBox === index && !verifyingPin) {
                                setTimeout(() => input.focus(), 50);
                              }
                            }}
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 text-center text-2xl sm:text-3xl font-bold font-mono transition-all ${
                              pinError
                                ? "border-red-500 bg-red-50"
                                : activePinBox === index
                                ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                                : "border-gray-300 bg-white"
                            } focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={verifyingPin}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setPinModal(false);
                        setPin("");
                        setPinBoxes(["", "", "", ""]);
                        setActivePinBox(0);
                        setPinError("");
                        setScannedRfid("");
                        setScannedUserName("");
                        setPinModalRfid("");
                        setPinSuccess(false);
                      }}
                      disabled={verifyingPin}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePinSubmit}
                      disabled={verifyingPin || pinBoxes.join("").length !== 4}
                      className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {verifyingPin ? (
                        <>
                          <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Verifying...
                        </>
                      ) : (
                        "Verify PIN"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

