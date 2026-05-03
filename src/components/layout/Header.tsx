import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { storage } from "@/utils/storage";

export default function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const user = storage.getUser();

  const handleLogout = () => {
    storage.clearAuth();
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/settings?tab=account"); // 👈 opens Account Information
    setOpen(false);
  };

  return (
    <header className="flex items-center justify-end border-b border-slate-200 bg-white px-6 py-3">
      <div className="relative">
        {/* USER BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200">
            <User size={18} />
          </div>

          <div className="text-left">
            <p className="text-sm font-medium text-slate-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-slate-500">
              {user?.role === "ERU_ADMIN"
                ? "Headquarter Admin"
                : "Substation Admin"}
            </p>
          </div>
        </button>

        {/* DROPDOWN */}
        {open && (
          <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg">
            <button
              onClick={handleProfile}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              Profile
            </button>

            <div className="border-t border-slate-200" />

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}