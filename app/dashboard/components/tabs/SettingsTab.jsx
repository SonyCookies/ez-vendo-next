"use client";

import { useState, useEffect } from "react";
import { Settings, Radio, Lock, CheckCircle, X, CircleAlert } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function SettingsTab({ billingRatePerMinute, userData, setUserData }) {
  const [rfidLoginEnabled, setRfidLoginEnabled] = useState(userData?.rfidLoginEnabled || false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
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
  
  // Simple encryption/decryption (for demo - use proper encryption in production)
  const encryptPassword = (text) => {
    // Simple base64 encoding (not secure - use proper encryption in production)
    return btoa(text);
  };
  
  const handleToggleRfidLogin = async () => {
    if (!rfidLoginEnabled && !userData?.rfidPin) {
      // If enabling but no PIN exists, show PIN setup modal
      setShowPinModal(true);
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
  
  const handleSetPin = async () => {
    setPinError("");
    setPinSuccess(false);
    
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
        setShowPinModal(false);
        setPin("");
        setConfirmPin("");
        setPinError("");
        setPinSuccess(false);
      }, 1500);
    } catch (error) {
      console.error("Error setting PIN:", error);
      setPinError("Failed to set PIN. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleChangePin = async () => {
    setShowPinModal(true);
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
          <div className="p-4 rounded-lg border border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-slate-900">Notifications</span>
                <span className="text-xs text-gray-500">Manage your notification preferences</span>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Configure
              </button>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-slate-900">Privacy</span>
                <span className="text-xs text-gray-500">Control your privacy settings</span>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Manage
              </button>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-slate-900">Security</span>
                <span className="text-xs text-gray-500">Change password and security options</span>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Update
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
          
          <div className="p-4 rounded-lg border border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-slate-900">Language</span>
                <span className="text-xs text-gray-500">Select your preferred language</span>
              </div>
              <select className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>English</option>
                <option>Filipino</option>
              </select>
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

      {/* PIN Setup/Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {userData?.rfidPin ? "Change PIN" : "Set PIN"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Enter a 4-digit PIN for RFID login
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPinModal(false);
                    setPin("");
                    setConfirmPin("");
                    setPinError("");
                    setPinSuccess(false);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {pinError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-xs">
                  <CircleAlert className="size-4 flex-shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {pinSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 text-green-700 text-xs">
                  <CheckCircle className="size-4 flex-shrink-0" />
                  <span>PIN set successfully!</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-xs font-medium">
                    Enter 4-digit PIN
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setPin(value);
                      setPinError("");
                    }}
                    placeholder="0000"
                    maxLength={4}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-center text-2xl tracking-widest font-mono"
                    disabled={isUpdating}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-xs font-medium">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setConfirmPin(value);
                      setPinError("");
                    }}
                    placeholder="0000"
                    maxLength={4}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-center text-2xl tracking-widest font-mono"
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPin("");
                  setConfirmPin("");
                  setPinError("");
                  setPinSuccess(false);
                }}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetPin}
                disabled={isUpdating || pin.length !== 4 || confirmPin.length !== 4}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Setting...
                  </>
                ) : (
                  "Set PIN"
                )}
              </button>
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
    </div>
  );
}

