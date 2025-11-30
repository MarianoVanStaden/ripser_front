/**
 * TenantDebugPanel
 *
 * Panel de debugging para verificar el estado del tenant context y JWT.
 * Solo usar en desarrollo.
 *
 * Para usar: Importar y agregar al Layout o a cualquier página.
 * Ejemplo: import { TenantDebugPanel } from './components/Debug/TenantDebugPanel';
 */

import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';

interface JWTPayload {
  sub?: string;
  empresaId?: number;
  sucursalId?: number;
  esSuperAdmin?: boolean;
  roles?: string[];
  exp?: number;
  iat?: number;
}

export const TenantDebugPanel: React.FC = () => {
  const { empresaId, sucursalId, esSuperAdmin, empresaActual, sucursalActual } = useTenant();
  const { user, token } = useAuth();
  const [jwtPayload, setJwtPayload] = useState<JWTPayload | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Decodificar JWT del localStorage
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      try {
        const base64Url = storedToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        setJwtPayload(payload);
      } catch (error) {
        console.error('Error decoding JWT:', error);
      }
    }
  }, [token]);

  const getExpirationTime = () => {
    if (jwtPayload?.exp) {
      const expDate = new Date(jwtPayload.exp * 1000);
      const now = new Date();
      const diff = expDate.getTime() - now.getTime();
      const minutes = Math.floor(diff / 60000);
      const isExpired = diff < 0;

      return {
        date: expDate.toLocaleString(),
        isExpired,
        minutesRemaining: minutes
      };
    }
    return null;
  };

  const expiration = getExpirationTime();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
        title="Debug Panel"
      >
        🐛
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        backgroundColor: 'white',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '400px',
        maxHeight: '600px',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>🐛 Tenant Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      {/* Tenant Context */}
      <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>📍 Tenant Context</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>Empresa ID:</td>
              <td style={{ padding: '4px' }}>{empresaId || 'null'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>Empresa:</td>
              <td style={{ padding: '4px' }}>{empresaActual?.nombre || 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>Sucursal ID:</td>
              <td style={{ padding: '4px' }}>{sucursalId || 'null'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>Sucursal:</td>
              <td style={{ padding: '4px' }}>{sucursalActual?.nombre || 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>Super Admin:</td>
              <td style={{ padding: '4px' }}>
                <span style={{ color: esSuperAdmin ? 'green' : 'red' }}>
                  {esSuperAdmin ? '✅ YES' : '❌ NO'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* User Info */}
      <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>👤 User Info</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>ID:</td>
              <td style={{ padding: '4px' }}>{user?.id || 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>Username:</td>
              <td style={{ padding: '4px' }}>{user?.username || 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>Email:</td>
              <td style={{ padding: '4px' }}>{user?.email || 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>Roles:</td>
              <td style={{ padding: '4px' }}>{user?.roles?.join(', ') || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* JWT Info */}
      <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>🔑 JWT Token</h4>
        {jwtPayload ? (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px', fontWeight: 'bold' }}>Subject:</td>
                  <td style={{ padding: '4px' }}>{jwtPayload.sub || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px', fontWeight: 'bold' }}>Empresa ID:</td>
                  <td style={{ padding: '4px' }}>{jwtPayload.empresaId || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px', fontWeight: 'bold' }}>Sucursal ID:</td>
                  <td style={{ padding: '4px' }}>{jwtPayload.sucursalId || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px', fontWeight: 'bold' }}>Super Admin:</td>
                  <td style={{ padding: '4px' }}>
                    {jwtPayload.esSuperAdmin ? '✅' : '❌'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px', fontWeight: 'bold' }}>Roles:</td>
                  <td style={{ padding: '4px' }}>
                    {Array.isArray(jwtPayload.roles)
                      ? jwtPayload.roles.join(', ')
                      : 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>

            {expiration && (
              <div style={{
                padding: '8px',
                backgroundColor: expiration.isExpired ? '#ffebee' : '#e8f5e9',
                borderRadius: '4px',
                border: `1px solid ${expiration.isExpired ? '#f44336' : '#4caf50'}`
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {expiration.isExpired ? '⚠️ Token Expirado' : '✅ Token Válido'}
                </div>
                <div>Expira: {expiration.date}</div>
                {!expiration.isExpired && (
                  <div>Tiempo restante: {expiration.minutesRemaining} minutos</div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: '#999' }}>No token found</div>
        )}
      </div>

      {/* localStorage */}
      <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>💾 LocalStorage</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>empresaId:</td>
              <td style={{ padding: '4px' }}>{localStorage.getItem('empresaId') || 'null'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>sucursalId:</td>
              <td style={{ padding: '4px' }}>{localStorage.getItem('sucursalId') || 'null'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>esSuperAdmin:</td>
              <td style={{ padding: '4px' }}>{localStorage.getItem('esSuperAdmin') || 'null'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px', fontWeight: 'bold' }}>auth_token:</td>
              <td style={{ padding: '4px', wordBreak: 'break-all' }}>
                {localStorage.getItem('auth_token')?.substring(0, 20) + '...' || 'null'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            console.log('=== TENANT DEBUG INFO ===');
            console.log('Tenant Context:', { empresaId, sucursalId, esSuperAdmin });
            console.log('User:', user);
            console.log('JWT Payload:', jwtPayload);
            console.log('localStorage:', {
              empresaId: localStorage.getItem('empresaId'),
              sucursalId: localStorage.getItem('sucursalId'),
              esSuperAdmin: localStorage.getItem('esSuperAdmin'),
              auth_token: localStorage.getItem('auth_token')?.substring(0, 30) + '...'
            });
          }}
          style={{
            padding: '6px 12px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          📋 Log to Console
        </button>

        <button
          onClick={() => {
            if (confirm('¿Está seguro de que desea limpiar el contexto de tenant?')) {
              localStorage.removeItem('empresaId');
              localStorage.removeItem('sucursalId');
              localStorage.removeItem('esSuperAdmin');
              alert('Contexto limpiado. Recargando...');
              window.location.reload();
            }
          }}
          style={{
            padding: '6px 12px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          🗑️ Clear Tenant
        </button>

        <button
          onClick={() => {
            window.location.reload();
          }}
          style={{
            padding: '6px 12px',
            backgroundColor: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          🔄 Reload Page
        </button>
      </div>

      <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '10px' }}>
        ⚠️ Solo para desarrollo. Remover en producción.
      </div>
    </div>
  );
};
