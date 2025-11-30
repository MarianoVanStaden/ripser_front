import api from "./config";
import type { TipoRol } from "../types";

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
  empresaId?: number;        // Multi-tenant: active company ID
  sucursalId?: number;       // Multi-tenant: active branch ID
  esSuperAdmin?: boolean;    // Multi-tenant: super admin flag
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string; // backend might return a new refresh token
  tokenType?: string;
  expiresIn?: number;
}

export interface SelectTenantRequest {
  empresaId: number;
  sucursalId?: number;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    console.log("Sending login request with data:", data);
    const res = await api.post('/api/auth/login', data);
    return res.data;
  },
  validateToken: async (token: string): Promise<void> => {
    await api.post('/api/auth/validate', { token });
  },
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await api.post('/api/auth/refresh', { refreshToken });
    return res.data;
  },
  selectTenant: async (data: SelectTenantRequest): Promise<LoginResponse> => {
    const res = await api.post('/api/auth/select-tenant', data);
    return res.data;
  }
};