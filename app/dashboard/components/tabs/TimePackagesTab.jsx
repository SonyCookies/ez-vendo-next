"use client";

import { Package, DollarSign } from "lucide-react";

export default function TimePackagesTab({ 
  userData, 
  billingRatePerMinute, 
  handleTimePackageClick 
}) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Time Packages
          </h2>
          <p className="text-emerald-50">
            Purchase internet time packages (₱{billingRatePerMinute.toFixed(2)}/min)
          </p>
        </div>
        <div className="absolute top-4 right-4 opacity-20">
          <Package className="size-24 text-white" />
        </div>
      </div>

      {/* Balance Info */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">
              Current Balance
            </h3>
            <p className="text-3xl font-bold text-slate-900">
              ₱{typeof userData?.balance === 'number' ? userData.balance.toFixed(2) : "0.00"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Time Packages Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 5 Minutes */}
        <button
          onClick={() => handleTimePackageClick(5)}
          disabled={!userData || (typeof userData?.balance === 'number' ? userData.balance : 0) < (5 * billingRatePerMinute)}
          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white transition-all duration-150 shadow-md hover:shadow-lg transform hover:-translate-y-1 relative z-10"
        >
          <span className="text-4xl font-bold mb-2">5</span>
          <span className="text-sm mb-1">minutes</span>
          <span className="text-xs font-semibold">₱{(5 * billingRatePerMinute).toFixed(2)}</span>
        </button>
        
        {/* 10 Minutes */}
        <button
          onClick={() => handleTimePackageClick(10)}
          disabled={!userData || (typeof userData?.balance === 'number' ? userData.balance : 0) < (10 * billingRatePerMinute)}
          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white transition-all duration-150 shadow-md hover:shadow-lg transform hover:-translate-y-1 relative z-10"
        >
          <span className="text-4xl font-bold mb-2">10</span>
          <span className="text-sm mb-1">minutes</span>
          <span className="text-xs font-semibold">₱{(10 * billingRatePerMinute).toFixed(2)}</span>
        </button>
        
        {/* 30 Minutes */}
        <button
          onClick={() => handleTimePackageClick(30)}
          disabled={!userData || (typeof userData?.balance === 'number' ? userData.balance : 0) < (30 * billingRatePerMinute)}
          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white transition-all duration-150 shadow-md hover:shadow-lg transform hover:-translate-y-1 relative z-10"
        >
          <span className="text-4xl font-bold mb-2">30</span>
          <span className="text-sm mb-1">minutes</span>
          <span className="text-xs font-semibold">₱{(30 * billingRatePerMinute).toFixed(2)}</span>
        </button>
        
        {/* 60 Minutes */}
        <button
          onClick={() => handleTimePackageClick(60)}
          disabled={!userData || (typeof userData?.balance === 'number' ? userData.balance : 0) < (60 * billingRatePerMinute)}
          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white transition-all duration-150 shadow-md hover:shadow-lg transform hover:-translate-y-1 relative z-10"
        >
          <span className="text-4xl font-bold mb-2">60</span>
          <span className="text-sm mb-1">minutes</span>
          <span className="text-xs font-semibold">₱{(60 * billingRatePerMinute).toFixed(2)}</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="p-6 rounded-2xl bg-white border border-blue-200 shadow-sm relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-sm font-semibold">ℹ️</span>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">How it works</h3>
            <p className="text-sm text-gray-700">
              When you purchase a time package, it will be added to your account. 
              The time will be activated when you scan your RFID card at the captive portal. 
              If you have saved time from a previous session, it will be included automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

