import { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress, Alert,
  Button, Chip, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip, Snackbar,
  Stack, Menu, MenuItem, Divider,
} from '@mui/material';
import {
  ArrowBack, Add, CheckCircle, Delete,
  Phone, Email, Chat, Sms, Task, Notifications,
  PhoneCallback, DirectionsWalk, Gavel, Handshake, SupportAgent,
  OpenInNew,
} from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { gestionCobranzaApi } from '../../../api/services/gestionCobranzaApi';
import {
  ESTADO_GESTION_COBRANZA_LABELS,
  ESTADO_GESTION_COBRANZA_COLORS,
  PRIORIDAD_COBRANZA_LABELS,
  PRIORIDAD_COBRANZA_COLORS,
  TIPO_ACCION_COBRANZA_LABELS,
  RESULTADO_ACCION_COBRANZA_LABELS,
  TIPO_RECORDATORIO_COBRANZA_LABELS,
  PRIORIDAD_COBRANZA_COLORS as PRIO_COLORS,
  ESTADOS_CIERRE,
} from '../../../types/cobranza.types';
import type {
  GestionCobranzaDTO,
  AccionCobranzaDTO,
  RecordatorioCobranzaDTO,
  EstadoGestionCobranza,
} from '../../../types/cobranza.types';
import { formatPrice } from '../../../utils/priceCalculations';
import { RegistrarAccionDialog } from './RegistrarAccionDialog';
import { RecordatorioCobranzaDialog } from './RecordatorioCobranzaDialog';

// ── Icons per tipo acción ─────────────────────────────────────────────────────
const TIPO_ACCION_ICONS: Record<string, React.ReactElement> = {
  LLAMADA: <PhoneCallback fontSize="small" />,
  WHATSAPP: <WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} />,
  SMS: <Sms fontSize="small" />,
  EMAIL: <Email fontSize="small" />,
  VISITA_DOMICILIO: <DirectionsWalk fontSize="small" />,
  CARTA_DOCUMENTO: <Gavel fontSize="small" />,
  NOTIFICACION_LEGAL: <Gavel fontSize="small" color="error" />,
  ACUERDO_PAGO: <Handshake fontSize="small" />,
  OTRO: <SupportAgent fontSize="small" />,
};

const TIPO_RECORDATORIO_ICONS: Record<string, React.ReactElement> = {
  EMAIL: <Email fontSize="small" />,
  SMS: <Sms fontSize="small" />,
  TAREA: <Task fontSize="small" />,
  NOTIFICACION: <Notifications fontSize="small" />,
  WHATSAPP: <WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} />,
  LLAMADA: <Phone fontSize="small" />,
};

// ── TabPanel ──────────────────────────────────────────────────────────────────
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export const GestionCobranzaDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const gestionId = parseInt(id || '0');

  const [gestion, setGestion] = useState<GestionCobranzaDTO | null>(null);
  const [acciones, setAcciones] = useState<AccionCobranzaDTO[]>([]);
  const [recordatorios, setRecordatorios] = useState<RecordatorioCobranzaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Dialogs
  const [accionOpen, setAccionOpen] = useState(false);
  const [recordatorioOpen, setRecordatorioOpen] = useState(false);

  // Cerrar gestión menu
  const [cierreAnchor, setCierreAnchor] = useState<null | HTMLElement>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });
  const showSnack = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message, severity });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [gestionData, accionesData, recordatoriosData] = await Promise.all([
        gestionCobranzaApi.getById(gestionId),
        gestionCobranzaApi.getAccionesByGestion(gestionId),
        gestionCobranzaApi.getRecordatoriosByGestion(gestionId),
      ]);
      setGestion(gestionData);
      setAcciones(accionesData);
      setRecordatorios(recordatoriosData);
    } catch (err) {
      console.error('Error loading gestion:', err);
      setError('Error al cargar la gestión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [gestionId]);

  const handleCerrarGestion = async (estado: EstadoGestionCobranza) => {
    setCierreAnchor(null);
    try {
      await gestionCobranzaApi.cerrar(gestionId, estado);
      showSnack(`Gestión cerrada como "${ESTADO_GESTION_COBRANZA_LABELS[estado]}"`);
      loadData();
    } catch {
      showSnack('Error al cerrar la gestión.', 'error');
    }
  };

  const handleDeleteAccion = async (accionId: number) => {
    try {
      await gestionCobranzaApi.deleteAccion(accionId);
      setAcciones((prev) => prev.filter((a) => a.id !== accionId));
      showSnack('Acción eliminada.');
    } catch {
      showSnack('Error al eliminar la acción.', 'error');
    }
  };

  const handleCompletarRecordatorio = async (recId: number) => {
    try {
      await gestionCobranzaApi.completarRecordatorio(recId);
      setRecordatorios((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, completado: true, fechaCompletado: new Date().toISOString() } : r))
      );
      showSnack('Recordatorio completado.');
    } catch {
      showSnack('Error al completar el recordatorio.', 'error');
    }
  };

  const handleDeleteRecordatorio = async (recId: number) => {
    try {
      await gestionCobranzaApi.deleteRecordatorio(recId);
      setRecordatorios((prev) => prev.filter((r) => r.id !== recId));
      showSnack('Recordatorio eliminado.');
    } catch {
      showSnack('Error al eliminar el recordatorio.', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !gestion) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/cobranzas/lista')} sx={{ mb: 2 }}>
          Volver
        </Button>
        <Alert severity="error">{error ?? 'Gestión no encontrada.'}</Alert>
      </Box>
    );
  }

  const estadoColor = ESTADO_GESTION_COBRANZA_COLORS[gestion.estado];
  const pendientesCount = recordatorios.filter((r) => !r.completado).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/cobranzas/lista')}>
            Volver
          </Button>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {gestion.clienteNombre} {gestion.clienteApellido}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión #{gestion.id} · Préstamo{' '}
              <Typography
                component="span"
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate(`/prestamos/${gestion.prestamoId}`)}
              >
                #{gestion.prestamoId} <OpenInNew sx={{ fontSize: 12, verticalAlign: 'middle' }} />
              </Typography>
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {gestion.activa && (
            <Button
              variant="outlined"
              color="error"
              onClick={(e) => setCierreAnchor(e.currentTarget)}
            >
              Cerrar Gestión
            </Button>
          )}
        </Box>
      </Box>

      {/* Estado menu */}
      <Menu
        anchorEl={cierreAnchor}
        open={Boolean(cierreAnchor)}
        onClose={() => setCierreAnchor(null)}
      >
        {ESTADOS_CIERRE.map((estado) => (
          <MenuItem key={estado} onClick={() => handleCerrarGestion(estado)}>
            <Chip
              label={ESTADO_GESTION_COBRANZA_LABELS[estado]}
              size="small"
              sx={{
                bgcolor: ESTADO_GESTION_COBRANZA_COLORS[estado],
                color: 'white',
                mr: 1,
              }}
            />
            {ESTADO_GESTION_COBRANZA_LABELS[estado]}
          </MenuItem>
        ))}
      </Menu>

      {/* Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Estado</Typography>
              <Box mt={0.5}>
                <Chip
                  label={ESTADO_GESTION_COBRANZA_LABELS[gestion.estado]}
                  sx={{ bgcolor: estadoColor, color: 'white', fontWeight: 700 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Prioridad</Typography>
              <Box mt={0.5}>
                {gestion.prioridad ? (
                  <Chip
                    label={PRIORIDAD_COBRANZA_LABELS[gestion.prioridad]}
                    sx={{
                      bgcolor: PRIORIDAD_COBRANZA_COLORS[gestion.prioridad],
                      color: 'white',
                      fontWeight: 700,
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.disabled">-</Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Días Vencido</Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                color={gestion.diasVencido > 60 ? 'error.main' : gestion.diasVencido > 30 ? 'warning.main' : 'text.primary'}
              >
                {gestion.diasVencido} días
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Monto Pendiente</Typography>
              <Typography variant="h6" fontWeight={700} color="error.main">
                {formatPrice(gestion.montoPendiente)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Teléfono</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Phone fontSize="small" color="action" />
                <Typography variant="body2">{gestion.clienteTelefono || '-'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Próxima Gestión</Typography>
              <Typography variant="body2">
                {gestion.fechaProximaGestion
                  ? dayjs(gestion.fechaProximaGestion).format('DD/MM/YYYY')
                  : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Promete Pagar</Typography>
              <Typography variant="body2">
                {gestion.fechaPrometePago
                  ? dayjs(gestion.fechaPrometePago).format('DD/MM/YYYY')
                  : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Monto Prometido</Typography>
              <Typography variant="body2">
                {gestion.montoPrometido ? formatPrice(gestion.montoPrometido) : '-'}
              </Typography>
            </Grid>
            {gestion.observaciones && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                <Typography variant="body2">{gestion.observaciones}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`Acciones (${acciones.length})`} />
          <Tab label={`Recordatorios (${pendientesCount} pendientes)`} />
        </Tabs>
      </Box>

      {/* Tab 0: Acciones */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAccionOpen(true)}
            disabled={!gestion.activa}
          >
            Registrar Acción
          </Button>
        </Box>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Resultado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Duración</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Próximo contacto</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Eliminar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {acciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={3}>
                      No hay acciones registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                acciones.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {dayjs(a.fecha).format('DD/MM/YY HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {TIPO_ACCION_ICONS[a.tipo]}
                        <Typography variant="body2">
                          {TIPO_ACCION_COBRANZA_LABELS[a.tipo]}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {a.resultado ? (
                        <Chip
                          label={RESULTADO_ACCION_COBRANZA_LABELS[a.resultado]}
                          size="small"
                          variant="outlined"
                          color={
                            a.resultado === 'PROMETIO_PAGO' ? 'success'
                              : a.resultado === 'NEGO_PAGO' ? 'error'
                              : 'default'
                          }
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Tooltip title={a.descripcion ?? ''}>
                        <Typography
                          variant="body2"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}
                        >
                          {a.descripcion || <span style={{ color: '#aaa' }}>-</span>}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {a.duracionMinutos ? `${a.duracionMinutos} min` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {a.fechaProximoContacto
                        ? dayjs(a.fechaProximoContacto).format('DD/MM/YY')
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Eliminar acción">
                        <IconButton size="small" color="error" onClick={() => handleDeleteAccion(a.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Tab 1: Recordatorios */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setRecordatorioOpen(true)}
            disabled={!gestion.activa}
          >
            Nuevo Recordatorio
          </Button>
        </Box>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Prioridad</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mensaje</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Completado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recordatorios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={3}>
                      No hay recordatorios
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recordatorios.map((r) => (
                  <TableRow key={r.id} hover sx={{ opacity: r.completado ? 0.6 : 1 }}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2">
                        {dayjs(r.fechaRecordatorio).format('DD/MM/YY')}
                      </Typography>
                      {r.hora && (
                        <Typography variant="caption" color="text.secondary">{r.hora} hs</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {TIPO_RECORDATORIO_ICONS[r.tipo]}
                        <Typography variant="body2">
                          {TIPO_RECORDATORIO_COBRANZA_LABELS[r.tipo]}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={PRIORIDAD_COBRANZA_LABELS[r.prioridad]}
                        size="small"
                        sx={{
                          bgcolor: PRIO_COLORS[r.prioridad],
                          color: 'white',
                          fontSize: '0.68rem',
                          height: 18,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Tooltip title={r.mensaje ?? ''}>
                        <Typography
                          variant="body2"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}
                        >
                          {r.mensaje || <span style={{ color: '#aaa' }}>-</span>}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      {r.completado ? (
                        <Chip label="Completado" size="small" color="success" />
                      ) : (
                        <Chip label="Pendiente" size="small" color="warning" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {!r.completado && (
                          <Tooltip title="Marcar completado">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleCompletarRecordatorio(r.id)}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteRecordatorio(r.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Dialogs */}
      <RegistrarAccionDialog
        open={accionOpen}
        gestionId={gestionId}
        clienteNombre={`${gestion.clienteNombre} ${gestion.clienteApellido}`}
        onClose={() => setAccionOpen(false)}
        onSaved={() => {
          setAccionOpen(false);
          loadData();
        }}
      />

      <RecordatorioCobranzaDialog
        open={recordatorioOpen}
        gestionId={gestionId}
        clienteNombre={`${gestion.clienteNombre} ${gestion.clienteApellido}`}
        onClose={() => setRecordatorioOpen(false)}
        onSaved={() => {
          setRecordatorioOpen(false);
          loadData();
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? 8000 : 4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
