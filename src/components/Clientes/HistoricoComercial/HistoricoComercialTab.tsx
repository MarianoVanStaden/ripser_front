import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  AccountTree as ChainIcon,
} from '@mui/icons-material';
import type {
  DocumentoComercial,
  EstadoDocumento,
  KPIsClienteDTO,
  TipoDocumento,
} from '../../../types';
import { EstadoDocumento as EstadoDocumentoEnum } from '../../../types';
import { documentoApi } from '../../../api/documentoApi';
import {
  calcularKPIs,
  formatARS,
  formatFechaCorta,
  formatMetodoPago,
  getEstadoChipProps,
  getTipoChipProps,
  type HistoricoKPIs,
} from './utils';
import DocumentoDetalleDialog from './DocumentoDetalleDialog';

interface HistoricoComercialTabProps {
  /** ID del cliente del cual mostrar el histórico comercial. */
  clienteId: number;
}

type TipoFiltro = 'TODOS' | TipoDocumento;
type EstadoFiltro = 'TODOS' | EstadoDocumento;

const TIPOS_FILTRO: { value: TipoFiltro; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PRESUPUESTO', label: 'Presupuesto' },
  { value: 'NOTA_PEDIDO', label: 'Nota de Pedido' },
  { value: 'FACTURA', label: 'Factura' },
  { value: 'NOTA_CREDITO', label: 'Nota de Crédito' },
];

/**
 * Tab "Histórico Comercial" de la carpeta del cliente.
 * Lista todos los documentos comerciales del cliente con KPIs, filtros,
 * paginación y drill-down al detalle.
 */
const HistoricoComercialTab: React.FC<HistoricoComercialTabProps> = ({ clienteId }) => {
  const [documentos, setDocumentos] = useState<DocumentoComercial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpisServer, setKpisServer] = useState<KPIsClienteDTO | null>(null);

  // Filtros
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('TODOS');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('TODOS');
  const [desde, setDesde] = useState<string>('');
  const [hasta, setHasta] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Detalle
  const [docSeleccionado, setDocSeleccionado] = useState<DocumentoComercial | null>(null);

  const cargarDocumentos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // En paralelo: documentos + KPIs server-side. Si los KPIs fallan, caemos a cómputo cliente.
      const [docs, kpisRes] = await Promise.allSettled([
        documentoApi.getByCliente(clienteId),
        documentoApi.getKPIsCliente(clienteId),
      ]);

      if (docs.status === 'fulfilled') {
        setDocumentos(docs.value);
      } else {
        console.error(docs.reason);
        throw docs.reason;
      }

      if (kpisRes.status === 'fulfilled') {
        setKpisServer(kpisRes.value);
      } else {
        console.error(kpisRes.reason);
        setKpisServer(null);
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar el histórico comercial del cliente');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  // KPIs: server-side cuando estén disponibles; si no, cálculo cliente como fallback.
  const kpis: HistoricoKPIs = useMemo(() => {
    if (kpisServer) {
      return {
        totalFacturado: kpisServer.totalFacturado ?? 0,
        cantidadPresupuestos: kpisServer.cantidadPresupuestos ?? 0,
        cantidadNotasPedido: kpisServer.cantidadNotasPedido ?? 0,
        cantidadFacturas: kpisServer.cantidadFacturas ?? 0,
        cantidadNotasCredito: kpisServer.cantidadNotasCredito ?? 0,
        ticketPromedioFacturas: kpisServer.ticketPromedioFacturas ?? 0,
        tasaConversionPresupuestoFactura:
          kpisServer.tasaConversionPresupuestoFactura ?? 0,
      };
    }
    return calcularKPIs(documentos);
  }, [kpisServer, documentos]);

  const documentosFiltrados = useMemo(() => {
    const desdeMs = desde ? new Date(desde).getTime() : null;
    const hastaMs = hasta ? new Date(`${hasta}T23:59:59`).getTime() : null;
    const busq = busqueda.trim().toLowerCase();

    return documentos
      .filter((d) => (tipoFiltro === 'TODOS' ? true : d.tipoDocumento === tipoFiltro))
      .filter((d) => (estadoFiltro === 'TODOS' ? true : d.estado === estadoFiltro))
      .filter((d) => {
        if (!desdeMs && !hastaMs) return true;
        const t = new Date(d.fechaEmision).getTime();
        if (Number.isNaN(t)) return false;
        if (desdeMs && t < desdeMs) return false;
        if (hastaMs && t > hastaMs) return false;
        return true;
      })
      .filter((d) => {
        if (!busq) return true;
        return d.numeroDocumento?.toLowerCase().includes(busq);
      })
      .sort((a, b) => {
        const ta = new Date(a.fechaEmision).getTime();
        const tb = new Date(b.fechaEmision).getTime();
        return tb - ta;
      });
  }, [documentos, tipoFiltro, estadoFiltro, desde, hasta, busqueda]);

  const documentosPaginados = useMemo(() => {
    const start = page * rowsPerPage;
    return documentosFiltrados.slice(start, start + rowsPerPage);
  }, [documentosFiltrados, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [tipoFiltro, estadoFiltro, desde, hasta, busqueda]);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const limpiarFiltros = () => {
    setTipoFiltro('TODOS');
    setEstadoFiltro('TODOS');
    setDesde('');
    setHasta('');
    setBusqueda('');
  };

  const estadosOptions: EstadoDocumento[] = useMemo(
    () => Object.values(EstadoDocumentoEnum) as EstadoDocumento[],
    [],
  );

  return (
    <Box>
      {/* KPIs */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Total facturado
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {formatARS(kpis.totalFacturado)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {kpis.cantidadFacturas} facturas
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Documentos por tipo
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', rowGap: 1 }}>
              <Chip size="small" color="info" label={`Pres. ${kpis.cantidadPresupuestos}`} />
              <Chip size="small" color="warning" label={`NP ${kpis.cantidadNotasPedido}`} />
              <Chip size="small" color="success" label={`Fact. ${kpis.cantidadFacturas}`} />
              {kpis.cantidadNotasCredito > 0 && (
                <Chip size="small" color="error" label={`NC ${kpis.cantidadNotasCredito}`} />
              )}
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Ticket promedio facturas
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {formatARS(kpis.ticketPromedioFacturas)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Conversión Pres. → Fact.
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {(kpis.tasaConversionPresupuestoFactura * 100).toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sobre {kpis.cantidadPresupuestos} presupuestos
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filtros */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            select
            size="small"
            label="Tipo"
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)}
          >
            {TIPOS_FILTRO.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Estado"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value as EstadoFiltro)}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            {estadosOptions.map((est) => (
              <MenuItem key={est} value={est}>
                {getEstadoChipProps(est).label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            type="date"
            label="Desde"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="Nº documento"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej: PRES-0001"
          />
          <Box display="flex" gap={1}>
            <Button
              onClick={limpiarFiltros}
              variant="text"
              size="small"
              disabled={
                tipoFiltro === 'TODOS' &&
                estadoFiltro === 'TODOS' &&
                !desde &&
                !hasta &&
                !busqueda
              }
            >
              Limpiar
            </Button>
            <Tooltip title="Recargar">
              <span>
                <IconButton onClick={cargarDocumentos} disabled={loading} size="small">
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Listado */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={cargarDocumentos}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      ) : documentosFiltrados.length === 0 ? (
        <Alert severity="info">
          No hay documentos comerciales para los filtros seleccionados.
        </Alert>
      ) : (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Número</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Método de pago</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documentosPaginados.map((doc) => {
                  const tipoProps = getTipoChipProps(doc.tipoDocumento);
                  const estadoProps = getEstadoChipProps(doc.estado);
                  return (
                    <TableRow
                      key={doc.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setDocSeleccionado(doc)}
                    >
                      <TableCell>
                        <Chip
                          label={tipoProps.label}
                          color={tipoProps.color === 'default' ? undefined : tipoProps.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {doc.numeroDocumento}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatFechaCorta(doc.fechaEmision)}</TableCell>
                      <TableCell>
                        <Chip
                          label={estadoProps.label}
                          color={estadoProps.color === 'default' ? undefined : estadoProps.color}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatMetodoPago(doc.metodoPago)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatARS(doc.total)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => setDocSeleccionado(doc)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {(doc.documentoOrigenId || doc.documentoSiguienteId) && (
                          <Tooltip title="Pertenece a una cadena">
                            <IconButton size="small" onClick={() => setDocSeleccionado(doc)}>
                              <ChainIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={documentosFiltrados.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </Paper>
      )}

      <DocumentoDetalleDialog
        open={docSeleccionado !== null}
        documento={docSeleccionado}
        onClose={() => setDocSeleccionado(null)}
      />
    </Box>
  );
};

export default HistoricoComercialTab;
