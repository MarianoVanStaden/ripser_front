import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import StorageIcon from '@mui/icons-material/Storage';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DnsIcon from '@mui/icons-material/Dns';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import {
  backupApi,
  backupFilesApi,
  type AnyBackupTier,
  type BackupApiClient,
  type BackupFileDTO,
  type EstadoBackup,
} from '../../../api/services/backupApi';

type TipoBackup = 'db' | 'archivos';

const DB_TIERS: { code: AnyBackupTier; label: string }[] = [
  { code: 'hourly', label: 'Horarios' },
  { code: 'weekly', label: 'Semanales' },
  { code: 'monthly', label: 'Mensuales' },
  { code: 'yearly', label: 'Anuales' },
];

const FILE_TIERS: { code: AnyBackupTier; label: string }[] = [
  { code: 'daily', label: 'Diarios' },
  { code: 'weekly', label: 'Semanales' },
  { code: 'monthly', label: 'Mensuales' },
];

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

interface BackupPanelProps {
  api: BackupApiClient;
  tiers: { code: AnyBackupTier; label: string }[];
  defaultTab: AnyBackupTier;
}

function BackupPanel({ api, tiers, defaultTab }: BackupPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [tab, setTab] = useState<AnyBackupTier>(defaultTab);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<BackupFileDTO | null>(null);

  const queryClient = useQueryClient();
  const backupsQuery = useQuery({
    queryKey: ['backups', defaultTab],
    queryFn: async () => {
      const [st, list] = await Promise.all([api.status(), api.list()]);
      return { status: st, backups: list };
    },
    // Polling automático mientras hay un backup en progreso (reemplaza el setInterval).
    refetchInterval: (query) =>
      (query.state.data?.status?.estadoUltimo === 'EN_PROGRESO') ? 5000 : false,
  });
  const status = backupsQuery.data?.status ?? null;
  const backups = backupsQuery.data?.backups ?? {};
  const loading = backupsQuery.isPending;
  const loadError = backupsQuery.error
    ? 'No se pudieron cargar los backups. Verificá tus permisos y la conexión.'
    : null;
  const load = () => queryClient.invalidateQueries({ queryKey: ['backups', defaultTab] });

  const runMutation = useMutation({
    mutationFn: () => api.run(),
    onSuccess: (res) => {
      setInfo(res.mensaje ?? 'Backup solicitado.');
      setTimeout(() => { void load(); }, 2000);
    },
    onError: (err) => {
      console.error('Error solicitando backup:', err);
      setError('No se pudo solicitar el backup.');
    },
  });
  const running = runMutation.isPending;
  const handleRun = () => {
    setError(null);
    setInfo(null);
    runMutation.mutate();
  };

  const handleDownload = async (b: BackupFileDTO) => {
    const key = `${b.tier}/${b.nombre}`;
    setDownloading(key);
    setError(null);
    try {
      await api.download(b.tier, b.nombre);
    } catch (err) {
      console.error('Error descargando backup:', err);
      setError(`No se pudo descargar ${b.nombre}.`);
    } finally {
      setDownloading(null);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (b: BackupFileDTO) => api.remove(b.tier, b.nombre),
    onSuccess: (_data, b) => {
      setInfo(`Backup ${b.nombre} eliminado.`);
      setToDelete(null);
      load();
    },
    onError: (err, b) => {
      console.error('Error eliminando backup:', err);
      setError(`No se pudo eliminar ${b.nombre}.`);
    },
  });
  const deleting = deleteMutation.isPending;
  const handleDelete = () => {
    if (!toDelete) return;
    setError(null);
    deleteMutation.mutate(toDelete);
  };

  const enProgreso = status?.estadoUltimo === 'EN_PROGRESO';
  const resumenTier = status?.tiers?.find((t) => t.tier === tab);
  const filasTier = backups[tab] ?? [];

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
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

      {(error || loadError) && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error || loadError}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo(null)}>{info}</Alert>}
      {status?.estadoUltimo === 'ERROR' && status.mensajeError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          La última corrida de backup falló: {status.mensajeError}
        </Alert>
      )}
      {status && !status.habilitado && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Los backups automáticos de esta sección están deshabilitados. Podés generar uno
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
          onChange={(_, v) => setTab(v as AnyBackupTier)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tiers.map((t) => {
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
    </>
  );
}

export default function BackupsPage() {
  const [tipo, setTipo] = useState<TipoBackup>('db');

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <BackupIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Backups</Typography>
        </Box>
        <ToggleButtonGroup
          value={tipo}
          exclusive
          size="small"
          onChange={(_, v: TipoBackup | null) => { if (v) setTipo(v); }}
        >
          <ToggleButton value="db">
            <DnsIcon fontSize="small" sx={{ mr: 0.5 }} /> Base de datos
          </ToggleButton>
          <ToggleButton value="archivos">
            <FolderZipIcon fontSize="small" sx={{ mr: 0.5 }} /> Documentos
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* key={tipo}: remonta el panel al cambiar de tipo para aislar estado y polling. */}
      {tipo === 'db' ? (
        <BackupPanel key="db" api={backupApi} tiers={DB_TIERS} defaultTab="hourly" />
      ) : (
        <BackupPanel key="archivos" api={backupFilesApi} tiers={FILE_TIERS} defaultTab="daily" />
      )}
    </Box>
  );
}
