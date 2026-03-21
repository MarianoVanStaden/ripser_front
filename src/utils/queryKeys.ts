export const QUERY_KEYS = {
  CUENTA_CLIENTE: (clienteId: number) =>
    ['cuentaCorrienteCliente', clienteId] as const,

  CUENTA_PROVEEDOR: (proveedorId: number) =>
    ['cuentaCorrienteProveedor', proveedorId] as const,

  FLUJO_CAJA: (fechaDesde?: string, fechaHasta?: string) =>
    ['flujoCaja', fechaDesde, fechaHasta] as const,
} as const;
