"use client";

import { Menu, X } from "lucide-react";

export default function Header({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeTab, 
  menuItems 
}) {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-emerald-100">
      <div className="px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          {sidebarOpen ? (
            <X className="size-6 text-gray-700" />
          ) : (
            <Menu className="size-6 text-gray-700" />
          )}
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {menuItems.find((item) => item.tab === activeTab)?.name ||
            "Dashboard"}
        </h1>
        <div className="w-10"></div>
      </div>
    </header>
  );
}

