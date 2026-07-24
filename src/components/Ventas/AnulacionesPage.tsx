import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
  TablePagination,
  Paper,
  Alert,
  CircularProgress,
  Button,
  Chip,
  Tooltip,
  Link,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Block as BlockIcon,
  PeopleAlt as PeopleAltIcon,
  GetApp as GetAppIcon,
  Search as SearchIcon,
  ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material';
import { documentoApi } from '../../api/services';
import { useTenant } from '../../context/TenantContext';
import { useDebounce } from '../../hooks/useDebounce';
import type { DocumentoComercial } from '../../types';

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const fmtMoney = (n: number) =>
  `$ ${(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtFecha = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('es-AR') : '-');

/** Suma de cantidades de líneas EQUIPO de la NC. */
const cantidadEquipos = (nc: DocumentoComercial) =>
  (nc.detalles ?? [])
    .filter((d) => d.tipoItem === 'EQUIPO')
    .reduce((acc, d) => acc + (d.cantidad ?? 0), 0);

/** Descripción legible de los equipos de la NC, para el tooltip. */
const descripcionEquipos = (nc: DocumentoComercial) =>
  (nc.detalles ?? [])
    .filter((d) => d.tipoItem === 'EQUIPO')
    .map((d) => `${d.cantidad}× ${d.descripcionEquipo || d.recetaNombre || d.descripcion || 'Equipo'}`)
    .join('\n');

/** El motivo de la NC no se persiste como columna: viene appendeado en observaciones ("Motivo: ..."). */
const extraerMotivo = (obs?: string) => obs?.match(/Motivo:\s*([^\n]+)/i)?.[1]?.trim() ?? null;

const csvEscape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const AnulacionesPage: React.FC = () => {
  const { empresaId } = useTenant();
  const [desde, setDesde] = useState<string>('');
  const [hasta, setHasta] = useState<string>('');

  // ── Detalle de NCs (server-side, paginado como Registro de Ventas) ──
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [busqueda, setBusqueda] = useState('');
  const debouncedBusqueda = useDebounce(busqueda, 300);

  // Factura asociada abierta en dialog de detalle
  const [facturaId, setFacturaId] = useState<number | null>(null);

  const serverFilters = useMemo(() => ({
    ...(desde ? { fechaDesde: desde } : {}),
    ...(hasta ? { fechaHasta: hasta } : {}),
    ...(debouncedBusqueda.trim() ? { busqueda: debouncedBusqueda.trim() } : {}),
  }), [desde, hasta, debouncedBusqueda]);

  useEffect(() => { setPage(0); }, [desde, hasta, debouncedBusqueda]);

  const notasQuery = useQuery({
    queryKey: ['documentos', 'NOTA_CREDITO', { empresaId, page, size: rowsPerPage, ...serverFilters }] as const,
    queryFn: () => documentoApi.getByTipoPaginated(
      'NOTA_CREDITO',
      { page, size: rowsPerPage, sort: 'fechaEmision,desc' },
      serverFilters
    ),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const facturaQuery = useQuery({
    queryKey: ['documentos', 'detalle', facturaId] as const,
    queryFn: () => documentoApi.getById(facturaId!),
    enabled: facturaId != null,
    staleTime: 60_000,
  });

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
  const notas = notasQuery.data?.content ?? [];
  const totalNotas = notasQuery.data?.totalElements ?? 0;

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

  const descargarCSV = (contenido: string, nombre: string) => {
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarClientesCSV = () => {
    const header = 'Cliente,Cantidad NC,Última anulación\n';
    const rows = clientes
      .map((c) => `"${c.nombre}",${c.cantidadNotasCredito},${c.ultimaAnulacion ? new Date(c.ultimaAnulacion).toLocaleDateString() : ''}`)
      .join('\n');
    descargarCSV(header + rows, 'clientes_que_anularon.csv');
  };

  const exportarNotasCSV = async () => {
    // Trae todas las NC del filtro actual (no solo la página visible).
    const res = await documentoApi.getByTipoPaginated(
      'NOTA_CREDITO',
      { page: 0, size: 1000, sort: 'fechaEmision,desc' },
      serverFilters
    );
    const header = 'N° NC,Fecha,Cliente,Equipos,Factura,Monto,Estado,Observaciones\n';
    const rows = res.content
      .map((nc) => [
        csvEscape(nc.numeroDocumento),
        csvEscape(fmtFecha(nc.fechaEmision)),
        csvEscape(nc.clienteNombre),
        cantidadEquipos(nc),
        csvEscape(nc.documentoOrigenNumero),
        nc.total ?? 0,
        csvEscape(nc.estado),
        csvEscape(nc.observaciones),
      ].join(','))
      .join('\n');
    descargarCSV(header + rows, 'notas_de_credito.csv');
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

      {/* Detalle de Notas de Crédito */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <ReceiptLongIcon /> Detalle de Notas de Crédito
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <TextField
                size="small"
                placeholder="Buscar por N° o cliente…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  ),
                }}
              />
              {totalNotas > 0 && (
                <Button size="small" startIcon={<GetAppIcon />} onClick={exportarNotasCSV}>
                  Exportar CSV
                </Button>
              )}
            </Box>
          </Box>
          {notasQuery.isLoading ? <CircularProgress size={24} /> : notas.length === 0 ? (
            <Alert severity="info">No hay notas de crédito para el filtro seleccionado.</Alert>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>N° NC</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="center">Equipos</TableCell>
                      <TableCell>Factura asociada</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell>Motivo / Observaciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {notas.map((nc) => {
                      const equipos = cantidadEquipos(nc);
                      const motivo = extraerMotivo(nc.observaciones);
                      return (
                        <TableRow key={nc.id} hover>
                          <TableCell>{nc.numeroDocumento}</TableCell>
                          <TableCell>{fmtFecha(nc.fechaEmision)}</TableCell>
                          <TableCell>{nc.clienteNombre || '-'}</TableCell>
                          <TableCell align="center">
                            {equipos > 0 ? (
                              <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{descripcionEquipos(nc)}</span>}>
                                <Chip size="small" label={equipos} />
                              </Tooltip>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {nc.documentoOrigenId ? (
                              <Link
                                component="button"
                                type="button"
                                underline="hover"
                                onClick={() => setFacturaId(nc.documentoOrigenId!)}
                              >
                                {nc.documentoOrigenNumero || `#${nc.documentoOrigenId}`}
                              </Link>
                            ) : '-'}
                          </TableCell>
                          <TableCell align="right">{fmtMoney(nc.total)}</TableCell>
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              {motivo && <Chip size="small" variant="outlined" label={motivo} />}
                              {nc.observaciones && (
                                <Tooltip title={nc.observaciones}>
                                  <Typography variant="body2" noWrap color="text.secondary">
                                    {nc.observaciones.replace(/\s*Motivo:\s*[^\n]+/i, '').trim() || ''}
                                  </Typography>
                                </Tooltip>
                              )}
                              {!motivo && !nc.observaciones && '-'}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalNotas}
                page={page}
                onPageChange={(_e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
              />
            </>
          )}
        </CardContent>
      </Card>

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

      {/* Detalle de la factura asociada */}
      <Dialog open={facturaId != null} onClose={() => setFacturaId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Factura {facturaQuery.data?.numeroDocumento ?? ''}
        </DialogTitle>
        <DialogContent dividers>
          {facturaQuery.isLoading ? (
            <Box display="flex" justifyContent="center" p={2}><CircularProgress size={24} /></Box>
          ) : facturaQuery.isError ? (
            <Alert severity="error">No se pudo cargar la factura.</Alert>
          ) : facturaQuery.data ? (
            <>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Cliente</Typography>
                  <Typography variant="body1">{facturaQuery.data.clienteNombre || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Fecha de emisión</Typography>
                  <Typography variant="body1">{fmtFecha(facturaQuery.data.fechaEmision)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Estado</Typography>
                  <Chip size="small" label={facturaQuery.data.estado} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total</Typography>
                  <Typography variant="body1">{fmtMoney(facturaQuery.data.total)}</Typography>
                </Grid>
              </Grid>
              <Typography variant="subtitle2" mb={1}>Detalle</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ítem</TableCell>
                      <TableCell align="center">Cant.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(facturaQuery.data.detalles ?? []).map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          {d.descripcionEquipo || d.recetaNombre || d.productoNombre || d.descripcion || d.tipoItem}
                        </TableCell>
                        <TableCell align="center">{d.cantidad}</TableCell>
                        <TableCell align="right">{fmtMoney(d.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFacturaId(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnulacionesPage;
