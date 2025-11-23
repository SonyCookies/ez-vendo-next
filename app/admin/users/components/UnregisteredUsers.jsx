"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserRound,
  UserX,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function UnregisteredUsers() {
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // SEARCH STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // SELECTED USER MODAL
  const [selectedUser, setSelectedUser] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  // SUCCESS/ERROR MODAL
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // USERS DATA
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch unregistered users from Firestore
  useEffect(() => {
    async function fetchUsers() {
      const startTime = Date.now();
      setLoading(true);
      setError("");

      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs
          .filter((docSnapshot) => {
            const userData = docSnapshot.data();
            return userData.isRegistered === false || !userData.isRegistered;
          })
          .map((docSnapshot) => {
            const userData = docSnapshot.data();
            return {
              id: docSnapshot.id,
              rfidCardId: docSnapshot.id, // Document ID is the RFID
              fullName: userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown",
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              email: userData.email || "N/A",
              status: userData.status || "unregistered",
              attempts: userData.registrationAttempt || userData.attempts || 0,
              firstScan: userData.firstScan,
              registeredAt: userData.registeredAt,
            };
          });

        setUsers(usersData);

        // Ensure minimum 0.65 second loading time for smooth transition
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 650; // 0.65 seconds
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Failed to load users. Please try again later.");
        
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
    }

    fetchUsers();
  }, []);

  // DEBOUNCE LOGIC
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const effectiveQuery =
    searchQuery.trim().length < 3
      ? searchQuery.trim().toLowerCase()
      : debouncedQuery.trim().toLowerCase();

  // REAL-TIME FILTERING
  const filteredItems = useMemo(() => {
    if (!effectiveQuery) return users;

    // Split by comma and trim each query
    const queries = effectiveQuery.split(',').map(q => q.trim()).filter(q => q.length > 0);

    return users.filter((user) => {
      // Check if user matches any of the comma-separated queries
      return queries.some((q) => {
        const queryLower = q.toLowerCase();
        return (
          user.fullName.toLowerCase().startsWith(queryLower) ||
          user.rfidCardId?.toLowerCase().startsWith(queryLower) ||
          user.email?.toLowerCase().startsWith(queryLower) ||
          user.lastName?.toLowerCase().startsWith(queryLower) ||
          user.firstName?.toLowerCase().startsWith(queryLower)
        );
      });
    });
  }, [effectiveQuery, users]);

  // Pagination still works while searching
  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage)
  );

  const indexStart = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(
    indexStart,
    indexStart + itemsPerPage
  );

  const fieldClass =
    "px-3 sm:px-4 py-3 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 pe-20 sm:pe-21";

  // CLEAR SEARCH HANDLER
  const handleClear = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setCurrentPage(1);
  };

  // HANDLE PAGE NUMBER CLICK
  const handlePageClick = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages && pageNum <= 5) {
      setCurrentPage(pageNum);
    }
  };

  // GET VISIBLE PAGE NUMBERS (show max 5 page numbers, limit to 1-5)
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    const maxPageToShow = Math.min(totalPages, maxVisible);
    
    // Show pages 1-5 (or fewer if total pages is less than 5)
    for (let i = 1; i <= maxPageToShow; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // OPEN MODAL
  const openUserModal = (user) => {
    setIsClosing(false); // Reset closing state when opening
    setIsOpening(false); // Start in initial position
    setSelectedUser(user);
    // Trigger opening animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsOpening(true);
      });
    });
  };

  // CLOSE MODAL with animation
  const closeUserModal = () => {
    if (isClosing) return; // Prevent multiple close calls
    setIsOpening(false); // Stop opening animation
    setIsClosing(true);
    setTimeout(() => {
      setSelectedUser(null);
      setIsClosing(false);
      setShowResetConfirm(false);
    }, 300); // Match animation duration
  };

  // Reset attempts function
  const handleResetAttempts = async () => {
    if (!selectedUser || resetting) return;
    
    try {
      setResetting(true);
      const userDocRef = doc(db, "users", selectedUser.id);
      
      // Update Firestore document - reset both attempts and registrationAttempt
      await updateDoc(userDocRef, {
        attempts: 0,
        registrationAttempt: 0,
      });
      
      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === selectedUser.id ? { ...u, attempts: 0 } : u
        )
      );
      
      // Update selected user
      setSelectedUser({ ...selectedUser, attempts: 0 });
      
      // Close confirmation modal
      setShowResetConfirm(false);
      
      // Show success modal
      setModalMessage("Attempts have been successfully reset to 0.");
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Failed to reset attempts:", err);
      setShowResetConfirm(false);
      setModalMessage("Failed to reset attempts. Please try again.");
      setShowErrorModal(true);
    } finally {
      setResetting(false);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const EmptyState = () => (
    <div className="flex flex-col gap-2 items-center justify-center p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-100 lg:bg-gray-50 w-full">
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center justify-center p-4 rounded-full bg-gray-300 text-gray-600">
          <UserX className="size-7 sm:size-8" />
        </div>
      </div>
      <div className="flex flex-col text-center pb-2">
        <span className="text-base sm:text-lg font-semibold">
          User Not Found
        </span>
        <span className="text-gray-500">There is no unregistered user found</span>
      </div>
    </div>
  );

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Total Users Skeleton */}
      <div className="flex relative rounded-2xl bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 p-5 text-white animate-pulse">
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-8 w-16 bg-yellow-600/50 rounded"></div>
          <div className="h-4 w-48 bg-yellow-600/50 rounded"></div>
          <div className="h-3 w-32 bg-yellow-600/50 rounded"></div>
        </div>
        <div className="absolute top-3 right-3 rounded-full p-3 bg-yellow-600/40">
          <div className="w-6 h-6 bg-yellow-700/50 rounded-full"></div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-col gap-4">
        {/* Search Bar Skeleton */}
        <div className="flex flex-col gap-1 w-full">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>

          {/* Mobile View Skeleton */}
          <div className="flex xl:hidden flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-gray-300 flex items-center gap-4 animate-pulse"
              >
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="h-5 w-32 bg-gray-200 rounded"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    <div className="h-5 w-8 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
                <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>

          {/* Desktop Table Skeleton */}
          <div className="hidden xl:flex rounded-2xl overflow-hidden border border-gray-300 w-full">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-gray-300 bg-gray-100">
                <tr>
                  {[...Array(6)].map((_, i) => (
                    <th key={i} className="px-6 py-3">
                      <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-300">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Skeleton */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="inline-flex h-8 w-48 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error && !loading) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
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
          {/* Total Users */}
          <div className="flex relative rounded-2xl bg-linear-to-r from-yellow-500 via-yellow-400 to-yellow-500 p-5 text-white">
            <div className="flex flex-1 flex-col gap-2 ">
              <span className="text-2xl sm:text-3xl font-bold">
                {users.length}
              </span>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-semibold text-white">
                  Total Unregistered Users
                </span>
                <span className="text-xs text-gray-100">
                  As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="absolute top-3 right-3 rounded-full p-3 bg-yellow-600/40  shadow-yellow-600/40 ">
              <UserX className="size-6 sm:size-7" />
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex flex-col gap-4">
            {/* SEARCH BAR */}
            <form className="flex">
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs sm:text-sm font-semibold text-gray-500 mt-4">
                  Search users
                </label>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Supports comma-separated search."
                    className={fieldClass}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />

                  {searchQuery.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-100/90 active:bg-gray-200 cursor-pointer transition-colors duration-150 top-2 right-2 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="flex flex-col gap-2">
              <span className="text-xs sm:text-sm font-semibold text-gray-500">
                List of Unregistered Users
              </span>

              {/* MOBILE VIEW — CLICK TO OPEN MODAL */}
              <div className="flex xl:hidden flex-col gap-3">
                {filteredItems.length === 0 && <EmptyState />}

                {paginatedItems.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => openUserModal(user)}
                    className="p-5 cursor-pointer rounded-2xl border border-gray-300 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
                  >
                    <div className="flex flex-1 text-left flex-col gap-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.fullName}</span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          RFID No: {user.rfidCardId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Attempts:</span>
                        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                          {user.attempts}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="flex items-center px-4 py-1 rounded-full text-xs text-white bg-yellow-500">
                        <span>Unregistered</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* DESKTOP VIEW */}
              <div className="hidden xl:flex rounded-2xl overflow-hidden border border-gray-300 w-full">
                {filteredItems.length === 0 ? (
                  <EmptyState />
                ) : (
                  <table className="w-full text-sm text-left text-body">
                    <thead className="border-b border-gray-300 bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">RFID No.</th>
                        <th className="px-6 py-3 font-medium">Email</th>
                        <th className="px-6 py-3 font-medium">Attempts</th>
                        <th className="px-6 py-3 font-medium">First Scan</th>
                        <th className="px-6 py-3 font-medium">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedItems.map((user) => (
                        <tr key={user.id} className="border-b border-gray-300">
                          <td className="px-6 py-4">{user.fullName}</td>
                          <td className="px-6 py-4">{user.rfidCardId}</td>
                          <td className="px-6 py-4">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                              {user.attempts}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {formatDate(user.firstScan)}
                          </td>

                          <td className="px-6 py-4">
                            <button
                              onClick={() => openUserModal(user)}
                              className="rounded-lg px-4 py-1 bg-green-500 text-white text-xs cursor-pointer transition-colors duration-150 hover:bg-green-500/90 active:bg-green-600"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* PAGINATION */}
              <div className="flex items-center justify-center lg:justify-end">
                <div className="inline-flex text-xs items-center gap-1">
                  <button
                    onClick={() => {
                      if (currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                      }
                    }}
                    className="rounded-tl-2xl rounded-bl-2xl border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  {/* Page Number Buttons */}
                  <div className="flex items-center border-t border-b border-gray-300">
                    {getVisiblePages().map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageClick(page)}
                        className={`px-3 py-2 border-x border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 ${
                          currentPage === page
                            ? "bg-green-500 text-white hover:bg-green-600 font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (currentPage < totalPages && currentPage < 5) {
                        setCurrentPage(currentPage + 1);
                      }
                    }}
                    className="rounded-tr-2xl rounded-br-2xl border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
                    disabled={currentPage >= totalPages || currentPage >= 5}
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* =========================== */}
      {/* SELECTED USER MODAL */}
      {/* =========================== */}

      {selectedUser && (
        <div 
          className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto transition-opacity duration-300 ${
            isClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeUserModal}
        >
          <div 
            className={`rounded-2xl relative bg-white w-full max-w-5xl flex flex-col gap-3 mt-2 mb-2 transition-all duration-300 ease-in-out ${
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
              onClick={closeUserModal}
              className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 z-10 p-2 cursor-pointer rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-150 text-gray-600 shadow-lg"
            >
              <ChevronDown className="size-5 sm:size-6" />
            </button>

            {/* HEADER CARD - Matching Total Unregistered Users Card Design */}
            <div
              className="flex relative rounded-t-2xl p-4 sm:p-5 text-white bg-linear-to-r from-yellow-500 via-yellow-400 to-yellow-500"
            >
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold">
                  {selectedUser.fullName}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    RFID No. {selectedUser.rfidCardId}
                  </span>
                  <span className="text-xs text-gray-100">
                    Unregistered User
                  </span>
                </div>
              </div>
              <div
                className="absolute top-3 right-3 rounded-full p-2.5 sm:p-3 bg-yellow-600/40 shadow-yellow-600/40"
              >
                <UserX className="size-5 sm:size-6" />
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              {/* User Information Section */}
              <div className="flex flex-col gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-500">
                  User Information
                </span>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs mb-0.5">
                      Email
                    </span>
                    <span className="font-semibold text-xs sm:text-sm break-all">
                      {selectedUser.email || "N/A"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Attempts
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {selectedUser.attempts || 0}
                      </span>
                    </div>

                    <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        First Scan
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {formatDate(selectedUser.firstScan)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset Attempts Button */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full bg-yellow-500 px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:bg-yellow-500/90 active:bg-yellow-600 transition-colors duration-150 cursor-pointer"
                >
                  Reset Attempts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Attempts Confirmation Modal */}
      {showResetConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-[60] overflow-y-auto">
          <div className="rounded-2xl bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-6 mt-2 mb-2">
            {/* content */}
            <div className="flex flex-col items-center justify-center gap-4 pt-2">
              <div className="rounded-full p-3 bg-yellow-500 shadow-yellow-500 text-white">
                <AlertCircle className="size-6 sm:size-7" />
              </div>
              <div className="flex flex-col text-center gap-1">
                <span className="text-base sm:text-lg font-semibold text-yellow-500">
                  Reset Attempts
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  Are you sure you want to reset the attempts for {selectedUser.fullName}? This will set the attempts to 0.
                </span>
              </div>
            </div>

            {/* buttons */}
            <div className="flex gap-2 items-center w-full">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="rounded-lg w-full cursor-pointer px-4 py-2 border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                onClick={handleResetAttempts}
                disabled={resetting}
                className="rounded-lg w-full cursor-pointer px-4 py-2 border border-yellow-500 bg-yellow-500 text-white hover:bg-yellow-500/90 active:bg-yellow-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetting ? "Resetting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-[70] overflow-y-auto">
          <div className="rounded-2xl bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-6 mt-2 mb-2">
            <div className="flex flex-col items-center justify-center gap-4 pt-2">
              <div className="rounded-full p-3 bg-green-500 text-white">
                <CheckCircle2 className="size-6 sm:size-7" />
              </div>
              <div className="flex flex-col text-center gap-1">
                <span className="text-base sm:text-lg font-semibold text-green-500">
                  Success
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  {modalMessage}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="rounded-lg w-full cursor-pointer px-4 py-2 border border-green-500 bg-green-500 text-white hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-[70] overflow-y-auto">
          <div className="rounded-2xl bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-6 mt-2 mb-2">
            <div className="flex flex-col items-center justify-center gap-4 pt-2">
              <div className="rounded-full p-3 bg-red-500 text-white">
                <XCircle className="size-6 sm:size-7" />
              </div>
              <div className="flex flex-col text-center gap-1">
                <span className="text-base sm:text-lg font-semibold text-red-500">
                  Error
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  {modalMessage}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowErrorModal(false)}
              className="rounded-lg w-full cursor-pointer px-4 py-2 border border-red-500 bg-red-500 text-white hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

