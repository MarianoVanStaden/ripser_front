import * as realClienteApi from './clienteApi';
import * as realContactoClienteApi from './contactoClienteApi';
import * as realCuentaCorrienteApi from './cuentaCorrienteApi';
import * as realSupplierApi from './supplierApi';
import { mockClienteApi, mockContactoClienteApi, mockCuentaCorrienteApi, mockSupplierApi, mockGarantias } from './mockData';
import { arrayToPage } from '../../types/pagination.types';

let backendAvailable: boolean | null = null;

// Test if backend is available
const testBackendConnection = async (): Promise<boolean> => {
  if (backendAvailable !== null) {
    return backendAvailable;
  }

  try {
    // Try a simple request to test connectivity
    await realClienteApi.clienteApi.getAll({ page: 0, size: 1 });
    backendAvailable = true;
    console.log('✅ Backend conectado - usando API real');
    return true;
  } catch (error) {
    backendAvailable = false;
    console.log('⚠️ Backend no disponible - usando datos mock para desarrollo');
    return false;
  }
};

// Wrapper for cliente API
export const clienteApiWithFallback = {
  getAll: async (pagination: PaginationParams = {}) => {
    const isBackendAvailable = await testBackendConnection();
    if (isBackendAvailable) {
      return realClienteApi.clienteApi.getAll(pagination);
    }
    return mockClienteApi.getAll(pagination);
  },

  getById: async (id: number) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realClienteApi.clienteApi.getById(id) 
      : mockClienteApi.getById(id);
  },

  create: async (cliente: any) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realClienteApi.clienteApi.create(cliente) 
      : mockClienteApi.create(cliente);
  },

  update: async (id: number, cliente: any) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realClienteApi.clienteApi.update(id, cliente) 
      : mockClienteApi.update(id, cliente);
  },

  delete: async (id: number) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realClienteApi.clienteApi.delete(id) 
      : mockClienteApi.delete(id);
  },

  search: async (query: string, pagination: PaginationParams = {}) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realClienteApi.clienteApi.search(query, pagination) 
      : mockClienteApi.search(query, pagination);
  }
};

// Wrapper for contacto cliente API
export const contactoClienteApiWithFallback = {
  getByClienteId: async (clienteId: number, pagination: PaginationParams = {}) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realContactoClienteApi.contactoClienteApi.getByClienteId(clienteId, pagination) 
      : mockContactoClienteApi.getByClienteId(clienteId, pagination);
  },

  create: async (contacto: any) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realContactoClienteApi.contactoClienteApi.create(contacto) 
      : mockContactoClienteApi.create(contacto);
  },

  update: async (id: number, contacto: any) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realContactoClienteApi.contactoClienteApi.update(id, contacto) 
      : mockContactoClienteApi.update(id, contacto);
  },

  delete: async (id: number) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realContactoClienteApi.contactoClienteApi.delete(id) 
      : mockContactoClienteApi.delete(id);
  }
};

// Wrapper for cuenta corriente API
export const cuentaCorrienteApiWithFallback = {
  getByClienteId: async (clienteId: number, pagination: PaginationParams = {}) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable
      ? realCuentaCorrienteApi.cuentaCorrienteApi.getByClienteId(clienteId)
      : mockCuentaCorrienteApi.getByClienteId(clienteId, pagination);
  },

  create: async (movimiento: any) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realCuentaCorrienteApi.cuentaCorrienteApi.create(movimiento) 
      : mockCuentaCorrienteApi.create(movimiento);
  }
};

// Wrapper for supplier API
export const supplierApiWithFallback = {
  getAll: async (pagination: PaginationParams = {}) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realSupplierApi.supplierApi.getAll(pagination) 
      : mockSupplierApi.getAll(pagination);
  },

  getById: async (id: number) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realSupplierApi.supplierApi.getById(id) 
      : mockSupplierApi.getById(id);
  },

  create: async (supplier: any) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realSupplierApi.supplierApi.create(supplier) 
      : mockSupplierApi.create(supplier);
  },

  update: async (id: number, supplier: any) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realSupplierApi.supplierApi.update(id, supplier) 
      : mockSupplierApi.update(id, supplier);
  },

  delete: async (id: number) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realSupplierApi.supplierApi.delete(id) 
      : mockSupplierApi.delete(id);
  }
};

// Wrapper for garantia API
export const garantiaApiWithFallback = {
  getAll: async (pagination: PaginationParams = {}) => {
    // TODO: Replace with real API check when backend is ready
    return arrayToPage(mockGarantias, pagination.page || 0, pagination.size || 20);
  },
  getById: async (id: number) => {
    return mockGarantias.find(g => g.id === id) || null;
  },
  create: async (garantia: any) => {
    // Simulate creation
    const newGarantia = { ...garantia, id: Date.now() };
    mockGarantias.push(newGarantia);
    return newGarantia;
  },
  update: async (id: number, garantia: any) => {
    const idx = mockGarantias.findIndex(g => g.id === id);
    if (idx !== -1) {
      mockGarantias[idx] = { ...mockGarantias[idx], ...garantia };
      return mockGarantias[idx];
    }
    return null;
  },
  delete: async (id: number) => {
    const idx = mockGarantias.findIndex(g => g.id === id);
    if (idx !== -1) mockGarantias.splice(idx, 1);
  },
};

// Reset backend availability check (useful for testing)
export const resetBackendCheck = () => {
  backendAvailable = null;
};
