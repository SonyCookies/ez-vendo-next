import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-sm sm:text-base">
      <div className="flex flex-col gap-">
        <Image
          src="/favicon.ico"
          alt="EZ-Vendo Logo"
          height={100}
          width={100}
          className="block sm:hidden"
        />

        <Image
          src="/favicon.ico"
          alt="EZ-Vendo Logo"
          height={120}
          width={120}
          className="hidden sm:block"
        />
      </div>
      <span className="text-gray-500 animate-pulse">Loading...</span>
    </div>
  );
}
