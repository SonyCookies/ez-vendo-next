import { User } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center text-sm sm:text-base bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="flex relative rounded-2xl overflow-hidden bg-gradient-to-r from-green-500 via-green-400 to-green-500 p-4 sm:p-5 text-white shadow-lg">
          <div className="flex flex-1 flex-col gap-1.5 sm:gap-2 items-center">
            <span className="text-xl sm:text-2xl xl:text-3xl font-bold">
              Complete Your Profile
            </span>
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm xl:text-base font-semibold text-white/90">
                Loading...
              </span>
            </div>
          </div>
          <div className="absolute top-1/2 right-3 sm:right-4 -translate-y-1/2 rounded-full p-2.5 sm:p-3 bg-green-600/40 shadow-lg">
            <User className="size-5 sm:size-6 xl:size-7" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="text-xs sm:text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    </div>
  );
}
