"use client";

import {
  BanknoteArrowUp,
  CircleAlert,
  CircleCheckBig,
  CirclePlus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import AdminNavbar from "../components/AdminNavbar";
import { useState, useEffect } from "react";
import { auth, db, onAuthStateChanged } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminBilling() {
  const router = useRouter();

  const [deleteModal, setDeleteModal] = useState(false);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, set adminId and fetch data
        setAdminId(user.uid);

        try {
          const docRef = doc(db, "admins", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.name || "");
            setBirthday(data.birthday || "");
            setGender(data.gender || "");
            setPhone(data.phone || "");
            setEmail(data.email || "");
            setAddress(data.address || "");
          }
        } catch (error) {
          console.error("Failed to fetch admin data", error);
        }
      } else {
        // User is signed out, redirect to login
        router.replace("/admin/login");
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

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

  const handleDeleteModal = () => {
    setDeleteModal((prev) => !prev);
    setPassword("");
    setPasswordError("");
    setConfirmText("");
    setConfirmError("");
    setGlobalError("");
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

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row text-sm sm:text-base relative">
      <AdminNavbar />
      <div className="flex flex-1 flex-col">
        <AdminDesktopNavbar />

        <div className="flex flex-col items-center px-3 py-4 sm:p-4 md:p-5 gap-4 xl:gap-5 ">
          <div className="w-full max-w-2xl  flex flex-col gap-4 xl:gap-5">
            {/* basic details card */}
            <div className="flex flex-col gap-4 items-center justify-center p-2 sm:p-5 sm:rounded-2xl sm:border border-gray-300">
              {/* image container */}
              <div className="flex items-center justify-center">
                <div className="size-24 rounded-full bg-green-500"></div>
              </div>
              {/* name and adminId and btns */}
              <div className="flex flex-col gap-3">
                {/* name and admin Id */}
                <div className="flex flex-col text-center">
                  <span className="font-semibold text-base sm:text-lg">
                    {name}
                  </span>
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Admin ID: {adminId}
                  </span>
                </div>
                {/* btn */}
                <Link
                  href="/admin/edit-profile"
                  className="bg-green-500 text-white text-center transition-colors duration-150 px-6 py-2 rounded-full cursor-pointer hover:bg-green-500/90 active:bg-green-600"
                >
                  Edit profile
                </Link>
              </div>
            </div>

            {/* information */}
            <div className="flex flex-col gap-2">
              <span className="text-xs sm:text-sm font-semibold text-gray-500">
                Personal details
              </span>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-3 flex flex-col p-3 sm:p-4 rounded-2xl border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Birthday
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {birthday}
                    </span>
                  </div>

                  <div className="col-span-1 flex flex-col p-3 sm:p-4 rounded-2xl border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Age
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {age}
                    </span>
                  </div>

                  <div className="col-span-2 flex flex-col p-3 sm:p-4 rounded-2xl border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Gender
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {gender}
                    </span>
                  </div>

                  <div className="col-span-2 flex flex-col p-3 sm:p-4 rounded-2xl border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Phone
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {phone}
                    </span>
                  </div>

                  <div className="col-span-4 flex flex-col p-3 sm:p-4 rounded-2xl border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Email
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {email}
                    </span>
                  </div>

                  <div className="col-span-4 flex flex-col p-3 sm:p-4 rounded-2xl border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Address
                    </span>
                    <span className="font-semibold text-sm sm:text-base truncate">
                      {address}
                    </span>
                  </div>

                  {/* <div className="col-span-4 flex flex-col p-3 sm:p-4 rounded-2xl border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Date Created
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {selectedUser.created}
                    </span>
                  </div> */}
                </div>
              </div>
            </div>

            {/* btns */}
            <div className="flex gap-2 items-center justify-center">
              <button
                onClick={handleDeleteModal}
                className="bg-red-500 text-white transition-colors duration-150 px-6 py-2 rounded-full cursor-pointer hover:bg-red-500/90 active:bg-red-600"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>

        {deleteModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
            <div className="rounded-2xl bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-6 mt-2 mb-2">
              {/* content */}
              <div className="flex flex-col items-center justify-center gap-4 pt-2 ">
                <div className="rounded-full p-3 bg-red-500 shadow-red-600 text-white">
                  <Trash2 className="size-6 sm:size-7" />
                </div>
                <div className="flex flex-col text-center gap-1">
                  <span className="text-base sm:text-lg font-semibold text-red-500">
                    Delete Confirmation
                  </span>
                  <span className="text-gray-500 text-xs sm:text-sm">
                    To delete account, provide the information needed.
                  </span>
                </div>
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
                  <label
                    htmlFor=""
                    className="text xs sm:text-sm text-gray-500"
                  >
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
                  <label
                    htmlFor=""
                    className="text xs sm:text-sm text-gray-500"
                  >
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

                <div className="flex px-4 py-2 rounded-lg bg-red-100 text-xs text-red-500">
                  <span className="font-semibold pe-1">Note: </span>Deleting
                  your account is irreversible.
                </div>
              </form>

              {/* buttons */}
              <div className="flex gap-2 items-center w-full">
                <button
                  onClick={handleDeleteModal}
                  className="rounded-lg w-full cursor-pointer px-4 py-2 border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
                >
                  Discard
                </button>

                <button
                  disabled={deleteDisabled}
                  onClick={handleDelete}
                  className={`rounded-lg w-full cursor-pointer px-4 py-2 border  text-white transition-colors duration-150 
                  ${
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
        )}
      </div>
    </div>
  );
}
