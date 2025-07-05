/*
import api from '../config';
import type { Order, CreateOrderRequest } from '../../types';

export const orderApi = {
  // Get all orders
  getAll: async (): Promise<Order[]> => {
    const response = await api.get('/api/ordenes');
    return response.data;
  },

  // Get order by ID
  getById: async (id: number): Promise<Order> => {
    const response = await api.get(`/api/ordenes/${id}`);
    return response.data;
  },

  // Create new order
  create: async (order: CreateOrderRequest): Promise<Order> => {
    const response = await api.post('/api/ordenes', order);
    return response.data;
  },

  // Update order
  update: async (id: number, order: Partial<CreateOrderRequest>): Promise<Order> => {
    const response = await api.put(`/api/ordenes/${id}`, order);
    return response.data;
  },

  // Delete order
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/ordenes/${id}`);
  },

  // Get orders by client
  getByClient: async (clientId: number): Promise<Order[]> => {
    const response = await api.get(`/api/ordenes/cliente/${clientId}`);
    return response.data;
  },

  // Get orders by status
  getByStatus: async (estado: string): Promise<Order[]> => {
    const response = await api.get(`/api/ordenes/estado/${estado}`);
    return response.data;
  }
};
*/