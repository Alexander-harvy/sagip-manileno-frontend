import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/axios";

export const getResponders = async () => {
  const res = await api.get("/api/responders");
  return res.data.data ?? res.data;
};

export const useResponders = () => {
  return useQuery({
    queryKey: ["responders"],
    queryFn: getResponders,
  });
};