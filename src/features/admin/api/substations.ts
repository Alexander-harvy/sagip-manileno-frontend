import { api } from "@/api/axios";

export const fetchSubstations = async () => {
  const res = await api.get("/api/substations");
  return res.data.data ?? [];
};