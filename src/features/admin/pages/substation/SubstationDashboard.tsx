import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import PageState from "@/components/common/PageState";
import { fetchIncidents } from "@/features/admin/api/incidents";
import { getResponders } from "@/features/admin/api/responders";
import { api } from "@/api/axios";

const incidentIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [32, 32],
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

function getStatusLabel(status?: string) {
  switch (status) {
    case "assigned_to_substation":
      return "Waiting Responder";
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
    case "assigned_to_substation":
      return "text-yellow-600";
    case "responder_assigned":
      return "text-blue-600";
    case "en_route":
      return "text-cyan-600";
    case "on_scene":
      return "text-red-600";
    case "resolved":
      return "text-green-600";
    default:
      return "text-slate-600";
  }
}

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
  const [successMessage, setSuccessMessage] = useState("");

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

        return bTime - aTime;
      });
  }, [data]);

  const queueIncidents = incidents.filter(
    (incident) =>
      incident.substation_id &&
      incident.status === "assigned_to_substation"
  );

  const waitingResponder = queueIncidents.filter(
    (incident) => !incident.responder_id
  );

  const inProgress = incidents.filter(
    (incident) =>
      incident.substation_id &&
      ["responder_assigned", "en_route", "on_scene"].includes(
        incident.status || ""
      )
  );

  const resolved = incidents.filter(
    (incident) => incident.substation_id && incident.status === "resolved"
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

      const response = await api.post("/api/incidents/assign-responder", {
        incident_id: selectedIncident.incident_id,
        responder_id: Number(selectedResponder),
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["responders"] });

      setSelectedIncident(null);
      setSuccessMessage("Responder assigned successfully.");
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

  if (isLoading) {
    return <PageState type="loading" message="Loading dashboard..." />;
  }

  if (isError) {
    return <PageState type="error" message="Failed to load data." />;
  }

  return (
    <div className="min-h-screen bg-white p-6 select-none">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Substation Emergency Dashboard
        </h1>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {successMessage}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Pending Assignment"
          value={waitingResponder.length}
          valueClassName="text-yellow-600"
        />

        <StatCard
          title="Active Response"
          value={inProgress.length}
          valueClassName="text-blue-600"
        />

        <StatCard
          title="Resolved"
          value={resolved.length}
          valueClassName="text-green-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Incident Queue
            </h2>

            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
              Live
            </span>
          </div>

          <div className="max-h-[520px] space-y-3 overflow-y-auto">
            {queueIncidents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No incidents assigned to this substation.
              </div>
            ) : (
              queueIncidents.map((incident) => {
                const isSelected =
                  selectedIncident?.incident_id === incident.incident_id;

                return (
                  <div
                    key={incident.incident_id}
                    onClick={() => {
                      setSelectedIncident(incident);
                      setActionError("");
                      setSuccessMessage("");
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {incident.incident_type}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Incident ID: {incident.incident_id}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-semibold ${getStatusStyles(
                          incident.status
                        )}`}
                      >
                        {getStatusLabel(incident.status)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-700">
                      {incident.location_name || "Unknown location"}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      Responder:{" "}
                      <span className="font-medium">
                        {getResponderName(incident.responder_id)}
                      </span>
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Incident Details
          </h2>

          {!selectedIncident ? (
            <div className="flex h-[360px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
              Select an incident to view details and location.
            </div>
          ) : (
            <>
              <div className="mb-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">Status:</span>

                  <span
                    className={`text-sm font-semibold ${getStatusStyles(
                      selectedIncident.status
                    )}`}
                  >
                    {getStatusLabel(selectedIncident.status)}
                  </span>
                </div>

                <p>
                  <span className="font-semibold text-slate-900">
                    Description:
                  </span>{" "}
                  {selectedIncident.description || "No description"}
                </p>

                <p>
                  <span className="font-semibold text-slate-900">Location:</span>{" "}
                  {selectedIncident.location_name || "Unknown"}
                </p>

                <p>
                  <span className="font-semibold text-slate-900">
                    Reported by:
                  </span>{" "}
                  {reporterName}
                </p>

                <p>
                  <span className="font-semibold text-slate-900">
                    Contact Number:
                  </span>{" "}
                  {selectedIncident.contact_no || "N/A"}
                </p>

                <p>
                  <span className="font-semibold text-slate-900">
                    Responder:
                  </span>{" "}
                  {getResponderName(selectedIncident.responder_id)}
                </p>

                {actionError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {actionError}
                  </div>
                )}

                <div className="pt-2">
                  {!selectedIncident.responder_id &&
                  selectedIncident.status === "assigned_to_substation" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedResponder("");
                        setActionError("");
                        setSuccessMessage("");
                        setIsResponderModalOpen(true);
                      }}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Assign Responder
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="h-[300px] overflow-hidden rounded-xl border border-slate-200">
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
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
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
            <h2 className="text-lg font-semibold text-slate-900">
              Assign Responder
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a responder for Incident ID: {selectedIncident.incident_id}
            </p>

            <div className="mt-5">
              <label className="text-sm font-medium text-slate-700">
                Responder
              </label>

              <select
                value={selectedResponder}
                onChange={(event) => setSelectedResponder(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
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

              {responders.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  No responders available for this substation.
                </p>
              )}
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
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => assignResponderMutation.mutate()}
                disabled={
                  assignResponderMutation.isPending || !selectedResponder
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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

function StatCard({
  title,
  value,
  valueClassName,
}: {
  title: string;
  value: number;
  valueClassName: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>

      <p className={`mt-1 text-2xl font-semibold ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}