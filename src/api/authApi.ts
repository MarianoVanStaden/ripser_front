import axios from "axios";
import type { TipoRol } from "../types";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/RipserApp/api/auth";

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string; // primary expected field
  token?: string; // fallback field name some backends use
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  id?: number;
  username?: string;
  email?: string;
  roles?: TipoRol[];
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string; // backend might return a new refresh token
  tokenType?: string;
  expiresIn?: number;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    console.log("Sending login request with data:", data);
    const res = await axios.post(`${BASE}/login`, data);
    return res.data;
  },
  validateToken: async (token: string): Promise<void> => {
    await axios.post(`${BASE}/validate`, { token });
  },
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await axios.post(`${BASE}/refresh`, { refreshToken });
    return res.data;
  }
};