import { useMemo } from "react";
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
  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
    refetchInterval: 5000,
  });

  const incidents: Incident[] = useMemo(() => {
    if (!data) return [];

    return data
      .filter((incident: Incident) => {
        const hasSubstation =
          incident.substation_id || incident.assigned_substation_id;

        const shouldBeInLogs =
          incident.status && incident.status !== "assigned_to_substation";

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

  if (isLoading) {
    return <PageState type="loading" message="Loading incident logs..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load incident logs." />;
  }

  return (
     <div className="min-h-screen bg-white p-6">
      <div>
        <div className="mb-5">
       <h1 className="text-2xl font-semibold text-black">
        Incident Logs
        </h1>
        </div>
      </div>
      

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead className="border-b bg-gray-50 text-sm text-black-600">
            <tr>
              <th className="px-5 py-4 font-semibold">ID</th>
              <th className="px-5 py-4 font-semibold">Type</th>
              <th className="px-5 py-4 font-semibold">Location</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Reported At</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-sm">
            {incidents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-gray-500"
                >
                  No incident logs yet.
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.incident_id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {incident.incident_id}
                  </td>

                  <td className="px-5 py-4 text-gray-700">
                    {incident.incident_type}
                  </td>

                  <td className="px-5 py-4 text-gray-700">
                    {incident.location_name || "Unknown location"}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`font-semibold ${getStatusStyles(
                        incident.status
                      )}`}
                    >
                      {getStatusLabel(incident.status)}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-gray-700">
                    {incident.reported_at
                      ? new Date(incident.reported_at).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}