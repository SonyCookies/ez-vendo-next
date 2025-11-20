import { useState } from "react";
import { ArchiveX, BanknoteArrowUp, Plus, ReceiptText, X, ListFilter } from "lucide-react";

export default function AllTransactions() {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [err, setErr] = useState(false);
  const [toggleFilter, setToggleFilter] = useState(false);

  const handleToggleFilter = () => {
    setToggleFilter((prev) => !prev);
  };

  const todayTransaction = [
    {
      id: 1,
      name: "Edward Gatbonton",
      rfid: 123456789,
      amount: 50,
      date: "11/19/2025",
      time: "6:01:59 PM",
      transactionId: "T-111925-001",
      paymentMethod: "Cash",
      refNo: "CASH-111925",
      status: "Completed",
      color: "bg-green-500",
      textColor: "text-green-500",
    },
    {
      id: 2,
      name: "Sonny Sarcia",
      rfid: 927491027,
      amount: 120,
      date: "11/19/2025",
      time: "7:01:59 PM",
      transactionId: "T-111925-002",
      paymentMethod: "GCash",
      refNo: "GCASH-111926",
      status: "Completed",
      color: "bg-green-500",
      textColor: "text-green-500",
    },
    {
      id: 3,
      name: "Kim Anonuevo",
      rfid: 595134795,
      amount: 75,
      date: "11/19/2025",
      time: "8:01:59 PM",
      transactionId: "T-111925-003",
      paymentMethod: "Maya",
      refNo: "MAYA-111927",
      status: "Rejected",
      color: "bg-red-500",
      textColor: "text-red-500",
    },
  ];

  const yesterdayTransaction = [...todayTransaction]; // keep sample
  const previousTransaction = [...todayTransaction]; // keep sample

  // ------------------------------------------------------
  // REUSABLE COMPONENTS (inside same file - no new files)
  // ------------------------------------------------------

  const NoTransactions = ({ message }) => (
    <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 w-full">
      <div className="flex items-center justify-center pt-2">
        <div className="flex items-center justify-center p-4 bg-gray-200 rounded-full">
          <ArchiveX className="size-7 sm:size-8" />
        </div>
      </div>

      <div className="flex flex-col text-center pb-2">
        <span className="text-base sm:text-lg font-semibold">
          No Transactions
        </span>
        <span className="text-gray-500 text-xs sm:text-sm">{message}</span>
      </div>
    </div>
  );

  const TransactionSection = ({ title, transactions, emptyMessage }) => (
    <div className="flex flex-col gap-2">
      {/* Section Header */}
      <div className="flex items-center">
        <div className="flex flex-1">
          <span className="font-semibold text-gray-500 text-xs sm:text-sm">
            {title}
          </span>
        </div>
        <div className="flex flex-1"></div>
      </div>

      {/* MOBILE */}
      <div className="flex xl:hidden flex-col gap-2">
        {transactions.length === 0 ? (
          <NoTransactions message={emptyMessage} />
        ) : (
          transactions.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTransaction(t)}
              className="rounded-2xl border border-gray-300 p-5 flex items-center hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
            >
              <div className="flex flex-1 flex-col gap-4 text-start">
                <div className="flex flex-col">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-gray-500 text-xs">
                    RFID No. {t.rfid}
                  </span>
                </div>

                <div className="flex text-white">
                  <div
                    className={`text-center px-4 py-1 text-xs rounded-full ${t.color}`}
                  >
                    {t.status}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="flex items-center gap-1 text-green-500 font-semibold text-base">
                  <Plus className="size-5" />P{t.amount}.00
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden xl:flex w-full">
        {transactions.length === 0 ? (
          <NoTransactions message={emptyMessage} />
        ) : (
          <div className="rounded-2xl overflow-hidden border border-gray-300 w-full">
            <table className="w-full text-sm text-left text-body">
              <thead className="border-b border-gray-300 bg-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">RFID No.</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Date and Time</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-300">
                    <td className="px-6 py-4">{t.name}</td>
                    <td className="px-6 py-4">{t.rfid}</td>
                    <td className="px-6 py-4 flex">
                      <div
                        className={`text-center text-xs px-4 py-1 rounded-full text-white ${t.color}`}
                      >
                        {t.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-green-500">P{t.amount}.00</td>
                    <td className="px-6 py-4">
                      {t.date} {t.time}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedTransaction(t)}
                        className="rounded-lg px-4 py-1 bg-green-500 text-white text-xs hover:bg-green-500/90 active:bg-green-600 cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ------------------------------------------------------
  // MAIN RETURN
  // ------------------------------------------------------

  return (
    <div className="flex flex-col xl:flex-1 gap-4">
      {/* TOTAL CARD */}
      <div className="flex relative rounded-2xl bg-linear-to-r from-yellow-400 via-yellow-300 to-yellow-400 p-5 ">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-2xl sm:text-3xl font-bold">
            {todayTransaction.length +
              yesterdayTransaction.length +
              previousTransaction.length}
          </span>

          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-medium">
              All Transactions
            </span>
            <span className="text-xs text-gray-600">
              As of November 19, 2025
            </span>
          </div>
        </div>

        <div className="absolute top-3 right-3 rounded-full p-3 bg-yellow-500 shadow-yellow-500">
          <BanknoteArrowUp className="size-6" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex">
          {toggleFilter ? (
            <button
              onClick={handleToggleFilter}
              className="flex cursor-pointer w-full sm:w-auto justify-center items-center  gap-2 rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
            >
              <X className="size-4 sm:size-5" />
              Close filter
            </button>
          ) : (
            <button
              onClick={handleToggleFilter}
              className="flex cursor-pointer w-full sm:w-auto justify-center items-center  gap-2 rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
            >
              <ListFilter className="size-4 sm:size-5" />
              Filter options
            </button>
          )}
        </div>

        {toggleFilter && (
          <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 rounded-2xl bg-gray-50 border border-dashed border-gray-300">
            {/* sort by*/}
            <form className="flex flex-col gap-1 flex-1">
              <label htmlFor="" className={labelClass}>
                Sort by
              </label>
              <select
                name=""
                id=""
                className={`px-3 sm:px-4 py-2 w-full border ${
                  err ? "border-red-500" : "border-gray-300"
                } outline-none bg-white rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150`}
              >
                <option value="">Default</option>
                <option value="">Newest to Oldest</option>
                <option value="">Oldest to Newest</option>
              </select>
            </form>

            {/* date */}
            <form className="flex flex-col gap-1 flex-1">
              <label htmlFor="" className={labelClass}>
                Date and Time
              </label>
              <input
                type="date"
                name=""
                id=""
                className={`px-3 sm:px-4 py-2 w-full border ${
                  err ? "border-red-500" : "border-gray-300"
                } outline-none bg-white rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150`}
              />
            </form>
          </div>
        )}
      </div>

      {/* SECTIONS */}
      <TransactionSection
        title="Today"
        transactions={todayTransaction}
        emptyMessage="There are no transactions made today."
      />

      <TransactionSection
        title="Yesterday"
        transactions={yesterdayTransaction}
        emptyMessage="There are no transactions made yesterday."
      />

      <TransactionSection
        title="Last 7 days"
        transactions={previousTransaction}
        emptyMessage="There are no transactions made for the last 7 days."
      />

      {/* -------------------------------------------------- */}
      {/* SELECTED TRANSACTION MODAL */}
      {/* -------------------------------------------------- */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-5 z-50 overflow-y-auto">
          <div className="rounded-2xl relative bg-white p-4 sm:p-5 w-full max-w-md flex flex-col gap-4 sm:gap-5 mt-2 mb-2">
            {/* Close */}
            <button
              onClick={() => setSelectedTransaction(null)}
              className="p-2 cursor-pointer rounded-full hover:bg-gray-50 active:bg-gray-100 text-gray-500 absolute top-2 sm:top-3 right-2 sm:right-3"
            >
              <X className="size-4 sm:size-5" />
            </button>

            {/* status */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
              <div
                className={`px-4 py-1 text-xs sm:text-sm text-white rounded-full ${selectedTransaction.color}`}
              >
                {selectedTransaction.status}
              </div>
            </div>

            {/* Icon + Title */}
            <div className="flex flex-col items-center justify-center gap-4 pt-2">
              <div
                className={`rounded-full p-3  text-white ${selectedTransaction.color}`}
              >
                <ReceiptText className="size-6 sm:size-7" />
              </div>

              <div className="flex flex-col text-center">
                <span
                  className={`text-base sm:text-lg font-semibold ${selectedTransaction.textColor}`}
                >
                  Transaction Details
                </span>

                <span className="text-gray-500 text-xs sm:text-sm">
                  {selectedTransaction.date} {selectedTransaction.time}
                </span>
              </div>
            </div>

            {/* Name + RFID + Transaction ID */}
            <div className="flex items-center pt-2">
              <div className="flex flex-1 flex-col text-start">
                <span className="text-xs sm:text-sm font-semibold">
                  {selectedTransaction.name}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">
                  RFID No. {selectedTransaction.rfid}
                </span>
              </div>

              <div className="flex flex-1 flex-col text-end">
                <span className="text-xs sm:text-sm text-gray-500">
                  Transaction ID
                </span>
                <span className="font-semibold text-xs sm:text-sm">
                  {selectedTransaction.transactionId}
                </span>
              </div>
            </div>

            {/* Amount + Payment Info */}
            <div className="flex flex-col gap-4 pb-2">
              <div className="flex flex-col gap-1 items-center justify-center py-4">
                <div
                  className={`text-xl sm:text-2xl font-semibold flex items-center gap-2 ${selectedTransaction.textColor}`}
                >
                  <Plus className="size-4 sm:size-5" />P{" "}
                  {selectedTransaction.amount}.00
                </div>
                <span className="text-gray-500 text-xs sm:text-sm">
                  Amount Top-up
                </span>
              </div>

              <div className="flex items-center p-4 rounded-lg bg-gray-100">
                <div className="flex flex-1 flex-col text-xs sm:text-sm text-start">
                  <span className="text-gray-500">Payment method</span>
                  <span className="font-semibold">
                    {selectedTransaction.paymentMethod}
                  </span>
                </div>

                <div className="flex flex-1 flex-col text-xs sm:text-sm text-end">
                  <span className="text-gray-500">Reference number</span>
                  <span className="font-semibold">
                    {selectedTransaction.refNo}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
