import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FactCheck as FactCheckIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  comunicacionPostventaApi,
  type CanalComunicacionPostventa,
  type ComunicacionInicialPostventaDTO,
} from '../../api/services/comunicacionPostventaApi';
import { documentoApi, clienteApi } from '../../api/services';
import { generarVentaPDF } from '../../services/pdfService';
import { openWhatsAppWeb } from '../../utils/whatsapp';
import { usePermisos } from '../../hooks/usePermisos';
import { QUERY_KEYS } from '../../utils/queryKeys';
import { EMPTY_PAGE } from '../../types/pagination.types';

type EstadoFilter = 'PENDIENTES' | 'REALIZADAS' | 'TODAS';
type CanalFilter = '' | CanalComunicacionPostventa;

const WHATSAPP_GREEN = '#25D366';

const canalLabel: Record<CanalComunicacionPostventa, string> = {
  POST_VENTA: 'Post-venta',
  COBRANZAS: 'Cobranzas',
};

const canalColor: Record<CanalComunicacionPostventa, 'info' | 'warning'> = {
  POST_VENTA: 'info',
  COBRANZAS: 'warning',
};

const formatFecha = (iso?: string): string =>
  iso ? new Date(iso).toLocaleDateString('es-AR') : '—';

const equiposResumen = (equipos: ComunicacionInicialPostventaDTO['equipos']): string => {
  if (!equipos || equipos.length === 0) return '—';
  const primero = equipos[0];
  const etiqueta = [primero.numeroHeladera, primero.modelo && `(${primero.modelo}${primero.medida ? `, ${primero.medida}` : ''})`]
    .filter(Boolean)
    .join(' ');
  if (equipos.length === 1) return etiqueta || '1 equipo';
  return `${equipos.length} equipos · ${primero.numeroHeladera ?? etiqueta} +${equipos.length - 1}`;
};

const equiposTooltip = (equipos: ComunicacionInicialPostventaDTO['equipos']): string =>
  (equipos ?? [])
    .map((e) => [e.numeroHeladera, e.modelo && `(${e.modelo}${e.medida ? `, ${e.medida}` : ''})`].filter(Boolean).join(' '))
    .join('\n');

const ComunicacionesInicialesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const { esAdmin, esSuperAdmin } = usePermisos();
  const puedeVerCanal = esAdmin || esSuperAdmin;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<EstadoFilter>('PENDIENTES');
  const [canal, setCanal] = useState<CanalFilter>('');

  // Debounce de la búsqueda.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const realizadaParam = estado === 'PENDIENTES' ? false : estado === 'REALIZADAS' ? true : undefined;

  const filters = useMemo(
    () => ({
      page,
      size: rowsPerPage,
      search: search || undefined,
      realizada: realizadaParam,
      canal: puedeVerCanal && canal ? canal : undefined,
    }),
    [page, rowsPerPage, search, realizadaParam, canal, puedeVerCanal]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.COMUNICACIONES_POSTVENTA(filters),
    queryFn: () => comunicacionPostventaApi.findAll(filters),
    placeholderData: (prev) => prev,
  });

  const pageData = data ?? EMPTY_PAGE;

  const marcarMutation = useMutation({
    mutationFn: ({ id, realizada }: { id: number; realizada: boolean }) =>
      comunicacionPostventaApi.marcarContacto(id, { realizada }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunicacionesPostventa'] });
    },
  });

  const handleVerFactura = async (row: ComunicacionInicialPostventaDTO) => {
    try {
      const documento = await documentoApi.getById(row.documentoComercialId);
      let cliente = null;
      if (row.clienteId) {
        try {
          cliente = await clienteApi.getById(row.clienteId);
        } catch {
          /* fallback abajo */
        }
      }
      if (!cliente) cliente = (documento as { cliente?: unknown }).cliente ?? null;
      if (!cliente) return;
      generarVentaPDF({ documento, cliente } as Parameters<typeof generarVentaPDF>[0]);
    } catch (e) {
      console.error('No se pudo abrir la factura', e);
    }
  };

  const handleToggle = (row: ComunicacionInicialPostventaDTO) => {
    marcarMutation.mutate({ id: row.id, realizada: !row.realizada });
  };

  // ---------- render helpers ----------

  const WhatsAppButton = ({ row }: { row: ComunicacionInicialPostventaDTO }) => {
    const phone = row.clienteWhatsapp || row.clienteTelefono;
    return (
      <Tooltip title={phone ? `WhatsApp: ${phone}` : 'Sin teléfono'}>
        <span>
          <IconButton
            onClick={() => openWhatsAppWeb(phone)}
            disabled={!phone}
            sx={{ minWidth: 44, minHeight: 44, color: phone ? WHATSAPP_GREEN : undefined }}
          >
            <WhatsAppIcon />
          </IconButton>
        </span>
      </Tooltip>
    );
  };

  const EstadoContacto = ({ row }: { row: ComunicacionInicialPostventaDTO }) =>
    row.realizada ? (
      <Chip size="small" color="success" label={`Contactado ${formatFecha(row.fechaContacto)}`} />
    ) : (
      <Chip size="small" variant="outlined" color="default" label="Pendiente" />
    );

  const CanalChip = ({ row }: { row: ComunicacionInicialPostventaDTO }) => (
    <Chip size="small" color={canalColor[row.canal]} label={canalLabel[row.canal]} />
  );

  // ---------- filtros ----------

  const FilterBar = (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      alignItems={{ xs: 'stretch', md: 'center' }}
      sx={{ mb: 2 }}
    >
      <TextField
        size="small"
        placeholder="Buscar cliente o factura…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        sx={{ minWidth: 240 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <ToggleButtonGroup
        size="small"
        exclusive
        value={estado}
        onChange={(_, v) => {
          if (v) {
            setEstado(v);
            setPage(0);
          }
        }}
      >
        <ToggleButton value="PENDIENTES">Pendientes</ToggleButton>
        <ToggleButton value="REALIZADAS">Realizadas</ToggleButton>
        <ToggleButton value="TODAS">Todas</ToggleButton>
      </ToggleButtonGroup>
      {puedeVerCanal && (
        <ToggleButtonGroup
          size="small"
          exclusive
          value={canal}
          onChange={(_, v) => {
            setCanal((v ?? '') as CanalFilter);
            setPage(0);
          }}
        >
          <ToggleButton value="">Todos</ToggleButton>
          <ToggleButton value="POST_VENTA">Post-venta</ToggleButton>
          <ToggleButton value="COBRANZAS">Cobranzas</ToggleButton>
        </ToggleButtonGroup>
      )}
    </Stack>
  );

  // ---------- estados ----------

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">No se pudieron cargar las comunicaciones.</Typography>
      </Box>
    );
  }

  const rows = pageData.content;

  const emptyState = (
    <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
      <FactCheckIcon sx={{ fontSize: 48, opacity: 0.4 }} />
      <Typography sx={{ mt: 1 }}>
        {estado === 'PENDIENTES'
          ? 'No hay entregas pendientes de contacto.'
          : 'No hay comunicaciones para mostrar.'}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
        <FactCheckIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          Control de Calidad Postventa
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Comunicación inicial de satisfacción por WhatsApp tras cada entrega. Marcá el check cuando
        hayas hecho el contacto.
      </Typography>

      {FilterBar}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        emptyState
      ) : isMobile ? (
        // ---------- MOBILE: cards ----------
        <Stack spacing={1.5}>
          {rows.map((row) => (
            <Card key={row.id} variant="outlined" sx={{ opacity: row.realizada ? 0.7 : 1 }}>
              <CardContent sx={{ pb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography fontWeight={600}>{row.clienteNombreCompleto || '—'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Factura {row.facturaNumero || `#${row.documentoComercialId}`} ·{' '}
                      {formatFecha(row.fechaEntrega)}
                    </Typography>
                  </Box>
                  <Checkbox
                    checked={row.realizada}
                    onChange={() => handleToggle(row)}
                    disabled={marcarMutation.isPending}
                    sx={{ p: 0.5 }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {equiposResumen(row.equipos)}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  {puedeVerCanal && <CanalChip row={row} />}
                  <EstadoContacto row={row} />
                </Stack>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" spacing={1}>
                  <WhatsAppButton row={row} />
                  <Tooltip title="Ver factura">
                    <IconButton onClick={() => handleVerFactura(row)} sx={{ minWidth: 44, minHeight: 44 }}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        // ---------- DESKTOP: table ----------
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell align="center">WhatsApp</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Factura</TableCell>
                <TableCell>Equipos</TableCell>
                <TableCell>Entrega</TableCell>
                {puedeVerCanal && <TableCell>Canal</TableCell>}
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    backgroundColor: row.realizada ? 'action.hover' : undefined,
                    opacity: row.realizada ? 0.75 : 1,
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={row.realizada}
                      onChange={() => handleToggle(row)}
                      disabled={marcarMutation.isPending}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <WhatsAppButton row={row} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {row.clienteNombreCompleto || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <span>{row.facturaNumero || `#${row.documentoComercialId}`}</span>
                      <Tooltip title="Ver factura">
                        <IconButton size="small" onClick={() => handleVerFactura(row)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={equiposTooltip(row.equipos)}>
                      <span>{equiposResumen(row.equipos)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{formatFecha(row.fechaEntrega)}</TableCell>
                  {puedeVerCanal && (
                    <TableCell>
                      <CanalChip row={row} />
                    </TableCell>
                  )}
                  <TableCell>
                    <EstadoContacto row={row} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        component="div"
        count={pageData.totalElements}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Filas"
      />
    </Box>
  );
};

export default ComunicacionesInicialesPage;
