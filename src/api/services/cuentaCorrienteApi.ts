import api from '../config';
import type { CuentaCorriente, CreateMovimientoPayload } from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

export interface CuentaCorrienteFilterParams {
  clienteId?: number;
}

export const cuentaCorrienteApi = {
  /**
   * Fetches all account movements from all clients with optional filters (paginated).
   */
  getAll: async (pagination: PaginationParams = {}, filters?: CuentaCorrienteFilterParams): Promise<PageResponse<CuentaCorriente>> => {
    const res = await api.get<PageResponse<CuentaCorriente>>('/api/cuentas-corriente', {
      params: { ...pagination, ...filters },
    });
    return res.data;
  },

  /**
   * @deprecated Use getAll({ clienteId }, pagination) instead
   * Fetches all account movements for a specific client.
   */
  getByClienteId: async (clienteId: number, pagination: PaginationParams = {}): Promise<PageResponse<CuentaCorriente>> => {
    return cuentaCorrienteApi.getAll(pagination, { clienteId });
  },

  /**
   * Creates a new account movement.
   */
  create: async (movimiento: CreateMovimientoPayload): Promise<CuentaCorriente> => {
    console.log('cuentaCorrienteApi.create - About to send:', movimiento);
    const response = await api.post(`/api/cuentas-corriente`, movimiento);
    return response.data;
  },
};