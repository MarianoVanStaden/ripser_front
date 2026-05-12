import { describe, it, expect } from 'vitest';
import {
  ROLES_EMPRESA_OPTIONS,
  mapRolEmpresaToSystemRole,
  getRolEmpresaOption,
  getAvailableRolesForUser,
} from '../roleMapper';

describe('roleMapper', () => {
  describe('ROLES_EMPRESA_OPTIONS', () => {
    it('has 9 role options', () => {
      expect(ROLES_EMPRESA_OPTIONS).toHaveLength(9);
    });

    it('includes all expected roles', () => {
      const values = ROLES_EMPRESA_OPTIONS.map(r => r.value);
      expect(values).toContain('SUPER_ADMIN');
      expect(values).toContain('ADMIN_EMPRESA');
      expect(values).toContain('GERENTE_SUCURSAL');
      expect(values).toContain('SUPERVISOR');
      expect(values).toContain('TALLER');
      expect(values).toContain('OFICINA');
      expect(values).toContain('USUARIO_SUCURSAL');
      expect(values).toContain('COBRANZAS');
      expect(values).toContain('TRANSPORTE');
    });

    it('roles that require sucursal are marked correctly', () => {
      const sucursalRoles = ROLES_EMPRESA_OPTIONS.filter(r => r.requiresSucursal);
      const values = sucursalRoles.map(r => r.value);
      expect(values).toContain('GERENTE_SUCURSAL');
      expect(values).toContain('SUPERVISOR');
      expect(values).toContain('TALLER');
      expect(values).toContain('OFICINA');
      expect(values).toContain('USUARIO_SUCURSAL');
      expect(values).toContain('TRANSPORTE');
      // COBRANZAS opera a nivel empresa (cartera morosa de todas las sucursales),
      // no requiere asignación a una sucursal específica.
      expect(values).not.toContain('COBRANZAS');
      expect(values).not.toContain('SUPER_ADMIN');
      expect(values).not.toContain('ADMIN_EMPRESA');
    });

    it('each option has required fields', () => {
      ROLES_EMPRESA_OPTIONS.forEach(opt => {
        expect(opt.value).toBeDefined();
        expect(opt.label).toBeDefined();
        expect(opt.description).toBeDefined();
        expect(opt.color).toBeDefined();
        expect(opt.systemRole).toBeDefined();
        expect(typeof opt.requiresSucursal).toBe('boolean');
      });
    });
  });

  describe('mapRolEmpresaToSystemRole', () => {
    it('maps SUPER_ADMIN to ADMIN', () => {
      expect(mapRolEmpresaToSystemRole('SUPER_ADMIN')).toBe('ADMIN');
    });

    it('maps ADMIN_EMPRESA to ADMIN', () => {
      expect(mapRolEmpresaToSystemRole('ADMIN_EMPRESA')).toBe('ADMIN');
    });

    it('maps GERENTE_SUCURSAL to VENDEDOR', () => {
      expect(mapRolEmpresaToSystemRole('GERENTE_SUCURSAL')).toBe('VENDEDOR');
    });

    it('maps SUPERVISOR to VENDEDOR', () => {
      expect(mapRolEmpresaToSystemRole('SUPERVISOR')).toBe('VENDEDOR');
    });

    it('maps USUARIO_SUCURSAL to USUARIO', () => {
      expect(mapRolEmpresaToSystemRole('USUARIO_SUCURSAL')).toBe('USUARIO');
    });

    it('defaults to USUARIO for unknown role', () => {
      expect(mapRolEmpresaToSystemRole('UNKNOWN' as any)).toBe('USUARIO');
    });
  });

  describe('getRolEmpresaOption', () => {
    it('returns option for valid role', () => {
      const opt = getRolEmpresaOption('ADMIN_EMPRESA');
      expect(opt).toBeDefined();
      expect(opt!.label).toBe('Administrador de Empresa');
    });

    it('returns undefined for unknown role', () => {
      expect(getRolEmpresaOption('NONEXISTENT' as any)).toBeUndefined();
    });
  });

  describe('getAvailableRolesForUser', () => {
    it('super admin gets all roles', () => {
      const roles = getAvailableRolesForUser(true);
      expect(roles).toHaveLength(9);
      expect(roles.map(r => r.value)).toContain('SUPER_ADMIN');
    });

    it('non-super admin cannot create SUPER_ADMIN', () => {
      const roles = getAvailableRolesForUser(false);
      expect(roles).toHaveLength(8);
      expect(roles.map(r => r.value)).not.toContain('SUPER_ADMIN');
    });
  });
});
