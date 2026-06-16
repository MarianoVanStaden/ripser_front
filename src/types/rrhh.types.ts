// RRHH: empleados, puestos, asistencia, licencias, capacitaciones, sueldos, legajos.

export interface EmployeePayroll {
  id: number;
  employeeId: number;
  employee?: Employee;
  period: string; // YYYY-MM
  basicSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  paymentDate: string;
  observations: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: number;
  employeeId: number;
  employee?: Employee;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  hoursWorked: number;
  observations: string;
}

export interface Training {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  instructor: string;
  status: TrainingStatus;
  employees: Employee[];
  cost: number;
  createdAt: string;
  updatedAt: string;
}
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  SICK_LEAVE: 'SICK_LEAVE',
  VACATION: 'VACATION',
  PERSONAL_LEAVE: 'PERSONAL_LEAVE'
} as const;
export type AttendanceStatus = typeof AttendanceStatus[keyof typeof AttendanceStatus];

export const TrainingStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;
export type TrainingStatus = typeof TrainingStatus[keyof typeof TrainingStatus];
export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  salary: number;
  hireDate: string;
  isActive: boolean;
}
// --- RRHH (Human Resources) Entities ---
export type EstadoEmpleado = 'ACTIVO' | 'INACTIVO' | 'LICENCIA';
export type TipoLicencia =
  | 'AUS_P_TRAMITES_PERSONAL'
  | 'LLEGADA_TARDE'
  | 'SALIDA_ANTICIPADA'
  | 'AUSENTE_SIN_AVISO'
  | 'DIAS_AUSENTE_INJUSTIFICADO'
  | 'DIAS_ENFERMEDAD'
  | 'DIAS_EXT_SANGRE'
  | 'DIAS_FAM_ENFERMO'
  | 'DIAS_SUSPENSION'
  | 'FALTA_JUSTIFICADA'
  | 'LIC_ACCIDENTE'
  | 'LIC_EXAMEN'
  | 'LIC_FALLECIMIENTO_FAMILIAR'
  | 'LIC_MATERNIDAD'
  | 'LIC_MATRIMONIO'
  | 'LIC_MATRIMONIO_HIJO'
  | 'LIC_MUDANZA'
  | 'LIC_NACIMIENTO_HIJO'
  | 'LIC_SIN_GOCE_SUELDO'
  | 'LIC_VACACIONES'
  | 'RESERVA_DE_PUESTO';

export const TIPO_LICENCIA_LABEL: Record<TipoLicencia, string> = {
  AUS_P_TRAMITES_PERSONAL: 'Aus. p/Tramites Personal',
  LLEGADA_TARDE: 'Llegada Tarde',
  SALIDA_ANTICIPADA: 'Salida Anticipada',
  AUSENTE_SIN_AVISO: 'Ausente Sin aviso',
  DIAS_AUSENTE_INJUSTIFICADO: 'Dias Ausente Injustificado',
  DIAS_ENFERMEDAD: 'Dias Enfermedad',
  DIAS_EXT_SANGRE: 'Dias Ext. Sangre',
  DIAS_FAM_ENFERMO: 'Dias Fam. Enfermo',
  DIAS_SUSPENSION: 'Dias Suspensión',
  FALTA_JUSTIFICADA: 'Falta Justificada',
  LIC_ACCIDENTE: 'Lic. Accidente',
  LIC_EXAMEN: 'Lic. Examen',
  LIC_FALLECIMIENTO_FAMILIAR: 'Lic. Fallecimiento de Familiar',
  LIC_MATERNIDAD: 'Lic. Maternidad',
  LIC_MATRIMONIO: 'Lic. Matrimonio',
  LIC_MATRIMONIO_HIJO: 'Lic. Matrimonio Hijo',
  LIC_MUDANZA: 'Lic. Mudanza',
  LIC_NACIMIENTO_HIJO: 'Lic. Nacimiento Hijo',
  LIC_SIN_GOCE_SUELDO: 'Lic. Sin Goce Sueldo',
  LIC_VACACIONES: 'Lic. Vacaciones',
  RESERVA_DE_PUESTO: 'Reserva de Puesto',
};

export type EstadoLicencia = 'SOLICITADA' | 'APROBADA' | 'RECHAZADA';

// Puestos de Trabajo - RRHH API
export interface SubtareaPuestoDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  orden: number;
  obligatoria: boolean;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface TareaPuestoDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  orden: number;
  obligatoria: boolean;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  subtareas: SubtareaPuestoDTO[];
}

export interface PuestoListDTO {
  id: number;
  nombre: string;
  departamento?: string;
  salarioBase: number;
  version: number;
  activo: boolean;
  cantidadEmpleados: number;
  cantidadTareas: number;
  categoriaSalarialId?: number | null;
  categoriaSalarialNombre?: string | null;
}

// ===== Manual de Puestos: tipos auxiliares =====
export type TipoResponsabilidad = 'RESPONSABILIDAD' | 'AUTORIDAD';
export type TipoContactoPuesto = 'INTERNO' | 'EXTERNO';

export interface ObjetivoPuestoDTO {
  id?: number;
  descripcion: string;
  orden?: number;
  activo?: boolean;
}

export interface ResponsabilidadPuestoDTO {
  id?: number;
  tipo: TipoResponsabilidad;
  descripcion: string;
  orden?: number;
  activo?: boolean;
}

export interface HabilidadPuestoDTO {
  id?: number;
  descripcion: string;
  orden?: number;
  activo?: boolean;
}

export interface ConocimientoPuestoDTO {
  id?: number;
  descripcion: string;
  orden?: number;
  activo?: boolean;
}

export interface ContactoPuestoDTO {
  id?: number;
  tipo: TipoContactoPuesto;
  descripcion: string;
  orden?: number;
  activo?: boolean;
}

export interface PuestoCompetenciaDTO {
  id?: number;
  competenciaId: number;
  competenciaNombre?: string;
  competenciaTipo?: string;
  nivelRequerido?: number;
  observaciones?: string;
}

export interface PuestoRiesgoDTO {
  id?: number;
  riesgoId: number;
  riesgoNombre?: string;
  nivelSeveridad?: string;
  observaciones?: string;
}

export interface PuestoEppDTO {
  id?: number;
  eppId: number;
  eppNombre?: string;
  obligatorio?: boolean;
}

export interface PuestoReemplazoDTO {
  id?: number;
  puestoRelacionadoId: number;
  puestoRelacionadoNombre?: string;
}

export interface PuestoReferenciaDTO {
  id: number;
  nombre: string;
}

// ===== Puesto extendido =====
export interface PuestoResponseDTO {
  // Identificación básica
  id: number;
  nombre: string;
  descripcion?: string;
  /** Texto libre legacy. Preferir `departamentoId`. */
  departamento?: string;
  salarioBase: number;
  version: number;
  activo: boolean;
  requisitos?: string;
  objetivoGeneral?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  cantidadEmpleados: number;

  // Manual de Puestos
  mision?: string;
  ciuo?: string;
  volumenDotacion?: number;
  fechaRevision?: string;
  observacionesRequisitos?: string;

  // FKs (id + nombre)
  unidadNegocioId?: number;
  unidadNegocioNombre?: string;
  lugarTrabajoId?: number;
  lugarTrabajoNombre?: string;
  areaId?: number;
  areaNombre?: string;
  departamentoId?: number;
  departamentoNombre?: string;
  categoriaSalarialId?: number | null;
  categoriaSalarialNombre?: string | null;
  sectorId?: number;
  sectorNombre?: string;
  bandaJerarquicaId?: number;
  bandaJerarquicaCodigo?: string;
  bandaJerarquicaNombre?: string;
  nivelJerarquicoId?: number;
  nivelJerarquicoNombre?: string;
  nivelEducacionId?: number;
  nivelEducacionNombre?: string;
  tipoFormacionId?: number;
  tipoFormacionNombre?: string;
  nivelExperienciaId?: number;
  nivelExperienciaNombre?: string;

  // Jerarquía
  reportaAPuestoId?: number;
  reportaAPuestoNombre?: string;
  supervisaA?: PuestoReferenciaDTO[];

  // Listas estructuradas
  tareas: TareaPuestoDTO[];
  objetivos?: ObjetivoPuestoDTO[];
  responsabilidades?: ResponsabilidadPuestoDTO[];
  habilidades?: HabilidadPuestoDTO[];
  conocimientos?: ConocimientoPuestoDTO[];
  contactos?: ContactoPuestoDTO[];

  // M:N
  competencias?: PuestoCompetenciaDTO[];
  riesgos?: PuestoRiesgoDTO[];
  epps?: PuestoEppDTO[];
  reemplaza?: PuestoReemplazoDTO[];
  reemplazadoPor?: PuestoReemplazoDTO[];
}

export interface CreatePuestoDTO {
  nombre: string;
  descripcion?: string;
  departamento?: string;
  salarioBase?: number;
  categoriaSalarialId?: number | null;
  requisitos?: string;
  objetivoGeneral?: string;

  // Manual
  mision?: string;
  ciuo?: string;
  volumenDotacion?: number;
  fechaRevision?: string;
  observacionesRequisitos?: string;

  // FKs
  unidadNegocioId?: number;
  lugarTrabajoId?: number;
  areaId?: number;
  departamentoId?: number;
  sectorId?: number;
  bandaJerarquicaId?: number;
  nivelJerarquicoId?: number;
  nivelEducacionId?: number;
  tipoFormacionId?: number;
  nivelExperienciaId?: number;
  reportaAPuestoId?: number;

  // Listas
  tareas?: CreateTareaPuestoDTO[];
  objetivos?: ObjetivoPuestoDTO[];
  responsabilidades?: ResponsabilidadPuestoDTO[];
  habilidades?: HabilidadPuestoDTO[];
  conocimientos?: ConocimientoPuestoDTO[];
  contactos?: ContactoPuestoDTO[];

  // M:N
  competencias?: PuestoCompetenciaDTO[];
  riesgos?: PuestoRiesgoDTO[];
  epps?: PuestoEppDTO[];
  reemplazaPuestoIds?: number[];
}

/**
 * Update: las listas con valor `undefined` se ignoran; con un array (incluso
 * vacío) reemplazan por completo el contenido en el backend.
 */
export interface UpdatePuestoDTO {
  nombre?: string;
  descripcion?: string;
  departamento?: string;
  salarioBase?: number;
  categoriaSalarialId?: number | null;
  requisitos?: string;
  objetivoGeneral?: string;
  activo?: boolean;

  mision?: string;
  ciuo?: string;
  volumenDotacion?: number;
  fechaRevision?: string;
  observacionesRequisitos?: string;

  unidadNegocioId?: number;
  lugarTrabajoId?: number;
  areaId?: number;
  departamentoId?: number;
  sectorId?: number;
  bandaJerarquicaId?: number;
  nivelJerarquicoId?: number;
  nivelEducacionId?: number;
  tipoFormacionId?: number;
  nivelExperienciaId?: number;
  reportaAPuestoId?: number;

  objetivos?: ObjetivoPuestoDTO[];
  responsabilidades?: ResponsabilidadPuestoDTO[];
  habilidades?: HabilidadPuestoDTO[];
  conocimientos?: ConocimientoPuestoDTO[];
  contactos?: ContactoPuestoDTO[];

  competencias?: PuestoCompetenciaDTO[];
  riesgos?: PuestoRiesgoDTO[];
  epps?: PuestoEppDTO[];
  reemplazaPuestoIds?: number[];

  motivoCambio?: string;
}

export interface PuestoVersionDTO {
  id: number;
  version: number;
  snapshot: string;
  motivoCambio?: string;
  creadoPor?: string;
  fechaCreacion: string;
}

export interface CreateTareaPuestoDTO {
  nombre: string;
  descripcion?: string;
  orden?: number;
  obligatoria?: boolean;
}

export interface UpdateTareaPuestoDTO {
  nombre?: string;
  descripcion?: string;
  orden?: number;
  obligatoria?: boolean;
  activo?: boolean;
}

export interface CreateSubtareaPuestoDTO {
  nombre: string;
  descripcion?: string;
  orden?: number;
  obligatoria?: boolean;
}

export interface UpdateSubtareaPuestoDTO {
  nombre?: string;
  descripcion?: string;
  orden?: number;
  obligatoria?: boolean;
  activo?: boolean;
}

// Backward compat alias for Empleado.puesto
export type Puesto = PuestoListDTO;

// ── Catálogos cerrados de la Fase 1 (RRHH) ────────────────────────────────────
// Valores fijos (no requieren tabla). Se persisten como VARCHAR en backend y
// se valida por TS union en frontend.
export type Genero = 'MASCULINO' | 'FEMENINO' | 'OTRO';
export const GENERO_LABEL: Record<Genero, string> = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
  OTRO: 'Otro',
};
export const GENEROS: readonly Genero[] = ['MASCULINO', 'FEMENINO', 'OTRO'] as const;

export type EstadoCivil = 'SOLTERO' | 'CASADO' | 'VIUDO' | 'SEPARADO' | 'CONCUBINATO' | 'OTRO';
export const ESTADO_CIVIL_LABEL: Record<EstadoCivil, string> = {
  SOLTERO: 'Soltero/a',
  CASADO: 'Casado/a',
  VIUDO: 'Viudo/a',
  SEPARADO: 'Separado/a',
  CONCUBINATO: 'Concubinato',
  OTRO: 'Otro',
};
export const ESTADOS_CIVILES: readonly EstadoCivil[] =
  ['SOLTERO', 'CASADO', 'VIUDO', 'SEPARADO', 'CONCUBINATO', 'OTRO'] as const;

export type TipoManoObra = 'MOD' | 'MOI' | 'NO_APLICA';
export const TIPO_MANO_OBRA_LABEL: Record<TipoManoObra, string> = {
  MOD: 'MOD — Mano de Obra Directa',
  MOI: 'MOI — Mano de Obra Indirecta',
  NO_APLICA: 'No aplica',
};
export const TIPOS_MANO_OBRA: readonly TipoManoObra[] = ['MOD', 'MOI', 'NO_APLICA'] as const;

export type TipoContrato = 'EFECTIVO' | 'TEMPORAL' | 'PASANTIA' | 'TIEMPO_DETERMINADO' | 'OTRO';
export const TIPO_CONTRATO_LABEL: Record<TipoContrato, string> = {
  EFECTIVO: 'Efectivo',
  TEMPORAL: 'Temporal',
  PASANTIA: 'Pasantía',
  TIEMPO_DETERMINADO: 'Tiempo determinado',
  OTRO: 'Otro',
};
export const TIPOS_CONTRATO: readonly TipoContrato[] =
  ['EFECTIVO', 'TEMPORAL', 'PASANTIA', 'TIEMPO_DETERMINADO', 'OTRO'] as const;

export type MotivoEgreso = 'RENUNCIA' | 'DESPIDO' | 'JUBILACION' | 'FIN_CONTRATO' | 'OTRO';
export const MOTIVO_EGRESO_LABEL: Record<MotivoEgreso, string> = {
  RENUNCIA: 'Renuncia',
  DESPIDO: 'Despido',
  JUBILACION: 'Jubilación',
  FIN_CONTRATO: 'Fin de contrato',
  OTRO: 'Otro',
};
export const MOTIVOS_EGRESO: readonly MotivoEgreso[] =
  ['RENUNCIA', 'DESPIDO', 'JUBILACION', 'FIN_CONTRATO', 'OTRO'] as const;

export type TipoCuentaBancaria = 'CA' | 'CC';
export const TIPO_CUENTA_LABEL: Record<TipoCuentaBancaria, string> = {
  CA: 'Caja de Ahorro',
  CC: 'Cuenta Corriente',
};
export const TIPOS_CUENTA: readonly TipoCuentaBancaria[] = ['CA', 'CC'] as const;

export type MonedaSalario = 'ARS' | 'USD';
export const MONEDA_LABEL: Record<MonedaSalario, string> = {
  ARS: 'Pesos (ARS)',
  USD: 'Dólares (USD)',
};
export const MONEDAS: readonly MonedaSalario[] = ['ARS', 'USD'] as const;

export type GrupoSanguineo = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export const GRUPOS_SANGUINEOS: readonly GrupoSanguineo[] =
  ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type NivelEstudios = 'PRIMARIO' | 'SECUNDARIO' | 'UNIVERSITARIO' | 'POSGRADO';
export const NIVEL_ESTUDIOS_LABEL: Record<NivelEstudios, string> = {
  PRIMARIO: 'Primario',
  SECUNDARIO: 'Secundario',
  UNIVERSITARIO: 'Universitario',
  POSGRADO: 'Posgrado',
};
export const NIVELES_ESTUDIOS: readonly NivelEstudios[] =
  ['PRIMARIO', 'SECUNDARIO', 'UNIVERSITARIO', 'POSGRADO'] as const;

// ── Fase 2 — entidades relacionales del empleado (RRHH) ───────────────────────
export type VinculoCargaFamiliar = 'HIJO' | 'CONYUGE' | 'CONCUBINO' | 'HIJO_DISCAPACIDAD';
export const VINCULO_CARGA_LABEL: Record<VinculoCargaFamiliar, string> = {
  HIJO: 'Hijo/a',
  CONYUGE: 'Cónyuge',
  CONCUBINO: 'Concubino/a',
  HIJO_DISCAPACIDAD: 'Hijo/a con discapacidad',
};
export const VINCULOS_CARGA: readonly VinculoCargaFamiliar[] =
  ['HIJO', 'CONYUGE', 'CONCUBINO', 'HIJO_DISCAPACIDAD'] as const;

export type NivelIdioma = 'ALTO' | 'MEDIO' | 'BAJO';
export const NIVEL_IDIOMA_LABEL: Record<NivelIdioma, string> = {
  ALTO: 'Alto',
  MEDIO: 'Medio',
  BAJO: 'Bajo',
};
export const NIVELES_IDIOMA: readonly NivelIdioma[] = ['ALTO', 'MEDIO', 'BAJO'] as const;

export interface ContactoEmergencia {
  id: number;
  empleadoId: number;
  nombreCompleto: string;
  relacion?: string | null;
  telCodigoPais?: string | null;
  telArea?: string | null;
  telNumero?: string | null;
  email?: string | null;
  esPrincipal: boolean;
}

export interface CargaFamiliar {
  id: number;
  empleadoId: number;
  vinculo: VinculoCargaFamiliar;
  nombreCompleto: string;
  dni?: string | null;
  cuil?: string | null;
  fechaNacimiento?: string | null;
  observaciones?: string | null;
}

export interface IdiomaEmpleadoItem {
  id: number;
  empleadoId: number;
  idioma: string;
  nivel: NivelIdioma;
}

export interface Empleado {
  id: number;
  empresaId: number;         // Multi-tenant: empresa ID
  sucursalId?: number;       // Multi-tenant: sucursal ID (optional)
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaIngreso?: string;
  fechaEgreso?: string;
  estado: EstadoEmpleado;
  // El backend (EmpleadoDTO) devuelve sólo `puestoId` + `puestoNombre` flat,
  // no el objeto anidado `puesto`. Lo dejamos opcional por compat con código
  // que lo lee como fallback (ej. `e.puesto?.nombre ?? puestoNombre`), pero
  // en respuestas reales viene undefined — siempre privilegiar `puestoId` /
  // `puestoNombre` flat al popular formularios o filtros.
  puesto?: Puesto;
  puestoId?: number | null;
  puestoNombre?: string;
  /** Categoría salarial (módulo Remuneraciones) — default que usa la calculadora de Sueldos */
  categoriaSalarialId?: number | null;
  categoriaSalarialNombre?: string | null;
  salario: number;
  usuarioId: number | null;
  // Datos del legajo embebidos (1:1). Se autocrea al crear el empleado.
  legajoId?: number | null;
  numeroLegajo?: string | null;
  legajoFechaAlta?: string | null;
  legajoFechaBaja?: string | null;
  legajoMotivoBaja?: string | null;
  legajoDocumentacion?: string | null;
  legajoObservaciones?: string | null;
  legajoActivo?: boolean | null;
  // ── Fase 1: identificación ─────────────────────────────────────────────────
  cuil?: string | null;
  nombre2?: string | null;
  apellido2?: string | null;
  paisNacimiento?: string | null;
  provinciaNacimiento?: string | null;
  ciudadNacimiento?: string | null;
  nacionalidad1?: string | null;
  nacionalidad2?: string | null;
  docNacionalidad2?: string | null;
  genero?: Genero | null;
  estadoCivil?: EstadoCivil | null;
  estadoCivilDesde?: string | null;
  // ── Fase 1: contacto y ubicación estructurados ────────────────────────────
  telCodigoPais?: string | null;
  telArea?: string | null;
  telNumero?: string | null;
  emailContacto?: string | null;
  domCalle?: string | null;
  domAltura?: string | null;
  domPiso?: string | null;
  domDepto?: string | null;
  domBarrio?: string | null;
  domCp?: string | null;
  domLocalidad?: string | null;
  domProvincia?: string | null;
  domPais?: string | null;
  // ── Fase 1: laborales y contractuales ─────────────────────────────────────
  fechaIngresoLegal?: string | null;
  locacion?: string | null;
  areaNombre?: string | null;
  departamentoNombre?: string | null;
  sectorNombre?: string | null;
  supervisorDirectoId?: number | null;
  supervisorDirectoNombre?: string | null;
  tipoManoObra?: TipoManoObra | null;
  tipoContrato?: TipoContrato | null;
  motivoEgreso?: MotivoEgreso | null;
  telLaboralArea?: string | null;
  telLaboralNumero?: string | null;
  emailLaboral?: string | null;
  // ── Fase 1: bancarios ─────────────────────────────────────────────────────
  cbu?: string | null;
  bancoNombre?: string | null;
  tipoCuenta?: TipoCuentaBancaria | null;
  numeroCuenta?: string | null;
  convenioColectivo?: string | null;
  categoriaLaboral?: string | null;
  moneda?: MonedaSalario | null;
  sindicato?: string | null;
  afiliadoSindicato?: boolean | null;
  // ── Fase 1: salud y seguridad social ──────────────────────────────────────
  obraSocialCodigo?: string | null;
  obraSocialDetalle?: string | null;
  grupoSanguineo?: GrupoSanguineo | null;
  alergiasCondiciones?: string | null;
  artNombre?: string | null;
  fechaExamenPreocupacional?: string | null;
  // ── Fase 1: formación ─────────────────────────────────────────────────────
  nivelEstudios?: NivelEstudios | null;
  tituloCarrera?: string | null;
  // ── Transporte: roles de viaje ─────────────────────────────────────────────
  esConductor?: boolean | null;
  esAcompanante?: boolean | null;
  asistencias?: RegistroAsistencia[];
  licencias?: Licencia[];
  capacitaciones?: Capacitacion[];
}

export interface RegistroAsistencia {
  id: number;
  empleado: Empleado;
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  horasTrabajadas: number;
  horasExtras: number;
  observaciones?: string;
}

export interface Licencia {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  empleadoApellido: string;
  empleado?: Empleado; // Optional for backwards compat / client-side mapping
  tipo: TipoLicencia;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  motivo?: string;
  goceHaber: boolean;
  estado: EstadoLicencia;
}

export type MotivoCapacitacion = 'DNC' | 'PAC' | 'INDUCCION';

export const MOTIVO_CAPACITACION_LABEL: Record<MotivoCapacitacion, string> = {
  DNC: 'DNC — Detección de Necesidad de Capacitación',
  PAC: 'PAC — Plan Anual de Capacitación',
  INDUCCION: 'Inducción / Onboarding',
};

export interface CapacitacionAsistencia {
  id?: number;
  empleadoId: number;
  empleadoNombre?: string;
  empleadoApellido?: string;
  empleadoDni?: string;
  asistio: boolean;
  firmaUrl?: string | null;
}

export interface Capacitacion {
  id: number;
  motivo?: MotivoCapacitacion | null;
  areaId?: number | null;
  areaNombre?: string | null;
  actividad?: string | null;
  nombre: string;
  objetivo?: string | null;
  descripcion?: string | null;
  institucion?: string | null;
  capacitador?: string | null;
  fechaInicio: string;
  fechaFin: string;
  horas: number;
  certificado: boolean;
  costo: number;
  empleadoIds: number[];
  asistencias: CapacitacionAsistencia[];
}

export interface Sueldo {
  id: number;
  empleado: Empleado;
  empleadoId?: number;
  empleadoNombre?: string;
  empleadoApellido?: string;

  // Categoría salarial (referencia a la tabla configurable)
  categoriaSalarialId?: number | null;
  categoriaSalarialNombre?: string | null;

  periodo: string; // YYYY-MM format
  concepto?: 'SALARIO' | 'AGUINALDO';

  // Conceptos positivos (SUMA)
  sueldoBasico: number;
  bonificaciones: number;
  horasExtras: number;
  horasExtraCant?: number;
  comisiones: number;
  presentismoPct?: number;
  presentismoMonto?: number;
  kmCant?: number;
  kmMonto?: number;
  bonoProduccion?: number;
  bonoVentas?: number;
  bonoEspecial?: number;

  totalBruto: number;

  // Descuentos (RESTA)
  descuentosLegales: number;
  descuentosOtros: number;
  horasAusenteCant?: number;
  horasAusenteMonto?: number;
  adelantos?: number;

  totalDescuentos: number;
  sueldoNeto: number;

  fechaPago?: string;
  historial?: boolean;
  observaciones?: string;
}

export interface Legajo {
  id: number;
  empleado: Empleado;
  numeroLegajo: string;
  fechaAlta: string;
  fechaBaja?: string;
  motivoBaja?: string;
  documentacion?: string; // JSON string with document references
  observaciones?: string;
  activo: boolean;
}

// Documentos
export interface DocumentoLegajo {
  id: number;
  legajoId: number;
  nombreArchivo: string;
  tipoArchivo: string;
  tamanioBytes: number;
  descripcion?: string;
  categoria: string;
  fechaSubida: string;
  subidoPor: string;
}

export interface DocumentoEmpleado {
  id: number;
  empleadoId: number;
  nombreEmpleado?: string;
  nombreOriginal: string;
  extension?: string;
  mimeType?: string;
  sizeBytes: number;
  sizeLegible?: string;
  categoria: string;
  categoriaDescripcion?: string;
  descripcion?: string;
  fechaSubida: string;
  subidoPor?: string;
  urlDescarga?: string;
}

export interface UploadDocumentoRequest {
  file: File;
  categoria: string;
  descripcion?: string;
}

export interface UploadResponse {
  message: string;
  fileName: string | null;
  documentoId: number | null;
}
// Subset común de los campos planos de Fase 1 (RRHH), reutilizado por
// EmpleadoCreateDTO y EmpleadoUpdateDTO. Todos opcionales: nada bloquea el
// save, los faltantes se reportan como warning amarillo en el front.
export interface EmpleadoFase1Fields {
  cuil?: string | null;
  nombre2?: string | null;
  apellido2?: string | null;
  paisNacimiento?: string | null;
  provinciaNacimiento?: string | null;
  ciudadNacimiento?: string | null;
  nacionalidad1?: string | null;
  nacionalidad2?: string | null;
  docNacionalidad2?: string | null;
  genero?: Genero | null;
  estadoCivil?: EstadoCivil | null;
  estadoCivilDesde?: string | null;
  telCodigoPais?: string | null;
  telArea?: string | null;
  telNumero?: string | null;
  emailContacto?: string | null;
  domCalle?: string | null;
  domAltura?: string | null;
  domPiso?: string | null;
  domDepto?: string | null;
  domBarrio?: string | null;
  domCp?: string | null;
  domLocalidad?: string | null;
  domProvincia?: string | null;
  domPais?: string | null;
  fechaIngresoLegal?: string | null;
  locacion?: string | null;
  areaNombre?: string | null;
  departamentoNombre?: string | null;
  sectorNombre?: string | null;
  supervisorDirectoId?: number | null;
  tipoManoObra?: TipoManoObra | null;
  tipoContrato?: TipoContrato | null;
  motivoEgreso?: MotivoEgreso | null;
  telLaboralArea?: string | null;
  telLaboralNumero?: string | null;
  emailLaboral?: string | null;
  cbu?: string | null;
  bancoNombre?: string | null;
  tipoCuenta?: TipoCuentaBancaria | null;
  numeroCuenta?: string | null;
  convenioColectivo?: string | null;
  categoriaLaboral?: string | null;
  moneda?: MonedaSalario | null;
  sindicato?: string | null;
  afiliadoSindicato?: boolean | null;
  obraSocialCodigo?: string | null;
  obraSocialDetalle?: string | null;
  grupoSanguineo?: GrupoSanguineo | null;
  alergiasCondiciones?: string | null;
  artNombre?: string | null;
  fechaExamenPreocupacional?: string | null;
  nivelEstudios?: NivelEstudios | null;
  tituloCarrera?: string | null;
  // ── Transporte: roles de viaje ─────────────────────────────────────────────
  esConductor?: boolean | null;
  esAcompanante?: boolean | null;
}

export interface EmpleadoCreateDTO extends EmpleadoFase1Fields {
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaIngreso: string;
  puestoId?: number;
  categoriaSalarialId?: number | null;
  salario: number;
  estado?: EstadoEmpleado;
  sucursalId?: number;
  crearUsuario?: boolean;
  usuarioPassword?: string;
  // Datos de legajo (todos opcionales — el backend autogenera lo que falte).
  numeroLegajo?: string;
  legajoFechaAlta?: string;
  legajoObservaciones?: string;
  legajoDocumentacion?: string;
}

export interface EmpleadoUpdateDTO extends EmpleadoFase1Fields {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaEgreso?: string;
  puestoId?: number;
  categoriaSalarialId?: number | null;
  salario?: number;
  estado?: EstadoEmpleado;
  // Datos de legajo editables desde la misma pantalla del empleado.
  numeroLegajo?: string;
  legajoFechaAlta?: string;
  legajoFechaBaja?: string | null;
  legajoMotivoBaja?: string | null;
  legajoDocumentacion?: string | null;
  legajoObservaciones?: string | null;
  legajoActivo?: boolean;
}
