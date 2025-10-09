import api from '../config';
import type { Empleado, EmpleadoCreateDTO, EmpleadoUpdateDTO } from '../../types';

export const employeeApi = {
  // Get all employees (paginated)
  getAll: async (page: number = 0, size: number = 100): Promise<any> => {
    const response = await api.get('/empleados', {
      params: { page, size }
    });
    return response.data;
  },

  // Get all employees (non-paginated) - for compatibility
  getAllList: async (): Promise<Empleado[]> => {
    const response = await api.get('/empleados', {
      params: { page: 0, size: 10000 }
    });
    return response.data.content || response.data;
  },

  // Get employee by ID
  getById: async (id: number): Promise<Empleado> => {
    const response = await api.get(`/empleados/${id}`);
    return response.data;
  },

  // Create new employee
  create: async (employee: EmpleadoCreateDTO): Promise<Empleado> => {
    const response = await api.post('/empleados', employee);
    return response.data;
  },

  // Update employee
  update: async (id: number, employee: EmpleadoUpdateDTO): Promise<Empleado> => {
    const response = await api.put(`/empleados/${id}`, employee);
    return response.data;
  },

  // Delete employee
  delete: async (id: number): Promise<void> => {
    await api.delete(`/empleados/${id}`);
  },

  // Get employee by DNI
  getByDni: async (dni: string): Promise<Empleado> => {
    const response = await api.get(`/empleados/dni/${dni}`);
    return response.data;
  },

  // Get employees by estado
  getByEstado: async (estado: string): Promise<Empleado[]> => {
    const response = await api.get(`/empleados/estado/${estado}`);
    return response.data;
  },

  // Change employee estado
  changeEstado: async (id: number, estado: string): Promise<Empleado> => {
    const response = await api.patch(`/empleados/${id}/estado`, null, {
      params: { estado }
    });
    return response.data;
  }
};
