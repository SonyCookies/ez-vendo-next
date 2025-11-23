"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserRound,
  UserX,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function RegisteredUsers() {
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // SEARCH STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // STATUS FILTER
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "blacklisted"

  // SELECTED USER MODAL
  const [selectedUser, setSelectedUser] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  
  // USER DURATION
  const [totalDuration, setTotalDuration] = useState(0);
  const [durationLoading, setDurationLoading] = useState(false);
  
  // SUCCESS/ERROR MODAL
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // USERS DATA
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch registered users from Firestore
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
            return userData.isRegistered === true;
          })
          .map(async (docSnapshot) => {
            const userData = docSnapshot.data();
            const updatedFields = {};

            // Check and set default values for missing fields
            if (!userData.fullName) {
              updatedFields.fullName = "N/A";
            }
            if (!userData.status) {
              updatedFields.status = "active";
            }
            if (!userData.birthday) {
              updatedFields.birthday = "N/A";
            }
            if (!userData.age) {
              updatedFields.age = "N/A";
            }
            if (!userData.gender) {
              updatedFields.gender = "N/A";
            }
            if (!userData.phone) {
              updatedFields.phone = "N/A";
            }
            if (!userData.address) {
              updatedFields.address = "N/A";
            }

            // Update Firestore document if there are missing fields
            if (Object.keys(updatedFields).length > 0) {
              const userDocRef = doc(db, "users", docSnapshot.id);
              await updateDoc(userDocRef, updatedFields);
            }

            return {
              id: docSnapshot.id,
              ...userData,
              ...updatedFields, // Merge updated fields with existing data
            };
          });

        // Resolve all promises and set users state
        const resolvedUsers = await Promise.all(usersData);
        setUsers(resolvedUsers);

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
    let filtered = users;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    // Apply search filter
    if (effectiveQuery) {
      // Split by comma and trim each query
      const queries = effectiveQuery.split(',').map(q => q.trim()).filter(q => q.length > 0);
      
      filtered = filtered.filter((user) => {
        // Check if user matches any of the comma-separated queries
        return queries.some((q) => {
          const queryLower = q.toLowerCase();
          return (
            user.fullName.toLowerCase().startsWith(queryLower) ||
            user.rfidCardId?.toLowerCase().startsWith(queryLower) ||
            user.lastName?.toLowerCase().startsWith(queryLower) ||
            user.firstName?.toLowerCase().startsWith(queryLower)
          );
        });
      });
    }

    return filtered;
  }, [effectiveQuery, users, statusFilter]);

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

  // Fetch user transactions to calculate total duration
  useEffect(() => {
    const fetchUserDuration = async () => {
      if (!selectedUser) {
        setTotalDuration(0);
        return;
      }

      try {
        setDurationLoading(true);
        const userRfidId = selectedUser.rfidCardId || selectedUser.id;
        
        // Fetch transactions where userId matches
        const transactionsRef = collection(db, "transactions");
        const q = query(transactionsRef, where("userId", "==", userRfidId));
        const querySnapshot = await getDocs(q);

        let totalMinutes = 0;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Sum up minutes purchased
          if (data.minutesPurchased) {
            totalMinutes += Number(data.minutesPurchased) || 0;
          }
        });

        setTotalDuration(totalMinutes);
      } catch (err) {
        console.error("Failed to fetch user duration:", err);
        setTotalDuration(0);
      } finally {
        setDurationLoading(false);
      }
    };

    if (selectedUser) {
      fetchUserDuration();
    }
  }, [selectedUser]);

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
    }, 300); // Match animation duration
  };

  // Function to toggle user status
  const toggleUserStatus = async (user) => {
    try {
      const newStatus = user.status === "active" ? "blacklisted" : "active";
      const userDocRef = doc(db, "users", user.id);

      // Update Firestore document
      await updateDoc(userDocRef, { status: newStatus });

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === user.id ? { ...u, status: newStatus } : u
        )
      );
      
      // Update selected user if it's the same user
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
      
      // Show success modal
      const statusText = newStatus === "active" ? "unblocked" : "blacklisted";
      setModalMessage(`User has been successfully ${statusText}.`);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Failed to update user status:", err);
      setModalMessage("Failed to update user status. Please try again.");
      setShowErrorModal(true);
    }
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
        <span className="text-gray-500">There is no user found</span>
      </div>
    </div>
  );

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Total Users Skeleton */}
      <div className="flex relative rounded-2xl bg-gradient-to-r from-green-500 via-green-400 to-green-500 p-5 text-white animate-pulse">
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-8 w-16 bg-green-600/50 rounded"></div>
          <div className="h-4 w-48 bg-green-600/50 rounded"></div>
          <div className="h-3 w-32 bg-green-600/50 rounded"></div>
        </div>
        <div className="absolute top-3 right-3 rounded-full p-3 bg-green-600/40">
          <div className="w-6 h-6 bg-green-700/50 rounded-full"></div>
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
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
            
            {/* Status Filter Buttons Skeleton */}
            <div className="flex items-center gap-2 flex-wrap">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          </div>

          {/* Mobile View Skeleton */}
          <div className="flex xl:hidden flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-gray-300 flex items-center animate-pulse"
              >
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="h-5 w-32 bg-gray-200 rounded"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>

          {/* Desktop Table Skeleton */}
          <div className="hidden xl:flex rounded-2xl overflow-hidden border border-gray-300 w-full">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-gray-300 bg-gray-100">
                <tr>
                  {[...Array(5)].map((_, i) => (
                    <th key={i} className="px-6 py-3">
                      <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-300">
                    {[...Array(5)].map((_, j) => (
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
          <div className={`flex relative rounded-2xl p-5 text-white ${
            statusFilter === "blacklisted"
              ? "bg-linear-to-r from-red-500 via-red-400 to-red-500"
              : "bg-linear-to-r from-green-500 via-green-400 to-green-500"
          }`}>
            <div className="flex flex-1 flex-col gap-2 ">
              <span className="text-2xl sm:text-3xl font-bold">
                {statusFilter === "all" 
                  ? users.length 
                  : filteredItems.length}
              </span>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-semibold text-white">
                  {statusFilter === "all" 
                    ? "Total Registered Users"
                    : statusFilter === "active"
                    ? "Active Users"
                    : "Blacklisted Users"}
                </span>
                <span className="text-xs text-gray-100">
                  As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
            <div className={`absolute top-3 right-3 rounded-full p-3 shadow-600/40 ${
              statusFilter === "blacklisted"
                ? "bg-red-600/40 shadow-red-600/40"
                : "bg-green-600/40 shadow-green-600/40"
            }`}>
              {statusFilter === "blacklisted" ? (
                <UserX className="size-6 sm:size-7" />
              ) : (
                <UserRound className="size-6 sm:size-7" />
              )}
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
              <div className="flex flex-col gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-500">
                  List of Registered Users
                </span>
                
                {/* Status Filter Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                      statusFilter === "all"
                        ? "bg-green-500 text-white border border-green-500"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter("active");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                      statusFilter === "active"
                        ? "bg-green-500 text-white border border-green-500"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter("blacklisted");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${
                      statusFilter === "blacklisted"
                        ? "bg-green-500 text-white border border-green-500"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                    }`}
                  >
                    Blacklisted
                  </button>
                </div>
              </div>

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
                    </div>

                    <div className="flex items-center">
                      <div
                        className={`flex items-center px-4 py-1 rounded-full text-xs text-white ${
                          user.status === "active"
                            ? "bg-green-500"
                            : user.status === "blacklisted"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }`}
                      >
                        <span>{user.status}</span>
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
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Date Registered</th>
                        <th className="px-6 py-3 font-medium">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedItems.map((user) => (
                        <tr key={user.id} className="border-b border-gray-300">
                          <td className="px-6 py-4">{user.fullName}</td>
                          <td className="px-6 py-4">{user.rfidCardId}</td>
                          <td className="px-6 py-4">
                            <div className="flex">
                              <div
                                className={`text-xs px-4 py-1 rounded-full text-white ${
                                  user.status === "active"
                                    ? "bg-green-500"
                                    : user.status === "blacklisted"
                                    ? "bg-red-500"
                                    : "bg-gray-500"
                                }`}
                              >
                                {user.status}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {user.registeredAt?.toDate
                              ? user.registeredAt.toDate().toLocaleDateString()
                              : "N/A"}
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

            {/* HEADER CARD - Matching Total Users Card Design */}
            <div
              className={`flex relative rounded-t-2xl p-4 sm:p-5 text-white ${
                selectedUser.status === "blacklisted"
                  ? "bg-linear-to-r from-red-500 via-red-400 to-red-500"
                  : "bg-linear-to-r from-green-500 via-green-400 to-green-500"
              }`}
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
                    {selectedUser.status === "active"
                      ? "Active User"
                      : selectedUser.status === "blacklisted"
                      ? "Blacklisted User"
                      : "Registered User"}
                  </span>
                </div>
              </div>
              <div
                className={`absolute top-3 right-3 rounded-full p-2.5 sm:p-3 ${
                  selectedUser.status === "blacklisted"
                    ? "bg-red-600/40 shadow-red-600/40"
                    : "bg-green-600/40 shadow-green-600/40"
                }`}
              >
                {selectedUser.status === "blacklisted" ? (
                  <UserX className="size-5 sm:size-6" />
                ) : (
                  <UserRound className="size-5 sm:size-6" />
                )}
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              {/* Two Column Layout for Personal and Account Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Personal Information Section */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-500">
                    Personal Information
                  </span>

                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                        <span className="text-gray-500 text-xs mb-0.5">
                          Birthday
                        </span>
                        <span className="font-semibold text-xs sm:text-sm">
                          {selectedUser.birthday || "N/A"}
                        </span>
                      </div>

                      <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                        <span className="text-gray-500 text-xs mb-0.5">
                          Age
                        </span>
                        <span className="font-semibold text-xs sm:text-sm">
                          {selectedUser.age || "N/A"}
                        </span>
                      </div>

                      <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                        <span className="text-gray-500 text-xs mb-0.5">
                          Gender
                        </span>
                        <span className="font-semibold text-xs sm:text-sm">
                          {selectedUser.gender || "N/A"}
                        </span>
                      </div>

                      <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                        <span className="text-gray-500 text-xs mb-0.5">
                          Phone
                        </span>
                        <span className="font-semibold text-xs sm:text-sm">
                          {selectedUser.phone || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Email
                      </span>
                      <span className="font-semibold text-xs sm:text-sm break-all">
                        {selectedUser.email || "N/A"}
                      </span>
                    </div>

                    <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Address
                      </span>
                      <span className="font-semibold text-xs sm:text-sm break-words">
                        {selectedUser.address || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Information Section */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-500">
                    Account Information
                  </span>

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Account Status
                      </span>
                      <div
                        className={`inline-flex text-xs px-3 py-1 rounded-full text-white font-medium w-fit ${
                          selectedUser.status === "active"
                            ? "bg-green-500"
                            : selectedUser.status === "blacklisted"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }`}
                      >
                        {selectedUser.status === "active"
                          ? "Active"
                          : selectedUser.status === "blacklisted"
                          ? "Blacklisted"
                          : selectedUser.status || "Unknown"}
                      </div>
                    </div>

                    <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Date Registered
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">
                        {selectedUser.registeredAt?.toDate
                          ? selectedUser.registeredAt
                              .toDate()
                              .toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                          : "N/A"}
                      </span>
                    </div>

                    {selectedUser.balance !== undefined && (
                      <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                        <span className="text-gray-500 text-xs mb-0.5">
                          Current Balance
                        </span>
                        <span className="font-semibold text-xs sm:text-sm text-green-600">
                          ₱{selectedUser.balance?.toLocaleString() || "0.00"}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col p-2.5 sm:p-3 rounded-lg border border-gray-300">
                      <span className="text-gray-500 text-xs mb-0.5">
                        Total Duration
                      </span>
                      {durationLoading ? (
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mt-1"></div>
                      ) : (
                        <span className="font-semibold text-xs sm:text-sm">
                          {totalDuration.toLocaleString()} {totalDuration === 1 ? "minute" : "minutes"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col gap-2 pt-1">
                {selectedUser.status === "blacklisted" ? (
                  <button
                    onClick={() => toggleUserStatus(selectedUser)}
                    className="w-full bg-green-500 px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 cursor-pointer"
                  >
                    Unblock User
                  </button>
                ) : (
                  <button
                    onClick={() => toggleUserStatus(selectedUser)}
                    className="w-full bg-red-500 px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 cursor-pointer"
                  >
                    Block User
                  </button>
                )}
              </div>
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

