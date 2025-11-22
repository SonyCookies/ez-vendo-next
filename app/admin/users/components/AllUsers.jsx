"use client";

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  UserCheck,
  UserRound,
  UserX,
  X,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function AllUsers() {
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // SEARCH STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // SELECTED USER MODAL
  const [selectedUser, setSelectedUser] = useState(null);

  // USERS DATA
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch users from Firestore
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError("");

      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map(async (docSnapshot) => {
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
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Failed to load users. Please try again later.");
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

    return users.filter((user) => {
      const q = effectiveQuery;
      return (
        user.fullName.toLowerCase().startsWith(q) ||
        user.rfidCardId?.toLowerCase().startsWith(q)
      );
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

  // OPEN MODAL
  const openUserModal = (user) => {
    setSelectedUser(user);
  };

  // CLOSE MODAL
  const closeUserModal = () => setSelectedUser(null);

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
    } catch (err) {
      console.error("Failed to update user status:", err);
      alert("Failed to update user status. Please try again.");
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

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Total Users */}
      <div className="flex relative rounded-2xl bg-linear-to-r from-green-500 via-green-400 to-green-500 p-5 text-white">
        <div className="flex flex-1 flex-col gap-2 ">
          <span className="text-2xl sm:text-3xl font-bold">
            {users.length}
          </span>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-semibold text-white">
              Total Users
            </span>
            <span className="text-xs text-gray-100">
              As of {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="absolute top-3 right-3 rounded-full p-3 bg-green-600/40  shadow-green-600/40 ">
          <UserRound className="size-6 sm:size-7" />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col gap-4">
        {/* SEARCH BAR */}
        <form className="flex">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs sm:text-sm font-semibold text-gray-500">
              Search users
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder="Search by Name or RFID No."
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
            List of Users
          </span>

          {/* MOBILE VIEW — CLICK TO OPEN MODAL */}
          <div className="flex xl:hidden flex-col gap-3">
            {filteredItems.length === 0 && <EmptyState />}

            {paginatedItems.map((user) => (
              <button
                key={user.id}
                onClick={() => openUserModal(u)}
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
                    className={`flex items-center px-4 py-1 rounded-full text-xs text-white ${user.bg}`}
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
                                : "bg-red-500"
                            }`}
                          >
                            {user.status}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.registeredAt?.toDate().toLocaleDateString() ||
                          "N/A"}
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
            <div className="inline-flex text-xs">
              <button
                onClick={() =>
                  currentPage > 1 && setCurrentPage(currentPage - 1)
                }
                className="rounded-tl-2xl rounded-bl-2xl border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="size-4" />
              </button>

              <div className="border-t border-b border-gray-300 px-4 py-2 flex items-center">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() =>
                  currentPage < totalPages && setCurrentPage(currentPage + 1)
                }
                className="rounded-tr-2xl rounded-br-2xl border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================== */}
      {/* SELECTED USER MODAL — ADDED */}
      {/* =========================== */}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-lg flex flex-col gap-4 mt-2 mb-2">
            {/* CLOSE BUTTON */}
            <button
              onClick={closeUserModal}
              className="p-2 cursor-pointer rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 text-gray-500 absolute top-2 sm:top-3 right-2 sm:right-3"
            >
              <X className="size-4 sm:size-5" />
            </button>

            {/* HEADER */}
            <div className="flex flex-col gap-4 items-center justify-center py-2">
              <div
                className={`rounded-full p-3 text-white bg-green-500 inset-shadow-green-500 ${
                  selectedUser.status === "active"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              >
                <UserRound className="size-6 sm:size-7" />
              </div>

              <div className="flex flex-col text-center">
                <span className="text-base sm:text-lg font-semibold">
                  {selectedUser.fullName}
                </span>

                <span className="text-gray-500 text-xs sm:text-sm">
                  RFID No. {selectedUser.rfidCardId}
                </span>

                <div className="flex flex-col items-center justify-center gap-1 pt-3">
                  <span className="text-xs text-gray-500">Status</span>

                  <div
                    className={`text-xs px-4 py-1 rounded-full text-white ${
                      selectedUser.status === "active"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {selectedUser.status}
                  </div>
                </div>
              </div>
            </div>

            {/* PERSONAL INFO */}
            <div className="flex flex-col gap-1">
              <span className="text-xs sm:text-sm font-semibold text-gray-500">
                Personal information
              </span>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-3 flex flex-col p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Birthday
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {selectedUser.birthday || "N/A"}
                    </span>
                  </div>

                  <div className="col-span-1 flex flex-col p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Age
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {selectedUser.age || "N/A"}
                    </span>
                  </div>

                  <div className="col-span-2 flex flex-col p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Gender
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {selectedUser.gender || "N/A"}
                    </span>
                  </div>

                  <div className="col-span-2 flex flex-col p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Phone
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {selectedUser.phone || "N/A"}
                    </span>
                  </div>

                  <div className="col-span-4 flex flex-col p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Email
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {selectedUser.email}
                    </span>
                  </div>

                  <div className="col-span-4 flex flex-col p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Address
                    </span>
                    <span className="font-semibold text-sm sm:text-base truncate">
                      {selectedUser.address || "N/A"}
                    </span>
                  </div>

                  <div className="col-span-4 flex flex-col p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Date Registered
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {selectedUser.registeredAt?.toDate().toLocaleDateString() ||
                        "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedUser.status === "blacklisted" ? (
              <button
                onClick={() => toggleUserStatus(selectedUser)}
                className="bg-green-500 px-4 py-2 rounded-lg text-white hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 cursor-pointer mb-2"
              >
                Unblock user
              </button>
            ) : (
              <button
                onClick={() => toggleUserStatus(selectedUser)}
                className="bg-red-500 px-4 py-2 rounded-lg text-white hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 cursor-pointer mb-2"
              >
                Block user
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
