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
};
