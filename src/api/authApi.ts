import axios from "axios";

const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/RipserApp") + "/api/auth";

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
}

export interface RefreshResponse {
  accessToken?: string; // primary expected field
  token?: string; // fallback field name some backends use
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
    await axios.post(`${BASE}/validate`, { token }, {
      headers: {
        Authorization: token
      }
    });
  },
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await axios.post(`${BASE}/refresh`, { refreshToken }, {
      headers: {
        Authorization: refreshToken
      }
    });
    // Ensure we return the token in the expected format
    const data = res.data;
    if (data.token && !data.accessToken) {
      data.accessToken = data.token;
    }
    return data;
  }
};