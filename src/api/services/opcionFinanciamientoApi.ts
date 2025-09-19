// api/opcionFinanciamientoApi.ts
import api from '../config';
import type { OpcionFinanciamientoDTO } from '../../types';




class opcionFinanciamientoApi {
  // Obtener todas las opciones de financiamiento por documento
  async obtenerOpcionesPorDocumento(documentoId: number): Promise<OpcionFinanciamientoDTO[]> {
    try {
      const response = await api.get<OpcionFinanciamientoDTO[]>(`/opciones-financiamiento/documento/${documentoId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo opciones de financiamiento:', error);
      throw error;
    }
  }

  // Obtener una opción de financiamiento por ID
  async obtenerPorId(id: number): Promise<OpcionFinanciamientoDTO> {
    try {
      const response = await api.get<OpcionFinanciamientoDTO>(`/opciones-financiamiento/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo opción de financiamiento:', error);
      throw error;
    }
  }

  // Crear una nueva opción de financiamiento
  async crear(documentoId: number, opcion: OpcionFinanciamientoDTO): Promise<OpcionFinanciamientoDTO> {
    try {
      const response = await api.post<OpcionFinanciamientoDTO>(
        `/opciones-financiamiento/documento/${documentoId}`,
        opcion
      );
      return response.data;
    } catch (error) {
      console.error('Error creando opción de financiamiento:', error);
      throw error;
    }
  }

  // Crear múltiples opciones de financiamiento
  async crearMultiples(documentoId: number, opciones: OpcionFinanciamientoDTO[]): Promise<OpcionFinanciamientoDTO[]> {
    try {
      const promises = opciones.map((opcion, index) =>
        this.crear(documentoId, { ...opcion, ordenPresentacion: index + 1 })
      );
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error creando múltiples opciones:', error);
      throw error;
    }
  }

  // Actualizar una opción de financiamiento
  async actualizar(id: number, opcion: OpcionFinanciamientoDTO): Promise<OpcionFinanciamientoDTO> {
    try {
      const response = await api.put<OpcionFinanciamientoDTO>(`/opciones-financiamiento/${id}`, opcion);
      return response.data;
    } catch (error) {
      console.error('Error actualizando opción de financiamiento:', error);
      throw error;
    }
  }

  // Eliminar una opción de financiamiento
  async eliminar(id: number): Promise<void> {
    try {
      await api.delete(`/opciones-financiamiento/${id}`);
    } catch (error) {
      console.error('Error eliminando opción de financiamiento:', error);
      throw error;
    }
  }

  // Eliminar todas las opciones de un documento
  async eliminarPorDocumento(documentoId: number): Promise<void> {
    try {
      await api.delete(`/opciones-financiamiento/documento/${documentoId}`);
    } catch (error) {
      console.error('Error eliminando opciones del documento:', error);
      throw error;
    }
  }

  // Reemplazar todas las opciones de un documento
  async reemplazarOpciones(documentoId: number, opciones: OpcionFinanciamientoDTO[]): Promise<OpcionFinanciamientoDTO[]> {
    try {
      // Primero eliminamos todas las opciones existentes
      await this.eliminarPorDocumento(documentoId);
      // Luego creamos las nuevas
      return await this.crearMultiples(documentoId, opciones);
    } catch (error) {
      console.error('Error reemplazando opciones:', error);
      throw error;
    }
  }
}

export default new opcionFinanciamientoApi();
