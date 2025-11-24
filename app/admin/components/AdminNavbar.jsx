"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, signOut } from "../../../firebase";

import {
  Archive,
  CircleUserRound,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UsersRound,
  X,
  ChevronLeft,
  ChevronRight,
  Radio,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Initialize collapsed state from localStorage with lazy initialization
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Only access localStorage on client-side
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("adminSidebarCollapsed");
      if (savedState !== null) {
        try {
          return JSON.parse(savedState);
        } catch (e) {
          return false;
        }
      }
    }
    return false;
  });

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminSidebarCollapsed", JSON.stringify(isCollapsed));
    }
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

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
    {
      id: 4,
      name: "Package Transactions",
      icon: Archive,
      href: "/admin/transactions",
    },
    {
      id: 5,
      name: "Scan NFC",
      icon: Radio,
      href: "/admin/scan-nfc",
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
      name: "Configuration",
      icon: Settings,
      href: "/admin/configuration",
    },
  ];

  const handleOpenSidebar = () => {
    setToggleSidebar(true);
  };

  const handleCloseSidebar = () => {
    setToggleSidebar(false);
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  };


  return (
    <>
      {/* navbar */}
      <div
        className={`bg-gray-900 px-3 py-4 sm:p-4 md:p-5 flex lg:flex-col items-center justify-between lg:justify-start lg:gap-6 text-white transition-all duration-300 relative lg:sticky lg:top-0 lg:h-screen lg:z-40 lg:flex-shrink-0 ${
          isCollapsed ? "lg:w-20 xl:w-20" : "lg:w-72 xl:w-96"
        }`}
      >
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
          <div className={`hidden xl:flex items-center gap-2 transition-all duration-300 ${
            isCollapsed ? "justify-center w-full" : ""
          }`}>
            <Image
              src="/favicon.ico"
              alt="EZ-Vendo Logo"
              width={50}
              height={50}
              className=""
            />
            {!isCollapsed && (
              <span className="font-bold text-2xl whitespace-nowrap">
                <span className="text-green-500">EZ</span>-Vendo
              </span>
            )}
          </div>

        </div>

        {/* Collapse Toggle Button - Desktop Only */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -right-3 z-50 bg-gray-800 hover:bg-gray-700 text-white p-2.5 rounded-full border-2 border-gray-900 transition-colors duration-150 cursor-pointer shadow-lg"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="size-5 sm:size-6" />
          ) : (
            <ChevronLeft className="size-5 sm:size-6" />
          )}
        </button>

        {/* right (nav items) */}
        <div className={`hidden lg:flex flex-col w-full gap-5 transition-all duration-300 ${
          isCollapsed ? "items-center" : ""
        }`}>
          {/* menus */}
          <div className="flex flex-col w-full gap-2">
            {/* suptitle */}
            {!isCollapsed && (
              <span className="font-medium text-gray-500 px-4">Menus</span>
            )}
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
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors duration-150 cursor-pointer text-base sm:text-lg ${linkClasses} ${
                      isCollapsed ? "justify-center" : ""
                    }`}
                    title={isCollapsed ? name : undefined}
                  >
                    <Icon className="size-5 sm:size-6 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="whitespace-nowrap">{name}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          {/* settings */}
          <div className="flex flex-col w-full gap-2">
            {/* suptitle */}
            {!isCollapsed && (
              <span className="font-medium text-gray-500 px-4">Settings</span>
            )}
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
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors duration-150 cursor-pointer text-base sm:text-lg ${linkClasses} ${
                      isCollapsed ? "justify-center" : ""
                    }`}
                    title={isCollapsed ? name : undefined}
                  >
                    <Icon className="size-5 sm:size-6 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="whitespace-nowrap">{name}</span>
                    )}
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-red-500 hover:bg-gray-800 active:bg-gray-800/90 transition-colors duration-150 cursor-pointer text-base sm:text-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                  isCollapsed ? "justify-center" : ""
                }`}
                title={isCollapsed ? "Sign out" : undefined}
              >
                <LogOut className="size-5 sm:size-6 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="whitespace-nowrap">
                    {isSigningOut ? "Signing out..." : "Sign out"}
                  </span>
                )}
              </button>
            </div>
          </div>
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
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-red-500 hover:bg-gray-800 active:bg-gray-800/90 transition-colors duration-150 cursor-pointer text-base sm:text-lg disabled:opacity-60 disabled:cursor-not-allowed w-full"
                >
                  <LogOut className="size-5 sm:size-6" />
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
