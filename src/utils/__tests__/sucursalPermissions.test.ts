import { describe, it, expect } from 'vitest';
import type { Sucursal } from '../../types/tenant.types';
import {
  canChangeSucursal,
  canViewAllSucursales,
  getSucursalLabel,
  canManageSucursales,
} from '../sucursalPermissions';

const makeSucursal = (overrides: Partial<Sucursal> = {}): Sucursal => ({
  id: 1,
  empresaId: 1,
  codigo: 'SUC001',
  nombre: 'Sucursal Central',
  esPrincipal: true,
  estado: 'ACTIVO',
  fechaCreacion: '2024-01-01',
  ...overrides,
});

describe('sucursalPermissions', () => {
  describe('canChangeSucursal', () => {
    it('returns true for super admin', () => {
      expect(canChangeSucursal(null, true)).toBe(true);
    });

    it('returns true for ADMIN_EMPRESA', () => {
      expect(canChangeSucursal('ADMIN_EMPRESA', false)).toBe(true);
    });

    it('returns true for GERENTE_SUCURSAL', () => {
      expect(canChangeSucursal('GERENTE_SUCURSAL', false)).toBe(true);
    });

    it('returns true for SUPERVISOR', () => {
      expect(canChangeSucursal('SUPERVISOR', false)).toBe(true);
    });

    it('returns false for USUARIO_SUCURSAL', () => {
      expect(canChangeSucursal('USUARIO_SUCURSAL', false)).toBe(false);
    });

    it('returns false for null role when not super admin', () => {
      expect(canChangeSucursal(null, false)).toBe(false);
    });
  });

  describe('canViewAllSucursales', () => {
    it('delegates to canChangeSucursal', () => {
      expect(canViewAllSucursales('ADMIN_EMPRESA', false)).toBe(true);
      expect(canViewAllSucursales('SUPERVISOR', false)).toBe(true);
      expect(canViewAllSucursales(null, true)).toBe(true);
    });
  });

  describe('getSucursalLabel', () => {
    it('returns name with default indicator', () => {
      expect(getSucursalLabel(makeSucursal({ nombre: 'Central' }), true)).toBe('Central (Por defecto)');
    });

    it('returns just name when not default', () => {
      expect(getSucursalLabel(makeSucursal({ nombre: 'Norte' }), false)).toBe('Norte');
    });

    it('returns "Todas las sucursales" for null', () => {
      expect(getSucursalLabel(null, false)).toBe('Todas las sucursales');
    });
  });

  describe('canManageSucursales', () => {
    it('returns true for super admin', () => {
      expect(canManageSucursales(null, true)).toBe(true);
    });

    it('returns true for ADMIN_EMPRESA', () => {
      expect(canManageSucursales('ADMIN_EMPRESA', false)).toBe(true);
    });

    it('returns false for GERENTE_SUCURSAL', () => {
      expect(canManageSucursales('GERENTE_SUCURSAL', false)).toBe(false);
    });

    it('returns false for null role when not super admin', () => {
      expect(canManageSucursales(null, false)).toBe(false);
    });
  });
});
