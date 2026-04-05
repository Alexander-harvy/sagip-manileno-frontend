import { api } from "./axios";

export interface AdminLoginPayload {
  contact_no: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    admin: {
      admin_id: number;
      dept_id: number;
      first_name: string;
      last_name: string;
      contact_no: string;
    };
  };
}

export const loginAdmin = async (payload: AdminLoginPayload) => {
  const response = await api.post<AdminLoginResponse>("/api/admins/login", payload);
  return response.data;
};