import axios from '../config';
import type {
  Adelanto,
  AdelantoCreateDTO,
  PagoAdelantoMasivoRequestDTO,
  PagoAdelantoRequestDTO,
} from '../../types';

const BASE_URL = '/api/adelantos';

export const adelantoApi = {
  getAll: async (): Promise<Adelanto[]> => {
    const { data } = await axios.get<Adelanto[]>(BASE_URL);
    return data;
  },

  getById: async (id: number): Promise<Adelanto> => {
    const { data } = await axios.get<Adelanto>(`${BASE_URL}/${id}`);
    return data;
  },

  getByEmpleadoPeriodo: async (empleadoId: number, periodo: string): Promise<Adelanto[]> => {
    const { data } = await axios.get<Adelanto[]>(`${BASE_URL}/empleado/${empleadoId}/periodo/${periodo}`);
    return data;
  },

  getTotalByEmpleadoPeriodo: async (empleadoId: number, periodo: string): Promise<number> => {
    const { data } = await axios.get<number | string>(`${BASE_URL}/empleado/${empleadoId}/periodo/${periodo}/total`);
    return Number(data) || 0;
  },

  create: async (dto: AdelantoCreateDTO): Promise<Adelanto> => {
    const { data } = await axios.post<Adelanto>(BASE_URL, dto);
    return data;
  },

  update: async (id: number, dto: Partial<Adelanto>): Promise<Adelanto> => {
    const { data } = await axios.put<Adelanto>(`${BASE_URL}/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Paga un adelanto distribuyendo el monto entre N cajas en pesos. Cada item
   * genera un MovimientoExtra (DEBITO, SUELDOS_SALARIOS). El backend marca
   * el adelanto como pagado (fechaPago != null).
   */
  pagar: async (id: number, payload: PagoAdelantoRequestDTO): Promise<Adelanto> => {
    const { data } = await axios.post<Adelanto>(`${BASE_URL}/${id}/pagar`, payload);
    return data;
  },

  /** Paga N adelantos pendientes desde una sola caja. */
  pagarMasivo: async (payload: PagoAdelantoMasivoRequestDTO): Promise<Adelanto[]> => {
    const { data } = await axios.post<Adelanto[]>(`${BASE_URL}/pagar-masivo`, payload);
    return data;
  },
};

export default adelantoApi;
