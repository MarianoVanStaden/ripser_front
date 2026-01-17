import api from '../config';
import type {
  FlujoCajaResponseEnhanced,
  SaldoPorMetodoPagoDTO,
  ResumenChequesDTO,
} from '../../types';

// Mantener interfaces legacy para compatibilidad
export interface FlujoCajaMovimiento {
  id: number;
  fecha: string;
  tipo: 'INGRESO' | 'EGRESO';
  origen: 'CLIENTE' | 'PROVEEDOR';
  entidad: string;
  concepto: string;
  importe: number;
  numeroComprobante?: string;
}

export interface FlujoCajaResponse {
  totalIngresos: number;
  totalEgresos: number;
  flujoNeto: number;
  totalMovimientos: number;
  movimientos: FlujoCajaMovimiento[];
}

export const adminFlujoCajaApi = {
  /**
   * Fetches basic cash flow data (legacy endpoint).
   * @param fechaDesde Start date in YYYY-MM-DD format (optional)
   * @param fechaHasta End date in YYYY-MM-DD format (optional)
   * @returns Promise<FlujoCajaResponse> - Basic response for backward compatibility
   */
  getFlujoCaja: async (fechaDesde?: string, fechaHasta?: string): Promise<FlujoCajaResponse> => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);

    const queryString = params.toString();
    const url = `/api/admin/flujo-caja${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);
    return response.data;
  },

  /**
   * Fetches enhanced cash flow data with payment method breakdown, cheque summary, and daily evolution.
   * @param fechaDesde Start date in YYYY-MM-DD format (optional, default: 3 months ago)
   * @param fechaHasta End date in YYYY-MM-DD format (optional, default: today)
   * @returns Promise<FlujoCajaResponseEnhanced> - Complete response with saldos, cheques, and evolution
   */
  getFlujoCajaEnhanced: async (
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<FlujoCajaResponseEnhanced> => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);

    const queryString = params.toString();
    const url = `/api/admin/flujo-caja/enhanced${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);
    return response.data;
  },

  /**
   * Fetches current balances grouped by payment method.
   * @returns Promise<SaldoPorMetodoPagoDTO[]> - Array of balances per payment method
   */
  getSaldosPorMetodoPago: async (): Promise<SaldoPorMetodoPagoDTO[]> => {
    const response = await api.get('/api/admin/flujo-caja/saldos');
    return response.data;
  },

  /**
   * Fetches cheque summary by status.
   * @returns Promise<ResumenChequesDTO> - Summary of cheques by status
   */
  getResumenCheques: async (): Promise<ResumenChequesDTO> => {
    const response = await api.get('/api/admin/flujo-caja/cheques/resumen');
    return response.data;
  },
};
