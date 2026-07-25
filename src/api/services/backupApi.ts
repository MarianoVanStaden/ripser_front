import api from '../config';

/** Tiers de backups de base de datos (.sql.gz). */
export type BackupTier = 'hourly' | 'weekly' | 'monthly' | 'yearly';
/** Tiers de backups de documentos (.tar.gz de storage/ + uploads/). */
export type FileBackupTier = 'daily' | 'weekly' | 'monthly';
export type AnyBackupTier = BackupTier | FileBackupTier;

export interface BackupFileDTO {
  tier: AnyBackupTier;
  nombre: string;
  fechaCreacion: string; // ISO
  tamanioBytes: number;
  tamanioLegible: string;
}

export type EstadoBackup = 'OK' | 'ERROR' | 'EN_PROGRESO' | 'SIN_DATOS';

export interface TierResumenDTO {
  tier: AnyBackupTier;
  etiqueta: string;
  retencion: string;
  cantidad: number;
  espacioBytes: number;
  espacioLegible: string;
  ultimoBackup: BackupFileDTO | null;
}

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
  tiers: TierResumenDTO[];
}

/** Backups agrupados por tier; cada tipo trae solo sus tiers. */
export type BackupsPorTier = Partial<Record<AnyBackupTier, BackupFileDTO[]>>;

const makeBackupApi = (base: string) => ({
  list: async (): Promise<BackupsPorTier> => {
    const res = await api.get<BackupsPorTier>(base);
    return res.data;
  },

  status: async (): Promise<BackupStatusDTO> => {
    const res = await api.get<BackupStatusDTO>(`${base}/status`);
    return res.data;
  },

  run: async (): Promise<{ mensaje: string }> => {
    const res = await api.post<{ mensaje: string }>(`${base}/run`);
    return res.data;
  },

  remove: async (tier: AnyBackupTier, nombre: string): Promise<void> => {
    await api.delete(`${base}/${tier}/${encodeURIComponent(nombre)}`);
  },

  // La auth es Bearer header, así que no podemos usar un <a href> directo:
  // descargamos como blob y forzamos la descarga en el navegador.
  download: async (tier: AnyBackupTier, nombre: string): Promise<void> => {
    const res = await api.get(`${base}/download/${tier}/${encodeURIComponent(nombre)}`, {
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
});

export type BackupApiClient = ReturnType<typeof makeBackupApi>;

/** Backups de base de datos (contrato original). */
export const backupApi = makeBackupApi('/api/backups');
/** Backups de documentos subidos por usuarios (legajos, entregas, etc.). */
export const backupFilesApi = makeBackupApi('/api/backups/archivos');
