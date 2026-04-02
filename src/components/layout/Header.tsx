import { useNavigate } from "react-router-dom";
import { storage } from "../../utils/storage";

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    storage.clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800">Admin Dashboard</h2>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Logout
      </button>
    </header>
  );
}

export default Header;