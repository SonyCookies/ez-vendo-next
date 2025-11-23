"use client";

import {
  User,
  CircleAlert,
  Trash2,
  ChevronDown,
  Edit,
  CircleCheckBig,
} from "lucide-react";
import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import AdminNavbar from "../components/AdminNavbar";
import { useState, useEffect } from "react";
import { auth, db, onAuthStateChanged } from "../../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminProfile() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("personal"); // "personal" or "account"
  const [deleteModal, setDeleteModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isEditClosing, setIsEditClosing] = useState(false);
  const [isEditOpening, setIsEditOpening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [globalError, setGlobalError] = useState("");

  const [adminId, setAdminId] = useState("");
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [age, setAge] = useState(null);
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editAge, setEditAge] = useState(null);
  const [editGender, setEditGender] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");

  useEffect(() => {
    const startTime = Date.now();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, set adminId and fetch data
        setAdminId(user.uid);

        try {
          setLoading(true);
          const docRef = doc(db, "admins", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const nameValue = data.name || "";
            const birthdayValue = data.birthday || "";
            const genderValue = data.gender || "";
            const phoneValue = data.phone || "";
            const emailValue = data.email || "";
            const addressValue = data.address || "";
            
            setName(nameValue);
            setBirthday(birthdayValue);
            setGender(genderValue);
            setPhone(phoneValue);
            setEmail(emailValue);
            setAddress(addressValue);

            // Set edit form values
            setEditName(nameValue);
            setEditBirthday(birthdayValue);
            setEditGender(genderValue);
            setEditPhone(phoneValue);
            setEditEmail(emailValue);
            setEditAddress(addressValue);
          }

          // Ensure minimum 0.65 second loading time for smooth transition
          const elapsedTime = Date.now() - startTime;
          const minLoadingTime = 650;
          const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
          
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
        } catch (error) {
          console.error("Failed to fetch admin data", error);
          
          // Ensure minimum loading time even on error
          const elapsedTime = Date.now() - startTime;
          const minLoadingTime = 650;
          const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
          
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
        } finally {
          setLoading(false);
        }
      } else {
        // User is signed out, redirect to login
        router.replace("/admin/login");
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [router]);

  useEffect(() => {
    if (!birthday) return;
    const birthDate = new Date(birthday);
    const today = new Date();

    let newAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      newAge--;
    }

    setAge(newAge);
  }, [birthday]);

  // Calculate edit age
  useEffect(() => {
    if (!editBirthday) return;
    const birthDate = new Date(editBirthday);
    const today = new Date();

    let newAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      newAge--;
    }

    setEditAge(newAge);
  }, [editBirthday]);

  const handleDeleteModal = () => {
    if (isClosing) return;
    setIsOpening(false);
    setIsClosing(false);
    setDeleteModal((prev) => !prev);
    setPassword("");
    setPasswordError("");
    setConfirmText("");
    setConfirmError("");
    setGlobalError("");
    // Trigger opening animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsOpening(true);
      });
    });
  };

  const closeDeleteModal = () => {
    if (isClosing) return;
    setIsOpening(false);
    setIsClosing(true);
    setTimeout(() => {
      setDeleteModal(false);
      setIsClosing(false);
    }, 300);
  };

  const handleEditModal = () => {
    if (isEditClosing) return;
    setIsEditOpening(false);
    setIsEditClosing(false);
    setEditModal((prev) => !prev);
    // Trigger opening animation on next frame
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
    }, 300);
  };

  // Save changes handler
  const handleSaveChanges = async () => {
    if (!adminId || saving) return;

    try {
      setSaving(true);
      const docRef = doc(db, "admins", adminId);
      await setDoc(
        docRef,
        {
          name: editName,
          birthday: editBirthday,
          gender: editGender,
          phone: editPhone,
          email: editEmail,
          address: editAddress,
        },
        { merge: true }
      );

      // Update display values
      setName(editName);
      setBirthday(editBirthday);
      setGender(editGender);
      setPhone(editPhone);
      setEmail(editEmail);
      setAddress(editAddress);
      setAge(editAge);

      setSuccessModal(true);
      closeEditModal();
    } catch (error) {
      console.error("Failed to save changes", error);
      setGlobalError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const validateDelete = () => {
    let valid = true;

    setPasswordError("");
    setConfirmError("");
    setGlobalError("");

    if (!password.trim()) {
      setPasswordError("Password required");
      valid = false;
    }

    if (confirmText.trim() !== "delete my account") {
      setConfirmError(`Type exactly "delete my account"`);
      valid = false;
    }

    if (!valid) {
      setGlobalError("Please correct the fields before deleting the account.");
    }

    return valid;
  };

  const handleDelete = () => {
    if (!validateDelete()) return;

    console.log("Account deleted!");
    // PLACE DELETE LOGIC HERE
  };

  const deleteDisabled = password.trim() === "" || confirmText.trim() === "";

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Profile Header Card Skeleton */}
      <div className="flex relative rounded-2xl overflow-hidden bg-gradient-to-r from-green-500 via-green-400 to-green-500 p-5 text-white animate-pulse">
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-9 sm:h-10 w-32 bg-green-600/50 rounded"></div>
          <div className="flex flex-col gap-0.5">
            <div className="h-4 sm:h-5 w-48 bg-green-600/50 rounded"></div>
            <div className="h-3 w-36 bg-green-600/50 rounded"></div>
          </div>
        </div>
        <div className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-3 bg-green-600/40">
          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-green-700/50 rounded-full"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col p-3 rounded-lg border border-gray-300 bg-gray-50 animate-pulse">
              <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          ))}
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
                onClick={() => setActiveTab("personal")}
                className={`rounded-lg cursor-pointer px-4 py-3 transition-colors duration-150 flex-shrink-0 xl:w-full ${
                  activeTab === "personal"
                    ? "border border-green-500 bg-green-500 text-white"
                    : "border border-gray-300 text-gray-800 hover:bg-gray-100"
                }`}
              >
                Personal Details
              </button>

              <button
                onClick={() => setActiveTab("account")}
                className={`rounded-lg cursor-pointer px-4 py-3 transition-colors duration-150 flex-shrink-0 xl:w-full ${
                  activeTab === "account"
                    ? "border border-green-500 bg-green-500 text-white"
                    : "border border-gray-300 text-gray-800 hover:bg-gray-100"
                }`}
              >
                Account Settings
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
              {/* Profile Header Card */}
              <div className="flex relative rounded-2xl overflow-hidden bg-linear-to-r from-green-500 via-green-400 to-green-500 p-5 text-white">
                <div className="flex flex-1 flex-col gap-2">
                  <span className="text-2xl sm:text-3xl font-bold">
                    {name || "Admin"}
                  </span>
                </div>
                <div className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-3 bg-green-600/40 shadow-green-600/40">
                  <User className="size-6 sm:size-7" />
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "personal" ? (
                <>
                {/* Personal Details Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-semibold text-gray-500 mt-2">
                      Personal Details
                    </span>
                    <button
                      onClick={handleEditModal}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg bg-green-500 text-white text-xs sm:text-sm hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 cursor-pointer mt-2"
                    >
                      <Edit className="size-4" />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Full Name
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {name || "Not set"}
                      </span>
                    </div>

                    <div className="col-span-1 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Birthday
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {birthday || "Not set"}
                      </span>
                    </div>

                    <div className="col-span-1 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Age
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {age || "N/A"}
                      </span>
                    </div>

                    <div className="col-span-1 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Gender
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {gender || "Not set"}
                      </span>
                    </div>

                    <div className="col-span-1 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Phone
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {phone || "Not set"}
                      </span>
                    </div>

                    <div className="col-span-2 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Email
                      </span>
                      <span className="font-semibold text-xs sm:text-sm break-all">
                        {email || "Not set"}
                      </span>
                    </div>

                    <div className="col-span-2 flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Address
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {address || "Not set"}
                      </span>
                    </div>
                  </div>
                </div>
                </>
              ) : (
                <>
                {/* Account Settings Section */}
                <div className="flex flex-col gap-4 mt-4">
                  <span className="text-xs sm:text-sm font-semibold text-gray-500">
                    Account Settings
                  </span>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Account Status
                      </span>
                      <span className="font-semibold text-xs sm:text-sm text-green-600">
                        Active
                      </span>
                    </div>

                    {/* Delete Account Button */}
                    <div className="flex items-center justify-end w-full mt-2">
                      <button
                        onClick={handleDeleteModal}
                        className="bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 cursor-pointer"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {editModal && (
          <div 
            className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
              isEditClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeEditModal}
          >
            <div 
              className={`rounded-2xl relative bg-white w-full max-w-5xl flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
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
                    Edit Profile
                  </span>
                  <span className="text-xs text-gray-100">
                    Update your personal information
                  </span>
                </div>
                <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-green-600/40 shadow-green-600/40">
                  <Edit className="size-5 sm:size-6" />
                </div>
              </div>

              {/* MAIN CONTENT */}
              <div className="flex flex-col gap-3 p-4 sm:p-5">
                {/* Personal Details Form */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-500">
                    Personal Details
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Full Name */}
                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="text-gray-500 text-xs sm:text-sm">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-3 sm:px-4 py-2 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150"
                        placeholder="Enter full name"
                      />
                    </div>

                    {/* Birthday */}
                    <div className="col-span-1 flex flex-col gap-1">
                      <label className="text-gray-500 text-xs sm:text-sm">
                        Birthday
                      </label>
                      <input
                        type="date"
                        value={editBirthday}
                        onChange={(e) => setEditBirthday(e.target.value)}
                        className="px-3 sm:px-4 py-2 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150"
                      />
                    </div>

                    {/* Age (auto-calculated) */}
                    <div className="col-span-1 flex flex-col gap-1">
                      <label className="text-gray-500 text-xs sm:text-sm">
                        Age
                      </label>
                      <input
                        type="text"
                        value={editAge || ""}
                        disabled
                        className="px-3 sm:px-4 py-2 w-full border border-gray-300 outline-none rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>

                    {/* Gender */}
                    <div className="col-span-1 flex flex-col gap-1">
                      <label className="text-gray-500 text-xs sm:text-sm">
                        Gender
                      </label>
                      <input
                        type="text"
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                        className="px-3 sm:px-4 py-2 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150"
                        placeholder="Enter gender"
                      />
                    </div>

                    {/* Phone */}
                    <div className="col-span-1 flex flex-col gap-1">
                      <label className="text-gray-500 text-xs sm:text-sm">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="px-3 sm:px-4 py-2 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150"
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Email */}
                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="text-gray-500 text-xs sm:text-sm">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="px-3 sm:px-4 py-2 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150"
                        placeholder="Enter email address"
                      />
                    </div>

                    {/* Address */}
                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="text-gray-500 text-xs sm:text-sm">
                        Address
                      </label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="px-3 sm:px-4 py-2 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150"
                        placeholder="Enter address"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 items-center justify-end w-full mt-2">
                  <button
                    onClick={closeEditModal}
                    className="rounded-lg cursor-pointer px-4 py-2 border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="rounded-lg cursor-pointer px-4 py-2 border border-green-500 bg-green-500 text-white hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteModal && (
          <div 
            className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
              isClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeDeleteModal}
          >
            <div 
              className={`rounded-2xl relative bg-white w-full max-w-md flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
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
                onClick={closeDeleteModal}
                className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
              >
                <ChevronDown className="size-5 sm:size-6" />
              </button>

              {/* HEADER CARD */}
              <div className="flex relative rounded-t-2xl p-4 sm:p-5 text-white bg-linear-to-r from-red-500 via-red-400 to-red-500">
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-xl sm:text-2xl font-bold">
                    Delete Account
                  </span>
                  <span className="text-xs text-gray-100">
                    This action cannot be undone
                  </span>
                </div>
                <div className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-red-600/40 shadow-red-600/40">
                  <Trash2 className="size-5 sm:size-6" />
                </div>
              </div>

              {/* MAIN CONTENT */}
              <div className="flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex flex-col text-center gap-1">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    To delete your account, please provide the information below.
                  </span>
                </div>

                {/* global validation message */}
                {globalError && (
                  <div className="flex items-center gap-2 border-l-4 border-red-500 bg-red-100 text-red-500 rounded-lg px-4 py-2 text-xs sm:text-sm">
                    <CircleAlert className="size-4 sm:size-5" />
                    <div className="flex-1">{globalError}</div>
                  </div>
                )}

                <form action="" className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs sm:text-sm text-gray-500">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className={`px-3 sm:px-4 py-2 w-full border ${
                        passwordError ? "border-red-500" : "border-gray-300"
                      } outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150`}
                    />
                    {passwordError && (
                      <span className="text-xs text-red-500">
                        {passwordError}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs sm:text-sm text-gray-500">
                      Type in{" "}
                      <span className="font-semibold">"delete my account"</span>
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={`Enter "delete my account"`}
                      className={`px-3 sm:px-4 py-2 w-full border ${
                        confirmError ? "border-red-500" : "border-gray-300"
                      } outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150`}
                    />
                    {confirmError && (
                      <span className="text-xs text-red-500">{confirmError}</span>
                    )}
                  </div>

                  <div className="flex px-4 py-2 rounded-lg bg-red-100 border border-red-200 text-xs text-red-500">
                    <span className="font-semibold pe-1">Note: </span>Deleting
                    your account is irreversible.
                  </div>
                </form>

                {/* buttons */}
                <div className="flex gap-2 items-center justify-end w-full mt-2">
                  <button
                    onClick={closeDeleteModal}
                    className="rounded-lg cursor-pointer px-4 py-2 border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
                  >
                    Cancel
                  </button>

                  <button
                    disabled={deleteDisabled}
                    onClick={handleDelete}
                    className={`rounded-lg cursor-pointer px-4 py-2 border text-white transition-colors duration-150 ${
                      deleteDisabled
                        ? "bg-red-400 border-red-400 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-500/90 active:bg-red-600"
                    }`}
                  >
                    Delete
                  </button>
                </div>
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
                    Profile updated successfully
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
