import api from '../api'; // Import the configured axios instance
import type { CuentaCorriente } from '../../types';

const BASE_PATH = '/clientes/cuenta-corriente';

type CreateMovimientoPayload = Omit<CuentaCorriente, 'id' | 'saldo' | 'cliente' | 'fecha'> & {
  cliente: { id: number };
  fecha: string; // ISO string
};

export const cuentaCorrienteApi = {
  /**
   * Fetches all account movements for a specific client.
   */
  getByClienteId: async (clienteId: number): Promise<CuentaCorriente[]> => {
    const response = await api.get<CuentaCorriente[]>(`${BASE_PATH}/cliente/${clienteId}`);
    return response.data;
  },

  /**
   * Creates a new account movement.
   */
  create: async (movimiento: CreateMovimientoPayload): Promise<CuentaCorriente> => {
    const response = await api.post<CuentaCorriente>(BASE_PATH, movimiento);
    return response.data;
  },
};
