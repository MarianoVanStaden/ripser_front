import api from '../config';

export interface RegistroAsistenciaGeneradoDTO {
  id?: number;
  empleadoId: number;
  fecha: string; // Formato "YYYY-MM-DD"
  horaEntrada: string; // Formato "HH:mm:ss"
  horaSalida: string; // Formato "HH:mm:ss"
  horasTrabajadas: number;
  horasExtras: number;
  observaciones?: string;
}

export const asistenciaAutomaticaApi = {
  /**
   * Generar asistencias para un período
   * Útil para generar asistencias retroactivas o por lotes
   */
  generar: async (
    empleadoId: number, 
    desde: string, 
    hasta: string
  ): Promise<RegistroAsistenciaGeneradoDTO[]> => {
    const response = await api.post(
      `/api/asistencia-automatica/generar/${empleadoId}`,
      null,
      { params: { desde, hasta } }
    );
    return response.data;
  },

  /**
   * Recalcular asistencias
   * Cuando se actualiza la configuración de horarios
   */
  recalcular: async (
    empleadoId: number, 
    desde: string, 
    hasta: string
  ): Promise<string> => {
    const response = await api.post(
      `/api/asistencia-automatica/recalcular/${empleadoId}`,
      null,
      { params: { desde, hasta } }
    );
    return response.data;
  },

  /**
   * Ejecutar generación diaria manual
   * Para testing o ejecutar manualmente el proceso automático
   */
  ejecutarGeneracionDiaria: async (): Promise<string> => {
    const response = await api.post('/api/asistencia-automatica/ejecutar-generacion-diaria');
    return response.data;
  },

  /**
   * Verificar si debe trabajar
   * Validar si un empleado tiene configurado trabajar en un día específico
   */
  debeTrabajar: async (empleadoId: number, fecha: string): Promise<boolean> => {
    const response = await api.get(
      `/api/asistencia-automatica/debe-trabajar/${empleadoId}`,
      { params: { fecha } }
    );
    return response.data;
  }
};
