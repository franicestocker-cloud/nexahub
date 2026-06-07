import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [company, setCompany] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setCompany(data.company);
    } catch {
      setUser(null);
      setCompany(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token) localStorage.setItem("nexahub_token", data.token);
    setUser(data.user);
    setCompany(data.company);
    return data;
  };

  const signup = async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    if (data.token) localStorage.setItem("nexahub_token", data.token);
    setUser(data.user);
    setCompany(data.company);
    return data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("nexahub_token");
    setUser(null);
    setCompany(null);
  };

  const updateCompany = async (payload) => {
    const { data } = await api.put("/company", payload);
    setCompany(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, company, login, signup, logout, refresh, updateCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
