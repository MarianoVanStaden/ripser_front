import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Stack, IconButton, Tooltip, Chip, Alert,
  Autocomplete, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  PictureAsPdf as PictureAsPdfIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { sueldoApi } from '../../api/services/sueldoApi';
import { employeeApi } from '../../api/services/employeeApi';
import { categoriaSalarialApi } from '../../api/services/categoriaSalarialApi';
import { bonoProduccionApi } from '../../api/services/bonoProduccionApi';
import { bonoVentasApi } from '../../api/services/bonoVentasApi';
import type {
  Sueldo, Empleado, CategoriaSalarial, BonoProduccionTabla, BonoVentasTabla,
} from '../../types';
import { CONCEPTO_SUELDO_LABELS } from '../../types/remuneraciones.types';
import LoadingOverlay from '../common/LoadingOverlay';
import SueldoFormDialog from './Sueldos/SueldoFormDialog';
import { generarReciboHaberesPDF } from '../../services/pdfService';

const SueldosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [sueldos, setSueldos] = useState<Sueldo[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [categorias, setCategorias] = useState<CategoriaSalarial[]>([]);
  const [bonosProduccion, setBonosProduccion] = useState<BonoProduccionTabla[]>([]);
  const [bonosVentas, setBonosVentas] = useState<BonoVentasTabla[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [empleadoFilter, setEmpleadoFilter] = useState<Empleado | null>(null);
  const [periodoFilter, setPeriodoFilter] = useState(dayjs().format('YYYY-MM'));

  // Dialogs
  const [openForm, setOpenForm] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selected, setSelected] = useState<Sueldo | null>(null);
  const [editingSueldo, setEditingSueldo] = useState<Sueldo | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sueldosResp, empleadosData, cats, bonosP, bonosV] = await Promise.all([
        sueldoApi.getAll(),
        employeeApi.getAllList(),
        categoriaSalarialApi.getAll().catch(() => []),
        bonoProduccionApi.getAll().catch(() => []),
        bonoVentasApi.getAll().catch(() => []),
      ]);

      // sueldoApi.getAll devuelve PageResponse<Sueldo> o array según servidor
      const rawSueldos: any[] = Array.isArray(sueldosResp)
        ? sueldosResp
        : (sueldosResp as any)?.content ?? [];

      // Enriquecer cada sueldo con el objeto empleado completo (la API devuelve
      // empleadoId + empleadoNombre/Apellido). El form/detalle usa s.empleado.
      const sueldosEnriquecidos: Sueldo[] = rawSueldos.map((s: any) => {
        const empleado = Array.isArray(empleadosData)
          ? empleadosData.find((e: any) => e.id === s.empleadoId)
          : undefined;
        return {
          ...s,
          empleado: empleado || ({
            id: s.empleadoId,
            nombre: s.empleadoNombre || '',
            apellido: s.empleadoApellido || '',
            dni: s.empleadoDni || '',
          } as Empleado),
        };
      });

      setSueldos(sueldosEnriquecidos);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
      setCategorias(Array.isArray(cats) ? cats : []);
      setBonosProduccion(Array.isArray(bonosP) ? bonosP : []);
      setBonosVentas(Array.isArray(bonosV) ? bonosV : []);
    } catch (err) {
      console.error('Error loading sueldos:', err);
      setError('Error al cargar los datos');
      setSueldos([]);
      setEmpleados([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getEmpleadoNombre = (empleado: Empleado | null | undefined) => {
    if (!empleado) return 'N/A';
    return `${empleado.nombre ?? ''} ${empleado.apellido ?? ''}`.trim();
  };

  const filteredSueldos = useMemo(() => sueldos.filter(s => {
    if (!s.empleado) return false;
    const okEmp = !empleadoFilter || s.empleado.id === empleadoFilter.id;
    const okPer = !periodoFilter || s.periodo === periodoFilter;
    const okSearch = !searchTerm ||
      getEmpleadoNombre(s.empleado).toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.periodo.includes(searchTerm);
    return okEmp && okPer && okSearch;
  }), [sueldos, empleadoFilter, periodoFilter, searchTerm]);

  const handleSubmitSueldo = async (payload: any) => {
    if (editingSueldo) {
      await sueldoApi.update(editingSueldo.id, payload);
    } else {
      await sueldoApi.create(payload);
    }
    setOpenForm(false);
    setEditingSueldo(null);
    await loadData();
  };

  const handleDeleteSueldo = async () => {
    if (!selected) return;
    try {
      await sueldoApi.delete(selected.id);
      await loadData();
      setOpenDelete(false);
      setSelected(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al eliminar el sueldo');
    }
  };

  const handleExportarRecibo = (sueldo: Sueldo) => {
    const empleado = sueldo.empleado ?? empleados.find(e => e.id === sueldo.empleadoId);
    if (!empleado) {
      setError('No se encontró el empleado del sueldo para generar el recibo');
      return;
    }
    const categoria = sueldo.categoriaSalarialId
      ? categorias.find(c => c.id === sueldo.categoriaSalarialId) ?? null
      : null;
    try {
      generarReciboHaberesPDF({ sueldo, empleado, categoria });
    } catch (err: any) {
      console.error('Error generando recibo:', err);
      setError('Error al generar el recibo PDF');
    }
  };

  // KPIs
  const totalSueldosNeto = filteredSueldos.reduce((sum, s) => sum + Number(s.sueldoNeto || 0), 0);
  const totalBruto = filteredSueldos.reduce((sum, s) => sum + Number(s.totalBruto || 0), 0);
  const totalDescuentos = filteredSueldos.reduce((sum, s) => sum + Number(s.totalDescuentos || 0), 0);

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Cargando sueldos..." />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight={700} color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Gestión de Sueldos
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} width={isMobile ? '100%' : 'auto'}>
          <Button
            variant="outlined"
            startIcon={<PlaylistAddCheckIcon />}
            onClick={() => navigate('/rrhh/sueldos/liquidacion-masiva')}
            size={isMobile ? 'medium' : 'large'}
            fullWidth={isMobile}
          >
            Liquidar mes (masivo)
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditingSueldo(null); setOpenForm(true); }}
            size={isMobile ? 'medium' : 'large'}
            fullWidth={isMobile}
          >
            Nuevo Sueldo
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {categorias.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Aún no hay categorías salariales configuradas. Andá a <strong>RRHH → Config. Sueldos</strong> para crearlas antes de liquidar.
        </Alert>
      )}

      {/* KPIs */}
      <Grid container spacing={{ xs: 2, sm: 3 }} mb={3}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'success.main', boxShadow: 2 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 0 }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {filteredSueldos.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Sueldos Registrados</Typography>
                </Box>
                <ReceiptIcon sx={{ fontSize: { xs: 32, sm: 48 }, color: 'success.main', opacity: 0.3, display: { xs: 'none', sm: 'block' } }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main', boxShadow: 2 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 0 }}>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                    ${totalBruto.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Total Bruto</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: { xs: 32, sm: 48 }, color: 'primary.main', opacity: 0.3, display: { xs: 'none', sm: 'block' } }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main', boxShadow: 2 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 0 }}>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="error.main" sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                    ${totalDescuentos.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Total Descuentos</Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: { xs: 32, sm: 48 }, color: 'error.main', opacity: 0.3, display: { xs: 'none', sm: 'block' } }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main', boxShadow: 2 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 0 }}>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="warning.main" sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                    ${totalSueldosNeto.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Total Neto</Typography>
                </Box>
                <AccountBalanceIcon sx={{ fontSize: { xs: 32, sm: 48 }, color: 'warning.main', opacity: 0.3, display: { xs: 'none', sm: 'block' } }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" label="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Empleado o período..."
              />
            </Grid>
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
              <TextField fullWidth size="small" type="month" label="Período"
                value={periodoFilter}
                onChange={(e) => setPeriodoFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 1000, md: 'auto' } }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Empleado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Categoría</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Período</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Bruto</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Descuentos</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Neto</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Estado Pago</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSueldos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary">No hay sueldos registrados</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredSueldos.map(sueldo => (
                  <TableRow key={sueldo.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{getEmpleadoNombre(sueldo.empleado)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {sueldo.categoriaSalarialNombre ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip icon={<CalendarIcon />} label={dayjs(sueldo.periodo).format('MMMM YYYY')}
                        size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        ${Number(sueldo.totalBruto || 0).toLocaleString('es-AR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500} color="error.main">
                        ${Number(sueldo.totalDescuentos || 0).toLocaleString('es-AR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="success.main">
                        ${Number(sueldo.sueldoNeto || 0).toLocaleString('es-AR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {sueldo.fechaPago ? (
                        <Chip icon={<PaymentIcon />} label={`Pagado ${dayjs(sueldo.fechaPago).format('DD/MM/YYYY')}`}
                          size="small" color="success" />
                      ) : (
                        <Chip label="Pendiente" size="small" color="warning" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Ver Detalle">
                          <IconButton size="small" color="info" onClick={() => { setSelected(sueldo); setOpenDetail(true); }}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Descargar Recibo PDF">
                          <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => handleExportarRecibo(sueldo)}>
                            <PictureAsPdfIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary" onClick={() => { setEditingSueldo(sueldo); setOpenForm(true); }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => { setSelected(sueldo); setOpenDelete(true); }}>
                            <DeleteIcon />
                          </IconButton>
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

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        {selected && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <MoneyIcon />
                <Typography variant="h6" fontWeight={600}>
                  Detalle de Sueldo — {getEmpleadoNombre(selected.empleado)}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight={600}>
                        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> General
                      </Typography>
                      <Stack spacing={1.5}>
                        <DetailRow label="Empleado" value={getEmpleadoNombre(selected.empleado)} />
                        <DetailRow label="Categoría" value={selected.categoriaSalarialNombre ?? '—'} />
                        <DetailRow label="Período" value={dayjs(selected.periodo).format('MMMM YYYY')} />
                        <DetailRow label="Concepto" value={selected.concepto ? CONCEPTO_SUELDO_LABELS[selected.concepto] : 'Salario'} />
                        {selected.fechaPago && <DetailRow label="Fecha de Pago" value={dayjs(selected.fechaPago).format('DD/MM/YYYY')} />}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight={600}>
                        <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Haberes
                      </Typography>
                      <Stack spacing={1}>
                        <DetailMoney label="Sueldo Básico"     value={selected.sueldoBasico} />
                        <DetailMoney label={`Presentismo (${selected.presentismoPct ?? 100}%)`} value={selected.presentismoMonto ?? 0} />
                        <DetailMoney label="Horas Extra"       value={selected.horasExtras} />
                        <DetailMoney label="Bono Producción"   value={selected.bonoProduccion ?? 0} />
                        <DetailMoney label="Bono Ventas"       value={selected.bonoVentas ?? 0} />
                        <DetailMoney label="Bono Especial"     value={selected.bonoEspecial ?? 0} />
                        <DetailMoney label="Bonificaciones"    value={selected.bonificaciones} />
                        <DetailMoney label="Comisiones"        value={selected.comisiones} />
                        <DetailMoney label="Reintegro KM"      value={selected.kmMonto ?? 0} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" color="error" gutterBottom fontWeight={600}>
                        <TrendingDownIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Descuentos
                      </Typography>
                      <Stack spacing={1}>
                        <DetailMoney label="Descuentos Legales" value={selected.descuentosLegales} negative />
                        <DetailMoney label="Otros Descuentos"   value={selected.descuentosOtros} negative />
                        <DetailMoney label="Horas Ausente"      value={selected.horasAusenteMonto ?? 0} negative />
                        <DetailMoney label="Adelantos"          value={selected.adelantos ?? 0} negative />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'success.lighter' }}>
                    <CardContent>
                      <Typography variant="h6" color="success.dark" gutterBottom fontWeight={600}>
                        <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Resumen
                      </Typography>
                      <Stack spacing={1.5}>
                        <DetailMoney label="Total Bruto"      value={selected.totalBruto} bold />
                        <DetailMoney label="Total Descuentos" value={selected.totalDescuentos} bold negative />
                        <Box display="flex" justifyContent="space-between" pt={1} borderTop={1} borderColor="divider">
                          <Typography variant="h6" fontWeight={700}>Sueldo Neto</Typography>
                          <Typography variant="h6" fontWeight={700} color="success.main">
                            ${Number(selected.sueldoNeto || 0).toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {selected.observaciones && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="textSecondary" fontWeight={600} textTransform="uppercase" gutterBottom>
                          Observaciones
                        </Typography>
                        <Typography variant="body2">{selected.observaciones}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={() => handleExportarRecibo(selected)}>
                Descargar Recibo
              </Button>
              <Button variant="contained" onClick={() => setOpenDetail(false)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Form Dialog */}
      <SueldoFormDialog
        open={openForm}
        empleados={empleados}
        categorias={categorias}
        bonosProduccion={bonosProduccion}
        bonosVentas={bonosVentas}
        editing={editingSueldo}
        onClose={() => { setOpenForm(false); setEditingSueldo(null); }}
        onSubmit={handleSubmitSueldo}
      />

      {/* Delete Confirmation */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>Confirmar Eliminación</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">¿Está seguro que desea eliminar este registro de sueldo?</Typography>
          {selected && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2"><strong>Empleado:</strong> {getEmpleadoNombre(selected.empleado)}</Typography>
              <Typography variant="body2"><strong>Período:</strong> {dayjs(selected.periodo).format('MMMM YYYY')}</Typography>
              <Typography variant="body2"><strong>Sueldo Neto:</strong> ${Number(selected.sueldoNeto || 0).toLocaleString('es-AR')}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenDelete(false)}>Cancelar</Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteSueldo}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="textSecondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
    <Typography variant="body1" sx={{ mt: 0.5 }}>{value}</Typography>
  </Box>
);

const DetailMoney: React.FC<{ label: string; value: number | undefined | null; negative?: boolean; bold?: boolean }> =
  ({ label, value, negative, bold }) => {
    const n = Number(value || 0);
    if (n === 0) return null;
    return (
      <Box display="flex" justifyContent="space-between">
        <Typography variant="body2" color="textSecondary" fontWeight={600}>{label}</Typography>
        <Typography variant="body2" fontWeight={bold ? 700 : 500} color={negative ? 'error.main' : 'text.primary'}>
          {negative ? '-' : ''}${n.toLocaleString('es-AR')}
        </Typography>
      </Box>
    );
  };

export default SueldosPage;
