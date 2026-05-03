/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Empresa, Sucursal, UsuarioEmpresa, RolEmpresa } from '../types';
import { authApi } from '../api/authApi';
import { setAuthToken } from '../api/config';
import { sucursalService } from '../services/sucursalService';
import { usuarioEmpresaService } from '../services/usuarioEmpresaService';
import { useAuth } from './AuthContext';
import { migrateTenantContext, needsMigration } from '../utils/storageMigration';

interface TenantContextType {
  empresaId: number | null;
  sucursalId: number | null;
  esSuperAdmin: boolean;
  empresaActual: Empresa | null;
  sucursalActual: Sucursal | null;
  setEmpresaActual: (empresa: Empresa | null) => void;
  setSucursalActual: (sucursal: Sucursal | null) => void;
  cambiarTenant: (empresaId: number, sucursalId?: number) => Promise<void>;
  cambiarSucursal: (sucursalId: number | null) => Promise<void>;
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

  // 🔄 One-time migration from localStorage to sessionStorage for existing users
  useEffect(() => {
    if (needsMigration()) {
      console.log('🔄 Migrating tenant context from localStorage to sessionStorage...');
      migrateTenantContext({
        removeFromLocal: false, // Keep in localStorage during transition period
      });
    }
  }, []);

  // Inicializar estados directamente desde sessionStorage para aislamiento por tab
  const [empresaId, setEmpresaId] = useState<number | null>(() => {
    const stored = sessionStorage.getItem('empresaId');
    console.log('🚀 TenantProvider inicializado - empresaId:', stored);
    return stored ? parseInt(stored) : null;
  });

  const [sucursalId, setSucursalId] = useState<number | null>(() => {
    const stored = sessionStorage.getItem('sucursalId');
    return stored ? parseInt(stored) : null;
  });

  const [esSuperAdmin, setEsSuperAdmin] = useState(() => {
    const stored = sessionStorage.getItem('esSuperAdmin');
    return stored === 'true';
  });

  const [empresaActual, setEmpresaActual] = useState<Empresa | null>(null);
  const [sucursalActual, setSucursalActual] = useState<Sucursal | null>(null);
  const [loading, setLoading] = useState(true);

  // Escuchar eventos de actualización del tenant (desde AuthContext o cambios internos)
  // No necesitamos polling porque sessionStorage es aislado por tab
  useEffect(() => {
    const handleTenantUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      console.log('🔔 Evento tenant-context-updated recibido:', detail);

      // Si el evento tiene empresaId, guardarlo en sessionStorage y actualizar estado
      if (detail?.empresaId) {
        console.log('💾 Guardando empresaId desde evento:', detail.empresaId);
        sessionStorage.setItem('empresaId', detail.empresaId.toString());
        setEmpresaId(detail.empresaId);
      }
      if (detail?.sucursalId) {
        sessionStorage.setItem('sucursalId', detail.sucursalId.toString());
        setSucursalId(detail.sucursalId);
      }
      if (detail?.esSuperAdmin !== undefined) {
        sessionStorage.setItem('esSuperAdmin', detail.esSuperAdmin.toString());
        setEsSuperAdmin(detail.esSuperAdmin);
      }
    };

    window.addEventListener('tenant-context-updated', handleTenantUpdate);

    return () => {
      window.removeEventListener('tenant-context-updated', handleTenantUpdate);
    };
  }, []); // Empty dependency array - solo configurar listener una vez

  // 🆕 Detectar nuevo tab sin contexto de empresa
  // Cuando un usuario abre un nuevo tab, sessionStorage está vacío pero localStorage tiene auth_token
  useEffect(() => {
    const hasAuthToken = !!localStorage.getItem('auth_token');
    const hasEmpresaId = !!sessionStorage.getItem('empresaId');

    if (hasAuthToken && !hasEmpresaId && user) {
      console.log('🆕 Nuevo tab detectado - usuario autenticado pero sin contexto de empresa');
      console.log('💡 El usuario debe seleccionar una empresa en el TenantSelector');
      // No redirigimos automáticamente aquí - el TenantSelector o la ruta protegida
      // se encargará de mostrar el selector de empresa si es necesario
    }
  }, [user]);

  // Estados para filtrado temporal
  const [sucursalFiltro, setSucursalFiltroState] = useState<number | null>(() => {
    const stored = sessionStorage.getItem('sucursalFiltro');
    return stored ? parseInt(stored) : sucursalId;
  });
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // Nuevos estados para permisos y rol
  const [usuarioEmpresa, setUsuarioEmpresa] = useState<UsuarioEmpresa | null>(null);
  const [rolActual, setRolActual] = useState<RolEmpresa | null>(null);

  // Wrapper para setSucursalFiltro que persiste en sessionStorage
  const setSucursalFiltro = (id: number | null) => {
    setSucursalFiltroState(id);
    if (id !== null) {
      sessionStorage.setItem('sucursalFiltro', id.toString());
    } else {
      sessionStorage.removeItem('sucursalFiltro');
    }
  };

  // Determinar si el usuario puede seleccionar diferentes sucursales
  const canSelectSucursal = useMemo(() => {
    if (esSuperAdmin) return true;

    // Todos los usuarios con rol de sistema VENDEDOR pueden cambiar de sucursal
    // independientemente del rolActual en la empresa (que puede ser SUPERVISOR o USUARIO_SUCURSAL)
    const systemRole = (user?.rol || user?.roles?.[0])?.toString().trim().toUpperCase();
    if (systemRole === 'VENDEDOR') return true;

    if (!rolActual) return false;
    return rolActual === 'ADMIN_EMPRESA' || rolActual === 'GERENTE_SUCURSAL' || rolActual === 'SUPERVISOR';
  }, [esSuperAdmin, rolActual, user]);

  // Cargar UsuarioEmpresa al iniciar (para obtener rol y sucursal defecto)
  useEffect(() => {
    console.log('🎬 useEffect UsuarioEmpresa ejecutado - empresaId:', empresaId, 'user:', user);

    const loadUsuarioEmpresa = async () => {
      if (empresaId && user?.id) {
        try {
          console.log('🔍 Cargando UsuarioEmpresa para user:', user.id, 'empresa:', empresaId);
          const relaciones = await usuarioEmpresaService.getByUsuario(user.id);
          console.log('📋 Relaciones encontradas:', relaciones);
          // Defensive: backend contract says `UsuarioEmpresa[]`, but if a
          // proxy/mock/error path returns a wrapped response (e.g., paginated
          // {content:[]}) calling `.find` crashes the whole context and
          // mounts the Sentry ErrorBoundary on every page that uses tenant.
          const relacionesArr = Array.isArray(relaciones) ? relaciones : [];
          const relacionActual = relacionesArr.find(r => r.empresaId === empresaId);

          if (relacionActual) {
            console.log('✅ Relación actual encontrada:', relacionActual);
            setUsuarioEmpresa(relacionActual);
            setRolActual(relacionActual.rol);

            // 🔥 FIX: Detectar automáticamente si es SuperAdmin basado en el rol
            if (relacionActual.rol === 'SUPER_ADMIN') {
              console.log('🔑 Usuario tiene rol SUPER_ADMIN, actualizando esSuperAdmin a true');
              setEsSuperAdmin(true);
              sessionStorage.setItem('esSuperAdmin', 'true');
              // Disparar evento para sincronizar con AuthContext
              window.dispatchEvent(new CustomEvent('tenant-context-updated', {
                detail: { empresaId, sucursalId, esSuperAdmin: true }
              }));
            }

            // Lógica mejorada para inicializar sucursal con validación
            const savedSucursal = sessionStorage.getItem('sucursalFiltro');
            let sucursalSeleccionada: number | null = null;

            // Cargar sucursales disponibles primero para validar
            try {
              const sucursalesDisponibles = await sucursalService.getByEmpresa(empresaId);
              const activas = sucursalesDisponibles.filter(s => s.estado === 'ACTIVO');
              console.log('🏢 Sucursales activas cargadas:', activas.map(s => s.id));

              // Si hay sucursal guardada, validar que esté en la lista de disponibles
              if (savedSucursal) {
                const savedSucursalId = parseInt(savedSucursal);
                const isValid = activas.some(s => s.id === savedSucursalId);

                if (isValid) {
                  console.log('✅ Sucursal guardada validada:', savedSucursal);
                  sucursalSeleccionada = savedSucursalId;
                } else {
                  console.log('⚠️ Sucursal guardada inválida (ID:', savedSucursalId, ') - no está en sucursales disponibles');
                  sessionStorage.removeItem('sucursalFiltro');
                }
              }

              // Si no hay sucursal válida guardada, intentar con la asignada directamente al usuario
              if (sucursalSeleccionada === null && relacionActual.sucursalId) {
                console.log('📍 Usuario asignado a sucursal específica:', relacionActual.sucursalId);
                sucursalSeleccionada = relacionActual.sucursalId;
              }
              // Si no, intentar con la sucursal por defecto
              else if (sucursalSeleccionada === null && relacionActual.sucursalDefectoId) {
                console.log('📍 Usando sucursal por defecto:', relacionActual.sucursalDefectoId);
                sucursalSeleccionada = relacionActual.sucursalDefectoId;
              }
              // Si no, auto-seleccionar según lógica de empresa
              else if (sucursalSeleccionada === null) {
                console.log('📍 No hay sucursal asignada, seleccionando automáticamente');
                if (activas.length === 1) {
                  // Solo hay una sucursal, seleccionarla automáticamente
                  console.log('📍 Solo hay una sucursal activa, seleccionándola automáticamente:', activas[0].id);
                  sucursalSeleccionada = activas[0].id;
                } else if (activas.length > 1) {
                  // Hay múltiples sucursales, buscar la principal
                  const principal = activas.find(s => s.esPrincipal);
                  if (principal) {
                    console.log('📍 Seleccionando sucursal principal:', principal.id);
                    sucursalSeleccionada = principal.id;
                  } else {
                    console.log('📍 Seleccionando primera sucursal activa:', activas[0].id);
                    sucursalSeleccionada = activas[0].id;
                  }
                }
              }

              // Aplicar la sucursal seleccionada
              if (sucursalSeleccionada !== null) {
                console.log('✅ Sucursal final seleccionada:', sucursalSeleccionada);
                setSucursalFiltroState(sucursalSeleccionada);
                sessionStorage.setItem('sucursalFiltro', sucursalSeleccionada.toString());
              }
            } catch (err) {
              console.error('❌ Error al cargar sucursales para auto-selección:', err);
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

      // Detectar si solo cambia la sucursal (mismo empresaId)
      const soloSucursal = newEmpresaId === empresaId;

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

      // Update tenant info (en sessionStorage para aislamiento por tab)
      sessionStorage.setItem('empresaId', newEmpresaId.toString());
      if (newSucursalId) {
        sessionStorage.setItem('sucursalId', newSucursalId.toString());
        sessionStorage.setItem('sucursalFiltro', newSucursalId.toString());
      } else {
        sessionStorage.removeItem('sucursalId');
        sessionStorage.removeItem('sucursalFiltro');
      }

      // IMPORTANTE: También actualizar esSuperAdmin del nuevo token
      if (data.esSuperAdmin !== undefined) {
        sessionStorage.setItem('esSuperAdmin', data.esSuperAdmin.toString());
        setEsSuperAdmin(data.esSuperAdmin);
      }

      setEmpresaId(newEmpresaId);
      setSucursalId(newSucursalId || null);

      // Si solo cambia la sucursal, actualizar el filtro sin recargar
      if (soloSucursal) {
        console.log('✅ Cambio de sucursal sin reload - actualizando filtro a:', newSucursalId);
        setSucursalFiltroState(newSucursalId || null);
        setLoading(false);
        // No recargar la página, solo actualizar el estado
      } else {
        // Si cambia la empresa, sí necesitamos recargar para limpiar datos
        console.log('🔄 Cambio de empresa - recargando página');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al cambiar tenant:', error);
      throw error;
    } finally {
      if (!loading) {
        setLoading(false);
      }
    }
  };

  // Método simplificado para cambiar solo la sucursal (sin recargar)
  const cambiarSucursal = async (newSucursalId: number | null) => {
    if (!empresaId) {
      console.error('No hay empresa activa para cambiar sucursal');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Cambiando sucursal a:', newSucursalId);

      // Call select-tenant API endpoint using authApi
      const data = await authApi.selectTenant({
        empresaId: empresaId,
        sucursalId: newSucursalId || undefined
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

      // Update sucursal info (en sessionStorage para aislamiento por tab)
      if (newSucursalId) {
        sessionStorage.setItem('sucursalId', newSucursalId.toString());
        sessionStorage.setItem('sucursalFiltro', newSucursalId.toString());
      } else {
        sessionStorage.removeItem('sucursalId');
        sessionStorage.removeItem('sucursalFiltro');
      }

      setSucursalId(newSucursalId);
      setSucursalFiltroState(newSucursalId);

      console.log('✅ Sucursal cambiada exitosamente sin reload');
    } catch (error) {
      console.error('Error al cambiar sucursal:', error);
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
      cambiarSucursal,
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
