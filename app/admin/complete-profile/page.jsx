"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, onAuthStateChanged } from "../../../firebase";

export default function CompleteProfile() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminId, setAdminId] = useState(null);

  const fieldClass = "px-3 sm:px-4 py-3 border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150";

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
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !birthday || !gender || !phone.trim() || !address.trim()) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      if (!adminId) {
        setError("No logged-in user found.");
        setLoading(false);
        return;
      }

      await setDoc(
        doc(db, "admins", adminId),
        {
          name,
          birthday,
          gender,
          phone,
          address,
        },
        { merge: true } // Use merge to update or create the document
      );
      router.replace("/admin/dashboard");
    } catch (err) {
      setError("Failed to complete profile. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh p-3 sm:p-4 flex items-center justify-center text-sm sm:text-base">
      <div className="container mx-auto w-full max-w-sm">
        <div className="flex flex-col gap-6 ">
          <div className="flex flex-col items-center justify-center ">
            <span className="text-xl sm:text-2xl font-bold">
              Complete Your <span className="text-green-500">Profile</span>
            </span>
            <span className="text-gray-500 text-sm sm:text-base">
              Fill in the details below or skip to finish later.
            </span>
          </div>

          {error && (
            <div className="items-center gap-2 p-3 bg-red-100 rounded-lg border-l-4 border-red-500 text-red-600 flex text-xs sm:text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm sm:text-base">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                placeholder="Enter your full name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm sm:text-base">Birthday</label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm sm:text-base">Gender</label>
              <input
                type="text"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={fieldClass}
                placeholder="Enter your gender"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm sm:text-base">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass}
                placeholder="Enter your phone number"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm sm:text-base">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={fieldClass}
                placeholder="Enter your address"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full px-4 py-2 flex items-center gap-2 justify-center bg-green-500 hover:bg-green-500/90 active:bg-green-600 text-white mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
              <button
                type="button"
                onClick={() => router.replace("/admin/dashboard")}
                className="w-full rounded-full px-4 py-2 flex items-center gap-2 justify-center bg-gray-500 hover:bg-gray-500/90 active:bg-gray-600 text-white mt-2"
              >
                Skip
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
