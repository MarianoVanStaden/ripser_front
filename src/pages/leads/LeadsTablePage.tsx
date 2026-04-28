import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  IconButton,
  Typography,
  Tooltip,
  Alert,
  Chip,
  Stack,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as ConvertIcon,
  WhatsApp as WhatsAppIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { leadApi, type LeadFilterParams } from '../../api/services/leadApi';
import {
  EstadoLeadEnum,
  PrioridadLeadEnum,
  PROVINCIA_LABELS,
  ESTADO_LABELS,
  PRIORIDAD_LABELS
} from '../../types/lead.types';
import type { LeadDTO, RecordatorioLeadDTO } from '../../types/lead.types';
import { LeadStatusBadge } from '../../components/leads/LeadStatusBadge';
import { CanalBadge } from '../../components/leads/CanalBadge';
import { RecordatorioStatusBadge } from '../../components/leads/RecordatorioStatusBadge';
import { PriorityQuickEdit } from '../../components/leads/PriorityQuickEdit';
import { useTenant } from '../../context/TenantContext';
import { SuperAdminContextModal, useSuperAdminContextCheck } from '../../components/shared';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import LoadingOverlay from '../../components/common/LoadingOverlay';

type Order = 'asc' | 'desc';
type OrderBy =
  | 'nombre'
  | 'telefono'
  | 'provincia'
  | 'canal'
  | 'estadoLead'
  | 'prioridad'
  | 'dias'
  | 'fechaPrimerContacto'
  | 'fechaUltimoContacto';

const SORT_FIELD: Record<OrderBy, string> = {
  nombre: 'nombre',
  telefono: 'telefono',
  provincia: 'provincia',
  canal: 'canal',
  estadoLead: 'estadoLead',
  prioridad: 'prioridad',
  dias: 'fechaPrimerContacto',
  fechaPrimerContacto: 'fechaPrimerContacto',
  fechaUltimoContacto: 'fechaUltimoContacto'
};

const buildSort = (orderBy: OrderBy, order: Order): string => {
  const field = SORT_FIELD[orderBy];
  // 'dias' = hoy − fechaPrimerContacto, así que sort asc/desc se invierte.
  const dir = orderBy === 'dias' ? (order === 'desc' ? 'asc' : 'desc') : order;
  return `${field},${dir}`;
};

const ESTADOS_DISPONIBLES: EstadoLeadEnum[] = [
  EstadoLeadEnum.PRIMER_CONTACTO,
  EstadoLeadEnum.MOSTRO_INTERES,
  EstadoLeadEnum.CLIENTE_POTENCIAL,
  EstadoLeadEnum.CLIENTE_POTENCIAL_CALIFICADO,
  EstadoLeadEnum.CONVERTIDO,
  EstadoLeadEnum.DESCARTADO
];

const PRIORIDADES_DISPONIBLES: PrioridadLeadEnum[] = [
  PrioridadLeadEnum.HOT,
  PrioridadLeadEnum.WARM,
  PrioridadLeadEnum.COLD
];

export const LeadsTablePage = () => {
  const navigate = useNavigate();
  const { sucursalFiltro } = useTenant();
  const { showModal, closeModal } = useSuperAdminContextCheck();

  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('dias');
  const [selectedEstados, setSelectedEstados] = useState<EstadoLeadEnum[]>([]);
  const [selectedPrioridades, setSelectedPrioridades] = useState<PrioridadLeadEnum[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [soloMisLeads, setSoloMisLeads] = useState(false);
  const [recordatoriosByLeadId, setRecordatoriosByLeadId] = useState<Record<number, RecordatorioLeadDTO[]>>({});

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchLeads = useCallback(
    (page: number, size: number, sort: string, filters: LeadFilterParams) => {
      return leadApi.getAll({ page, size, sort }, filters);
    },
    []
  );

  const {
    data: leads,
    totalElements,
    loading,
    error,
    page,
    size,
    handleChangePage,
    handleChangeRowsPerPage,
    setSort,
    setFilters,
    refresh
  } = usePagination<LeadDTO, LeadFilterParams>({
    fetchFn: fetchLeads,
    initialSize: 50,
    defaultSort: buildSort('dias', 'desc'),
    initialFilters: {
      ...(sucursalFiltro != null ? { sucursalId: sucursalFiltro } : {})
    }
  });

  useEffect(() => {
    setFilters({
      ...(sucursalFiltro != null ? { sucursalId: sucursalFiltro } : {}),
      ...(selectedEstados.length > 0 ? { estados: selectedEstados } : {}),
      ...(selectedPrioridades.length === 1 ? { prioridad: selectedPrioridades[0] } : {}),
      ...(debouncedSearch.trim() ? { busqueda: debouncedSearch.trim() } : {}),
      ...(soloMisLeads ? { soloMisLeads: true } : {})
    });
  }, [
    sucursalFiltro,
    selectedEstados,
    selectedPrioridades,
    debouncedSearch,
    soloMisLeads,
    setFilters
  ]);

  useEffect(() => {
    setSort(buildSort(orderBy, order));
  }, [orderBy, order, setSort]);

  // Recordatorios: sólo para los leads visibles en la página actual.
  // El endpoint global (RecordatorioLeadController) sería más eficiente, pero
  // ese flujo está acoplado al módulo de gestión global y no expone "por lead".
  // Con page size ≤ 200 los N requests paralelos son aceptables; si se vuelve
  // un problema, el back debería embeber recordatorios pendientes en LeadDTO.
  useEffect(() => {
    let cancelled = false;
    if (leads.length === 0) {
      setRecordatoriosByLeadId({});
      return;
    }
    (async () => {
      const entries = await Promise.all(
        leads.map(async (lead) => {
          if (!lead.id) return [0, [] as RecordatorioLeadDTO[]] as const;
          try {
            const recs = await leadApi.getRecordatorios(lead.id);
            return [lead.id, recs] as const;
          } catch {
            return [lead.id, [] as RecordatorioLeadDTO[]] as const;
          }
        })
      );
      if (cancelled) return;
      const map: Record<number, RecordatorioLeadDTO[]> = {};
      for (const [id, recs] of entries) {
        if (id) map[id] = recs;
      }
      setRecordatoriosByLeadId(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [leads]);

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const toggleEstado = (estado: EstadoLeadEnum) => {
    setSelectedEstados((prev) =>
      prev.includes(estado) ? prev.filter((e) => e !== estado) : [...prev, estado]
    );
  };

  const togglePrioridad = (prioridad: PrioridadLeadEnum) => {
    setSelectedPrioridades((prev) =>
      prev.includes(prioridad) ? prev.filter((p) => p !== prioridad) : [...prev, prioridad]
    );
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este lead?')) return;
    try {
      await leadApi.delete(id);
      refresh();
    } catch (err) {
      console.error('Error al eliminar lead:', err);
      alert('Error al eliminar el lead');
    }
  };

  const handleUpdatePriority = async (leadId: number, newPriority: PrioridadLeadEnum) => {
    try {
      const leadActual = leads.find((l) => l.id === leadId);
      if (!leadActual) throw new Error('Lead no encontrado');
      await leadApi.update(leadId, { ...leadActual, prioridad: newPriority });
      refresh();
    } catch (err) {
      console.error('Error al actualizar prioridad:', err);
      alert('Error al actualizar la prioridad del lead');
    }
  };

  const canConvert = (lead: LeadDTO): boolean => {
    return (
      lead.estadoLead !== EstadoLeadEnum.CONVERTIDO &&
      lead.estadoLead !== EstadoLeadEnum.DESCARTADO &&
      !lead.clienteOrigenId
    );
  };

  const calcularDias = (fechaPrimerContacto?: string): number => {
    if (!fechaPrimerContacto) return 0;
    const hoy = new Date();
    const fechaContacto = new Date(fechaPrimerContacto);
    return Math.floor((hoy.getTime() - fechaContacto.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatearFecha = (fecha?: string): string => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const getRowColor = (lead: LeadDTO): string => {
    const dias = calcularDias(lead.fechaPrimerContacto);
    if (lead.estadoLead === EstadoLeadEnum.CONVERTIDO) return 'rgba(5, 150, 105, 0.08)';
    if (lead.estadoLead === EstadoLeadEnum.DESCARTADO || lead.estadoLead === EstadoLeadEnum.PERDIDO) {
      return 'rgba(107, 114, 128, 0.08)';
    }
    if (dias > 30) return 'rgba(239, 68, 68, 0.1)';
    if (dias > 15) return 'rgba(245, 158, 11, 0.1)';
    if (dias > 7) return 'rgba(59, 130, 246, 0.08)';
    return '';
  };

  return (
    <Box sx={{ p: 2 }}>
      <LoadingOverlay open={loading} message="Cargando leads..." />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          📊 Gestión de Leads
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Total: {totalElements} leads
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/leads/nuevo')}>
            Nuevo Lead
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Filtrar por estado:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {ESTADOS_DISPONIBLES.map((estado) => (
                <Chip
                  key={estado}
                  label={ESTADO_LABELS[estado]}
                  size="small"
                  onClick={() => toggleEstado(estado)}
                  color={selectedEstados.includes(estado) ? 'primary' : 'default'}
                  variant={selectedEstados.includes(estado) ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Filtrar por prioridad:
              {selectedPrioridades.length > 1 && (
                <Typography variant="caption" component="span" color="warning.main" sx={{ ml: 1 }}>
                  (sólo se aplica una a la vez en el server)
                </Typography>
              )}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {PRIORIDADES_DISPONIBLES.map((prioridad) => (
                <Chip
                  key={prioridad}
                  label={PRIORIDAD_LABELS[prioridad]}
                  size="small"
                  onClick={() => togglePrioridad(prioridad)}
                  color={selectedPrioridades.includes(prioridad) ? 'primary' : 'default'}
                  variant={selectedPrioridades.includes(prioridad) ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={soloMisLeads}
                  onChange={(_, checked) => setSoloMisLeads(checked)}
                  size="small"
                />
              }
              label="Solo mis leads"
            />
          </Box>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 360px)' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '12%', minWidth: 120 }}>
                <TableSortLabel
                  active={orderBy === 'nombre'}
                  direction={orderBy === 'nombre' ? order : 'asc'}
                  onClick={() => handleRequestSort('nombre')}
                >
                  Nombre
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '8%', minWidth: 100 }}>
                <TableSortLabel
                  active={orderBy === 'telefono'}
                  direction={orderBy === 'telefono' ? order : 'asc'}
                  onClick={() => handleRequestSort('telefono')}
                >
                  Teléfono
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '6%', minWidth: 80, display: { xs: 'none', lg: 'table-cell' } }}>
                <TableSortLabel
                  active={orderBy === 'provincia'}
                  direction={orderBy === 'provincia' ? order : 'asc'}
                  onClick={() => handleRequestSort('provincia')}
                >
                  Prov.
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '6%', minWidth: 70, display: { xs: 'none', md: 'table-cell' } }}>
                <TableSortLabel
                  active={orderBy === 'canal'}
                  direction={orderBy === 'canal' ? order : 'asc'}
                  onClick={() => handleRequestSort('canal')}
                >
                  Canal
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '8%', minWidth: 90 }}>
                <TableSortLabel
                  active={orderBy === 'estadoLead'}
                  direction={orderBy === 'estadoLead' ? order : 'asc'}
                  onClick={() => handleRequestSort('estadoLead')}
                >
                  Estado
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '6%', minWidth: 70 }}>
                <TableSortLabel
                  active={orderBy === 'prioridad'}
                  direction={orderBy === 'prioridad' ? order : 'asc'}
                  onClick={() => handleRequestSort('prioridad')}
                >
                  Prior.
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '12%', minWidth: 120, display: { xs: 'none', lg: 'table-cell' } }}>
                Interés
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '6%', minWidth: 70, display: { xs: 'none', md: 'table-cell' } }}>
                Rec.
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '7%', minWidth: 80, display: { xs: 'none', lg: 'table-cell' } }}>
                <TableSortLabel
                  active={orderBy === 'fechaPrimerContacto'}
                  direction={orderBy === 'fechaPrimerContacto' ? order : 'asc'}
                  onClick={() => handleRequestSort('fechaPrimerContacto')}
                >
                  1er Cont.
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '4%', minWidth: 50 }}>
                <TableSortLabel
                  active={orderBy === 'dias'}
                  direction={orderBy === 'dias' ? order : 'asc'}
                  onClick={() => handleRequestSort('dias')}
                >
                  Días
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '10%', minWidth: 120 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {loading ? 'Cargando…' : 'No se encontraron leads con los filtros seleccionados'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const recordatorios = lead.id ? recordatoriosByLeadId[lead.id] ?? [] : [];
                return (
                  <TableRow
                    key={lead.id}
                    hover
                    sx={{
                      bgcolor: getRowColor(lead),
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <TableCell sx={{ py: 0.75, fontSize: '0.875rem' }}>{lead.nombre}</TableCell>
                    <TableCell sx={{ py: 0.75, fontSize: '0.875rem' }}>{lead.telefono}</TableCell>
                    <TableCell sx={{ py: 0.75, fontSize: '0.875rem', display: { xs: 'none', lg: 'table-cell' } }}>
                      {lead.provincia ? PROVINCIA_LABELS[lead.provincia] : '-'}
                    </TableCell>
                    <TableCell sx={{ py: 0.75, display: { xs: 'none', md: 'table-cell' } }}>
                      <CanalBadge canal={lead.canal} />
                    </TableCell>
                    <TableCell sx={{ py: 0.75 }}>
                      <LeadStatusBadge status={lead.estadoLead} />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.75 }}>
                      <PriorityQuickEdit
                        leadId={lead.id!}
                        currentPriority={lead.prioridad}
                        onUpdate={handleUpdatePriority}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.75, fontSize: '0.75rem', maxWidth: 150, display: { xs: 'none', lg: 'table-cell' } }}>
                      {lead.productoInteresNombre ? (
                        <Typography variant="caption" display="block" noWrap title={lead.productoInteresNombre}>
                          {lead.productoInteresNombre}
                        </Typography>
                      ) : lead.modeloRecetaInteres || lead.modeloEquipoInteres ? (
                        <Typography
                          variant="caption"
                          display="block"
                          noWrap
                          title={lead.modeloRecetaInteres || lead.modeloEquipoInteres}
                        >
                          {lead.modeloRecetaInteres || lead.modeloEquipoInteres}
                        </Typography>
                      ) : lead.equipoInteresadoNombre ? (
                        <Typography variant="caption" display="block" noWrap title={lead.equipoInteresadoNombre}>
                          {lead.equipoInteresadoNombre}
                        </Typography>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.75, display: { xs: 'none', md: 'table-cell' } }}>
                      <RecordatorioStatusBadge recordatorios={recordatorios} />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.75, fontSize: '0.75rem', display: { xs: 'none', lg: 'table-cell' } }}>
                      {formatearFecha(lead.fechaPrimerContacto)}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.75, fontSize: '0.875rem' }}>
                      {calcularDias(lead.fechaPrimerContacto) || '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" sx={{ p: 0.5 }} onClick={() => navigate(`/leads/${lead.id}`)}>
                            <VisibilityIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>

                        {lead.telefono && (
                          <Tooltip title="WhatsApp">
                            <IconButton
                              size="small"
                              sx={{ p: 0.5, color: '#25D366' }}
                              onClick={() => {
                                const phone = lead.telefono.replace(/\D/g, '');
                                window.open(`https://wa.me/${phone}`, '_blank');
                              }}
                            >
                              <WhatsAppIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {lead.estadoLead !== EstadoLeadEnum.CONVERTIDO && (
                          <Tooltip title="Editar">
                            <IconButton size="small" sx={{ p: 0.5 }} onClick={() => navigate(`/leads/${lead.id}/editar`)}>
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {canConvert(lead) && (
                          <Tooltip title="Convertir">
                            <IconButton
                              size="small"
                              sx={{ p: 0.5, color: 'success.main' }}
                              onClick={() => navigate(`/leads/${lead.id}/convertir`)}
                            >
                              <ConvertIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {lead.estadoLead !== EstadoLeadEnum.CONVERTIDO && (
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              sx={{ p: 0.5, color: 'error.main' }}
                              onClick={() => handleDelete(lead.id!)}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalElements}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={size}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[25, 50, 100, 200]}
        labelRowsPerPage="Leads por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />

      <SuperAdminContextModal
        autoOpen={showModal}
        onClose={closeModal}
        customMessage="Para gestionar leads correctamente, necesitas seleccionar una empresa.
          Esto asegura que los leads se registren y filtren según el contexto de la empresa seleccionada."
      />
    </Box>
  );
};
