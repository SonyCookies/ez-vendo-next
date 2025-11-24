"use client";

import { useState, useEffect } from "react";
import { User, Edit2, Save, X, CircleAlert, CircleCheckBig } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function ProfileTab({ userData, user, setUserData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: userData?.fullName || "",
    phoneNumber: userData?.phoneNumber || "",
    dateOfBirth: userData?.dateOfBirth 
      ? (userData.dateOfBirth.toDate ? userData.dateOfBirth.toDate() : new Date(userData.dateOfBirth)).toISOString().split('T')[0]
      : "",
    address: userData?.address || "",
  });
  
  // Initialize form data when userData changes (only when not editing)
  useEffect(() => {
    if (userData && !isEditing) {
      setFormData({
        fullName: userData.fullName || "",
        phoneNumber: userData.phoneNumber || "",
        dateOfBirth: userData.dateOfBirth 
          ? (userData.dateOfBirth.toDate ? userData.dateOfBirth.toDate() : new Date(userData.dateOfBirth)).toISOString().split('T')[0]
          : "",
        address: userData.address || "",
      });
    }
  }, [userData, isEditing]);
  
  const handleEdit = () => {
    setIsEditing(true);
    setSaveError("");
    setSaveSuccess(false);
    // Reset form data to current userData
    setFormData({
      fullName: userData?.fullName || "",
      phoneNumber: userData?.phoneNumber || "",
      dateOfBirth: userData?.dateOfBirth 
        ? (userData.dateOfBirth.toDate ? userData.dateOfBirth.toDate() : new Date(userData.dateOfBirth)).toISOString().split('T')[0]
        : "",
      address: userData?.address || "",
    });
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setSaveError("");
    setSaveSuccess(false);
    // Reset form data to current userData
    setFormData({
      fullName: userData?.fullName || "",
      phoneNumber: userData?.phoneNumber || "",
      dateOfBirth: userData?.dateOfBirth 
        ? (userData.dateOfBirth.toDate ? userData.dateOfBirth.toDate() : new Date(userData.dateOfBirth)).toISOString().split('T')[0]
        : "",
      address: userData?.address || "",
    });
  };
  
  const handleSave = async () => {
    if (!userData?.rfidCardId) {
      setSaveError("User data not available. Please refresh the page.");
      return;
    }
    
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    
    try {
      const userDocRef = doc(db, "users", userData.rfidCardId);
      
      // Prepare update data
      const updateData = {
        fullName: formData.fullName.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
        address: formData.address.trim() || null,
        updatedAt: serverTimestamp(),
      };
      
      // Add dateOfBirth if provided
      if (formData.dateOfBirth) {
        updateData.dateOfBirth = new Date(formData.dateOfBirth);
      } else {
        updateData.dateOfBirth = null;
      }
      
      await updateDoc(userDocRef, updateData);
      
      // Update local state
      setUserData({
        ...userData,
        ...updateData,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
      });
      
      setSaveSuccess(true);
      setIsEditing(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Profile Information
          </h2>
          <p className="text-emerald-50">
            View and manage your account details
          </p>
        </div>
        <div className="absolute top-4 right-4 opacity-20">
          <User className="size-24 text-white" />
        </div>
      </div>

      {/* Profile Details Card */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            Personal Information
          </h3>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-medium transition-colors duration-150"
            >
              <Edit2 className="size-4" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 text-sm font-medium transition-colors duration-150 disabled:opacity-50"
              >
                <X className="size-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 text-green-700 text-sm">
            <CircleCheckBig className="size-4 flex-shrink-0" />
            <span>Profile updated successfully!</span>
          </div>
        )}
        
        {saveError && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm">
            <CircleAlert className="size-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col p-3 rounded-lg border border-gray-300">
            <label className="text-xs text-gray-500 mb-1">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="font-semibold text-sm text-slate-900 border-none outline-none focus:ring-2 focus:ring-emerald-500/20 rounded px-2 py-1 bg-gray-50"
                placeholder="Enter full name"
              />
            ) : (
              <span className="font-semibold text-sm text-slate-900">
                {userData?.fullName || "N/A"}
              </span>
            )}
          </div>
          <div className="flex flex-col p-3 rounded-lg border border-gray-300">
            <span className="text-xs text-gray-500 mb-1">Email</span>
            <span className="font-semibold text-sm text-slate-900">
              {user?.email || "N/A"}
            </span>
            <span className="text-xs text-gray-400 mt-1">(Cannot be changed)</span>
          </div>
          <div className="flex flex-col p-3 rounded-lg border border-gray-300">
            <span className="text-xs text-gray-500 mb-1">RFID Card ID</span>
            <span className="font-semibold text-sm text-slate-900 font-mono">
              {userData?.rfidCardId || "N/A"}
            </span>
            <span className="text-xs text-gray-400 mt-1">(Cannot be changed)</span>
          </div>
          <div className="flex flex-col p-3 rounded-lg border border-gray-300">
            <label className="text-xs text-gray-500 mb-1">Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="font-semibold text-sm text-slate-900 border-none outline-none focus:ring-2 focus:ring-emerald-500/20 rounded px-2 py-1 bg-gray-50"
                placeholder="Enter phone number"
              />
            ) : (
              <span className="font-semibold text-sm text-slate-900">
                {userData?.phoneNumber || "N/A"}
              </span>
            )}
          </div>
          <div className="flex flex-col p-3 rounded-lg border border-gray-300">
            <label className="text-xs text-gray-500 mb-1">Date of Birth</label>
            {isEditing ? (
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="font-semibold text-sm text-slate-900 border-none outline-none focus:ring-2 focus:ring-emerald-500/20 rounded px-2 py-1 bg-gray-50"
              />
            ) : (
              <span className="font-semibold text-sm text-slate-900">
                {userData?.dateOfBirth 
                  ? (userData.dateOfBirth.toDate ? userData.dateOfBirth.toDate() : new Date(userData.dateOfBirth)).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </span>
            )}
          </div>
          <div className="flex flex-col p-3 rounded-lg border border-gray-300">
            <label className="text-xs text-gray-500 mb-1">Address</label>
            {isEditing ? (
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="font-semibold text-sm text-slate-900 border-none outline-none focus:ring-2 focus:ring-emerald-500/20 rounded px-2 py-1 bg-gray-50 resize-none"
                placeholder="Enter address"
              />
            ) : (
              <span className="font-semibold text-sm text-slate-900">
                {userData?.address || "N/A"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Account Information Card */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm relative z-10">
        <h3 className="text-lg font-bold text-slate-900 mb-6">
          Account Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col p-3 rounded-lg border border-gray-300">
            <span className="text-xs text-gray-500 mb-1">Account Status</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium w-fit ${
              userData?.isRegistered === true
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {userData?.isRegistered === true ? "Registered" : "Unregistered"}
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-lg border border-gray-300">
            <span className="text-xs text-gray-500 mb-1">Current Balance</span>
            <span className="font-semibold text-sm text-slate-900">
              ₱{typeof userData?.balance === 'number' ? userData.balance.toFixed(2) : "0.00"}
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-lg border border-gray-300">
            <span className="text-xs text-gray-500 mb-1">Registration Date</span>
            <span className="font-semibold text-sm text-slate-900">
              {userData?.createdAt 
                ? (userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-lg border border-gray-300">
            <span className="text-xs text-gray-500 mb-1">Last Updated</span>
            <span className="font-semibold text-sm text-slate-900">
              {userData?.updatedAt 
                ? (userData.updatedAt.toDate ? userData.updatedAt.toDate() : new Date(userData.updatedAt)).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

