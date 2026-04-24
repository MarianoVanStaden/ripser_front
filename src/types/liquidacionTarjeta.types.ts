export interface LiquidacionTarjeta {
  id: number;
  empresaId: number;
  sucursalId: number | null;
  cajaOrigenId: number;
  cajaOrigenNombre: string;
  cajaDestinoId: number;
  cajaDestinoNombre: string;
  fechaLiquidacion: string;
  montoBruto: number;
  comision: number;
  montoNeto: number;
  movimientoEgresoId: number | null;
  movimientoIngresoId: number | null;
  movimientoComisionId: number | null;
  usuarioId: number | null;
  observaciones: string | null;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface CreateLiquidacionTarjetaDTO {
  cajaOrigenId: number;
  cajaDestinoId: number;
  fechaLiquidacion: string;
  montoBruto: number;
  comision?: number;
  observaciones?: string;
}
