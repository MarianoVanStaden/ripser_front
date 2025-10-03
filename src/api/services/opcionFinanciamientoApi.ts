// api/services/opcionFinanciamientoApi.ts
import api from '../config';
import type { OpcionFinanciamientoDTO } from '../../types';

class OpcionFinanciamientoApi {
  // Obtener todas las opciones de financiamiento por documento
  async obtenerOpcionesPorDocumento(documentoId: number): Promise<OpcionFinanciamientoDTO[]> {
    const { data } = await api.get<OpcionFinanciamientoDTO[]>(
      `/api/opciones-financiamiento/documento/${documentoId}`
    );
    return data;
  }

  // Obtener una opción de financiamiento por ID
  async obtenerPorId(id: number): Promise<OpcionFinanciamientoDTO> {
    const { data } = await api.get<OpcionFinanciamientoDTO>(`/api/opciones-financiamiento/${id}`);
    return data;
  }

  // Crear una nueva opción de financiamiento
  async crear(documentoId: number, opcion: OpcionFinanciamientoDTO): Promise<OpcionFinanciamientoDTO> {
    const { data } = await api.post<OpcionFinanciamientoDTO>(
      `/api/opciones-financiamiento/documento/${documentoId}`,
      opcion
    );
    return data;
  }

  // Crear múltiples opciones de financiamiento
  async crearMultiples(documentoId: number, opciones: OpcionFinanciamientoDTO[]): Promise<OpcionFinanciamientoDTO[]> {
    const promises = opciones.map((opcion, index) =>
      this.crear(documentoId, { ...opcion, ordenPresentacion: index + 1 })
    );
    return Promise.all(promises);
  }

  // Actualizar una opción de financiamiento
  async actualizar(id: number, opcion: OpcionFinanciamientoDTO): Promise<OpcionFinanciamientoDTO> {
    const { data } = await api.put<OpcionFinanciamientoDTO>(`/api/opciones-financiamiento/${id}`, opcion);
    return data;
  }

  // Eliminar una opción de financiamiento
  async eliminar(id: number): Promise<void> {
    await api.delete(`/api/opciones-financiamiento/${id}`);
  }

  // Eliminar todas las opciones de un documento
  async eliminarPorDocumento(documentoId: number): Promise<void> {
    await api.delete(`/api/opciones-financiamiento/documento/${documentoId}`);
  }

  // Reemplazar todas las opciones de un documento
  async reemplazarOpciones(documentoId: number, opciones: OpcionFinanciamientoDTO[]): Promise<OpcionFinanciamientoDTO[]> {
    await this.eliminarPorDocumento(documentoId);
    return this.crearMultiples(documentoId, opciones);
  }
}

export default new OpcionFinanciamientoApi();
