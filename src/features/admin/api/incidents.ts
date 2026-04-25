import { api } from "@/api/axios";

export const fetchIncidents = async () => {
  const res = await api.get("/api/incidents");
  return res.data.data ?? res.data;
};

export const assignIncident = async (
  incidentId: number,
  substationId: number
) => {
  const res = await api.post("/api/incidents/assign", {
    incident_id: incidentId,
    substation_id: substationId,
  });

  return res.data;
};