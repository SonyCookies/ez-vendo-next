"use client";

import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import AdminNavbar from "../components/AdminNavbar";
import AllTransactions from "./components/AllTransactions";
import { useState } from "react";

export default function AdminTransactionLogs() {
  const [activePackage, setActivePackage] = useState("all");

  const getButtonClass = (packageType) => {
    const baseClasses =
      "rounded-lg cursor-pointer px-4 py-3 transition-colors duration-150";
    const isActive = activePackage === packageType;

    return isActive
      ? `${baseClasses} border border-green-500 bg-green-500 text-white`
      : `${baseClasses} border border-gray-300 text-gray-800 hover:bg-gray-100`;
  };

  return (
    <div className="h-dvh flex flex-col lg:flex-row text-sm sm:text-base relative overflow-hidden">
      <AdminNavbar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <AdminDesktopNavbar />

        <div className="flex flex-col xl:flex-row px-3 py-4 sm:p-4 md:p-5 gap-4 xl:gap-5">
          {/* Tabs Container - Horizontal scroll on mobile, vertical on desktop */}
          <div className="flex xl:flex-col xl:w-72 gap-2 overflow-x-auto xl:overflow-x-visible scrollbar-hide xl:scrollbar-default scroll-smooth">
            <div className="flex xl:flex-col items-center gap-2 min-w-max xl:min-w-0">
              <button
                onClick={() => setActivePackage("all")}
                className={`${getButtonClass("all")} flex-shrink-0 xl:w-full`}
              >
                All Transactions
              </button>

              <button
                onClick={() => setActivePackage("Package 1")}
                className={`${getButtonClass("Package 1")} flex-shrink-0 xl:w-full`}
              >
                Package 1
              </button>

              <button
                onClick={() => setActivePackage("Package 2")}
                className={`${getButtonClass("Package 2")} flex-shrink-0 xl:w-full`}
              >
                Package 2
              </button>

              <button
                onClick={() => setActivePackage("Package 3")}
                className={`${getButtonClass("Package 3")} flex-shrink-0 xl:w-full`}
              >
                Package 3
              </button>

              <button
                onClick={() => setActivePackage("Package 4")}
                className={`${getButtonClass("Package 4")} flex-shrink-0 xl:w-full`}
              >
                Package 4
              </button>

              {/* Refund Tab - COMMENTED OUT */}
              {/* <button
                onClick={() => setActivePackage("refund")}
                className={`${getButtonClass("refund")} flex-shrink-0 xl:w-full`}
              >
                Refund
              </button> */}
            </div>
          </div>

          <AllTransactions packageFilter={activePackage} />
        </div>
      </div>
    </div>
  );
}
