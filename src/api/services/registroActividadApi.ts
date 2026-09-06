import api from '../config';
import type {
  RegistroActividadDTO,
  HorarioLaboralDTO,
  TipoAccionMeta,
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
    // Arrays van como CSV en un solo query param: Spring bindea "A,B" a List<Enum>.
    // (axios por defecto serializa arrays como key[]=... que Spring no bindea.)
    const csv = (arr?: string[]) => (arr && arr.length ? arr.join(',') : undefined);
    const res = await api.get<PageResponse<RegistroActividadDTO>>(BASE, {
      params: {
        page,
        size,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        usuarioId: filters.usuarioId,
        tipoAccion: csv(filters.tiposAccion),
        modulo: csv(filters.modulos),
        fueraHorario: filters.fueraHorario,
      },
    });
    return res.data;
  },

  getTipos: async (): Promise<TipoAccionMeta[]> => {
    const res = await api.get<TipoAccionMeta[]>(`${BASE}/tipos`);
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
