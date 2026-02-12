import api from '../config';
import type {
  PuestoListDTO,
  PuestoResponseDTO,
  CreatePuestoDTO,
  UpdatePuestoDTO,
  PuestoVersionDTO,
  CreateTareaPuestoDTO,
  UpdateTareaPuestoDTO,
  TareaPuestoDTO,
  CreateSubtareaPuestoDTO,
  UpdateSubtareaPuestoDTO,
  SubtareaPuestoDTO,
} from '../../types';

const BASE = '/api/rrhh/puestos';

export const puestoApi = {
  // ── Puestos ──────────────────────────────────────────────
  getAll: async (): Promise<PuestoListDTO[]> => {
    const response = await api.get(BASE);
    return response.data;
  },

  getActivos: async (): Promise<PuestoListDTO[]> => {
    const response = await api.get(`${BASE}/activos`);
    return response.data;
  },

  getDepartamentos: async (): Promise<string[]> => {
    const response = await api.get(`${BASE}/departamentos`);
    return response.data;
  },

  getByDepartamento: async (departamento: string): Promise<PuestoListDTO[]> => {
    const response = await api.get(`${BASE}/departamento/${departamento}`);
    return response.data;
  },

  getById: async (id: number): Promise<PuestoResponseDTO> => {
    const response = await api.get(`${BASE}/${id}`);
    return response.data;
  },

  create: async (data: CreatePuestoDTO): Promise<PuestoResponseDTO> => {
    const response = await api.post(BASE, data);
    return response.data;
  },

  update: async (id: number, data: UpdatePuestoDTO): Promise<PuestoResponseDTO> => {
    const response = await api.put(`${BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  activar: async (id: number): Promise<PuestoResponseDTO> => {
    const response = await api.put(`${BASE}/${id}/activar`);
    return response.data;
  },

  // ── Versiones ────────────────────────────────────────────
  getVersiones: async (puestoId: number): Promise<PuestoVersionDTO[]> => {
    const response = await api.get(`${BASE}/${puestoId}/versiones`);
    return response.data;
  },

  getVersion: async (puestoId: number, version: number): Promise<PuestoVersionDTO> => {
    const response = await api.get(`${BASE}/${puestoId}/versiones/${version}`);
    return response.data;
  },

  // ── PDF ──────────────────────────────────────────────────
  downloadPdf: async (puestoId: number): Promise<Blob> => {
    const response = await api.get(`${BASE}/${puestoId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ── Tareas ───────────────────────────────────────────────
  addTarea: async (puestoId: number, data: CreateTareaPuestoDTO): Promise<TareaPuestoDTO> => {
    const response = await api.post(`${BASE}/${puestoId}/tareas`, data);
    return response.data;
  },

  updateTarea: async (puestoId: number, tareaId: number, data: UpdateTareaPuestoDTO): Promise<TareaPuestoDTO> => {
    const response = await api.put(`${BASE}/${puestoId}/tareas/${tareaId}`, data);
    return response.data;
  },

  deleteTarea: async (puestoId: number, tareaId: number): Promise<void> => {
    await api.delete(`${BASE}/${puestoId}/tareas/${tareaId}`);
  },

  reorderTareas: async (puestoId: number, tareaIds: number[]): Promise<void> => {
    await api.put(`${BASE}/${puestoId}/tareas/reorder`, tareaIds);
  },

  // ── Subtareas ────────────────────────────────────────────
  addSubtarea: async (puestoId: number, tareaId: number, data: CreateSubtareaPuestoDTO): Promise<SubtareaPuestoDTO> => {
    const response = await api.post(`${BASE}/${puestoId}/tareas/${tareaId}/subtareas`, data);
    return response.data;
  },

  updateSubtarea: async (puestoId: number, tareaId: number, subtareaId: number, data: UpdateSubtareaPuestoDTO): Promise<SubtareaPuestoDTO> => {
    const response = await api.put(`${BASE}/${puestoId}/tareas/${tareaId}/subtareas/${subtareaId}`, data);
    return response.data;
  },

  deleteSubtarea: async (puestoId: number, tareaId: number, subtareaId: number): Promise<void> => {
    await api.delete(`${BASE}/${puestoId}/tareas/${tareaId}/subtareas/${subtareaId}`);
  },
};
