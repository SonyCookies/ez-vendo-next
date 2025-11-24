"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db, onAuthStateChanged } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Pages that don't require authentication
  const publicPages = [
    "/admin/login",
    "/admin/add-admin-ez-vendo",
  ];

  useEffect(() => {
    // Check if current page is a public page
    const isPublicPage = publicPages.some((page) => pathname?.startsWith(page));

    // Set up auth state listener (stays active to detect sign out)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is authenticated - check if they are an admin
        try {
          const adminDocRef = doc(db, "admins", user.uid);
          const adminDocSnap = await getDoc(adminDocRef);
          
          if (adminDocSnap.exists()) {
            // User exists in admins collection - they are an admin
            setIsAuthenticated(true);
            setIsAdmin(true);
          } else {
            // User is authenticated but not an admin - redirect to user dashboard
            setIsAuthenticated(true);
            setIsAdmin(false);
            if (!isPublicPage) {
              // Redirect to user dashboard or login
              window.location.href = "/dashboard";
            }
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAuthenticated(false);
          setIsAdmin(false);
          if (!isPublicPage) {
            window.location.href = "/admin/login";
          }
        }
      } else {
        // User is not authenticated
        setIsAuthenticated(false);
        setIsAdmin(false);
        // Only redirect if not already on a public page - use immediate redirect
        if (!isPublicPage) {
          // Use window.location for immediate redirect (no loading state)
          window.location.href = "/admin/login";
        }
      }
      setIsChecking(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [pathname, router]);

  // If it's a public page, render children directly
  const isPublicPage = publicPages.some((page) => pathname?.startsWith(page));
  if (isPublicPage) {
    return <>{children}</>;
  }

  // While checking, don't render anything (prevents flash of content)
  if (isChecking) {
    return null;
  }

  // If not authenticated or not an admin, redirect immediately (no render)
  if (!isAuthenticated || !isAdmin) {
    // Don't render anything while redirecting
    return null;
  }

  // User is authenticated AND is an admin, render the protected content
  return <>{children}</>;
}

