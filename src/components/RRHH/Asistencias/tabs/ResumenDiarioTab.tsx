// FRONT-003: extracted from AsistenciasPage.tsx — Tab "Resumen Diario".
// Reads asistencias + excepciones from the orchestrator and renders the
// 4 KPI cards plus the daily detail table (Sistema Inteligente view).
import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  AutoAwesome as AutoAwesomeIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Create as CreateIcon,
  TimerOff as TimerOffIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { RegistroAsistencia } from '../../../../types';
import { getEmpleadoNombre } from '../utils';

interface Props {
  asistencias: RegistroAsistencia[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  excepciones: any[];
  fechaDesde: string;
  fechaHasta: string;
  onChangeFechaDesde: (value: string) => void;
  onChangeFechaHasta: (value: string) => void;
  onGenerarAutomaticas: () => Promise<void> | void;
}

const ResumenDiarioTab: React.FC<Props> = ({
  asistencias,
  excepciones,
  fechaDesde,
  fechaHasta,
  onChangeFechaDesde,
  onChangeFechaHasta,
  onGenerarAutomaticas,
}) => {
  const excepcionesArr = Array.isArray(excepciones) ? excepciones : [];

  const findExcepcion = (a: RegistroAsistencia) =>
    excepcionesArr.find(
      (ex) =>
        ex.empleadoId === a.empleado?.id &&
        dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(a.fecha).format('YYYY-MM-DD')
    ) ?? null;

  const asistenciasNormales = asistencias.filter((a) => !findExcepcion(a)).length;

  const tardanzasCount = excepcionesArr.filter(
    (ex) =>
      ex.tipo === 'LLEGADA_TARDE' &&
      dayjs(ex.fecha).isBetween(dayjs(fechaDesde), dayjs(fechaHasta), null, '[]')
  ).length;

  const inasistenciasCount = excepcionesArr.filter(
    (ex) =>
      ex.tipo === 'INASISTENCIA' &&
      dayjs(ex.fecha).isBetween(dayjs(fechaDesde), dayjs(fechaHasta), null, '[]')
  ).length;

  const horasExtrasTotal = excepcionesArr
    .filter(
      (ex) =>
        ex.tipo === 'HORAS_EXTRAS' &&
        dayjs(ex.fecha).isBetween(dayjs(fechaDesde), dayjs(fechaHasta), null, '[]')
    )
    .reduce((sum, ex) => sum + (ex.horasExtras || 0), 0);

  return (
    <>
      {/* KPIs Inteligentes */}
      <Grid container spacing={{ xs: 2, sm: 2 }} mb={3}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={{ xs: 1, sm: 2 }}
              >
                <CheckCircleIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'success.main' }} />
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="success.main"
                    sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
                  >
                    {asistenciasNormales}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Asist. Normales
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={{ xs: 1, sm: 2 }}
              >
                <WarningIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'warning.main' }} />
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="warning.main"
                    sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
                  >
                    {tardanzasCount}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Tardanzas
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.50', borderLeft: '4px solid', borderColor: 'error.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={{ xs: 1, sm: 2 }}
              >
                <CancelIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'error.main' }} />
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="error.main"
                    sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
                  >
                    {inasistenciasCount}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Inasistencias
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={{ xs: 1, sm: 2 }}
              >
                <TrendingUpIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'info.main' }} />
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="info.main"
                    sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
                  >
                    {horasExtrasTotal}h
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Horas Extras
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" mb={2} flexWrap="wrap" gap={2}>
            <Typography variant="h6">Vista General de Asistencias</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              <TextField
                type="date"
                label="Desde"
                value={fechaDesde}
                onChange={(e) => onChangeFechaDesde(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                label="Hasta"
                value={fechaHasta}
                onChange={(e) => onChangeFechaHasta(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={onGenerarAutomaticas}>
                Generar Automáticas
              </Button>
            </Stack>
          </Stack>

          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Sistema Inteligente:</strong> Las asistencias se generan automáticamente según
            la configuración de horarios. Solo registre excepciones (tardanzas, inasistencias,
            etc.) en la pestaña "Excepciones".
          </Alert>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 150 }}>Empleado</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Fecha</TableCell>
                  <TableCell align="center" sx={{ minWidth: 130 }}>
                    Estado
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 80 }}>
                    Entrada
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 80 }}>
                    Salida
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 70 }}>
                    Horas
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 110 }}>
                    Tipo Registro
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Observaciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asistencias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary" py={3}>
                        No hay asistencias en el período seleccionado. Haga clic en "Generar
                        Automáticas" para crear registros.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  asistencias.map((asistencia) => {
                    const excepcion = findExcepcion(asistencia);
                    const esAutomatica = !excepcion;
                    const estadoFinal = excepcion ? excepcion.tipo : 'PRESENTE';

                    return (
                      <TableRow key={asistencia.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {asistencia.empleado ? getEmpleadoNombre(asistencia.empleado) : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>{dayjs(asistencia.fecha).format('DD/MM/YYYY')}</TableCell>
                        <TableCell align="center">
                          {estadoFinal === 'PRESENTE' && (
                            <Chip
                              label="Presente"
                              color="success"
                              size="small"
                              icon={<CheckCircleIcon />}
                            />
                          )}
                          {estadoFinal === 'LLEGADA_TARDE' && excepcion && (
                            <Chip
                              label={`Tardanza (${excepcion.minutosTardanza || 0} min)`}
                              color="warning"
                              size="small"
                              icon={<WarningIcon />}
                            />
                          )}
                          {estadoFinal === 'INASISTENCIA' && (
                            <Chip label="Ausente" color="error" size="small" icon={<CancelIcon />} />
                          )}
                          {estadoFinal === 'HORAS_EXTRAS' && excepcion && (
                            <Chip
                              label={`+ ${excepcion.horasExtras || 0}h extras`}
                              color="info"
                              size="small"
                              icon={<TrendingUpIcon />}
                            />
                          )}
                          {['SALIDA_ANTICIPADA', 'PERMISO', 'MODIFICACION_HORARIO'].includes(
                            estadoFinal
                          ) && (
                            <Chip
                              label={estadoFinal.replace(/_/g, ' ')}
                              color="default"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {asistencia.horaEntrada ? (
                            <Chip
                              icon={<TimeIcon />}
                              label={asistencia.horaEntrada}
                              size="small"
                              color={excepcion?.tipo === 'LLEGADA_TARDE' ? 'warning' : 'default'}
                              variant="outlined"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {asistencia.horaSalida ? (
                            <Chip
                              icon={<TimerOffIcon />}
                              label={asistencia.horaSalida}
                              size="small"
                              color="default"
                              variant="outlined"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="600" color="success.main">
                            {asistencia.horasTrabajadas || 0}h
                            {excepcion && excepcion.horasExtras ? (
                              <Typography component="span" color="info.main" ml={1}>
                                +{excepcion.horasExtras}h
                              </Typography>
                            ) : null}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {esAutomatica ? (
                            <Tooltip title="Generada automáticamente por el sistema">
                              <Chip
                                icon={<AutoAwesomeIcon />}
                                label="Automática"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Modificada por excepción registrada">
                              <Chip
                                icon={<CreateIcon />}
                                label="Con Excepción"
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {excepcion
                              ? excepcion.observaciones || excepcion.motivo || '-'
                              : asistencia.observaciones || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
};

export default ResumenDiarioTab;
