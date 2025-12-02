import api from '../config';

import type {
  TipoEquipo,
  EquipoFabricadoDTO,
  EquipoFabricadoListDTO,
  EquipoFabricadoCreateDTO,
  EquipoFabricadoUpdateDTO,
  EstadoFabricacion,
  ValidacionStockDTO,
  EquipoCreationResponseDTO,
} from '../../types';


export const equipoFabricadoApi = {
  // CRUD básico
  findAll: async (page: number = 0, size: number = 10) => {
    const response = await api.get<any>('/api/equipos-fabricados', {
      params: { page, size }
    });
    return response.data;
  },

  findById: async (id: number) => {
    const response = await api.get<EquipoFabricadoDTO>(`/api/equipos-fabricados/${id}`);
    return response.data;
  },

  findByNumeroHeladera: async (numeroHeladera: string) => {
    const response = await api.get<EquipoFabricadoDTO>(`/api/equipos-fabricados/numero/${numeroHeladera}`);
    return response.data;
  },

  create: async (equipo: EquipoFabricadoCreateDTO) => {
    const response = await api.post<EquipoFabricadoDTO>('/api/equipos-fabricados', equipo);
    return response.data;
  },

  createBatch: async (equipo: EquipoFabricadoCreateDTO) => {
    const response = await api.post<EquipoCreationResponseDTO>('/api/equipos-fabricados/batch', equipo);
    return response.data;
  },

  update: async (id: number, equipo: EquipoFabricadoUpdateDTO) => {
    const response = await api.put<EquipoFabricadoDTO>(`/api/equipos-fabricados/${id}`, equipo);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/equipos-fabricados/${id}`);
  },

  // Búsquedas específicas
  findByTipo: async (tipo: TipoEquipo) => {
    const response = await api.get<EquipoFabricadoListDTO[]>(`/api/equipos-fabricados/tipo/${tipo}`);
    return response.data;
  },

  findByEstado: async (estado: EstadoFabricacion) => {
    const response = await api.get<EquipoFabricadoListDTO[]>(`/api/equipos-fabricados/estado/${estado}`);
    return response.data;
  },

  findDisponibles: async () => {
    const response = await api.get<EquipoFabricadoListDTO[]>('/api/equipos-fabricados/disponibles');
    return response.data;
  },

  findNoAsignados: async () => {
    const response = await api.get<EquipoFabricadoListDTO[]>('/api/equipos-fabricados/no-asignados');
    return response.data;
  },

  findByReceta: async (recetaId: number) => {
    const response = await api.get<EquipoFabricadoListDTO[]>(`/api/equipos-fabricados/receta/${recetaId}`);
    return response.data;
  },

  findByCliente: async (clienteId: number) => {
    const response = await api.get<EquipoFabricadoListDTO[]>(`/api/equipos-fabricados/cliente/${clienteId}`);
    return response.data;
  },

  findByResponsable: async (responsableId: number) => {
    const response = await api.get<EquipoFabricadoListDTO[]>(`/api/equipos-fabricados/responsable/${responsableId}`);
    return response.data;
  },

  findCompletadosEntreFechas: async (fechaInicio: string, fechaFin: string) => {
    const response = await api.get<EquipoFabricadoListDTO[]>('/api/equipos-fabricados/completados', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Acciones de estado y asignación
  asignarEquipo: async (equipoId: number, clienteId: number) => {
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/asignar/${clienteId}`
    );
    return response.data;
  },

  desasignarEquipo: async (equipoId: number) => {
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/desasignar`
    );
    return response.data;
  },

  marcarComoEntregado: async (equipoId: number) => {
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/marcar-entregado`
    );
    return response.data;
  },

  completarFabricacion: async (equipoId: number) => {
    console.log(`🚀 API Call: PATCH /api/equipos-fabricados/${equipoId}/completar`);
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/completar`
    );
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  // WORKAROUND: Use numeroHeladera instead of ID when backend returns id: null
  completarFabricacionPorNumero: async (numeroHeladera: string) => {
    console.log(`🚀 API Call (workaround): GET equipo by numeroHeladera and PATCH completar`);
    console.log(`   Step 1: GET /api/equipos-fabricados/numero/${numeroHeladera}`);

    // First get the equipo by numeroHeladera to get the real ID
    const equipoResponse = await api.get<EquipoFabricadoDTO>(`/api/equipos-fabricados/numero/${numeroHeladera}`);
    console.log('   Response from GET:', equipoResponse.data);

    const equipoId = equipoResponse.data.id;
    if (!equipoId) {
      throw new Error(`Equipo ${numeroHeladera} no tiene ID en la respuesta del backend`);
    }

    console.log(`   Step 2: PATCH /api/equipos-fabricados/${equipoId}/completar`);
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/completar`
    );
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  cancelarFabricacion: async (equipoId: number) => {
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/cancelar`
    );
    return response.data;
  },

  // Validación de stock
  validarStock: async (equipo: EquipoFabricadoCreateDTO): Promise<ValidacionStockDTO> => {
    const response = await api.post<ValidacionStockDTO>(
      '/api/equipos-fabricados/validar-stock',
      equipo
    );
    return response.data;
  },

  validarStockEquipoExistente: async (equipoId: number): Promise<ValidacionStockDTO> => {
    const response = await api.get<ValidacionStockDTO>(
      `/api/equipos-fabricados/${equipoId}/validar-stock`
    );
    return response.data;
  },

  // Get equipos available for sale by receta
  findDisponiblesParaVentaByReceta: async (recetaId: number): Promise<EquipoFabricadoDTO[]> => {
    const response = await api.get<EquipoFabricadoDTO[]>(
      `/api/equipos-fabricados/disponibles-venta/receta/${recetaId}`
    );
    return response.data;
  },

  // Cambiar estado de asignación manualmente
  updateEstadoAsignacion: async (equipoId: number, nuevoEstado: string) => {
    const response = await api.put<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/estado-asignacion`,
      { estadoAsignacion: nuevoEstado }
    );
    return response.data;
  },
};
