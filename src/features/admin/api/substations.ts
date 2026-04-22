import { api } from "@/api/axios";

export const fetchSubstations = async () => {
  const res = await api.get("/api/substations");

  console.log("API RESPONSE:", res.data); // <-- ADD THIS

  return res.data.data ?? [];
};