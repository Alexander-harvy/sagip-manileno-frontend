import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import PageState from "@/components/common/PageState";
import { StatusBadge } from "@/components/layout/ui/StatusBadge";
import { api } from "@/api/axios";
import { fetchIncidents } from "../../api/incidents";
import { fetchSubstations } from "../../api/substations";

type IncidentRow = {
  incident_id: number;
  incident_type: string;
  description: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  source: string;
  status: string;
  created_at?: string;
  substation_id?: number | null;
  substation_name?: string | null;
};

type SubstationRow = {
  substation_id: number;
  department_id: number;
  substation_name: string;
  address?: string;
  is_active?: number;
};

export default function EruDashboard() {
  const [selectedIncident, setSelectedIncident] = useState<IncidentRow | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedSubstation, setSelectedSubstation] = useState("");
  const [assignError, setAssignError] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
  });

  const { data: substations = [] } = useQuery({
    queryKey: ["substations"],
    queryFn: fetchSubstations,
  });

  const incidents: IncidentRow[] = useMemo(() => {
    if (!data) return [];

    return data.map((item: any) => ({
      incident_id: item.incident_id,
      incident_type: item.incident_type,
      description: item.description,
      latitude: item.latitude,
      longitude: item.longitude,
      location_name: item.location_name,
      source: item.source,
      status: item.status || "pending",
      created_at: item.created_at ?? item.reported_at,
      substation_id: item.substation_id ?? null,
      substation_name: item.substation_name ?? null,
    }));
  }, [data]);

  const stats = useMemo(() => {
    const total = incidents.length;

    const pending = incidents.filter(
      (incident) =>
        incident.status?.toLowerCase() === "pending" ||
        incident.status?.toLowerCase() === "new"
    ).length;

    const assigned = incidents.filter(
      (incident) =>
        incident.status?.toLowerCase() === "assigned" ||
        incident.status?.toLowerCase() === "ongoing" ||
        incident.status?.toLowerCase() === "assigned_to_substation"
    ).length;

    const resolved = incidents.filter(
      (incident) => incident.status?.toLowerCase() === "resolved"
    ).length;

    return {
      total,
      pending,
      assigned,
      resolved,
    };
  }, [incidents]);

  const unassignedIncidents = incidents.filter(
  (incident) =>
    !incident.substation_id &&
    incident.status?.toLowerCase() !== "assigned_to_substation" &&
    incident.status?.toLowerCase() !== "assigned"
);

const recentIncidents = unassignedIncidents.slice(0, 10);

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIncident?.incident_id) {
        throw new Error("No incident selected.");
      }

      if (!selectedSubstation) {
        throw new Error("Please select a substation.");
      }

      const payload = {
        incident_id: selectedIncident.incident_id,
        substation_id: Number(selectedSubstation),
      };

      const res = await api.post("/api/incidents/assign", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setIsAssignOpen(false);
      setSelectedIncident(null);
      setSelectedSubstation("");
      setAssignError("");
    },
    onError: (error: any) => {
      setAssignError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to assign incident."
      );
    },
  });

  const handleOpenAssign = (incident: IncidentRow) => {
    setSelectedIncident(incident);
    setSelectedSubstation("");
    setAssignError("");
    setIsAssignOpen(true);
  };

  const handleCloseAssign = () => {
    setSelectedIncident(null);
    setSelectedSubstation("");
    setAssignError("");
    setIsAssignOpen(false);
  };

  if (isLoading) {
    return <PageState type="loading" message="Loading dashboard..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load dashboard data." />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Incidents" value={stats.total} />
        <StatCard title="Pending Alerts" value={stats.pending} />
        <StatCard title="Assigned" value={stats.assigned} />
        <StatCard title="Resolved" value={stats.resolved} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section className="xl:col-span-3 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Incidents</h2>
          </div>

          <div className="max-h-[560px] space-y-4 overflow-y-auto p-5">
            {recentIncidents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No incidents available.
              </div>
            ) : (
              recentIncidents.map((incident) => (
                <IncidentCard
                  key={incident.incident_id}
                  incident={incident}
                  onAssign={() => handleOpenAssign(incident)}
                />
              ))
            )}
          </div>
        </section>

        <section className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Map</h2>
          </div>

          <div className="p-5">
            <div className="flex h-[560px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50">
              <div className="text-center">
                <p className="text-base font-medium text-gray-700">Map placeholder</p>
                <p className="mt-1 text-sm text-gray-500">
                  You can connect Google Maps here later.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isAssignOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Assign Incident
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Incident ID: {selectedIncident.incident_id}
            </p>
            <p className="text-sm text-gray-500">
              Type: {selectedIncident.incident_type}
            </p>
            <p className="text-sm text-gray-500">
              Location:{" "}
              {selectedIncident.location_name ||
                `${selectedIncident.latitude}, ${selectedIncident.longitude}`}
            </p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Substation
              </label>

              <select
                value={selectedSubstation}
                onChange={(e) => setSelectedSubstation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select substation</option>

                {substations.map((sub: SubstationRow) => (
                  <option key={sub.substation_id} value={sub.substation_id}>
                    {sub.substation_name}
                  </option>
                ))}
              </select>

              {assignError && (
                <p className="mt-2 text-sm text-red-500">{assignError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleCloseAssign}
                disabled={assignMutation.isPending}
                className="rounded-lg bg-gray-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending || !selectedSubstation}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {assignMutation.isPending ? "Assigning..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="mt-2 text-3xl font-semibold text-gray-900">{value}</h3>
    </div>
  );
}

function IncidentCard({
  incident,
  onAssign,
}: {
  incident: IncidentRow;
  onAssign: () => void;
}) {
  const alreadyAssigned =
    incident.status?.toLowerCase() === "assigned_to_substation" ||
    incident.status?.toLowerCase() === "assigned" ||
    Boolean(incident.substation_id);

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {incident.incident_type || "Incident"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Incident ID: {incident.incident_id}
          </p>
        </div>

        <StatusBadge status={incident.status} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-gray-700">
        {incident.description || "No description provided."}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoItem
          label="Location"
          value={
            incident.location_name ||
            `${incident.latitude ?? "-"}, ${incident.longitude ?? "-"}`
          }
        />
        <InfoItem label="Source" value={incident.source || "-"} />
        <InfoItem
          label="Reported"
          value={incident.created_at ? formatDateTime(incident.created_at) : "-"}
        />
        <InfoItem
          label="Assigned To"
          value={incident.substation_name || "Not assigned"}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onAssign}
          disabled={alreadyAssigned}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {alreadyAssigned ? "Assigned" : "Assign"}
        </button>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-700">{value}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}