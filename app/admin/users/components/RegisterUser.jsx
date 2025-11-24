"use client";

import { useState, useEffect, useRef } from "react";
import { Radio, UserPlus, X, CircleAlert, CircleCheckBig, Mail, Phone, MapPin, Calendar, User } from "lucide-react";
import { collection, doc, getDoc, setDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function RegisterUser() {
  // Form states
  const [formData, setFormData] = useState({
    rfidCardId: "",
    fullName: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    address: "",
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  // NFC Reading states
  const [nfcModal, setNfcModal] = useState(false);
  const [isNfcClosing, setIsNfcClosing] = useState(false);
  const [isNfcOpening, setIsNfcOpening] = useState(false);
  const [isReadingNfc, setIsReadingNfc] = useState(false);
  const [nfcResult, setNfcResult] = useState(null); // "success" or "error"
  const [nfcMessage, setNfcMessage] = useState("");
  const [showNfcResult, setShowNfcResult] = useState(false);
  
  // Registration modal states
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isModalOpening, setIsModalOpening] = useState(false);
  
  // Check if RFID already exists
  const [rfidExists, setRfidExists] = useState(false);
  const [checkingRfid, setCheckingRfid] = useState(false);
  
  // Check NFC Support
  const checkNfcSupport = () => {
    const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isSecure) {
      return {
        supported: false,
        message: "NFC requires a secure connection (HTTPS). You're currently accessing via HTTP. Please access this page via HTTPS (https://...) or use localhost for development."
      };
    }

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

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      return {
        supported: false,
        message: "NFC reading is only available on mobile devices. Please use Chrome on Android or Edge on Android."
      };
    }

    return { supported: true };
  };

  // Open NFC Modal
  const openNfcModal = () => {
    setNfcModal(true);
    setIsNfcClosing(false);
    setIsNfcOpening(false);
    setIsReadingNfc(false);
    setNfcResult(null);
    setNfcMessage("");
    setShowNfcResult(false);
    
    const supportCheck = checkNfcSupport();
    if (!supportCheck.supported) {
      setNfcResult("error");
      setNfcMessage(supportCheck.message);
      setShowNfcResult(true);
    }
    
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
      
      ndef.addEventListener("reading", async ({ message, serialNumber }) => {
        const cleanedRfid = serialNumber.replace(/:/g, "").toUpperCase();
        
        // Check if RFID already exists
        setCheckingRfid(true);
        try {
          const userDocRef = doc(db, "users", cleanedRfid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setRfidExists(true);
            setNfcResult("error");
            setNfcMessage(`RFID ${cleanedRfid} is already registered to a user.`);
            setShowNfcResult(true);
            setIsReadingNfc(false);
            setCheckingRfid(false);
            return;
          }
          
          // RFID doesn't exist, proceed with registration
          setRfidExists(false);
          setFormData(prev => ({ ...prev, rfidCardId: cleanedRfid }));
          
          setNfcResult("success");
          setNfcMessage(`RFID read successfully: ${cleanedRfid}`);
          setShowNfcResult(true);
          setIsReadingNfc(false);
          setCheckingRfid(false);
          
          // Close NFC modal and open registration modal after a short delay
          setTimeout(() => {
            closeNfcModal();
            setTimeout(() => {
              openRegistrationModal();
            }, 350);
          }, 1500);
        } catch (error) {
          console.error("Error checking RFID:", error);
          setNfcResult("error");
          setNfcMessage("Failed to verify RFID. Please try again.");
          setShowNfcResult(true);
          setIsReadingNfc(false);
          setCheckingRfid(false);
        }
      });

      ndef.addEventListener("readingerror", (error) => {
        console.error("NFC reading error:", error);
        setNfcResult("error");
        setNfcMessage("Failed to read NFC tag. Please ensure the tag is close to your device and try again.");
        setShowNfcResult(true);
        setIsReadingNfc(false);
        setCheckingRfid(false);
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
      setCheckingRfid(false);
    }
  };

  // Open Registration Modal
  const openRegistrationModal = () => {
    setShowRegistrationModal(true);
    setIsModalClosing(false);
    setIsModalOpening(false);
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsModalOpening(true);
      });
    });
  };

  // Close Registration Modal
  const closeRegistrationModal = () => {
    if (isModalClosing) return;
    setIsModalOpening(false);
    setIsModalClosing(true);
    setTimeout(() => {
      setShowRegistrationModal(false);
      setIsModalClosing(false);
      // Reset form
      setFormData({
        rfidCardId: "",
        fullName: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        dateOfBirth: "",
        address: "",
      });
      setErrors({});
      setSubmitSuccess(false);
      setSubmitError("");
    }, 300);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.rfidCardId.trim()) {
      newErrors.rfidCardId = "RFID Card ID is required";
    }
    
    if (!formData.fullName.trim() && (!formData.firstName.trim() || !formData.lastName.trim())) {
      newErrors.fullName = "Full name is required, or provide both first and last name";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (formData.phoneNumber && !/^[\d\s\-\+\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    
    try {
      // Check if RFID still doesn't exist (double-check)
      const userDocRef = doc(db, "users", formData.rfidCardId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        setSubmitError("This RFID is already registered to another user.");
        setIsSubmitting(false);
        return;
      }
      
      // Prepare user data
      const userData = {
        rfidCardId: formData.rfidCardId.trim().toUpperCase(),
        fullName: formData.fullName.trim() || `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        firstName: formData.firstName.trim() || "",
        lastName: formData.lastName.trim() || "",
        email: formData.email.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
        address: formData.address.trim() || null,
        isRegistered: true,
        status: "active",
        balance: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Save to Firestore (use RFID as document ID)
      await setDoc(userDocRef, userData);
      
      setSubmitSuccess(true);
      
      // Reset form and close modal after success
      setTimeout(() => {
        closeRegistrationModal();
        // Optionally refresh the page or update the user list
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error("Error registering user:", error);
      setSubmitError("Failed to register user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const anyModalOpen = nfcModal || showRegistrationModal;
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [anyModalOpen]);

  return (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Header Card */}
      <div className="flex relative rounded-2xl bg-gradient-to-r from-green-500 via-green-400 to-green-500 p-5 text-white shadow-lg">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-xl sm:text-2xl font-bold">Register New User</span>
          <span className="text-sm text-white/90">Register a new user using NFC or manual entry</span>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-3 rounded-full p-3 bg-green-600/40 shadow-lg">
          <UserPlus className="size-6" />
        </div>
      </div>

      {/* Registration Action Card */}
      <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <UserPlus className="size-10 text-green-600" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Register a New User</h3>
            <p className="text-gray-600 text-sm">
              Scan an NFC tag to start the registration process, or manually enter user information.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <button
              onClick={openNfcModal}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-medium transition-colors duration-150"
            >
              <Radio className="size-5" />
              Scan NFC
            </button>
            <button
              onClick={openRegistrationModal}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors duration-150"
            >
              <UserPlus className="size-5" />
              Manual Entry
            </button>
          </div>
        </div>
      </div>

      {/* NFC Modal */}
      {nfcModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div
            className={`bg-white rounded-2xl p-6 w-full max-w-md transition-all duration-300 ${
              isNfcOpening ? "scale-100 opacity-100" : "scale-95 opacity-0"
            } ${isNfcClosing ? "scale-95 opacity-0" : ""}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Scan NFC Tag</h3>
              <button
                onClick={closeNfcModal}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="size-5 text-gray-600" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4 py-6">
              <div className="relative w-32 h-32 rounded-full bg-green-100 flex items-center justify-center">
                <Radio className="size-16 text-green-600" />
                {isReadingNfc && (
                  <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
                )}
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900 mb-2">
                  {isReadingNfc ? "Reading NFC..." : "Bring your NFC tag close to your device"}
                </p>
                {checkingRfid && (
                  <p className="text-sm text-gray-600">Checking RFID availability...</p>
                )}
              </div>

              {showNfcResult && (
                <div
                  className={`w-full p-4 rounded-lg border ${
                    nfcResult === "success"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {nfcResult === "success" ? (
                      <CircleCheckBig className="size-5 flex-shrink-0" />
                    ) : (
                      <CircleAlert className="size-5 flex-shrink-0" />
                    )}
                    <span className="text-sm">{nfcMessage}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={closeNfcModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {!isReadingNfc && !showNfcResult && (
                  <button
                    onClick={startNfcReading}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Start Reading
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Success/Error Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div
            className={`bg-white rounded-2xl p-6 w-full max-w-md transition-all duration-300 ${
              isModalOpening ? "scale-100 opacity-100" : "scale-95 opacity-0"
            } ${isModalClosing ? "scale-95 opacity-0" : ""}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Register User</h3>
              <button
                onClick={closeRegistrationModal}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="size-5 text-gray-600" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CircleCheckBig className="size-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600 mb-2">User Registered Successfully!</p>
                  <p className="text-sm text-gray-600">The user has been added to the system.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Same form fields as above, but in modal */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-700 text-sm font-medium">
                    RFID Card ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rfidCardId}
                    onChange={(e) => handleInputChange("rfidCardId", e.target.value.toUpperCase())}
                    className={`w-full px-3 py-2.5 border ${errors.rfidCardId ? "border-red-500" : "border-gray-300"} outline-none rounded-lg focus:border-green-500`}
                    placeholder="RFID Card ID"
                    required
                    readOnly
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-700 text-sm font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className={`w-full px-3 py-2.5 border ${errors.fullName ? "border-red-500" : "border-gray-300"} outline-none rounded-lg focus:border-green-500`}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-700 text-sm font-medium">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 outline-none rounded-lg focus:border-green-500"
                      placeholder="First name"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-700 text-sm font-medium">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 outline-none rounded-lg focus:border-green-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-700 text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full px-3 py-2.5 border ${errors.email ? "border-red-500" : "border-gray-300"} outline-none rounded-lg focus:border-green-500`}
                    placeholder="user@example.com"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-700 text-sm font-medium">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    className={`w-full px-3 py-2.5 border ${errors.phoneNumber ? "border-red-500" : "border-gray-300"} outline-none rounded-lg focus:border-green-500`}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-700 text-sm font-medium">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 outline-none rounded-lg focus:border-green-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-700 text-sm font-medium">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 outline-none rounded-lg focus:border-green-500 resize-none"
                    placeholder="Enter address"
                  />
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm">
                    <CircleAlert className="size-4 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {Object.keys(errors).length > 0 && (
                  <div className="flex flex-col gap-1">
                    {Object.values(errors).filter(e => e).map((error, idx) => (
                      <span key={idx} className="text-xs text-red-500">{error}</span>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeRegistrationModal}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Registering..." : "Register"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

