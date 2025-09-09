import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/authApi";
import axios from "axios";
import { setAuthToken } from "../api/config";

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
  const t = localStorage.getItem("auth_token");
      const u = localStorage.getItem("auth_user");
      if (t && u) {
        try {
          await authApi.validateToken(t);
          setToken(t);
          setUser(JSON.parse(u));
          // Set for global axios (fallback) and our dedicated api instance
          axios.defaults.headers.common.Authorization = `Bearer ${t}`;
          setAuthToken(t);
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    validateToken();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login({ usernameOrEmail, password });
      const usr: AuthUser = {
        id: res.id || 0,
        username: res.username || usernameOrEmail,
        email: res.email || "",
      };
  const access = res.accessToken || (res as any).token; // support alternate field name
  if (!access) throw new Error('No access token en la respuesta');
  setToken(access);
      setUser(usr);
  localStorage.setItem("auth_token", access);
      if (res.refreshToken) {
        localStorage.setItem("auth_refresh_token", res.refreshToken);
      }
      localStorage.setItem("auth_user", JSON.stringify(usr));
  axios.defaults.headers.common.Authorization = `Bearer ${access}`;
  setAuthToken(access);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("auth_refresh_token");
  delete axios.defaults.headers.common.Authorization;
  setAuthToken(null);
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};