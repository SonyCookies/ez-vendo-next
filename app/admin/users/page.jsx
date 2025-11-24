"use client";

import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import AdminNavbar from "../components/AdminNavbar";
import RegisteredUsers from "./components/RegisteredUsers";
import UnregisteredUsers from "./components/UnregisteredUsers";
import RegisterUser from "./components/RegisterUser";

import { useState } from "react";

export default function AdminUsers() {
  // Instead of storing a component function, store a string
  const [activeTab, setActiveTab] = useState("registered");

  const getButtonClass = (tab) => {
    const baseClasses =
      "rounded-lg w-full cursor-pointer px-4 py-3 transition-colors duration-150";
    const isActive = activeTab === tab;

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
          <div className="flex xl:flex-col xl:w-72 items-center gap-2">
            <button
              onClick={() => setActiveTab("registered")}
              className={getButtonClass("registered")}
            >
              Registered Users
            </button>

            <button
              onClick={() => setActiveTab("unregistered")}
              className={getButtonClass("unregistered")}
            >
              Unregistered Users
            </button>

            <button
              onClick={() => setActiveTab("register")}
              className={getButtonClass("register")}
            >
              Register User
            </button>
          </div>

          {/* SAFE COMPONENT RENDERING */}
          {activeTab === "registered" && <RegisteredUsers />}
          {activeTab === "unregistered" && <UnregisteredUsers />}
          {activeTab === "register" && <RegisterUser />}
        </div>
      </div>
    </div>
  );
}
