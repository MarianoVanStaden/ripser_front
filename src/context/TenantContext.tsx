import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Empresa, Sucursal, UsuarioEmpresa, RolEmpresa } from '../types';
import { authApi } from '../api/authApi';
import { setAuthToken } from '../api/config';
import { sucursalService } from '../services/sucursalService';
import { usuarioEmpresaService } from '../services/usuarioEmpresaService';
import { useAuth } from './AuthContext';

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
  // Campos para filtrado temporal
  sucursalFiltro: number | null;
  setSucursalFiltro: (id: number | null) => void;
  sucursales: Sucursal[];
  canSelectSucursal: boolean;
  // Nuevos campos para permisos
  rolActual: RolEmpresa | null;
  usuarioEmpresa: UsuarioEmpresa | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Inicializar estados directamente desde localStorage para evitar timing issues
  const [empresaId, setEmpresaId] = useState<number | null>(() => {
    const stored = localStorage.getItem('empresaId');
    console.log('🚀 TenantProvider inicializado - empresaId:', stored);
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

  // Estados para filtrado temporal
  const [sucursalFiltro, setSucursalFiltroState] = useState<number | null>(() => {
    const stored = localStorage.getItem('sucursalFiltro');
    return stored ? parseInt(stored) : sucursalId;
  });
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // Nuevos estados para permisos y rol
  const [usuarioEmpresa, setUsuarioEmpresa] = useState<UsuarioEmpresa | null>(null);
  const [rolActual, setRolActual] = useState<RolEmpresa | null>(null);

  // Wrapper para setSucursalFiltro que persiste en localStorage
  const setSucursalFiltro = (id: number | null) => {
    setSucursalFiltroState(id);
    if (id !== null) {
      localStorage.setItem('sucursalFiltro', id.toString());
    } else {
      localStorage.removeItem('sucursalFiltro');
    }
  };

  // Determinar si el usuario puede seleccionar diferentes sucursales
  const canSelectSucursal = useMemo(() => {
    if (esSuperAdmin) return true;
    if (!rolActual) return false;

    // ADMIN_EMPRESA y GERENTE_SUCURSAL pueden cambiar
    return rolActual === 'ADMIN_EMPRESA' || rolActual === 'GERENTE_SUCURSAL';
  }, [esSuperAdmin, rolActual]);

  // Cargar UsuarioEmpresa al iniciar (para obtener rol y sucursal defecto)
  useEffect(() => {
    console.log('🎬 useEffect UsuarioEmpresa ejecutado - empresaId:', empresaId, 'user:', user);

    const loadUsuarioEmpresa = async () => {
      if (empresaId && user?.id) {
        try {
          console.log('🔍 Cargando UsuarioEmpresa para user:', user.id, 'empresa:', empresaId);
          const relaciones = await usuarioEmpresaService.getByUsuario(user.id);
          console.log('📋 Relaciones encontradas:', relaciones);
          const relacionActual = relaciones.find(r => r.empresaId === empresaId);

          if (relacionActual) {
            console.log('✅ Relación actual encontrada:', relacionActual);
            setUsuarioEmpresa(relacionActual);
            setRolActual(relacionActual.rol);

            // Cargar sucursal desde localStorage o usar defecto
            const savedSucursal = localStorage.getItem('sucursalFiltro');
            if (savedSucursal) {
              setSucursalFiltroState(parseInt(savedSucursal));
            } else if (relacionActual.sucursalDefectoId) {
              setSucursalFiltroState(relacionActual.sucursalDefectoId);
              localStorage.setItem('sucursalFiltro', relacionActual.sucursalDefectoId.toString());
            }
          } else {
            console.log('⚠️ No se encontró relación para empresa:', empresaId);
          }
        } catch (err) {
          console.error('❌ Error al cargar usuario-empresa:', err);
        }
      } else {
        console.log('⏭️ Saltando carga de UsuarioEmpresa - empresaId:', empresaId, 'user?.id:', user?.id);
      }
    };

    loadUsuarioEmpresa();
  }, [empresaId, user]);

  // Cargar sucursales disponibles
  useEffect(() => {
    const loadSucursales = async () => {
      if (!empresaId) {
        console.log('⏭️ No hay empresaId, saltando carga de sucursales');
        return;
      }

      console.log('🏢 Cargando sucursales - empresaId:', empresaId, 'canSelectSucursal:', canSelectSucursal, 'rolActual:', rolActual, 'esSuperAdmin:', esSuperAdmin);

      try {
        // Todos los roles que pueden cambiar ven todas las sucursales de la empresa
        if (canSelectSucursal) {
          console.log('✅ Usuario puede seleccionar sucursal, cargando todas...');
          const data = await sucursalService.getByEmpresa(empresaId);
          const activas = data.filter(s => s.estado === 'ACTIVO');
          console.log('🏢 Sucursales activas cargadas:', activas);
          setSucursales(activas);
        } else if (sucursalId) {
          console.log('⚠️ Usuario NO puede cambiar, cargando solo su sucursal:', sucursalId);
          // SUPERVISOR/USUARIO_SUCURSAL solo ven su sucursal
          const sucursal = await sucursalService.getById(sucursalId);
          console.log('🏢 Sucursal única cargada:', sucursal);
          setSucursales([sucursal]);
        } else {
          console.log('⚠️ Usuario NO puede cambiar y NO tiene sucursalId asignada');
        }
      } catch (err) {
        console.error('❌ Error al cargar sucursales:', err);
      }
    };

    loadSucursales();
  }, [empresaId, canSelectSucursal, sucursalId, rolActual, esSuperAdmin]);

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
      loading,
      // Valores para filtrado temporal
      sucursalFiltro,
      setSucursalFiltro,
      sucursales,
      canSelectSucursal,
      // Nuevos valores para permisos
      rolActual,
      usuarioEmpresa
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
