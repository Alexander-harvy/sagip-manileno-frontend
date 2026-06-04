

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Total Incidents</p>
          <h2 className="text-2xl font-bold">24</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Active Incidents</p>
          <h2 className="text-2xl font-bold text-yellow-600">8</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Responders</p>
          <h2 className="text-2xl font-bold">15</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Departments</p>
          <h2 className="text-2xl font-bold">5</h2>
        </div>
      </div>
    </div>
  );
}