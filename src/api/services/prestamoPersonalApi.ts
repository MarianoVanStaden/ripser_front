import api from '../config';
import type {
  PrestamoPersonalDTO,
  CreatePrestamoPersonalDTO,
  ResumenPrestamosDTO,
  EstadoPrestamo,
  CategoriaPrestamo,
} from '../../types/prestamo.types';

const BASE_PATH = '/api/prestamos-personales';

export const prestamoPersonalApi = {
  getAll: async (): Promise<PrestamoPersonalDTO[]> => {
    const response = await api.get<PrestamoPersonalDTO[]>(BASE_PATH);
    return response.data;
  },

  getById: async (id: number): Promise<PrestamoPersonalDTO> => {
    const response = await api.get<PrestamoPersonalDTO>(`${BASE_PATH}/${id}`);
    return response.data;
  },

  create: async (data: CreatePrestamoPersonalDTO): Promise<PrestamoPersonalDTO> => {
    const response = await api.post<PrestamoPersonalDTO>(BASE_PATH, data);
    return response.data;
  },

  update: async (id: number, data: CreatePrestamoPersonalDTO): Promise<PrestamoPersonalDTO> => {
    const response = await api.put<PrestamoPersonalDTO>(`${BASE_PATH}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  getActivos: async (): Promise<PrestamoPersonalDTO[]> => {
    const response = await api.get<PrestamoPersonalDTO[]>(`${BASE_PATH}/activos`);
    return response.data;
  },

  getResumen: async (): Promise<ResumenPrestamosDTO> => {
    const response = await api.get<ResumenPrestamosDTO>(`${BASE_PATH}/resumen`);
    return response.data;
  },

  getByCliente: async (clienteId: number): Promise<PrestamoPersonalDTO[]> => {
    const response = await api.get<PrestamoPersonalDTO[]>(`${BASE_PATH}/cliente/${clienteId}`);
    return response.data;
  },

  getByCategoria: async (categoria: CategoriaPrestamo): Promise<PrestamoPersonalDTO[]> => {
    const response = await api.get<PrestamoPersonalDTO[]>(`${BASE_PATH}/categoria/${categoria}`);
    return response.data;
  },

  getByEstado: async (estado: EstadoPrestamo): Promise<PrestamoPersonalDTO[]> => {
    const response = await api.get<PrestamoPersonalDTO[]>(`${BASE_PATH}/estado/${estado}`);
    return response.data;
  },

  cambiarEstado: async (id: number, estado: EstadoPrestamo): Promise<PrestamoPersonalDTO> => {
    const response = await api.patch<PrestamoPersonalDTO>(`${BASE_PATH}/${id}/estado`, null, {
      params: { estado },
    });
    return response.data;
  },

  cambiarCategoria: async (id: number, categoria: CategoriaPrestamo): Promise<PrestamoPersonalDTO> => {
    const response = await api.patch<PrestamoPersonalDTO>(`${BASE_PATH}/${id}/categoria`, null, {
      params: { categoria },
    });
    return response.data;
  },
};
