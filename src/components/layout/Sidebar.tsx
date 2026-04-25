import { Link } from "react-router-dom";
import { storage } from "../../utils/storage";

function Sidebar() {
  const user = storage.getUser();

  const menuByRole = {
    ERU_ADMIN: [
      { label: "Dashboard", path: "/" },
      { label: "Assigned Incidents", path: "/incidents" },
      { label: "Responders", path: "/responders" },
      { label: "Departments", path: "/departments" },
      { label: "Offline Logs", path: "/offline-logs" },
      { label: "Settings", path: "/settings" },
    ],
    SUBSTATION_ADMIN: [
      { label: "Dashboard", path: "/" },
      { label: "Assigned Incidents", path: "/incidents" },
      { label: "Responders", path: "/responders" },
    ],
  };

  const menuItems = menuByRole[user?.role || "ERU_ADMIN"];

  return (
    <aside className="w-64 bg-slate-900 px-4 py-6 text-white">
      <h1 className="mb-8 text-xl font-bold">Sagip Manileño</h1>

      <nav className="space-y-3">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="block rounded px-3 py-2 hover:bg-slate-800"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;