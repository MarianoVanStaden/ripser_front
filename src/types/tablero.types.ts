// Tipos del Tablero de Armado de Viajes (módulo Transporte).
// Espejo de TableroPendienteDTO / EquipoEntregaDTO del backend
// (GET /api/viajes/tablero/pendientes).

export type TipoOrigenTablero = 'FACTURA' | 'ORDEN_SERVICIO';

export type EstadoTablero = 'PENDIENTE' | 'ASIGNADO';

export interface EquipoEntregaTablero {
  id: number;
  numeroHeladera: string | null;
  codigoVenta: string | null;
  modelo: string | null;
  tipo: string | null;
  // Mirror de dto/color/ColorDTO.java (ver ColorEquipo en venta.types.ts).
  color: { id: number; nombre: string; activo?: boolean } | null;
  estadoAsignacion: string | null;
}

export interface TableroPendienteRow {
  tipoOrigen: TipoOrigenTablero;
  documentoComercialId: number | null;
  ordenServicioId: number | null;
  /** numeroDocumento de la factura o numeroOrden de la OS. */
  numeroDocumento: string;
  /** ISO yyyy-mm-dd de emisión de la factura; null para OS. */
  fechaEmision: string | null;

  clienteId: number | null;
  clienteNombre: string | null;
  direccion: string | null;
  ciudad: string | null;
  /** Nombre del enum Provincia del backend (ej. 'SANTA_FE'), null si no cargada. */
  provincia: string | null;

  observaciones: string | null;

  /** ISO yyyy-mm-dd; null = "Sin fecha". */
  fechaEstimadaEntrega: string | null;
  /** hoy - fechaEstimada en días: >0 atrasado, 0 hoy, <0 futuro, null sin fecha. */
  diasAtraso: number | null;

  equipos: EquipoEntregaTablero[];

  /** true = factura sin ningún equipo asignado hoy (nunca se asignó o se desasignó). */
  sinEquiposAsignados: boolean;
  /** true = descartada a mano del tablero (solo llega con filtro soloDescartadas). */
  entregaDescartada: boolean;
  motivoDescarteEntrega: string | null;
  /** true = superó DIAS_ENTREGA_ESTIMADA desde la emisión y el precio de lista de sus equipos subió. */
  alertaPrecioDesactualizado: boolean;
  /** Solo cuando hay alerta de precio: suma de líneas EQUIPO a precio facturado vs precio actual. */
  montoEquiposFacturado: number | null;
  montoEquiposActual: number | null;

  /** true = ya tiene entrega en un viaje PLANIFICADO (no seleccionable). */
  asignadoAViaje: boolean;
  viajeId: number | null;
  numeroViaje: string | null;
}
