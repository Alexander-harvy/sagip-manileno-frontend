import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchIncidents } from "@/features/admin/api/incidents";
import { getResponders } from "@/features/admin/api/responders";
import { api } from "@/api/axios";
import PageState from "@/components/common/PageState";
import { StatusBadge } from "@/components/layout/ui/StatusBadge";

export default function SubstationDashboard() {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isResponderModalOpen, setIsResponderModalOpen] = useState(false);
  const [selectedResponder, setSelectedResponder] = useState("");
  const [actionError, setActionError] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const { data: responders = [] } = useQuery({
    queryKey: ["responders"],
    queryFn: getResponders,
  });

  const incidents = useMemo(() => {
    if (!data) return [];

    return data.map((item: any) => ({
      ...item,
      reporter_name: `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim(),
    }));
  }, [data]);

  // Substation dashboard should not show pending incidents
  const assignedIncidents = incidents.filter((i: any) => i.substation_id);

  const waitingResponder = assignedIncidents.filter(
    (i: any) => i.status === "assigned_to_substation"
  );

  const inProgress = assignedIncidents.filter((i: any) =>
    ["responder_assigned", "en_route", "on_scene"].includes(i.status)
  );

  const resolved = assignedIncidents.filter(
    (i: any) => i.status === "resolved"
  );

  const getResponderName = (id: number | null) => {
    if (!id) return "Not assigned";

    const responder = responders.find(
      (r: any) => Number(r.responder_id) === Number(id)
    );

    return responder
      ? `${responder.first_name} ${responder.last_name}`
      : `ID ${id}`;
  };

  const assignResponderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIncident || !selectedResponder) {
        throw new Error("Please select a responder.");
      }

      const res = await api.post("/api/incidents/status", {
        incident_id: selectedIncident.incident_id,
        status: "responder_assigned",
        responder_id: Number(selectedResponder),
      });

      return res.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });

      setSelectedIncident((prev: any) =>
        prev
          ? {
              ...prev,
              status: "responder_assigned",
              responder_id: Number(selectedResponder),
            }
          : prev
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
      if (!selectedIncident?.responder_id) {
        throw new Error("Responder is required before updating status.");
      }

      const res = await api.post("/api/incidents/status", {
        incident_id: selectedIncident.incident_id,
        status,
        responder_id: selectedIncident.responder_id,
      });

      return res.data;
    },

    onSuccess: (_data, status) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });

      setSelectedIncident((prev: any) =>
        prev ? { ...prev, status } : prev
      );

      setActionError("");
    },

    onError: (error: any) => {
      setActionError(
        error?.response?.data?.message || "Failed to update status."
      );
    },
  });

  const openResponderModal = () => {
    setSelectedResponder("");
    setActionError("");
    setIsResponderModalOpen(true);
  };

  if (isLoading) return <PageState type="loading" message="Loading..." />;
  if (isError) return <PageState type="error" message="Error loading data." />;

  return (
    <div className="space-y-6 p-6">
      {/* TOP CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Assigned" value={assignedIncidents.length} />
        <StatCard title="Waiting Responder" value={waitingResponder.length} />
        <StatCard title="In Progress" value={inProgress.length} />
        <StatCard title="Resolved" value={resolved.length} />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* LEFT PANEL */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm xl:col-span-3">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Assigned Incidents
            </h2>
          </div>

          <div className="max-h-[520px] space-y-4 overflow-y-auto p-5">
            {assignedIncidents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No assigned incidents.
              </div>
            ) : (
              assignedIncidents.map((incident: any) => (
                <div
                  key={incident.incident_id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`cursor-pointer rounded-xl border p-4 transition hover:bg-gray-50 ${
                    selectedIncident?.incident_id === incident.incident_id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">
                    {incident.incident_type}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Incident ID: {incident.incident_id}
                  </p>

                  <p className="mt-3 text-sm text-gray-700">
                    {incident.location_name || "No location provided"}
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    Responder: {getResponderName(incident.responder_id)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Incident Details
            </h2>
          </div>

          <div className="p-5">
            {!selectedIncident ? (
              <p className="text-sm text-gray-500">
                Select an incident to view details.
              </p>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedIncident.incident_type}
                    </h3>
                    <p className="text-gray-500">
                      Incident ID: {selectedIncident.incident_id}
                    </p>
                  </div>

                  <StatusBadge status={selectedIncident.status} />
                </div>

                <p>{selectedIncident.description}</p>

                <p>
                  <span className="font-semibold text-gray-900">Location:</span>{" "}
                  {selectedIncident.location_name || "-"}
                </p>

                <p>
                  <span className="font-semibold text-gray-900">
                    Reported at:
                  </span>{" "}
                  {selectedIncident.reported_at
                    ? new Date(selectedIncident.reported_at).toLocaleString()
                    : "-"}
                </p>

                <p>
                  <span className="font-semibold text-gray-900">Name:</span>{" "}
                  {selectedIncident.reporter_name || "-"}
                </p>

                <p>
                  <span className="font-semibold text-gray-900">Responder:</span>{" "}
                  {getResponderName(selectedIncident.responder_id)}
                </p>

                {actionError && (
                  <p className="text-sm text-red-500">{actionError}</p>
                )}

                <div className="pt-1">
                  {selectedIncident.status === "assigned_to_substation" && (
                    <button
                      type="button"
                      onClick={openResponderModal}
                      className="rounded-md bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                    >
                      Assign Responder
                    </button>
                  )}

                  {selectedIncident.status === "responder_assigned" && (
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate("en_route")}
                      disabled={updateStatusMutation.isPending}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      En Route
                    </button>
                  )}

                  {selectedIncident.status === "en_route" && (
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate("on_scene")}
                      disabled={updateStatusMutation.isPending}
                      className="rounded-md bg-orange-600 px-3 py-1 text-xs text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      On Scene
                    </button>
                  )}

                  {selectedIncident.status === "on_scene" && (
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate("resolved")}
                      disabled={updateStatusMutation.isPending}
                      className="rounded-md bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  )}
                </div>

                <div className="mt-3 flex h-[250px] items-center justify-center rounded-xl border border-gray-200 text-sm text-gray-500">
                  Map placeholder
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ASSIGN RESPONDER MODAL */}
      {isResponderModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Assign Responder
            </h2>

            <div className="mt-4 text-sm text-gray-500">
              <p>Incident ID: {selectedIncident.incident_id}</p>
              <p>Type: {selectedIncident.incident_type}</p>
              <p>Location: {selectedIncident.location_name || "-"}</p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Responder
              </label>

              <select
                value={selectedResponder}
                onChange={(e) => setSelectedResponder(e.target.value)}
                disabled={assignResponderMutation.isPending}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select Responder</option>

                {responders.map((responder: any) => (
                  <option
                    key={responder.responder_id}
                    value={responder.responder_id}
                  >
                    {responder.first_name} {responder.last_name}
                  </option>
                ))}
              </select>

              {actionError && (
                <p className="mt-2 text-sm text-red-500">{actionError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (assignResponderMutation.isPending) return;
                  setIsResponderModalOpen(false);
                  setSelectedResponder("");
                  setActionError("");
                }}
                disabled={assignResponderMutation.isPending}
                className="rounded-lg bg-gray-300 px-4 py-2 text-sm disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => assignResponderMutation.mutate()}
                disabled={
                  assignResponderMutation.isPending || !selectedResponder
                }
                className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
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

function StatCard({ title, value }: any) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text--500">{title}</p>
      <h3 className="mt-2 text-2xl font-semibold text-gray-900">{value}</h3>
    </div>
  );
}