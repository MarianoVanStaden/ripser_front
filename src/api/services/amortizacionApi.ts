import api from '../config';
import type {
  ActivoAmortizableDTO,
  CreateActivoAmortizableDTO,
  AmortizacionMensualDTO,
  ResumenAmortizacionAnualDTO,
  RegistrarAmortizacionDTO,
  ProcesarCierreMensualDTO,
  ResultadoCierreMensualDTO,
  EjecutarAmortizacionRequest,
  AmortizacionEjecucionResponse,
  ConvertirAmortizacionMultiDTO,
  ConversionAmortizacionResponseDTO,
} from '../../types';

const ACTIVOS = '/api/admin/amortizaciones/activos';
const BASE = '/api/admin/amortizaciones';

export const amortizacionApi = {
  getActivos: async (): Promise<ActivoAmortizableDTO[]> => {
    const res = await api.get<ActivoAmortizableDTO[]>(ACTIVOS);
    return res.data;
  },

  createActivo: async (dto: CreateActivoAmortizableDTO): Promise<ActivoAmortizableDTO> => {
    const res = await api.post<ActivoAmortizableDTO>(ACTIVOS, dto);
    return res.data;
  },

  updateActivo: async (id: number, dto: CreateActivoAmortizableDTO): Promise<ActivoAmortizableDTO> => {
    const res = await api.put<ActivoAmortizableDTO>(`${ACTIVOS}/${id}`, dto);
    return res.data;
  },

  deleteActivo: async (id: number): Promise<void> => {
    await api.delete(`${ACTIVOS}/${id}`);
  },

  getResumenAnual: async (anio: number): Promise<ResumenAmortizacionAnualDTO> => {
    const res = await api.get<ResumenAmortizacionAnualDTO>(BASE, { params: { anio } });
    return res.data;
  },

  getDetallesMes: async (anio: number, mes: number): Promise<AmortizacionMensualDTO[]> => {
    const res = await api.get<AmortizacionMensualDTO[]>(`${BASE}/${anio}/mes/${mes}`);
    return res.data;
  },

  registrarAmortizacion: async (
    anio: number,
    mes: number,
    activoId: number,
    dto: RegistrarAmortizacionDTO
  ): Promise<AmortizacionMensualDTO> => {
    const res = await api.post<AmortizacionMensualDTO>(
      `${BASE}/${anio}/mes/${mes}/activo/${activoId}`,
      dto
    );
    return res.data;
  },

  procesarCierreMensual: async (dto: ProcesarCierreMensualDTO): Promise<ResultadoCierreMensualDTO> => {
    const res = await api.post<ResultadoCierreMensualDTO>(`${BASE}/proceso-mensual`, dto);
    return res.data;
  },

  ejecutarAmortizacion: async (
    id: number,
    dto: EjecutarAmortizacionRequest
  ): Promise<AmortizacionEjecucionResponse> => {
    const res = await api.post<AmortizacionEjecucionResponse>(
      `${BASE}/${id}/ejecutar`,
      dto
    );
    return res.data;
  },

  convertirUsd: async (
    amortizacionId: number,
    dto: ConvertirAmortizacionMultiDTO
  ): Promise<ConversionAmortizacionResponseDTO> => {
    const res = await api.post<ConversionAmortizacionResponseDTO>(
      `${BASE}/${amortizacionId}/convertir-usd`,
      dto
    );
    return res.data;
  },
};
