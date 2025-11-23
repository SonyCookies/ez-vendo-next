"use client";

import {
  BanknoteArrowUp,
  CircleAlert,
  CircleCheckBig,
  Edit,
  ChevronDown,
  Settings,
} from "lucide-react";
import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import AdminNavbar from "../components/AdminNavbar";

import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, onAuthStateChanged } from "../../../firebase";

export default function AdminBilling() {
  const [activeTab, setActiveTab] = useState("billing");
  const [billingRatePerMinute, setBillingRatePerMinute] = useState("");
  const [billingRateError, setBillingRateError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [isEditClosing, setIsEditClosing] = useState(false);
  const [isEditOpening, setIsEditOpening] = useState(false);
  const [adminId, setAdminId] = useState("");

  // Fetch current billing rate from Firestore
  useEffect(() => {
    const startTime = Date.now();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAdminId(user.uid);
        
        try {
          setLoading(true);
          const configDocRef = doc(db, "system_config", "global_settings");
          const configSnap = await getDoc(configDocRef);

          if (configSnap.exists()) {
            const config = configSnap.data();
            setBillingRatePerMinute(config.billingRatePerMinute?.toString() || "0.175");
          } else {
            // Create default config if it doesn't exist
            await setDoc(configDocRef, {
              configId: "global_settings",
              billingRatePerMinute: 0.175,
              lastUpdatedBy: "system",
              lastUpdatedAt: serverTimestamp(),
            });
            setBillingRatePerMinute("0.175");
          }

          // Ensure minimum 0.65 second loading time
          const elapsedTime = Date.now() - startTime;
          const minLoadingTime = 650;
          const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
          
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
        } catch (error) {
          console.error("Error fetching system config:", error);
          
          const elapsedTime = Date.now() - startTime;
          const minLoadingTime = 650;
          const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
          
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEditModal = () => {
    setIsEditClosing(false);
    setIsEditOpening(false);
    setEditModal(true);
    setBillingRateError("");
    setGlobalError("");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsEditOpening(true);
      });
    });
  };

  const closeEditModal = () => {
    if (isEditClosing) return;
    setIsEditOpening(false);
    setIsEditClosing(true);
    setTimeout(() => {
      setEditModal(false);
      setIsEditClosing(false);
      setBillingRateError("");
      setGlobalError("");
    }, 300);
  };

  const validate = () => {
    let valid = true;
    setGlobalError("");
    setBillingRateError("");

    const rate = parseFloat(billingRatePerMinute);
    if (!billingRatePerMinute.trim() || isNaN(rate) || rate <= 0) {
      setBillingRateError("Invalid billing rate. Must be a positive number.");
      valid = false;
    }

    if (!valid) {
      setGlobalError("Please fix the errors before submitting.");
    }

    return valid;
  };

  const handleSave = async () => {
    if (!validate() || saving) return;

    try {
      setSaving(true);
      const configDocRef = doc(db, "system_config", "global_settings");
      
      await setDoc(
        configDocRef,
        {
          configId: "global_settings",
          billingRatePerMinute: parseFloat(billingRatePerMinute),
          lastUpdatedBy: adminId,
          lastUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSuccessModal(true);
      closeEditModal();
    } catch (error) {
      console.error("Error updating billing rate:", error);
      setGlobalError("Failed to update billing rate. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (err) =>
    `px-3 sm:px-4 py-2 w-full border ${
      err ? "border-red-500" : "border-gray-300"
    } outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150`;

  const labelClass = "text-xs sm:text-sm text-gray-500";

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Header Card Skeleton */}
      <div className="flex relative rounded-2xl overflow-hidden text-white animate-pulse bg-gradient-to-r from-green-500 via-green-400 to-green-500">
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="h-9 sm:h-10 w-32 rounded bg-green-600/50"></div>
          <div className="h-4 sm:h-5 w-40 rounded bg-green-600/50"></div>
        </div>
        <div className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-3 bg-green-600/40">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-700/50"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex flex-col p-4 sm:p-5 rounded-2xl border border-gray-300 bg-gray-50 animate-pulse">
          <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-dvh flex flex-col lg:flex-row text-sm sm:text-base relative overflow-hidden">
      <AdminNavbar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <AdminDesktopNavbar />

        <div className="flex flex-col xl:flex-row px-3 py-4 sm:p-4 md:p-5 gap-4 xl:gap-5">
          {/* Tabs Container - Horizontal scroll on mobile, vertical on desktop */}
          <div className="flex xl:flex-col xl:w-72 gap-2 overflow-x-auto xl:overflow-x-visible scrollbar-hide xl:scrollbar-default scroll-smooth">
            <div className="flex xl:flex-col items-center gap-2 min-w-max xl:min-w-0">
              <button
                onClick={() => setActiveTab("billing")}
                className={`rounded-lg cursor-pointer px-4 py-3 transition-colors duration-150 flex-shrink-0 xl:w-full ${
                  activeTab === "billing"
                    ? "border border-green-500 bg-green-500 text-white"
                    : "border border-gray-300 text-gray-800 hover:bg-gray-100"
                }`}
              >
                Billing Rate
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col xl:flex-1 gap-4 relative">
            {/* Skeleton Loader with fade transition */}
            <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${
              loading ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}>
              <SkeletonLoader />
            </div>
            
            {/* Content with fade transition */}
            <div className={`transition-opacity duration-500 ${
              loading ? "opacity-0" : "opacity-100"
            }`}>
              {/* Configuration Header Card */}
              <div className="flex relative rounded-2xl overflow-hidden bg-linear-to-r from-green-500 via-green-400 to-green-500 p-5 text-white">
                <div className="flex flex-1 flex-col gap-2">
                  <span className="text-2xl sm:text-3xl font-bold">
                    Configuration
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-semibold text-white">
                      System Settings
                    </span>
                  </div>
                </div>
                <div className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-3 bg-green-600/40 shadow-green-600/40">
                  <Settings className="size-6 sm:size-7" />
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "billing" && (
                <>
                  {/* Billing Rate Section */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-gray-500 mt-2">
                        Billing Rate Per Minute
                      </span>
                      <button
                        onClick={handleEditModal}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-green-500 text-white text-xs sm:text-sm hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 cursor-pointer mt-2"
                      >
                        <Edit className="size-4" />
                        <span>Edit Rate</span>
                      </button>
                    </div>

                    {/* Current billing rate display */}
                    <div className="flex flex-col p-4 sm:p-5 rounded-2xl border border-gray-300">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500 text-xs mb-0.5">
                          Current Rate
                        </span>
                        <span className="font-semibold text-base sm:text-lg">
                          ₱{parseFloat(billingRatePerMinute || 0).toFixed(3)} per minute
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          This rate is used to calculate charges for internet access
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edit Billing Rate Modal */}
        {editModal && (
          <div 
            className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
              isEditClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeEditModal}
          >
            <div 
              className={`rounded-2xl relative bg-white w-full max-w-md flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
                isEditClosing 
                  ? "translate-y-[150vh] opacity-0 scale-95" 
                  : isEditOpening
                  ? "translate-y-0 opacity-100 scale-100"
                  : "translate-y-[20px] opacity-0 scale-[0.95]"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* CLOSE BUTTON - Top Middle */}
              <button
                onClick={closeEditModal}
                className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
              >
                <ChevronDown className="size-5 sm:size-6" />
              </button>

              {/* HEADER CARD */}
              <div className="flex relative rounded-t-2xl p-4 sm:p-5 text-white bg-linear-to-r from-green-500 via-green-400 to-green-500">
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-xl sm:text-2xl font-bold">
                    Edit Billing Rate
                  </span>
                  <span className="text-xs text-gray-100">
                    Update the billing rate per minute
                  </span>
                </div>
                <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-green-600/40 shadow-green-600/40">
                  <Edit className="size-5 sm:size-6" />
                </div>
              </div>

              {/* MAIN CONTENT */}
              <div className="flex flex-col gap-3 p-4 sm:p-5">
                {globalError && (
                  <div className="flex items-center gap-2 border-l-4 border-red-500 bg-red-100 text-red-500 rounded-lg px-4 py-2 text-xs sm:text-sm">
                    <CircleAlert className="size-4 sm:size-5" />
                    <div className="flex-1">{globalError}</div>
                  </div>
                )}

                <form className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Billing Rate Per Minute (₱)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={billingRatePerMinute}
                      onChange={(e) => setBillingRatePerMinute(e.target.value)}
                      placeholder="Enter billing rate (e.g., 0.175)"
                      className={fieldClass(billingRateError)}
                    />
                    {billingRateError && (
                      <span className="text-xs text-red-500">
                        {billingRateError}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      Enter the amount charged per minute of internet access
                    </span>
                  </div>

                  <div className="flex items-center gap-2 justify-end w-full mt-2">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      disabled={saving}
                      className="rounded-lg cursor-pointer px-4 py-2 border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-lg cursor-pointer px-4 py-2 border border-green-500 bg-green-500 text-white hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-[70] overflow-y-auto">
            <div className="rounded-2xl bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-6 mt-2 mb-2">
              <div className="flex flex-col items-center justify-center gap-4 pt-2">
                <div className="rounded-full p-3 bg-green-500 text-white">
                  <CircleCheckBig className="size-6 sm:size-7" />
                </div>
                <div className="flex flex-col text-center gap-1">
                  <span className="text-base sm:text-lg font-semibold text-green-500">
                    Success
                  </span>
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Billing rate has been successfully updated.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSuccessModal(false)}
                className="rounded-lg w-full cursor-pointer px-4 py-2 border border-green-500 bg-green-500 text-white hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
