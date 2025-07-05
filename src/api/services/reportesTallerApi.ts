import api from '../config';

export const reportesTallerApi = {
  // Reporte de órdenes por estado
  getOrdenesPorEstado: async (): Promise<Record<string, number>> => {
    const response = await api.get('/api/reportes/taller/ordenes-por-estado');
    return response.data;
  },

  // Reporte de productividad por empleados
  getProductividadEmpleados: async (fechaInicio: string, fechaFin: string): Promise<any[]> => {
    const response = await api.get('/api/reportes/taller/productividad-empleados', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Reporte de materiales más utilizados
  getMaterialesMasUtilizados: async (fechaInicio: string, fechaFin: string): Promise<any[]> => {
    const response = await api.get('/api/reportes/taller/materiales-mas-utilizados', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  }
};
