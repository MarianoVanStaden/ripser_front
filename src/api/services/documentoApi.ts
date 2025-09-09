import api from '../config';
import type { DocumentoComercial, EstadoDocumento, DetalleDocumento, CreatePresupuestoRequest } from '../../types';

export const documentoApi = {
  // Get all documentos
  getAll: async (): Promise<DocumentoComercial[]> => {
    const response = await api.get('/api/documentos-comerciales');
    return response.data;
  },
  // Get documento by ID
  getById: async (id: number): Promise<DocumentoComercial> => {
    const response = await api.get(`/api/documentos-comerciales/${id}`);
    return response.data;
  },
  // Create new documento
  create: async (documentoData: Partial<DocumentoComercial> & { detalles: DetalleDocumento[] }): Promise<DocumentoComercial> => {
    const response = await api.post('/api/documentos-comerciales', documentoData);
    return response.data;
  },
  // Update documento
  update: async (id: number, documentoData: Partial<DocumentoComercial> & { detalles?: DetalleDocumento[] }): Promise<DocumentoComercial> => {
    const response = await api.put(`/api/documentos-comerciales/${id}`, documentoData);
    return response.data;
  },
  // Delete documento
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/documentos-comerciales/${id}`);
  },
  // Change estado of documento
  changeEstado: async (id: number, nuevoEstado: EstadoDocumento): Promise<DocumentoComercial> => {
    const response = await api.patch(`/api/documentos-comerciales/${id}/estado`, { estado: nuevoEstado });
    return response.data;
  },
  // Search documentos by numeroDocumento
  searchByNumero: async (term: string): Promise<DocumentoComercial[]> => {
    const response = await api.get(`/api/documentos-comerciales/buscar`, { params: { numero: term } });
    return response.data;
  },
  // Get documentos by estado
  getByEstado: async (estado: EstadoDocumento): Promise<DocumentoComercial[]> => {
    const response = await api.get(`/api/documentos-comerciales/estado/${estado}`);
    return response.data;
  },
  // Get documentos within a date range
  getByFecha: async (fechaInicio: string, fechaFin: string): Promise<DocumentoComercial[]> => {
    const response = await api.get(`/api/documentos-comerciales/fecha`, { params: { fechaInicio, fechaFin } });
    return response.data;
  },
  // Get documentos by tipo
  getByTipo: async (tipo: string): Promise<DocumentoComercial[]> => {
    try {
      const response = await api.get(`/api/documentos/tipo/${tipo}`);
      console.log(`Fetched documentos by tipo ${tipo}:`, response.data);
      return response.data; // Backend returns List<DocumentoComercialDTO>
    } catch (err) {
      console.error(`Error fetching documentos by tipo ${tipo}:`, err);
      throw err;
    }
  },
  // Create new presupuesto
  createPresupuesto: async (presupuesto: CreatePresupuestoRequest): Promise<DocumentoComercial> => {
    const response = await api.post('/api/documentos/presupuesto', presupuesto);
    return response.data;
  },
  // Update estado of presupuesto
  updateEstado: async (id: number, estado: EstadoDocumento): Promise<DocumentoComercial> => {
    const response = await api.patch(`/api/documentos/${id}/estado`, { estado });
    return response.data;
  },
};