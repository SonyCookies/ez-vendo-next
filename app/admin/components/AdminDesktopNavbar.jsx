"use client";
import { usePathname } from "next/navigation";
import {
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
  "/admin/billing": "Billing Configuration",
  "/admin/transactions": "Package Transaction",
  "/admin/configuration": "Configuration",
};

export default function AdminDesktopNavbar() {
  const pathname = usePathname();

  const pageTitle = PATHTITLES[pathname] || "Admin Panel";

  return (
    <div className=" bg-gray-800 p-4 xl:p-5 hidden lg:flex w-full items-center justify-between text-white z-40">
      {/* left */}
      <span className="text-xl xl:text-2xl font-bold">{pageTitle}</span>

    </div>
  );
}
