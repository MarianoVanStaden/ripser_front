import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/authApi";
import axios from "axios";
import { setAuthToken } from "../api/config";
import type { TipoRol } from "../types";

export type { TipoRol } from "../types";

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  roles?: TipoRol[];
  esSuperAdmin?: boolean;  // Multi-tenant: indicates if user has full system access
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  esSuperAdmin: boolean;  // Exposed for easy access
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

// 3. Context creation
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [esSuperAdmin, setEsSuperAdmin] = useState<boolean>(false);

  useEffect(() => {
    const validateToken = async () => {
      const t = localStorage.getItem("auth_token");
      const u = localStorage.getItem("auth_user");
      const superAdmin = localStorage.getItem("esSuperAdmin");

      console.log('🔍 Validando token almacenado:', {
        hasToken: !!t,
        hasUser: !!u,
        superAdminStored: superAdmin
      });

      if (t && u) {
        try {
          await authApi.validateToken(t);
          const userParsed = JSON.parse(u);
          const isSuperAdmin = superAdmin === 'true';

          console.log('✅ Token válido - Usuario:', {
            username: userParsed.username,
            esSuperAdmin: isSuperAdmin
          });

          setToken(t);
          setUser(userParsed);
          setEsSuperAdmin(isSuperAdmin);
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

      // Debug: mostrar respuesta completa del backend
      console.log('🔍 Login response:', {
        username: res.username,
        email: res.email,
        roles: res.roles,
        esSuperAdmin: res.esSuperAdmin,
        empresaId: res.empresaId,
        sucursalId: res.sucursalId
      });

      const isSuperAdmin = res.esSuperAdmin || false;
      console.log('✅ isSuperAdmin determinado:', isSuperAdmin);

      const usr: AuthUser = {
        id: res.id || 0,
        username: res.username || usernameOrEmail,
        email: res.email || "",
        roles: res.roles || [],
        esSuperAdmin: isSuperAdmin,
      };
      const access = res.accessToken || (res as any).token; // support alternate field name
      if (!access) throw new Error('No access token en la respuesta');

      // Save multi-tenant data BEFORE setting user/token
      // This ensures TenantContext can read them immediately
      // 🔥 FIX: Only overwrite empresaId/sucursalId if provided in response
      // This preserves SuperAdmin context selection across re-login
      if (res.empresaId) {
        localStorage.setItem("empresaId", res.empresaId.toString());
      } else {
        // Keep existing empresaId if present (e.g., SuperAdmin re-login)
        console.log('ℹ️ Login response has no empresaId, keeping existing value:', localStorage.getItem("empresaId"));
      }
      if (res.sucursalId) {
        localStorage.setItem("sucursalId", res.sucursalId.toString());
      } else {
        // Keep existing sucursalId if present
        console.log('ℹ️ Login response has no sucursalId, keeping existing value:', localStorage.getItem("sucursalId"));
      }
      if (res.esSuperAdmin !== undefined) {
        localStorage.setItem("esSuperAdmin", res.esSuperAdmin.toString());
      } else {
        // Keep existing esSuperAdmin if present
        console.log('ℹ️ Login response has no esSuperAdmin, keeping existing value:', localStorage.getItem("esSuperAdmin"));
      }

      // Now set token and user
      setToken(access);
      setUser(usr);
      setEsSuperAdmin(isSuperAdmin);
      localStorage.setItem("auth_token", access);
      if (res.refreshToken) {
        localStorage.setItem("auth_refresh_token", res.refreshToken);
      }
      localStorage.setItem("auth_user", JSON.stringify(usr));

      axios.defaults.headers.common.Authorization = `Bearer ${access}`;
      setAuthToken(access);

      // Dispatch custom event to force TenantContext reload
      // 🔥 FIX: Use actual values from localStorage to preserve SuperAdmin context
      const finalEmpresaId = res.empresaId || localStorage.getItem('empresaId');
      const finalSucursalId = res.sucursalId || localStorage.getItem('sucursalId');
      const finalEsSuperAdmin = res.esSuperAdmin !== undefined ? res.esSuperAdmin : (localStorage.getItem('esSuperAdmin') === 'true');

      console.log('🔔 Disparando evento tenant-context-updated', {
        empresaId: finalEmpresaId,
        sucursalId: finalSucursalId,
        esSuperAdmin: finalEsSuperAdmin
      });
      window.dispatchEvent(new CustomEvent('tenant-context-updated', {
        detail: {
          empresaId: finalEmpresaId ? parseInt(finalEmpresaId.toString()) : undefined,
          sucursalId: finalSucursalId ? parseInt(finalSucursalId.toString()) : undefined,
          esSuperAdmin: finalEsSuperAdmin
        }
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setEsSuperAdmin(false);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_refresh_token");
    // Clear multi-tenant data
    localStorage.removeItem("empresaId");
    localStorage.removeItem("sucursalId");
    localStorage.removeItem("esSuperAdmin");
    // Clear sucursal filter to prevent cross-user contamination
    localStorage.removeItem("sucursalFiltro");
    delete axios.defaults.headers.common.Authorization;
    setAuthToken(null);
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Only logout on 401 if it's NOT a token_expired error (those are handled in config.ts)
        // This prevents double-logout when refresh fails
        if (error.response?.status === 401 && error.response?.data?.error !== 'token_expired') {
          console.warn('⚠️ AuthContext: 401 error (non token_expired), clearing auth...');
          // 🔥 FIX: Don't call logout() here, which would clear empresaId/sucursalId
          // Instead, manually clear only auth tokens to preserve SuperAdmin context
          setToken(null);
          setUser(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_refresh_token');
          localStorage.removeItem('auth_user');
          delete axios.defaults.headers.common.Authorization;
          setAuthToken(null);
          // ❌ DON'T clear empresaId/sucursalId/esSuperAdmin here!
          // ❌ DON'T call setEsSuperAdmin(false) here to preserve the flag
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // 🔥 FIX: Escuchar eventos del TenantContext para actualizar esSuperAdmin
  useEffect(() => {
    const handleTenantUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;

      if (detail && detail.esSuperAdmin !== undefined) {
        console.log('🔑 AuthContext: Actualizando esSuperAdmin desde TenantContext:', detail.esSuperAdmin);
        setEsSuperAdmin(detail.esSuperAdmin);
      }
    };

    window.addEventListener('tenant-context-updated', handleTenantUpdate);
    return () => window.removeEventListener('tenant-context-updated', handleTenantUpdate);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        esSuperAdmin,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook export (named export)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



export default AuthProvider;// 6. Optional: default export for the provider