import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageState from "@/components/common/PageState";
import { fetchIncidents } from "../../api/incidents";

type IncidentRow = {
  incident_id: number;
  incident_type: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  source?: string | null;
  status: string;
  substation_name?: string | null;
  reported_at?: string | null;
  created_at?: string | null;
};

type StatusFilter = "all" | "pending" | "assigned" | "resolved";
type DateFilterType = "none" | "day" | "week" | "month" | "year";

export default function IncidentsPage() {
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("none");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
  });

  const formatLocalDate = (date: Date) => date.toLocaleDateString("en-CA");

  const formatMMDDYYYY = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const parseMMDDYYYY = (value: string) => {
    const parts = value.split("/");

    if (parts.length !== 3) return null;

    const month = Number(parts[0]);
    const day = Number(parts[1]);
    const year = Number(parts[2]);

    if (!month || !day || !year) return null;

    const parsedDate = new Date(year, month - 1, day);

    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      return null;
    }

    return parsedDate;
  };

  const getWeekRange = (weekValue: string) => {
    const [year, week] = weekValue.split("-W").map(Number);

    const januaryFourth = new Date(year, 0, 4);
    const januaryFourthDay = januaryFourth.getDay() || 7;

    const weekStart = new Date(januaryFourth);
    weekStart.setDate(
      januaryFourth.getDate() - januaryFourthDay + 1 + (week - 1) * 7
    );
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
  };

  const incidentLogs: IncidentRow[] = useMemo(() => {
    return (data ?? []).map((item: any) => ({
      incident_id: item.incident_id,
      incident_type: item.incident_type,
      description: item.description,
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      location_name: item.location_name ?? null,
      source: item.source ?? null,
      status: item.status,
      substation_name: item.substation_name ?? null,
      reported_at: item.reported_at ?? item.created_at ?? null,
      created_at: item.created_at ?? null,
    }));
  }, [data]);

  const dateFilteredIncidentLogs = useMemo(() => {
    return incidentLogs.filter((incident) => {
      const dateValue = incident.reported_at ?? incident.created_at;

      if (dateFilterType !== "none" && !dateValue) return false;

      const incidentDate = dateValue ? new Date(dateValue) : null;

      if (!incidentDate) return true;

      if (dateFilterType === "day" && selectedDate) {
        const selected = parseMMDDYYYY(selectedDate);

        if (!selected) return false;

        return formatLocalDate(incidentDate) === formatLocalDate(selected);
      }

      if (dateFilterType === "week" && selectedWeek) {
        const { weekStart, weekEnd } = getWeekRange(selectedWeek);
        return incidentDate >= weekStart && incidentDate <= weekEnd;
      }

      if (dateFilterType === "month" && selectedMonth) {
        return formatLocalDate(incidentDate).slice(0, 7) === selectedMonth;
      }

      if (dateFilterType === "year" && selectedYear) {
        return incidentDate.getFullYear().toString() === selectedYear;
      }

      return true;
    });
  }, [
    incidentLogs,
    dateFilterType,
    selectedDate,
    selectedWeek,
    selectedMonth,
    selectedYear,
  ]);

  const stats = useMemo(() => {
    const total = dateFilteredIncidentLogs.length;

    const pending = dateFilteredIncidentLogs.filter((incident) => {
      const status = incident.status?.toLowerCase();
      return status === "pending" || status === "reported";
    }).length;

    const assigned = dateFilteredIncidentLogs.filter((incident) => {
      const status = incident.status?.toLowerCase();
      return status === "assigned" || status === "assigned_to_substation";
    }).length;

    const resolved = dateFilteredIncidentLogs.filter((incident) => {
      const status = incident.status?.toLowerCase();
      return status === "resolved";
    }).length;

    return { total, pending, assigned, resolved };
  }, [dateFilteredIncidentLogs]);

  const filteredIncidentLogs = useMemo(() => {
    return dateFilteredIncidentLogs.filter((incident) => {
      const status = incident.status?.toLowerCase() ?? "";

      const isPending = status === "pending" || status === "reported";
      const isAssigned =
        status === "assigned" || status === "assigned_to_substation";
      const isResolved = status === "resolved";

      return (
        statusFilter === "all" ||
        (statusFilter === "pending" && isPending) ||
        (statusFilter === "assigned" && isAssigned) ||
        (statusFilter === "resolved" && isResolved)
      );
    });
  }, [dateFilteredIncidentLogs, statusFilter]);

  const resetFilters = () => {
    setStatusFilter("all");
    setDateFilterType("none");
    setSelectedDate("");
    setSelectedWeek("");
    setSelectedMonth("");
    setSelectedYear("");
  };

  const hasActiveFilter =
    statusFilter !== "all" ||
    dateFilterType !== "none" ||
    selectedDate !== "" ||
    selectedWeek !== "" ||
    selectedMonth !== "" ||
    selectedYear !== "";

  if (isLoading) {
    return <PageState type="loading" message="Loading incident logs..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load incident logs." />;
  }

  return (
    <div className="min-h-screen bg-white p-6 select-none">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Incident Logs
        </h1>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`rounded-xl border bg-white p-4 text-left shadow-sm hover:bg-slate-50 ${
            statusFilter === "all" ? "border-slate-900" : "border-slate-200"
          }`}
        >
          <p className="text-sm text-slate-500">Total Incidents</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {stats.total}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={`rounded-xl border bg-white p-4 text-left shadow-sm hover:bg-slate-50 ${
            statusFilter === "pending" ? "border-slate-900" : "border-slate-200"
          }`}
        >
          <p className="text-sm text-slate-500">Pending Alerts</p>
          <p className="mt-1 text-2xl font-semibold text-yellow-600">
            {stats.pending}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("assigned")}
          className={`rounded-xl border bg-white p-4 text-left shadow-sm hover:bg-slate-50 ${
            statusFilter === "assigned" ? "border-slate-900" : "border-slate-200"
          }`}
        >
          <p className="text-sm text-slate-500">Assigned</p>
          <p className="mt-1 text-2xl font-semibold text-blue-600">
            {stats.assigned}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("resolved")}
          className={`rounded-xl border bg-white p-4 text-left shadow-sm hover:bg-slate-50 ${
            statusFilter === "resolved" ? "border-slate-900" : "border-slate-200"
          }`}
        >
          <p className="text-sm text-slate-500">Resolved</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {stats.resolved}
          </p>
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-900">
            {filteredIncidentLogs.length}
          </span>{" "}
          incident log(s)
        </p>

        <div className="flex items-center gap-2">
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Reset
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilter((prev) => !prev)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Add filter
            </button>

            {showFilter && (
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Filter by date
                </label>

                <select
                  value={dateFilterType}
                  onChange={(e) =>
                    setDateFilterType(e.target.value as DateFilterType)
                  }
                  className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="none">No date filter</option>
                  <option value="day">Specific day</option>
                  <option value="week">Specific week</option>
                  <option value="month">Specific month</option>
                  <option value="year">Specific year</option>
                </select>

                {dateFilterType === "day" && (
                  <input
                    type="text"
                    placeholder="MM/DD/YYYY"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                )}

                {dateFilterType === "week" && (
                  <input
                    type="week"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                )}

                {dateFilterType === "month" && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                )}

                {dateFilterType === "year" && (
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    placeholder="Enter year, e.g. 2026"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                )}

                <div className="mt-4 flex justify-end gap-2">

                  <button
                    type="button"
                    onClick={() => setShowFilter(false)}
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="px-4 py-4">ID</th>
              <th className="px-4 py-4">Type</th>
              <th className="px-4 py-4">Description</th>
              <th className="px-4 py-4">Location</th>
              <th className="px-4 py-4">Source</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Assigned To</th>
              <th className="px-4 py-4">Date Reported</th>
            </tr>
          </thead>

          <tbody>
            {filteredIncidentLogs.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  No incident logs found.
                </td>
              </tr>
            ) : (
              filteredIncidentLogs.map((incident) => {
                const dateValue = incident.reported_at ?? incident.created_at;

                return (
                  <tr
                    key={incident.incident_id}
                    className="border-b border-slate-200"
                  >
                    <td className="px-4 py-4">{incident.incident_id}</td>
                    <td className="px-4 py-4">{incident.incident_type}</td>
                    <td className="px-4 py-4">{incident.description}</td>
                    <td className="px-4 py-4">
                      {incident.location_name ||
                        `${incident.latitude ?? "-"}, ${
                          incident.longitude ?? "-"
                        }`}
                    </td>
                    <td className="px-4 py-4">{incident.source || "-"}</td>
                    <td className="px-4 py-4">{incident.status}</td>
                    <td className="px-4 py-4">
                      {incident.substation_name || "Not assigned"}
                    </td>
                    <td className="px-4 py-4">
                      {dateValue
                        ? formatMMDDYYYY(new Date(dateValue))
                        : "No date"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}