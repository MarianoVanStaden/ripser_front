import type { Client } from './cliente.types';
import type { Sale } from './venta.types';
import type { Product } from './producto.types';
import type { Employee } from './rrhh.types';
// Garantías, reclamos y aliases en español.

export interface Warranty {
  id: number;
  productId: number;
  product?: Product;
  clientId: number;
  client?: Client;
  tipoIva?: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
  saleId?: number;
  sale?: Sale;
  warrantyNumber: string;
  startDate: string;
  endDate: string;
  status: WarrantyStatus;
  type: WarrantyType;
  description: string;
  claims: WarrantyClaim[];
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyClaim {
  id: number;
  warrantyId: number;
  claimNumber: string;
  claimDate: string;
  description: string;
  status: ClaimStatus;
  solution: ClaimSolution;
  employeeId: number;
  employee?: Employee;
  resolution: string;
  resolutionDate?: string;
  cost: number;
  createdAt: string;
  updatedAt: string;
}
export const WarrantyStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  VOIDED: 'VOIDED',
  CLAIMED: 'CLAIMED'
} as const;
export type WarrantyStatus = typeof WarrantyStatus[keyof typeof WarrantyStatus];

export const WarrantyType = {
  MANUFACTURER: 'MANUFACTURER',
  EXTENDED: 'EXTENDED',
  SERVICE: 'SERVICE'
} as const;
export type WarrantyType = typeof WarrantyType[keyof typeof WarrantyType];

export const ClaimStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED'
} as const;
export type ClaimStatus = typeof ClaimStatus[keyof typeof ClaimStatus];

export const ClaimSolution = {
  REPAIR: 'REPAIR',
  REPLACEMENT: 'REPLACEMENT',
  REFUND: 'REFUND',
  REMOTE_SUPPORT: 'REMOTE_SUPPORT'
} as const;
export type ClaimSolution = typeof ClaimSolution[keyof typeof ClaimSolution];
// --- Garantía (Warranty) Aliases for Frontend Consistency ---
export type Garantia = Warranty;
export type ReclamoGarantia = WarrantyClaim;
