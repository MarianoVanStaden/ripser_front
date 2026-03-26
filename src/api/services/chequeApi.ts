import api from '../config';
import type {
  Cheque,
  ChequeCreateDTO,
  ChequeUpdateDTO,
  CambioEstadoChequeDTO,
  ChequeFilterParams,
  ChequeResumenDTO,
  HistorialEstadoChequeDTO,
  EstadoChequeType,
  TipoChequeType,
  EndosoChequeCreateDTO,
  EndosoChequeDTO,
  CadenaEndososDTO,
  ChequeDisponibleEndosoDTO,
  PageResponse,
} from '../../types';

export const chequeApi = {
  // ==================== CRUD BÁSICO ====================
  
  /**
   * GET /api/cheques
   * Obtiene todos los cheques con paginación
   */
  getAll: async (page = 0, size = 20): Promise<PageResponse<Cheque>> => {
    const response = await api.get('/api/cheques', { 
      params: { page, size, sort: 'fechaAlta,desc' } 
    });
    return response.data;
  },

  /**
   * GET /api/cheques/all
   * Obtiene todos los cheques sin paginación
   */
  getAllWithoutPagination: async (): Promise<Cheque[]> => {
    const response = await api.get('/api/cheques/all');
    return response.data;
  },

  /**
   * GET /api/cheques/{id}
   * Obtiene un cheque por ID
   */
  getById: async (id: number): Promise<Cheque> => {
    const response = await api.get(`/api/cheques/${id}`);
    return response.data;
  },

  /**
   * POST /api/cheques
   * Crea un nuevo cheque
   */
  create: async (cheque: ChequeCreateDTO): Promise<Cheque> => {
    const response = await api.post('/api/cheques', cheque);
    return response.data;
  },

  /**
   * PUT /api/cheques/{id}
   * Actualiza un cheque existente
   */
  update: async (id: number, cheque: ChequeUpdateDTO): Promise<Cheque> => {
    const response = await api.put(`/api/cheques/${id}`, cheque);
    return response.data;
  },

  /**
   * DELETE /api/cheques/{id}
   * Elimina lógicamente un cheque
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/cheques/${id}`);
  },

  // ==================== GESTIÓN DE ESTADOS ====================

  /**
   * PATCH /api/cheques/{id}/estado
   * Cambia el estado de un cheque
   */
  cambiarEstado: async (id: number, cambio: CambioEstadoChequeDTO): Promise<Cheque> => {
    const response = await api.patch(`/api/cheques/${id}/estado`, cambio);
    return response.data;
  },

  /**
   * PUT /api/cheques/{id}/depositar
   * Deposita un cheque
   */
  depositar: async (id: number, fechaDeposito?: string, observaciones?: string): Promise<Cheque> => {
    const params: Record<string, string> = {};
    if (fechaDeposito) params.fechaDeposito = fechaDeposito;
    if (observaciones) params.observaciones = observaciones;
    const response = await api.put(`/api/cheques/${id}/depositar`, null, { params });
    return response.data;
  },

  /**
   * PUT /api/cheques/{id}/cobrar
   * Marca un cheque como cobrado
   */
  cobrar: async (id: number, fechaCobrado?: string, observaciones?: string): Promise<Cheque> => {
    const params: Record<string, string> = {};
    if (fechaCobrado) params.fechaCobrado = fechaCobrado;
    if (observaciones) params.observaciones = observaciones;
    const response = await api.put(`/api/cheques/${id}/cobrar`, null, { params });
    return response.data;
  },

  /**
   * PUT /api/cheques/{id}/rechazar
   * Rechaza un cheque
   */
  rechazar: async (id: number, motivoRechazo: string, fechaRechazo?: string, observaciones?: string): Promise<Cheque> => {
    const params: Record<string, string> = { motivoRechazo };
    if (fechaRechazo) params.fechaRechazo = fechaRechazo;
    if (observaciones) params.observaciones = observaciones;
    const response = await api.put(`/api/cheques/${id}/rechazar`, null, { params });
    return response.data;
  },

  /**
   * PUT /api/cheques/{id}/anular
   * Anula un cheque
   */
  anular: async (id: number, motivo: string, observaciones?: string): Promise<Cheque> => {
    const params: Record<string, string> = { motivo };
    if (observaciones) params.observaciones = observaciones;
    const response = await api.put(`/api/cheques/${id}/anular`, null, { params });
    return response.data;
  },

  /**
   * GET /api/cheques/{id}/historial
   * Obtiene el historial de cambios de estado de un cheque
   */
  getHistorialEstados: async (id: number): Promise<HistorialEstadoChequeDTO[]> => {
    const response = await api.get(`/api/cheques/${id}/historial`);
    return response.data;
  },

  // ==================== BÚSQUEDAS Y FILTROS ====================

  /**
   * GET /api/cheques/estado/{estado}
   * Busca cheques por estado
   */
  getByEstado: async (estado: EstadoChequeType, page = 0, size = 20): Promise<PageResponse<Cheque>> => {
    const response = await api.get(`/api/cheques/estado/${estado}`, { 
      params: { page, size } 
    });
    return response.data;
  },

  /**
   * GET /api/cheques/tipo/{tipo}
   * Busca cheques por tipo
   */
  getByTipo: async (tipo: TipoChequeType): Promise<Cheque[]> => {
    const response = await api.get(`/api/cheques/tipo/${tipo}`);
    return response.data;
  },

  /**
   * GET /api/cheques/banco/{banco}
   * Busca cheques por banco (texto)
   */
  getByBanco: async (banco: string, page = 0, size = 20): Promise<PageResponse<Cheque>> => {
    const response = await api.get(`/api/cheques/banco/${encodeURIComponent(banco)}`, { 
      params: { page, size } 
    });
    return response.data;
  },

  /**
   * GET /api/cheques/cliente/{clienteId}
   * Busca cheques por cliente
   */
  getByCliente: async (clienteId: number): Promise<Cheque[]> => {
    const response = await api.get(`/api/cheques/cliente/${clienteId}`);
    return response.data;
  },

  /**
   * GET /api/cheques/proveedor/{proveedorId}
   * Busca cheques por proveedor
   */
  getByProveedor: async (proveedorId: number): Promise<Cheque[]> => {
    const response = await api.get(`/api/cheques/proveedor/${proveedorId}`);
    return response.data;
  },

  /**
   * GET /api/cheques/vencidos
   * Obtiene cheques vencidos
   */
  getVencidos: async (): Promise<Cheque[]> => {
    const response = await api.get('/api/cheques/vencidos');
    return response.data;
  },

  /**
   * GET /api/cheques/proximos-vencer
   * Obtiene cheques próximos a vencer
   */
  getProximosAVencer: async (dias = 30): Promise<Cheque[]> => {
    const response = await api.get('/api/cheques/proximos-vencer', { params: { dias } });
    return response.data;
  },

  /**
   * GET /api/cheques/depositados-para-cobrar
   * Obtiene cheques depositados listos para cobrar
   */
  getDepositadosParaCobrar: async (): Promise<Cheque[]> => {
    const response = await api.get('/api/cheques/depositados-para-cobrar');
    return response.data;
  },

  /**
   * GET /api/cheques/buscar
   * Endpoint principal de la tabla. Combina filtros opcionales con paginación server-side.
   *
   * sort válidos: fechaAlta | monto | fechaCobro | numeroCheque (+ ,asc / ,desc)
   * El backend devuelve 400 si se envía un sort fuera de esa lista.
   */
  buscar: async (
    params: ChequeFilterParams,
    page = 0,
    size = 20,
    sort = 'fechaAlta,desc',
  ): Promise<PageResponse<Cheque>> => {
    const response = await api.get('/api/cheques/buscar', {
      params: { ...params, page, size, sort },
    });
    return response.data;
  },

  /**
   * GET /api/cheques/estadisticas/resumen
   * Resumen estadístico global de cheques
   */
  getResumen: async (): Promise<ChequeResumenDTO> => {
    const response = await api.get('/api/cheques/estadisticas/resumen');
    return response.data;
  },

  // ==================== ESTADÍSTICAS ====================

  /**
   * GET /api/cheques/estadisticas/monto-por-estado
   * Obtiene el monto total de cheques por estado
   */
  getMontoByEstado: async (estado: EstadoChequeType): Promise<number> => {
    const response = await api.get('/api/cheques/estadisticas/monto-por-estado', { 
      params: { estado } 
    });
    return response.data;
  },

  /**
   * GET /api/cheques/estadisticas/monto-en-cartera
   * Obtiene el monto total de cheques en cartera
   */
  getMontoEnCartera: async (): Promise<number> => {
    const response = await api.get('/api/cheques/estadisticas/monto-en-cartera');
    return response.data;
  },

  /**
   * GET /api/cheques/estadisticas/count-por-estado
   * Cuenta cheques por estado
   */
  getCountByEstado: async (estado: EstadoChequeType): Promise<number> => {
    const response = await api.get('/api/cheques/estadisticas/count-por-estado', { 
      params: { estado } 
    });
    return response.data;
  },

  // ==================== ENDORSEMENT OPERATIONS ====================

  /**
   * POST /api/cheques/{id}/endosar
   * Endosa un cheque a un proveedor
   */
  endosar: async (id: number, endosoData: EndosoChequeCreateDTO): Promise<EndosoChequeDTO> => {
    const response = await api.post(`/api/cheques/${id}/endosar`, endosoData);
    return response.data;
  },

  /**
   * GET /api/cheques/{id}/endosos
   * Lista todos los endosos de un cheque específico
   */
  getEndosos: async (id: number): Promise<EndosoChequeDTO[]> => {
    const response = await api.get(`/api/cheques/${id}/endosos`);
    return response.data;
  },

  /**
   * GET /api/cheques/{id}/cadena-endosos
   * Obtiene la cadena completa de endosos con información detallada
   */
  getCadenaEndosos: async (id: number): Promise<CadenaEndososDTO> => {
    const response = await api.get(`/api/cheques/${id}/cadena-endosos`);
    return response.data;
  },

  /**
   * GET /api/cheques/disponibles-endoso
   * Encuentra cheques disponibles para endosar (TERCEROS en RECIBIDO o EN_CARTERA)
   */
  getChequesDisponiblesEndoso: async (): Promise<ChequeDisponibleEndosoDTO[]> => {
    const response = await api.get('/api/cheques/disponibles-endoso');
    return response.data;
  },

  /**
   * GET /api/cheques/proveedor/{proveedorId}/endosados
   * Lista cheques endosados a un proveedor específico
   */
  getChequesByProveedorEndoso: async (proveedorId: number): Promise<Cheque[]> => {
    const response = await api.get(`/api/cheques/proveedor/${proveedorId}/endosados`);
    return response.data;
  },
};
