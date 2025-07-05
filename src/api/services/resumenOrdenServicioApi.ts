import api from '../config';

export const resumenOrdenServicioApi = {
  // Get resumen de ordenes de servicio (list)
  getAll: async (): Promise<any[]> => {
    const response = await api.get('/api/ordenes-servicio/resumen');
    return response.data;
  },

  // Get resumen de orden de servicio by ID
  getById: async (id: number): Promise<any> => {
    const response = await api.get(`/api/ordenes-servicio/resumen/${id}`);
    return response.data;
  }
};

export const resumenViajeApi = {
  // Get resumen de viajes (list)
  getAll: async (): Promise<any[]> => {
    const response = await api.get('/api/viajes/resumen');
    return response.data;
  },

  // Get resumen de viaje by ID
  getById: async (id: number): Promise<any> => {
    const response = await api.get(`/api/viajes/resumen/${id}`);
    return response.data;
  }
};
