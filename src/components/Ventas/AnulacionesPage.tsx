import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Block as BlockIcon,
  PeopleAlt as PeopleAltIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import { documentoApi } from '../../api/services';
import { useTenant } from '../../context/TenantContext';

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const fmtMoney = (n: number) =>
  `$ ${(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AnulacionesPage: React.FC = () => {
  const { empresaId } = useTenant();
  const [desde, setDesde] = useState<string>('');
  const [hasta, setHasta] = useState<string>('');

  const resumenQuery = useQuery({
    queryKey: ['anulaciones-resumen', { empresaId, desde, hasta }] as const,
    queryFn: () => documentoApi.getResumenAnulaciones(desde || undefined, hasta || undefined),
    staleTime: 30_000,
  });

  const clientesQuery = useQuery({
    queryKey: ['anulaciones-clientes', { empresaId, desde, hasta }] as const,
    queryFn: () => documentoApi.getClientesConAnulaciones(desde || undefined, hasta || undefined),
    staleTime: 30_000,
  });

  const resumen = resumenQuery.data ?? [];
  const clientes = clientesQuery.data ?? [];

  const totales = useMemo(() => {
    return resumen.reduce(
      (acc, r) => ({
        nc: acc.nc + r.cantidadNotasCredito,
        equipos: acc.equipos + r.cantidadEquipos,
        monto: acc.monto + r.montoAcreditado,
      }),
      { nc: 0, equipos: 0, monto: 0 }
    );
  }, [resumen]);

  const exportarClientesCSV = () => {
    const header = 'Cliente,Cantidad NC,Última anulación\n';
    const rows = clientes
      .map((c) => `"${c.nombre}",${c.cantidadNotasCredito},${c.ultimaAnulacion ? new Date(c.ultimaAnulacion).toLocaleDateString() : ''}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes_que_anularon.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Typography variant="h4" display="flex" alignItems="center" gap={1} mb={3}
        sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
        <BlockIcon /> Anulaciones (Notas de Crédito)
      </Typography>

      {/* Filtros de período */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} md={3}>
              <TextField fullWidth size="small" label="Desde" type="date"
                value={desde} onChange={(e) => setDesde(e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth size="small" label="Hasta" type="date"
                value={hasta} onChange={(e) => setHasta(e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="outlined" size="small" onClick={() => { setDesde(''); setHasta(''); }}>
                Limpiar período
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tarjetas resumen */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="h6">{totales.nc}</Typography>
            <Typography variant="body2" color="text.secondary">Notas de Crédito</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="h6">{totales.equipos}</Typography>
            <Typography variant="body2" color="text.secondary">Equipos anulados</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="h6">{fmtMoney(totales.monto)}</Typography>
            <Typography variant="body2" color="text.secondary">Monto acreditado</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Tabla por mes */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Anulaciones por mes</Typography>
          {resumenQuery.isLoading ? <CircularProgress size={24} /> : resumen.length === 0 ? (
            <Alert severity="info">No hay anulaciones en el período seleccionado.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Período</TableCell>
                    <TableCell align="center">Notas de Crédito</TableCell>
                    <TableCell align="center">Equipos anulados</TableCell>
                    <TableCell align="right">Monto acreditado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resumen.map((r) => (
                    <TableRow key={`${r.anio}-${r.mes}`}>
                      <TableCell>{MESES[r.mes]} {r.anio}</TableCell>
                      <TableCell align="center">{r.cantidadNotasCredito}</TableCell>
                      <TableCell align="center">{r.cantidadEquipos}</TableCell>
                      <TableCell align="right">{fmtMoney(r.montoAcreditado)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Clientes que anularon (para recontacto) */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <PeopleAltIcon /> Clientes que anularon (para recontacto)
            </Typography>
            {clientes.length > 0 && (
              <Button size="small" startIcon={<GetAppIcon />} onClick={exportarClientesCSV}>
                Exportar CSV
              </Button>
            )}
          </Box>
          {clientesQuery.isLoading ? <CircularProgress size={24} /> : clientes.length === 0 ? (
            <Alert severity="info">No hay clientes con anulaciones en el período.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="center">Cantidad de N. Crédito</TableCell>
                    <TableCell>Última anulación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientes.map((c) => (
                    <TableRow key={c.clienteId}>
                      <TableCell>{c.nombre}</TableCell>
                      <TableCell align="center">{c.cantidadNotasCredito}</TableCell>
                      <TableCell>{c.ultimaAnulacion ? new Date(c.ultimaAnulacion).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnulacionesPage;
