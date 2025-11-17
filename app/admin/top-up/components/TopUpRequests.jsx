"use client";
import {
  BanknoteArrowUp,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react"; // Ensure useState is imported

export default function TopUpRequests() {
  // 1. State to manage the currently viewed request data (and modal visibility)
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Pagination (active only when not searching)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const pendingRequestsItems = [
    {
      id: 1,
      name: "Edward Gatbonton",
      method: "Gcash",
      transactionId: "P-111525-001",
      date: "November 15, 2025",
      time: "12:30:22pm",
      rfid: 123456789,
      status: "Pending",

      amount: 50.0,
      referenceNumber: "6034658235337", // Added Reference No. for modal
    },
    {
      id: 2,
      name: "Sonny Sarcia",
      method: "Gcash",
      transactionId: "P-111525-002",
      date: "November 15, 2025",
      time: "12:30:22pm",
      rfid: 159512365,
      status: "Pending",

      amount: 100.0,
      referenceNumber: "6034658235338",
    },
    {
      id: 3,
      name: "Kim Anonuevo",
      method: "Gcash",
      transactionId: "P-111525-003",
      date: "November 15, 2025 ",
      time: "12:30:22pm",
      rfid: 895432597,
      status: "Pending",

      amount: 150.0,
      referenceNumber: "6034658235339",
    },
    {
      id: 4,
      name: "Yesha Keith Adoyo",
      method: "PayMaya", // Changed method for variety
      transactionId: "P-111525-004",
      date: "November 15, 2025 ",
      time: "12:30:22pm",
      rfid: 652479124,
      status: "Pending",

      amount: 200.0,
      referenceNumber: "6034658235340",
    },
    {
      id: 5,
      name: "Cy Kean Perjes",
      method: "Bank Transfer", // Changed method for variety
      transactionId: "P-111525-005",
      date: "November 15, 2025 ",
      time: "12:30:22pm",
      rfid: 985613485,
      status: "Pending",

      amount: 250.0,
      referenceNumber: "6034658235341",
    },
    {
      id: 6,
      name: "Alex Ramos",
      method: "Gcash",
      transactionId: "P-111525-006",
      date: "November 15, 2025",
      time: "12:35:10pm",
      rfid: 112233445,
      status: "Pending",
      amount: 75.0,
      referenceNumber: "6034658235342",
    },
    {
      id: 7,
      name: "Maya Santos",
      method: "PayMaya",
      transactionId: "P-111525-007",
      date: "November 15, 2025",
      time: "12:40:05pm",
      rfid: 998877665,
      status: "Pending",
      amount: 125.0,
      referenceNumber: "6034658235343",
    },
    {
      id: 8,
      name: "Jhon Doe",
      method: "Bank Transfer",
      transactionId: "P-111525-008",
      date: "November 15, 2025",
      time: "12:42:20pm",
      rfid: 556677889,
      status: "Pending",
      amount: 300.0,
      referenceNumber: "6034658235344",
    },
    {
      id: 9,
      name: "Anna Cruz",
      method: "Gcash",
      transactionId: "P-111525-009",
      date: "November 15, 2025",
      time: "12:45:00pm",
      rfid: 445566778,
      status: "Pending",
      amount: 60.0,
      referenceNumber: "6034658235345",
    },
    {
      id: 10,
      name: "Leo Garcia",
      method: "PayMaya",
      transactionId: "P-111525-010",
      date: "November 15, 2025",
      time: "12:48:33pm",
      rfid: 223344556,
      status: "Pending",
      amount: 45.0,
      referenceNumber: "6034658235346",
    },
    {
      id: 11,
      name: "Nina Villanueva",
      method: "Gcash",
      transactionId: "P-111525-011",
      date: "November 15, 2025",
      time: "12:51:22pm",
      rfid: 334455667,
      status: "Pending",
      amount: 80.0,
      referenceNumber: "6034658235347",
    },
  ];

  useEffect(() => {
    // if short query (<3 chars) we keep instant behavior and skip debounce
    if (searchQuery.trim().length < 3) {
      setDebouncedQuery(searchQuery);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const effectiveQuery =
    searchQuery.trim().length < 3
      ? searchQuery.trim().toLowerCase()
      : debouncedQuery.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    if (!effectiveQuery) return pendingRequestsItems;

    return pendingRequestsItems.filter((item) => {
      const q = effectiveQuery;
      return (
        item.name.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q) ||
        item.transactionId.toLowerCase().includes(q) ||
        item.referenceNumber.toLowerCase().includes(q) ||
        item.rfid.toString().startsWith(q) ||
        `${item.date} ${item.time}`.toLowerCase().includes(q)
      );
    });
  }, [pendingRequestsItems, effectiveQuery]);

  // Pagination

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage)
  );
  // Ensure currentPage in range when search cleared/filtered length changes
  useEffect(() => {
    if (searchQuery.trim().length > 0 || debouncedQuery.trim().length > 0) {
      // when searching we show ALL filtered results (no pagination)
      setCurrentPage(1);
    } else {
      // clamp current page to totalPages when not searching
      if (currentPage > totalPages) setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, debouncedQuery, totalPages]);

  const isSearching = effectiveQuery.length > 0;

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const itemsToDisplay = isSearching ? filteredItems : paginatedItems;

  const anyModalOpen = selectedRequest !== null || showRejectModal;
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [anyModalOpen]);

  const handleViewRequest = (requestItem) => {
    setSelectedRequest(requestItem);
    setShowRejectModal(false);
  };

  const handleReject = (item) => {
    setSelectedRequest(item);
    setShowRejectModal(true);
  };

  const closeAllModals = () => {
    setSelectedRequest(null);
    setShowRejectModal(false);
  };

  // JSX Helper (retained)
  const fieldClass =
    "px-3 sm:px-4 py-3 w-full border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150 pe-20 sm:pe-21";

  const EmptyState = () => (
    <div className="flex flex-col gap-2 items-center justify-center p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-100 lg:bg-gray-50 w-full">
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center justify-center p-4 rounded-full bg-gray-300 text-gray-600">
          <PackageOpen className="size-7 sm:size-8" />
        </div>
      </div>
      <div className="flex flex-col text-center pb-2">
        <span className="text-base sm:text-lg font-semibold">
          No Available Data
        </span>
        <span className="text-gray-500">There is no available data</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-1  gap-4">
      {/* Total Pending Request Card (unchanged) */}
      <div className="flex relative rounded-2xl bg-linear-to-r from-yellow-400 via-yellow-300 to-yellow-400 p-5">
        <div className="flex flex-1 flex-col gap-2 ">
          <span className="text-2xl sm:text-3xl font-bold">
            {pendingRequestsItems.length}
          </span>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base text-gray-800 font-medium">
              Total Pending Requests
            </span>
            <span className="text-xs text-gray-600 ">
              As of November 15, 2025
            </span>
          </div>
        </div>
        <div className="absolute top-3 right-3 rounded-full p-3 bg-yellow-500 shadow-yellow-500">
          <BanknoteArrowUp className="size-6 sm:size-7" />
        </div>
      </div>

      {/* content (unchanged) */}
      <div className="flex flex-col gap-4">
        {/* search bar (unchanged) */}
        <form action="" className="flex ">
          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor=""
              className="text-xs sm:text-sm font-semibold text-gray-500"
            >
              Search users
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search by Name or RFID No."
                className={fieldClass}
              />
              {searchQuery.length > 0 && (
                <button type="button" onClick={() => setSearchQuery("")} className="absolute px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-100/90 active:bg-gray-200 cursor-pointer transition-colors duration-150 top-2 right-2 text-xs">
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-2">
          <span className="text-xs sm:text-sm font-semibold text-gray-500">
            Pending requests
          </span>

          {/* items (mobile) */}
          <div className="flex xl:hidden flex-col gap-3">
            {itemsToDisplay.length === 0 && <EmptyState />}
            {itemsToDisplay.map((item) => (
              <button
                key={item.id}
                onClick={() => handleViewRequest(item)} // 3. Call handler on click
                className="p-5 cursor-pointer rounded-2xl border border-gray-300 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
              >
                {/* name, rfid, status */}
                <div className="flex flex-1 text-left flex-col gap-3">
                  {/* name and rfid details */}
                  <div className="flex flex-col">
                    {/* name */}
                    <span className="font-semibold">{item.name}</span>
                    {/* rfid */}
                    <span className="text-xs sm:text-sm text-gray-500">
                      RFID No: {item.rfid}
                    </span>
                  </div>
                  {/* status */}
                  <div className="flex items-center">
                    <div className="flex items-center px-4 py-1 rounded-full text-xs text-white bg-yellow-400">
                      <span>{item.status}</span>
                    </div>
                  </div>

                  {/* <span className="text-yellow-400 animate-pulse">
                    {item.status}
                  </span> */}
                </div>
                {/* amount top-up */}
                <div className="flex items-center justif-center">
                  <div className="flex items-center gap-1 text-green-500">
                    <Plus className="size-5 sm:size-6" />
                    <span className="text-xl sm:text-2xl font-semibold">
                      {item.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* items (table) */}
          <div className="hidden xl:flex rounded-2xl overflow-hidden border border-gray-300 w-full">
            {itemsToDisplay.length === 0 ? (
              <EmptyState />
            ) : (
              <table className="w-full text-sm text-left rtl:text-right text-body">
                <thead className="border-b border-gray-300 bg-gray-100 ">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      RFID No.
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itemsToDisplay.map((item) => (
                    <tr key={item.id} className="border-b border-gray-300">
                      <td scope="row" className="px-6 py-4">
                        {item.name}
                      </td>
                      <td className="px-6 py-4">{item.rfid}</td>
                      <td className="px-6 py-4 flex">
                        <div className="text-xs px-4 py-1 rounded-full text-white bg-yellow-400">
                          {item.status}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-500">
                          P{item.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewRequest(item)}
                            className="rounded-lg px-4 py-1 bg-green-500 text-white text-xs cursor-pointer transition-colors duration-150 hover:bg-green-500/90 active:bg-green-600"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleReject(item)}
                            className="rounded-lg px-4 py-1 bg-red-500 text-white text-xs cursor-pointer transition-colors duration-150 hover:bg-red-500/90 active:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* pagination */}
          {!isSearching && (
            <div className="flex items-center justify-center lg:justify-end">
              <div className="inline-flex text-xs">
                <button
                  onClick={() =>
                    currentPage > 1 && setCurrentPage(currentPage - 1)
                  }
                  className="rounded-tl-2xl rounded-bl-2xl border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  disabled={currentPage <= 1}
                  aria-label="Previous Page"
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
                  aria-label="Next Page"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* pending request modal (Conditionally Rendered) */}
      {selectedRequest && !showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-start lg:items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-lg flex flex-col gap-6 mt-2 mb-2">
            {/* close button */}
            <button
              onClick={closeAllModals}
              className="p-2 cursor-pointer rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 text-gray-500 absolute top-2 sm:top-3 right-2 sm:right-3"
            >
              <X className="size-4 sm:size-5" />
            </button>
            {/* header */}
            <div className="flex flex-col gap-4 items-center justify-center py-2">
              <div className="rounded-full p-3 bg-yellow-400 shadow-yellow-500">
                <BanknoteArrowUp className="size-6 sm:size-7" />
              </div>

              <div className="flex flex-col text-center">
                <span className="text-base sm:text-lg font-semibold text-yellow-500">
                  Pending Request
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  {selectedRequest.date} {selectedRequest.time}
                </span>
              </div>
            </div>

            {/* name + amount */}
            <div className="flex py-2 items-center">
              <div className="flex flex-1 flex-col">
                <span className="font-semibold">{selectedRequest.name}</span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  RFID No. {selectedRequest.rfid}
                </span>
              </div>

              <div className="flex items-center gap-1 text-green-500">
                <Plus className="size-5 sm:size-6" />
                <span className="text-xl sm:text-2xl font-semibold">
                  {selectedRequest.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* transaction details */}
            <div className="flex flex-col gap-3">
              <span className="text-xs sm:text-sm font-semibold text-gray-500">
                Transaction Details
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1 flex flex-col p-3 rounded-lg border border-gray-300">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Transaction ID
                  </span>
                  <span className="font-semibold text-sm sm:text-base">
                    {selectedRequest.transactionId}
                  </span>
                </div>

                <div className="col-span-1 flex flex-col p-3 rounded-lg border border-gray-300">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Payment Method
                  </span>
                  <span className="font-semibold text-sm sm:text-base">
                    {selectedRequest.method}
                  </span>
                </div>

                <div className="col-span-2 flex flex-col p-3 rounded-lg border border-gray-300">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Reference Number
                  </span>
                  <span className="font-semibold text-sm sm:text-base">
                    {selectedRequest.referenceNumber}
                  </span>
                </div>

                <div className="col-span-2 flex flex-col rounded-lg mb-2 gap-2">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Proof of payment
                  </span>
                  <div className="border border-dashed border-gray-300 bg-gray-100 rounded-lg h-64 sm:h-72"></div>
                </div>
              </div>

              {/* buttons */}
              <div className="flex gap-2 items-center w-full">
                <button
                  onClick={() => handleReject(selectedRequest)}
                  className="rounded-lg w-full cursor-pointer px-4 py-2 border border-red-500 bg-red-500 text-white hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150"
                >
                  Reject
                </button>

                <button className="rounded-lg w-full cursor-pointer px-4 py-2 border border-green-500 bg-green-500 text-white hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150">
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="rounded-2xl bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-6 mt-2 mb-2">
            {/* content */}
            <div className="flex flex-col items-center justify-center gap-4 pt-2 ">
              <div className="rounded-full p-3 bg-red-500 shadow-red-600 text-white">
                <Trash2 className="size-6 sm:size-7" />
              </div>
              <div className="flex flex-col text-center gap-1">
                <span className="text-base sm:text-lg font-semibold text-red-500">
                  Reject Request
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  Are you sure you want to reject this pending request?
                </span>
              </div>
            </div>

            {/* buttons */}
            <div className="flex gap-2 items-center w-full">
              <button
                onClick={closeAllModals}
                className="rounded-lg w-full cursor-pointer px-4 py-2 border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
              >
                Cancel
              </button>

              <button className="rounded-lg w-full cursor-pointer px-4 py-2 border border-red-500 bg-red-500 text-white hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
