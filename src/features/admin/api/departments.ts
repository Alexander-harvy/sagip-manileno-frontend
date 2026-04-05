import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/axios";

export const getDepartments = async () => {
  const res = await api.get("/api/departments");
  return res.data.data ?? res.data;
};

export const useDepartments = () => {
  return useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });
};