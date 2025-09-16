import api from '../config';
import type { Cliente, CreateClienteRequest } from '../../types';
import { mockClienteApi } from './mockApi';

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

export const clienteApi = {
  // Get all clients
  getAll: async (): Promise<Cliente[]> => {
    return withFallback(
      async () => {
  const response = await api.get('/clientes'); // baseURL now ends with /api
        return response.data;
      },
      () => mockClienteApi.getAll()
    );
  },

  // Get client by ID
  getById: async (id: number): Promise<Cliente> => {
    return withFallback(
      async () => {
  const response = await api.get(`/clientes/${id}`);
        return response.data;
      },
      () => mockClienteApi.getById(id)
    );
  },

  // Create new client
  create: async (cliente: CreateClienteRequest): Promise<Cliente> => {
    return withFallback(
      async () => {
  const response = await api.post('/clientes', cliente);
        return response.data;
      },
      () => mockClienteApi.create(cliente)
    );
  },

  // Update client
  update: async (id: number, cliente: Partial<CreateClienteRequest>): Promise<Cliente> => {
    return withFallback(
      async () => {
  const response = await api.put(`/clientes/${id}`, cliente);
        return response.data;
      },
      () => mockClienteApi.update(id, cliente)
    );
  },

  // Delete client
  delete: async (id: number): Promise<void> => {
    return withFallback(
      async () => {
  await api.delete(`/clientes/${id}`);
      },
      () => mockClienteApi.delete(id)
    );
  },

  // Search clients
  search: async (query: string): Promise<Cliente[]> => {
    return withFallback(
      async () => {
  const response = await api.get(`/clientes/buscar?q=${encodeURIComponent(query)}`);
        return response.data;
      },
      () => mockClienteApi.search(query)
    );
  },

  // Get clients by state
  getByEstado: async (estado: string): Promise<Cliente[]> => {
    return withFallback(
      async () => {
  const response = await api.get(`/clientes/estado/${estado}`);
        return response.data;
      },
      () => mockClienteApi.getByEstado(estado)
    );
  },

  // Get clients by type
  getByTipo: async (tipo: string): Promise<Cliente[]> => {
    return withFallback(
      async () => {
  const response = await api.get(`/clientes/tipo/${tipo}`);
        return response.data;
      },
      () => mockClienteApi.getByTipo(tipo)
    );
  },

  // Update client credit limit
  updateCreditLimit: async (id: number, limite: number): Promise<Cliente> => {
    return withFallback(
      async () => {
  const response = await api.put(`/clientes/${id}/limite-credito`, { limiteCredito: limite });
        return response.data;
      },
      () => mockClienteApi.updateCreditLimit(id, limite)
    );
  },

  // Update client state
  updateEstado: async (id: number, estado: string): Promise<Cliente> => {
    return withFallback(
      async () => {
  const response = await api.put(`/clientes/${id}/estado`, { estado });
        return response.data;
      },
      () => mockClienteApi.updateEstado(id, estado)
    );
  }
};
