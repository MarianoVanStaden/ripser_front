import api from '../config';
import type {
  RegistroActividadDTO,
  HorarioLaboralDTO,
  TipoAccionActividad,
  ActividadFilters,
} from '../../types/actividad.types';
import type { PageResponse } from '../../types/pagination.types';

const BASE = '/api/admin/actividad';

export const registroActividadApi = {
  /**
   * Listado paginado server-side. Pasa los filtros como query params; los
   * que vengan undefined se omiten automáticamente por axios.
   */
  list: async (
    page: number,
    size: number,
    filters: ActividadFilters = {}
  ): Promise<PageResponse<RegistroActividadDTO>> => {
    const res = await api.get<PageResponse<RegistroActividadDTO>>(BASE, {
      params: {
        page,
        size,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        usuarioId: filters.usuarioId,
        tipoAccion: filters.tipoAccion,
        fueraHorario: filters.fueraHorario,
      },
    });
    return res.data;
  },

  getTipos: async (): Promise<TipoAccionActividad[]> => {
    const res = await api.get<TipoAccionActividad[]>(`${BASE}/tipos`);
    return res.data;
  },

  getHorario: async (): Promise<HorarioLaboralDTO> => {
    const res = await api.get<HorarioLaboralDTO>(`${BASE}/horario`);
    return res.data;
  },

  updateHorario: async (dto: HorarioLaboralDTO): Promise<HorarioLaboralDTO> => {
    const res = await api.put<HorarioLaboralDTO>(`${BASE}/horario`, dto);
    return res.data;
  },
};
