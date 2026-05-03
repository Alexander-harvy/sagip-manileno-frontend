import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageState from "@/components/common/PageState";
import { StatusBadge } from "@/components/layout/ui/StatusBadge";
import { api } from "@/api/axios";
import { fetchIncidents } from "../../api/incidents";
import { fetchSubstations } from "../../api/substations";
import EruMap from "@/components/EruMap";

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
  latitude?: number | null;
  longitude?: number | null;
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function hasValidCoords(item: any) {
  return (
    item &&
    item.latitude !== null &&
    item.longitude !== null &&
    item.latitude !== undefined &&
    item.longitude !== undefined &&
    !Number.isNaN(Number(item.latitude)) &&
    !Number.isNaN(Number(item.longitude))
  );
}

export default function EruDashboard() {
  const [selectedIncident, setSelectedIncident] = useState<IncidentRow | null>(
    null
  );
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
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      location_name: item.location_name,
      source: item.source,
      status: item.status || "pending",
      created_at: item.created_at ?? item.reported_at,
      substation_id: item.substation_id ?? null,
      substation_name: item.substation_name ?? null,
      reporter_name: `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim(),
    }));
  }, [data]);

  const pendingIncidents = useMemo(() => {
    return incidents
      .filter((i) => !i.substation_id)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      });
  }, [incidents]);

  const nearestSubstation = useMemo(() => {
    if (!selectedIncident || !hasValidCoords(selectedIncident)) return null;

    let nearest: SubstationRow | null = null;
    let minDistance = Infinity;

    substations.forEach((substation: SubstationRow) => {
      if (!hasValidCoords(substation)) return;

      const distance = getDistance(
        Number(selectedIncident.latitude),
        Number(selectedIncident.longitude),
        Number(substation.latitude),
        Number(substation.longitude)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = substation;
      }
    });

    return nearest;
  }, [selectedIncident, substations]);

  const getSubstationDistanceText = (substation: SubstationRow) => {
    if (!selectedIncident) return "";

    if (!hasValidCoords(selectedIncident) || !hasValidCoords(substation)) {
      return "";
    }

    const distance = getDistance(
      Number(selectedIncident.latitude),
      Number(selectedIncident.longitude),
      Number(substation.latitude),
      Number(substation.longitude)
    );

    return `${distance.toFixed(2)} km`;
  };

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIncident || !selectedSubstation) {
        throw new Error("Missing incident or substation");
      }

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
    <div className="p-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* PENDING INCIDENTS */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-xl font-semibold">Pending Incidents</h2>
          </div>

          <div className="max-h-[620px] space-y-4 overflow-y-auto p-5">
            {pendingIncidents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No pending incidents.
              </div>
            ) : (
              pendingIncidents.map((incident, index) => (
                <IncidentCard
                  key={incident.incident_id}
                  index={index + 1}
                  incident={incident}
                  selected={
                    selectedIncident?.incident_id === incident.incident_id
                  }
                  onSelect={() => setSelectedIncident(incident)}
                  onAssign={() => {
                    setSelectedIncident(incident);
                    setIsAssignOpen(true);
                    setSelectedSubstation("");
                    setAssignError("");
                  }}
                />
              ))
            )}
          </div>
        </section>

        {/* MAP */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-xl font-semibold">Map</h2>
          </div>

          <div className="p-5">
            <div className="h-[620px] overflow-hidden rounded-2xl border border-gray-200">
              <EruMap
                selectedIncident={selectedIncident}
                substations={substations}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ASSIGN MODAL */}
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
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">Select Substation</option>

                {substations.map((s: SubstationRow) => {
                  const isRecommended =
                    nearestSubstation?.substation_id === s.substation_id;

                  const distanceText = getSubstationDistanceText(s);

                  return (
                    <option key={s.substation_id} value={s.substation_id}>
                      {s.substation_name}
                      {isRecommended
                        ? ` (Recommended${
                            distanceText ? ` - ${distanceText}` : ""
                          })`
                        : distanceText
                        ? ` - ${distanceText}`
                        : ""}
                    </option>
                  );
                })}
              </select>

              {assignError && (
                <p className="mt-2 text-sm text-red-500">{assignError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAssignOpen(false);
                  setSelectedSubstation("");
                  setAssignError("");
                }}
                className="rounded-lg bg-gray-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => assignMutation.mutate()}
                disabled={!selectedSubstation || assignMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
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

function IncidentCard({ index, incident, selected, onSelect, onAssign }: any) {
  return (
    <div className="flex gap-4">
      <div className="pt-7 text-sm font-medium text-gray-500">{index}</div>

      <div
        onClick={onSelect}
        className={`flex-1 cursor-pointer rounded-2xl border p-4 transition hover:bg-gray-50 ${
          selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              {incident.incident_type}
            </h3>

            <p className="mt-2 text-sm text-gray-700">
              {incident.description || "-"}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p>{incident.location_name || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Reported at</p>
                <p>
                  {incident.created_at
                    ? new Date(incident.created_at).toLocaleString()
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Name</p>
                <p>{incident.reporter_name || "-"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Source</p>
                <p>{incident.source || "-"}</p>
              </div>
            </div>
          </div>

          <div className="flex min-w-[90px] flex-col items-end justify-between">
            <StatusBadge status={incident.status} />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAssign();
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}