import api from '../config';

export interface DocumentoEntrega {
  id: number;
  entregaId: number;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  descripcion?: string;
  fechaCreacion?: string;
  url?: string;
}

const BASE_PATH = (entregaId: number) => `/api/entregas-viaje/${entregaId}/documentos`;

export const entregaViajeDocumentoApi = {
  upload: async (
    entregaId: number,
    file: File,
    descripcion?: string
  ): Promise<DocumentoEntrega> => {
    const formData = new FormData();
    formData.append('file', file);
    if (descripcion) formData.append('descripcion', descripcion);

    const response = await api.post<DocumentoEntrega>(BASE_PATH(entregaId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getByEntrega: async (entregaId: number): Promise<DocumentoEntrega[]> => {
    const response = await api.get<DocumentoEntrega[]>(BASE_PATH(entregaId));
    return response.data;
  },

  download: async (entregaId: number, documentoId: number): Promise<Blob> => {
    const response = await api.get(`${BASE_PATH(entregaId)}/${documentoId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (entregaId: number, documentoId: number): Promise<void> => {
    await api.delete(`${BASE_PATH(entregaId)}/${documentoId}`);
  },
};
