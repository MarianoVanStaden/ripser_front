import api from '../config';
import type { PageResponse } from '../../types/pagination.types';

export type TipoRol = 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE_SUCURSAL' | 'VENDEDOR' | 'TALLER' | 'OFICINA' | 'USER' | 'USUARIO' | 'COBRANZAS' | 'TRANSPORTE' | 'RECURSOS_HUMANOS';

export interface UsuarioDTO {
  id: number;
  username: string;
  email: string;
  nombre?: string;
  apellido?: string;
  roles: TipoRol[];
  enabled: boolean;
  accountNonLocked: boolean;
  empleadoId: number | null;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioCreateDTO {
  username: string;
  password: string;
  email: string;
  nombre?: string;
  apellido?: string;
  roles: string[]; // Send as strings, backend converts to TipoRol
}

export interface UsuarioUpdateDTO {
  email?: string;
  nombre?: string;
  apellido?: string;
  enabled?: boolean;
  accountNonLocked?: boolean;
  roles?: string[];
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

/**
 * API service for user management (Admin only)
 */
class UsuarioAdminApi {
  private readonly BASE_URL = '/api/admin/usuarios';

  /**
   * Get all users (paginated)
   */
  async getAll(page = 0, size = 20): Promise<PageResponse<UsuarioDTO>> {
    const response = await api.get<PageResponse<UsuarioDTO>>(this.BASE_URL, {
      params: { page, size, sort: 'createdAt,desc' }
    });
    return response.data;
  }

  /**
   * Get user by ID
   */
  async getById(id: number): Promise<UsuarioDTO> {
    const response = await api.get<UsuarioDTO>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Create new user
   */
  async create(dto: UsuarioCreateDTO): Promise<UsuarioDTO> {
    const response = await api.post<UsuarioDTO>(this.BASE_URL, dto);
    return response.data;
  }

  /**
   * Update user
   */
  async update(id: number, dto: UsuarioUpdateDTO): Promise<UsuarioDTO> {
    const response = await api.put<UsuarioDTO>(`${this.BASE_URL}/${id}`, dto);
    return response.data;
  }

  /**
   * Change user password
   */
  async changePassword(id: number, dto: ChangePasswordDTO): Promise<void> {
    await api.patch(`${this.BASE_URL}/${id}/change-password`, dto);
  }

  /**
   * Delete user
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }

  /**
   * Get current authenticated user
   */
  async me(): Promise<UsuarioDTO> {
    const response = await api.get<UsuarioDTO>(`${this.BASE_URL}/me`);
    return response.data;
  }

  /**
   * Get user by empleado ID
   */
  async getByEmpleado(empleadoId: number): Promise<UsuarioDTO> {
    const response = await api.get<UsuarioDTO>(`${this.BASE_URL}/by-empleado/${empleadoId}`);
    return response.data;
  }

  /**
   * Link an empleado to a user
   */
  async vincularEmpleado(usuarioId: number, empleadoId: number): Promise<UsuarioDTO> {
    const response = await api.patch<UsuarioDTO>(`${this.BASE_URL}/${usuarioId}/vincular-empleado`, null, {
      params: { empleadoId }
    });
    return response.data;
  }

  /**
   * Unlink the empleado from a user
   */
  async desvincularEmpleado(usuarioId: number): Promise<UsuarioDTO> {
    const response = await api.delete<UsuarioDTO>(`${this.BASE_URL}/${usuarioId}/vincular-empleado`);
    return response.data;
  }
}

export default new UsuarioAdminApi();
