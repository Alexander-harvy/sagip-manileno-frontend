import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  reporter_name?: string;
};

type SubstationRow = {
  substation_id: number;
  substation_name: string;
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
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
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
      reporter_name: `${item.first_name} ${item.last_name}`,
    }));
  }, [data]);

  const stats = useMemo(() => {
    return {
      total: incidents.length,
      pending: incidents.filter((i) => !i.substation_id).length,
      assigned: incidents.filter((i) => i.substation_id).length,
      resolved: incidents.filter((i) => i.status === "resolved").length,
    };
  }, [incidents]);

  const unassignedIncidents = incidents.filter((i) => !i.substation_id);

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIncident || !selectedSubstation) throw new Error();

      const res = await api.post("/api/incidents/assign", {
        incident_id: selectedIncident.incident_id,
        substation_id: Number(selectedSubstation),
      });

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setIsAssignOpen(false);
      setSelectedIncident(null);
      setSelectedSubstation("");
      setAssignError("");
    },
    onError: () => {
      setAssignError("Failed to assign incident.");
    },
  });

  if (isLoading) return <PageState type="loading" message="Loading..." />;
  if (isError) return <PageState type="error" message="Error loading data." />;

  return (
    <div className="space-y-6 p-6">
      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Incidents" value={stats.total} />
        <StatCard title="Pending Alerts" value={stats.pending} />
        <StatCard title="Assigned" value={stats.assigned} />
        <StatCard title="Resolved" value={stats.resolved} />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* INCIDENTS */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm xl:col-span-3">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-xl font-semibold">Pending Incidents</h2>
          </div>

          {/* ✅ SCROLL FIX */}
          <div className="max-h-[560px] overflow-y-auto space-y-4 p-5">
            {unassignedIncidents.map((incident) => (
              <IncidentCard
                key={incident.incident_id}
                incident={incident}
                onAssign={() => {
                  setSelectedIncident(incident);
                  setIsAssignOpen(true);
                }}
              />
            ))}
          </div>
        </section>

        {/* MAP (UNCHANGED) */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-xl font-semibold">Map</h2>
          </div>

          <div className="p-5">
            <div className="flex h-[560px] items-center justify-center rounded-2xl border border-dashed border-gray-300">
              Map placeholder
            </div>
          </div>
        </section>
      </div>

      {/* MODAL (RESTORED) */}
      {isAssignOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Assign Incident</h2>

            <div className="mt-4 text-sm text-gray-500">
              <p>Incident ID: {selectedIncident.incident_id}</p>
              <p>Type: {selectedIncident.incident_type}</p>
              <p>
                Location:{" "}
                {selectedIncident.location_name ||
                  `${selectedIncident.latitude}, ${selectedIncident.longitude}`}
              </p>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Substation</label>

              <select
                value={selectedSubstation}
                onChange={(e) => setSelectedSubstation(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                <option value="">Select Substation</option>
                {substations.map((s: SubstationRow) => (
                  <option key={s.substation_id} value={s.substation_id}>
                    {s.substation_name}
                  </option>
                ))}
              </select>

              {assignError && (
                <p className="text-red-500 text-sm mt-2">{assignError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setIsAssignOpen(false)}>Cancel</button>
              <button
                onClick={() => assignMutation.mutate()}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IncidentCard({ incident, onAssign }: any) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="flex justify-between">
        <h3 className="font-semibold">{incident.incident_type}</h3>
        <StatusBadge status={incident.status} />
      </div>

      <p className="mt-2 text-sm">{incident.description}</p>

      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <InfoItem label="Location" value={incident.location_name} />
        <InfoItem label="Source" value={incident.source} />

        {/* ✅ FINAL FORMAT */}
        <InfoItem
          label="Reported at"
          value={
            <>
              {incident.created_at
                ? new Date(incident.created_at).toLocaleString()
                : "-"}
              <br />
              <span className="text-sm text-black">
                Name: {incident.reporter_name || "-"}
              </span>
            </>
          }
        />

        <InfoItem
          label="Assigned To"
          value={incident.substation_name || "Not assigned"}
        />
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={onAssign}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Assign
        </button>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: any) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function StatCard({ title, value }: any) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>
    </div>
  );
}