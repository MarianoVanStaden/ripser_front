import api from '../config';
import type { TipoLicencia, EstadoLicencia } from '../../types';

export interface AusenciaCombinadaPayload {
  empleadoId: number;
  fechaSalidaAnticipada: string;       // YYYY-MM-DD (hoy)
  horaSalidaReal: string;              // HH:mm o HH:mm:ss
  tipoLicencia: TipoLicencia;
  fechaFinLicencia: string;            // YYYY-MM-DD (último día de licencia)
  motivo?: string;
  goceHaber?: boolean;
  estadoLicencia?: EstadoLicencia;
}

export interface AusenciaCombinadaResponse {
  excepcionId: number;
  licenciaId: number;
}

export const ausenciaApi = {
  /**
   * Crea atómicamente la SALIDA_ANTICIPADA del día + la licencia continuada
   * desde el día siguiente hasta fechaFinLicencia. La excepción queda
   * linkeada (FK licencia_id) a la licencia creada.
   */
  crearCombinada: async (payload: AusenciaCombinadaPayload): Promise<AusenciaCombinadaResponse> => {
    const response = await api.post('/api/ausencias/combinada', payload);
    return response.data;
  },
};
