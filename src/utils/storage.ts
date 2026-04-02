const TOKEN_KEY = "admin_token";
const ROLE_KEY = "admin_role";

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  getRole: () => localStorage.getItem(ROLE_KEY),
  setRole: (role: string) => localStorage.setItem(ROLE_KEY, role),
  removeRole: () => localStorage.removeItem(ROLE_KEY),

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  },
};