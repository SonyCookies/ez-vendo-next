"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, Radio, Lock, CheckCircle, X, CircleAlert, ChevronDown, Loader2 } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../../firebase";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

export default function SettingsTab({ billingRatePerMinute, userData, setUserData }) {
  const [rfidLoginEnabled, setRfidLoginEnabled] = useState(userData?.rfidLoginEnabled || false);
  const [pinBoxes, setPinBoxes] = useState(["", "", "", ""]);
  const [confirmPinBoxes, setConfirmPinBoxes] = useState(["", "", "", ""]);
  const [activePinBox, setActivePinBox] = useState(0);
  const [activeConfirmPinBox, setActiveConfirmPinBox] = useState(0);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const pinBoxRefs = useRef([null, null, null, null]);
  const confirmPinBoxRefs = useRef([null, null, null, null]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isPinModalOpening, setIsPinModalOpening] = useState(false);
  const [isPinModalClosing, setIsPinModalClosing] = useState(false);
  const [showPinVerificationModal, setShowPinVerificationModal] = useState(false);
  const [isPinVerificationModalOpening, setIsPinVerificationModalOpening] = useState(false);
  const [isPinVerificationModalClosing, setIsPinVerificationModalClosing] = useState(false);
  const [verificationPinBoxes, setVerificationPinBoxes] = useState(["", "", "", ""]);
  const [activeVerificationPinBox, setActiveVerificationPinBox] = useState(0);
  const verificationPinBoxRefs = useRef([null, null, null, null]);
  const [verificationPinError, setVerificationPinError] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  
  // Update state when userData changes
  useEffect(() => {
    setRfidLoginEnabled(userData?.rfidLoginEnabled || false);
  }, [userData]);
  
  const [passwordModal, setPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  
  // Change password modal states
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [isChangePasswordModalOpening, setIsChangePasswordModalOpening] = useState(false);
  const [isChangePasswordModalClosing, setIsChangePasswordModalClosing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Simple encryption/decryption (for demo - use proper encryption in production)
  const encryptPassword = (text) => {
    // Simple base64 encoding (not secure - use proper encryption in production)
    return btoa(text);
  };
  
  const handleToggleRfidLogin = async () => {
    if (!rfidLoginEnabled && !userData?.rfidPin) {
      // If enabling but no PIN exists, show PIN setup modal
      setIsPinModalClosing(false);
      setIsPinModalOpening(false);
      setShowPinModal(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPinModalOpening(true);
        });
      });
      return;
    }
    
    if (!rfidLoginEnabled && !userData?.encryptedPassword) {
      // If enabling but no password stored, show password modal
      setPasswordModal(true);
      return;
    }
    
    setIsUpdating(true);
    try {
      const userDocRef = doc(db, "users", userData.rfidCardId);
      await updateDoc(userDocRef, {
        rfidLoginEnabled: !rfidLoginEnabled,
        updatedAt: serverTimestamp(),
      });
      
      setRfidLoginEnabled(!rfidLoginEnabled);
      setUserData({
        ...userData,
        rfidLoginEnabled: !rfidLoginEnabled,
      });
    } catch (error) {
      console.error("Error updating RFID login setting:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleVerifyPassword = async () => {
    setPasswordError("");
    
    if (!password) {
      setPasswordError("Password is required");
      return;
    }
    
    setVerifyingPassword(true);
    
    try {
      // Verify password by attempting to sign in
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const { auth } = await import("../../../../firebase");
      
      try {
        await signInWithEmailAndPassword(auth, userData.email, password);
        // Password is correct - encrypt and store it
        const encryptedPassword = encryptPassword(password);
        
        const userDocRef = doc(db, "users", userData.rfidCardId);
        await updateDoc(userDocRef, {
          encryptedPassword: encryptedPassword,
          rfidLoginEnabled: true,
          updatedAt: serverTimestamp(),
        });
        
        setUserData({
          ...userData,
          encryptedPassword: encryptedPassword,
          rfidLoginEnabled: true,
        });
        
        setRfidLoginEnabled(true);
        setPasswordModal(false);
        setPassword("");
        setPasswordError("");
        
        // If PIN is not set, show PIN setup modal
        if (!userData?.rfidPin) {
          setShowPinModal(true);
        }
      } catch (err) {
        setPasswordError("Incorrect password. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      setPasswordError("Failed to verify password. Please try again.");
    } finally {
      setVerifyingPassword(false);
    }
  };
  
  // Auto-focus first PIN box when modal opens
  useEffect(() => {
    if (showPinModal && !pinSuccess) {
      setShowConfirmPin(false);
      setTimeout(() => {
        if (pinBoxRefs.current[0]) {
          pinBoxRefs.current[0].focus();
        }
      }, 300);
    }
  }, [showPinModal, pinSuccess]);

  // Auto-show confirm PIN when first PIN is complete
  useEffect(() => {
    if (showPinModal && pinBoxes.join("").length === 4 && !showConfirmPin && !pinSuccess) {
      setTimeout(() => {
        setShowConfirmPin(true);
        setTimeout(() => {
          if (confirmPinBoxRefs.current[0]) {
            confirmPinBoxRefs.current[0].focus();
          }
        }, 100);
      }, 300);
    }
  }, [pinBoxes, showPinModal, showConfirmPin, pinSuccess]);

  // Handle paste for PIN boxes
  useEffect(() => {
    const handlePaste = (e) => {
      if (!showPinModal) return;
      
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
      if (pastedData.length === 4) {
        const newBoxes = pastedData.split("");
        setPinBoxes(newBoxes);
        setActivePinBox(3);
        setPinError("");
        e.preventDefault();
      }
    };
    
    if (showPinModal) {
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }
  }, [showPinModal]);

  // Handle paste for confirm PIN boxes
  useEffect(() => {
    const handlePaste = (e) => {
      if (!showPinModal) return;
      
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
      if (pastedData.length === 4) {
        const newBoxes = pastedData.split("");
        setConfirmPinBoxes(newBoxes);
        setActiveConfirmPinBox(3);
        setPinError("");
        e.preventDefault();
      }
    };
    
    if (showPinModal) {
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }
  }, [showPinModal]);

  // Auto-focus first verification PIN box when modal opens
  useEffect(() => {
    if (showPinVerificationModal) {
      setTimeout(() => {
        if (verificationPinBoxRefs.current[0]) {
          verificationPinBoxRefs.current[0].focus();
        }
      }, 300);
    }
  }, [showPinVerificationModal]);

  // Handle paste for verification PIN boxes
  useEffect(() => {
    const handlePaste = (e) => {
      if (!showPinVerificationModal) return;
      
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
      if (pastedData.length === 4) {
        const newBoxes = pastedData.split("");
        setVerificationPinBoxes(newBoxes);
        setActiveVerificationPinBox(3);
        setVerificationPinError("");
        e.preventDefault();
      }
    };
    
    if (showPinVerificationModal) {
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }
  }, [showPinVerificationModal]);

  const handleSetPin = async () => {
    setPinError("");
    setPinSuccess(false);
    
    const pin = pinBoxes.join("");
    const confirmPin = confirmPinBoxes.join("");
    
    if (!pin || pin.length !== 4) {
      setPinError("PIN must be exactly 4 digits");
      return;
    }
    
    if (!/^\d+$/.test(pin)) {
      setPinError("PIN must contain only numbers");
      return;
    }
    
    if (pin !== confirmPin) {
      setPinError("PINs do not match");
      return;
    }
    
    setIsUpdating(true);
    try {
      const userDocRef = doc(db, "users", userData.rfidCardId);
      await updateDoc(userDocRef, {
        rfidPin: pin,
        rfidLoginEnabled: true,
        updatedAt: serverTimestamp(),
      });
      
      setRfidLoginEnabled(true);
      setUserData({
        ...userData,
        rfidPin: pin,
        rfidLoginEnabled: true,
      });
      
      setPinSuccess(true);
      setTimeout(() => {
        setIsPinModalOpening(false);
        setIsPinModalClosing(true);
        setTimeout(() => {
          setShowPinModal(false);
          setIsPinModalClosing(false);
          setPinBoxes(["", "", "", ""]);
          setConfirmPinBoxes(["", "", "", ""]);
          setActivePinBox(0);
          setActiveConfirmPinBox(0);
          setPinError("");
          setPinSuccess(false);
        }, 300);
      }, 1500);
    } catch (error) {
      console.error("Error setting PIN:", error);
      setPinError("Failed to set PIN. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleChangePin = async () => {
    // If user already has a PIN, show verification modal first
    if (userData?.rfidPin) {
      setIsPinVerificationModalClosing(false);
      setIsPinVerificationModalOpening(false);
      setShowPinVerificationModal(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPinVerificationModalOpening(true);
        });
      });
    } else {
      // No existing PIN, go directly to PIN setup
      setIsPinModalClosing(false);
      setIsPinModalOpening(false);
      setShowPinModal(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPinModalOpening(true);
        });
      });
    }
  };

  // Handle PIN verification for changing PIN
  const handleVerifyPinForChange = async () => {
    setVerificationPinError("");
    const verificationPin = verificationPinBoxes.join("");
    
    if (!verificationPin || verificationPin.length !== 4) {
      setVerificationPinError("PIN must be exactly 4 digits");
      return;
    }
    
    if (verificationPin !== userData?.rfidPin) {
      setVerificationPinError("Incorrect PIN. Please try again.");
      setVerificationPinBoxes(["", "", "", ""]);
      setActiveVerificationPinBox(0);
      setTimeout(() => {
        if (verificationPinBoxRefs.current[0]) {
          verificationPinBoxRefs.current[0].focus();
        }
      }, 100);
      return;
    }
    
    // PIN is correct, close verification modal and open PIN change modal
    setIsVerifyingPin(true);
    setTimeout(() => {
      setIsPinVerificationModalOpening(false);
      setIsPinVerificationModalClosing(true);
      setTimeout(() => {
        setShowPinVerificationModal(false);
        setIsPinVerificationModalClosing(false);
        setVerificationPinBoxes(["", "", "", ""]);
        setActiveVerificationPinBox(0);
        setVerificationPinError("");
        setIsVerifyingPin(false);
        
        // Open PIN change modal
        setIsPinModalClosing(false);
        setIsPinModalOpening(false);
        setShowPinModal(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsPinModalOpening(true);
          });
        });
      }, 300);
    }, 500);
  };
  
  const handleChangePassword = async () => {
    setChangePasswordError("");
    setChangePasswordSuccess(false);
    
    // Validation
    if (!currentPassword) {
      setChangePasswordError("Current password is required");
      return;
    }
    
    if (!newPassword) {
      setChangePasswordError("New password is required");
      return;
    }
    
    if (newPassword.length < 8) {
      setChangePasswordError("New password must be at least 8 characters");
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("New passwords do not match");
      return;
    }
    
    if (currentPassword === newPassword) {
      setChangePasswordError("New password must be different from current password");
      return;
    }
    
    setChangingPassword(true);
    
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        setChangePasswordError("User not authenticated");
        return;
      }
      
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      // Update encrypted password in Firestore
      const encryptedPassword = encryptPassword(newPassword);
      const userDocRef = doc(db, "users", userData.rfidCardId);
      await updateDoc(userDocRef, {
        encryptedPassword: encryptedPassword,
        updatedAt: serverTimestamp(),
      });
      
      setChangePasswordSuccess(true);
      setUserData({
        ...userData,
        encryptedPassword: encryptedPassword,
      });
      
      // Close modal after success
      setTimeout(() => {
        setIsChangePasswordModalOpening(false);
        setIsChangePasswordModalClosing(true);
        setTimeout(() => {
          setChangePasswordModal(false);
          setIsChangePasswordModalClosing(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          setChangePasswordError("");
          setChangePasswordSuccess(false);
        }, 300);
      }, 2000);
    } catch (error) {
      console.error("Error changing password:", error);
      const code = error.code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setChangePasswordError("Current password is incorrect");
      } else if (code === "auth/weak-password") {
        setChangePasswordError("New password is too weak");
      } else {
        setChangePasswordError("Failed to change password. Please try again.");
      }
    } finally {
      setChangingPassword(false);
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Settings
          </h2>
          <p className="text-blue-50">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="absolute top-4 right-4 opacity-20">
          <Settings className="size-24 text-white" />
        </div>
      </div>

      {/* Settings Content */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm relative z-10">
        <h3 className="text-lg font-bold text-slate-900 mb-6">
          Account Settings
        </h3>
        <div className="space-y-4">
          {/* Security - Change Password */}
          <div className="p-4 rounded-lg border border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-slate-900">Security</span>
                  <span className="text-xs text-gray-500">Change password and security options</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsChangePasswordModalClosing(false);
                  setIsChangePasswordModalOpening(false);
                  setChangePasswordModal(true);
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      setIsChangePasswordModalOpening(true);
                    });
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
          
          {/* RFID Login Toggle */}
          <div className="p-4 rounded-lg border border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-slate-900">RFID Login</span>
                  <span className="text-xs text-gray-500">
                    {rfidLoginEnabled 
                      ? "Login using NFC/RFID with PIN" 
                      : "Enable login using NFC/RFID card"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {rfidLoginEnabled && userData?.rfidPin && (
                  <button
                    onClick={handleChangePin}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Change PIN
                  </button>
                )}
                <button
                  onClick={handleToggleRfidLogin}
                  disabled={isUpdating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    rfidLoginEnabled ? "bg-emerald-500" : "bg-gray-300"
                  } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      rfidLoginEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm relative z-10">
        <h3 className="text-lg font-bold text-slate-900 mb-6">
          System Information
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Billing Rate</span>
            <span className="text-sm font-semibold text-slate-900">
              ₱{billingRatePerMinute.toFixed(3)} per minute
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Session Timeout</span>
            <span className="text-sm font-semibold text-slate-900">
              Automatic after session ends
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">Time Saving</span>
            <span className="text-sm font-semibold text-slate-900">
              Enabled
            </span>
          </div>
        </div>
      </div>

      {/* PIN Verification Modal (for changing existing PIN) */}
      {showPinVerificationModal && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
            isPinVerificationModalClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={() => {
            if (!isVerifyingPin) {
              setIsPinVerificationModalOpening(false);
              setIsPinVerificationModalClosing(true);
              setTimeout(() => {
                setShowPinVerificationModal(false);
                setIsPinVerificationModalClosing(false);
                setVerificationPinBoxes(["", "", "", ""]);
                setActiveVerificationPinBox(0);
                setVerificationPinError("");
              }, 300);
            }
          }}
        >
          <div 
            className={`rounded-2xl relative bg-white w-full max-w-md flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
              isPinVerificationModalClosing 
                ? "translate-y-[150vh] opacity-0 scale-95" 
                : isPinVerificationModalOpening
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-[20px] opacity-0 scale-[0.95]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON - Top Middle */}
            <button
              onClick={() => {
                if (!isVerifyingPin) {
                  setIsPinVerificationModalOpening(false);
                  setIsPinVerificationModalClosing(true);
                  setTimeout(() => {
                    setShowPinVerificationModal(false);
                    setIsPinVerificationModalClosing(false);
                    setVerificationPinBoxes(["", "", "", ""]);
                    setActiveVerificationPinBox(0);
                    setVerificationPinError("");
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
                  Verify PIN
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    Enter Current PIN
                  </span>
                  <span className="text-xs text-gray-100">
                    Verify your current PIN to change it
                  </span>
                </div>
              </div>
              <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-emerald-600/40 shadow-emerald-600/40">
                <Lock className="size-5 sm:size-6" />
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              {/* Message */}
              {verificationPinError && (
                <div className="px-4 py-2 rounded-lg flex items-center gap-3 border-l-4 bg-red-100 text-red-500 border-red-500">
                  <CircleAlert className="size-5 sm:size-6" />
                  <span className="text-xs sm:text-sm">{verificationPinError}</span>
                </div>
              )}

              {/* PIN Input Boxes */}
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm text-gray-500 text-center font-medium">
                  Enter your current 4-digit PIN
                </label>
                <div className="flex items-center justify-center gap-3">
                  {verificationPinBoxes.map((digit, index) => (
                    <input
                      key={index}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 1) {
                          const newBoxes = [...verificationPinBoxes];
                          newBoxes[index] = value;
                          setVerificationPinBoxes(newBoxes);
                          setVerificationPinError("");
                          
                          // Auto-focus next box if digit entered
                          if (value && index < 3) {
                            setActiveVerificationPinBox(index + 1);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Handle backspace
                        if (e.key === "Backspace" && !verificationPinBoxes[index] && index > 0) {
                          setActiveVerificationPinBox(index - 1);
                        }
                      }}
                      onFocus={(e) => {
                        setActiveVerificationPinBox(index);
                        e.target.select();
                        
                        // Scroll input into view on mobile when keyboard appears
                        if (window.innerWidth < 640) {
                          setTimeout(() => {
                            e.target.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'center',
                              inline: 'nearest'
                            });
                          }, 300);
                        }
                      }}
                      ref={(input) => {
                        verificationPinBoxRefs.current[index] = input;
                        if (input && activeVerificationPinBox === index && !isVerifyingPin) {
                          setTimeout(() => input.focus(), 50);
                        }
                      }}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 text-center text-2xl sm:text-3xl font-bold font-mono transition-all ${
                        verificationPinError
                          ? "border-red-500 bg-red-50"
                          : activeVerificationPinBox === index
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                          : "border-gray-300 bg-white"
                      } focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                      disabled={isVerifyingPin}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 items-center justify-end w-full mt-2">
                <button
                  onClick={() => {
                    if (!isVerifyingPin) {
                      setIsPinVerificationModalOpening(false);
                      setIsPinVerificationModalClosing(true);
                      setTimeout(() => {
                        setShowPinVerificationModal(false);
                        setIsPinVerificationModalClosing(false);
                        setVerificationPinBoxes(["", "", "", ""]);
                        setActiveVerificationPinBox(0);
                        setVerificationPinError("");
                      }, 300);
                    }
                  }}
                  disabled={isVerifyingPin}
                  className="bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  onClick={handleVerifyPinForChange}
                  disabled={isVerifyingPin || verificationPinBoxes.join("").length !== 4}
                  className="bg-emerald-500 text-white rounded-lg px-4 py-2 hover:bg-emerald-500/90 active:bg-emerald-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifyingPin ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    "Verify"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Setup/Change Modal */}
      {showPinModal && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
            isPinModalClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={() => {
            if (!isUpdating) {
              setIsPinModalOpening(false);
              setIsPinModalClosing(true);
              setTimeout(() => {
                setShowPinModal(false);
                setIsPinModalClosing(false);
                setPinBoxes(["", "", "", ""]);
                setConfirmPinBoxes(["", "", "", ""]);
                setActivePinBox(0);
                setActiveConfirmPinBox(0);
                setPinError("");
                setPinSuccess(false);
              }, 300);
            }
          }}
        >
          <div 
            className={`rounded-2xl relative bg-white w-full max-w-md flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
              isPinModalClosing 
                ? "translate-y-[150vh] opacity-0 scale-95" 
                : isPinModalOpening
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-[20px] opacity-0 scale-[0.95]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON - Top Middle */}
            <button
              onClick={() => {
                if (!isUpdating) {
                  setIsPinModalOpening(false);
                  setIsPinModalClosing(true);
                  setTimeout(() => {
                    setShowPinModal(false);
                    setIsPinModalClosing(false);
                    setPin("");
                    setConfirmPin("");
                    setPinError("");
                    setPinSuccess(false);
                  }, 300);
                }
              }}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD - Matching Standard Design */}
            <div className="flex relative rounded-t-2xl p-4 sm:p-5 text-white bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold">
                  {userData?.rfidPin ? "Change PIN" : "Set PIN"}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    RFID Login PIN
                  </span>
                  <span className="text-xs text-gray-100">
                    Enter a 4-digit PIN for RFID login
                  </span>
                </div>
              </div>
              <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-emerald-600/40 shadow-emerald-600/40">
                <Lock className="size-5 sm:size-6" />
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col gap-3 p-4 sm:p-5">

              {/* Message */}
              {pinError && (
                <div className="px-4 py-2 rounded-lg flex items-center gap-3 border-l-4 bg-red-100 text-red-500 border-red-500">
                  <CircleAlert className="size-5 sm:size-6" />
                  <span className="text-xs sm:text-sm">{pinError}</span>
                </div>
              )}

              {pinSuccess && (
                <div className="px-4 py-2 rounded-lg flex items-center gap-3 border-l-4 bg-green-100 text-green-500 border-green-500">
                  <CheckCircle className="size-5 sm:size-6" />
                  <span className="text-xs sm:text-sm">PIN set successfully!</span>
                </div>
              )}

              {/* Form Fields */}
              <div className="flex flex-col gap-4">
                {/* Step 1: Enter PIN */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs sm:text-sm text-gray-500 text-center font-medium">
                    Enter 4-digit PIN
                  </label>
                  <div className="flex items-center justify-center gap-3">
                    {pinBoxes.map((digit, index) => (
                      <input
                        key={index}
                        type="password"
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
                            
                            // If all 4 digits are entered, show confirm PIN section
                            const newPin = newBoxes.join("");
                            if (newPin.length === 4 && !showConfirmPin) {
                              setTimeout(() => {
                                setShowConfirmPin(true);
                                setTimeout(() => {
                                  if (confirmPinBoxRefs.current[0]) {
                                    confirmPinBoxRefs.current[0].focus();
                                  }
                                }, 100);
                              }, 300);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Handle backspace
                          if (e.key === "Backspace" && !pinBoxes[index] && index > 0) {
                            setActivePinBox(index - 1);
                          }
                          // If backspace on first box and confirm PIN is shown, hide it
                          if (e.key === "Backspace" && index === 0 && showConfirmPin && pinBoxes.join("").length === 0) {
                            setShowConfirmPin(false);
                            setConfirmPinBoxes(["", "", "", ""]);
                            setActiveConfirmPinBox(0);
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
                            }, 300);
                          }
                        }}
                        ref={(input) => {
                          pinBoxRefs.current[index] = input;
                          if (input && activePinBox === index && !isUpdating && !showConfirmPin) {
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
                        disabled={isUpdating}
                      />
                    ))}
                  </div>
                </div>

                {/* Step 2: Confirm PIN (only shown after first PIN is complete) */}
                {showConfirmPin && (
                  <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs sm:text-sm text-gray-500 text-center font-medium">
                      Confirm PIN
                    </label>
                    <div className="flex items-center justify-center gap-3">
                    {confirmPinBoxes.map((digit, index) => (
                      <input
                        key={index}
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            if (value.length <= 1) {
                              const newBoxes = [...confirmPinBoxes];
                              newBoxes[index] = value;
                              setConfirmPinBoxes(newBoxes);
                              setPinError("");
                              
                              // Auto-focus next box if digit entered
                              if (value && index < 3) {
                                setActiveConfirmPinBox(index + 1);
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            // Handle backspace
                            if (e.key === "Backspace" && !confirmPinBoxes[index] && index > 0) {
                              setActiveConfirmPinBox(index - 1);
                            }
                            // If backspace on first confirm box and it's empty, go back to PIN entry
                            if (e.key === "Backspace" && index === 0 && !confirmPinBoxes[0]) {
                              setShowConfirmPin(false);
                              setConfirmPinBoxes(["", "", "", ""]);
                              setActiveConfirmPinBox(0);
                              // Focus last box of PIN entry
                              setTimeout(() => {
                                if (pinBoxRefs.current[3]) {
                                  pinBoxRefs.current[3].focus();
                                }
                              }, 100);
                            }
                          }}
                          onFocus={(e) => {
                            setActiveConfirmPinBox(index);
                            e.target.select();
                            
                            // Scroll input into view on mobile when keyboard appears
                            if (window.innerWidth < 640) {
                              setTimeout(() => {
                                e.target.scrollIntoView({ 
                                  behavior: 'smooth', 
                                  block: 'center',
                                  inline: 'nearest'
                                });
                              }, 300);
                            }
                          }}
                          ref={(input) => {
                            confirmPinBoxRefs.current[index] = input;
                            if (input && activeConfirmPinBox === index && !isUpdating) {
                              setTimeout(() => input.focus(), 50);
                            }
                          }}
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 text-center text-2xl sm:text-3xl font-bold font-mono transition-all ${
                            pinError
                              ? "border-red-500 bg-red-50"
                              : activeConfirmPinBox === index
                              ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                              : "border-gray-300 bg-white"
                          } focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={isUpdating}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 items-center justify-end w-full mt-2">
                <button
                  onClick={() => {
                    if (!isUpdating) {
                      setIsPinModalOpening(false);
                      setIsPinModalClosing(true);
                      setTimeout(() => {
                        setShowPinModal(false);
                        setIsPinModalClosing(false);
                        setPinBoxes(["", "", "", ""]);
                        setConfirmPinBoxes(["", "", "", ""]);
                        setActivePinBox(0);
                        setActiveConfirmPinBox(0);
                        setShowConfirmPin(false);
                        setPinError("");
                        setPinSuccess(false);
                      }, 300);
                    }
                  }}
                  disabled={isUpdating}
                  className="bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Discard
                </button>

                <button
                  onClick={handleSetPin}
                  disabled={isUpdating || pinBoxes.join("").length !== 4 || confirmPinBoxes.join("").length !== 4}
                  className="bg-emerald-500 text-white rounded-lg px-4 py-2 hover:bg-emerald-500/90 active:bg-emerald-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Setting...</span>
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

      {/* Password Verification Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Verify Password</h3>
                    <p className="text-xs text-gray-500">
                      Enter your password to enable RFID login
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPasswordModal(false);
                    setPassword("");
                    setPasswordError("");
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-xs">
                  <CircleAlert className="size-4 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-xs font-medium">
                    Enter your password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Enter your password"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    disabled={verifyingPassword}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setPasswordModal(false);
                    setPassword("");
                    setPasswordError("");
                  }}
                  disabled={verifyingPassword}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyPassword}
                  disabled={verifyingPassword || !password}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {verifyingPassword ? (
                    <>
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePasswordModal && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
            isChangePasswordModalClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={() => {
            if (!changingPassword) {
              setIsChangePasswordModalOpening(false);
              setIsChangePasswordModalClosing(true);
              setTimeout(() => {
                setChangePasswordModal(false);
                setIsChangePasswordModalClosing(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmNewPassword("");
                setChangePasswordError("");
                setChangePasswordSuccess(false);
              }, 300);
            }
          }}
        >
          <div 
            className={`rounded-2xl relative bg-white w-full max-w-md flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
              isChangePasswordModalClosing 
                ? "translate-y-[150vh] opacity-0 scale-95" 
                : isChangePasswordModalOpening
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-[20px] opacity-0 scale-[0.95]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON - Top Middle */}
            <button
              onClick={() => {
                if (!changingPassword) {
                  setIsChangePasswordModalOpening(false);
                  setIsChangePasswordModalClosing(true);
                  setTimeout(() => {
                    setChangePasswordModal(false);
                    setIsChangePasswordModalClosing(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setChangePasswordError("");
                    setChangePasswordSuccess(false);
                  }, 300);
                }
              }}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD - Matching Standard Design */}
            <div className="flex relative rounded-t-2xl p-4 sm:p-5 text-white bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold">
                  Change Password
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    Update your account password
                  </span>
                  <span className="text-xs text-gray-100">
                    Enter your current password and new password
                  </span>
                </div>
              </div>
              <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-blue-600/40 shadow-blue-600/40">
                <Lock className="size-5 sm:size-6" />
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col gap-3 p-4 sm:p-5">

              {/* Message */}
              {changePasswordError && (
                <div className="px-4 py-2 rounded-lg flex items-center gap-3 border-l-4 bg-red-100 text-red-500 border-red-500">
                  <CircleAlert className="size-5 sm:size-6" />
                  <span className="text-xs sm:text-sm">{changePasswordError}</span>
                </div>
              )}

              {changePasswordSuccess && (
                <div className="px-4 py-2 rounded-lg flex items-center gap-3 border-l-4 bg-green-100 text-green-500 border-green-500">
                  <CheckCircle className="size-5 sm:size-6" />
                  <span className="text-xs sm:text-sm">Password changed successfully!</span>
                </div>
              )}

              {/* Form Fields */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs sm:text-sm text-gray-500">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setChangePasswordError("");
                    }}
                    placeholder="Enter current password"
                    autoFocus
                    className="px-3 sm:px-4 py-2 w-full border border-gray-300 outline-none rounded-lg focus:border-blue-500 placeholder:text-gray-500 transition-colors duration-150"
                    disabled={changingPassword}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs sm:text-sm text-gray-500">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setChangePasswordError("");
                    }}
                    placeholder="Enter new password (min. 8 characters)"
                    className="px-3 sm:px-4 py-2 w-full border border-gray-300 outline-none rounded-lg focus:border-blue-500 placeholder:text-gray-500 transition-colors duration-150"
                    disabled={changingPassword}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs sm:text-sm text-gray-500">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setChangePasswordError("");
                    }}
                    placeholder="Confirm new password"
                    className="px-3 sm:px-4 py-2 w-full border border-gray-300 outline-none rounded-lg focus:border-blue-500 placeholder:text-gray-500 transition-colors duration-150"
                    disabled={changingPassword}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 items-center justify-end w-full mt-2">
                <button
                  onClick={() => {
                    if (!changingPassword) {
                      setIsChangePasswordModalOpening(false);
                      setIsChangePasswordModalClosing(true);
                      setTimeout(() => {
                        setChangePasswordModal(false);
                        setIsChangePasswordModalClosing(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                        setChangePasswordError("");
                        setChangePasswordSuccess(false);
                      }, 300);
                    }
                  }}
                  disabled={changingPassword}
                  className="bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Discard
                </button>

                <button 
                  onClick={handleChangePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                  className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-500/90 active:bg-blue-600 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Changing...</span>
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
    </div>
  );
}

