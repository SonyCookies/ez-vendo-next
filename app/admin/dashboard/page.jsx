"use client";

import AdminNavbar from "../components/AdminNavbar";
import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import {
  ArchiveX,
  BanknoteArrowUp,
  ChevronRight,
  Plus,
  UserRound,
  UserX,
  Wifi,
  WifiHigh,
} from "lucide-react";
import Link from "next/link";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

export default function AdminDashboard() {
  const mockUsers = [
    {
      id: 1,
      name: "Edward Gatbonton",
      rfid: 123456789,
      status: "active",
      bg: "bg-green-500",
      dateTime: "11/19/2025 12:24:02 AM",
    },
    {
      id: 2,
      name: "Edward Gatbonton",
      rfid: 123456789,
      status: "active",
      bg: "bg-green-500",
      dateTime: "11/19/2025 12:24:02 AM",
    },
    {
      id: 3,
      name: "Edward Gatbonton",
      rfid: 123456789,
      status: "active",
      bg: "bg-green-500",
      dateTime: "11/19/2025 12:24:02 AM",
    },
    {
      id: 4,
      name: "Edward Gatbonton",
      rfid: 123456789,
      status: "active",
      bg: "bg-green-500",
      dateTime: "11/19/2025 12:24:02 AM",
    },
    {
      id: 5,
      name: "Edward Gatbonton",
      rfid: 123456789,
      status: "blocked",
      bg: "bg-red-500",
      dateTime: "11/19/2025 12:24:02 AM",
    },
  ];

  const mockPendingRequests = [
    {
      id: 1,
      name: "Edward Gatbonton",
      rfid: 123456789,
      status: "pending",
      bg: "bg-yellow-400",
      amount: 50.0,
    },
    {
      id: 2,
      name: "Edward Gatbonton",
      rfid: 123456789,
      status: "pending",
      bg: "bg-yellow-400",
      amount: 50.0,
    },
    {
      id: 3,
      name: "Edward Gatbonton",
      rfid: 123456789,
      status: "pending",
      bg: "bg-yellow-400",
      amount: 50.0,
    },
    {
      id: 4,
      name: "Edward Gatbonton",
      rfid: 123456789,
      status: "pending",
      bg: "bg-yellow-400",
      amount: 50.0,
    },
    {
      id: 5,
      name: "Edward Gatbonton",
      rfid: 123456789,
      status: "pending",
      bg: "bg-yellow-400",
      amount: 50.0,
    },
  ];

  // user activity
  const userActivityData = {
    labels: [
      "Nov 10",
      "Nov 11",
      "Nov 12",
      "Nov 13",
      "Nov 14",
      "Nov 15",
      "Nov 16",
    ],
    datasets: [
      {
        label: "Active Users",
        data: [5, 9, 7, 12, 15, 11, 14],
        borderWidth: 2,
        tension: 0.3,
        borderColor: "#3B82F6", // Blue
        backgroundColor: "rgba(59, 130, 246, 0.3)", // Light blue fill (optional)
      },
    ],
  };

  const userActivityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: { color: "#555" },
      },
      y: {
        ticks: { color: "#555" },
      },
    },
  };

  // user registry
  const userRegistryData = {
    labels: ["Nov 10", "Nov 11", "Nov 12", "Nov 13", "Nov 14", "Nov 15"],
    datasets: [
      {
        label: "New Users Registered",
        data: [2, 4, 3, 6, 4, 5],
        borderWidth: 1,
        backgroundColor: "#10B981", // Green
        borderColor: "#059669", // Darker green
      },
    ],
  };

  const userRegistryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: "#555" } },
      y: { ticks: { color: "#555" } },
    },
  };

  // most used bill rate
  const billRateData = {
    labels: ["P5.00 / 2.5 mins", "P10.00 / 5 mins", "P15.00 / 10 mins"],
    datasets: [
      {
        data: [40, 35, 25],
        borderWidth: 1,
        backgroundColor: [
          "#3B82F6", // Blue
          "#F59E0B", // Yellow / Orange
          "#EF4444", // Red
        ],
        borderColor: "#ffffff", // white separator lines (clean look)
      },
    ],
  };

  const billRateOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#555",
        },
      },
    },
  };

  const EmptyState = () => (
    <div className="flex flex-col gap-2 items-center justify-center p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-100 lg:bg-gray-50 w-full">
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center justify-center p-4 rounded-full bg-gray-300 text-gray-600">
          <ArchiveX className="size-7 sm:size-8" />
        </div>
      </div>
      <div className="flex flex-col text-center pb-2">
        <span className="text-base sm:text-lg font-semibold">
          No Available Data
        </span>
        <span className="text-gray-500">There is no available data.</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row text-sm sm:text-base relative">
      {/* navbar */}
      <AdminNavbar />
      {/* main */}
      <div className="flex flex-1 flex-col">
        {/* desktop navbar */}
        <AdminDesktopNavbar />

        <div className="flex flex-col  px-3 py-4 sm:p-4 md:p-5 gap-4 xl:gap-5">
          {/* charts */}
          <div className="flex flex-col-reverse gap-3 sm:gap-4">
            <div className="flex flex-col xl:flex-row w-full h-full gap-4">
              {/* bar chart of user register */}
              <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5 rounded-2xl border border-gray-300">
                <span className="font-semibold text-gray-500">
                  User's registry
                </span>
                <div className="w-full h-64 xl:h-72">
                  <Bar data={userRegistryData} options={userRegistryOptions} />
                </div>
              </div>
              {/* most used bill */}
              <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5 rounded-2xl border border-gray-300">
                <span className="font-semibold text-gray-500">
                  Most used bill
                </span>
                <div className="w-full h-64 xl:h-72">
                  <Pie data={billRateData} options={billRateOptions} />
                </div>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row w-full h-full gap-4">
              {/* left */}
              <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5 rounded-2xl border border-gray-300">
                <span className="font-semibold text-gray-500">
                  User's Activity
                </span>
                <div className="w-full h-64 xl:h-72">
                  <Line data={userActivityData} options={userActivityOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* cards */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {/* total pending request */}
            <div className="col-span-2 xl:col-span-1 flex relative rounded-2xl bg-linear-to-r from-yellow-400 via-yellow-300 to-yellow-400 p-5">
              <div className="flex flex-1 flex-col gap-2 ">
                <span className="text-2xl sm:text-3xl font-bold">
                  {mockPendingRequests.length}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base text-gray-800 font-medium">
                    Total Pending Requests
                  </span>
                  <span className="text-xs text-gray-600 ">
                    As of November 15, 2025
                  </span>
                </div>
              </div>
              <div className="absolute top-3 right-3 rounded-full p-3 bg-yellow-500 shadow-yellow-500">
                <BanknoteArrowUp className="size-6 sm:size-7" />
              </div>
            </div>
            {/* Total users */}
            <div className=" col-span-2 sm:col-span-1  flex relative rounded-2xl bg-linear-to-r from-green-500 via-green-400 to-green-500 p-5 text-white">
              <div className="flex flex-1 flex-col gap-2 ">
                <span className="text-2xl sm:text-3xl font-bold">
                  {mockUsers.length}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base font-semibold text-white">
                    Total Users
                  </span>
                  <span className="text-xs text-gray-100">
                    As of November 15, 2025
                  </span>
                </div>
              </div>
              <div className="absolute top-3 right-3 rounded-full p-3 bg-green-600/40  shadow-green-600/40 ">
                <UserRound className="size-6 sm:size-7" />
              </div>
            </div>
            {/* Total Users (unchanged) */}
            <div className="col-span-2 sm:col-span-1 flex relative rounded-2xl bg-linear-to-r from-red-500 via-red-400 to-red-500 p-5 text-white">
              <div className="flex flex-1 flex-col gap-2 ">
                <span className="text-2xl sm:text-3xl font-bold">1</span>
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base font-semibold text-white">
                    Total Blocked Users
                  </span>
                  <span className="text-xs text-gray-100">
                    As of November 15, 2025
                  </span>
                </div>
              </div>
              <div className="absolute top-3 right-3 rounded-full p-3 bg-red-600 shadow-red-600">
                <UserX className="size-6 sm:size-7" />
              </div>
            </div>
          </div>

          {/* tables and cards */}
          <div className="flex flex-col xl:flex-row gap-4">
            {/* left */}
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center">
                <div className="flex flex-1">
                  <span className="text-xs sm:text-sm font-semibold text-gray-500">
                    Recent users
                  </span>
                </div>
                <div className="flex">
                  <Link
                    href="/admin/users"
                    className="text-xs sm:text-sm flex items-center gap-1 text-gray-500 hover:text-green-500 active:text-green-600 transition-colors duration-150"
                  >
                    See all
                    <ChevronRight className="size-4 sm:size-5" />
                  </Link>
                </div>
              </div>

              {/* MOBILE VIEW — CLICK TO OPEN MODAL */}
              <div className="flex xl:hidden flex-col gap-3">
                {mockUsers.length === 0 && <EmptyState />}

                {mockUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-5 cursor-pointer rounded-2xl border border-gray-300 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
                  >
                    <div className="flex flex-1 text-left flex-col gap-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{u.name}</span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          RFID No: {u.rfid}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div
                        className={`flex items-center px-4 py-1 rounded-full text-xs text-white ${u.bg}`}
                      >
                        <span>{u.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW */}
              <div className="hidden xl:flex rounded-2xl overflow-hidden border border-gray-300 w-full">
                {mockUsers.length === 0 ? (
                  <EmptyState />
                ) : (
                  <table className="w-full text-sm text-left text-body">
                    <thead className="border-b border-gray-300 bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">RFID No.</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Date Created</th>
                      </tr>
                    </thead>

                    <tbody>
                      {mockUsers.map((u) => (
                        <tr key={u.id} className="border-b border-gray-300">
                          <td className="px-6 py-4">{u.name}</td>
                          <td className="px-6 py-4">{u.rfid}</td>
                          <td className="px-6 py-4">
                            <div className="flex">
                              <div
                                className={`text-xs px-4 py-1 rounded-full text-white ${u.bg}`}
                              >
                                {u.status}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{u.dateTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            {/* right */}
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center">
                <div className="flex flex-1">
                  <span className="text-xs sm:text-sm font-semibold text-gray-500">
                    Pending requests
                  </span>
                </div>
                <div className="flex">
                  <Link
                    href="/admin/top-up"
                    className="text-xs sm:text-sm flex items-center gap-1 text-gray-500 hover:text-green-500 active:text-green-600 transition-colors duration-150"
                  >
                    See all
                    <ChevronRight className="size-4 sm:size-5" />
                  </Link>
                </div>
              </div>

              {/* items (mobile) */}
              <div className="flex xl:hidden flex-col gap-3">
                {mockPendingRequests.length === 0 && <EmptyState />}
                {mockPendingRequests.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 cursor-pointer rounded-2xl border border-gray-300 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
                  >
                    {/* name, rfid, status */}
                    <div className="flex flex-1 text-left flex-col gap-3">
                      {/* name and rfid details */}
                      <div className="flex flex-col">
                        {/* name */}
                        <span className="font-semibold">{item.name}</span>
                        {/* rfid */}
                        <span className="text-xs sm:text-sm text-gray-500">
                          RFID No: {item.rfid}
                        </span>
                      </div>
                      {/* status */}
                      <div className="flex items-center">
                        <div className="flex items-center px-4 py-1 rounded-full text-xs text-white bg-yellow-400">
                          <span>{item.status}</span>
                        </div>
                      </div>

                      {/* <span className="text-yellow-400 animate-pulse">
                    {item.status}
                  </span> */}
                    </div>
                    {/* amount top-up */}
                    <div className="flex items-center justif-center">
                      <div className="flex items-center gap-1 text-green-500">
                        <Plus className="size-5 sm:size-6" />
                        <span className="text-base sm:text-lg font-semibold">
                          {item.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* items (table) */}
              <div className="hidden xl:flex rounded-2xl overflow-hidden border border-gray-300 w-full">
                {mockPendingRequests.length === 0 ? (
                  <EmptyState />
                ) : (
                  <table className="w-full text-sm text-left rtl:text-right text-body">
                    <thead className="border-b border-gray-300 bg-gray-100 ">
                      <tr>
                        <th scope="col" className="px-6 py-3 font-medium">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 font-medium">
                          RFID No.
                        </th>
                        <th scope="col" className="px-6 py-3 font-medium">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 font-medium">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockPendingRequests.map((item) => (
                        <tr key={item.id} className="border-b border-gray-300">
                          <td scope="row" className="px-6 py-4">
                            {item.name}
                          </td>
                          <td className="px-6 py-4">{item.rfid}</td>
                          <td className="px-6 py-4 flex">
                            <div className="text-xs px-4 py-1 rounded-full text-white bg-yellow-400">
                              {item.status}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-green-500">
                              P{item.amount.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
