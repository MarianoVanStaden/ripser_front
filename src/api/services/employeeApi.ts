import api from '../config';
import type { Employee, CreateEmployeeRequest } from '../../types';

export const employeeApi = {
  // Get all employees
  getAll: async (): Promise<Employee[]> => {
    const response = await api.get('/api/employees');
    return response.data;
  },

  // Get employee by ID
  getById: async (id: number): Promise<Employee> => {
    const response = await api.get(`/api/employees/${id}`);
    return response.data;
  },

  // Create new employee
  create: async (employee: CreateEmployeeRequest): Promise<Employee> => {
    const response = await api.post('/api/employees', employee);
    return response.data;
  },

  // Update employee
  update: async (id: number, employee: Partial<CreateEmployeeRequest>): Promise<Employee> => {
    const response = await api.put(`/api/employees/${id}`, employee);
    return response.data;
  },

  // Delete employee
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/employees/${id}`);
  },

  // Get active employees
  getActive: async (): Promise<Employee[]> => {
    const response = await api.get('/api/employees/active');
    return response.data;
  }
};
