import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
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
import { useQuery } from '@tanstack/react-query';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import type {
  EtapaProcesoDTO,
  TipoEtapaFabricacion,
} from '../../types';

const TIPOS_ETAPA: TipoEtapaFabricacion[] = ['AISLACION', 'CHAPA', 'MOTOR', 'VIDRIOS'];

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const formatFecha = (iso?: string): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
};

const formatHoras = (horas?: number | null): string => {
  if (horas === null || horas === undefined) return '—';
  if (horas < 24) return `${Math.round(horas)} h`;
  const dias = Math.floor(horas / 24);
  const resto = Math.round(horas % 24);
  return resto > 0 ? `${dias}d ${resto}h` : `${dias}d`;
};

const toISODate = (d: Date): string => d.toISOString().slice(0, 10);

const estadoEtapaChip = (etapa?: EtapaProcesoDTO) => {
  if (!etapa) {
    return <Chip size="small" label="Sin etapa" variant="outlined" sx={{ opacity: 0.6 }} />;
  }
  switch (etapa.estado) {
    case 'COMPLETADO':
      return <Chip size="small" label="Completada" color="success" variant="outlined" />;
    case 'EN_PROCESO':
      return <Chip size="small" label="En proceso" color="info" variant="outlined" />;
    case 'RECHAZADO':
      return <Chip size="small" label="Rechazada" color="error" variant="outlined" />;
    default:
      return <Chip size="small" label="Pendiente" variant="outlined" />;
  }
};

const ProcesoFabricacionTab: React.FC = () => {
  const hoy = useMemo(() => new Date(), []);
  const [desde, setDesde] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISODate(d);
  });
  const [hasta, setHasta] = useState<string>(() => toISODate(hoy));

  const rangoValido = Boolean(desde && hasta && desde <= hasta);

  const procesoQuery = useQuery({
    queryKey: ['proceso-fabricacion'],
    queryFn: equipoFabricadoApi.getProcesoFabricacion,
  });

  const resumenQuery = useQuery({
    queryKey: ['proceso-fabricacion', 'resumen-areas', desde, hasta],
    queryFn: () => equipoFabricadoApi.getResumenAreasProceso(desde, hasta),
    enabled: rangoValido,
  });

  const equipos = procesoQuery.data ?? [];
  const resumen = resumenQuery.data ?? [];

  return (
    <Stack spacing={3}>
      {/* Resumen por área */}
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={2}>
          <Typography variant="h6" fontWeight={600}>
            Tiempos por área
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              label="Desde"
              type="date"
              size="small"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Hasta"
              type="date"
              size="small"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Box>

        {!rangoValido && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Rango de fechas inválido.
          </Alert>
        )}

        <Grid container spacing={2}>
          {TIPOS_ETAPA.map((tipo) => {
            const area = resumen.find((r) => r.tipoEtapa === tipo);
            return (
              <Grid item xs={12} sm={6} md={3} key={tipo}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {area?.tipoEtapaLabel ?? tipo}
                    </Typography>
                    {resumenQuery.isLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <>
                        <Typography variant="h5" fontWeight="bold">
                          {area?.enProcesoAhora ?? 0}
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.75 }}>
                            en proceso ahora
                          </Typography>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Promedio:{' '}
                          <strong>{formatHoras(area?.promedioHoras)}</strong>
                          {area && area.completadasConDatos > 0
                            ? ` (${area.completadasConDatos} etapa${area.completadasConDatos === 1 ? '' : 's'})`
                            : ' — sin datos en el rango'}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Detalle por equipo */}
      <Box>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Equipos en proceso ({equipos.length})
        </Typography>

        {procesoQuery.isLoading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : procesoQuery.isError ? (
          <Alert severity="error">No se pudo cargar el proceso de fabricación.</Alert>
        ) : equipos.length === 0 ? (
          <Alert severity="info">No hay equipos en proceso de fabricación.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Equipo</TableCell>
                  <TableCell>Modelo</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Progreso</TableCell>
                  {TIPOS_ETAPA.map((tipo) => (
                    <TableCell key={tipo} sx={{ minWidth: 170 }}>
                      {tipo === 'AISLACION' ? 'Aislación' : tipo.charAt(0) + tipo.slice(1).toLowerCase()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {equipos.map((equipo) => (
                  <TableRow key={equipo.equipoId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {equipo.numeroHeladera}
                      </Typography>
                    </TableCell>
                    <TableCell>{equipo.modelo}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, Math.max(0, equipo.progreso))}
                          sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {equipo.progreso}%
                        </Typography>
                      </Box>
                    </TableCell>
                    {TIPOS_ETAPA.map((tipo) => {
                      const etapa = equipo.etapas.find((e) => e.tipoEtapa === tipo);
                      return (
                        <TableCell key={tipo}>
                          <Stack spacing={0.5} alignItems="flex-start">
                            {estadoEtapaChip(etapa)}
                            {etapa && (etapa.fechaInicio || etapa.fechaCompletado) && (
                              <Tooltip
                                title={
                                  etapa.fechaInicio
                                    ? `Entrada: ${formatFecha(etapa.fechaInicio)}${etapa.fechaCompletado ? ` — Entrega: ${formatFecha(etapa.fechaCompletado)}` : ''}`
                                    : 'Sin dato de inicio'
                                }
                              >
                                <Typography variant="caption" color="text.secondary">
                                  {etapa.fechaInicio ? (
                                    <>
                                      {formatFecha(etapa.fechaInicio)}
                                      {' → '}
                                      {etapa.fechaCompletado ? formatFecha(etapa.fechaCompletado) : 'en curso'}
                                      {' · '}
                                      {formatHoras(etapa.duracionHoras)}
                                    </>
                                  ) : (
                                    <>
                                      {formatFecha(etapa.fechaCompletado)}
                                      {' · sin dato de inicio'}
                                    </>
                                  )}
                                </Typography>
                              </Tooltip>
                            )}
                            {etapa?.responsableNombre && (
                              <Typography variant="caption" color="text.secondary">
                                {etapa.responsableNombre}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Stack>
  );
};

export default ProcesoFabricacionTab;
