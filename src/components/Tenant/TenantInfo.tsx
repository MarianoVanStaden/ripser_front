import React from 'react';
import { useTenant } from '../../context/TenantContext';
import './TenantInfo.css';

export const TenantInfo: React.FC = () => {
  const { empresaActual, sucursalActual, esSuperAdmin } = useTenant();

  if (!empresaActual) return null;

  return (
    <div className="tenant-info">
      {esSuperAdmin && (
        <span className="tenant-badge super-admin" title="Super Administrador">
          <i className="icon-shield"></i> SUPER ADMIN
        </span>
      )}

      <div className="tenant-empresa">
        <i className="icon-building"></i>
        <span className="tenant-nombre" title={empresaActual.nombre}>
          {empresaActual.nombre}
        </span>
      </div>

      {sucursalActual && (
        <div className="tenant-sucursal">
          <i className="icon-location"></i>
          <span className="tenant-nombre" title={sucursalActual.nombre}>
            {sucursalActual.nombre}
          </span>
        </div>
      )}
    </div>
  );
};
