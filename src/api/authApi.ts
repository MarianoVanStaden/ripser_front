import axios from "axios";

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080/RipserApp/api") + "/auth";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id: number;
  username: string;
  nombre?: string;
  apellido?: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await axios.post(`${BASE}/login`, data);
    return res.data;
  },
  validateToken: async (token: string): Promise<void> => {
    await axios.post(`${BASE}/validate`, { token });
  }
  
};