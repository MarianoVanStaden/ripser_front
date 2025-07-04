import api from '../config';
import type { Order, CreateOrderRequest } from '../../types';

export const orderApi = {
  // Get all orders
  getAll: async (): Promise<Order[]> => {
    const response = await api.get('/api/orders');
    return response.data;
  },

  // Get order by ID
  getById: async (id: number): Promise<Order> => {
    const response = await api.get(`/api/orders/${id}`);
    return response.data;
  },

  // Create new order
  create: async (order: CreateOrderRequest): Promise<Order> => {
    const response = await api.post('/api/orders', order);
    return response.data;
  },

  // Update order
  update: async (id: number, order: Partial<CreateOrderRequest>): Promise<Order> => {
    const response = await api.put(`/api/orders/${id}`, order);
    return response.data;
  },

  // Delete order
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/orders/${id}`);
  },

  // Get orders by client
  getByClient: async (clientId: number): Promise<Order[]> => {
    const response = await api.get(`/api/orders/client/${clientId}`);
    return response.data;
  },

  // Get orders by status
  getByStatus: async (status: string): Promise<Order[]> => {
    const response = await api.get(`/api/orders/status/${status}`);
    return response.data;
  }
};
