import axios from '../config';
import type { Sueldo } from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

const BASE_URL = '/api/sueldos';

/** Ventas netas de equipos refrigerados de una vendedora en el mes y su bono por meta. */
export interface VentaVendedora {
  usuarioId: number | null;
  empleadoId: number | null;
  nombre: string;
  /** Unidades netas (HELADERA + COOLBOX) del reporte "Unidades por Vendedor". */
  unidadesNetas: number;
  /** Alias legacy de unidadesNetas (mismo valor). */
  heladerasVendidas: number;
  /** Meta individual alcanzada: 'NINGUNA' | 'BASE' | 'SUPERADORA'. */
  metaAlcanzada: string;
  /** Bono sugerido por la meta alcanzada (0 si ninguna o sin monto configurado). */
  bonoSugerido: number;
}

/**
 * Asistencia agregada de un empleado en el mes (fichadas del terminal) para
 * pre-cargar HE / HA / presentismo en la liquidación masiva. Todos los valores
 * son sugerencias editables.
 */
export interface AsistenciaLiquidacionEmpleado {
  empleadoId: number;
  nombreCompleto: string;
  diasHabiles: number;
  diasTrabajados: number;
  diasAusentes: number;
  diasIncompletos: number;
  horasExtra: number;
  horasAusentes: number;
  presentismoPct: number;
  sinHorario: boolean;
  avisos: string[];
}

/** Conteo automático de unidades del mes para la calculadora de bonos. */
export interface UnidadesMes {
  producidas: number;
  vendidas: number;
  ventasPorVendedora: VentaVendedora[];
  asistenciaPorEmpleado: AsistenciaLiquidacionEmpleado[];
  /** Total neto de equipos refrigerados del equipo en el mes (meta grupal, informativa). */
  totalEquipoNeto: number;
  /** Índice del tramo grupal alcanzado (0-based), -1 si ninguno. Informativo. */
  tramoGrupalAlcanzado: number;
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
          unidadesNetas: Number(v.unidadesNetas ?? v.heladerasVendidas) || 0,
          heladerasVendidas: Number(v.heladerasVendidas ?? v.unidadesNetas) || 0,
          metaAlcanzada: v.metaAlcanzada ?? 'NINGUNA',
          bonoSugerido: Number(v.bonoSugerido) || 0,
        })),
      asistenciaPorEmpleado: (Array.isArray(data.asistenciaPorEmpleado) ? data.asistenciaPorEmpleado : [])
        .map(a => ({
          empleadoId: a.empleadoId,
          nombreCompleto: a.nombreCompleto ?? '',
          diasHabiles: Number(a.diasHabiles) || 0,
          diasTrabajados: Number(a.diasTrabajados) || 0,
          diasAusentes: Number(a.diasAusentes) || 0,
          diasIncompletos: Number(a.diasIncompletos) || 0,
          horasExtra: Number(a.horasExtra) || 0,
          horasAusentes: Number(a.horasAusentes) || 0,
          presentismoPct: Number(a.presentismoPct ?? 100),
          sinHorario: Boolean(a.sinHorario),
          avisos: Array.isArray(a.avisos) ? a.avisos : [],
        })),
      totalEquipoNeto: Number(data.totalEquipoNeto) || 0,
      tramoGrupalAlcanzado: Number.isFinite(data.tramoGrupalAlcanzado) ? data.tramoGrupalAlcanzado : -1,
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
