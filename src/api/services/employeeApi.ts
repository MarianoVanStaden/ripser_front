import api from '../config';
import type { Employee, CreateEmployeeRequest } from '../../types';

export const employeeApi = {
  // Get all employees
  getAll: async (): Promise<Employee[]> => {
    const response = await api.get('/api/empleados');
    return response.data;
  },

  // Get employee by ID
  getById: async (id: number): Promise<Employee> => {
    const response = await api.get(`/api/empleados/${id}`);
    return response.data;
  },

  // Create new employee
  create: async (employee: CreateEmployeeRequest): Promise<Employee> => {
    const response = await api.post('/api/empleados', employee);
    return response.data;
  },

  // Update employee
  update: async (id: number, employee: Partial<CreateEmployeeRequest>): Promise<Employee> => {
    const response = await api.put(`/api/empleados/${id}`, employee);
    return response.data;
  },

  // Delete employee
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/empleados/${id}`);
  },

  // Get employee by DNI
  getByDni: async (dni: string): Promise<Employee> => {
    const response = await api.get(`/api/empleados/dni/${dni}`);
    return response.data;
  },

  // Get employees by estado
  getByEstado: async (estado: string): Promise<Employee[]> => {
    const response = await api.get(`/api/empleados/estado/${estado}`);
    return response.data;
  },

  // Get employees by puesto
  getByPuesto: async (puestoId: number): Promise<Employee[]> => {
    const response = await api.get(`/api/empleados/puesto/${puestoId}`);
    return response.data;
  },

  // Search employees by name or surname
  search: async (termino: string): Promise<Employee[]> => {
    const response = await api.get(`/api/empleados/buscar?termino=${encodeURIComponent(termino)}`);
    return response.data;
  },

  // Get employees by fecha ingreso
  getByFechaIngreso: async (fechaInicio: string, fechaFin: string): Promise<Employee[]> => {
    const response = await api.get(`/api/empleados/fecha-ingreso?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`);
    return response.data;
  },

  // Get active employees
  getActive: async (): Promise<Employee[]> => {
    const response = await api.get('/api/empleados/active');
    return response.data;
  }
};
