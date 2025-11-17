"use client";

import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import AdminNavbar from "../components/AdminNavbar";
import TopUpRequests from "./components/TopUpRequests";
import ManualTopUp from "./components/ManualTopUp";

import { useState } from "react";

export default function AdminTopUp() {
  // Instead of storing a component function, store a string
  const [activeTab, setActiveTab] = useState("requests");

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
            <div className="relative w-full">
              <button
                onClick={() => setActiveTab("requests")}
                className={getButtonClass("requests")}
              >
                Top-up Requests
              </button>
              <div className="flex size-2.5 rounded-full absolute -right-0.5 -top-0.5 bg-red-500"></div>
            </div>

            <button
              onClick={() => setActiveTab("manual")}
              className={getButtonClass("manual")}
            >
              Manual Top-up
            </button>
          </div>

          {/* SAFE COMPONENT RENDERING */}
          {activeTab === "requests" && <TopUpRequests />}
          {activeTab === "manual" && <ManualTopUp />}
        </div>
      </div>
    </div>
  );
}
