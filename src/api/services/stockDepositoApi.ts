import api from '../config';
import type { StockDeposito, StockDepositoCreateDTO } from '../../types';

export const stockDepositoApi = {
  // Consultas
  getAll: async (): Promise<StockDeposito[]> => {
    const response = await api.get('/api/stock-deposito');
    return response.data;
  },

  getById: async (id: number): Promise<StockDeposito> => {
    const response = await api.get(`/api/stock-deposito/${id}`);
    return response.data;
  },

  getByProducto: async (productoId: number): Promise<StockDeposito[]> => {
    const response = await api.get(`/api/stock-deposito/producto/${productoId}`);
    return response.data;
  },

  getByDeposito: async (depositoId: number): Promise<StockDeposito[]> => {
    const response = await api.get(`/api/stock-deposito/deposito/${depositoId}`);
    return response.data;
  },

  getByProductoAndDeposito: async (productoId: number, depositoId: number): Promise<StockDeposito> => {
    const response = await api.get(`/api/stock-deposito/producto/${productoId}/deposito/${depositoId}`);
    return response.data;
  },

  getBajoMinimo: async (): Promise<StockDeposito[]> => {
    const response = await api.get('/api/stock-deposito/bajo-minimo');
    return response.data;
  },

  getSobreMaximo: async (): Promise<StockDeposito[]> => {
    const response = await api.get('/api/stock-deposito/sobre-maximo');
    return response.data;
  },

  getStockTotal: async (productoId: number): Promise<number> => {
    const response = await api.get(`/api/stock-deposito/producto/${productoId}/total`);
    return response.data;
  },

  // Operaciones
  create: async (stock: StockDepositoCreateDTO): Promise<StockDeposito> => {
    const response = await api.post('/api/stock-deposito', stock);
    return response.data;
  },

  update: async (id: number, stock: Partial<StockDepositoCreateDTO>): Promise<StockDeposito> => {
    const response = await api.put(`/api/stock-deposito/${id}`, stock);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/stock-deposito/${id}`);
  },

  ajustar: async (id: number, cantidad: number): Promise<StockDeposito> => {
    const response = await api.patch(`/api/stock-deposito/${id}/ajustar`, null, {
      params: { cantidad }
    });
    return response.data;
  },

  transferir: async (
    productoId: number,
    depositoOrigenId: number,
    depositoDestinoId: number,
    cantidad: number
  ): Promise<void> => {
    await api.post('/api/stock-deposito/transferir', null, {
      params: { productoId, depositoOrigenId, depositoDestinoId, cantidad }
    });
  },
};
