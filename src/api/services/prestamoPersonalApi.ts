import api from '../config';
import type {
  PrestamoPersonalDTO,
  CreatePrestamoPersonalDTO,
  CuotaPrestamoDTO,
  ResumenPrestamosDTO,
  EstadoPrestamo,
  CategoriaPrestamo,
  UpdateFechaEntregaDTO,
  UpdateFechaVencimientoCuotaDTO,
} from '../../types/prestamo.types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

const BASE_PATH = '/api/prestamos-personales';

export const prestamoPersonalApi = {
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<PrestamoPersonalDTO>> => {
    const response = await api.get<PageResponse<PrestamoPersonalDTO>>(BASE_PATH, {
      params: { ...pagination },
    });
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

  /**
   * Edita manualmente la fecha de entrega. Si dto.aplicarDesplazamientoCuotas es true,
   * desplaza las cuotas PENDIENTE el mismo Δdías. Devuelve 409 si la version no coincide.
   */
  actualizarFechaEntrega: async (
    id: number,
    dto: UpdateFechaEntregaDTO,
  ): Promise<PrestamoPersonalDTO> => {
    const response = await api.patch<PrestamoPersonalDTO>(
      `${BASE_PATH}/${id}/fecha-entrega`,
      dto,
    );
    return response.data;
  },

  /**
   * Edita la fechaVencimiento de una cuota individual.
   * Si dto.propagarSiguientes es true, aplica el mismo Δdías a las cuotas siguientes pendientes.
   * Devuelve 409 si la prestamoVersion no coincide.
   */
  actualizarFechaVencimientoCuota: async (
    prestamoId: number,
    cuotaId: number,
    dto: UpdateFechaVencimientoCuotaDTO,
  ): Promise<CuotaPrestamoDTO> => {
    const response = await api.patch<CuotaPrestamoDTO>(
      `${BASE_PATH}/${prestamoId}/cuotas/${cuotaId}/fecha-vencimiento`,
      dto,
    );
    return response.data;
  },
};
