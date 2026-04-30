import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import EditIcon from '@mui/icons-material/Edit';
import PaymentsIcon from '@mui/icons-material/Payments';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import SavingsIcon from '@mui/icons-material/Savings';
import SettingsIcon from '@mui/icons-material/Settings';
import { provisionApi } from '../../../api/services/provisionApi';
import { tipoProvisionApi } from '../../../api/services/tipoProvisionApi';
import type { ProvisionMensualDTO, TipoProvisionDTO } from '../../../types';
import GuardarProvisionDialog from './components/GuardarProvisionDialog';
import RegistrarPagoDialog from './components/RegistrarPagoDialog';

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function fmt(n: number): string {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function SaldoChip({ value }: { value: number }) {
  const color = value === 0 ? 'success' : value > 0 ? 'warning' : 'error';
  return (
    <Chip
      label={`$${fmt(value)}`}
      color={color}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
}

export default function ProvisionesPage() {
  const { anio: anioParam, mes: mesParam } = useParams<{ anio: string; mes: string }>();
  const navigate = useNavigate();

  const [anio, setAnio] = useState(anioParam ? Number(anioParam) : CURRENT_YEAR);
  const [mes, setMes] = useState(mesParam ? Number(mesParam) : CURRENT_MONTH);

  const [tipos, setTipos] = useState<TipoProvisionDTO[]>([]);
  const [provisiones, setProvisiones] = useState<ProvisionMensualDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [guardarDialog, setGuardarDialog] = useState<{
    open: boolean;
    tipo: TipoProvisionDTO | null;
    existing: ProvisionMensualDTO | null;
  }>({ open: false, tipo: null, existing: null });

  const [pagoDialog, setPagoDialog] = useState<{
    open: boolean;
    tipo: TipoProvisionDTO | null;
  }>({ open: false, tipo: null });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tiposData, provisionesData] = await Promise.all([
        tipoProvisionApi.list(),
        provisionApi.getByMes(anio, mes),
      ]);
      setTipos(tiposData);
      setProvisiones(provisionesData);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al cargar las provisiones');
    } finally {
      setLoading(false);
    }
  }, [anio, mes]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    navigate(`/admin/provisiones/${anio}/${mes}`, { replace: true });
  }, [anio, mes, navigate]);

  const provisionByTipoId = new Map<number, ProvisionMensualDTO>();
  provisiones.forEach((p) => provisionByTipoId.set(p.tipoId, p));

  // Show all active tipos + any inactive tipo that still has provisiones in this month
  // (admin may have deactivated mid-period — orphan data must remain auditable).
  const tiposVisibles = tipos.filter((t) => t.activo || provisionByTipoId.has(t.id));

  const handlePrev = () => {
    if (mes === 1) { setAnio((y) => y - 1); setMes(12); }
    else setMes((m) => m - 1);
  };

  const handleNext = () => {
    if (mes === 12) { setAnio((y) => y + 1); setMes(1); }
    else setMes((m) => m + 1);
  };

  const openGuardar = (tipo: TipoProvisionDTO) => {
    setGuardarDialog({ open: true, tipo, existing: provisionByTipoId.get(tipo.id) ?? null });
  };

  const openPago = (tipo: TipoProvisionDTO) => {
    setPagoDialog({ open: true, tipo });
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <SavingsIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Provisiones de RRHH</Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => navigate('/admin/tipos-provision')}
        >
          Gestionar tipos
        </Button>
      </Box>

      <Stack direction="row" spacing={1} alignItems="center" mb={3} flexWrap="wrap">
        <IconButton onClick={handlePrev} size="small">
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Mes</InputLabel>
          <Select label="Mes" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MONTHS.map((m) => (
              <MenuItem key={m} value={m}>{MONTH_NAMES[m]}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel>Año</InputLabel>
          <Select label="Año" value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>

        <IconButton onClick={handleNext} size="small">
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>

        <Typography variant="h6" fontWeight={600} sx={{ ml: 1 }}>
          {MONTH_NAMES[mes]} {anio}
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : tiposVisibles.length === 0 ? (
        <Alert severity="info" action={
          <Button size="small" onClick={() => navigate('/admin/tipos-provision')}>
            Crear tipos
          </Button>
        }>
          No hay tipos de provisión activos. Configurá al menos uno para empezar.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Patrimonio</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Provisionado ($)</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Acumulado período ($)</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Pagado ($)</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Saldo pendiente</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Observaciones</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tiposVisibles.map((tipo) => {
                const p = provisionByTipoId.get(tipo.id);
                return (
                  <TableRow key={tipo.id} hover sx={{ opacity: tipo.activo ? 1 : 0.7 }}>
                    <TableCell>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<BarChartIcon fontSize="small" />}
                        onClick={() => navigate(`/admin/provisiones/resumen/${tipo.id}/${anio}`)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        {tipo.nombre}
                      </Button>
                      {!tipo.activo && (
                        <Chip label="Inactivo" size="small" variant="outlined" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tipo.cuentaEnPatrimonio ? 'Sí' : 'No'}
                        size="small"
                        color={tipo.cuentaEnPatrimonio ? 'primary' : 'default'}
                        variant={tipo.cuentaEnPatrimonio ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {p ? `$${fmt(p.montoProvisionado)}` : <Typography color="text.disabled" variant="body2">—</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      {p ? `$${fmt(p.montoAcumuladoPeriodo)}` : <Typography color="text.disabled" variant="body2">—</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      {p ? `$${fmt(p.montoPagado)}` : <Typography color="text.disabled" variant="body2">—</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      {p ? <SaldoChip value={p.saldoPendiente} /> : <Typography color="text.disabled" variant="body2">—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                        {p?.observaciones ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={!tipo.activo ? 'Tipo inactivo' : p ? 'Editar provisión' : 'Registrar provisión'}>
                        <span>
                          <IconButton size="small" onClick={() => openGuardar(tipo)} disabled={!tipo.activo && !p}>
                            {p ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Registrar pago">
                        <span>
                          <IconButton size="small" color="success" onClick={() => openPago(tipo)} disabled={!tipo.activo && !p}>
                            <PaymentsIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {guardarDialog.tipo && (
        <GuardarProvisionDialog
          open={guardarDialog.open}
          tipoId={guardarDialog.tipo.id}
          tipoNombre={guardarDialog.tipo.nombre}
          anio={anio}
          mes={mes}
          existing={guardarDialog.existing}
          onClose={() => setGuardarDialog((s) => ({ ...s, open: false }))}
          onSaved={() => { setGuardarDialog((s) => ({ ...s, open: false })); load(); }}
        />
      )}

      {pagoDialog.tipo && (
        <RegistrarPagoDialog
          open={pagoDialog.open}
          tipoId={pagoDialog.tipo.id}
          tipoNombre={pagoDialog.tipo.nombre}
          anio={anio}
          mes={mes}
          onClose={() => setPagoDialog((s) => ({ ...s, open: false }))}
          onSaved={() => { setPagoDialog((s) => ({ ...s, open: false })); load(); }}
        />
      )}
    </Box>
  );
}
