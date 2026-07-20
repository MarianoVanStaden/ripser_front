import api from '../config';

// Herramientas de mantenimiento del PLATFORM_OWNER (/api/platform/**).
// El backend exige ROLE_PLATFORM_OWNER — estos endpoints no existen para el resto.

export type PlatformOperacion = 'SOFT_DELETE' | 'HARD_DELETE' | 'UPDATE_CAMPO' | 'MOVER_EMPRESA';

export interface PlatformOpRequest {
  operacion: PlatformOperacion;
  empresaId: number;
  tabla: string;
  registroId: number;
  columna?: string;
  valorNuevo?: string;
  empresaDestinoId?: number;
}

export interface PlatformPreviewResponse {
  opId: number;
  confirmToken: string;
  expiraAt: string;
  resumen: string;
  filaAfectada: Record<string, unknown>;
}

export interface PlatformResultadoResponse {
  opId: number;
  estado: string;
  filasAfectadas: number;
}

export interface PlatformOpsLog {
  id: number;
  operacion: string;
  empresaId: number;
  usuarioId: number;
  estado: 'PENDIENTE' | 'EJECUTADA' | 'REVERTIDA' | 'CANCELADA';
  params: string;
  detalle?: string;
  reversible: boolean;
  executedAt?: string;
  revertidaAt?: string;
  createdAt: string;
}

export interface PlatformColumnaInfo {
  nombre: string;
  tipo: string;
  nullable: boolean;
  /** false para columnas nunca editables via UPDATE_CAMPO (id, empresa_id, password...). */
  editable: boolean;
}

export interface PlatformResumenTabla {
  tabla: string;
  count: number;
}

export interface PlatformRegistroResponse {
  tabla: string;
  fila: Record<string, unknown>;
}

export interface PlatformRegistrosResponse {
  tabla: string;
  empresaId: number;
  filas: Record<string, unknown>[];
}

export interface PlatformForceLogoutResponse {
  alcance: string;
  opLogId: number;
}

export interface PlatformImpersonateResponse {
  token: string;
  expiresAt: string;
  usuario: { id: number; username: string; nombre: string };
  empresa: { id: number | null; nombre: string | null };
}

export const platformApi = {
  preview: async (req: PlatformOpRequest) =>
    (await api.post<PlatformPreviewResponse>('/api/platform/ops/preview', req)).data,
  execute: async (confirmToken: string) =>
    (await api.post<PlatformResultadoResponse>('/api/platform/ops/execute', { confirmToken })).data,
  revert: async (opId: number) =>
    (await api.post<PlatformResultadoResponse>(`/api/platform/ops/${opId}/revert`)).data,
  historial: async (page = 0, size = 25) =>
    (await api.get<{ content: PlatformOpsLog[]; totalElements: number }>(
      `/api/platform/ops?page=${page}&size=${size}&sort=id,desc`,
    )).data,
  // Metadata para autocompletes
  getTablas: async () => (await api.get<string[]>('/api/platform/metadata/tablas')).data,
  getColumnas: async (tabla: string) =>
    (await api.get<PlatformColumnaInfo[]>(`/api/platform/metadata/tablas/${tabla}/columnas`)).data,
  // Inspector read-only
  inspectRegistro: async (tabla: string, id: number) =>
    (await api.get<PlatformRegistroResponse>(`/api/platform/inspector/${tabla}/${id}`)).data,
  inspectUltimos: async (tabla: string, empresaId: number, limit = 20) =>
    (await api.get<PlatformRegistrosResponse>(
      `/api/platform/inspector/${tabla}?empresaId=${empresaId}&limit=${limit}`,
    )).data,
  // Resumen por empresa
  getResumen: async (empresaId: number) =>
    (await api.get<PlatformResumenTabla[]>(`/api/platform/empresas/${empresaId}/resumen`)).data,
  // Sesiones
  forceLogout: async (usuarioId?: number) =>
    (await api.post<PlatformForceLogoutResponse>('/api/platform/sesiones/force-logout',
      usuarioId ? { usuarioId } : {})).data,
  impersonate: async (usuarioId: number) =>
    (await api.post<PlatformImpersonateResponse>('/api/platform/impersonate', { usuarioId })).data,
};
