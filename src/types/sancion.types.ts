/**
 * Tipos para el módulo Disciplina / Gestión Disciplinaria.
 * Alineado con backend: SancionDTO, SancionCreateDTO, SancionEmpleadoResumenDTO,
 * DisciplinaDashboardDTO.
 */

export type TipoSancion =
  | 'LLAMADA_ATENCION_VERBAL'
  | 'APERCIBIMIENTO_ESCRITO'
  | 'SUSPENSION'
  | 'DESPIDO';

export const TIPO_SANCION_LABEL: Record<TipoSancion, string> = {
  LLAMADA_ATENCION_VERBAL: 'Llamada de Atención Verbal',
  APERCIBIMIENTO_ESCRITO: 'Apercibimiento Escrito',
  SUSPENSION: 'Suspensión',
  DESPIDO: 'Despido',
};

export const TIPO_SANCION_COLOR: Record<TipoSancion, 'default' | 'info' | 'warning' | 'error'> = {
  LLAMADA_ATENCION_VERBAL: 'info',
  APERCIBIMIENTO_ESCRITO: 'warning',
  SUSPENSION: 'error',
  DESPIDO: 'error',
};

export const TIPO_SANCION_GRAVEDAD: Record<TipoSancion, number> = {
  LLAMADA_ATENCION_VERBAL: 1,
  APERCIBIMIENTO_ESCRITO: 2,
  SUSPENSION: 3,
  DESPIDO: 4,
};

export type EstadoSancion = 'PENDIENTE' | 'NOTIFICADA' | 'CUMPLIDA' | 'ANULADA';

export const ESTADO_SANCION_LABEL: Record<EstadoSancion, string> = {
  PENDIENTE: 'Pendiente',
  NOTIFICADA: 'Notificada',
  CUMPLIDA: 'Cumplida',
  ANULADA: 'Anulada',
};

export const ESTADO_SANCION_COLOR: Record<EstadoSancion, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  PENDIENTE: 'warning',
  NOTIFICADA: 'info',
  CUMPLIDA: 'success',
  ANULADA: 'default',
};

export type NivelGravedad = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export const NIVEL_GRAVEDAD_COLOR: Record<NivelGravedad, 'success' | 'info' | 'warning' | 'error'> = {
  BAJO: 'success',
  MEDIO: 'info',
  ALTO: 'warning',
  CRITICO: 'error',
};

export interface SancionDTO {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  empleadoApellido: string;
  empleadoDni: string;
  legajo?: number;
  departamento?: string;
  sector?: string;
  puesto?: string;
  fecha: string;            // ISO yyyy-MM-dd
  tipo: TipoSancion;
  tipoDescripcion?: string;
  gravedad?: number;
  dias: number;
  motivo: string;
  motivoAcumulado?: string;
  pedidaPor?: string;
  estado: EstadoSancion;
  observaciones?: string;
  cantidadDocumentos?: number;
  fechaCreacion?: string;
  creadoPor?: string;
}

export interface SancionCreateDTO {
  empleadoId: number;
  fecha: string;
  tipo: TipoSancion;
  dias?: number;
  motivo: string;
  motivoAcumulado?: string;
  pedidaPor?: string;
  estado?: EstadoSancion;
  observaciones?: string;
}

export interface SancionEmpleadoResumenDTO {
  empleadoId: number;
  empleadoNombre: string;
  empleadoApellido: string;
  empleadoDni: string;
  departamento?: string;
  sector?: string;
  puesto?: string;
  totalSanciones: number;
  sancionesUltimos12Meses: number;
  suspensiones: number;
  diasSuspensionTotales: number;
  ultimaSancion?: string;
  puntajeReincidencia: number;
  nivelGravedad: NivelGravedad;
  motivosAcumulados: Record<string, number>;
  historial: SancionDTO[];
}

export interface EvolucionMensualPunto {
  mes: string;             // YYYY-MM
  total: number;
  suspensiones: number;
  apercibimientos: number;
  llamadasAtencion: number;
}

export interface DisciplinaDashboardDTO {
  totalSanciones: number;
  sancionesMesActual: number;
  sancionesMesAnterior: number;
  suspensionesActivasMes: number;
  diasSuspensionMes: number;
  empleadosConSanciones: number;
  empleadosReincidentes: number;
  distribucionPorTipo: Partial<Record<TipoSancion, number>>;
  distribucionPorSector: Record<string, number>;
  distribucionPorDepartamento: Record<string, number>;
  motivosFrecuentes: Record<string, number>;
  evolucionMensual: EvolucionMensualPunto[];
  topReincidentes: SancionEmpleadoResumenDTO[];
}

/** Categorías de documentos para sanciones — replican las del backend. */
export const CATEGORIAS_DOC_SANCION = [
  'CONTRATO',
  'CERTIFICADO',
  'COMPROBANTE',
  'FOTO',
  'OTROS',
];
