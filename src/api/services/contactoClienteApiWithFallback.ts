import api from '../config';
import type { ContactoCliente, CreateContactoClienteRequest } from '../../types';
import { mockContactoClienteApi } from './mockApi';

// Flag to determine if we should use mock data
let useMockData = false;

// Test backend connectivity
const testBackendConnection = async (): Promise<boolean> => {
  try {
    await api.get('/health', { timeout: 3000 });
    return true;
  } catch (error) {
    console.warn('Backend no disponible, usando datos mock');
    return false;
  }
};

// Initialize backend connection test
let backendTestPromise: Promise<boolean> | null = null;

const shouldUseMock = async (): Promise<boolean> => {
  if (backendTestPromise === null) {
    backendTestPromise = testBackendConnection();
    useMockData = !(await backendTestPromise);
  }
  return useMockData;
};

const withFallback = async <T>(
  realApiCall: () => Promise<T>,
  mockApiCall: () => Promise<T>
): Promise<T> => {
  const shouldMock = await shouldUseMock();
  
  if (shouldMock) {
    return mockApiCall();
  }
  
  try {
    return await realApiCall();
  } catch (error) {
    console.warn('Error en API real, fallback a mock:', error);
    useMockData = true;
    return mockApiCall();
  }
};

export const contactoClienteApi = {
  // Get all contacts
  getAll: async (): Promise<ContactoCliente[]> => {
    return withFallback(
      async () => {
        const response = await api.get('/contactos-cliente');
        return response.data;
      },
      () => mockContactoClienteApi.getAll()
    );
  },

  // Get contact by ID
  getById: async (id: number): Promise<ContactoCliente> => {
    return withFallback(
      async () => {
        const response = await api.get(`/contactos-cliente/${id}`);
        return response.data;
      },
      () => mockContactoClienteApi.getById(id)
    );
  },

  // Get contacts by client ID
  getByClienteId: async (clienteId: number): Promise<ContactoCliente[]> => {
    return withFallback(
      async () => {
        const response = await api.get(`/contactos-cliente/cliente/${clienteId}`);
        return response.data;
      },
      () => mockContactoClienteApi.getByClienteId(clienteId)
    );
  },

  // Create new contact
  create: async (contacto: CreateContactoClienteRequest): Promise<ContactoCliente> => {
    return withFallback(
      async () => {
        const response = await api.post('/contactos-cliente', contacto);
        return response.data;
      },
      () => mockContactoClienteApi.create(contacto)
    );
  },

  // Update contact
  update: async (id: number, contacto: Partial<CreateContactoClienteRequest>): Promise<ContactoCliente> => {
    return withFallback(
      async () => {
        const response = await api.put(`/contactos-cliente/${id}`, contacto);
        return response.data;
      },
      () => mockContactoClienteApi.update(id, contacto)
    );
  },

  // Delete contact
  delete: async (id: number): Promise<void> => {
    return withFallback(
      async () => {
        await api.delete(`/contactos-cliente/${id}`);
      },
      () => mockContactoClienteApi.delete(id)
    );
  }
};
