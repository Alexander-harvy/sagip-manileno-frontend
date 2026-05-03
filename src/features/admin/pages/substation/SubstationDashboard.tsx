import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import PageState from "@/components/common/PageState";
import { fetchIncidents } from "@/features/admin/api/incidents";
import { getResponders } from "@/features/admin/api/responders";
import { api } from "@/api/axios";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const incidentIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [18, 30],
  iconAnchor: [9, 30],
  popupAnchor: [1, -24],
  shadowSize: [30, 30],
});

type Incident = {
  incident_id: number;
  incident_type: string;
  description?: string;
  location_name?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: string;
  reported_at?: string;
  substation_id?: number | null;
  responder_id?: number | null;
  first_name?: string;
  last_name?: string;
  contact_no?: string;
};

function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, 16);
  }, [map, position]);

  return null;
}

export default function SubstationDashboard() {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [isResponderModalOpen, setIsResponderModalOpen] = useState(false);
  const [selectedResponder, setSelectedResponder] = useState("");
  const [actionError, setActionError] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
    refetchInterval: 5000,
  });

  const { data: responders = [] } = useQuery({
    queryKey: ["responders"],
    queryFn: getResponders,
  });

  const incidents: Incident[] = useMemo(() => {
    if (!data) return [];

    return data
      .map((item: any) => ({
        ...item,
        latitude:
          item.latitude !== null && item.latitude !== undefined
            ? Number(item.latitude)
            : null,
        longitude:
          item.longitude !== null && item.longitude !== undefined
            ? Number(item.longitude)
            : null,
      }))
      .sort((a: Incident, b: Incident) => {
        const aTime = a.reported_at
          ? new Date(a.reported_at).getTime()
          : a.incident_id;
        const bTime = b.reported_at
          ? new Date(b.reported_at).getTime()
          : b.incident_id;

        return aTime - bTime;
      });
  }, [data]);

  const assignedIncidents = incidents.filter((incident) => incident.substation_id);

  const waitingResponder = assignedIncidents.filter(
    (incident) => incident.status === "assigned_to_substation"
  );

  const inProgress = assignedIncidents.filter((incident) =>
    ["responder_assigned", "en_route", "on_scene"].includes(
      incident.status || ""
    )
  );

  const resolved = assignedIncidents.filter(
    (incident) => incident.status === "resolved"
  );

  const selectedPosition: [number, number] | null =
    selectedIncident?.latitude && selectedIncident?.longitude
      ? [Number(selectedIncident.latitude), Number(selectedIncident.longitude)]
      : null;

  const reporterName =
    selectedIncident?.first_name || selectedIncident?.last_name
      ? `${selectedIncident?.first_name ?? ""} ${
          selectedIncident?.last_name ?? ""
        }`.trim()
      : "Unknown";

  const getResponderName = (responderId?: number | null) => {
    if (!responderId) return "Not assigned";

    const responder = responders.find(
      (item: any) => Number(item.responder_id) === Number(responderId)
    );

    return responder
      ? `${responder.first_name} ${responder.last_name}`
      : `Responder ID: ${responderId}`;
  };

  const assignResponderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIncident || !selectedResponder) {
        throw new Error("Please select a responder.");
      }

      const response = await api.post("/api/incidents/status", {
        incident_id: selectedIncident.incident_id,
        status: "responder_assigned",
        responder_id: Number(selectedResponder),
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });

      setSelectedIncident((previous) =>
        previous
          ? {
              ...previous,
              status: "responder_assigned",
              responder_id: Number(selectedResponder),
            }
          : previous
      );

      setIsResponderModalOpen(false);
      setSelectedResponder("");
      setActionError("");
    },
    onError: (error: any) => {
      setActionError(
        error?.response?.data?.message || "Failed to assign responder."
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!selectedIncident) {
        throw new Error("No incident selected.");
      }

      const response = await api.post("/api/incidents/status", {
        incident_id: selectedIncident.incident_id,
        status,
        responder_id: selectedIncident.responder_id || null,
      });

      return response.data;
    },
    onSuccess: (_data, status) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });

      setSelectedIncident((previous) =>
        previous ? { ...previous, status } : previous
      );
      setActionError("");
    },
    onError: (error: any) => {
      setActionError(
        error?.response?.data?.message || "Failed to update status."
      );
    },
  });

  const handleNextStatus = () => {
    if (!selectedIncident) return;

    if (selectedIncident.status === "responder_assigned") {
      updateStatusMutation.mutate("en_route");
      return;
    }

    if (selectedIncident.status === "en_route") {
      updateStatusMutation.mutate("on_scene");
      return;
    }

    if (selectedIncident.status === "on_scene") {
      updateStatusMutation.mutate("resolved");
    }
  };

  const getStatusButtonLabel = () => {
    if (!selectedIncident) return "";

    switch (selectedIncident.status) {
      case "responder_assigned":
        return "En Route";
      case "en_route":
        return "On Scene";
      case "on_scene":
        return "Resolve";
      default:
        return "";
    }
  };

  if (isLoading) {
    return <PageState type="loading" message="Loading dashboard..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load data." />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Assigned" value={assignedIncidents.length} />
        <StatCard title="Waiting Responder" value={waitingResponder.length} />
        <StatCard title="In Progress" value={inProgress.length} />
        <StatCard title="Resolved" value={resolved.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">Assigned Incidents</h2>

          <div className="max-h-[520px] space-y-3 overflow-y-auto">
            {assignedIncidents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No assigned incidents.
              </div>
            ) : (
              assignedIncidents.map((incident) => {
                const isSelected =
                  selectedIncident?.incident_id === incident.incident_id;

                return (
                  <div
                    key={incident.incident_id}
                    onClick={() => {
                      setSelectedIncident(incident);
                      setActionError("");
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <h3 className="font-semibold">{incident.incident_type}</h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Incident ID: {incident.incident_id}
                    </p>

                    <p className="mt-2 text-sm text-gray-700">
                      {incident.location_name || "Unknown location"}
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      Status: {incident.status || "Unknown"}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">Incident Details</h2>

          {!selectedIncident ? (
            <div className="flex h-[360px] items-center justify-center text-sm text-gray-500">
              Select an incident to view details and location.
            </div>
          ) : (
            <>
              <div className="mb-4 space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold text-gray-900">
                    Description:
                  </span>{" "}
                  {selectedIncident.description || "No description"}
                </p>

                <p>
                  <span className="font-semibold text-gray-900">Location:</span>{" "}
                  {selectedIncident.location_name || "Unknown"}
                </p>

                <p>
                  <span className="font-semibold text-gray-900">Status:</span>{" "}
                  {selectedIncident.status || "Unknown"}
                </p>

                <p>
                  <span className="font-semibold text-gray-900">
                    Reported by:
                  </span>{" "}
                  {reporterName}
                </p>

                <p>
                  <span className="font-semibold text-gray-900">
                    Contact Number:
                  </span>{" "}
                  {selectedIncident.contact_no || "N/A"}
                </p>

                <p>
                  <span className="font-semibold text-gray-900">Responder:</span>{" "}
                  {getResponderName(selectedIncident.responder_id)}
                </p>

                {actionError && (
                  <p className="text-sm text-red-600">{actionError}</p>
                )}

                <div className="pt-2">
                  {selectedIncident.status === "assigned_to_substation" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedResponder("");
                        setActionError("");
                        setIsResponderModalOpen(true);
                      }}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Assign Responder
                    </button>
                  )}

                  {getStatusButtonLabel() && (
                    <button
                      type="button"
                      onClick={handleNextStatus}
                      disabled={updateStatusMutation.isPending}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updateStatusMutation.isPending
                        ? "Updating..."
                        : getStatusButtonLabel()}
                    </button>
                  )}
                </div>
              </div>

              <div className="h-[300px] overflow-hidden rounded-xl">
                {selectedPosition ? (
                  <MapContainer
                    center={selectedPosition}
                    zoom={16}
                    scrollWheelZoom
                    className="h-full w-full"
                  >
                    <MapUpdater position={selectedPosition} />

                    <TileLayer
                      attribution="&copy; OpenStreetMap"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker position={selectedPosition} icon={incidentIcon}>
                      <Popup>
                        <div>
                          <strong>{selectedIncident.incident_type}</strong>
                          <br />
                          {selectedIncident.location_name}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    No coordinates available for this incident.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {isResponderModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Assign Responder
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select a responder for Incident ID: {selectedIncident.incident_id}
            </p>

            <div className="mt-5">
              <label className="text-sm font-medium text-gray-700">
                Responder
              </label>

              <select
                value={selectedResponder}
                onChange={(event) => setSelectedResponder(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
              >
                <option value="">Select responder</option>

                {responders.map((responder: any) => (
                  <option
                    key={responder.responder_id}
                    value={responder.responder_id}
                  >
                    {responder.first_name} {responder.last_name}
                  </option>
                ))}
              </select>
            </div>

            {actionError && (
              <p className="mt-3 text-sm text-red-600">{actionError}</p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsResponderModalOpen(false);
                  setSelectedResponder("");
                  setActionError("");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => assignResponderMutation.mutate()}
                disabled={
                  assignResponderMutation.isPending || !selectedResponder
                }
                className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assignResponderMutation.isPending ? "Assigning..." : "Confirm"}
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
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-2 text-2xl font-semibold text-gray-900">{value}</h3>
    </div>
  );
}