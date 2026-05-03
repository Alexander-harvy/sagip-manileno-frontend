import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  FileText,
  Settings,
} from "lucide-react";
import { storage } from "../../utils/storage";

function Sidebar() {
  const user = storage.getUser();

  const menuByRole = {
    ERU_ADMIN: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "Incident Logs", path: "/incidents", icon: ClipboardList },
      { label: "Responders", path: "/responders", icon: Users },
      { label: "Substations", path: "/substations", icon: Building2 },
      { label: "Offline Logs", path: "/offline-logs", icon: FileText },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
    SUBSTATION_ADMIN: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "Incident Logs", path: "/incidents", icon: ClipboardList },
      { label: "Responders", path: "/responders", icon: Users },
       { label: "Settings", path: "/settings", icon: Settings },
    ],
  };

  const menuItems = menuByRole[user?.role || "ERU_ADMIN"];

  return (
    <aside className="w-64 bg-slate-900 px-4 py-6 text-white">
      <h1 className="mb-8 text-xl font-bold">Sagip Manileño</h1>

      <nav className="space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-800 text-white shadow-md"
                    : "text-slate-200 hover:bg-slate-800/70 hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;