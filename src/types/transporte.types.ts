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
