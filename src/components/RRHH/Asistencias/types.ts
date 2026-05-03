// FRONT-003: extracted from AsistenciasPage.tsx — types kept colocated to
// the page that owns them; not promoted to /src/types/ because they're not
// shared across modules.

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export interface DiaConfig {
  trabaja: boolean;
  horaEntrada: string;
  horaSalida: string;
}

/** Form state for the "Configurar Horarios" dialog — one entry per día. */
export type ConfigFormData = Record<DiaSemana, DiaConfig>;

export type TipoExcepcion =
  | ''
  | 'INASISTENCIA'
  | 'LLEGADA_TARDE'
  | 'SALIDA_ANTICIPADA'
  | 'HORAS_EXTRAS'
  | 'PERMISO'
  | 'MODIFICACION_HORARIO';

/**
 * Form state for the "Registrar Excepción" dialog.  All fields are strings
 * because they are bound directly to text/time/select inputs; the parent
 * coerces to numbers/dates at submit time.
 */
export interface ExcepcionFormData {
  empleadoId: string;
  fecha: string;
  tipo: TipoExcepcion;
  horaEntradaReal: string;
  horaSalidaReal: string;
  horasExtras: string;
  minutosTardanza: string;
  motivo: string;
  observaciones: string;
  justificado: boolean;
}
