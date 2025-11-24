"use client";

import { 
  Radio, 
  DollarSign, 
  Plus, 
  Clock, 
  TimerOff, 
  Wifi, 
  Package, 
  History 
} from "lucide-react";

export default function OverviewTab({ 
  userData, 
  user, 
  timeRemaining, 
  setActiveTab, 
  openTopUpModal, 
  handleEndSession 
}) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Card */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Welcome back, {userData?.fullName || "User"}!
          </h2>
          <p className="text-emerald-50">
            Manage your Wi-Fi access and time packages
          </p>
        </div>
        <div className="absolute top-4 right-4 opacity-20">
          <Radio className="size-24 text-white" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 shadow-sm relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <button
              onClick={openTopUpModal}
              className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
              title="Top-up Balance"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-1">
            Current Balance
          </h3>
          <p className="text-3xl font-bold text-slate-900">
            ₱{typeof userData?.balance === 'number' ? userData.balance.toFixed(2) : "0.00"}
          </p>
        </div>

        {/* Time Remaining Card */}
        <div className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 shadow-sm relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-1">
            {(() => {
              // Check if there's an active session
              if (userData?.sessionEndTime) {
                const sessionEndTime = userData.sessionEndTime;
                let endTime = null;
                
                if (sessionEndTime instanceof Date) {
                  endTime = sessionEndTime.getTime();
                } else if (typeof sessionEndTime === 'number') {
                  endTime = sessionEndTime;
                } else if (sessionEndTime && typeof sessionEndTime.toMillis === 'function') {
                  endTime = sessionEndTime.toMillis();
                }
                
                const now = Date.now();
                if (endTime && endTime > now) {
                  return "Time Remaining";
                }
              }
              // No active session - show saved time label
              if (userData?.savedRemainingTimeSeconds && userData.savedRemainingTimeSeconds > 0) {
                return "Saved Time";
              }
              return "Time Remaining";
            })()}
          </h3>
          <p className="text-3xl font-bold text-slate-900">
            {(() => {
              if (timeRemaining === 0) return "0h 0m";
              const hours = Math.floor(timeRemaining / 3600);
              const minutes = Math.floor((timeRemaining % 3600) / 60);
              const seconds = timeRemaining % 60;
              if (hours > 0) {
                return `${hours}h ${minutes}m`;
              } else if (minutes > 0) {
                return `${minutes}m ${seconds}s`;
              } else {
                return `${seconds}s`;
              }
            })()}
          </p>
          {(() => {
            // Show indicator if this is saved time (not active session)
            if (userData?.savedRemainingTimeSeconds && userData.savedRemainingTimeSeconds > 0) {
              const sessionEndTime = userData.sessionEndTime;
              let endTime = null;
              
              if (sessionEndTime) {
                if (sessionEndTime instanceof Date) {
                  endTime = sessionEndTime.getTime();
                } else if (typeof sessionEndTime === 'number') {
                  endTime = sessionEndTime;
                } else if (typeof sessionEndTime.toMillis === 'function') {
                  endTime = sessionEndTime.toMillis();
                }
              }
              
              const now = Date.now();
              // Only show "Saved" if there's no active session
              if (!endTime || endTime <= now) {
                return (
                  <p className="text-xs text-gray-500 mt-1">
                    Saved for next session
                  </p>
                );
              }
            }
            return null;
          })()}
          
          {/* End Session Button - Only show if there's an active session */}
          {(() => {
            if (userData?.sessionEndTime) {
              const sessionEndTime = userData.sessionEndTime;
              let endTime = null;
              
              if (sessionEndTime instanceof Date) {
                endTime = sessionEndTime.getTime();
              } else if (typeof sessionEndTime === 'number') {
                endTime = sessionEndTime;
              } else if (sessionEndTime && typeof sessionEndTime.toMillis === 'function') {
                endTime = sessionEndTime.toMillis();
              }
              
              const now = Date.now();
              if (endTime && endTime > now) {
                return (
                  <button
                    onClick={handleEndSession}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-colors duration-150"
                  >
                    <TimerOff className="size-4" />
                    End Session & Save Time
                  </button>
                );
              }
            }
            return null;
          })()}
        </div>

        {/* Status Card */}
        <div className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 shadow-sm relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
              <Wifi className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-1">
            Account Status
          </h3>
          <p className="text-3xl font-bold text-slate-900">
            {userData?.isRegistered === true ? "Registered" : "Unregistered"}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 relative z-10">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => setActiveTab("packages")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all duration-150"
            >
              <Package className="size-5" />
              <span>Buy Time Package</span>
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-emerald-600 text-emerald-600 font-semibold hover:bg-emerald-50 transition-all duration-150"
            >
              <History className="size-5" />
              <span>View Transactions</span>
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 relative z-10">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Account Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">RFID Card</span>
              <span className="text-sm font-semibold text-slate-900">
                {userData?.rfidCardId || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Email</span>
              <span className="text-sm font-semibold text-slate-900">
                {userData?.email || user?.email || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Registered</span>
              <span className="text-sm font-semibold text-slate-900">
                {userData?.registeredAt
                  ? (userData.registeredAt.toDate ? userData.registeredAt.toDate() : new Date(userData.registeredAt)).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

