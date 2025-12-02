import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { empresaService } from '../../services/empresaService';
import { sucursalService } from '../../services/sucursalService';
import { usuarioEmpresaService } from '../../services/usuarioEmpresaService';
import type { Empresa, Sucursal, UsuarioEmpresa } from '../../types';
import './TenantSelector.css';

interface EmpresaConRol extends Empresa {
  rol?: string;
}

export const TenantSelector: React.FC = () => {
  const { empresaId, sucursalId, cambiarTenant, esSuperAdmin } = useTenant();
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<EmpresaConRol[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(empresaId);
  const [selectedSucursal, setSelectedSucursal] = useState<number | null>(sucursalId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmpresas();
  }, [esSuperAdmin, user]);

  useEffect(() => {
    if (selectedEmpresa) {
      loadSucursales(selectedEmpresa);
    } else {
      setSucursales([]);
    }
  }, [selectedEmpresa]);

  const loadEmpresas = async () => {
    if (!user) return;

    try {
      if (esSuperAdmin) {
        // Super Admin: Load ALL empresas
        console.log('🔑 Super Admin: Loading all empresas...');
        const data = await empresaService.getActive();
        setEmpresas(data);
      } else {
        // Regular user: Load only assigned empresas
        console.log('👤 Regular user: Loading assigned empresas for user', user.id);
        const usuarioEmpresas: UsuarioEmpresa[] = await usuarioEmpresaService.getByUsuario(user.id);

        // Get full empresa data for each assignment
        const empresasConRol = await Promise.all(
          usuarioEmpresas
            .filter(ue => ue.esActivo)
            .map(async (ue) => {
              const empresa = await empresaService.getById(ue.empresaId);
              return {
                ...empresa,
                rol: ue.rol
              };
            })
        );

        setEmpresas(empresasConRol);
      }
    } catch (err) {
      console.error('Error loading empresas:', err);
      setError('Error al cargar empresas');
    }
  };

  const loadSucursales = async (empresaId: number) => {
    try {
      const data = await sucursalService.getByEmpresa(empresaId);
      setSucursales(data);
    } catch (err) {
      console.error('Error loading sucursales:', err);
      setError('Error al cargar sucursales');
    }
  };

  const handleChange = async () => {
    if (!selectedEmpresa) {
      setError('Debe seleccionar una empresa');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await cambiarTenant(selectedEmpresa, selectedSucursal || undefined);
      // El cambiarTenant recargará la página si tiene éxito
    } catch (err: any) {
      console.error('Error changing tenant:', err);

      // Manejo específico de errores según la documentación del backend
      if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;

        switch (status) {
          case 400:
            setError('Datos inválidos. Por favor, seleccione una empresa válida.');
            break;
          case 401:
            setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
            break;
          case 403:
            setError('No tiene acceso a la empresa seleccionada. Contacte al administrador para obtener permisos.');
            break;
          case 500:
            setError(`Error del servidor: ${errorData?.message || 'Error interno'}`);
            break;
          default:
            setError(`Error al cambiar de contexto: ${errorData?.error || 'Error desconocido'}`);
        }
      } else {
        setError('Error de conexión. Verifique su conexión a internet.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tenant-selector">
      <div className="tenant-selector-header">
        <h3>Seleccionar Contexto de Trabajo</h3>
        {esSuperAdmin && (
          <span className="badge badge-super-admin">SUPER ADMIN</span>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        <label htmlFor="empresa-select">Empresa:</label>
        <select
          id="empresa-select"
          className="form-control"
          value={selectedEmpresa || ''}
          onChange={(e) => setSelectedEmpresa(parseInt(e.target.value) || null)}
          disabled={loading}
        >
          <option value="">Seleccione una empresa</option>
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.nombre}
              {empresa.rol && ` - ${empresa.rol}`}
            </option>
          ))}
        </select>
      </div>

      {sucursales.length > 0 && (
        <div className="form-group">
          <label htmlFor="sucursal-select">Sucursal:</label>
          <select
            id="sucursal-select"
            className="form-control"
            value={selectedSucursal || ''}
            onChange={(e) => setSelectedSucursal(parseInt(e.target.value) || null)}
            disabled={loading}
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre} ({sucursal.codigo})
                {sucursal.esPrincipal && ' ⭐'}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleChange}
        disabled={!selectedEmpresa || loading}
      >
        {loading ? 'Cambiando...' : 'Aplicar Cambios'}
      </button>
    </div>
  );
};
