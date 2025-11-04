import api from '../config';

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
   * Fetches cash flow data with optional date filters.
   * @param fechaDesde Start date in YYYY-MM-DD format (optional)
   * @param fechaHasta End date in YYYY-MM-DD format (optional)
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
};
