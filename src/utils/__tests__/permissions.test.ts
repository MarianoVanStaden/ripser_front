import { describe, it, expect } from 'vitest';
import type { AuthResponse } from '../../types/auth.types';
import {
  canAccessMultipleEmpresas,
  canManageEmpresas,
  canManageSucursales,
  canViewConsolidatedReports,
  canManageUsuarios,
  hasAccessToSucursal,
  hasAccessToEmpresa,
  isSuperAdmin,
  isAdminEmpresa,
  isGerenteSucursal,
  getRoleDisplayName,
  hasAnyRole,
  hasAllRoles,
} from '../permissions';

const makeUser = (overrides: Partial<AuthResponse> = {}): AuthResponse => ({
  accessToken: 'token',
  refreshToken: 'refresh',
  tokenType: 'Bearer',
  expiresIn: 3600,
  id: 1,
  username: 'test',
  email: 'test@test.com',
  roles: [],
  ...overrides,
});

describe('permissions', () => {
  describe('canAccessMultipleEmpresas', () => {
    it('returns true for super admin', () => {
      expect(canAccessMultipleEmpresas(makeUser({ esSuperAdmin: true }))).toBe(true);
    });

    it('returns false for regular user', () => {
      expect(canAccessMultipleEmpresas(makeUser({ esSuperAdmin: false }))).toBe(false);
    });

    it('returns false for null user', () => {
      expect(canAccessMultipleEmpresas(null)).toBe(false);
    });
  });

  describe('canManageEmpresas', () => {
    it('returns true for super admin', () => {
      expect(canManageEmpresas(makeUser({ esSuperAdmin: true }))).toBe(true);
    });

    it('returns false for ADMIN_EMPRESA', () => {
      expect(canManageEmpresas(makeUser({ roles: ['ADMIN_EMPRESA'] }))).toBe(false);
    });

    it('returns false for null', () => {
      expect(canManageEmpresas(null)).toBe(false);
    });
  });

  describe('canManageSucursales', () => {
    it('returns true for super admin', () => {
      expect(canManageSucursales(makeUser({ esSuperAdmin: true }))).toBe(true);
    });

    it('returns true for ADMIN_EMPRESA', () => {
      expect(canManageSucursales(makeUser({ roles: ['ADMIN_EMPRESA'] }))).toBe(true);
    });

    it('returns true for ADMIN', () => {
      expect(canManageSucursales(makeUser({ roles: ['ADMIN'] }))).toBe(true);
    });

    it('returns false for VENDEDOR', () => {
      expect(canManageSucursales(makeUser({ roles: ['VENDEDOR'] }))).toBe(false);
    });

    it('returns false for null', () => {
      expect(canManageSucursales(null)).toBe(false);
    });
  });

  describe('canViewConsolidatedReports', () => {
    it('returns true for super admin', () => {
      expect(canViewConsolidatedReports(makeUser({ esSuperAdmin: true }))).toBe(true);
    });

    it('returns true for ADMIN_EMPRESA', () => {
      expect(canViewConsolidatedReports(makeUser({ roles: ['ADMIN_EMPRESA'] }))).toBe(true);
    });

    it('returns false for VENDEDOR', () => {
      expect(canViewConsolidatedReports(makeUser({ roles: ['VENDEDOR'] }))).toBe(false);
    });
  });

  describe('canManageUsuarios', () => {
    it('returns true for GERENTE_SUCURSAL', () => {
      expect(canManageUsuarios(makeUser({ roles: ['GERENTE_SUCURSAL'] }))).toBe(true);
    });

    it('returns false for TALLER', () => {
      expect(canManageUsuarios(makeUser({ roles: ['TALLER'] }))).toBe(false);
    });
  });

  describe('hasAccessToSucursal', () => {
    it('super admin has access to any sucursal', () => {
      expect(hasAccessToSucursal(makeUser({ esSuperAdmin: true }), 99)).toBe(true);
    });

    it('user without sucursalId has access to all', () => {
      expect(hasAccessToSucursal(makeUser({ sucursalId: undefined }), 5)).toBe(true);
    });

    it('user with matching sucursalId has access', () => {
      expect(hasAccessToSucursal(makeUser({ sucursalId: 5 }), 5)).toBe(true);
    });

    it('user with different sucursalId does not have access', () => {
      expect(hasAccessToSucursal(makeUser({ sucursalId: 5 }), 10)).toBe(false);
    });

    it('null user has no access', () => {
      expect(hasAccessToSucursal(null, 1)).toBe(false);
    });
  });

  describe('hasAccessToEmpresa', () => {
    it('super admin has access to any empresa', () => {
      expect(hasAccessToEmpresa(makeUser({ esSuperAdmin: true }), 99)).toBe(true);
    });

    it('user with matching empresaId has access', () => {
      expect(hasAccessToEmpresa(makeUser({ empresaId: 3 }), 3)).toBe(true);
    });

    it('user with different empresaId does not have access', () => {
      expect(hasAccessToEmpresa(makeUser({ empresaId: 3 }), 5)).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('returns true when esSuperAdmin is true', () => {
      expect(isSuperAdmin(makeUser({ esSuperAdmin: true }))).toBe(true);
    });

    it('returns false otherwise', () => {
      expect(isSuperAdmin(makeUser())).toBe(false);
    });
  });

  describe('isAdminEmpresa', () => {
    it('returns true for super admin', () => {
      expect(isAdminEmpresa(makeUser({ esSuperAdmin: true }))).toBe(true);
    });

    it('returns true for ADMIN_EMPRESA role', () => {
      expect(isAdminEmpresa(makeUser({ roles: ['ADMIN_EMPRESA'] }))).toBe(true);
    });

    it('returns true for ADMIN role', () => {
      expect(isAdminEmpresa(makeUser({ roles: ['ADMIN'] }))).toBe(true);
    });

    it('returns false for VENDEDOR', () => {
      expect(isAdminEmpresa(makeUser({ roles: ['VENDEDOR'] }))).toBe(false);
    });
  });

  describe('isGerenteSucursal', () => {
    it('returns true for GERENTE_SUCURSAL role', () => {
      expect(isGerenteSucursal(makeUser({ roles: ['GERENTE_SUCURSAL'] }))).toBe(true);
    });

    it('returns true for ADMIN_EMPRESA role', () => {
      expect(isGerenteSucursal(makeUser({ roles: ['ADMIN_EMPRESA'] }))).toBe(true);
    });

    it('returns false for TALLER', () => {
      expect(isGerenteSucursal(makeUser({ roles: ['TALLER'] }))).toBe(false);
    });
  });

  describe('getRoleDisplayName', () => {
    it('maps known roles to Spanish labels', () => {
      expect(getRoleDisplayName('SUPER_ADMIN')).toBe('Super Administrador');
      expect(getRoleDisplayName('ADMIN_EMPRESA')).toBe('Administrador de Empresa');
      expect(getRoleDisplayName('GERENTE_SUCURSAL')).toBe('Gerente de Sucursal');
      expect(getRoleDisplayName('VENDEDOR')).toBe('Vendedor');
      expect(getRoleDisplayName('TALLER')).toBe('Taller');
      expect(getRoleDisplayName('OFICINA')).toBe('Oficina');
    });

    it('returns the role string for unknown roles', () => {
      expect(getRoleDisplayName('UNKNOWN_ROLE' as any)).toBe('UNKNOWN_ROLE');
    });
  });

  describe('hasAnyRole', () => {
    it('returns true if user has at least one matching role', () => {
      expect(hasAnyRole(makeUser({ roles: ['VENDEDOR', 'TALLER'] }), ['VENDEDOR', 'ADMIN'])).toBe(true);
    });

    it('returns false if user has no matching roles', () => {
      expect(hasAnyRole(makeUser({ roles: ['TALLER'] }), ['VENDEDOR', 'ADMIN'])).toBe(false);
    });

    it('returns false for null user', () => {
      expect(hasAnyRole(null, ['ADMIN'])).toBe(false);
    });
  });

  describe('hasAllRoles', () => {
    it('returns true if user has all specified roles', () => {
      expect(hasAllRoles(makeUser({ roles: ['VENDEDOR', 'TALLER', 'ADMIN'] }), ['VENDEDOR', 'ADMIN'])).toBe(true);
    });

    it('returns false if user is missing a role', () => {
      expect(hasAllRoles(makeUser({ roles: ['VENDEDOR'] }), ['VENDEDOR', 'ADMIN'])).toBe(false);
    });

    it('returns false for null user', () => {
      expect(hasAllRoles(null, ['ADMIN'])).toBe(false);
    });
  });
});
