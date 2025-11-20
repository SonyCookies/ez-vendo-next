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

export default function BlockedUsers() {
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // SEARCH STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // SELECTED USER MODAL  // ADDED
  const [selectedUser, setSelectedUser] = useState(null);

  // MOCK USERS
  const mockUsers = [
    
    {
      id: 1,
      name: "Kim Anonuevo",
      rfid: 1234567890,
      status: "blocked",
      created: "11/19/2025 12:24:02 AM",
      bg: "bg-red-500",
      text: "text-red-500",

      birthday: "October 13, 2003",
      age: 22,
      gender: "Male",
      phone: "09123451111",
      email: "kim@gmail.com",
      address: "San Jose, Mindoro",
    },
    {
      id: 2,
      name: "Cy Kean Angel Dave Perjes",
      rfid: 523689412,
      status: "blocked",
      created: "11/19/2025 12:24:02 AM",
      bg: "bg-red-500",
      text: "text-red-500",

      birthday: "October 13, 2003",
      age: 22,
      gender: "Male",
      phone: "09123451111",
      email: "cyperjest@gmail.com",
      address: "San Jose, Mindoro",
    },
  ];

  // DEBOUNCE LOGIC  // ADDED
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

  // REAL-TIME FILTERING  // FIXED
  const filteredItems = useMemo(() => {
    if (!effectiveQuery) return mockUsers;

    return mockUsers.filter((item) => {
      const q = effectiveQuery;
      return (
        item.name.toLowerCase().startsWith(q) ||
        item.rfid.toString().startsWith(q)
      );
    });
  }, [effectiveQuery]);

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

  // CLEAR SEARCH HANDLER  // ADDED
  const handleClear = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setCurrentPage(1);
  };

  // OPEN MODAL  // ADDED
  const openUserModal = (user) => {
    setSelectedUser(user);
  };

  // CLOSE MODAL  // ADDED
  const closeUserModal = () => setSelectedUser(null);

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

  return (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* Total Users (unchanged) */}
      <div className="flex relative rounded-2xl bg-linear-to-r from-red-500 via-red-400 to-red-500 p-5 text-white">
        <div className="flex flex-1 flex-col gap-2 ">
          <span className="text-2xl sm:text-3xl font-bold">
            {mockUsers.length}
          </span>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-semibold text-white">
              Total Blocked Users
            </span>
            <span className="text-xs text-gray-100">
              As of November 15, 2025
            </span>
          </div>
        </div>
        <div className="absolute top-3 right-3 rounded-full p-3 bg-red-600 shadow-red-600">
          <UserX className="size-6 sm:size-7" />
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

              {/* CLEAR BUTTON SHOWS ONLY IF THERE IS TEXT -- ADDED */}
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

            {paginatedItems.map((u) => (
              <button
                key={u.id}
                onClick={() => openUserModal(u)}
                className="p-5 cursor-pointer rounded-2xl border border-gray-300 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
              >
                <div className="flex flex-1 text-left flex-col gap-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">{u.name}</span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      RFID No: {u.rfid}
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
                  <div
                    className={`flex items-center px-4 py-1 rounded-full text-xs text-white ${u.bg}`}
                  >
                    <span>{u.status}</span>
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
                    <th className="px-6 py-3 font-medium">Date Created</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedItems.map((u) => (
                    <tr key={u.id} className="border-b border-gray-300">
                      <td className="px-6 py-4">{u.name}</td>
                      <td className="px-6 py-4">{u.rfid}</td>
                      <td className="px-6 py-4">
                        <div className="flex">
                          <div
                            className={`text-xs px-4 py-1 rounded-full text-white ${u.bg}`}
                          >
                            {u.status}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{u.created}</td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => openUserModal(u)}
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
                className={`rounded-full p-3 text-white bg-green-500 inset-shadow-green-500 ${selectedUser.bg}`}
              >
                <UserRound className="size-6 sm:size-7" />
              </div>

              <div className="flex flex-col text-center">
                <span
                  className={`text-base sm:text-lg font-semibold  ${selectedUser.text}`}
                >
                  {selectedUser.name}
                </span>

                <span className="text-gray-500 text-xs sm:text-sm">
                  RFID No. {selectedUser.rfid}
                </span>

                <div className="flex flex-col items-center justify-center gap-1 pt-3">
                  <span className="text-xs text-gray-500">Status</span>

                  <div
                    className={`text-xs px-4 py-1 rounded-full text-white ${selectedUser.bg}`}
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
                      {selectedUser.birthday}
                    </span>
                  </div>

                  <div className="col-span-1 flex flex-col p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Age
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {selectedUser.age}
                    </span>
                  </div>

                  <div className="col-span-2 flex flex-col p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Gender
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {selectedUser.gender}
                    </span>
                  </div>

                  <div className="col-span-2 flex flex-col p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Phone
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {selectedUser.phone}
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
                      {selectedUser.address}
                    </span>
                  </div>

                  <div className="col-span-4 flex flex-col p-3 rounded-lg border border-gray-300">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Date Created
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      {selectedUser.created}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedUser.status === "blocked" ? (
              <button className="bg-green-500 px-4 py-2 rounded-lg text-white hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 cursor-pointer mb-2">
                Unblock user
              </button>
            ) : (
              <button className="bg-red-500 px-4 py-2 rounded-lg text-white hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 cursor-pointer mb-2">
                Block user
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
