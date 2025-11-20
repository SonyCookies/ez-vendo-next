"use client";

import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import AdminNavbar from "../components/AdminNavbar";
import AllTransactions from "./components/AllTransactions";
import CompletedTransactions from "./components/CompleteTransaction";
import RejectedTransactions from "./components/RejectedTransactions";

import { useState } from "react";

export default function AdminTransactionLogs() {
  // Instead of storing a component function, store a string
  const [activeTab, setActiveTab] = useState("all");

  const getButtonClass = (tab) => {
    const baseClasses =
      "rounded-lg w-full cursor-pointer px-4 py-3 transition-colors duration-150";
    const isActive = activeTab === tab;

    return isActive
      ? `${baseClasses} border border-green-500 bg-green-500 text-white`
      : `${baseClasses} border border-gray-300 text-gray-800 hover:bg-gray-100`;
  };

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row text-sm sm:text-base relative">
      <AdminNavbar />
      <div className="flex flex-1 flex-col">
        <AdminDesktopNavbar />

        <div className="flex flex-col xl:flex-row px-3 py-4 sm:p-4 md:p-5 gap-4 xl:gap-5">
          <div className="flex xl:flex-col xl:w-72 items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={getButtonClass("all")}
            >
              All <span className="hidden md:inline-flex">Transactions</span>
            </button>

            <button
              onClick={() => setActiveTab("complete")}
              className={getButtonClass("complete")}
            >
              Complete <span className="hidden md:inline-flex">Transactions</span>
            </button>
            <button
              onClick={() => setActiveTab("reject")}
              className={getButtonClass("reject")}
            >
              Reject <span className="hidden md:inline-flex">Transactions</span>
            </button>
          </div>

          {/* SAFE COMPONENT RENDERING */}
          {activeTab === "all" && <AllTransactions />}
          {activeTab === "complete" && <CompletedTransactions />}
          {activeTab === "reject" && <RejectedTransactions />}
        </div>
      </div>
    </div>
  );
}
