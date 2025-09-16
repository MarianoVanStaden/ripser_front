// api/opcionFinanciamientoApi.ts
import axios from 'axios';
import api from '../config';
import type { OpcionFinanciamientoDTO } from '../../types';




class opcionFinanciamientoApi {
  private axiosInstance = axios.create({
    baseURL: `${api}/opciones-financiamiento`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Obtener todas las opciones de financiamiento por documento
  async obtenerOpcionesPorDocumento(documentoId: number): Promise<OpcionFinanciamientoDTO[]> {
    try {
      const response = await this.axiosInstance.get<OpcionFinanciamientoDTO[]>(`/documento/${documentoId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo opciones de financiamiento:', error);
      throw error;
    }
  }

  // Obtener una opción de financiamiento por ID
  async obtenerPorId(id: number): Promise<OpcionFinanciamientoDTO> {
    try {
      const response = await this.axiosInstance.get<OpcionFinanciamientoDTO>(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo opción de financiamiento:', error);
      throw error;
    }
  }

  // Crear una nueva opción de financiamiento
  async crear(documentoId: number, opcion: OpcionFinanciamientoDTO): Promise<OpcionFinanciamientoDTO> {
    try {
      const response = await this.axiosInstance.post<OpcionFinanciamientoDTO>(
        `/documento/${documentoId}`,
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
      const response = await this.axiosInstance.put<OpcionFinanciamientoDTO>(`/${id}`, opcion);
      return response.data;
    } catch (error) {
      console.error('Error actualizando opción de financiamiento:', error);
      throw error;
    }
  }

  // Eliminar una opción de financiamiento
  async eliminar(id: number): Promise<void> {
    try {
      await this.axiosInstance.delete(`/${id}`);
    } catch (error) {
      console.error('Error eliminando opción de financiamiento:', error);
      throw error;
    }
  }

  // Eliminar todas las opciones de un documento
  async eliminarPorDocumento(documentoId: number): Promise<void> {
    try {
      await this.axiosInstance.delete(`/documento/${documentoId}`);
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