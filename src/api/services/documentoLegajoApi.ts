import api from '../config';
import type { DocumentoLegajo, UploadResponse } from '../../types';

export const documentoLegajoApi = {
  upload: async (
    legajoId: number,
    file: File,
    categoria: string,
    descripcion?: string
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('legajoId', legajoId.toString());
    formData.append('file', file);
    formData.append('categoria', categoria);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    const response = await api.post('/api/documentos-legajo/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getByLegajoId: async (legajoId: number): Promise<DocumentoLegajo[]> => {
    const response = await api.get(`/api/documentos-legajo/legajo/${legajoId}`);
    return response.data;
  },

  getById: async (id: number): Promise<DocumentoLegajo> => {
    const response = await api.get(`/api/documentos-legajo/${id}`);
    return response.data;
  },

  download: async (id: number): Promise<Blob> => {
    const response = await api.get(`/api/documentos-legajo/download/${id}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/documentos-legajo/${id}`);
  },

  downloadAndSave: async (id: number, fileName: string): Promise<void> => {
    const blob = await documentoLegajoApi.download(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
