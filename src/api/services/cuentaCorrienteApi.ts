import api from '../config';
import type { CuentaCorriente, CreateMovimientoPayload } from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

export const cuentaCorrienteApi = {
  /**
   * Fetches all account movements (paginated) — admin view.
   */
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<CuentaCorriente>> => {
    const res = await api.get<PageResponse<CuentaCorriente>>('/api/cuentas-corriente', {
      params: { ...pagination },
    });
    return res.data;
  },

  /**
   * Fetches movements for a specific client via the dedicated endpoint.
   * Backend returns List<DTO> (array), wrapped into a PageResponse for compatibility.
   */
  getByClienteId: async (clienteId: number): Promise<PageResponse<CuentaCorriente>> => {
    const res = await api.get<CuentaCorriente[]>(`/api/cuentas-corriente/cliente/${clienteId}`);
    const content = res.data ?? [];
    return {
      content,
      totalElements: content.length,
      totalPages: 1,
      size: content.length,
      number: 0,
      first: true,
      last: true,
      numberOfElements: content.length,
      empty: content.length === 0,
    };
  },

  /**
   * Creates a new account movement.
   */
  create: async (movimiento: CreateMovimientoPayload): Promise<CuentaCorriente> => {
    const response = await api.post('/api/cuentas-corriente', movimiento);
    return response.data;
  },
};