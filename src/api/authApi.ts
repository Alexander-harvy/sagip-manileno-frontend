import { api } from "./axios";

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  token: string;
  data: {
    admin_id: number;
    dept_id: number;
    substation_id: number | null;
    username: string;
    email: string | null;
    first_name: string;
    last_name: string;
    contact_no: string | null;
    role: "ERU_ADMIN" | "SUBSTATION_ADMIN";
  };
}

export const loginAdmin = async (payload: AdminLoginPayload) => {
  const response = await api.post<AdminLoginResponse>(
    "/api/admins/login",
    payload
  );

  return {
    token: response.data.token,
    admin: response.data.data,
  };
};