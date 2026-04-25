import type { RecordatorioGlobalFilterParams } from '../api/services/recordatorioLeadApi';

export const QUERY_KEYS = {
  CUENTA_CLIENTE: (clienteId: number) =>
    ['cuentaCorrienteCliente', clienteId] as const,

  CUENTA_PROVEEDOR: (proveedorId: number) =>
    ['cuentaCorrienteProveedor', proveedorId] as const,

  FLUJO_CAJA: (fechaDesde?: string, fechaHasta?: string) =>
    ['flujoCaja', fechaDesde, fechaHasta] as const,

  RECORDATORIOS: (filters: RecordatorioGlobalFilterParams) =>
    ['recordatorios', filters] as const,

  RECORDATORIOS_CONTEOS: (sucursalId?: number, usuarioId?: number) =>
    ['recordatoriosConteos', sucursalId ?? null, usuarioId ?? null] as const,
} as const;
