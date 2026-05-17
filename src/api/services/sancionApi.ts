import api from '../config';
import type {
  SancionDTO,
  SancionCreateDTO,
  SancionEmpleadoResumenDTO,
  DisciplinaDashboardDTO,
} from '../../types/sancion.types';
import type { DocumentoEmpleado, UploadResponse } from '../../types';

export const sancionApi = {
  getAll: async (params?: { desde?: string; hasta?: string }): Promise<SancionDTO[]> => {
    const { data } = await api.get<SancionDTO[]>('/api/sanciones', { params });
    return data;
  },

  getById: async (id: number): Promise<SancionDTO> => {
    const { data } = await api.get<SancionDTO>(`/api/sanciones/${id}`);
    return data;
  },

  getByEmpleado: async (empleadoId: number): Promise<SancionDTO[]> => {
    const { data } = await api.get<SancionDTO[]>(`/api/sanciones/empleado/${empleadoId}`);
    return data;
  },

  getResumenEmpleado: async (empleadoId: number): Promise<SancionEmpleadoResumenDTO> => {
    const { data } = await api.get<SancionEmpleadoResumenDTO>(`/api/sanciones/empleado/${empleadoId}/resumen`);
    return data;
  },

  getDashboard: async (params?: { desde?: string; hasta?: string }): Promise<DisciplinaDashboardDTO> => {
    const { data } = await api.get<DisciplinaDashboardDTO>('/api/sanciones/dashboard', { params });
    return data;
  },

  create: async (dto: SancionCreateDTO): Promise<SancionDTO> => {
    const { data } = await api.post<SancionDTO>('/api/sanciones', dto);
    return data;
  },

  update: async (id: number, dto: SancionCreateDTO): Promise<SancionDTO> => {
    const { data } = await api.put<SancionDTO>(`/api/sanciones/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/sanciones/${id}`);
  },

  // Documentos
  uploadDocumento: async (
    sancionId: number,
    file: File,
    categoria: string,
    descripcion?: string,
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoria', categoria);
    if (descripcion) formData.append('descripcion', descripcion);

    const { data } = await api.post(`/api/sanciones/${sancionId}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getDocumentos: async (sancionId: number): Promise<DocumentoEmpleado[]> => {
    const { data } = await api.get<DocumentoEmpleado[]>(`/api/sanciones/${sancionId}/documentos`);
    return data;
  },

  downloadDocumento: async (sancionId: number, id: number): Promise<Blob> => {
    const { data } = await api.get(`/api/sanciones/${sancionId}/documentos/${id}/download`, {
      responseType: 'blob',
    });
    return data;
  },

  downloadAndSave: async (sancionId: number, id: number, fileName: string): Promise<void> => {
    const blob = await sancionApi.downloadDocumento(sancionId, id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  deleteDocumento: async (sancionId: number, id: number): Promise<void> => {
    await api.delete(`/api/sanciones/${sancionId}/documentos/${id}`);
  },
};
