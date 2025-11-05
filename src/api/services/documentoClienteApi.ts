import api from '../config';
import type { DocumentoCliente, UploadResponse } from '../../types';

export const documentoClienteApi = {
  upload: async (
    clienteId: number,
    file: File,
    categoria: string,
    descripcion?: string
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('clienteId', clienteId.toString());
    formData.append('file', file);
    formData.append('categoria', categoria);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    const response = await api.post('/api/documentos-cliente/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getByClienteId: async (clienteId: number): Promise<DocumentoCliente[]> => {
    const response = await api.get(`/api/documentos-cliente/cliente/${clienteId}`);
    return response.data;
  },

  getById: async (id: number): Promise<DocumentoCliente> => {
    const response = await api.get(`/api/documentos-cliente/${id}`);
    return response.data;
  },

  download: async (id: number): Promise<Blob> => {
    const response = await api.get(`/api/documentos-cliente/download/${id}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/documentos-cliente/${id}`);
  },

  downloadAndSave: async (id: number, fileName: string): Promise<void> => {
    const blob = await documentoClienteApi.download(id);
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
