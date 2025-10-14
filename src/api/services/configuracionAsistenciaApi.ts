import api from '../config';

export interface HorarioDiaDTO {
  horaEntrada: string | null;
  horaSalida: string | null;
  trabaja: boolean;
}

export interface ConfiguracionAsistenciaDTO {
  id?: number;
  empleadoId: number;
  empleadoNombre?: string;
  activo?: boolean;
  lunes?: HorarioDiaDTO;
  martes?: HorarioDiaDTO;
  miercoles?: HorarioDiaDTO;
  jueves?: HorarioDiaDTO;
  viernes?: HorarioDiaDTO;
  sabado?: HorarioDiaDTO;
  domingo?: HorarioDiaDTO;
}

export const configuracionAsistenciaApi = {
  /**
   * Listar todas las configuraciones
   */
  getAll: async (): Promise<ConfiguracionAsistenciaDTO[]> => {
    const response = await api.get('/api/configuracion-asistencia');
    return response.data;
  },

  /**
   * Obtener configuración por ID
   */
  getById: async (id: number): Promise<ConfiguracionAsistenciaDTO> => {
    const response = await api.get(`/api/configuracion-asistencia/${id}`);
    return response.data;
  },

  /**
   * Obtener configuración de un empleado
   */
  getByEmpleado: async (empleadoId: number): Promise<ConfiguracionAsistenciaDTO> => {
    const response = await api.get(`/api/configuracion-asistencia/empleado/${empleadoId}`);
    return response.data;
  },

  /**
   * Crear configuración personalizada
   */
  create: async (data: ConfiguracionAsistenciaDTO): Promise<ConfiguracionAsistenciaDTO> => {
    const response = await api.post('/api/configuracion-asistencia', data);
    return response.data;
  },

  /**
   * Crear horario estándar (L-V 8:00-17:00)
   */
  createHorarioEstandar: async (empleadoId: number): Promise<ConfiguracionAsistenciaDTO> => {
    const response = await api.post(`/api/configuracion-asistencia/horario-estandar/${empleadoId}`);
    return response.data;
  },

  /**
   * Actualizar configuración
   */
  update: async (id: number, data: ConfiguracionAsistenciaDTO): Promise<ConfiguracionAsistenciaDTO> => {
    const response = await api.put(`/api/configuracion-asistencia/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar configuración
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/configuracion-asistencia/${id}`);
  }
};
