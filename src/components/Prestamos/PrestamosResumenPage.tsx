import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress, Alert,
  Button, Collapse, List, ListItem, ListItemText, Divider, Badge,
  Chip, IconButton, Tooltip, Paper,
} from '@mui/material';
import {
  AccountBalance, TrendingUp, Warning, Gavel, CheckCircle,
  Cancel, AttachMoney, MoneyOff, Schedule, Refresh,
  ExpandMore, ExpandLess, Payment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import { cuotaPrestamoApi } from '../../api/services/cuotaPrestamoApi';
import type { ResumenPrestamosDTO, CuotaPrestamoDTO } from '../../types/prestamo.types';
import { formatPrice } from '../../utils/priceCalculations';
import { RegistrarPagoDialog } from './RegistrarPagoDialog';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, onClick }) => (
  <Card
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: 4, transform: 'translateY(-2px)' } : {},
      transition: 'all 0.2s ease-in-out',
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">{title}</Typography>
          <Typography variant="h5" fontWeight="bold">{value}</Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: `${color}15`,
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const PrestamosResumenPage: React.FC = () => {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState<ResumenPrestamosDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vencidas, setVencidas] = useState<CuotaPrestamoDTO[]>([]);
  const [proximas, setProximas] = useState<CuotaPrestamoDTO[]>([]);
  const [expandVencidas, setExpandVencidas] = useState(false);
  const [expandProximas, setExpandProximas] = useState(false);
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [pagoDialogData, setPagoDialogData] = useState<{
    cuota: CuotaPrestamoDTO;
    clienteId: number;
    prestamoId: number;
    allCuotas: CuotaPrestamoDTO[];
  } | null>(null);
  const [loadingPago, setLoadingPago] = useState(false);

  const loadResumen = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, vencidasData, proximasData] = await Promise.all([
        prestamoPersonalApi.getResumen(),
        cuotaPrestamoApi.getVencidas(),
        cuotaPrestamoApi.getProximasVencer(7),
      ]);
      setResumen(data);
      setVencidas(vencidasData);
      setProximas(proximasData);
    } catch (err) {
      console.error('Error loading resumen:', err);
      setError('Error al cargar el resumen. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumen();
  }, []);

  const handleOpenPago = async (cuota: CuotaPrestamoDTO) => {
    try {
      setLoadingPago(true);
      const [prestamo, allCuotas] = await Promise.all([
        prestamoPersonalApi.getById(cuota.prestamoId),
        cuotaPrestamoApi.getByPrestamo(cuota.prestamoId),
      ]);
      setPagoDialogData({ cuota, clienteId: prestamo.clienteId, prestamoId: cuota.prestamoId, allCuotas });
      setPagoDialogOpen(true);
    } catch {
      // silent fail — user can navigate to detail page instead
    } finally {
      setLoadingPago(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Resumen de Préstamos</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadResumen}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/prestamos/lista')}
          >
            Ver Todos
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {resumen && (
        <>
          {/* Overview Stats */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>General</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Préstamos"
                value={resumen.totalPrestamos}
                icon={<AccountBalance sx={{ color: '#1976d2', fontSize: 28 }} />}
                color="#1976d2"
                onClick={() => navigate('/prestamos/lista')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Activos"
                value={resumen.prestamosActivos}
                icon={<TrendingUp sx={{ color: '#4CAF50', fontSize: 28 }} />}
                color="#4CAF50"
                onClick={() => navigate('/prestamos/lista?estado=ACTIVO')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="En Mora"
                value={resumen.prestamosEnMora}
                icon={<Warning sx={{ color: '#FF9800', fontSize: 28 }} />}
                color="#FF9800"
                onClick={() => navigate('/prestamos/lista?estado=EN_MORA')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="En Legal"
                value={resumen.prestamosEnLegal}
                icon={<Gavel sx={{ color: '#F44336', fontSize: 28 }} />}
                color="#F44336"
                onClick={() => navigate('/prestamos/lista?estado=EN_LEGAL')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Finalizados"
                value={resumen.prestamosFinalizados}
                icon={<CheckCircle sx={{ color: '#2196F3', fontSize: 28 }} />}
                color="#2196F3"
                onClick={() => navigate('/prestamos/lista?estado=FINALIZADO')}
              />
            </Grid>
          </Grid>

          {/* Financial Stats */}
          <Typography variant="h6" gutterBottom>Montos</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Monto Total Prestado"
                value={formatPrice(resumen.montoTotalPrestado)}
                icon={<AttachMoney sx={{ color: '#1976d2', fontSize: 28 }} />}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Monto Total Cobrado"
                value={formatPrice(resumen.montoTotalCobrado)}
                icon={<AttachMoney sx={{ color: '#4CAF50', fontSize: 28 }} />}
                color="#4CAF50"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Monto Total Pendiente"
                value={formatPrice(resumen.montoTotalPendiente)}
                icon={<MoneyOff sx={{ color: '#FF9800', fontSize: 28 }} />}
                color="#FF9800"
              />
            </Grid>
          </Grid>

          {/* Cuotas Stats */}
          <Typography variant="h6" gutterBottom>Cuotas</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Cuotas Vencidas"
                value={resumen.cuotasVencidas}
                icon={<Cancel sx={{ color: '#F44336', fontSize: 28 }} />}
                color="#F44336"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Próximas a Vencer"
                value={resumen.cuotasProximasAVencer}
                icon={<Schedule sx={{ color: '#FF9800', fontSize: 28 }} />}
                color="#FF9800"
              />
            </Grid>
          </Grid>

          {/* Category Breakdown */}
          <Typography variant="h6" gutterBottom>Por Categoría</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Normales"
                value={resumen.prestamosNormales}
                icon={<AccountBalance sx={{ color: '#4CAF50', fontSize: 28 }} />}
                color="#4CAF50"
                onClick={() => navigate('/prestamos/lista?categoria=NORMAL')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Legales"
                value={resumen.prestamosLegales}
                icon={<Gavel sx={{ color: '#F44336', fontSize: 28 }} />}
                color="#F44336"
                onClick={() => navigate('/prestamos/lista?categoria=LEGALES')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pago con Mora"
                value={resumen.prestamosPagoConMora}
                icon={<Warning sx={{ color: '#FF9800', fontSize: 28 }} />}
                color="#FF9800"
                onClick={() => navigate('/prestamos/lista?categoria=PAGO_CON_MORA')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Alto Riesgo"
                value={resumen.prestamosAltoRiesgo}
                icon={<Warning sx={{ color: '#E91E63', fontSize: 28 }} />}
                color="#E91E63"
                onClick={() => navigate('/prestamos/lista?categoria=ALTO_RIESGO')}
              />
            </Grid>
          </Grid>

          {/* Task 6 — Cuotas vencidas */}
          <Box sx={{ mt: 4 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: 1 }}
              onClick={() => setExpandVencidas(v => !v)}
            >
              <Badge badgeContent={vencidas.length} color="error">
                <Typography variant="h6">Cuotas Vencidas</Typography>
              </Badge>
              <IconButton size="small">
                {expandVencidas ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <Collapse in={expandVencidas}>
              {vencidas.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Sin cuotas vencidas</Typography>
              ) : (
                <Paper variant="outlined">
                  <List dense disablePadding>
                    {vencidas.map((c, idx) => (
                      <React.Fragment key={c.id}>
                        {idx > 0 && <Divider />}
                        <ListItem
                          secondaryAction={
                            <Tooltip title="Registrar Pago">
                              <IconButton size="small" onClick={() => handleOpenPago(c)} disabled={loadingPago}>
                                <Payment fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          }
                        >
                          <ListItemText
                            primary={`Préstamo #${c.prestamoId} — Cuota N.${c.numeroCuota}`}
                            secondary={`Cuota N.${c.numeroCuota} — ${formatPrice(c.montoCuota - c.montoPagado)} — Venc. ${dayjs(c.fechaVencimiento).format('DD/MM/YYYY')}`}
                          />
                          <Chip label="Vencida" size="small" color="error" sx={{ mr: 1 }} />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              )}
            </Collapse>
          </Box>

          {/* Task 6 — Cuotas próximas a vencer */}
          <Box sx={{ mt: 3 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: 1 }}
              onClick={() => setExpandProximas(v => !v)}
            >
              <Badge badgeContent={proximas.length} color="warning">
                <Typography variant="h6">Próximas a Vencer (7 días)</Typography>
              </Badge>
              <IconButton size="small">
                {expandProximas ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <Collapse in={expandProximas}>
              {proximas.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Sin cuotas próximas a vencer</Typography>
              ) : (
                <Paper variant="outlined">
                  <List dense disablePadding>
                    {proximas.map((c, idx) => (
                      <React.Fragment key={c.id}>
                        {idx > 0 && <Divider />}
                        <ListItem
                          secondaryAction={
                            <Tooltip title="Registrar Pago">
                              <IconButton size="small" onClick={() => handleOpenPago(c)} disabled={loadingPago}>
                                <Payment fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          }
                        >
                          <ListItemText
                            primary={`Préstamo #${c.prestamoId} — Cuota N.${c.numeroCuota}`}
                            secondary={`Cuota N.${c.numeroCuota} — ${formatPrice(c.montoCuota - c.montoPagado)} — Venc. ${dayjs(c.fechaVencimiento).format('DD/MM/YYYY')}`}
                          />
                          <Chip label="Próxima" size="small" color="warning" sx={{ mr: 1 }} />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              )}
            </Collapse>
          </Box>
        </>
      )}

      <RegistrarPagoDialog
        open={pagoDialogOpen}
        onClose={() => { setPagoDialogOpen(false); setPagoDialogData(null); }}
        onSaved={async (_changed) => { setPagoDialogOpen(false); setPagoDialogData(null); await loadResumen(); }}
        cuota={pagoDialogData?.cuota ?? null}
        clienteId={pagoDialogData?.clienteId ?? 0}
        prestamoId={pagoDialogData?.prestamoId ?? 0}
        allCuotas={pagoDialogData?.allCuotas ?? []}
      />
    </Box>
  );
};
