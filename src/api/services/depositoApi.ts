import api from '../config';
import type { Deposito, DepositoCreateDTO } from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

export const depositoApi = {
  // Consultas básicas
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<Deposito>> => {
    const response = await api.get<PageResponse<Deposito>>('/api/depositos', {
      params: { ...pagination },
    });
    return response.data;
  },

  getActivos: async (): Promise<Deposito[]> => {
    const response = await api.get('/api/depositos/activos');
    return response.data;
  },

  getById: async (id: number): Promise<Deposito> => {
    const response = await api.get(`/api/depositos/${id}`);
    return response.data;
  },

  getByCodigo: async (codigo: string): Promise<Deposito> => {
    const response = await api.get(`/api/depositos/codigo/${codigo}`);
    return response.data;
  },

  // Consultas por sucursal
  getBySucursal: async (sucursalId: number): Promise<Deposito[]> => {
    const response = await api.get(`/api/depositos/sucursal/${sucursalId}`);
    return response.data;
  },

  getCompartidos: async (): Promise<Deposito[]> => {
    const response = await api.get('/api/depositos/compartidos');
    return response.data;
  },

  getDisponiblesPorSucursal: async (sucursalId: number): Promise<Deposito[]> => {
    const response = await api.get(`/api/depositos/disponibles/sucursal/${sucursalId}`);
    return response.data;
  },

  getPrincipal: async (): Promise<Deposito> => {
    const response = await api.get('/api/depositos/principal');
    return response.data;
  },

  // Operaciones CRUD
  create: async (deposito: DepositoCreateDTO): Promise<Deposito> => {
    const response = await api.post('/api/depositos', deposito);
    return response.data;
  },

  update: async (id: number, deposito: Partial<DepositoCreateDTO>): Promise<Deposito> => {
    const response = await api.put(`/api/depositos/${id}`, deposito);
    return response.data;
  },

  activar: async (id: number): Promise<Deposito> => {
    const response = await api.patch(`/api/depositos/${id}/activar`);
    return response.data;
  },

  desactivar: async (id: number): Promise<Deposito> => {
    const response = await api.patch(`/api/depositos/${id}/desactivar`);
    return response.data;
  },
};
