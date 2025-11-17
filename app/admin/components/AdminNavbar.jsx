"use client";

import { useState } from "react";

import {
  Banknote,
  BanknoteArrowUp,
  BanknoteX,
  Bell,
  CircleCheck,
  CircleUserRound,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminNavbar() {
  const pathname = usePathname();

  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [toggleNotification, setToggleNotification] = useState(false);

  const notificationData = [
    {
      id: 1,
      icon: BanknoteArrowUp,
      bgColor: "bg-yellow-500",
      name: "Pending Request",
      dateTime: "11/14/2025 6:30pm",
      message:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo beatae at aliquid corporis nihil fuga iusto maiores debitis, magnam labore tempora impedit veniam, necessitatibus deserunt adipisci nulla, quis dolorum obcaecati?",
    },
    {
      id: 2,
      icon: Banknote,
      bgColor: "bg-green-500",
      name: "Top-up Successful",
      dateTime: "11/15/2025 7:30pm",
      message:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo beatae at aliquid corporis nihil fuga iusto maiores debitis, magnam labore tempora impedit veniam, necessitatibus deserunt adipisci nulla, quis dolorum obcaecati?",
    },
    {
      id: 3,
      icon: BanknoteX,
      bgColor: "bg-red-500",
      name: "Top-up Unsuccessful",
      dateTime: "11/16/2025 8:30pm",
      message:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo beatae at aliquid corporis nihil fuga iusto maiores debitis, magnam labore tempora impedit veniam, necessitatibus deserunt adipisci nulla, quis dolorum obcaecati?",
    },
    {
      id: 4,
      icon: Settings,
      bgColor: "bg-gray-500",
      name: "System Configured",
      dateTime: "11/17/2025 9:30pm",
      message:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo beatae at aliquid corporis nihil fuga iusto maiores debitis, magnam labore tempora impedit veniam, necessitatibus deserunt adipisci nulla, quis dolorum obcaecati?",
    },
  ];

  const menuItems = [
    {
      id: 1,
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
    },
    {
      id: 2,
      name: "Top-up Management",
      icon: HandCoins,
      href: "/admin/top-up",
    },
    {
      id: 3,
      name: "List of Users",
      icon: UsersRound,
      href: "/admin/users",
    },
  ];
  const settingsItems = [
    {
      id: 1,
      name: "Admin Profile",
      icon: CircleUserRound,
      href: "/admin/profile",
    },
    {
      id: 2,
      name: "System Settings",
      icon: Settings,
      href: "/admin/settings",
    },
  ];

  const handleOpenSidebar = () => {
    setToggleSidebar(true);
  };

  const handleCloseSidebar = () => {
    setToggleSidebar(false);
  };

  const handleToggleNotification = () => {
    setToggleNotification((prev) => !prev);
  };

  return (
    <>
      {/* navbar */}
      <div className=" bg-gray-900 px-3 py-4 sm:p-4 md:p-5 flex lg:flex-col items-center justify-between lg:justify-start lg:gap-6  text-white lg:w-72 xl:w-96">
        {/* left (logo) */}
        <div className="flex items-center  gap-2 lg:w-full">
          {/* open sidebar */}
          <button
            onClick={handleOpenSidebar}
            className="block lg:hidden p-2 rounded-lg hover:bg-gray-800 active:bg-gray-800/90 transition-colors duration-150 cursor-pointer"
          >
            <Menu className="size-5 sm:size-6" />
          </button>
          {/* phone */}
          <div className="flex md:hidden items-center gap-2">
            <Image
              src="/favicon.ico"
              alt="EZ-Vendo Logo"
              width={35}
              height={35}
              className=""
            />
            <span className="font-bold text-lg">
              <span className="text-green-500">EZ</span>-Vendo
            </span>
          </div>
          {/* tablet */}
          <div className="hidden md:flex lg:hidden items-center gap-2  ">
            <Image
              src="/favicon.ico"
              alt="EZ-Vendo Logo"
              width={40}
              height={40}
              className=""
            />
            <span className="font-bold text-xl">
              <span className="text-green-500">EZ</span>-Vendo
            </span>
          </div>
          {/* laptop */}
          <div className="hidden lg:flex xl:hidden items-center gap-2">
            <Image
              src="/favicon.ico"
              alt="EZ-Vendo Logo"
              width={50}
              height={50}
              className=""
            />
            <span className="font-bold text-2xl">
              <span className="text-green-500">EZ</span>-Vendo
            </span>
          </div>
          {/* desktop */}
          <div className="hidden xl:flex items-center gap-2">
            <Image
              src="/favicon.ico"
              alt="EZ-Vendo Logo"
              width={50}
              height={50}
              className=""
            />
            <span className="font-bold text-2xl">
              <span className="text-green-500">EZ</span>-Vendo
            </span>
          </div>

          {/* notification button */}
        </div>

        {/* right (nav items) */}
        <div className="hidden lg:flex flex-col w-full gap-5 ">
          {/* menus */}
          <div className="flex flex-col w-full gap-2">
            {/* suptitle */}
            <span className="font-medium text-gray-500">Menus</span>
            {/* items */}
            <div className="flex flex-col w-full">
              {menuItems.map(({ id, name, icon: Icon, href }) => {
                const isActive = pathname === href;

                const active =
                  "bg-green-500 text-white hover:bg-green-500/80 active:bg-green-600";
                const inactive =
                  "text-gray-300 hover:bg-gray-800 active:bg-gray-800/90";

                const linkClasses = isActive ? active : inactive;

                return (
                  <Link
                    key={id}
                    href={href}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors duration-150 cursor-pointer text-base sm:text-lg ${linkClasses}`}
                  >
                    <Icon className="size-5 sm:size-6" />
                    {name}
                  </Link>
                );
              })}
            </div>
          </div>
          {/* settings */}
          <div className="flex flex-col w-full gap-2">
            {/* suptitle */}
            <span className="font-medium text-gray-500">Settings</span>
            {/* items */}
            <div className="flex flex-col w-full">
              {settingsItems.map(({ id, name, icon: Icon, href }) => {
                const isActive = pathname === href;

                const active =
                  "bg-green-500 text-white hover:bg-green-500/80 active:bg-green-600";
                const inactive =
                  "text-gray-300 hover:bg-gray-800 active:bg-gray-800/90";

                const linkClasses = isActive ? active : inactive;

                return (
                  <Link
                    key={id}
                    href={href}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors duration-150 cursor-pointer text-base sm:text-lg ${linkClasses}`}
                  >
                    <Icon className="size-5 sm:size-6" />
                    {name}
                  </Link>
                );
              })}
              <Link
                href="/admin/login"
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-red-500 hover:bg-gray-800 active:bg-gray-800/90 transition-colors duration-150 cursor-pointer text-base sm:text-lg"
              >
                <LogOut className="size-5 sm:size-6" />
                Sign out
              </Link>
            </div>
          </div>
        </div>

        {/* notification */}
        <div className="relative block lg:hidden">
          <button
            onClick={handleToggleNotification}
            className="p-2 text-white  rounded-full hover:bg-gray-800 active:bg-gray-800/90 transition-colors duration-150 cursor-pointer"
          >
            {toggleNotification ? (
              <X className="size-5 sm:size-6" />
            ) : (
              <Bell className="size-5 sm:size-6" />
            )}
          </button>

          {toggleNotification && (
            <div className="absolute overflow-hidden text-black right-0 top-11 w-80 sm:w-96 bg-white border border-gray-300 rounded-2xl z-10">
              {/* top */}
              <div className="flex items-center justify-between p-4 border-b border-gray-300">
                {/* left */}
                <div className="flex flex-1">
                  <span className="text-base font-semibold">Notifications</span>
                </div>
                {/* right */}
                <div className="flex items-center justify-center">
                  <div className="flex rounded-full text-center size-6 items-center justify-center bg-red-500 text-white text-sm">
                    {notificationData.length}
                  </div>
                </div>
              </div>
              {/* middle */}
              <div className="flex flex-col max-h-96 overflow-y-auto">
                {notificationData.map(
                  ({ id, icon: Icon, bgColor, name, dateTime, message }) => (
                    <div key={id} className="flex p-4 border-b border-gray-300">
                      {/* content */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          {/* icon */}
                          <div
                            className={`${bgColor} rounded-full p-2 flex items-center justify-center`}
                          >
                            <Icon className="size-5 sm:size-6 text-white" />
                          </div>
                          {/* title */}
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm sm:text-base">
                              {name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {dateTime}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs sm:text-sm text-justify text-gray-500 line-clamp-2 ">
                          {message}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
              {/* bottom */}
              <div className="flex items-center justify-center py-4 border-t border-gray-300">
                <button className="text-gray-500 hover:text-gray-500/90 active:text-gray-600 transition-colors duration-150">
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* sidebar (smooth transition) */}
      <div
        className={`fixed inset-0 bg-black/60 transition-opacity duration-300 z-50 ${
          toggleSidebar
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`relative text-white w-72 sm:w-80 bg-gray-900 p-4 md:p-5 flex min-h-dvh flex-col gap-6 transform transition-transform duration-300 ${
            toggleSidebar ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* close button */}
          <button
            onClick={handleCloseSidebar}
            className="absolute top-2 right-2 p-2 rounded-lg hover:bg-gray-800"
          >
            <X className="size-5 sm:size-6" />
          </button>

          {/* top (logo) */}
          <div className="flex w-full ">
            <div className="flex sm:hidden relative items-center gap-2 text-white">
              <Image
                src="/favicon.ico"
                alt="EZ-Vendo Logo"
                width={40}
                height={40}
                className=""
              />
              <span className="font-bold text-xl">
                <span className="text-green-500">EZ</span>-Vendo
              </span>
            </div>
            <div className="hidden sm:flex relative items-center gap-2 text-white">
              <Image
                src="/favicon.ico"
                alt="EZ-Vendo Logo"
                width={50}
                height={50}
                className=""
              />
              <span className="font-bold text-2xl">
                <span className="text-green-500">EZ</span>-Vendo
              </span>
            </div>
          </div>

          {/* nav items */}
          <div className="flex flex-col w-full gap-5">
            {/* menus */}
            <div className="flex flex-col w-full gap-2">
              {/* suptitle */}
              <span className="font-medium text-gray-500">Menus</span>
              {/* items */}
              <div className="flex flex-col w-full">
                {menuItems.map(({ id, name, icon: Icon, href }) => {
                  const isActive = pathname === href;

                  const active =
                    "bg-green-500 text-white hover:bg-green-500/80 active:bg-green-600";
                  const inactive =
                    "text-gray-300 hover:bg-gray-800 active:bg-gray-800/90";

                  const linkClasses = isActive ? active : inactive;

                  return (
                    <Link
                      key={id}
                      href={href}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors duration-150 cursor-pointer text-base sm:text-lg ${linkClasses}`}
                    >
                      <Icon className="size-5 sm:size-6" />
                      {name}
                    </Link>
                  );
                })}
              </div>
            </div>
            {/* settings */}
            <div className="flex flex-col w-full gap-2">
              {/* suptitle */}
              <span className="font-medium text-gray-500">Settings</span>
              {/* items */}
              <div className="flex flex-col w-full">
                {settingsItems.map(({ id, name, icon: Icon, href }) => {
                  const isActive = pathname === href;

                  const active =
                    "bg-green-500 text-white hover:bg-green-500/80 active:bg-green-600";
                  const inactive =
                    "text-gray-300 hover:bg-gray-800 active:bg-gray-800/90";

                  const linkClasses = isActive ? active : inactive;

                  return (
                    <Link
                      key={id}
                      href={href}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors duration-150 cursor-pointer text-base sm:text-lg ${linkClasses}`}
                    >
                      <Icon className="size-5 sm:size-6" />
                      {name}
                    </Link>
                  );
                })}
                <Link
                  href="/admin/login"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-red-500 hover:bg-gray-800 active:bg-gray-800/90 transition-colors duration-150 cursor-pointer text-base sm:text-lg"
                >
                  <LogOut className="size-5 sm:size-6" />
                  Sign out
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
