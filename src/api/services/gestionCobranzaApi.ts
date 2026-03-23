import api from '../config';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';
import type {
  GestionCobranzaDTO,
  CreateGestionCobranzaDTO,
  UpdateGestionCobranzaDTO,
  AccionCobranzaDTO,
  CreateAccionCobranzaDTO,
  RecordatorioCobranzaDTO,
  CreateRecordatorioCobranzaDTO,
  ResumenCobranzaDTO,
  EstadoGestionCobranza,
  PromesaPagoDTO,
  CreatePromesaPagoDTO,
  EventoCobranzaDTO,
} from '../../types/cobranza.types';

export const gestionCobranzaApi = {
  // ── Gestiones ──────────────────────────────────────────────────────────────

  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<GestionCobranzaDTO>> => {
    const res = await api.get<PageResponse<GestionCobranzaDTO>>('/api/gestiones-cobranza', {
      params: { ...pagination },
    });
    return res.data;
  },

  getHistorial: async (pagination: PaginationParams = {}): Promise<PageResponse<GestionCobranzaDTO>> => {
    const res = await api.get<PageResponse<GestionCobranzaDTO>>('/api/gestiones-cobranza/historial', {
      params: { ...pagination },
    });
    return res.data;
  },

  getById: async (id: number): Promise<GestionCobranzaDTO> => {
    const res = await api.get<GestionCobranzaDTO>(`/api/gestiones-cobranza/${id}`);
    return res.data;
  },

  getByPrestamo: async (prestamoId: number): Promise<GestionCobranzaDTO[]> => {
    const res = await api.get<GestionCobranzaDTO[]>(`/api/gestiones-cobranza/prestamo/${prestamoId}`);
    return res.data;
  },

  getActivaByPrestamo: async (prestamoId: number): Promise<GestionCobranzaDTO> => {
    const res = await api.get<GestionCobranzaDTO>(`/api/gestiones-cobranza/prestamo/${prestamoId}/activa`);
    return res.data;
  },

  getResumen: async (usuarioId?: number): Promise<ResumenCobranzaDTO> => {
    const res = await api.get<ResumenCobranzaDTO>('/api/gestiones-cobranza/resumen', {
      params: usuarioId ? { usuarioId } : {},
    });
    return res.data;
  },

  create: async (data: CreateGestionCobranzaDTO): Promise<GestionCobranzaDTO> => {
    const res = await api.post<GestionCobranzaDTO>('/api/gestiones-cobranza', data);
    return res.data;
  },

  update: async (id: number, data: UpdateGestionCobranzaDTO): Promise<GestionCobranzaDTO> => {
    const res = await api.put<GestionCobranzaDTO>(`/api/gestiones-cobranza/${id}`, data);
    return res.data;
  },

  cerrar: async (id: number, estado: EstadoGestionCobranza): Promise<GestionCobranzaDTO> => {
    const res = await api.patch<GestionCobranzaDTO>(`/api/gestiones-cobranza/${id}/cerrar`, null, {
      params: { estado },
    });
    return res.data;
  },

  // ── Acciones ───────────────────────────────────────────────────────────────

  getAccionesByGestion: async (gestionId: number): Promise<AccionCobranzaDTO[]> => {
    const res = await api.get<AccionCobranzaDTO[]>(`/api/acciones-cobranza/gestion/${gestionId}`);
    return res.data;
  },

  createAccion: async (data: CreateAccionCobranzaDTO): Promise<AccionCobranzaDTO> => {
    const res = await api.post<AccionCobranzaDTO>('/api/acciones-cobranza', data);
    return res.data;
  },

  deleteAccion: async (id: number): Promise<void> => {
    await api.delete(`/api/acciones-cobranza/${id}`);
  },

  // ── Recordatorios ──────────────────────────────────────────────────────────

  getRecordatoriosByGestion: async (gestionId: number): Promise<RecordatorioCobranzaDTO[]> => {
    const res = await api.get<RecordatorioCobranzaDTO[]>(`/api/recordatorios-cobranza/gestion/${gestionId}`);
    return res.data;
  },

  getPendientes: async (): Promise<RecordatorioCobranzaDTO[]> => {
    const res = await api.get<RecordatorioCobranzaDTO[]>('/api/recordatorios-cobranza/pendientes');
    return res.data;
  },

  getPendientesByUsuario: async (usuarioId: number): Promise<RecordatorioCobranzaDTO[]> => {
    const res = await api.get<RecordatorioCobranzaDTO[]>(`/api/recordatorios-cobranza/pendientes/usuario/${usuarioId}`);
    return res.data;
  },

  createRecordatorio: async (data: CreateRecordatorioCobranzaDTO): Promise<RecordatorioCobranzaDTO> => {
    const res = await api.post<RecordatorioCobranzaDTO>('/api/recordatorios-cobranza', data);
    return res.data;
  },

  completarRecordatorio: async (id: number): Promise<RecordatorioCobranzaDTO> => {
    const res = await api.patch<RecordatorioCobranzaDTO>(`/api/recordatorios-cobranza/${id}/completar`);
    return res.data;
  },

  deleteRecordatorio: async (id: number): Promise<void> => {
    await api.delete(`/api/recordatorios-cobranza/${id}`);
  },

  // ── Promesas de Pago ───────────────────────────────────────────────────────

  /** Registra una promesa. Cancela automáticamente la promesa vigente anterior. */
  registrarPromesa: async (gestionId: number, data: CreatePromesaPagoDTO): Promise<PromesaPagoDTO> => {
    const res = await api.post<PromesaPagoDTO>(`/api/gestiones-cobranza/${gestionId}/promesas`, data);
    return res.data;
  },

  getPromesas: async (gestionId: number): Promise<PromesaPagoDTO[]> => {
    const res = await api.get<PromesaPagoDTO[]>(`/api/gestiones-cobranza/${gestionId}/promesas`);
    return res.data;
  },

  cancelarPromesa: async (gestionId: number, promesaId: number): Promise<PromesaPagoDTO> => {
    const res = await api.delete<PromesaPagoDTO>(`/api/gestiones-cobranza/${gestionId}/promesas/${promesaId}`);
    return res.data;
  },

  // ── Timeline ───────────────────────────────────────────────────────────────

  getTimeline: async (gestionId: number): Promise<EventoCobranzaDTO[]> => {
    const res = await api.get<EventoCobranzaDTO[]>(`/api/gestiones-cobranza/${gestionId}/timeline`);
    return res.data;
  },

  getTimelinePrestamo: async (prestamoId: number): Promise<EventoCobranzaDTO[]> => {
    const res = await api.get<EventoCobranzaDTO[]>(`/api/gestiones-cobranza/prestamo/${prestamoId}/timeline`);
    return res.data;
  },

  // ── Motor de Cobranzas ─────────────────────────────────────────────────────

  ejecutarMotor: async (): Promise<{ status: string; empresaId: string }> => {
    const res = await api.post('/api/cobranza/motor/ejecutar');
    return res.data;
  },
};
