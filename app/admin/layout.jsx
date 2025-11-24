"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, onAuthStateChanged } from "../../firebase";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Pages that don't require authentication
  const publicPages = [
    "/admin/login",
    "/admin/add-admin-ez-vendo",
  ];

  useEffect(() => {
    // Check if current page is a public page
    const isPublicPage = publicPages.some((page) => pathname?.startsWith(page));

    // Set up auth state listener (stays active to detect sign out)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is authenticated
        setIsAuthenticated(true);
      } else {
        // User is not authenticated
        setIsAuthenticated(false);
        // Only redirect if not already on a public page - use immediate redirect
        if (!isPublicPage) {
          // Use window.location for immediate redirect (no loading state)
          window.location.href = "/admin/login";
        }
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [pathname, router]);

  // If it's a public page, render children directly
  const isPublicPage = publicPages.some((page) => pathname?.startsWith(page));
  if (isPublicPage) {
    return <>{children}</>;
  }

  // If not authenticated and not a public page, redirect immediately (no render)
  if (!isAuthenticated) {
    // Don't render anything while redirecting
    return null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}

