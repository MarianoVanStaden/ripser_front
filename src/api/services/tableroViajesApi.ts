import api from '../config';
import type { PageResponse } from '../../types/pagination.types';
import type { EstadoTablero, TableroPendienteRow, TipoOrigenTablero } from '../../types/tablero.types';

// Filtros server-side de GET /api/viajes/tablero/pendientes. Todos opcionales
// y combinables; una sola fuente de verdad para la página del tablero.
export interface TableroFilterParams {
  provincia?: string;
  clienteId?: number;
  tipoDocumento?: TipoOrigenTablero;
  fechaEstimadaDesde?: string; // ISO yyyy-mm-dd
  fechaEstimadaHasta?: string;
  soloAtrasados?: boolean;
  conObservaciones?: boolean;
  estadoTablero?: EstadoTablero;
}

export const tableroViajesApi = {
  // sort esperado como "campo,direccion" (ej. "fechaEstimada,asc" | "cliente,desc").
  async getPendientes(
    page: number,
    size: number,
    sort: string,
    filters?: TableroFilterParams
  ): Promise<PageResponse<TableroPendienteRow>> {
    const [sortBy, sortDir] = (sort || 'fechaEstimada,asc').split(',');
    const params: Record<string, unknown> = { ...filters, page, size, sortBy, sortDir };
    // Los params undefined/'' no deben viajar (el backend interpreta ausencia como "sin filtro").
    for (const key of Object.keys(params)) {
      if (params[key] === undefined || params[key] === '' || params[key] === null) delete params[key];
    }
    const response = await api.get<PageResponse<TableroPendienteRow>>(
      '/api/viajes/tablero/pendientes',
      { params }
    );
    return response.data;
  },
};

export default tableroViajesApi;
