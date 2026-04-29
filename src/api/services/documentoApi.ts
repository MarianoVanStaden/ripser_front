import api from '../config';
import type {
  DocumentoComercial,
  EstadoDocumento,
  DetalleDocumento,
  MetodoPago,
  DetalleDocumentoDTO,
  OpcionFinanciamiento,
  CreateOpcionFinanciamientoDTO,
  ConvertToFacturaDTO,
  ConvertToNotaPedidoResult,
  CreateNotaCreditoDTO,
  PageResponse,
  PaginationParams,
} from '../../types';

// Request-only line item for presupuesto creation. Mirrors
// `DetalleDocumentoCreateDTO` on the backend: `medida` is intentionally
// absent — for EQUIPO items the measure is derived from the recipe at the
// service layer. `color` is sent as a foreign-key id (`colorId`).
export type DetalleDocumentoCreateDTO =
  Omit<DetalleDocumentoDTO, 'medida' | 'color'> & { colorId?: number | null };

// Filtros server-side aceptados por GET /api/documentos y /api/documentos/tipo/{tipo}.
// Se mantiene una sola fuente de verdad para que las páginas consumidoras y el
// endpoint de totales reciban exactamente la misma forma.
export interface DocumentoFilterParams {
  tipos?: string[];
  sucursalId?: number | null;
  estado?: string;
  estados?: string[];
  metodoPago?: string;
  clienteId?: number;
  fechaDesde?: string; // ISO yyyy-mm-dd
  fechaHasta?: string;
  busqueda?: string;
}

export interface DocumentoTotalesDTO {
  count: number;
  totalRevenue: number;
  averageOrderValue: number;
}

const ARRAY_KEYS = ['tipos', 'estados'] as const;

function serializeDocumentoFilters(
  pagination: PaginationParams,
  filters?: DocumentoFilterParams
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...filters, ...pagination };
  for (const key of ARRAY_KEYS) {
    const v = merged[key];
    if (Array.isArray(v)) {
      if (v.length === 0) delete merged[key];
      else merged[key] = v.join(',');
    }
  }
  return merged;
}

// Narrow DTO for creating presupuesto in current backend
export type CreatePresupuestoPayload = {
  clienteId?: number;
  leadId?: number;
  usuarioId: number;
  tipoIva: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
  observaciones?: string;
  detalles: DetalleDocumentoCreateDTO[];
};

export const documentoApi = {


  // Get all documentos (paginated, sin filtros).
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<DocumentoComercial>> => {
    const response = await api.get<PageResponse<DocumentoComercial>>('/api/documentos', {
      params: { ...pagination },
    });
    return response.data;
  },

  // Get all documentos paginated with server-side filters.
  // Soporta multi-tipo via `tipos` (ej: ['FACTURA','NOTA_CREDITO']) y multi-estado
  // via `estados`. busqueda hace LIKE sobre numeroDocumento y nombre del cliente.
  getAllPaginated: async (
    pagination: PaginationParams = {},
    filters?: DocumentoFilterParams
  ): Promise<PageResponse<DocumentoComercial>> => {
    const response = await api.get<PageResponse<DocumentoComercial>>('/api/documentos', {
      params: serializeDocumentoFilters(pagination, filters),
    });
    return response.data;
  },

  // Agregaciones sobre los mismos filtros que getAllPaginated.
  getTotales: async (filters?: DocumentoFilterParams): Promise<DocumentoTotalesDTO> => {
    const response = await api.get<DocumentoTotalesDTO>('/api/documentos/totales', {
      params: serializeDocumentoFilters({}, filters),
    });
    return response.data;
  },

  // Lista única de clientes con al menos un documento del tipo dado.
  getClientesConDocumentos: async (
    tipo: string
  ): Promise<{ id: number; nombre: string }[]> => {
    const response = await api.get<{ id: number; nombre: string }[]>(
      '/api/documentos/clientes-con-documentos',
      { params: { tipo } }
    );
    return response.data;
  },
  // Get documento by ID
  getById: async (id: number): Promise<DocumentoComercial> => {
    const response = await api.get(`/api/documentos/${id}`);
    return response.data;
  },
  // Create new documento - Note: This endpoint doesn't exist in backend
  create: async (_documentoData: Partial<DocumentoComercial> & { detalles: DetalleDocumento[] }): Promise<DocumentoComercial> => {
  void _documentoData;
  throw new Error('Create documento endpoint not implemented in backend');
  },
  // Update documento - Note: This endpoint doesn't exist in backend
  update: async (_id: number, _documentoData: Partial<DocumentoComercial> & { detalles?: DetalleDocumento[] }): Promise<DocumentoComercial> => {
  void _id; void _documentoData;
  throw new Error('Update documento endpoint not implemented in backend');
  },
  // Delete documento - Note: This endpoint doesn't exist in backend
  delete: async (_id: number): Promise<void> => {
  void _id;
  throw new Error('Delete documento endpoint not implemented in backend');
  },
  // Change estado of documento
  changeEstado: async (id: number, nuevoEstado: EstadoDocumento): Promise<DocumentoComercial> => {
    const response = await api.put(`/api/documentos/${id}/estado`, nuevoEstado);
    return response.data;
  },
  // Change metodoPago of documento
  changeMetodoPago: async (id: number, metodoPago: MetodoPago): Promise<DocumentoComercial> => {
    const response = await api.put<DocumentoComercial>(
      `/api/documentos/${id}/metodo-pago`,
      JSON.stringify(metodoPago),
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  },
  // Seleccionar opción de financiamiento en nota de pedido
  selectFinanciamientoNotaPedido: async (notaPedidoId: number, opcionId: number): Promise<DocumentoComercial> => {
    const response = await api.put<DocumentoComercial>(
      `/api/documentos/nota-pedido/${notaPedidoId}/opcion-financiamiento/${opcionId}`
    );
    return response.data;
  },
  // Search documentos by numeroDocumento - Note: This endpoint doesn't exist in backend
  searchByNumero: async (_term: string): Promise<DocumentoComercial[]> => {
  void _term;
  throw new Error('Search by numero endpoint not implemented in backend');
  },
  // Get documentos by estado - Note: This endpoint doesn't exist in backend
  getByEstado: async (_estado: EstadoDocumento): Promise<DocumentoComercial[]> => {
  void _estado;
  throw new Error('Get by estado endpoint not implemented in backend');
  },
  // Get documentos within a date range - Note: This endpoint doesn't exist in backend
  getByFecha: async (_fechaInicio: string, _fechaFin: string): Promise<DocumentoComercial[]> => {
  void _fechaInicio; void _fechaFin;
  throw new Error('Get by fecha endpoint not implemented in backend');
  },
  // Get documentos by tipo (paginated endpoint, returns flat array for backward-compat)
  // DEPRECATED: prefer getByTipoPaginated for new code — devuelve Page<T>
  // y soporta filtros server-side. Esta versión carga `size` (default 500)
  // documentos en una sola request, lo que está documentado como deuda en
  // TECHNICAL_DEBT.md ("Refactor de páginas de Documentos Comerciales").
  getByTipo: async (tipo: string, size = 500): Promise<DocumentoComercial[]> => {
    try {
      const response = await api.get<PageResponse<DocumentoComercial>>(
        `/api/documentos/tipo/${encodeURIComponent(tipo)}`,
        { params: { page: 0, size }, timeout: 60000 }
      );
      return response.data.content;
    } catch (err) {
      const status = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
      if (status === 403) {
        console.warn('Sin permisos para documentos; devolviendo lista vacía');
        return [];
      }
      throw err;
    }
  },

  // Get documentos by tipo (paginated, with server-side filters).
  // busqueda hace LIKE sobre numeroDocumento y nombre del cliente.
  // Por tipo concreto. Acepta los mismos filtros que getAllPaginated salvo `tipos`
  // (el path ya fija el tipo).
  getByTipoPaginated: async (
    tipo: string,
    pagination: PaginationParams = {},
    filters?: Omit<DocumentoFilterParams, 'tipos'>
  ): Promise<PageResponse<DocumentoComercial>> => {
    const response = await api.get<PageResponse<DocumentoComercial>>(
      `/api/documentos/tipo/${encodeURIComponent(tipo)}`,
      { params: serializeDocumentoFilters(pagination, filters) }
    );
    return response.data;
  },
  // Get documentos by cliente
  getByCliente: async (clienteId: number): Promise<DocumentoComercial[]> => {
    const response = await api.get<DocumentoComercial[]>(`/api/documentos/cliente/${clienteId}`);
    return response.data;
  },
  // Update estado of presupuesto
  updateEstado: async (id: number, estado: EstadoDocumento): Promise<DocumentoComercial> => {
    // Backend expects just the string value, not wrapped in an object
    const response = await api.put<DocumentoComercial>(`/api/documentos/${id}/estado`, JSON.stringify(estado), {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },
  // Convert presupuesto to nota de pedido.
  // Backend returns ConvertToNotaPedidoResult { documento, resolucionesEquipo }:
  // stock resolution (P1 → P2 → P3) now happens server-side inside the same
  // @Transactional, so callers no longer need to call resolverParaPedido themselves.
  convertToNotaPedido: async (dto: {
    presupuestoId: number;
    metodoPago: MetodoPago;
    tipoIva: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
    confirmarConDeudaPendiente?: boolean;
    cajaPesosId?: number | null;
    cajaAhorroId?: number | null;
  }): Promise<ConvertToNotaPedidoResult> => {
    const response = await api.post<ConvertToNotaPedidoResult>('/api/documentos/nota-pedido', dto);
    return response.data;
  },
  // Convert nota de pedido to factura
  convertToFactura: async (dto: ConvertToFacturaDTO): Promise<DocumentoComercial> => {
    const response = await api.post<DocumentoComercial>('/api/documentos/factura', dto);
    return response.data;
  },

  // Obtener presupuestos (delegated to getByTipo for consistency)
  getPresupuestos: async (): Promise<DocumentoComercial[]> => {
    return documentoApi.getByTipo('PRESUPUESTO');
  },


  // Obtener opciones de financiamiento de un presupuesto
  getOpcionesFinanciamiento: async (presupuestoId: number): Promise<OpcionFinanciamiento[]> => {
    try {
      const response = await api.get<OpcionFinanciamiento[]>(`/api/opciones-financiamiento/documento/${presupuestoId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching opciones:', error);
      throw error;
    }
  },

  // Seleccionar opción de financiamiento
  selectFinanciamiento: async (presupuestoId: number, opcionId: number): Promise<DocumentoComercial> => {
    try {
      const response = await api.put<DocumentoComercial>(
        `/api/documentos/presupuesto/${presupuestoId}/opcion-financiamiento/${opcionId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error selecting financiamiento:', error);
      throw error;
    }
  },

  // Crear presupuesto con opciones de financiamiento
  createPresupuesto: async (presupuestoData: CreatePresupuestoPayload): Promise<DocumentoComercial> => {
    try {
      const response = await api.post<DocumentoComercial>(`/api/documentos/presupuesto`, {
        ...presupuestoData,
        tipoIva: presupuestoData.tipoIva ?? 'IVA_21',
      });
      return response.data;
    } catch (error) {
      console.error('Error creating presupuesto:', error);
      throw error;
    }
  },

  // Crear opción de financiamiento personalizada
  createOpcionFinanciamiento: async (
    presupuestoId: number,
    opcionData: CreateOpcionFinanciamientoDTO
  ): Promise<OpcionFinanciamiento> => {
    try {
      const response = await api.post<OpcionFinanciamiento>(
        `/api/opciones-financiamiento/documento/${presupuestoId}`,
        opcionData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating opcion:', error);
      throw error;
    }
  },

  // Actualizar opción de financiamiento
  updateOpcionFinanciamiento: async (
    opcionId: number,
    opcionData: Partial<CreateOpcionFinanciamientoDTO>
  ): Promise<OpcionFinanciamiento> => {
    try {
      const response = await api.put<OpcionFinanciamiento>(
        `/api/opciones-financiamiento/${opcionId}`,
        opcionData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating opcion:', error);
      throw error;
    }
  },

  // Eliminar opción de financiamiento
  deleteOpcionFinanciamiento: async (opcionId: number): Promise<boolean> => {
    try {
      await api.delete(`/api/opciones-financiamiento/${opcionId}`);
      return true;
    } catch (error) {
      console.error('Error deleting opcion:', error);
      throw error;
    }
  },

  // Crear Nota de Crédito
  createNotaCredito: async (data: CreateNotaCreditoDTO): Promise<DocumentoComercial> => {
    try {
      const response = await api.post<DocumentoComercial>('/api/documentos/nota-credito', data);
      return response.data;
    } catch (error) {
      console.error('Error creating nota de credito:', error);
      throw error;
    }
  },
};

