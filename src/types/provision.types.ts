export interface ProvisionMensualDTO {
  id: number;
  empresaId: number;
  sucursalId: number | null;
  tipoId: number;
  tipoCodigo: string;
  tipoNombre: string;
  cuentaEnPatrimonio: boolean;
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
  tipoId: number;
  tipoCodigo: string;
  tipoNombre: string;
  cuentaEnPatrimonio: boolean;
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
  /** Monto en pesos que sale de la caja origen. */
  montoPagado: number;
  /** Caja en pesos de donde sale el pago (origen). */
  cajaPesosId: number;
  /** Caja en dólares donde ingresa el equivalente convertido (destino). */
  cajaDestinoAhorroId: number;
  /** Cotización para convertir pesos → dólares. */
  valorDolar: number;
}
