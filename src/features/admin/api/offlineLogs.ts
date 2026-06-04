import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/axios";

export const getOfflineLogs = async () => {
  const res = await api.get("/api/offline-logs");
  return res.data.data ?? res.data;
};

export const useOfflineLogs = () => {
  return useQuery({
    queryKey: ["offline-logs"],
    queryFn: getOfflineLogs,
  });
};