import api from '../config';

const BASE = '/api/backups';

export interface BackupFileDTO {
  nombre: string;
  fechaCreacion: string; // ISO
  tamanioBytes: number;
  tamanioLegible: string;
}

export type EstadoBackup = 'OK' | 'ERROR' | 'EN_PROGRESO' | 'SIN_DATOS';

export interface BackupStatusDTO {
  ultimoBackup: BackupFileDTO | null;
  estadoUltimo: EstadoBackup;
  mensajeError: string | null;
  proximaEjecucion: string | null; // ISO
  cantidadBackups: number;
  espacioOcupadoBytes: number;
  espacioOcupadoLegible: string;
  retentionDays: number;
  intervalo: string;
  habilitado: boolean;
  duracionUltimoSegundos: number;
}

export const backupApi = {
  list: async (): Promise<BackupFileDTO[]> => {
    const res = await api.get<BackupFileDTO[]>(BASE);
    return res.data;
  },

  status: async (): Promise<BackupStatusDTO> => {
    const res = await api.get<BackupStatusDTO>(`${BASE}/status`);
    return res.data;
  },

  run: async (): Promise<{ mensaje: string }> => {
    const res = await api.post<{ mensaje: string }>(`${BASE}/run`);
    return res.data;
  },

  remove: async (nombre: string): Promise<void> => {
    await api.delete(`${BASE}/${encodeURIComponent(nombre)}`);
  },

  // La auth es Bearer header, así que no podemos usar un <a href> directo:
  // descargamos como blob y forzamos la descarga en el navegador.
  download: async (nombre: string): Promise<void> => {
    const res = await api.get(`${BASE}/download/${encodeURIComponent(nombre)}`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/gzip' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
