import api from '../api';
import type {
  UsuarioEmpresa,
  AsignarUsuarioDTO,
  UpdateUsuarioEmpresaDTO,
  CambiarRolDTO
} from '../types';

export const usuarioEmpresaService = {
  /**
   * Get all empresas assigned to a user
   */
  getByUsuario: async (usuarioId: number): Promise<UsuarioEmpresa[]> => {
    const response = await api.get<UsuarioEmpresa[]>(`/api/usuario-empresa/usuario/${usuarioId}`);
    return response.data;
  },

  /**
   * Get all users assigned to an empresa
   */
  getByEmpresa: async (empresaId: number): Promise<UsuarioEmpresa[]> => {
    const response = await api.get<UsuarioEmpresa[]>(`/api/usuario-empresa/empresa/${empresaId}`);
    return response.data;
  },

  /**
   * Get usuario-empresa by ID
   */
  getById: async (id: number): Promise<UsuarioEmpresa> => {
    const response = await api.get<UsuarioEmpresa>(`/api/usuario-empresa/${id}`);
    return response.data;
  },

  /**
   * Assign user to empresa/sucursal
   */
  assign: async (data: AsignarUsuarioDTO): Promise<UsuarioEmpresa> => {
    const response = await api.post<UsuarioEmpresa>('/api/usuario-empresa', data);
    return response.data;
  },

  /**
   * Update usuario-empresa assignment
   */
  update: async (id: number, data: UpdateUsuarioEmpresaDTO): Promise<UsuarioEmpresa> => {
    const response = await api.put<UsuarioEmpresa>(`/api/usuario-empresa/${id}`, data);
    return response.data;
  },

  /**
   * Deactivate usuario-empresa assignment
   */
  deactivate: async (id: number): Promise<UsuarioEmpresa> => {
    const response = await api.post<UsuarioEmpresa>(`/api/usuario-empresa/${id}/desactivar`, {});
    return response.data;
  },

  /**
   * Reactivate usuario-empresa assignment
   */
  reactivate: async (id: number): Promise<UsuarioEmpresa> => {
    const response = await api.post<UsuarioEmpresa>(`/api/usuario-empresa/${id}/reactivar`, {});
    return response.data;
  },

  /**
   * Change user role in empresa
   */
  changeRole: async (id: number, data: CambiarRolDTO): Promise<UsuarioEmpresa> => {
    const response = await api.post<UsuarioEmpresa>(`/api/usuario-empresa/${id}/cambiar-rol`, data);
    return response.data;
  },

  /**
   * Delete usuario-empresa assignment
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/usuario-empresa/${id}`);
  }
};
