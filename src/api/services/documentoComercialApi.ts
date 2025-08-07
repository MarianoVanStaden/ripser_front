import api from '../config';
import type { DocumentoComercialDTO, CreateDocumentoComercialDTO, TipoDocumento } from '../../types';

export const documentoComercialApi = {
  getByTipo: async (tipoDocumento: TipoDocumento): Promise<DocumentoComercialDTO[]> => {
    const response = await api.get(`/api/documentos/tipo/${tipoDocumento}`);
    return response.data;
  },
  getByClienteId: async (clienteId: number): Promise<DocumentoComercialDTO[]> => {
    const response = await api.get(`/api/documentos/cliente/${clienteId}`);
    return response.data;
  },
  getById: async (id: number): Promise<DocumentoComercialDTO> => {
    const response = await api.get(`/api/documentos/${id}`);
    return response.data;
  },
  create: async (data: CreateDocumentoComercialDTO): Promise<DocumentoComercialDTO> => {
    // Only for PRESUPUESTO
    const response = await api.post(`/api/documentos/presupuesto`, data);
    return response.data;
  },
  updateEstado: async (id: number, estado: string): Promise<DocumentoComercialDTO> => {
    const response = await api.put(`/api/documentos/${id}/estado`, estado, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/documentos/${id}`);
  },
  convertToNotaPedido: async (dto: any): Promise<DocumentoComercialDTO> => {
    const response = await api.post(`/api/documentos/nota-pedido`, dto);
    return response.data;
  },
  convertToFactura: async (dto: any): Promise<DocumentoComercialDTO> => {
    const response = await api.post(`/api/documentos/factura`, dto);
    return response.data;
  }
};