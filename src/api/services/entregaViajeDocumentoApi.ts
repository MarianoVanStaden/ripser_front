import api from '../config';

export interface DocumentoEntrega {
  id: number;
  entregaId?: number;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  descripcion?: string;
  fechaCreacion?: string;
  urlDescarga?: string;
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

    // Forzar multipart/form-data (axios reemplaza el valor con el boundary correcto).
    // Sin esto, gana el default 'application/json' del axios instance y el server tira 403.
    // Timeout extendido: fotos de cámara (2-5 MB) sobre 4G pueden tardar bastante.
    const response = await api.post<DocumentoEntrega>(BASE_PATH(entregaId), formData, {
      timeout: 120000,
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
