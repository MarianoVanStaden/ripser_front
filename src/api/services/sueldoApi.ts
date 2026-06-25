import axios from '../config';
import type { Sueldo } from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

const BASE_URL = '/api/sueldos';

/** Heladeras (no exhibidores) vendidas por una vendedora en el mes. */
export interface VentaVendedora {
  usuarioId: number | null;
  empleadoId: number | null;
  nombre: string;
  heladerasVendidas: number;
}

/** Conteo automático de unidades del mes para la calculadora de bonos. */
export interface UnidadesMes {
  producidas: number;
  vendidas: number;
  ventasPorVendedora: VentaVendedora[];
}

export const sueldoApi = {
  // Get all sueldos
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<Sueldo>> => {
    const response = await axios.get<PageResponse<Sueldo>>(BASE_URL, {
      params: { ...pagination },
    });
    return response.data;
  },

  // Get sueldo by ID
  getById: async (id: number): Promise<Sueldo> => {
    const response = await axios.get<Sueldo>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Get sueldos by empleado
  getByEmpleado: async (empleadoId: number): Promise<Sueldo[]> => {
    const response = await axios.get<Sueldo[]>(`${BASE_URL}/empleado/${empleadoId}`);
    return response.data;
  },

  // Get sueldos by periodo
  getByPeriodo: async (periodo: string): Promise<Sueldo[]> => {
    const response = await axios.get<Sueldo[]>(`${BASE_URL}/periodo/${periodo}`);
    return response.data;
  },

  // Get sueldos by periodo range
  getByPeriodoRange: async (periodoInicio: string, periodoFin: string): Promise<Sueldo[]> => {
    const response = await axios.get<Sueldo[]>(`${BASE_URL}/periodo-range`, {
      params: { periodoInicio, periodoFin }
    });
    return response.data;
  },

  // Get sueldos pendientes de pago
  getPendientesPago: async (): Promise<Sueldo[]> => {
    const response = await axios.get<Sueldo[]>(`${BASE_URL}/pendientes-pago`);
    return response.data;
  },

  // Create new sueldo
  create: async (sueldo: Omit<Sueldo, 'id'>): Promise<Sueldo> => {
    const response = await axios.post<Sueldo>(BASE_URL, sueldo);
    return response.data;
  },

  // Update existing sueldo
  update: async (id: number, sueldo: Partial<Sueldo>): Promise<Sueldo> => {
    const response = await axios.put<Sueldo>(`${BASE_URL}/${id}`, sueldo);
    return response.data;
  },

  // Delete sueldo
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`);
  },

  // Liquidación masiva del mes: upsert por (empleadoId, periodo).
  // Devuelve la lista de sueldos creados o actualizados.
  liquidarMasivo: async (items: any[]): Promise<Sueldo[]> => {
    const { data } = await axios.post<Sueldo[]>(`${BASE_URL}/liquidacion-masiva`, items);
    return data;
  },

  // Cuenta automática de unidades del mes para alimentar la calculadora de
  // bonos:
  //   - producidas: equipos (no exhibidores) fabricados en el mes → bono producción del taller.
  //   - vendidas: total de unidades en notas de pedido aprobadas (agregado).
  //   - ventasPorVendedora: heladeras (no exhibidores) vendidas por cada
  //     vendedora (quien convirtió la nota de pedido) → bono ventas por asesora.
  getUnidadesMes: async (periodo: string): Promise<UnidadesMes> => {
    const { data } = await axios.get<UnidadesMes>(
      `${BASE_URL}/unidades-mes`, { params: { periodo } },
    );
    return {
      producidas: Number(data.producidas) || 0,
      vendidas: Number(data.vendidas) || 0,
      ventasPorVendedora: (Array.isArray(data.ventasPorVendedora) ? data.ventasPorVendedora : [])
        .map(v => ({
          usuarioId: v.usuarioId ?? null,
          empleadoId: v.empleadoId ?? null,
          nombre: v.nombre ?? '',
          heladerasVendidas: Number(v.heladerasVendidas) || 0,
        })),
    };
  },

  // Pagar un sueldo distribuyendo el monto entre N cajas en pesos.
  pagarSueldo: async (
    sueldoId: number,
    payload: {
      fecha: string;
      items: Array<{ cajaPesosId: number; monto: number; metodoPago?: string; observaciones?: string }>;
      observaciones?: string;
    },
  ): Promise<Sueldo> => {
    const { data } = await axios.post<Sueldo>(`${BASE_URL}/${sueldoId}/pagar`, payload);
    return data;
  },
};

export default sueldoApi;
