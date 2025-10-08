import api from '../config';
import type { Service, CreateServiceRequest, ServiceAppointment, CreateServiceAppointmentRequest } from '../../types';

export const serviceApi = {
  // Get all services
  getAll: async (): Promise<Service[]> => {
    const response = await api.get('/services');
    return response.data;
  },

  // Get service by ID
  getById: async (id: number): Promise<Service> => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  // Create new service
  create: async (service: CreateServiceRequest): Promise<Service> => {
    const response = await api.post('/services', service);
    return response.data;
  },

  // Update service
  update: async (id: number, service: Partial<CreateServiceRequest>): Promise<Service> => {
    const response = await api.put(`/services/${id}`, service);
    return response.data;
  },

  // Delete service
  delete: async (id: number): Promise<void> => {
    await api.delete(`/services/${id}`);
  },

  // Get active services
  getActive: async (): Promise<Service[]> => {
    const response = await api.get('/services/active');
    return response.data;
  }
};

export const serviceAppointmentApi = {
  // Get all appointments
  getAll: async (): Promise<ServiceAppointment[]> => {
    const response = await api.get('/service-appointments');
    return response.data;
  },

  // Get appointment by ID
  getById: async (id: number): Promise<ServiceAppointment> => {
    const response = await api.get(`/service-appointments/${id}`);
    return response.data;
  },

  // Create new appointment
  create: async (appointment: CreateServiceAppointmentRequest): Promise<ServiceAppointment> => {
    const response = await api.post('/service-appointments', appointment);
    return response.data;
  },

  // Update appointment
  update: async (id: number, appointment: Partial<CreateServiceAppointmentRequest>): Promise<ServiceAppointment> => {
    const response = await api.put(`/service-appointments/${id}`, appointment);
    return response.data;
  },

  // Delete appointment
  delete: async (id: number): Promise<void> => {
    await api.delete(`/service-appointments/${id}`);
  },

  // Get appointments by client
  getByClient: async (clientId: number): Promise<ServiceAppointment[]> => {
    const response = await api.get(`/service-appointments/client/${clientId}`);
    return response.data;
  },

  // Get appointments by date
  getByDate: async (date: string): Promise<ServiceAppointment[]> => {
    const response = await api.get(`/service-appointments/date/${date}`);
    return response.data;
  }
};
