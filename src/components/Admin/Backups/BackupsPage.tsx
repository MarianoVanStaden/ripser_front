import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import StorageIcon from '@mui/icons-material/Storage';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
  backupApi,
  type BackupFileDTO,
  type BackupStatusDTO,
  type BackupsPorTier,
  type BackupTier,
  type EstadoBackup,
} from '../../../api/services/backupApi';

const TIERS: { code: BackupTier; label: string }[] = [
  { code: 'hourly', label: 'Horarios' },
  { code: 'weekly', label: 'Semanales' },
  { code: 'monthly', label: 'Mensuales' },
  { code: 'yearly', label: 'Anuales' },
];

const EMPTY: BackupsPorTier = { hourly: [], weekly: [], monthly: [], yearly: [] };

const formatFecha = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-AR');
};

const estadoChip = (estado: EstadoBackup) => {
  switch (estado) {
    case 'OK':
      return <Chip label="OK" color="success" size="small" />;
    case 'ERROR':
      return <Chip label="Error" color="error" size="small" />;
    case 'EN_PROGRESO':
      return <Chip label="En progreso" color="warning" size="small" />;
    default:
      return <Chip label="Sin datos" size="small" />;
  }
};

interface StatCardProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}
function StatCard({ label, hint, children }: StatCardProps) {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Box sx={{ mt: 0.5 }}>{children}</Box>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
  );
}

export default function BackupsPage() {
  const [status, setStatus] = useState<BackupStatusDTO | null>(null);
  const [backups, setBackups] = useState<BackupsPorTier>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [tab, setTab] = useState<BackupTier>('hourly');
  const [running, setRunning] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<BackupFileDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [st, list] = await Promise.all([backupApi.status(), backupApi.list()]);
      setStatus(st);
      setBackups({ ...EMPTY, ...list });
    } catch (err) {
      console.error('Error cargando backups:', err);
      setError('No se pudieron cargar los backups. Verificá tus permisos y la conexión.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling mientras hay un backup en progreso.
  useEffect(() => {
    const enProgreso = status?.estadoUltimo === 'EN_PROGRESO';
    if (enProgreso && !pollRef.current) {
      pollRef.current = setInterval(() => { void load(true); }, 5000);
    } else if (!enProgreso && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [status?.estadoUltimo, load]);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setInfo(null);
    try {
      const res = await backupApi.run();
      setInfo(res.mensaje ?? 'Backup solicitado.');
      setTimeout(() => { void load(true); }, 2000);
    } catch (err) {
      console.error('Error solicitando backup:', err);
      setError('No se pudo solicitar el backup.');
    } finally {
      setRunning(false);
    }
  };

  const handleDownload = async (b: BackupFileDTO) => {
    const key = `${b.tier}/${b.nombre}`;
    setDownloading(key);
    setError(null);
    try {
      await backupApi.download(b.tier, b.nombre);
    } catch (err) {
      console.error('Error descargando backup:', err);
      setError(`No se pudo descargar ${b.nombre}.`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await backupApi.remove(toDelete.tier, toDelete.nombre);
      setInfo(`Backup ${toDelete.nombre} eliminado.`);
      setToDelete(null);
      await load(true);
    } catch (err) {
      console.error('Error eliminando backup:', err);
      setError(`No se pudo eliminar ${toDelete.nombre}.`);
    } finally {
      setDeleting(false);
    }
  };

  const enProgreso = status?.estadoUltimo === 'EN_PROGRESO';
  const resumenTier = status?.tiers?.find((t) => t.tier === tab);
  const filasTier = backups[tab] ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <BackupIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Backups de base de datos</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => load()} disabled={loading}>
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={running || enProgreso ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleRun}
            disabled={running || enProgreso}
          >
            {enProgreso ? 'Generando…' : 'Realizar Backup Ahora'}
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo(null)}>{info}</Alert>}
      {status?.estadoUltimo === 'ERROR' && status.mensajeError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          La última corrida de backup falló: {status.mensajeError}
        </Alert>
      )}
      {status && !status.habilitado && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Los backups automáticos están deshabilitados (BACKUP_ENABLED=false). Podés generar uno
          manualmente con "Realizar Backup Ahora".
        </Alert>
      )}

      {/* Tarjetas de estado overall */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Último backup">
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                {formatFecha(status?.ultimoBackup?.fechaCreacion ?? null)}
              </Typography>
              <Box>{status ? estadoChip(status.estadoUltimo) : null}</Box>
            </Stack>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Próxima ejecución"
            hint={status ? `Cada ${status.intervalo}` : undefined}
          >
            <Typography variant="h6" fontWeight={700}>
              {formatFecha(status?.proximaEjecucion ?? null)}
            </Typography>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Backups almacenados">
            <Typography variant="h6" fontWeight={700}>{status?.cantidadBackups ?? 0}</Typography>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Almacenamiento total">
            <Stack direction="row" alignItems="center" spacing={1}>
              <StorageIcon fontSize="small" color="action" />
              <Typography variant="h6" fontWeight={700}>
                {status?.espacioOcupadoLegible ?? '—'}
              </Typography>
            </Stack>
          </StatCard>
        </Grid>
      </Grid>

      {/* Tabs por tier (GFS) */}
      <Paper sx={{ mb: 0 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as BackupTier)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TIERS.map((t) => {
            const r = status?.tiers?.find((s) => s.tier === t.code);
            const count = r?.cantidad ?? backups[t.code]?.length ?? 0;
            return (
              <Tab
                key={t.code}
                value={t.code}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{t.label}</span>
                    <Chip label={count} size="small" />
                  </Stack>
                }
              />
            );
          })}
        </Tabs>
      </Paper>

      {resumenTier && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, mb: 1 }}>
          Retención: <strong>{resumenTier.retencion}</strong> · {resumenTier.cantidad} backups · {resumenTier.espacioLegible}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Archivo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Tamaño</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center"><CircularProgress size={24} /></TableCell>
              </TableRow>
            ) : filasTier.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No hay backups en este nivel todavía.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filasTier.map((b) => {
                const key = `${b.tier}/${b.nombre}`;
                return (
                  <TableRow key={key} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{b.nombre}</TableCell>
                    <TableCell>{formatFecha(b.fechaCreacion)}</TableCell>
                    <TableCell align="right">{b.tamanioLegible}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Descargar">
                        <span>
                          <IconButton size="small" onClick={() => handleDownload(b)} disabled={downloading === key}>
                            {downloading === key ? <CircularProgress size={18} /> : <DownloadIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => setToDelete(b)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirmación de borrado */}
      <Dialog open={!!toDelete} onClose={() => !deleting && setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar backup</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro que querés eliminar <strong>{toDelete?.nombre}</strong>? Esta acción no se
            puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)} disabled={deleting}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
