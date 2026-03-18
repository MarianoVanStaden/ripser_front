import { describe, it, expect, beforeEach } from 'vitest';
import { migrateTenantContext, needsMigration } from '../storageMigration';

describe('storageMigration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('migrateTenantContext', () => {
    it('migrates keys from localStorage to sessionStorage', () => {
      localStorage.setItem('empresaId', '5');
      localStorage.setItem('sucursalId', '10');

      migrateTenantContext();

      expect(sessionStorage.getItem('empresaId')).toBe('5');
      expect(sessionStorage.getItem('sucursalId')).toBe('10');
    });

    it('does not overwrite existing sessionStorage values', () => {
      localStorage.setItem('empresaId', '5');
      sessionStorage.setItem('empresaId', '99');

      migrateTenantContext();

      expect(sessionStorage.getItem('empresaId')).toBe('99');
    });

    it('keeps localStorage values by default', () => {
      localStorage.setItem('empresaId', '5');

      migrateTenantContext();

      expect(localStorage.getItem('empresaId')).toBe('5');
    });

    it('removes from localStorage when removeFromLocal is true', () => {
      localStorage.setItem('empresaId', '5');

      migrateTenantContext({ removeFromLocal: true });

      expect(localStorage.getItem('empresaId')).toBeNull();
      expect(sessionStorage.getItem('empresaId')).toBe('5');
    });

    it('handles custom keys', () => {
      localStorage.setItem('customKey', 'value');

      migrateTenantContext({ keys: ['customKey'] });

      expect(sessionStorage.getItem('customKey')).toBe('value');
    });

    it('does nothing when no matching keys in localStorage', () => {
      migrateTenantContext();
      expect(sessionStorage.length).toBe(0);
    });

    it('migrates default keys: empresaId, sucursalId, esSuperAdmin, sucursalFiltro', () => {
      localStorage.setItem('empresaId', '1');
      localStorage.setItem('sucursalId', '2');
      localStorage.setItem('esSuperAdmin', 'true');
      localStorage.setItem('sucursalFiltro', '3');

      migrateTenantContext();

      expect(sessionStorage.getItem('empresaId')).toBe('1');
      expect(sessionStorage.getItem('sucursalId')).toBe('2');
      expect(sessionStorage.getItem('esSuperAdmin')).toBe('true');
      expect(sessionStorage.getItem('sucursalFiltro')).toBe('3');
    });
  });

  describe('needsMigration', () => {
    it('returns true when localStorage has empresaId but sessionStorage does not', () => {
      localStorage.setItem('empresaId', '5');
      expect(needsMigration()).toBe(true);
    });

    it('returns false when both have empresaId', () => {
      localStorage.setItem('empresaId', '5');
      sessionStorage.setItem('empresaId', '5');
      expect(needsMigration()).toBe(false);
    });

    it('returns false when neither has empresaId', () => {
      expect(needsMigration()).toBe(false);
    });

    it('returns false when only sessionStorage has empresaId', () => {
      sessionStorage.setItem('empresaId', '5');
      expect(needsMigration()).toBe(false);
    });
  });
});
