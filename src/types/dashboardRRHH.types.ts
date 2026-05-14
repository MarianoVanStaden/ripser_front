// DTOs del dashboard de RRHH. Espejo de
// com.ripser_back.dto.rrhh.DashboardRRHHDTO en el backend.

export interface TendenciaMensualDTO {
  mes: string;
  anio: number;
  altas: number;
  bajas: number;
}

export interface PuntoSerieDTO {
  label: string;
  valor: number;
}

export interface DistribucionDTO {
  etiqueta: string;
  cantidad: number;
}

export interface EmpleadoResumenDTO {
  id: number;
  nombreCompleto: string;
  puesto: string | null;
  fechaIngreso: string; // ISO LocalDate
  estado: string | null;
}

export interface SolicitudPendienteDTO {
  id: number;
  empleado: string;
  tipo: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  dias: number | null;
}

export interface CumpleanosDTO {
  id: number;
  nombreCompleto: string;
  fechaNacimiento: string; // ISO LocalDate
  diaMes: number;
}

export interface DashboardRRHHDTO {
  totalEmpleados: number;
  empleadosActivos: number;
  empleadosInactivos: number;
  empleadosEnLicencia: number;

  presentismoHoy: number;
  empleadosEsperadosHoy: number;
  porcentajePresentismoHoy: number;

  ausenciasHoy: number;
  documentosPorVencer: number;
  cumpleanosMes: number;

  rotacionMensual: TendenciaMensualDTO[];
  asistenciaSemanal: PuntoSerieDTO[];
  asistenciaMensual: PuntoSerieDTO[];
  distribucionPorSector: DistribucionDTO[];
  horasTrabajadasSemanal: PuntoSerieDTO[];

  ultimosIngresos: EmpleadoResumenDTO[];
  solicitudesPendientes: SolicitudPendienteDTO[];
  proximosCumpleanos: CumpleanosDTO[];
}
