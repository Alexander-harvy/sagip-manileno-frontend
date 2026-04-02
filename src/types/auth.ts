export type UserRole = "ERU_ADMIN" | "SUBSTATION_ADMIN";

export interface User {
  id: number;
  name: string;
  role: UserRole;
}