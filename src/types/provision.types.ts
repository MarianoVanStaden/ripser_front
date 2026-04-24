export type TipoProvision = 'AGUINALDO' | 'VACACIONES' | 'SAC' | 'OTRO';

export interface ProvisionMensualDTO {
  id: number;
  empresaId: number;
  sucursalId: number | null;
  tipo: TipoProvision;
  anio: number;
  mes: number;
  montoProvisionado: number;
  montoAcumuladoPeriodo: number;
  montoPagado: number;
  saldoPendiente: number;
  observaciones: string | null;
  fechaCreacion: string;
}

export interface ResumenProvisionAnualDTO {
  tipo: TipoProvision;
  anio: number;
  empresaId: number;
  totalProvisionado: number;
  totalPagado: number;
  saldoPendienteTotal: number;
  detalle: ProvisionMensualDTO[];
}

export interface GuardarProvisionDTO {
  sucursalId?: number | null;
  montoProvisionado: number;
  observaciones?: string | null;
}

export interface RegistrarPagoProvisionDTO {
  montoPagado: number;
  metodoPago?: import('./prestamo.types').MetodoPago;
  cajaPesosId?: number | null;
  cajaAhorroId?: number | null;
}
