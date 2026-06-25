// Módulo Transporte — hospedajes para planificación de estadías.

export interface HospedajeEstadiaDTO {
  id: number;
  nombre: string;
  provincia: string | null;
  localidad: string | null;
  direccion: string | null;
  telefono: string | null;
  resena: string | null;
  ultimoPrecio: number | null;
  calificacion: number | null;
  tieneCochera: boolean;
  tieneDesayuno: boolean;
  tienePileta: boolean;
  activo: boolean;
  observaciones: string | null;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface CreateHospedajeEstadiaDTO {
  nombre: string;
  provincia?: string;
  localidad?: string;
  direccion?: string;
  telefono?: string;
  resena?: string;
  ultimoPrecio?: number | null;
  calificacion?: number | null;
  tieneCochera?: boolean;
  tieneDesayuno?: boolean;
  tienePileta?: boolean;
  activo?: boolean;
  observaciones?: string;
}

export interface FiltrosHospedaje {
  nombre: string;
  provincia: string;
  localidad: string;
  calificacion: string;
  cochera: boolean;
  desayuno: boolean;
  pileta: boolean;
}

// Módulo Transporte — históricos de km por empleado.

export interface RegistroKmEmpleadoDTO {
  id: number;
  empleadoId: number;
  empleadoNombre: string | null;
  vehiculoId: number | null;
  vehiculoDescripcion: string | null;
  anio: number;
  mes: number;
  kmRecorridos: number;
  horasExtra: number;
  observaciones: string | null;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface CreateRegistroKmEmpleadoDTO {
  empleadoId: number;
  vehiculoId?: number | null;
  anio: number;
  mes: number;
  kmRecorridos: number;
  horasExtra?: number;
  observaciones?: string;
}

export interface ResumenKmEmpleadoDTO {
  empleadoId: number;
  empleadoNombre: string;
  anio: number;
  totalKm: number;
  totalHorasExtra: number;
  mesesConRegistro: number;
}
