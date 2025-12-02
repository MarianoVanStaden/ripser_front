import type { LeadDTO, ConversionLeadRequest, ValidationErrors } from '../types/lead.types';

/**
 * Valida un email
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return true; // opcional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida los datos de un lead al crear o editar
 */
export const validateLead = (lead: Partial<LeadDTO>): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!lead.nombre || lead.nombre.trim() === '') {
    errors.nombre = 'El nombre es obligatorio';
  }

  if (!lead.telefono || lead.telefono.trim() === '') {
    errors.telefono = 'El teléfono es obligatorio';
  }

  if (!lead.canal) {
    errors.canal = 'El canal es obligatorio';
  }

  if (!lead.estadoLead) {
    errors.estadoLead = 'El estado es obligatorio';
  }

  return errors;
};

/**
 * Valida los datos de conversión de lead a cliente
 */
export const validateConversion = (data: ConversionLeadRequest): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (data.emailCliente && !isValidEmail(data.emailCliente)) {
    errors.emailCliente = 'Email inválido';
  }

  if (data.montoConversion !== undefined && data.montoConversion <= 0) {
    errors.montoConversion = 'El monto debe ser mayor a 0';
  }

  return errors;
};

/**
 * Formatea un número de teléfono (puede extenderse según necesidad)
 */
export const formatPhone = (phone: string): string => {
  // Eliminar espacios y guiones
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // Si tiene 10 dígitos, formatear como (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  // Si tiene 11 dígitos (ej: Argentina con 11), formatear como XX-XXXX-XXXX
  if (cleaned.length === 11) {
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  
  return phone;
};

/**
 * Calcula los días transcurridos desde una fecha
 */
export const calculateDaysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Formatea una fecha ISO a formato local
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Formatea un monto a moneda argentina
 */
export const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null) return '-';
  
  return amount.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
