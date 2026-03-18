import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  validateLead,
  validateConversion,
  formatPhone,
  calculateDaysSince,
  formatDate,
  formatCurrency,
} from '../leadValidations';

describe('leadValidations', () => {
  describe('isValidEmail', () => {
    it('returns true for valid email', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('returns true for empty string (optional field)', () => {
      expect(isValidEmail('')).toBe(true);
    });

    it('returns false for invalid email', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@missing-user.com')).toBe(false);
    });

    it('returns false for email with spaces', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
    });
  });

  describe('validateLead', () => {
    it('returns no errors for valid lead', () => {
      const lead = {
        nombre: 'Juan',
        telefono: '1234567890',
        canal: 'WEB' as const,
        estadoLead: 'PRIMER_CONTACTO' as const,
      };
      expect(validateLead(lead)).toEqual({});
    });

    it('returns error for missing nombre', () => {
      const lead = { telefono: '123', canal: 'WEB' as const, estadoLead: 'PRIMER_CONTACTO' as const };
      const errors = validateLead(lead);
      expect(errors.nombre).toBeDefined();
    });

    it('returns error for empty nombre', () => {
      const lead = { nombre: '  ', telefono: '123', canal: 'WEB' as const, estadoLead: 'PRIMER_CONTACTO' as const };
      const errors = validateLead(lead);
      expect(errors.nombre).toBeDefined();
    });

    it('returns error for missing telefono', () => {
      const lead = { nombre: 'Juan', canal: 'WEB' as const, estadoLead: 'PRIMER_CONTACTO' as const };
      const errors = validateLead(lead);
      expect(errors.telefono).toBeDefined();
    });

    it('returns error for missing canal', () => {
      const lead = { nombre: 'Juan', telefono: '123', estadoLead: 'PRIMER_CONTACTO' as const };
      const errors = validateLead(lead);
      expect(errors.canal).toBeDefined();
    });

    it('returns error for missing estadoLead', () => {
      const lead = { nombre: 'Juan', telefono: '123', canal: 'WEB' as const };
      const errors = validateLead(lead);
      expect(errors.estadoLead).toBeDefined();
    });

    it('returns multiple errors at once', () => {
      const errors = validateLead({});
      expect(Object.keys(errors).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('validateConversion', () => {
    it('returns no errors for valid conversion', () => {
      const data = { montoConversion: 1000, emailCliente: 'a@b.com' };
      expect(validateConversion(data)).toEqual({});
    });

    it('returns error for invalid email', () => {
      const errors = validateConversion({ emailCliente: 'invalid' });
      expect(errors.emailCliente).toBeDefined();
    });

    it('returns error for zero monto', () => {
      const errors = validateConversion({ montoConversion: 0 });
      expect(errors.montoConversion).toBeDefined();
    });

    it('returns error for negative monto', () => {
      const errors = validateConversion({ montoConversion: -100 });
      expect(errors.montoConversion).toBeDefined();
    });

    it('no error when email is not provided', () => {
      const errors = validateConversion({});
      expect(errors.emailCliente).toBeUndefined();
    });

    it('no error when monto is undefined', () => {
      const errors = validateConversion({});
      expect(errors.montoConversion).toBeUndefined();
    });
  });

  describe('formatPhone', () => {
    it('formats 10-digit numbers', () => {
      expect(formatPhone('1234567890')).toBe('(123) 456-7890');
    });

    it('formats 11-digit numbers (Argentina)', () => {
      expect(formatPhone('11234567890')).toBe('11-2345-67890');
    });

    it('strips spaces and dashes before formatting', () => {
      expect(formatPhone('123-456-7890')).toBe('(123) 456-7890');
      expect(formatPhone('123 456 7890')).toBe('(123) 456-7890');
    });

    it('returns original for other lengths', () => {
      expect(formatPhone('12345')).toBe('12345');
    });
  });

  describe('calculateDaysSince', () => {
    it('calculates days from a past date', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const result = calculateDaysSince(threeDaysAgo.toISOString());
      expect(result).toBeGreaterThanOrEqual(3);
      expect(result).toBeLessThanOrEqual(4);
    });

    it('returns 0 or 1 for today', () => {
      const today = new Date().toISOString();
      const result = calculateDaysSince(today);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('formatDate', () => {
    it('formats ISO date to es-AR locale', () => {
      const result = formatDate('2024-03-15T12:00:00');
      // locale output varies by environment; just check it contains year
      expect(result).toContain('2024');
      expect(result).not.toBe('-');
    });

    it('returns dash for undefined', () => {
      expect(formatDate(undefined)).toBe('-');
    });

    it('returns dash for empty string', () => {
      expect(formatDate('')).toBe('-');
    });
  });

  describe('formatCurrency', () => {
    it('formats amount as ARS', () => {
      const result = formatCurrency(1500);
      // locale format varies; may show "ARS" or "$" symbol
      expect(result).toMatch(/[$ARS]/);
      expect(result).toMatch(/1[.,]?500/);
    });

    it('returns dash for undefined', () => {
      expect(formatCurrency(undefined)).toBe('-');
    });

    it('returns dash for null', () => {
      expect(formatCurrency(null as any)).toBe('-');
    });

    it('formats zero', () => {
      const result = formatCurrency(0);
      expect(result).not.toBe('-');
    });
  });
});
