import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { amortizacionApi } from '../../../api/services/amortizacionApi';
import type { ActivoAmortizableDTO, TipoActivoAmortizable, MetodoAmortizacion } from '../../../types';
import ActivoFormDialog from './components/ActivoFormDialog';

const TIPO_LABEL: Record<TipoActivoAmortizable, string> = {
  VEHICULO: 'Vehículo',
  HERRAMIENTAS: 'Herramientas',
  INFRAESTRUCTURA: 'Infraestructura',
  MATERIA_PRIMA: 'Materia prima',
  AGUINALDOS: 'Aguinaldos',
  DESEMPLEO: 'Desempleo',
  OTRO: 'Otro',
};

const METODO_LABEL: Record<MetodoAmortizacion, string> = {
  PORCENTAJE_FIJO: 'Porcentaje fijo',
  POR_KILOMETROS: 'Por km',
  MONTO_FIJO_MENSUAL: 'Monto fijo',
};

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function fmt(n: number): string {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function AmortizacionesPage() {
  const navigate = useNavigate();
  const [activos, setActivos] = useState<ActivoAmortizableDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedActivo, setSelectedActivo] = useState<ActivoAmortizableDTO | null>(null);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; activo: ActivoAmortizableDTO | null }>({ open: false, activo: null });
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Navigate to month
  const [navAnio, setNavAnio] = useState(CURRENT_YEAR);
  const [navMes, setNavMes] = useState(CURRENT_MONTH);

  const loadActivos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await amortizacionApi.getActivos();
      setActivos(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al cargar los activos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadActivos(); }, [loadActivos]);

  const handleEdit = (activo: ActivoAmortizableDTO) => {
    setSelectedActivo(activo);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.activo) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await amortizacionApi.deleteActivo(deleteDialog.activo.id);
      setDeleteDialog({ open: false, activo: null });
      loadActivos();
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message ?? 'Error al desactivar el activo');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <ReceiptLongIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Activos Amortizables</Typography>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setFormMode('create'); setSelectedActivo(null); setFormOpen(true); }}
        >
          Nuevo activo
        </Button>

        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel>Año</InputLabel>
            <Select label="Año" value={navAnio} onChange={(e) => setNavAnio(Number(e.target.value))}>
              {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Mes</InputLabel>
            <Select label="Mes" value={navMes} onChange={(e) => setNavMes(Number(e.target.value))}>
              {MONTHS.map((m) => <MenuItem key={m} value={m}>{MONTH_NAMES[m - 1]}</MenuItem>)}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<CalendarMonthIcon />}
            onClick={() => navigate(`/admin/amortizaciones/${navAnio}/${navMes}`)}
          >
            Ver registro del mes
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Método</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Valor inicial ($)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha adquisición</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={2}>No hay activos registrados</Typography>
                  </TableCell>
                </TableRow>
              )}
              {activos.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    {a.nombre}
                    {a.vehiculoPatente && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {a.vehiculoPatente}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{TIPO_LABEL[a.tipo]}</TableCell>
                  <TableCell>
                    {METODO_LABEL[a.metodo]}
                    {a.metodo === 'PORCENTAJE_FIJO' && a.tasaMensual != null && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {a.tasaMensual}% mensual
                      </Typography>
                    )}
                    {a.metodo === 'MONTO_FIJO_MENSUAL' && a.montoFijoMensual != null && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        ${fmt(a.montoFijoMensual)}/mes
                      </Typography>
                    )}
                    {a.metodo === 'POR_KILOMETROS' && a.vidaUtilKm != null && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Intl.NumberFormat('es-AR').format(a.vidaUtilKm)} km vida útil
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">${fmt(a.valorInicial)}</TableCell>
                  <TableCell>{a.fechaAdquisicion}</TableCell>
                  <TableCell>
                    <Chip
                      label={a.activo ? 'Activo' : 'Inactivo'}
                      color={a.activo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleEdit(a)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {a.activo && (
                      <Tooltip title="Desactivar">
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, activo: a })}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ActivoFormDialog
        open={formOpen}
        mode={formMode}
        activo={selectedActivo}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); loadActivos(); }}
      />

      <Dialog open={deleteDialog.open} onClose={() => !deleting && setDeleteDialog({ open: false, activo: null })}>
        <DialogTitle>Desactivar activo</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Desactivar el activo <strong>{deleteDialog.activo?.nombre}</strong>?
            Las amortizaciones históricas se conservarán.
          </Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, activo: null })} disabled={deleting}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Desactivando...' : 'Desactivar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
