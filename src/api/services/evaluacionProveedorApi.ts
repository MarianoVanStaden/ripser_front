import api from '../api';

// Criterios de evaluación como const object
export const CriterioEvaluacion = {
  CALIDAD: 'CALIDAD',
  PUNTUALIDAD: 'PUNTUALIDAD',
  PRECIO: 'PRECIO',
  SERVICIO: 'SERVICIO',
  COMUNICACION: 'COMUNICACION',
  FLEXIBILIDAD: 'FLEXIBILIDAD'
} as const;

export type CriterioEvaluacion = typeof CriterioEvaluacion[keyof typeof CriterioEvaluacion];

// DTOs
export interface EvaluacionProveedorDTO {
  id: number;
  proveedorId: number;
  proveedorNombre: string;
  calificacion: number; // 0.00 a 5.00
  comentario?: string;
  criterio: CriterioEvaluacion;
  fechaEvaluacion: string; // ISO 8601 format
  evaluadoPor: string;
  activo: boolean;
}

export interface EvaluacionCreateDTO {
  proveedorId: number;
  calificacion: number; // 0.00 a 5.00
  comentario?: string;
  criterio: CriterioEvaluacion;
  evaluadoPor: string;
}

export interface EstadisticasEvaluacionDTO {
  proveedorId: number;
  proveedorNombre: string;
  calificacionGeneral: number;
  totalEvaluaciones: number;
  calificacionesPorCriterio: Record<string, number>;
  calificacionMaxima: number;
  calificacionMinima: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// API Service
const BASE_PATH = '/api/evaluaciones-proveedores';

export const evaluacionProveedorApi = {
  // Crear evaluación
  crear: async (data: EvaluacionCreateDTO): Promise<EvaluacionProveedorDTO> => {
    const response = await api.post(BASE_PATH, data);
    return response.data;
  },

  // Obtener evaluaciones de un proveedor
  obtenerPorProveedor: async (proveedorId: number): Promise<EvaluacionProveedorDTO[]> => {
    const response = await api.get(`${BASE_PATH}/proveedor/${proveedorId}`);
    return response.data;
  },

  // Obtener evaluaciones paginadas
  obtenerPaginado: async (
    proveedorId: number,
    page: number = 0,
    size: number = 10,
    sort: string = 'fechaEvaluacion,desc'
  ): Promise<PaginatedResponse<EvaluacionProveedorDTO>> => {
    const response = await api.get(`${BASE_PATH}/proveedor/${proveedorId}/paginado`, {
      params: { page, size, sort }
    });
    return response.data;
  },

  // Obtener estadísticas de un proveedor
  obtenerEstadisticas: async (proveedorId: number): Promise<EstadisticasEvaluacionDTO> => {
    const response = await api.get(`${BASE_PATH}/proveedor/${proveedorId}/estadisticas`);
    return response.data;
  },

  // Obtener evaluaciones por criterio
  obtenerPorCriterio: async (
    proveedorId: number,
    criterio: CriterioEvaluacion
  ): Promise<EvaluacionProveedorDTO[]> => {
    const response = await api.get(`${BASE_PATH}/proveedor/${proveedorId}/criterio/${criterio}`);
    return response.data;
  },

  // Obtener últimas 5 evaluaciones
  obtenerUltimas: async (proveedorId: number): Promise<EvaluacionProveedorDTO[]> => {
    const response = await api.get(`${BASE_PATH}/proveedor/${proveedorId}/ultimas`);
    return response.data;
  },

  // Obtener una evaluación específica
  obtenerPorId: async (id: number): Promise<EvaluacionProveedorDTO> => {
    const response = await api.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  // Obtener todas las evaluaciones (paginado)
  obtenerTodas: async (
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<EvaluacionProveedorDTO>> => {
    const response = await api.get(BASE_PATH, {
      params: { page, size }
    });
    return response.data;
  },

  // Eliminar evaluación (soft delete)
  eliminar: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  }
};

export default evaluacionProveedorApi;
