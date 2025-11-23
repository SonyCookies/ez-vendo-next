"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, onAuthStateChanged } from "../../../firebase";
import { User, Calendar, Users, Phone, MapPin, CircleAlert, Save, X } from "lucide-react";

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

  useEffect(() => {
    // Get the current user (layout handles authentication check)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAdminId(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

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
        { merge: true }
      );
      router.replace("/admin/dashboard");
    } catch (err) {
      setError("Failed to complete profile. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh p-3 sm:p-4 md:p-5 flex items-center justify-center text-sm sm:text-base bg-gray-50">
      <div className="container mx-auto w-full max-w-md">
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Header Card */}
          <div className="flex relative rounded-2xl overflow-hidden bg-gradient-to-r from-green-500 via-green-400 to-green-500 p-4 sm:p-5 text-white shadow-lg">
            <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl xl:text-3xl font-bold">
                Complete Your Profile
              </span>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm xl:text-base font-semibold text-white/90">
                  Fill in your details or skip to finish later
                </span>
              </div>
            </div>
            <div className="absolute top-1/2 right-3 sm:right-4 -translate-y-1/2 rounded-full p-2.5 sm:p-3 bg-green-600/40 shadow-lg">
              <User className="size-5 sm:size-6 xl:size-7" />
            </div>
          </div>

          {/* Profile Form Card */}
          <div className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-xs sm:text-sm">
                <CircleAlert className="size-4 sm:size-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
              {/* Full Name Field */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-xs sm:text-sm font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="size-4 sm:size-5" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 sm:px-4 sm:pl-12 py-2 sm:py-2.5 border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Enter your full name"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Birthday Field */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-xs sm:text-sm font-medium">
                  Birthday
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Calendar className="size-4 sm:size-5" />
                  </div>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full pl-10 pr-3 sm:px-4 sm:pl-12 py-2 sm:py-2.5 border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Gender Field */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-xs sm:text-sm font-medium">
                  Gender
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Users className="size-4 sm:size-5" />
                  </div>
                  <input
                    type="text"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full pl-10 pr-3 sm:px-4 sm:pl-12 py-2 sm:py-2.5 border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Enter your gender"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-xs sm:text-sm font-medium">
                  Phone
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="size-4 sm:size-5" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3 sm:px-4 sm:pl-12 py-2 sm:py-2.5 border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Enter your phone number"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Address Field */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-xs sm:text-sm font-medium">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin className="size-4 sm:size-5" />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-3 sm:px-4 sm:pl-12 py-2 sm:py-2.5 border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Enter your address"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg px-4 py-2.5 sm:py-3 flex items-center gap-2 justify-center bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-medium text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-green-500"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-4 sm:size-5" />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.replace("/admin/dashboard")}
                  className="flex-1 rounded-lg px-4 py-2.5 sm:py-3 flex items-center gap-2 justify-center bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-medium text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-150"
                >
                  <X className="size-4 sm:size-5" />
                  <span>Skip</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
