"use client";

import {
  BanknoteArrowUp,
  CircleAlert,
  CircleCheckBig,
  CirclePlus,
  Trash2,
} from "lucide-react";
import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import AdminNavbar from "../components/AdminNavbar";

import { use, useState } from "react";

export default function AdminBilling() {
  const [amount, setAmount] = useState("");
  const [minutes, setMinutes] = useState("");

  const [amountError, setAmountError] = useState("");
  const [minutesError, setMinutesError] = useState("");

  const [globalError, setGlobalError] = useState("");

  const [newBillModal, setNewBillModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const [modifyModal, setModifyModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const mockBillRates = [
    {
      id: 1,
      amount: 5.0,
      mins: "/2.5 minutes",
    },
    {
      id: 2,
      amount: 10.0,
      mins: "/5 minutes",
    },
    {
      id: 3,
      amount: 20.0,
      mins: "/10 minutes",
    },
  ];

  const handleBillModal = () => {
    setNewBillModal(false);
    setGlobalError("");
    setAmountError("");
    setMinutesError("");
  };

  const handleModifyClose = () => {
    setModifyModal(false);
    setGlobalError("");
    setAmountError("");
    setMinutesError("");
    setSelectedBill(null);
  };

  const handleModify = () => {
    if (!validate()) return;

    console.log("Updating bill rate:", {
      id: selectedBill.id,
      amount,
      minutes,
    });

    setModifyModal(false);
  };

  const validate = () => {
    let valid = true;
    setGlobalError("");
    setAmountError("");
    setMinutesError("");

    if (!amount.trim() || isNaN(amount) || Number(amount) <= 0) {
      setAmountError("Invalid amount");
      valid = false;
    }

    if (!minutes.trim() || isNaN(minutes) || Number(minutes) <= 0) {
      setMinutesError("Invalid minutes");
      valid = false;
    }

    if (!valid) {
      setGlobalError("Please fix the errors before submitting.");
    }

    return valid;
  };

  const handleAdd = () => {
    if (!validate()) return;

    // successful submit
    console.log("Submitting bill rate:", { amount, minutes });
    setNewBillModal(false);
  };

  const getButtonClass = (tab) => {
    const baseClasses =
      "rounded-lg w-full cursor-pointer px-4 py-3 transition-colors duration-150";
    const isActive = activeTab === tab;

    return isActive
      ? `${baseClasses} border border-green-500 bg-green-500 text-white`
      : `${baseClasses} border border-gray-300 text-gray-800 hover:bg-gray-100`;
  };

  const fieldClass = (err) =>
    `px-3 sm:px-4 py-2 w-full border ${
      err ? "border-red-500" : "border-gray-300"
    } outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150`;

  const labelClass = "text-xs sm:text-sm text-gray-500";

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row text-sm sm:text-base relative">
      <AdminNavbar />
      <div className="flex flex-1 flex-col">
        <AdminDesktopNavbar />

        <div className="flex flex-col items-center px-3 py-4 sm:p-4 md:p-5 gap-4 xl:gap-5 ">
          <div className="w-full max-w-2xl  flex flex-col gap-4 xl:gap-5">
            {/* add new billing rate */}
            <div className="flex flex-col gap-2">
              <div className="border border-dashed border-gray-300 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-4 sm:gap-5 bg-gray-50">
                <div className="flex items-center justify-center pt-2">
                  <div className="flex items-center justify-center p-4 bg-gray-200 rounded-full">
                    <CirclePlus className="size-7 sm:size-8" />
                  </div>
                </div>

                <div className="flex flex-col text-center">
                  <span className="text-base sm:text-lg font-semibold">
                    Billing Rate
                  </span>
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Add new billing rate to the system
                  </span>
                </div>

                <div className="flex items-center justify-center pb-2">
                  <button
                    onClick={() => setNewBillModal(true)}
                    className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-500/90 active:bg-green-600 cursor-pointer transition-colors duration-150"
                  >
                    Add bill rate
                  </button>
                </div>
              </div>
            </div>

            {/* current bill rate */}
            <div className="flex flex-col gap-1">
              <span className="text-gray-500 font-semibold text-xs sm:text-sm">
                Current bill rates
              </span>
              <div className="flex flex-col gap-2">
                {mockBillRates.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-gray-300"
                  >
                    {/* top */}
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold">
                        P{b.amount.toFixed(2)}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {b.mins}
                      </span>
                    </div>
                    {/* btns */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setSelectedBill(b);
                          setAmount(b.amount);
                          setMinutes(
                            b.mins.replace("/", "").replace(" minutes", "")
                          );
                          setModifyModal(true);
                        }}
                        className="px-4 py-1 rounded-lg text-xs cursor-pointer bg-green-500 hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150 text-white"
                      >
                        Modify
                      </button>

                      <button
                        onClick={() => setDeleteModal(true)}
                        className="px-4 py-1 rounded-lg text-xs cursor-pointer bg-red-500 hover:bg-red-500/90 active:bg-red-600 transition-colors duration-150 text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* add bill rate modal */}
          {newBillModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
              <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-4 sm:gap-5 mt-2 mb-2">
                <div className="flex flex-col items-center justify-center gap-4 py-2 ">
                  <div className="rounded-full p-3 bg-green-500 shadow-green-600 text-white">
                    <CirclePlus className="size-6 sm:size-7" />
                  </div>
                  <div className="flex flex-col text-center">
                    <span className="text-base sm:text-lg font-semibold text-green-500">
                      Add Bill Rate
                    </span>
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Enter new bill rate to the system
                    </span>
                  </div>
                </div>

                {globalError && (
                  <div className="flex items-center gap-2 border-l-4 border-red-500 bg-red-100 text-red-500 rounded-lg px-4 py-2 text-xs sm:text-sm">
                    <div className="flex">
                      <CircleAlert className="size-4 sm:size-5" />
                    </div>
                    <div className="flex flex-1">{globalError}</div>
                  </div>
                )}

                <form action="" className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Amount</label>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className={`px-3 sm:px-4 py-2 w-full rounded-lg border outline-none placeholder:text-gray-500 transition-colors duration-150
                        ${
                          amountError
                            ? "border-red-500"
                            : "border-gray-300 focus:border-green-500"
                        }
                      `}
                    />
                    {amountError && (
                      <span className="text-xs text-red-500">
                        {amountError}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Minutes</label>
                    <input
                      type="text"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      placeholder="Enter no. of minutes"
                      className={`px-3 sm:px-4 py-2 w-full rounded-lg border outline-none placeholder:text-gray-500 transition-colors duration-150
                        ${
                          minutesError
                            ? "border-red-500"
                            : "border-gray-300 focus:border-green-500"
                        }
                      `}
                    />
                    {minutesError && (
                      <span className="text-xs text-red-500">
                        {minutesError}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 py-2">
                    <button
                      type="button"
                      onClick={handleBillModal}
                      className="rounded-lg w-full px-4 py-2 text-red-500 cursor-pointer  border border-red-500 hover:bg-red-500/90 hover:text-white active:text-white hover:border-red-500/90 active:bg-red-600 active:border-red-600 transition-colors duration-150"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleAdd}
                      className="rounded-lg w-full px-4 py-2 text-white cursor-pointer bg-green-500 border border-green-500 hover:bg-green-500/90 hover:border-green-500/90 active:bg-green-600 active:border-green-600 transition-colors duration-150"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {modifyModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
              <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-4 sm:gap-5 mt-2 mb-2">
                {/* ICON + HEADER */}
                <div className="flex flex-col items-center justify-center gap-4 py-2 ">
                  <div className="rounded-full p-3 bg-green-500 shadow-green-600 text-white">
                    <CirclePlus className="size-6 sm:size-7" />
                  </div>
                  <div className="flex flex-col text-center">
                    <span className="text-base sm:text-lg font-semibold text-green-500">
                      Modify Bill Rate
                    </span>
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Modify the existing bill rate
                    </span>
                  </div>
                </div>

                {/* GLOBAL ERROR */}
                {globalError && (
                  <div className="flex items-center gap-2 border-l-4 border-red-500 bg-red-100 text-red-500 rounded-lg px-4 py-2 text-xs sm:text-sm">
                    <CircleAlert className="size-4 sm:size-5" />
                    <div className="flex-1">{globalError}</div>
                  </div>
                )}

                {/* FORM */}
                <form className="flex flex-col gap-3">
                  {/* AMOUNT */}
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Amount</label>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className={`px-3 sm:px-4 py-2 w-full rounded-lg border outline-none placeholder:text-gray-500 transition-colors duration-150
                        ${
                          amountError
                            ? "border-red-500"
                            : "border-gray-300 focus:border-green-500"
                        }
                      `}
                    />
                    {amountError && (
                      <span className="text-xs text-red-500">
                        {amountError}
                      </span>
                    )}
                  </div>

                  {/* MINUTES */}
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Minutes</label>
                    <input
                      type="text"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      placeholder="Enter no. of minutes"
                      className={`px-3 sm:px-4 py-2 w-full rounded-lg border outline-none placeholder:text-gray-500 transition-colors duration-150
                        ${
                          minutesError
                            ? "border-red-500"
                            : "border-gray-300 focus:border-green-500"
                        }
                      `}
                    />
                    {minutesError && (
                      <span className="text-xs text-red-500">
                        {minutesError}
                      </span>
                    )}
                  </div>

                  {/* BUTTONS */}
                  <div className="flex items-center gap-2 py-2">
                    <button
                      type="button"
                      onClick={handleModifyClose}
                      className="rounded-lg w-full px-4 py-2 text-red-500 cursor-pointer border border-red-500 hover:bg-red-500/90 hover:text-white active:text-white transition-colors duration-150"
                    >
                      Discard
                    </button>

                    <button
                      type="button"
                      onClick={handleModify}
                      className="rounded-lg w-full px-4 py-2 text-white cursor-pointer bg-green-500 border border-green-500 hover:bg-green-500/90 active:bg-green-600 transition-colors duration-150"
                    >
                      Modify
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* delete confirmation modal */}
          {deleteModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
              <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-4 sm:gap-5 mt-2 mb-2">
                <div className="flex flex-col items-center justify-center gap-4 py-2 ">
                  <div className="rounded-full p-3 bg-red-500 shadow-red-600 text-white">
                    <Trash2 className="size-6 sm:size-7" />
                  </div>
                  <div className="flex flex-col text-center">
                    <span className="text-base sm:text-lg font-semibold text-red-500">
                      Remove Bill Rate
                    </span>
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Are you sure you want to remove this current bill?
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pb-2">
                  <button
                    type="button"
                    className="rounded-lg w-full px-4 py-2 text-red-500 cursor-pointer  border border-red-500 hover:bg-red-500/90 hover:text-white active:text-white hover:border-red-500/90 active:bg-red-600 active:border-red-600 transition-colors duration-150"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteModal(false)}
                    className="rounded-lg w-full px-4 py-2 text-white cursor-pointer bg-green-500 border border-green-500 hover:bg-green-500/90 hover:border-green-500/90 active:bg-green-600 active:border-green-600 transition-colors duration-150"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
