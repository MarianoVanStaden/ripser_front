import api from '../config';

import type {
  RequerimientoStockDTO,
  CreateRequerimientoStockDTO,
  EstadoRequerimientoStock,
  GenerarOrdenesCompraResponseDTO,
  AsignarProveedoresDTO,
  RecibirRequerimientoDTO,
} from '../../types';

const BASE = '/api/requerimientos-stock';

export const requerimientoStockApi = {
  /** Lista los requerimientos, opcionalmente filtrando por estado. */
  findAll: async (estado?: EstadoRequerimientoStock): Promise<RequerimientoStockDTO[]> => {
    const response = await api.get<RequerimientoStockDTO[]>(BASE, {
      params: estado ? { estado } : undefined,
    });
    return response.data;
  },

  findById: async (id: number): Promise<RequerimientoStockDTO> => {
    const response = await api.get<RequerimientoStockDTO>(`${BASE}/${id}`);
    return response.data;
  },

  /** Crea un requerimiento de stock (documento por solicitud). */
  crear: async (dto: CreateRequerimientoStockDTO): Promise<RequerimientoStockDTO> => {
    const response = await api.post<RequerimientoStockDTO>(BASE, dto);
    return response.data;
  },

  cambiarEstado: async (
    id: number,
    estado: EstadoRequerimientoStock,
  ): Promise<RequerimientoStockDTO> => {
    const response = await api.patch<RequerimientoStockDTO>(
      `${BASE}/${id}/estado`,
      null,
      { params: { estado } },
    );
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  /** Convierte el requerimiento en órdenes de compra (una por proveedor sugerido). */
  generarOrdenesCompra: async (id: number): Promise<GenerarOrdenesCompraResponseDTO> => {
    const response = await api.post<GenerarOrdenesCompraResponseDTO>(
      `${BASE}/${id}/generar-ordenes-compra`,
    );
    return response.data;
  },

  /** Asignación manual de proveedores por el admin de compras (permite dividir cantidades). */
  asignarProveedores: async (
    id: number,
    dto: AsignarProveedoresDTO,
  ): Promise<GenerarOrdenesCompraResponseDTO> => {
    const response = await api.post<GenerarOrdenesCompraResponseDTO>(
      `${BASE}/${id}/asignar-proveedores`,
      dto,
    );
    return response.data;
  },

  /** Recepción registrada por el taller sobre su pedido (ingresa stock al depósito). */
  recibir: async (id: number, dto: RecibirRequerimientoDTO): Promise<RequerimientoStockDTO> => {
    const response = await api.post<RequerimientoStockDTO>(`${BASE}/${id}/recibir`, dto);
    return response.data;
  },
};

export default requerimientoStockApi;
