import api from '../config';

interface Proveedor {
  id: number;
  nombre: string;
  razonSocial?: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  estado?: string;
  saldoActual?: number;
}

export const proveedorApi = {
  // Get all proveedores
  getAll: async (): Promise<Proveedor[]> => {
    const response = await api.get('/api/proveedores');
    return response.data;
  },

  // Get proveedor by ID
  getById: async (id: number): Promise<Proveedor> => {
    const response = await api.get(`/api/proveedores/${id}`);
    return response.data;
  },

  // Create proveedor
  create: async (proveedor: Partial<Proveedor>): Promise<Proveedor> => {
    const response = await api.post('/api/proveedores', proveedor);
    return response.data;
  },

  // Update proveedor
  update: async (id: number, proveedor: Partial<Proveedor>): Promise<Proveedor> => {
    const response = await api.put(`/api/proveedores/${id}`, proveedor);
    return response.data;
  },

  // Delete proveedor
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/proveedores/${id}`);
  },
};
