import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { usePermisos } from '../usePermisos';

// Mock useAuth to control the user's roles
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../context/AuthContext';

const mockedUseAuth = vi.mocked(useAuth);

const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const mockAuth = (roles: string[]) => {
  mockedUseAuth.mockReturnValue({
    user: { roles } as any,
    token: 'token',
    loading: false,
    esSuperAdmin: false,
    login: vi.fn(),
    logout: vi.fn(),
  });
};

describe('usePermisos', () => {
  describe('tienePermiso', () => {
    it('ADMIN has access to all modules', () => {
      mockAuth(['ADMIN']);
      const { result } = renderHook(() => usePermisos(), { wrapper });

      expect(result.current.tienePermiso('DASHBOARD')).toBe(true);
      expect(result.current.tienePermiso('VENTAS')).toBe(true);
      expect(result.current.tienePermiso('CLIENTES')).toBe(true);
      expect(result.current.tienePermiso('TALLER')).toBe(true);
      expect(result.current.tienePermiso('RRHH')).toBe(true);
      expect(result.current.tienePermiso('PRODUCCION')).toBe(true);
    });

    it('VENDEDOR has access to VENTAS, CLIENTES only', () => {
      mockAuth(['VENDEDOR']);
      const { result } = renderHook(() => usePermisos(), { wrapper });

      expect(result.current.tienePermiso('VENTAS')).toBe(true);
      expect(result.current.tienePermiso('CLIENTES')).toBe(true);
      expect(result.current.tienePermiso('GARANTIAS')).toBe(false);
      expect(result.current.tienePermiso('DASHBOARD')).toBe(false);
      expect(result.current.tienePermiso('RRHH')).toBe(false);
      expect(result.current.tienePermiso('TALLER')).toBe(false);
    });

    it('TALLER has access to DASHBOARD, TALLER, GARANTIAS, LOGISTICA', () => {
      mockAuth(['TALLER']);
      const { result } = renderHook(() => usePermisos(), { wrapper });

      expect(result.current.tienePermiso('DASHBOARD')).toBe(true);
      expect(result.current.tienePermiso('TALLER')).toBe(true);
      expect(result.current.tienePermiso('GARANTIAS')).toBe(true);
      expect(result.current.tienePermiso('LOGISTICA')).toBe(true);
      expect(result.current.tienePermiso('VENTAS')).toBe(false);
    });

    it('returns false when no roles', () => {
      mockAuth([]);
      const { result } = renderHook(() => usePermisos(), { wrapper });
      expect(result.current.tienePermiso('DASHBOARD')).toBe(false);
    });

    it('returns false when user is null', () => {
      mockedUseAuth.mockReturnValue({
        user: null,
        token: null,
        loading: false,
        esSuperAdmin: false,
        login: vi.fn(),
        logout: vi.fn(),
      });
      const { result } = renderHook(() => usePermisos(), { wrapper });
      expect(result.current.tienePermiso('DASHBOARD')).toBe(false);
    });

    it('combines permissions from multiple roles', () => {
      mockAuth(['VENDEDOR', 'TALLER']);
      const { result } = renderHook(() => usePermisos(), { wrapper });

      // VENDEDOR: VENTAS, CLIENTES, GARANTIAS
      // TALLER: DASHBOARD, TALLER, GARANTIAS, LOGISTICA
      expect(result.current.tienePermiso('VENTAS')).toBe(true);
      expect(result.current.tienePermiso('TALLER')).toBe(true);
      expect(result.current.tienePermiso('DASHBOARD')).toBe(true);
      expect(result.current.tienePermiso('LOGISTICA')).toBe(true);
    });

    it('ADMIN_EMPRESA includes ADMINISTRACION module', () => {
      mockAuth(['ADMIN_EMPRESA']);
      const { result } = renderHook(() => usePermisos(), { wrapper });
      expect(result.current.tienePermiso('ADMINISTRACION')).toBe(true);
    });
  });

  describe('modulosPermitidos', () => {
    it('returns all modules for ADMIN', () => {
      mockAuth(['ADMIN']);
      const { result } = renderHook(() => usePermisos(), { wrapper });
      expect(result.current.modulosPermitidos).toHaveLength(10);
    });

    it('returns correct modules for OFICINA', () => {
      mockAuth(['OFICINA']);
      const { result } = renderHook(() => usePermisos(), { wrapper });
      expect(result.current.modulosPermitidos).toContain('DASHBOARD');
      expect(result.current.modulosPermitidos).toContain('VENTAS');
      expect(result.current.modulosPermitidos).toContain('PRESTAMOS');
      expect(result.current.modulosPermitidos).not.toContain('TALLER');
      expect(result.current.modulosPermitidos).not.toContain('PRODUCCION');
    });

    it('returns empty for no roles', () => {
      mockAuth([]);
      const { result } = renderHook(() => usePermisos(), { wrapper });
      expect(result.current.modulosPermitidos).toHaveLength(0);
    });

    it('deduplicates modules from multiple roles', () => {
      mockAuth(['OFICINA', 'TALLER']); // both have GARANTIAS, LOGISTICA, DASHBOARD
      const { result } = renderHook(() => usePermisos(), { wrapper });
      const garantiasCount = result.current.modulosPermitidos.filter(m => m === 'GARANTIAS');
      expect(garantiasCount).toHaveLength(1);
    });
  });

  describe('tieneRol', () => {
    it('returns true if user has the specified role', () => {
      mockAuth(['VENDEDOR', 'OFICINA']);
      const { result } = renderHook(() => usePermisos(), { wrapper });
      expect(result.current.tieneRol('VENDEDOR')).toBe(true);
    });

    it('returns true if user has any of the specified roles', () => {
      mockAuth(['TALLER']);
      const { result } = renderHook(() => usePermisos(), { wrapper });
      expect(result.current.tieneRol('VENDEDOR', 'TALLER')).toBe(true);
    });

    it('returns false if user has none of the specified roles', () => {
      mockAuth(['TALLER']);
      const { result } = renderHook(() => usePermisos(), { wrapper });
      expect(result.current.tieneRol('VENDEDOR', 'ADMIN')).toBe(false);
    });
  });

  describe('esAdmin', () => {
    it('returns true for ADMIN role', () => {
      mockAuth(['ADMIN']);
      const { result } = renderHook(() => usePermisos(), { wrapper });
      expect(result.current.esAdmin).toBe(true);
    });

    it('returns false for non-ADMIN roles', () => {
      mockAuth(['ADMIN_EMPRESA']);
      const { result } = renderHook(() => usePermisos(), { wrapper });
      expect(result.current.esAdmin).toBe(false);
    });
  });
});
