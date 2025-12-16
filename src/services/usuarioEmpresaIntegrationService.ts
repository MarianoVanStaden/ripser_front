import usuarioAdminApi from '../api/services/usuarioAdminApi';
import { usuarioEmpresaService } from './usuarioEmpresaService';
import { mapRolEmpresaToSystemRole } from '../utils/roleMapper';
import type { CreateUsuarioWithEmpresaDTO, UsuarioWithEmpresa } from '../types/usuario-enhanced.types';
import type { UsuarioDTO } from '../api/services/usuarioAdminApi';
import type { UsuarioEmpresa } from '../types/tenant.types';

export interface CreateUsuarioResult {
  usuario: UsuarioDTO;
  usuarioEmpresa: UsuarioEmpresa;
  success: boolean;
  error?: string;
}

export const usuarioEmpresaIntegrationService = {
  /**
   * Create user with empresa assignment in a single operation
   * Handles rollback if empresa assignment fails
   *
   * @param data - User and empresa assignment data
   * @returns Result object with success status and created entities
   */
  createUsuarioWithEmpresa: async (
    data: CreateUsuarioWithEmpresaDTO
  ): Promise<CreateUsuarioResult> => {
    let createdUsuario: UsuarioDTO | null = null;

    try {
      // Step 1: Create global user
      const systemRole = mapRolEmpresaToSystemRole(data.rolEmpresa);
      console.log(`Creating user with system role: ${systemRole} for empresa role: ${data.rolEmpresa}`);

      createdUsuario = await usuarioAdminApi.create({
        username: data.username,
        password: data.password,
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        roles: [systemRole]
      });

      console.log(`User created successfully with ID: ${createdUsuario.id}`);

      // Step 2: Assign to empresa
      const usuarioEmpresa = await usuarioEmpresaService.assign({
        usuarioId: createdUsuario.id,
        empresaId: data.empresaId,
        sucursalId: data.sucursalId,
        rol: data.rolEmpresa,
        observaciones: data.observaciones
      });

      console.log(`User assigned to empresa successfully with assignment ID: ${usuarioEmpresa.id}`);

      // Step 3: Set default sucursal if specified and different from assigned sucursal
      if (data.sucursalDefectoId && data.sucursalDefectoId !== data.sucursalId) {
        await usuarioEmpresaService.update(usuarioEmpresa.id, {
          sucursalDefectoId: data.sucursalDefectoId
        });
        console.log(`Default sucursal set to: ${data.sucursalDefectoId}`);
      }

      return {
        usuario: createdUsuario,
        usuarioEmpresa,
        success: true
      };
    } catch (error: any) {
      console.error('Error in createUsuarioWithEmpresa:', error);

      // Rollback: Delete created user if empresa assignment failed
      if (createdUsuario) {
        try {
          await usuarioAdminApi.delete(createdUsuario.id);
          console.warn(`Rolled back user creation (ID: ${createdUsuario.id}) after empresa assignment failure`);
        } catch (rollbackError) {
          console.error('Failed to rollback user creation:', rollbackError);
        }
      }

      return {
        usuario: createdUsuario!,
        usuarioEmpresa: null as any,
        success: false,
        error: error.response?.data?.message || error.message || 'Error creating user with empresa'
      };
    }
  },

  /**
   * Get all users with their empresa assignments
   * Filters by empresaId for non-super-admin users
   *
   * @param empresaId - Optional empresa ID to filter by (for ADMIN_EMPRESA)
   * @param page - Page number (0-indexed)
   * @param size - Page size
   * @returns Paginated response with users and their empresa assignments
   */
  getUsuariosWithEmpresas: async (
    empresaId?: number,
    page = 0,
    size = 100
  ): Promise<{
    content: UsuarioWithEmpresa[];
    totalElements: number;
    totalPages: number;
  }> => {
    try {
      // Get all users
      const response = await usuarioAdminApi.getAll(page, size);

      // For each user, get their empresa assignments
      const usuariosWithEmpresas = await Promise.all(
        response.content.map(async (usuario) => {
          try {
            const empresas = await usuarioEmpresaService.getByUsuario(usuario.id);
            // Filter by empresaId if provided (for ADMIN_EMPRESA)
            const filteredEmpresas = empresaId
              ? empresas.filter(ue => ue.empresaId === empresaId && ue.esActivo)
              : empresas.filter(ue => ue.esActivo);

            return {
              ...usuario,
              usuarioEmpresas: filteredEmpresas
            } as UsuarioWithEmpresa;
          } catch (err) {
            console.error(`Error loading empresas for user ${usuario.id}:`, err);
            return {
              ...usuario,
              usuarioEmpresas: []
            } as UsuarioWithEmpresa;
          }
        })
      );

      // Filter out users with no empresa assignments if filtering by empresaId
      const filtered = empresaId
        ? usuariosWithEmpresas.filter(u => u.usuarioEmpresas.length > 0)
        : usuariosWithEmpresas;

      return {
        content: filtered,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size)
      };
    } catch (error: any) {
      console.error('Error in getUsuariosWithEmpresas:', error);
      throw error;
    }
  }
};
