"use client";
import { useState } from "react";

import {
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorCog,
  X,
} from "lucide-react";

export default function AdminLogin() {
  // TOGGLE SIDEBAR
  const [toggleSidebar, setToggleSidebar] = useState(false);

  const handleToggleSidebar = () => {
    setToggleSidebar(true);
  };
  const closeToggleSidebar = () => {
    setToggleSidebar(false);
  };

  // input fields className
  const fieldClass =
    "px-3 sm:px-4 py-2 border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150";

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-gray-50">
      {/* side nav */}
      <div className="flex flex-col w-full lg:w-xs xl:w-xl xl:items-end bg-white ">
        <div className="flex lg:flex-col items-center  justify-between w-full xl:w-sm p-4 sm:p-5 lg:gap-3">
          {/* logo */}
          <div className="flex items-center gap-3 lg:w-full lg:flex-col lg:p-5 lg:rounded-2xl">
            <button
              onClick={handleToggleSidebar}
              className="flex md:hidden p-2 rounded-lg cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
            >
              <Menu className="size-5" />
            </button>

            <span className="text-base sm:text-lg flex lg:hidden">Logo</span>

            {/* logo and text for large screens */}
            <div className="hidden lg:flex flex-col gap-4 items-center">
              {/* logo */}
              <div className="flex size-32 bg-green-500"></div>
              {/* text */}
              <div className="flex flex-col text-center">
                <span className="text-xl font-semibold text-green-500">
                  EZ-Vendo
                </span>
                <span className="text-sm text-gray-500">Secure & Convinient</span>
              </div>
            </div>
          </div>
          {/* buttons */}
          <div className="hidden md:flex lg:flex-col items-center justify-between lg:w-full px-5">
            <button className="lg:flex lg:gap-2 lg:items-center  px-4 py-2 rounded-lg bg-green-500 hover:bg-green-500/90 active:bg-green-600 text-white transition-colors duration-150 cursor-pointer lg:w-full lg:text-base">
              <LayoutDashboard className="size-5 hidden lg:flex" />
              Dashboard
            </button>
            <button className="lg:flex lg:gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 cursor-pointer lg:w-full lg:text-base">
              <HandCoins className="size-5 hidden lg:flex" />
              Top-up
            </button>
            <button className="lg:flex lg:gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 cursor-pointer lg:w-full lg:text-base">
              <MonitorCog className="size-5 hidden lg:flex" />
              Settings
            </button>
            <button className="lg:flex lg:gap-2 px-4 py-2 rounded-lg hover:bg-red-500/90 active:bg-red-600 text-red-500 hover:text-white transition-colors duration-150 cursor-pointer lg:w-full lg:text-base">
              <LogOut className="size-5 hidden lg:flex" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* main */}
      <div className="flex flex-1 p-4 lg:p-5 bg-white">
        <div className="md:bg-gray-100 rounded-2xl w-full  md:p-5 ">Data Here</div>
      </div>

      {/* TOGGLE SIDEBAR */}
      {toggleSidebar && (
        <div className="min-h-dvh bg-black/25  absolute top-0 left-0 w-full">
          <div className="relative bg-white w-72 h-dvh p-4 sm:p-5 flex flex-col gap-4 ">
            {/* close button */}
            <button
              onClick={closeToggleSidebar}
              className="absolute top-2 right-2 flex md:hidden p-2 rounded-lg cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
            >
              <X className="size-5" />
            </button>

            {/* logo */}
            <div className="flex items-center gap-2">
              <div className="flex size-16 bg-green-500"></div>
              <div className="flex flex-col">
                <span className="text-base font-semibold">EZ-Vendo</span>
                <span className="text-xs text-gray-500">
                  Secure & Convinient
                </span>
              </div>
            </div>
            {/* menus */}
            <div className="flex flex-col justify-between h-full">
              <div className="flex flex-col">
                <button className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500 hover:bg-green-500/90 active:bg-green-600 text-white transition-colors duration-150 cursor-pointer">
                  <LayoutDashboard className="size-5" />
                  Dashboard
                </button>
                <button className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 cursor-pointer">
                  <HandCoins className="size-5" />
                  Top-up
                </button>
                <button className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 cursor-pointer">
                  <MonitorCog className="size-5" />
                  Settings
                </button>
              </div>

              {/* signout */}
              <button className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-100 hover:bg-red-500 active:bg-red-600 text-red-500 hover:text-white transition-colors duration-150 cursor-pointer">
                <LogOut className="size-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
