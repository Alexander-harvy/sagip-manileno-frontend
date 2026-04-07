type StoredUser = {
  admin_id: number;
  first_name: string;
  last_name: string;
  dept_id: number;
  role: "ERU_ADMIN" | "SUBSTATION_ADMIN";
};

const TOKEN_KEY = "admin_token";
const USER_KEY = "admin_user";

export const storage = {
  setUser: (user: StoredUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser: (): StoredUser | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  removeUser: () => localStorage.removeItem(USER_KEY),

  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};