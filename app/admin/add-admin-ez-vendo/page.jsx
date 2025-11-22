"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase"; // adjust path if needed
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function AddAdmin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fieldClass = "px-3 sm:px-4 py-3 border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Add admin role in Firestore
      await setDoc(doc(db, "admins", user.uid), {
        email: user.email,
        role: "admin",
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      router.replace("/admin/complete-profile"); // Redirect to complete profile setup
    } catch (err) {
      const code = err.code || "auth/error";
      let message = "Failed to register admin";
      if (code === "auth/email-already-in-use") message = "Email already in use";
      if (code === "auth/weak-password") message = "Password is too weak";
      setError(message);
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
              EZ-Vendo <span className="text-green-500">Admin</span>
            </span>
            <span className="text-gray-500 text-sm sm:text-base">Register a new admin</span>
          </div>

          {error && (
            <div className="items-center gap-2 p-3 bg-red-100 rounded-lg border-l-4 border-red-500 text-red-600 flex text-xs sm:text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="items-center gap-2 p-3 bg-green-100 rounded-lg border-l-4 border-green-500 text-green-600 flex text-xs sm:text-sm">
              Admin registered successfully
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm sm:text-base">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                placeholder="Enter admin email"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm sm:text-base">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
                placeholder="Enter admin password"
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-4 py-2 flex items-center gap-2 justify-center bg-green-500 hover:bg-green-500/90 active:bg-green-600 text-white mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Register Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}