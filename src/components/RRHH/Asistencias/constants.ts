// FRONT-003: extracted from AsistenciasPage.tsx — constants and form
// factories used by the page and its dialogs.
import dayjs from 'dayjs';
import type { ConfigFormData, DiaSemana, ExcepcionFormData, TipoExcepcion } from './types';

export const DIAS_SEMANA: DiaSemana[] = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
];

/** Tipos de excepción seleccionables en el dialog. */
export const TIPO_EXCEPCION_OPTIONS: { value: Exclude<TipoExcepcion, ''>; label: string }[] = [
  { value: 'INASISTENCIA', label: 'Inasistencia' },
  { value: 'LLEGADA_TARDE', label: 'Llegada Tarde' },
  { value: 'SALIDA_ANTICIPADA', label: 'Salida Anticipada' },
  { value: 'HORAS_EXTRAS', label: 'Horas Extras' },
  { value: 'PERMISO', label: 'Permiso' },
  { value: 'MODIFICACION_HORARIO', label: 'Modificación de Horario' },
];

/**
 * Default per-día config used when opening the Configurar Horarios dialog
 * without an existing config (or as fallback when a día is missing on the
 * server payload).  L–V trabaja, S–D no.
 */
export const DEFAULT_DIA_CONFIG: ConfigFormData = {
  lunes: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
  martes: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
  miercoles: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
  jueves: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
  viernes: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
  sabado: { trabaja: false, horaEntrada: '08:00', horaSalida: '12:00' },
  domingo: { trabaja: false, horaEntrada: '08:00', horaSalida: '12:00' },
};

/** Fallback usado cuando el config del backend no trae el día. */
export const FALLBACK_DIA: { trabaja: boolean; horaEntrada: string; horaSalida: string } = {
  trabaja: false,
  horaEntrada: '08:00',
  horaSalida: '17:00',
};

/** Factory for a fresh "Registrar Excepción" form (fecha = today). */
export const createInitialExcepcionForm = (): ExcepcionFormData => ({
  empleadoId: '',
  fecha: dayjs().format('YYYY-MM-DD'),
  tipo: '',
  horaEntradaReal: '',
  horaSalidaReal: '',
  horasExtras: '',
  minutosTardanza: '',
  motivo: '',
  observaciones: '',
  justificado: false,
});

/** Time inputs esperan "HH:mm"; el backend devuelve "HH:mm:ss". */
const toInputTime = (value?: string | null): string =>
  value ? value.slice(0, 5) : '';

/**
 * Precarga el form de excepción a partir de una excepción existente (modo edición).
 * Todos los campos se vuelven string porque están atados a inputs controlados.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const excepcionToFormData = (excepcion: any): ExcepcionFormData => ({
  empleadoId: excepcion.empleadoId != null ? String(excepcion.empleadoId) : '',
  fecha: excepcion.fecha
    ? dayjs(excepcion.fecha).format('YYYY-MM-DD')
    : dayjs().format('YYYY-MM-DD'),
  tipo: excepcion.tipo ?? '',
  horaEntradaReal: toInputTime(excepcion.horaEntradaReal),
  horaSalidaReal: toInputTime(excepcion.horaSalidaReal),
  horasExtras: excepcion.horasExtras != null ? String(excepcion.horasExtras) : '',
  minutosTardanza: excepcion.minutosTardanza != null ? String(excepcion.minutosTardanza) : '',
  motivo: excepcion.motivo ?? '',
  observaciones: excepcion.observaciones ?? '',
  justificado: Boolean(excepcion.justificado),
});
