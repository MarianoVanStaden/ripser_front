import api from '../config';
import type { Empleado, EmpleadoCreateDTO, EmpleadoUpdateDTO, PageResponse, PaginationParams } from '../../types';

export const employeeApi = {
  // Get all employees (paginated)
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<Empleado>> => {
    const response = await api.get<PageResponse<Empleado>>('/api/empleados', {
      params: { ...pagination },
    });
    return response.data;
  },

  // Get all employees (non-paginated) - for compatibility
  getAllList: async (): Promise<Empleado[]> => {
    const response = await api.get('/api/empleados', {
      params: { page: 0, size: 10000 }
    });

    // Validate response is JSON and not HTML
    if (typeof response.data === 'string') {
      throw new Error('API returned HTML instead of JSON. Check if the backend endpoint exists.');
    }

    // Return content array from paginated response, or the response itself if it's already an array
    if (response.data.content && Array.isArray(response.data.content)) {
      return response.data.content;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    throw new Error('Unexpected response format from empleados API');
  },

  // Get employee by ID
  getById: async (id: number): Promise<Empleado> => {
    const response = await api.get(`/api/empleados/${id}`);
    return response.data;
  },

  // Create new employee
  create: async (employee: EmpleadoCreateDTO): Promise<Empleado> => {
    const response = await api.post('/api/empleados', employee);
    return response.data;
  },

  // Update employee
  update: async (id: number, employee: EmpleadoUpdateDTO): Promise<Empleado> => {
    const response = await api.put(`/api/empleados/${id}`, employee);
    return response.data;
  },

  // Delete employee
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/empleados/${id}`);
  },

  // Get employee by DNI
  getByDni: async (dni: string): Promise<Empleado> => {
    const response = await api.get(`/api/empleados/dni/${dni}`);
    return response.data;
  },

  // Get employees by estado
  getByEstado: async (estado: string): Promise<Empleado[]> => {
    const response = await api.get(`/api/empleados/estado/${estado}`);
    return response.data;
  },

  // Change employee estado
  changeEstado: async (id: number, estado: string): Promise<Empleado> => {
    const response = await api.patch(`/api/empleados/${id}/estado`, null, {
      params: { estado }
    });
    return response.data;
  },

  // Link a user account to an employee
  vincularUsuario: async (empleadoId: number, usuarioId: number): Promise<void> => {
    await api.patch(`/api/empleados/${empleadoId}/vincular-usuario`, null, {
      params: { usuarioId }
    });
  },

  // Unlink the user account from an employee
  desvincularUsuario: async (empleadoId: number): Promise<void> => {
    await api.delete(`/api/empleados/${empleadoId}/vincular-usuario`);
  }
};
