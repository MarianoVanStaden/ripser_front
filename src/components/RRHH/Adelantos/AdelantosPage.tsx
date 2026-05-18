import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Stack, IconButton, Tooltip, Chip, Alert, FormControl, InputLabel, Select, MenuItem,
  Autocomplete, useMediaQuery, useTheme, Tabs, Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payments as PaymentsIcon,
  Payment as PaymentIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { adelantoApi } from '../../../api/services/adelantoApi';
import { employeeApi } from '../../../api/services/employeeApi';
import type { Adelanto, AdelantoCreateDTO, Empleado } from '../../../types';
import LoadingOverlay from '../../common/LoadingOverlay';
import AdelantoFormDialog from './AdelantoFormDialog';
import PagoAdelantoDialog from './PagoAdelantoDialog';
import PagoMasivoAdelantosPage from './PagoMasivoAdelantosPage';

type TabKey = 'listado' | 'pago-masivo';
type EstadoFilter = 'TODOS' | 'PENDIENTE' | 'PAGADO';

const pathToTab = (pathname: string): TabKey => {
  if (pathname.endsWith('/pago-masivo')) return 'pago-masivo';
  return 'listado';
};
const tabToPath = (tab: TabKey): string => {
  switch (tab) {
    case 'pago-masivo': return '/rrhh/adelantos/pago-masivo';
    default:            return '/rrhh/adelantos';
  }
};

const AdelantosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const tab: TabKey = pathToTab(location.pathname);
  const handleTabChange = (_: React.SyntheticEvent, value: TabKey) => navigate(tabToPath(value));

  const [adelantos, setAdelantos] = useState<Adelanto[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [empleadoFilter, setEmpleadoFilter] = useState<Empleado | null>(null);
  const [periodoFilter, setPeriodoFilter] = useState<string>(dayjs().format('YYYY-MM'));
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('TODOS');

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Adelanto | null>(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [selected, setSelected] = useState<Adelanto | null>(null);

  const [openPago, setOpenPago] = useState(false);
  const [pagoTarget, setPagoTarget] = useState<Adelanto | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [a, e] = await Promise.all([adelantoApi.getAll(), employeeApi.getAllList()]);
      setAdelantos(Array.isArray(a) ? a : []);
      setEmpleados(Array.isArray(e) ? e : []);
    } catch (err) {
      console.error('Error cargando adelantos:', err);
      setError('Error al cargar los adelantos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => adelantos.filter(a => {
    const okEmp = !empleadoFilter || a.empleadoId === empleadoFilter.id;
    const okPer = !periodoFilter || a.periodo === periodoFilter;
    const okEstado = estadoFilter === 'TODOS'
      || (estadoFilter === 'PENDIENTE' && !a.fechaPago)
      || (estadoFilter === 'PAGADO' && !!a.fechaPago);
    return okEmp && okPer && okEstado;
  }), [adelantos, empleadoFilter, periodoFilter, estadoFilter]);

  const totalFiltrado = filtered.reduce((s, a) => s + Number(a.monto || 0), 0);
  const totalPendiente = filtered.filter(a => !a.fechaPago).reduce((s, a) => s + Number(a.monto || 0), 0);
  const cantPendientes = filtered.filter(a => !a.fechaPago).length;

  const handleSubmit = async (dto: AdelantoCreateDTO) => {
    try {
      if (editing) {
        await adelantoApi.update(editing.id, dto);
      } else {
        await adelantoApi.create(dto);
      }
      setOpenForm(false);
      setEditing(null);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar el adelanto');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await adelantoApi.delete(selected.id);
      setOpenDelete(false);
      setSelected(null);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al eliminar el adelanto');
    }
  };

  const getEmpleadoNombre = (a: Adelanto): string => {
    if (a.empleadoNombre || a.empleadoApellido) {
      return `${a.empleadoApellido ?? ''}, ${a.empleadoNombre ?? ''}`.replace(/^,\s*/, '').trim();
    }
    const emp = empleados.find(e => e.id === a.empleadoId);
    return emp ? `${emp.apellido}, ${emp.nombre}` : `Empleado #${a.empleadoId}`;
  };

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading && tab === 'listado'} message="Cargando adelantos..." />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight={700} color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Adelantos de Sueldo
        </Typography>
        {tab === 'listado' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditing(null); setOpenForm(true); }}
            fullWidth={isMobile}
          >
            Nuevo Adelanto
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<ReceiptIcon />} iconPosition="start" label="Adelantos" value="listado" />
          <Tab icon={<PlaylistAddCheckIcon />} iconPosition="start" label="Pago masivo" value="pago-masivo" />
        </Tabs>
      </Paper>

      {tab === 'pago-masivo' && <PagoMasivoAdelantosPage embedded />}

      {tab === 'listado' && (<>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }} mb={3}>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main', boxShadow: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {filtered.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Adelantos en filtro
                  </Typography>
                </Box>
                <PaymentsIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main', boxShadow: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    ${totalFiltrado.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total adelantado
                  </Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main', boxShadow: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight={700} color="warning.main">
                    ${totalPendiente.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pendiente de pago
                  </Typography>
                </Box>
                <PaymentIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'success.main', boxShadow: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {cantPendientes}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Adelantos pendientes
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={empleados}
                getOptionLabel={(e) => `${e.nombre} ${e.apellido}`}
                value={empleadoFilter}
                onChange={(_, v) => setEmpleadoFilter(v)}
                renderInput={(p) => <TextField {...p} label="Empleado" size="small" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="month"
                label="Período"
                value={periodoFilter}
                onChange={(e) => setPeriodoFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Vacío = todos los períodos"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  label="Estado"
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)}
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="PENDIENTE">Pendientes</MenuItem>
                  <MenuItem value="PAGADO">Pagados</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Empleado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Período</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Fecha carga</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Monto</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Observaciones</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">No hay adelantos en el filtro</Typography>
                    </TableCell>
                  </TableRow>
                ) : filtered.map(a => (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {getEmpleadoNombre(a)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={<CalendarIcon />}
                        label={dayjs(a.periodo).format('MMMM YYYY')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">{dayjs(a.fecha).format('DD/MM/YYYY')}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="error.main">
                        ${Number(a.monto).toLocaleString('es-AR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {a.fechaPago ? (
                        <Chip
                          icon={<PaymentIcon />}
                          label={`Pagado ${dayjs(a.fechaPago).format('DD/MM/YYYY')}`}
                          size="small"
                          color="success"
                        />
                      ) : (
                        <Chip label="Pendiente" size="small" color="warning" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 220 }}>
                        {a.observaciones ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {!a.fechaPago && (
                          <Tooltip title="Pagar adelanto (multi-cuenta)">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => { setPagoTarget(a); setOpenPago(true); }}
                            >
                              <PaymentsIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Editar">
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={!!a.fechaPago}
                              onClick={() => { setEditing(a); setOpenForm(true); }}
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={a.fechaPago ? 'No se puede eliminar un adelanto ya pagado' : 'Eliminar'}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={!!a.fechaPago}
                              onClick={() => { setSelected(a); setOpenDelete(true); }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      </>)}

      <AdelantoFormDialog
        open={openForm}
        empleados={empleados}
        editing={editing}
        onClose={() => { setOpenForm(false); setEditing(null); }}
        onSubmit={handleSubmit}
      />

      <PagoAdelantoDialog
        open={openPago}
        adelanto={pagoTarget}
        onClose={() => { setOpenPago(false); setPagoTarget(null); }}
        onSuccess={async () => {
          setOpenPago(false);
          setPagoTarget(null);
          await loadData();
        }}
      />

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>Confirmar Eliminación</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">
            ¿Eliminar este adelanto? Esta acción no se puede deshacer.
          </Typography>
          {selected && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2"><strong>Empleado:</strong> {getEmpleadoNombre(selected)}</Typography>
              <Typography variant="body2"><strong>Período:</strong> {dayjs(selected.periodo).format('MMMM YYYY')}</Typography>
              <Typography variant="body2"><strong>Monto:</strong> ${Number(selected.monto).toLocaleString('es-AR')}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenDelete(false)}>Cancelar</Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdelantosPage;
