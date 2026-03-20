import { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress, Alert,
  Button, Chip, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip, Snackbar, Stack,
  Menu, MenuItem, List, ListItem, ListItemText, ListItemIcon,
} from '@mui/material';
import {
  ArrowBack, Edit, Payment, Add, Send, CheckCircle,
  Phone, Email, WhatsApp, Videocam, PersonPin, Groups,
  Delete, Notifications, Receipt,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import { cuotaPrestamoApi } from '../../api/services/cuotaPrestamoApi';
import { seguimientoPrestamoApi } from '../../api/services/seguimientoPrestamoApi';
import { recordatorioCuotaApi } from '../../api/services/recordatorioCuotaApi';
import {
  ESTADO_PRESTAMO_LABELS, ESTADO_PRESTAMO_COLORS,
  CATEGORIA_PRESTAMO_LABELS, CATEGORIA_PRESTAMO_COLORS,
  ESTADO_CUOTA_LABELS, ESTADO_CUOTA_COLORS,
  TIPO_FINANCIACION_LABELS,
  TIPO_INTERACCION_PRESTAMO_LABELS,
  EstadoPrestamo, CategoriaPrestamo,
} from '../../types/prestamo.types';
import type {
  PrestamoPersonalDTO, CuotaPrestamoDTO,
  SeguimientoPrestamoDTO, RecordatorioCuotaDTO,
} from '../../types/prestamo.types';
import { formatPrice } from '../../utils/priceCalculations';
import { PrestamoFormDialog } from './PrestamoFormDialog';
import { RegistrarPagoDialog } from './RegistrarPagoDialog';
import { SeguimientoFormDialog } from './SeguimientoFormDialog';
import { RecordatorioFormDialog } from './RecordatorioFormDialog';

const TIPO_INTERACCION_ICONS: Record<string, React.ReactElement> = {
  LLAMADA: <Phone fontSize="small" />,
  EMAIL: <Email fontSize="small" />,
  WHATSAPP: <WhatsApp fontSize="small" />,
  REUNION: <Groups fontSize="small" />,
  VISITA: <PersonPin fontSize="small" />,
  VIDEOLLAMADA: <Videocam fontSize="small" />,
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

export const PrestamoDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const prestamoId = parseInt(id || '0');

  const [prestamo, setPrestamo] = useState<PrestamoPersonalDTO | null>(null);
  const [cuotas, setCuotas] = useState<CuotaPrestamoDTO[]>([]);
  const [seguimientos, setSeguimientos] = useState<SeguimientoPrestamoDTO[]>([]);
  const [recordatorios, setRecordatorios] = useState<RecordatorioCuotaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Dialogs
  const [editOpen, setEditOpen] = useState(false);
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState<CuotaPrestamoDTO | null>(null);
  const [seguimientoOpen, setSeguimientoOpen] = useState(false);
  const [recordatorioOpen, setRecordatorioOpen] = useState(false);
  const [recordatorioCuotaId, setRecordatorioCuotaId] = useState<number>(0);
  const [editingRecordatorio, setEditingRecordatorio] = useState<RecordatorioCuotaDTO | null>(null);

  // Estado/Categoria menus
  const [estadoAnchor, setEstadoAnchor] = useState<null | HTMLElement>(null);
  const [categoriaAnchor, setCategoriaAnchor] = useState<null | HTMLElement>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prestamoData, cuotasData, seguimientosData] = await Promise.all([
        prestamoPersonalApi.getById(prestamoId),
        cuotaPrestamoApi.getByPrestamo(prestamoId),
        seguimientoPrestamoApi.getByPrestamo(prestamoId),
      ]);
      setPrestamo(prestamoData);
      setCuotas(cuotasData);
      setSeguimientos(seguimientosData);

      // Load recordatorios for all cuotas
      const allRecordatorios: RecordatorioCuotaDTO[] = [];
      for (const cuota of cuotasData) {
        try {
          const recs = await recordatorioCuotaApi.getByCuota(cuota.id);
          allRecordatorios.push(...recs);
        } catch {
          // ignore individual errors
        }
      }
      setRecordatorios(allRecordatorios);
    } catch (err) {
      console.error('Error loading prestamo:', err);
      setError('Error al cargar el préstamo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prestamoId) loadData();
  }, [prestamoId]);

  const handleEstadoChange = async (estado: EstadoPrestamo) => {
    try {
      await prestamoPersonalApi.cambiarEstado(prestamoId, estado);
      setEstadoAnchor(null);
      setSnackbar({ open: true, message: 'Estado actualizado', severity: 'success' });
      loadData();
    } catch {
      setSnackbar({ open: true, message: 'Error al cambiar estado', severity: 'error' });
    }
  };

  const handleCategoriaChange = async (cat: CategoriaPrestamo) => {
    try {
      await prestamoPersonalApi.cambiarCategoria(prestamoId, cat);
      setCategoriaAnchor(null);
      setSnackbar({ open: true, message: 'Categoría actualizada', severity: 'success' });
      loadData();
    } catch {
      setSnackbar({ open: true, message: 'Error al cambiar categoría', severity: 'error' });
    }
  };

  const handleMarcarEnviado = async (recId: number) => {
    try {
      await recordatorioCuotaApi.marcarEnviado(recId);
      setSnackbar({ open: true, message: 'Recordatorio marcado como enviado', severity: 'success' });
      loadData();
    } catch {
      setSnackbar({ open: true, message: 'Error al marcar como enviado', severity: 'error' });
    }
  };

  const handleMarcarPagado = async (recId: number) => {
    try {
      const rec = recordatorios.find(r => r.id === recId);
      if (rec) {
        const cuota = cuotas.find(c => c.id === rec.cuotaId);
        if (cuota && cuota.estado !== 'PAGADA') {
          const saldoRestante = cuota.montoCuota - cuota.montoPagado;
          if (saldoRestante > 0) {
            await cuotaPrestamoApi.registrarPago({
              cuotaId: cuota.id,
              montoPagado: saldoRestante,
              fechaPago: dayjs().format('YYYY-MM-DD'),
            });
          }
        }
      }
      const rec2 = recordatorios.find(r => r.id === recId);
      if (rec2 && !rec2.enviado) {
        await recordatorioCuotaApi.marcarEnviado(recId);
      }
      await recordatorioCuotaApi.marcarPagado(recId);
      setSnackbar({ open: true, message: 'Cuota marcada como pagada', severity: 'success' });
      loadData();
    } catch {
      setSnackbar({ open: true, message: 'Error al marcar como pagado', severity: 'error' });
    }
  };

  const handleDeleteRecordatorio = async (recId: number) => {
    try {
      await recordatorioCuotaApi.delete(recId);
      setSnackbar({ open: true, message: 'Recordatorio eliminado', severity: 'success' });
      loadData();
    } catch {
      setSnackbar({ open: true, message: 'Error al eliminar', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !prestamo) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/prestamos/lista')} sx={{ mb: 2 }}>Volver</Button>
        <Alert severity="error">{error || 'Préstamo no encontrado'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/prestamos/lista')}>Volver</Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Préstamo - {prestamo.clienteNombre}
        </Typography>
        {prestamo.documentoId && (
          <Button variant="outlined" color="secondary" startIcon={<Receipt />} onClick={() => navigate('/ventas/registro')}>
            Ver Factura #{prestamo.documentoId}
          </Button>
        )}
        <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditOpen(true)}>Editar</Button>
      </Box>

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">Cliente</Typography>
              <Typography variant="h6">{prestamo.clienteNombre}</Typography>
              {prestamo.codigoClienteRojas && (
                <Typography variant="body2" color="text.secondary">Código: {prestamo.codigoClienteRojas}</Typography>
              )}
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Estado</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={ESTADO_PRESTAMO_LABELS[prestamo.estado]}
                  sx={{ bgcolor: ESTADO_PRESTAMO_COLORS[prestamo.estado], color: 'white', cursor: 'pointer' }}
                  onClick={(e) => setEstadoAnchor(e.currentTarget)}
                />
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Categoría</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={CATEGORIA_PRESTAMO_LABELS[prestamo.categoria]}
                  variant="outlined"
                  sx={{
                    borderColor: CATEGORIA_PRESTAMO_COLORS[prestamo.categoria],
                    color: CATEGORIA_PRESTAMO_COLORS[prestamo.categoria],
                    cursor: 'pointer',
                  }}
                  onClick={(e) => setCategoriaAnchor(e.currentTarget)}
                />
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" color="text.secondary">Financiación</Typography>
              <Typography variant="body1">{TIPO_FINANCIACION_LABELS[prestamo.tipoFinanciacion]}</Typography>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" color="text.secondary">Cuotas</Typography>
              <Typography variant="body1">{prestamo.cuotasPagadas}/{prestamo.cantidadCuotas}</Typography>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" color="text.secondary">Valor Cuota</Typography>
              <Typography variant="body1">{formatPrice(prestamo.valorCuota)}</Typography>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" color="text.secondary">Monto Total</Typography>
              <Typography variant="body1" fontWeight="bold">{formatPrice(prestamo.montoTotal)}</Typography>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" color="text.secondary">Cobrado</Typography>
              <Typography variant="body1" color="success.main">{formatPrice(prestamo.montoPagado)}</Typography>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" color="text.secondary">Saldo Pendiente</Typography>
              <Typography variant="body1" fontWeight="bold" color="error.main">{formatPrice(prestamo.saldoPendiente)}</Typography>
            </Grid>
            {prestamo.diasVencido > 0 && (
              <Grid item xs={6} sm={4} md={2}>
                <Typography variant="caption" color="text.secondary">Días Vencido</Typography>
                <Typography variant="body1" color="error.main" fontWeight="bold">{prestamo.diasVencido}</Typography>
              </Grid>
            )}
            {prestamo.fechaEntrega && (
              <Grid item xs={6} sm={4} md={2}>
                <Typography variant="caption" color="text.secondary">Fecha Entrega</Typography>
                <Typography variant="body1">{dayjs(prestamo.fechaEntrega).format('DD/MM/YYYY')}</Typography>
              </Grid>
            )}
            {prestamo.observaciones && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                <Typography variant="body2">{prestamo.observaciones}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`Cuotas (${cuotas.length})`} />
          <Tab label={`Seguimientos (${seguimientos.length})`} />
          <Tab label={`Recordatorios (${recordatorios.length})`} />
        </Tabs>
      </Box>

      {/* Tab: Cuotas */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>N.</TableCell>
                <TableCell align="right">Monto Cuota</TableCell>
                <TableCell align="right">Monto Pagado</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Fecha Pago</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cuotas.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.numeroCuota}</TableCell>
                  <TableCell align="right">{formatPrice(c.montoCuota)}</TableCell>
                  <TableCell align="right">{formatPrice(c.montoPagado)}</TableCell>
                  <TableCell>{dayjs(c.fechaVencimiento).format('DD/MM/YYYY')}</TableCell>
                  <TableCell>{c.fechaPago ? dayjs(c.fechaPago).format('DD/MM/YYYY') : '-'}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={ESTADO_CUOTA_LABELS[c.estado]}
                      size="small"
                      sx={{ bgcolor: ESTADO_CUOTA_COLORS[c.estado], color: 'white' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0} justifyContent="center">
                      {c.estado !== 'PAGADA' && (
                        <Tooltip title="Registrar Pago">
                          <IconButton size="small" onClick={() => { setSelectedCuota(c); setPagoDialogOpen(true); }}>
                            <Payment fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Agregar Recordatorio">
                        <IconButton size="small" onClick={() => { setRecordatorioCuotaId(c.id); setEditingRecordatorio(null); setRecordatorioOpen(true); }}>
                          <Notifications fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Tab: Seguimientos */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => setSeguimientoOpen(true)}>
            Nuevo Seguimiento
          </Button>
        </Box>
        {seguimientos.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No hay seguimientos registrados
          </Typography>
        ) : (
          <List>
            {seguimientos.map(s => (
              <ListItem key={s.id} sx={{ borderLeft: 3, borderColor: 'primary.main', mb: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <ListItemIcon>
                  {TIPO_INTERACCION_ICONS[s.tipo] || <Phone fontSize="small" />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={TIPO_INTERACCION_PRESTAMO_LABELS[s.tipo] || s.tipo} size="small" />
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(s.fecha).format('DD/MM/YYYY HH:mm')}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {s.descripcion && <Typography variant="body2">{s.descripcion}</Typography>}
                      {s.resultado && (
                        <Typography variant="body2" color="text.secondary">
                          Resultado: {s.resultado}
                        </Typography>
                      )}
                      {s.proximaAccion && (
                        <Typography variant="body2" color="primary">
                          Próxima acción: {s.proximaAccion}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </TabPanel>

      {/* Tab: Recordatorios */}
      <TabPanel value={tabValue} index={2}>
        {recordatorios.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No hay recordatorios
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cuota</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Mensaje</TableCell>
                  <TableCell align="center">Enviado</TableCell>
                  <TableCell align="center">Pagado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recordatorios.map(r => {
                  const cuota = cuotas.find(c => c.id === r.cuotaId);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>N.{cuota?.numeroCuota || '?'}</TableCell>
                      <TableCell>{dayjs(r.fechaRecordatorio).format('DD/MM/YYYY')}</TableCell>
                      <TableCell>{r.tipo}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.mensaje}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {r.enviado ? (
                          <Chip label="Enviado" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip label="Pendiente" size="small" color="warning" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {r.pagado ? (
                          <Chip label="Pagado" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip label="No" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0} justifyContent="center">
                          {!r.enviado && (
                            <Tooltip title="Marcar como enviado">
                              <IconButton size="small" onClick={() => r.id && handleMarcarEnviado(r.id)}>
                                <Send fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {!r.pagado && (
                            <Tooltip title="Marcar como pagado">
                              <IconButton size="small" onClick={() => r.id && handleMarcarPagado(r.id)}>
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => { setRecordatorioCuotaId(r.cuotaId); setEditingRecordatorio(r); setRecordatorioOpen(true); }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => r.id && handleDeleteRecordatorio(r.id)}>
                              <Delete fontSize="small" color="error" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Estado Change Menu */}
      <Menu anchorEl={estadoAnchor} open={Boolean(estadoAnchor)} onClose={() => setEstadoAnchor(null)}>
        {Object.entries(ESTADO_PRESTAMO_LABELS).map(([key, label]) => (
          <MenuItem key={key} onClick={() => handleEstadoChange(key as EstadoPrestamo)} disabled={prestamo.estado === key}>
            <Chip label={label} size="small" sx={{ bgcolor: ESTADO_PRESTAMO_COLORS[key as EstadoPrestamo], color: 'white' }} />
          </MenuItem>
        ))}
      </Menu>

      {/* Categoria Change Menu */}
      <Menu anchorEl={categoriaAnchor} open={Boolean(categoriaAnchor)} onClose={() => setCategoriaAnchor(null)}>
        {Object.entries(CATEGORIA_PRESTAMO_LABELS).map(([key, label]) => (
          <MenuItem key={key} onClick={() => handleCategoriaChange(key as CategoriaPrestamo)} disabled={prestamo.categoria === key}>
            <Chip label={label} size="small" variant="outlined" sx={{ borderColor: CATEGORIA_PRESTAMO_COLORS[key as CategoriaPrestamo], color: CATEGORIA_PRESTAMO_COLORS[key as CategoriaPrestamo] }} />
          </MenuItem>
        ))}
      </Menu>

      {/* Dialogs */}
      <PrestamoFormDialog open={editOpen} onClose={() => setEditOpen(false)} onSaved={loadData} prestamo={prestamo} />
      <RegistrarPagoDialog open={pagoDialogOpen} onClose={() => setPagoDialogOpen(false)} onSaved={loadData} cuota={selectedCuota} />
      <SeguimientoFormDialog open={seguimientoOpen} onClose={() => setSeguimientoOpen(false)} onSaved={loadData} prestamoId={prestamoId} />
      <RecordatorioFormDialog
        open={recordatorioOpen}
        onClose={() => { setRecordatorioOpen(false); setEditingRecordatorio(null); }}
        onSaved={loadData}
        cuotaId={recordatorioCuotaId}
        recordatorio={editingRecordatorio}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? 8000 : 4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
