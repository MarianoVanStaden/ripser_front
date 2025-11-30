// Authentication types with multi-tenant support

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  id: number;
  username: string;
  email: string;
  roles: string[];
  empresaId?: number;        // NEW - Active company ID
  sucursalId?: number;       // NEW - Active branch ID (can be null)
  esSuperAdmin?: boolean;    // NEW - Indicates if user has full system access
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}

export interface SelectTenantRequest {
  empresaId: number;
  sucursalId?: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
