"use client";

import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import AdminNavbar from "../components/AdminNavbar";
import TopUpRequests from "./components/TopUpRequests";
import ManualTopUp from "./components/ManualTopUp";
import TopupTransactions from "./components/TopupTransactions";

import { useState } from "react";

export default function AdminTopUp() {
  // Instead of storing a component function, store a string
  const [activeTab, setActiveTab] = useState("requests");

  const getButtonClass = (tab) => {
    const baseClasses =
      "rounded-lg cursor-pointer px-4 py-3 transition-colors duration-150";
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
          {/* Tabs Container - Horizontal scroll on mobile, vertical on desktop */}
          <div className="flex xl:flex-col xl:w-72 gap-2 overflow-x-auto xl:overflow-x-visible scrollbar-hide xl:scrollbar-default scroll-smooth">
            <div className="flex xl:flex-col items-center gap-2 min-w-max xl:min-w-0">
              <button
                onClick={() => setActiveTab("requests")}
                className={`${getButtonClass("requests")} flex-shrink-0 xl:w-full`}
              >
                Top-up Requests
              </button>

              <button
                onClick={() => setActiveTab("manual")}
                className={`${getButtonClass("manual")} flex-shrink-0 xl:w-full`}
              >
                Manual Top-up
              </button>
              
              <button
                onClick={() => setActiveTab("transactions")}
                className={`${getButtonClass("transactions")} flex-shrink-0 xl:w-full`}
              >
                Topup Transactions
              </button>
            </div>
          </div>

          {/* SAFE COMPONENT RENDERING */}
          {activeTab === "requests" && <TopUpRequests />}
          {activeTab === "manual" && <ManualTopUp />}
          {activeTab === "transactions" && <TopupTransactions />}
        </div>
      </div>
    </div>
  );
}
