import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/authApi";
import axios from "axios";

export interface AuthUser {
  id: number;
  username: string;
  nombre?: string;
  apellido?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
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
          await authApi.validateToken(t); // Verify token
          setToken(t);
          setUser(JSON.parse(u));
          axios.defaults.headers.common.Authorization = `Bearer ${t}`;
        } catch {
          logout(); // Clear invalid token
        }
      }
      setLoading(false);
    };
    validateToken();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      const usr: AuthUser = {
        id: res.id,
        username: res.username,
        nombre: res.nombre,
        apellido: res.apellido,
      };
      setToken(res.token);
      setUser(usr);
      localStorage.setItem("auth_token", res.token);
      localStorage.setItem("auth_user", JSON.stringify(usr));
      axios.defaults.headers.common.Authorization = `Bearer ${res.token}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    delete axios.defaults.headers.common.Authorization;
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