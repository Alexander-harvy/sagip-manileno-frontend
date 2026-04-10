import { api } from "./axios";

export interface AdminLoginPayload {
  contact_no: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  token: string;
  data: {
    admin_id: number;
    dept_id: number;
    first_name: string;
    last_name: string;
    contact_no: string;
    role: "ERU_ADMIN" | "SUBSTATION_ADMIN";
  };
}

export const loginAdmin = async (payload: AdminLoginPayload) => {
  const response = await api.post<AdminLoginResponse>("/api/admins/login", payload);
  
  return{
    token: response.data.token,
    admin: response.data.data,
  };
};