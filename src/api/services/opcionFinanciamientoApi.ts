import api from '../config';
import type { OpcionFinanciamientoDTO } from '../../types';

const BASE = '/opciones-financiamiento';

const opcionFinanciamientoApi = {
  async obtenerOpcionesPorDocumento(documentoId: number): Promise<OpcionFinanciamientoDTO[]> {
    const { data } = await api.get<OpcionFinanciamientoDTO[]>(`${BASE}/documento/${documentoId}`);
    return data;
  },

  async obtenerPorId(id: number): Promise<OpcionFinanciamientoDTO> {
    const { data } = await api.get<OpcionFinanciamientoDTO>(`${BASE}/${id}`);
    return data;
  },

  async crear(documentoId: number, opcion: OpcionFinanciamientoDTO): Promise<OpcionFinanciamientoDTO> {
    const { data } = await api.post<OpcionFinanciamientoDTO>(`${BASE}/documento/${documentoId}`, opcion);
    return data;
  },

  async crearMultiples(documentoId: number, opciones: OpcionFinanciamientoDTO[]): Promise<OpcionFinanciamientoDTO[]> {
    const created = await Promise.all(
      opciones.map((op, idx) => opcionFinanciamientoApi.crear(documentoId, { ...op, ordenPresentacion: idx + 1 }))
    );
    return created;
  },

  async actualizar(id: number, opcion: OpcionFinanciamientoDTO): Promise<OpcionFinanciamientoDTO> {
    const { data } = await api.put<OpcionFinanciamientoDTO>(`${BASE}/${id}`, opcion);
    return data;
  },

  async eliminar(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },

  async eliminarPorDocumento(documentoId: number): Promise<void> {
    await api.delete(`${BASE}/documento/${documentoId}`);
  },

  async reemplazarOpciones(documentoId: number, opciones: OpcionFinanciamientoDTO[]): Promise<OpcionFinanciamientoDTO[]> {
    await opcionFinanciamientoApi.eliminarPorDocumento(documentoId);
    return await opcionFinanciamientoApi.crearMultiples(documentoId, opciones);
  },
};

export default opcionFinanciamientoApi;
