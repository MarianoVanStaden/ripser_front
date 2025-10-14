import api from '../config';

export type TipoExcepcionAsistencia = 
  | 'INASISTENCIA'
  | 'LLEGADA_TARDE'
  | 'SALIDA_ANTICIPADA'
  | 'HORAS_EXTRAS'
  | 'PERMISO'
  | 'MODIFICACION_HORARIO';

export interface ExcepcionAsistenciaDTO {
  id?: number;
  empleadoId: number;
  fecha: string; // Formato "YYYY-MM-DD"
  tipo: TipoExcepcionAsistencia;
  horaEntradaReal?: string | null; // Formato "HH:mm:ss"
  horaSalidaReal?: string | null; // Formato "HH:mm:ss"
  horasExtras?: number | null;
  motivo?: string;
  observaciones?: string;
  justificado?: boolean;
  empleadoNombre?: string; // Read-only
  empleadoApellido?: string; // Read-only
}

export const excepcionAsistenciaApi = {
  /**
   * Listar todas las excepciones
   */
  getAll: async (): Promise<ExcepcionAsistenciaDTO[]> => {
    const response = await api.get('/api/excepciones-asistencia');
    return response.data;
  },

  /**
   * Obtener excepción por ID
   */
  getById: async (id: number): Promise<ExcepcionAsistenciaDTO> => {
    const response = await api.get(`/api/excepciones-asistencia/${id}`);
    return response.data;
  },

  /**
   * Obtener excepciones de un empleado
   */
  getByEmpleado: async (empleadoId: number): Promise<ExcepcionAsistenciaDTO[]> => {
    const response = await api.get(`/api/excepciones-asistencia/empleado/${empleadoId}`);
    return response.data;
  },

  /**
   * Obtener excepciones por período
   */
  getByPeriodo: async (desde: string, hasta: string): Promise<ExcepcionAsistenciaDTO[]> => {
    const response = await api.get('/api/excepciones-asistencia/periodo', {
      params: { desde, hasta }
    });
    return response.data;
  },

  /**
   * Registrar excepción
   * Efecto automático: Recalcula el registro de asistencia del día
   */
  create: async (data: ExcepcionAsistenciaDTO): Promise<ExcepcionAsistenciaDTO> => {
    const response = await api.post('/api/excepciones-asistencia', data);
    return response.data;
  },

  /**
   * Actualizar excepción
   * Efecto automático: Recalcula el registro de asistencia del día
   */
  update: async (id: number, data: ExcepcionAsistenciaDTO): Promise<ExcepcionAsistenciaDTO> => {
    const response = await api.put(`/api/excepciones-asistencia/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar excepción
   * Efecto automático: Recalcula el registro de asistencia del día (vuelve al horario normal)
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/excepciones-asistencia/${id}`);
  }
};
