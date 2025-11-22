"use client";

import { CircleAlert, CircleCheckBig, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import AdminNavbar from "../components/AdminNavbar";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth, onAuthStateChanged } from "../../../firebase"; // Adjust path if needed
import { useRouter } from "next/navigation";

export default function AdminEditProfile() {
  const router = useRouter();
  const [deleteModal, setDeleteModal] = useState(false);

  // IMAGE UPLOAD
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [successModal, setSuccessModal] = useState(false);

  // PROFILE FIELDS
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [age, setAge] = useState(null);
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [adminId, setAdminId] = useState(""); // Add state for adminId

  // Delete modal fields (unchanged)
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [globalError, setGlobalError] = useState("");

  // Fetch the logged-in admin's ID dynamically
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, set adminId
        setAdminId(user.uid);
      } else {
        // User is signed out, redirect to login
        router.replace("/admin/login");
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const user = auth.currentUser; // Get the currently logged-in user
        if (!user) {
          console.error("No logged-in user found");
          return;
        }

        const adminId = user.uid; // Use the logged-in user's UID as the admin ID
        setAdminId(adminId); // Set adminId state

        const docRef = doc(db, "admins", adminId);
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
    }

    fetchAdminData();
  }, []);

  // Dynamically calculate age
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

  // Image upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

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

  // Added error handling to display user-friendly messages
  const handleSaveChanges = async () => {
    setSuccessModal(false);
    try {
      const docRef = doc(db, "admins", adminId);
      await setDoc(
        docRef,
        {
          name,
          birthday,
          gender,
          phone,
          email,
          address,
        },
        { merge: true } // Use merge to update or create the document
      );

      setSuccessModal(true);
    } catch (error) {
      console.error("Failed to save changes", error);
      setGlobalError("Failed to save changes. Please try again."); // Display error message
    }
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
                <div className="size-24 rounded-full bg-green-500 overflow-hidden flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="profile"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
              </div>

              {/* Upload button */}
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="upload"
                  className="bg-green-500 text-white transition-colors duration-150 px-6 py-2 rounded-full cursor-pointer hover:bg-green-500/90 active:bg-green-600 text-center"
                >
                  Upload Image
                </label>

                <input
                  id="upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* information */}
            <div className="flex flex-col gap-2">
              <span className="text-xs sm:text-sm font-semibold text-gray-500">
                Personal details
              </span>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-4 gap-3">
                  {/* Name */}
                  <div className="col-span-4 gap-1 flex flex-col ">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Full Name
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="font-semibold outline-none border border-gray-300 px-4 py-2 w-full rounded-lg"
                    />
                  </div>

                  {/* Birthday */}
                  <div className="col-span-3 gap-1 flex flex-col ">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Birthday
                    </span>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="font-semibold outline-none border border-gray-300 px-4 py-2 w-full rounded-lg"
                    />
                  </div>

                  {/* Age (auto) */}
                  <div className="col-span-1 gap-1 flex flex-col ">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Age
                    </span>
                    <input
                      value={age}
                      disabled
                      className="font-semibold outline-none border border-gray-300 px-4 py-2 w-full rounded-lg bg-gray-50"
                    />
                  </div>

                  {/* Gender */}
                  <div className="col-span-2 gap-1 flex flex-col ">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Gender
                    </span>
                    <input
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="font-semibold outline-none border border-gray-300 px-4 py-2 w-full rounded-lg"
                    />
                  </div>

                  {/* Phone */}
                  <div className="col-span-2 gap-1 flex flex-col ">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Phone
                    </span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="font-semibold outline-none border border-gray-300 px-4 py-2 w-full rounded-lg"
                    />
                  </div>

                  {/* Email */}
                  <div className="col-span-4 gap-1 flex flex-col ">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Email
                    </span>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="font-semibold outline-none border border-gray-300 px-4 py-2 w-full rounded-lg"
                    />
                  </div>

                  {/* Address */}
                  <div className="col-span-4 gap-1 flex flex-col ">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Address
                    </span>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="font-semibold outline-none border border-gray-300 px-4 py-2 w-full rounded-lg truncate"
                    />
                  </div>

                  {/* Admin ID (Uneditable) */}
                  <div className="col-span-4 gap-1 flex flex-col  opacity-60">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Admin ID
                    </span>
                    <input
                      value={adminId}
                      disabled
                      className="font-semibold outline-none border border-gray-300 px-4 py-2 w-full rounded-lg truncate bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="flex gap-2 items-center justify-center">
              <button
                onClick={handleSaveChanges}
                className="bg-green-500 text-white transition-colors duration-150 px-6 py-2 rounded-full cursor-pointer hover:bg-green-500/90 active:bg-green-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {successModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
            <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-4 sm:gap-5 mt-2 mb-2">
              <div className="flex flex-col items-center justify-center gap-4 py-2 ">
                <div className="rounded-full p-3 bg-green-500 shadow-green-600 text-white">
                  <CircleCheckBig className="size-6 sm:size-7" />
                </div>
                <div className="flex flex-col text-center">
                  <span className="text-base sm:text-lg font-semibold">
                    Edit Succesful
                  </span>
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Successfully edited your profile
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
