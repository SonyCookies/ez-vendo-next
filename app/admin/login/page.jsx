"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, onAuthStateChanged } from "../../../firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { LogIn, Mail, Lock, CircleAlert, CircleCheckBig } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated and is an admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is an admin
        try {
          const adminDocRef = doc(db, "admins", user.uid);
          const adminDocSnap = await getDoc(adminDocRef);
          
          if (adminDocSnap.exists()) {
            // User is an admin, redirect to admin dashboard
            router.replace("/admin/dashboard");
          } else {
            // User is authenticated but not an admin, redirect to user dashboard
            router.replace("/dashboard");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          // On error, redirect to user dashboard
          router.replace("/dashboard");
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if user is an admin
      const adminDocRef = doc(db, "admins", user.uid);
      const adminDocSnap = await getDoc(adminDocRef);
      
      if (adminDocSnap.exists()) {
        // User is an admin
        setSuccess(true);
        router.replace("/admin/dashboard");
      } else {
        // User is authenticated but not an admin
        setError("Access denied. This account is not an admin.");
        // Sign out the user since they shouldn't be logged in
        await signOut(auth);
      }
    } catch (err) {
      const code = err.code || "auth/error";
      let message = "Failed to sign in";
      if (code === "auth/invalid-credential" || code === "auth/user-not-found") message = "Invalid email or password";
      if (code === "auth/wrong-password") message = "Incorrect password";
      if (code === "auth/too-many-requests") message = "Too many attempts. Try later.";
      setError(message);
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
                EZ-Vendo Admin
              </span>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm xl:text-base font-semibold text-white/90">
                  Sign in to your account
                </span>
              </div>
            </div>
            <div className="absolute top-1/2 right-3 sm:right-4 -translate-y-1/2 rounded-full p-2.5 sm:p-3 bg-green-600/40 shadow-lg">
              <LogIn className="size-5 sm:size-6 xl:size-7" />
            </div>
          </div>

          {/* Login Form Card */}
          <div className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-gray-300 bg-white shadow-sm">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-xs sm:text-sm">
                <CircleAlert className="size-4 sm:size-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 text-green-700 text-xs sm:text-sm">
                <CircleCheckBig className="size-4 sm:size-5 flex-shrink-0" />
                <span>Signed in successfully</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
              {/* Email Field */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-xs sm:text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="size-4 sm:size-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 sm:px-4 sm:pl-12 py-2 sm:py-2.5 border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-xs sm:text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="size-4 sm:size-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 sm:px-4 sm:pl-12 py-2 sm:py-2.5 border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-4 py-2.5 sm:py-3 flex items-center gap-2 justify-center bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-medium text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-green-500 mt-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="size-4 sm:size-5" />
                    <span>Sign in</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
