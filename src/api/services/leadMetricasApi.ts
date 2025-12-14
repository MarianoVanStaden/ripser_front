import api from '../config';

// ========================
// TIPOS TYPESCRIPT
// ========================

export interface LeadMetricasRequestParams {
  fechaInicio: string; // formato ISO: YYYY-MM-DD
  fechaFin: string; // formato ISO: YYYY-MM-DD
  sucursalId?: number;
  usuarioAsignadoId?: number;
}

export interface ComparacionMensualParams {
  meses?: number;
  sucursalId?: number;
}

// DTO: Tasa de Conversión
export interface TasaConversionDTO {
  totalLeads: number;
  leadsConvertidos: number;
  tasaConversion: number;
  tasaConversionMesAnterior: number;
  variacionPorcentual: number;
}

// DTO: Embudo de Ventas
export interface EmbudoVentasDTO {
  estadoLead: string;
  cantidad: number;
  porcentaje: number;
  orden: number;
}

// DTO: Métricas por Canal
export interface MetricaPorCanalDTO {
  canal: string;
  totalLeads: number;
  leadsConvertidos: number;
  tasaConversion: number;
  promedioTiempoConversion: number;
}

// DTO: Métricas por Prioridad
export interface MetricaPorPrioridadDTO {
  prioridad: string;
  totalLeads: number;
  leadsConvertidos: number;
  tasaConversion: number;
  promedioValorEstimado: number;
}

// DTO: Tiempo de Conversión
export interface TiempoConversionDTO {
  promedioTiempoConversion: number;
  tiempoConversionMinimo: number;
  tiempoConversionMaximo: number;
  promedioMesAnterior: number;
  variacionPorcentual: number;
}

// DTO: Distribución Geográfica
export interface MetricaGeograficaDTO {
  provincia: string;
  totalLeads: number;
  leadsConvertidos: number;
  tasaConversion: number;
  valorEstimadoTotal: number;
}

// DTO: Productos de Interés
export interface ProductoInteresItemDTO {
  productoId: number;
  productoNombre: string;
  cantidadLeads: number;
  cantidadConvertidos: number;
  tasaConversion: number;
  valorEstimadoTotal: number;
}

export interface EquipoInteresItemDTO {
  equipoId: number;
  equipoNombre: string;
  cantidadLeads: number;
  cantidadConvertidos: number;
  tasaConversion: number;
}

export interface ProductosInteresDTO {
  productos: ProductoInteresItemDTO[];
  equipos: EquipoInteresItemDTO[];
}

// DTO: Métricas por Vendedor
export interface MetricaPorVendedorDTO {
  vendedorId: number;
  vendedorNombre: string;
  totalLeads: number;
  leadsConvertidos: number;
  tasaConversion: number;
  valorEstimadoTotal: number;
  valorRealizado: number;
}

// DTO: Tendencias Temporales
export interface TendenciaMensualDTO {
  mes: string; // "Enero 2024", "Febrero 2024", etc.
  cantidad: number;
}

export interface TendenciasTemporalesDTO {
  leadsPorMes: TendenciaMensualDTO[];
  conversionesPorMes: TendenciaMensualDTO[];
}

// DTO: Presupuesto vs Realizado
export interface PresupuestoVsRealizadoDTO {
  valorEstimadoTotal: number;
  valorRealizado: number;
  diferencia: number;
  porcentajeCumplimiento: number;
}

// DTO: Respuesta Principal con todas las métricas
export interface LeadMetricasResponseDTO {
  tasaConversion: TasaConversionDTO;
  embudoVentas: EmbudoVentasDTO[];
  metricasPorCanal: MetricaPorCanalDTO[];
  metricasPorPrioridad: MetricaPorPrioridadDTO[];
  tiempoConversion: TiempoConversionDTO;
  distribucionGeografica: MetricaGeograficaDTO[];
  productosInteres: ProductosInteresDTO;
  metricasPorVendedor: MetricaPorVendedorDTO[];
  tendenciasTemporales: TendenciasTemporalesDTO;
  presupuestoVsRealizado: PresupuestoVsRealizadoDTO;
}

// DTO: Comparación Mensual (array de métricas por período)
export interface ComparacionMensualDTO {
  periodo: string; // "2024-01", "2024-02", etc.
  metricas: LeadMetricasResponseDTO;
}

// ========================
// API SERVICE
// ========================

const BASE_PATH = '/api/leads/metricas';

export const leadMetricasApi = {
  /**
   * Obtener métricas completas de leads
   * @param params - Parámetros de filtro (fechaInicio, fechaFin, sucursalId, usuarioAsignadoId)
   * @returns LeadMetricasResponseDTO con todas las métricas calculadas
   */
  obtenerMetricasCompletas: async (
    params: LeadMetricasRequestParams
  ): Promise<LeadMetricasResponseDTO> => {
    const queryParams = new URLSearchParams();
    
    queryParams.append('fechaInicio', params.fechaInicio);
    queryParams.append('fechaFin', params.fechaFin);
    
    if (params.sucursalId !== undefined) {
      queryParams.append('sucursalId', params.sucursalId.toString());
    }
    
    if (params.usuarioAsignadoId !== undefined) {
      queryParams.append('usuarioAsignadoId', params.usuarioAsignadoId.toString());
    }

    const url = `${BASE_PATH}?${queryParams.toString()}`;
    const response = await api.get<LeadMetricasResponseDTO>(url);
    return response.data;
  },

  /**
   * Obtener comparación mensual de métricas
   * @param params - Parámetros opcionales (meses, sucursalId)
   * @returns Array de ComparacionMensualDTO con métricas por mes
   */
  obtenerComparacionMensual: async (
    params?: ComparacionMensualParams
  ): Promise<ComparacionMensualDTO[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.meses !== undefined) {
      queryParams.append('meses', params.meses.toString());
    }
    
    if (params?.sucursalId !== undefined) {
      queryParams.append('sucursalId', params.sucursalId.toString());
    }

    const url = `${BASE_PATH}/comparacion-mensual${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get<ComparacionMensualDTO[]>(url);
    return response.data;
  },
};

export default leadMetricasApi;
