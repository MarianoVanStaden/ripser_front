import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Empresa, Sucursal } from '../types';
import { authApi } from '../api/authApi';
import { setAuthToken } from '../api/config';

interface TenantContextType {
  empresaId: number | null;
  sucursalId: number | null;
  esSuperAdmin: boolean;
  empresaActual: Empresa | null;
  sucursalActual: Sucursal | null;
  setEmpresaActual: (empresa: Empresa | null) => void;
  setSucursalActual: (sucursal: Sucursal | null) => void;
  cambiarTenant: (empresaId: number, sucursalId?: number) => Promise<void>;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inicializar estados directamente desde localStorage para evitar timing issues
  const [empresaId, setEmpresaId] = useState<number | null>(() => {
    const stored = localStorage.getItem('empresaId');
    return stored ? parseInt(stored) : null;
  });

  const [sucursalId, setSucursalId] = useState<number | null>(() => {
    const stored = localStorage.getItem('sucursalId');
    return stored ? parseInt(stored) : null;
  });

  const [esSuperAdmin, setEsSuperAdmin] = useState(() => {
    const stored = localStorage.getItem('esSuperAdmin');
    return stored === 'true';
  });

  const [empresaActual, setEmpresaActual] = useState<Empresa | null>(null);
  const [sucursalActual, setSucursalActual] = useState<Sucursal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Estados ya inicializados desde localStorage
    // Solo necesitamos marcar como terminado el loading
    setLoading(false);
  }, []);

  const cambiarTenant = async (newEmpresaId: number, newSucursalId?: number) => {
    try {
      setLoading(true);

      // Call select-tenant API endpoint using authApi
      const data = await authApi.selectTenant({
        empresaId: newEmpresaId,
        sucursalId: newSucursalId
      });

      // Update tokens
      const newToken = data.accessToken || (data as any).token;
      if (newToken) {
        localStorage.setItem('auth_token', newToken);
        setAuthToken(newToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('auth_refresh_token', data.refreshToken);
      }

      // Update tenant info
      localStorage.setItem('empresaId', newEmpresaId.toString());
      if (newSucursalId) {
        localStorage.setItem('sucursalId', newSucursalId.toString());
      } else {
        localStorage.removeItem('sucursalId');
      }

      // IMPORTANTE: También actualizar esSuperAdmin del nuevo token
      if (data.esSuperAdmin !== undefined) {
        localStorage.setItem('esSuperAdmin', data.esSuperAdmin.toString());
        setEsSuperAdmin(data.esSuperAdmin);
      }

      setEmpresaId(newEmpresaId);
      setSucursalId(newSucursalId || null);

      // Reload page to refresh all data with new tenant context
      window.location.reload();
    } catch (error) {
      console.error('Error al cambiar tenant:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <TenantContext.Provider value={{
      empresaId,
      sucursalId,
      esSuperAdmin,
      empresaActual,
      sucursalActual,
      setEmpresaActual,
      setSucursalActual,
      cambiarTenant,
      loading
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};
