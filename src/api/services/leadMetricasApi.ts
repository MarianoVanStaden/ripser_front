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
  promedioTiempoConversion?: number; // Opcional - puede no venir del backend
  valorTotalGenerado?: number;       // Valor total generado por este canal
}

// DTO: Métricas por Prioridad
export interface MetricaPorPrioridadDTO {
  prioridad: string;
  cantidad: number;           // Total de leads con esta prioridad
  porcentaje: number;         // Porcentaje del total
  convertidos: number;        // Leads convertidos
  tasaConversion: number;     // Tasa de conversión (%)
  promedioValorEstimado?: number; // Opcional - valor promedio estimado
}

// DTO: Tiempo de Conversión
export interface TiempoConversionDTO {
  promedioGeneral: number;
  medianaGeneral: number;
  minimoTiempo: number;
  maximoTiempo: number;
  promedioPorCanal: Record<string, number>;
  promedioPorPrioridad: Record<string, number>;
}

// DTO: Distribución Geográfica
export interface MetricaGeograficaDTO {
  provincia: string;
  totalLeads?: number;        // Alias: cantidad
  cantidad?: number;          // Nombre usado por backend
  leadsConvertidos?: number;  // Alias: convertidos
  convertidos?: number;       // Nombre usado por backend
  tasaConversion: number;
  porcentaje?: number;
  valorEstimadoTotal?: number;
  valorTotalGenerado?: number;
}

// DTO: Productos de Interés
export interface ProductoInteresItemDTO {
  productoId: number;
  productoNombre: string;
  cantidadLeads?: number;         // Alias
  cantidad?: number;              // Alias
  cantidadSolicitudes?: number;   // Nombre real del backend
  cantidadConvertidos?: number;   // Alias
  convertidos?: number;           // Alias
  cantidadConvertida?: number;    // Nombre real del backend
  tasaConversion: number;
  valorEstimadoTotal?: number;
  valorTotalGenerado?: number;
}

export interface EquipoInteresItemDTO {
  equipoId: number;
  equipoNombre: string;
  cantidadLeads?: number;         // Alias
  cantidad?: number;              // Alias
  cantidadSolicitudes?: number;   // Nombre real del backend
  cantidadConvertidos?: number;   // Alias
  convertidos?: number;           // Alias
  cantidadConvertida?: number;    // Nombre real del backend
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
  mes: string;        // "2025-12", "2025-11", etc. (formato año-mes)
  mesNombre?: string; // "Diciembre 2025", "Noviembre 2025", etc. (nombre legible)
  cantidad: number;
  tasaConversion?: number | null;
}

export interface TendenciasTemporalesDTO {
  leadsPorMes: TendenciaMensualDTO[];
  conversionesPorMes: TendenciaMensualDTO[];
}

// DTO: Presupuesto vs Realizado
export interface PresupuestoVsRealizadoDTO {
  presupuestoEstimadoTotal: number;
  valorRealizadoTotal: number;
  tasaRealizacion: number;
  cantidadPresupuestosEstimados: number;
  cantidadPresupuestosRealizados: number;
  diferencia: number;
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
