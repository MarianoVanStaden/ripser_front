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
  FabricacionBaseRequestDTO,
  AplicarTerminacionDTO,
  EtapaTerminacionDTO,
  HistorialFabricacionDTO,
  DesgloseModeloDTO,
  EtapaFabricacionDTO,
  TipoEtapaFabricacion,
  ActualizarEtapaFabricacionDTO,
  PageResponse,
  PaginationParams,
} from '../../types';


export const equipoFabricadoApi = {
  // CRUD básico (paginated)
  findAll: async (pagination: PaginationParams = {}): Promise<PageResponse<EquipoFabricadoListDTO>> => {
    const response = await api.get<PageResponse<EquipoFabricadoListDTO>>('/api/equipos-fabricados', {
      params: { ...pagination },
    });
    return response.data;
  },

  findById: async (id: number) => {
    const response = await api.get<EquipoFabricadoDTO>(`/api/equipos-fabricados/${id}`);
    return response.data;
  },

  findByIds: async (ids: number[]): Promise<EquipoFabricadoDTO[]> => {
    if (ids.length === 0) return [];
    const response = await api.post<EquipoFabricadoDTO[]>('/api/equipos-fabricados/by-ids', ids);
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

  // WORKAROUND: Backend returns id: null in list DTOs — resolve real ID first via numeroHeladera
  deletePorNumero: async (numeroHeladera: string) => {
    const equipoResponse = await api.get<EquipoFabricadoDTO>(`/api/equipos-fabricados/numero/${numeroHeladera}`);
    const equipoId = equipoResponse.data.id;
    if (!equipoId) {
      throw new Error(`Equipo ${numeroHeladera} no tiene ID en la respuesta del backend`);
    }
    await api.delete(`/api/equipos-fabricados/${equipoId}`);
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

  // Iniciar fabricación (PENDIENTE → EN_PROCESO)
  iniciarFabricacion: async (equipoId: number): Promise<EquipoFabricadoDTO> => {
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/iniciar-fabricacion`
    );
    return response.data;
  },

  // WORKAROUND: Use numeroHeladera instead of ID when backend returns id: null
  iniciarFabricacionPorNumero: async (numeroHeladera: string) => {
    console.log(`🚀 API Call (workaround): GET equipo by numeroHeladera and PATCH iniciar-fabricacion`);
    console.log(`   Step 1: GET /api/equipos-fabricados/numero/${numeroHeladera}`);

    // First get the equipo by numeroHeladera to get the real ID
    const equipoResponse = await api.get<EquipoFabricadoDTO>(`/api/equipos-fabricados/numero/${numeroHeladera}`);
    console.log('   Response from GET:', equipoResponse.data);

    const equipoId = equipoResponse.data.id;
    if (!equipoId) {
      throw new Error(`Equipo ${numeroHeladera} no tiene ID en la respuesta del backend`);
    }

    console.log(`   Step 2: PATCH /api/equipos-fabricados/${equipoId}/iniciar-fabricacion`);
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/iniciar-fabricacion`
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

  // Get equipos selectable for factura (includes RESERVADO for this nota de pedido)
  findSeleccionablesParaFactura: async (recetaId: number, notaPedidoId: number): Promise<EquipoFabricadoDTO[]> => {
    const response = await api.get<EquipoFabricadoDTO[]>(
      `/api/equipos-fabricados/seleccionables-para-factura/receta/${recetaId}`,
      { params: { notaPedidoId } }
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

  // Flujo Base + Terminación
  fabricarBase: async (data: FabricacionBaseRequestDTO): Promise<EquipoCreationResponseDTO> => {
    const response = await api.post<EquipoCreationResponseDTO>('/api/equipos-fabricados/base', data);
    return response.data;
  },

  findSinTerminacion: async (): Promise<EquipoFabricadoListDTO[]> => {
    const response = await api.get<EquipoFabricadoListDTO[]>('/api/equipos-fabricados/sin-terminacion');
    return response.data;
  },

  findSinTerminacionByReceta: async (recetaId: number): Promise<EquipoFabricadoListDTO[]> => {
    const response = await api.get<EquipoFabricadoListDTO[]>(
      `/api/equipos-fabricados/sin-terminacion/receta/${recetaId}`
    );
    return response.data;
  },

  reservarParaNota: async (data: { equipoFabricadoId: number; detalleNotaPedidoId: number }): Promise<EquipoFabricadoDTO> => {
    const response = await api.post<EquipoFabricadoDTO>(
      '/api/equipos-fabricados/reservar-para-nota',
      data
    );
    return response.data;
  },

  aplicarTerminacion: async (id: number, data: AplicarTerminacionDTO): Promise<EquipoFabricadoDTO> => {
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${id}/aplicar-terminacion`,
      data
    );
    return response.data;
  },

  // WORKAROUND: Backend returns id: null in list DTOs — resolve real ID first via numeroHeladera
  aplicarTerminacionPorNumero: async (numeroHeladera: string, data: AplicarTerminacionDTO): Promise<EquipoFabricadoDTO> => {
    const equipoResponse = await api.get<EquipoFabricadoDTO>(`/api/equipos-fabricados/numero/${numeroHeladera}`);
    const equipoId = equipoResponse.data.id;
    if (!equipoId) {
      throw new Error(`Equipo ${numeroHeladera} no tiene ID en la respuesta del backend`);
    }
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/aplicar-terminacion`,
      data
    );
    return response.data;
  },

  getEtapasProduccion: async (equipoId: number): Promise<EtapaFabricacionDTO[]> => {
    const response = await api.get<EtapaFabricacionDTO[]>(
      `/api/equipos-fabricados/${equipoId}/etapas-produccion`
    );
    return response.data;
  },

  actualizarEtapaProduccion: async (
    equipoId: number,
    tipo: TipoEtapaFabricacion,
    dto: ActualizarEtapaFabricacionDTO
  ): Promise<EtapaFabricacionDTO> => {
    const response = await api.patch<EtapaFabricacionDTO>(
      `/api/equipos-fabricados/${equipoId}/etapas-produccion/${tipo}`,
      dto
    );
    return response.data;
  },

  getEtapasTerminacion: async (id: number): Promise<EtapaTerminacionDTO[]> => {
    const response = await api.get<EtapaTerminacionDTO[]>(
      `/api/equipos-fabricados/${id}/etapas-terminacion`
    );
    return response.data;
  },

  getHistorialFabricacion: async (id: number): Promise<HistorialFabricacionDTO[]> => {
    const response = await api.get<HistorialFabricacionDTO[]>(
      `/api/equipos-fabricados/${id}/historial`
    );
    return response.data;
  },

  // FABRICADO_SIN_TERMINACION → COMPLETADO (cuando ya tiene terminaciones registradas)
  completarBase: async (id: number): Promise<EquipoFabricadoDTO> => {
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${id}/completar-base`
    );
    return response.data;
  },

  // Libera la reserva de un equipo → DISPONIBLE
  liberarReserva: async (id: number): Promise<EquipoFabricadoDTO> => {
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${id}/liberar-reserva`
    );
    return response.data;
  },

  // Equipos base reservados para notas de pedido sin color (estadoAsignacion = PENDIENTE_TERMINACION)
  findPendientesTerminacion: async (): Promise<EquipoFabricadoListDTO[]> => {
    const response = await api.get<EquipoFabricadoListDTO[]>(
      '/api/equipos-fabricados/pendientes-terminacion'
    );
    return response.data;
  },

  // Unified stock resolution for a nota de pedido detalle:
  //   P1 → existing COMPLETADO equipo with matching color → reserve it
  //   P2 → available FABRICADO_SIN_TERMINACION base → store expected color → reserve
  //   P3 → no stock → create new PENDIENTE equipo for fabrication queue
  // In all cases creates a DetalleEquipoAsignacion link.
  resolverParaPedido: async (data: {
    tipo: TipoEquipo;
    modelo: string;
    medidaId?: number;
    colorId?: number;
    detalleNotaPedidoId: number;
  }): Promise<EquipoFabricadoDTO> => {
    const response = await api.post<EquipoFabricadoDTO>(
      '/api/equipos-fabricados/resolver-para-pedido',
      data
    );
    return response.data;
  },

  // Quick count of available bases (no lock — for display purposes only)
  countBasesDisponibles: async (modelo: string, medida?: string): Promise<number> => {
    const response = await api.get<number>('/api/equipos-fabricados/bases-disponibles/count', {
      params: { modelo, ...(medida ? { medida } : {}) },
    });
    return response.data;
  },

  /**
   * Desglose de equipos físicos agrupados por tipo y modelo con conteos server-side.
   * Usado por la pestaña "Desglose por Modelo" en Ubicación de Equipos.
   * Una sola query SQL — sin N+1, sin cálculo client-side.
   */
  getDesgloseModelo: async (): Promise<DesgloseModeloDTO[]> => {
    const response = await api.get<DesgloseModeloDTO[]>('/api/equipos-fabricados/desglose-modelo');
    return response.data;
  },
};
