import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 px-4 py-6 text-white">
      <h1 className="mb-8 text-xl font-bold">Sagip Manileno</h1>

      <nav className="space-y-3">
        <Link to="/" className="block rounded px-3 py-2 hover:bg-slate-800">
          Dashboard
        </Link>

        <Link
          to="/incidents"
          className="block rounded px-3 py-2 hover:bg-slate-800"
        >
          Incidents
        </Link>

        <Link
          to="/responders"
          className="block rounded px-3 py-2 hover:bg-slate-800"
        >
          Responders
        </Link>

        <Link
          to="/departments"
          className="block rounded px-3 py-2 hover:bg-slate-800"
        >
          Departments
        </Link>

        <Link
          to="/offline-logs"
          className="block rounded px-3 py-2 hover:bg-slate-800"
        >
          Offline Logs
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;