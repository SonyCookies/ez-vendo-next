import AdminDesktopNavbar from "../components/AdminDesktopNavbar";
import AdminNavbar from "../components/AdminNavbar";

export default function AdminTopUp() {
  return (
    <div className="min-h-dvh flex flex-col lg:flex-row text-sm sm:text-base">
      {/* navbar */}
      <AdminNavbar />
      {/* main */}
      <div className="flex flex-1 flex-col gap-4">
        {/* desktop navbar */}
        <AdminDesktopNavbar />
      </div>
    </div>
  );
}
