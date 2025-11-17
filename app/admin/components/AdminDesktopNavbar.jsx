"use client";
import { usePathname } from "next/navigation";
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

const PATHTITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/top-up": "Top-up Management",
  "/admin/users": "List of Users",
  "/admin/profile": "Admin Profile",
  "/admin/settings": "System Settings",
};

export default function AdminDesktopNavbar() {
  const pathname = usePathname();

  const [toggleNotification, setToggleNotification] = useState(false);
  const pageTitle = PATHTITLES[pathname] || "Admin Panel";

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
    {
      id: 5,
      icon: Settings,
      bgColor: "bg-gray-500",
      name: "System Configured",
      dateTime: "11/17/2025 9:30pm",
      message:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo beatae at aliquid corporis nihil fuga iusto maiores debitis, magnam labore tempora impedit veniam, necessitatibus deserunt adipisci nulla, quis dolorum obcaecati?",
    },
    {
      id: 6,
      icon: Settings,
      bgColor: "bg-gray-500",
      name: "System Configured",
      dateTime: "11/17/2025 9:30pm",
      message:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo beatae at aliquid corporis nihil fuga iusto maiores debitis, magnam labore tempora impedit veniam, necessitatibus deserunt adipisci nulla, quis dolorum obcaecati?",
    },
  ];

  const handleToggleNotification = () => {
    setToggleNotification((prev) => !prev);
  };

  return (
    <div className=" bg-gray-800 p-4 xl:p-5 hidden lg:flex w-full items-center justify-between text-white z-40">
      {/* left */}
      <span className="text-xl xl:text-2xl font-bold">{pageTitle}</span>

      {/* right */}
      <div className="relative">
        <button
          onClick={handleToggleNotification}
          className="p-2 text-white  rounded-full hover:bg-gray-700 active:bg-gray-700/90 transition-colors duration-150 cursor-pointer"
        >
          {toggleNotification ? (
            <X className="size-4 sm:size-6" />
          ) : (
            <Bell className="size-4 sm:size-6" />
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
            <div className="flex flex-col max-h-[600px] overflow-y-auto">
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
              <button className="text-gray-500 hover:text-gray-600 active:text-gray-600/90 transition-colors duration-150 cursor-pointer">
                Mark all as read
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
