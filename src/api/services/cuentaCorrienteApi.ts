//import axios from 'axios';
import type { CuentaCorriente, CreateMovimientoPayload } from '../../types';
import api from '../config'; 
//const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'; // Fallback to backend port

//const api = axios.create({
 // baseURL: API_URL,
//});

export const cuentaCorrienteApi = {
  /**
   * Fetches all account movements for a specific client.
   */
  getByClienteId: async (clienteId: number): Promise<CuentaCorriente[]> => {
    const res = await api.get(`/api/cuentas-corriente/cliente/${clienteId}`);
    return res.data;
  },

  /**
   * Creates a new account movement.
   */
  create: async (movimiento: CreateMovimientoPayload): Promise<CuentaCorriente> => {
    const response = await api.post(`/api/cuentas-corriente`, movimiento); // Adjust based on actual create endpoint
    return response.data;
  },
};