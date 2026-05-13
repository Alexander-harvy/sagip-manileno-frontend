import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageState from "@/components/common/PageState";
import { fetchIncidents } from "../../api/incidents";

type Incident = {
  incident_id: number;
  incident_type: string;
  location_name?: string;
  status?: string;
  responder_id?: number | null;
  first_name?: string;
  last_name?: string;
  reported_at?: string;
  substation_id?: number | null;
  assigned_substation_id?: number | null;
};

type StatusFilter = "all" | "assigned" | "active" | "resolved";
type DateFilterType = "none" | "day" | "week" | "month" | "year";

function getStatusLabel(status?: string) {
  switch (status) {
    case "responder_assigned":
      return "Responder Assigned";
    case "en_route":
      return "En Route";
    case "on_scene":
      return "On Scene";
    case "resolved":
      return "Resolved";
    default:
      return "Unknown";
  }
}

function getStatusStyles(status?: string) {
  switch (status) {
    case "responder_assigned":
      return "text-blue-600";
    case "en_route":
      return "text-cyan-600";
    case "on_scene":
      return "text-red-600";
    case "resolved":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
}

export default function SubstationIncidentsPage() {
  const [showFilter, setShowFilter] = useState(false);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [dateFilterType, setDateFilterType] =
    useState<DateFilterType>("none");

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
    refetchInterval: 5000,
  });

  const formatLocalDate = (date: Date) =>
    date.toLocaleDateString("en-CA");

  const formatDateTime = (value?: string | null) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString();
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

    const januaryFourthDay =
      januaryFourth.getDay() || 7;

    const weekStart = new Date(januaryFourth);

    weekStart.setDate(
      januaryFourth.getDate() -
        januaryFourthDay +
        1 +
        (week - 1) * 7
    );

    const weekEnd = new Date(weekStart);

    weekEnd.setDate(weekStart.getDate() + 6);

    return { weekStart, weekEnd };
  };

  const incidentLogs: Incident[] = useMemo(() => {
    if (!data) return [];

    return data
      .filter((incident: Incident) => {
        const hasSubstation =
          incident.substation_id ||
          incident.assigned_substation_id;

        const shouldBeInLogs =
          incident.status &&
          incident.status !==
            "assigned_to_substation";

        return hasSubstation && shouldBeInLogs;
      })
      .sort((a: Incident, b: Incident) => {
        const aTime = a.reported_at
          ? new Date(a.reported_at).getTime()
          : a.incident_id;

        const bTime = b.reported_at
          ? new Date(b.reported_at).getTime()
          : b.incident_id;

        return bTime - aTime;
      });
  }, [data]);

  const dateFilteredIncidentLogs = useMemo(() => {
    return incidentLogs.filter((incident) => {
      if (!incident.reported_at) return true;

      const incidentDate = new Date(
        incident.reported_at
      );

      if (dateFilterType === "day" && selectedDate) {
        const parsedDate =
          parseMMDDYYYY(selectedDate);

        if (!parsedDate) return true;

        return (
          formatLocalDate(incidentDate) ===
          formatLocalDate(parsedDate)
        );
      }

      if (dateFilterType === "week" && selectedWeek) {
        const { weekStart, weekEnd } =
          getWeekRange(selectedWeek);

        return (
          incidentDate >= weekStart &&
          incidentDate <= weekEnd
        );
      }

      if (
        dateFilterType === "month" &&
        selectedMonth
      ) {
        return (
          formatLocalDate(incidentDate).slice(
            0,
            7
          ) === selectedMonth
        );
      }

      if (
        dateFilterType === "year" &&
        selectedYear
      ) {
        return (
          incidentDate
            .getFullYear()
            .toString() === selectedYear
        );
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

  const filteredIncidentLogs = useMemo(() => {
    return dateFilteredIncidentLogs.filter(
      (incident) => {
        const status = incident.status || "";

        return (
          statusFilter === "all" ||
          (statusFilter === "assigned" &&
            status ===
              "responder_assigned") ||
          (statusFilter === "active" &&
            ["en_route", "on_scene"].includes(
              status
            )) ||
          (statusFilter === "resolved" &&
            status === "resolved")
        );
      }
    );
  }, [
    dateFilteredIncidentLogs,
    statusFilter,
  ]);

  const resetFilters = () => {
    setStatusFilter("all");
    setDateFilterType("none");
    setSelectedDate("");
    setSelectedWeek("");
    setSelectedMonth("");
    setSelectedYear("");
  };

  if (isLoading) {
    return (
      <PageState
        type="loading"
        message="Loading incident logs..."
      />
    );
  }

  if (isError) {
    return (
      <PageState
        type="error"
        message="Failed to load incident logs."
      />
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-black">
          Incident Logs
        </h1>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-900">
            {filteredIncidentLogs.length}
          </span>{" "}
          incident log(s)
        </p>

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setShowFilter((prev) => !prev)
            }
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Add filter
          </button>

          {showFilter && (
            <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Filter by status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter
                  )
                }
                className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">
                  All
                </option>

                <option value="assigned">
                  Responder Assigned
                </option>

                <option value="active">
                  Active Response
                </option>

                <option value="resolved">
                  Resolved
                </option>
              </select>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Filter by date
              </label>

              <select
                value={dateFilterType}
                onChange={(event) =>
                  setDateFilterType(
                    event.target
                      .value as DateFilterType
                  )
                }
                className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="none">
                  No date filter
                </option>

                <option value="day">
                  Specific day
                </option>

                <option value="week">
                  Specific week
                </option>

                <option value="month">
                  Specific month
                </option>

                <option value="year">
                  Specific year
                </option>
              </select>

              {dateFilterType === "day" && (
                <input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={selectedDate}
                  onChange={(event) =>
                    setSelectedDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              )}

              {dateFilterType === "week" && (
                <input
                  type="week"
                  value={selectedWeek}
                  onChange={(event) =>
                    setSelectedWeek(
                      event.target.value
                    )
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              )}

              {dateFilterType === "month" && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) =>
                    setSelectedMonth(
                      event.target.value
                    )
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              )}

              {dateFilterType === "year" && (
                <input
                  type="number"
                  placeholder="2026"
                  value={selectedYear}
                  onChange={(event) =>
                    setSelectedYear(
                      event.target.value
                    )
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    setShowFilter(false);
                  }}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowFilter(false)
                  }
                  className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead className="border-b bg-gray-50 text-sm text-black">
            <tr>
              <th className="px-5 py-4 font-semibold">
                ID
              </th>

              <th className="px-5 py-4 font-semibold">
                Type
              </th>

              <th className="px-5 py-4 font-semibold">
                Location
              </th>

              <th className="px-5 py-4 font-semibold">
                Status
              </th>

              <th className="px-5 py-4 font-semibold">
                Reported At
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredIncidentLogs.length ===
            0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-gray-500"
                >
                  No incident logs found.
                </td>
              </tr>
            ) : (
              filteredIncidentLogs.map(
                (incident) => (
                  <tr
                    key={
                      incident.incident_id
                    }
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {
                        incident.incident_id
                      }
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {
                        incident.incident_type
                      }
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {incident.location_name ||
                        "Unknown location"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`font-semibold ${getStatusStyles(
                          incident.status
                        )}`}
                      >
                        {getStatusLabel(
                          incident.status
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {formatDateTime(
                        incident.reported_at
                      )}
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}