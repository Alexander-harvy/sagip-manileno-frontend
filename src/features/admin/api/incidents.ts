import { api } from "@/api/axios";

export const fetchIncidents = async () => {
  const res = await api.get("/api/incidents");
  return res.data.data ?? res.data;
};