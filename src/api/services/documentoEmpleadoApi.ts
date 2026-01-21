import api from '../config';
import type { DocumentoEmpleado, UploadResponse } from '../../types';

export const documentoEmpleadoApi = {
  upload: async (
    empleadoId: number,
    file: File,
    categoria: string,
    descripcion?: string
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoria', categoria);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    const response = await api.post(`/api/empleados/${empleadoId}/documentos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getByEmpleadoId: async (empleadoId: number): Promise<DocumentoEmpleado[]> => {
    const response = await api.get(`/api/empleados/${empleadoId}/documentos`);
    return response.data;
  },

  getByEmpleadoIdAndCategoria: async (
    empleadoId: number,
    categoria: string
  ): Promise<DocumentoEmpleado[]> => {
    const response = await api.get(`/api/empleados/${empleadoId}/documentos`, {
      params: { categoria },
    });
    return response.data;
  },

  getById: async (empleadoId: number, id: number): Promise<DocumentoEmpleado> => {
    const response = await api.get(`/api/empleados/${empleadoId}/documentos/${id}`);
    return response.data;
  },

  download: async (empleadoId: number, id: number): Promise<Blob> => {
    const response = await api.get(`/api/empleados/${empleadoId}/documentos/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (empleadoId: number, id: number): Promise<void> => {
    await api.delete(`/api/empleados/${empleadoId}/documentos/${id}`);
  },

  getCategorias: async (empleadoId: number): Promise<{ value: string; label: string }[]> => {
    const response = await api.get(`/api/empleados/${empleadoId}/documentos/categorias`);
    return response.data;
  },

  downloadAndSave: async (empleadoId: number, id: number, fileName: string): Promise<void> => {
    const blob = await documentoEmpleadoApi.download(empleadoId, id);
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
