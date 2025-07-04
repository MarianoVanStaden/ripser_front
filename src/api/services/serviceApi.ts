import api from '../config';
import type { Service, CreateServiceRequest, ServiceAppointment, CreateServiceAppointmentRequest } from '../../types';

export const serviceApi = {
  // Get all services
  getAll: async (): Promise<Service[]> => {
    const response = await api.get('/api/services');
    return response.data;
  },

  // Get service by ID
  getById: async (id: number): Promise<Service> => {
    const response = await api.get(`/api/services/${id}`);
    return response.data;
  },

  // Create new service
  create: async (service: CreateServiceRequest): Promise<Service> => {
    const response = await api.post('/api/services', service);
    return response.data;
  },

  // Update service
  update: async (id: number, service: Partial<CreateServiceRequest>): Promise<Service> => {
    const response = await api.put(`/api/services/${id}`, service);
    return response.data;
  },

  // Delete service
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/services/${id}`);
  },

  // Get active services
  getActive: async (): Promise<Service[]> => {
    const response = await api.get('/api/services/active');
    return response.data;
  }
};

export const serviceAppointmentApi = {
  // Get all appointments
  getAll: async (): Promise<ServiceAppointment[]> => {
    const response = await api.get('/api/service-appointments');
    return response.data;
  },

  // Get appointment by ID
  getById: async (id: number): Promise<ServiceAppointment> => {
    const response = await api.get(`/api/service-appointments/${id}`);
    return response.data;
  },

  // Create new appointment
  create: async (appointment: CreateServiceAppointmentRequest): Promise<ServiceAppointment> => {
    const response = await api.post('/api/service-appointments', appointment);
    return response.data;
  },

  // Update appointment
  update: async (id: number, appointment: Partial<CreateServiceAppointmentRequest>): Promise<ServiceAppointment> => {
    const response = await api.put(`/api/service-appointments/${id}`, appointment);
    return response.data;
  },

  // Delete appointment
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/service-appointments/${id}`);
  },

  // Get appointments by client
  getByClient: async (clientId: number): Promise<ServiceAppointment[]> => {
    const response = await api.get(`/api/service-appointments/client/${clientId}`);
    return response.data;
  },

  // Get appointments by date
  getByDate: async (date: string): Promise<ServiceAppointment[]> => {
    const response = await api.get(`/api/service-appointments/date/${date}`);
    return response.data;
  }
};
