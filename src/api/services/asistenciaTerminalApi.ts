import api from '../config';

export interface EnNoNoAsignado {
  enNo: string;
  nombreTerminal: string | null;
  cantidadMarcas: number;
}

export interface ImportResumen {
  fichadasNuevas: number;
  fichadasDuplicadas: number;
  lineasInvalidas: number;
  fechaDesde: string | null;
  fechaHasta: string | null;
  empleadosProcesados: number;
  registrosAsistenciaGenerados: number;
  codigosNoAsignados: EnNoNoAsignado[];
}

export type TipoDiferenciaFichaje = 'TARDE' | 'AUSENTE' | 'INCOMPLETA' | 'SALIDA_ANTICIPADA';

export interface DiferenciaFichaje {
  empleadoId: number;
  nombreCompleto: string;
  fecha: string;
  tipo: TipoDiferenciaFichaje;
  horaEsperadaEntrada: string | null;
  horaRealEntrada: string | null;
  minutosTarde: number | null;
  horaEsperadaSalida: string | null;
  horaRealSalida: string | null;
  minutosAnticipado: number | null;
  detalle: string;
}

export interface ResumenAsistenciaEmpleado {
  empleadoId: number;
  nombreCompleto: string;
  codigoTerminal: string | null;
  diasTrabajados: number;
  horasTotales: number;
  horasExtra: number;
  diasIncompletos: number;
}

const BASE = '/api/rrhh/asistencia-terminal';

export const asistenciaTerminalApi = {
  importar: async (file: File): Promise<ImportResumen> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`${BASE}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getNoAsignadas: async (): Promise<EnNoNoAsignado[]> => {
    const { data } = await api.get(`${BASE}/no-asignadas`);
    return data;
  },

  asignar: async (empleadoId: number, enNo: string): Promise<void> => {
    await api.post(`${BASE}/asignar`, { empleadoId, enNo });
  },

  getResumen: async (desde: string, hasta: string): Promise<ResumenAsistenciaEmpleado[]> => {
    const { data } = await api.get(`${BASE}/resumen`, { params: { desde, hasta } });
    return data;
  },

  getDiferencias: async (desde: string, hasta: string): Promise<DiferenciaFichaje[]> => {
    const { data } = await api.get(`${BASE}/diferencias`, { params: { desde, hasta } });
    return data;
  },

  reprocesar: async (desde: string, hasta: string): Promise<{ registrosProcesados: number }> => {
    const { data } = await api.post(`${BASE}/reprocesar`, null, { params: { desde, hasta } });
    return data;
  },
};
