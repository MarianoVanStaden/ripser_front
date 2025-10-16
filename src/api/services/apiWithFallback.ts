import * as realClienteApi from './clienteApi';
import * as realContactoClienteApi from './contactoClienteApi';
import * as realCuentaCorrienteApi from './cuentaCorrienteApi';
import * as realSupplierApi from './supplierApi';
import { garantiaApi } from './garantiaApi';
import { mockClienteApi, mockContactoClienteApi, mockCuentaCorrienteApi, mockSupplierApi, mockGarantias, mockReclamosGarantia } from './mockData';

let backendAvailable: boolean | null = null;

// Test if backend is available
const testBackendConnection = async (): Promise<boolean> => {
  if (backendAvailable !== null) {
    return backendAvailable;
  }

  try {
    // Try a simple request to test connectivity
    await realClienteApi.clienteApi.getAll();
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
  getAll: async () => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realClienteApi.clienteApi.getAll() 
      : mockClienteApi.getAll();
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

  search: async (query: string) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realClienteApi.clienteApi.search(query) 
      : mockClienteApi.search(query);
  }
};

// Wrapper for contacto cliente API
export const contactoClienteApiWithFallback = {
  getByClienteId: async (clienteId: number) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realContactoClienteApi.contactoClienteApi.getByClienteId(clienteId) 
      : mockContactoClienteApi.getByClienteId(clienteId);
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
  }
};

// Wrapper for cuenta corriente API
export const cuentaCorrienteApiWithFallback = {
  getByClienteId: async (clienteId: number) => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realCuentaCorrienteApi.cuentaCorrienteApi.getByClienteId(clienteId) 
      : mockCuentaCorrienteApi.getByClienteId(clienteId);
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
  getAll: async () => {
    const isBackendAvailable = await testBackendConnection();
    return isBackendAvailable 
      ? realSupplierApi.supplierApi.getAll() 
      : mockSupplierApi.getAll();
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

/**
 * Wrapper that uses mock fallback only for safe GET operations.
 * For create/update/delete we DO NOT fallback — we propagate the error so UI knows.
 */
export const garantiaApiWithFallback = {
  getAll: async (): Promise<any[]> => {
    try {
      return await garantiaApi.getAll();
    } catch (err) {
      console.warn('garantiaApi.getAll failed, using mock fallback', err);
      return mockGarantias;
    }
  },

  getById: async (id: number) => {
    try {
      return await garantiaApi.getById(id);
    } catch (err) {
      console.warn('garantiaApi.getById failed, no fallback for single-get', err);
      throw err;
    }
  },

  // NO FALLBACK for create/update/delete — propagate error
  create: async (payload: any) => {
    try {
      return await garantiaApi.create(payload);
    } catch (err) {
      console.error('garantiaApi.create failed — propagating error (no fallback)', err);
      throw err;
    }
  },

  update: async (id: number, payload: any) => {
    try {
      return await garantiaApi.update(id, payload);
    } catch (err) {
      console.error('garantiaApi.update failed — propagating error (no fallback)', err);
      throw err;
    }
  },

  delete: async (id: number) => {
    try {
      return await garantiaApi.delete(id);
    } catch (err) {
      console.error('garantiaApi.delete failed — propagating error (no fallback)', err);
      throw err;
    }
  }
};

// Reset backend availability check (useful for testing)
export const resetBackendCheck = () => {
  backendAvailable = null;
};
