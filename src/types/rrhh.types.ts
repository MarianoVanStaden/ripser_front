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
export type TipoLicencia = 'VACACIONES' | 'ENFERMEDAD' | 'PERSONAL' | 'MATERNIDAD';
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
}

export interface PuestoResponseDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  departamento?: string;
  salarioBase: number;
  version: number;
  activo: boolean;
  requisitos?: string;
  objetivoGeneral?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  cantidadEmpleados: number;
  tareas: TareaPuestoDTO[];
}

export interface CreatePuestoDTO {
  nombre: string;
  descripcion?: string;
  departamento?: string;
  salarioBase?: number;
  requisitos?: string;
  objetivoGeneral?: string;
}

export interface UpdatePuestoDTO {
  nombre?: string;
  descripcion?: string;
  departamento?: string;
  salarioBase?: number;
  requisitos?: string;
  objetivoGeneral?: string;
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
  puesto?: Puesto;
  puestoNombre?: string;
  salario: number;
  usuarioId: number | null;
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
  empleado: Empleado;
  tipo: TipoLicencia;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  motivo?: string;
  goceHaber: boolean;
  estado: EstadoLicencia;
}

export interface Capacitacion {
  id: number;
  empleado: Empleado;
  nombre: string;
  descripcion?: string;
  institucion?: string;
  fechaInicio: string;
  fechaFin: string;
  horas: number;
  certificado: boolean;
  costo: number;
}

export interface Sueldo {
  id: number;
  empleado: Empleado;
  periodo: string; // YYYY-MM format
  sueldoBasico: number;
  bonificaciones: number;
  horasExtras: number;
  comisiones: number;
  totalBruto: number;
  descuentosLegales: number;
  descuentosOtros: number;
  totalDescuentos: number;
  sueldoNeto: number;
  fechaPago?: string;
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
export interface EmpleadoCreateDTO {
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaIngreso: string;
  puestoId?: number;
  salario: number;
  estado?: EstadoEmpleado;
  sucursalId?: number;
  crearUsuario?: boolean;
  usuarioPassword?: string;
}

export interface EmpleadoUpdateDTO {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaEgreso?: string;
  puestoId?: number;
  salario?: number;
  estado?: EstadoEmpleado;
}
