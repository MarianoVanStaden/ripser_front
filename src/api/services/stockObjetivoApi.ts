import api from '../config';
import type {
  StockObjetivoResponseDTO,
  EvaluacionStockDTO,
  CreateStockObjetivoDTO,
  UpdateStockObjetivoDTO,
  GenerarOrdenDTO,
} from '../../types';

const BASE_PATH = '/api/stock-objetivo';

export const stockObjetivoApi = {
  // ── Listado y detalle ──

  getAll: async (): Promise<StockObjetivoResponseDTO[]> => {
    const response = await api.get<StockObjetivoResponseDTO[]>(BASE_PATH);
    return response.data;
  },

  getById: async (id: number): Promise<StockObjetivoResponseDTO> => {
    const response = await api.get<StockObjetivoResponseDTO>(`${BASE_PATH}/${id}`);
    return response.data;
  },

  // ── Evaluación en tiempo real ──

  getEvaluacion: async (): Promise<EvaluacionStockDTO[]> => {
    const response = await api.get<EvaluacionStockDTO[]>(`${BASE_PATH}/evaluacion`);
    return response.data;
  },

  getEvaluacionById: async (id: number): Promise<EvaluacionStockDTO> => {
    const response = await api.get<EvaluacionStockDTO>(`${BASE_PATH}/${id}/evaluacion`);
    return response.data;
  },

  // ── CRUD ──

  create: async (dto: CreateStockObjetivoDTO): Promise<StockObjetivoResponseDTO> => {
    const response = await api.post<StockObjetivoResponseDTO>(BASE_PATH, dto);
    return response.data;
  },

  update: async (id: number, dto: UpdateStockObjetivoDTO): Promise<StockObjetivoResponseDTO> => {
    const response = await api.put<StockObjetivoResponseDTO>(`${BASE_PATH}/${id}`, dto);
    return response.data;
  },

  // ── Acciones ──

  /**
   * Genera una orden de fabricación preventiva para el objetivo dado.
   * Solo válido cuando accionSugerida = "FABRICAR".
   * cantidadSolicitada: null → el sistema calcula el déficit neto automáticamente.
   */
  generarOrden: async (id: number, dto: GenerarOrdenDTO): Promise<unknown> => {
    const response = await api.post<unknown>(`${BASE_PATH}/${id}/generar-orden`, dto);
    return response.data;
  },
};
