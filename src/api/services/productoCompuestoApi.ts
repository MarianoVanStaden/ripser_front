import api from '../config';
import type {
  ComponenteProductoDTO,
  DesgloseStockProductoDTO,
  SetComposicionDTO,
  AjustarStockDTO,
} from '../../types';

const BASE = '/api/productos';

export const productoCompuestoApi = {
  /** Desglose de stock: por material, libre + embebido en compuestos + total. */
  getDesgloseStock: async (): Promise<DesgloseStockProductoDTO[]> => {
    const { data } = await api.get<DesgloseStockProductoDTO[]>(`${BASE}/desglose-stock`);
    return data;
  },

  /** IDs de los productos que son compuestos (tienen composición). */
  getCompuestosIds: async (): Promise<number[]> => {
    const { data } = await api.get<number[]>(`${BASE}/compuestos-ids`);
    return data;
  },

  getComponentes: async (productoId: number): Promise<ComponenteProductoDTO[]> => {
    const { data } = await api.get<ComponenteProductoDTO[]>(`${BASE}/${productoId}/componentes`);
    return data;
  },

  setComponentes: async (
    productoId: number,
    dto: SetComposicionDTO,
  ): Promise<ComponenteProductoDTO[]> => {
    const { data } = await api.put<ComponenteProductoDTO[]>(`${BASE}/${productoId}/componentes`, dto);
    return data;
  },

  ajustarStock: async (productoId: number, dto: AjustarStockDTO): Promise<void> => {
    await api.patch(`${BASE}/${productoId}/ajustar-stock`, dto);
  },
};

export default productoCompuestoApi;
