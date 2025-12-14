import { useState, useEffect, useMemo } from 'react';
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
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Button
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as ConvertIcon,
  WhatsApp as WhatsAppIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { leadApi } from '../../api/services/leadApi';
import { EstadoLeadEnum, PrioridadLeadEnum, PROVINCIA_LABELS, ESTADO_LABELS, PRIORIDAD_LABELS } from '../../types/lead.types';
import type { LeadDTO } from '../../types/lead.types';
import { LeadStatusBadge } from '../../components/leads/LeadStatusBadge';
import { CanalBadge } from '../../components/leads/CanalBadge';
import { RecordatorioStatusBadge } from '../../components/leads/RecordatorioStatusBadge';
import { PriorityQuickEdit } from '../../components/leads/PriorityQuickEdit';
import { useTenant } from '../../context/TenantContext';

type Order = 'asc' | 'desc';
type OrderBy = 'nombre' | 'telefono' | 'provincia' | 'canal' | 'estadoLead' | 'prioridad' | 'dias' | 'fechaPrimerContacto' | 'fechaUltimoContacto';

export const LeadsTablePage = () => {
  const navigate = useNavigate();
  const { sucursalFiltro } = useTenant();
  const [leads, setLeads] = useState<LeadDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstados, setSelectedEstados] = useState<EstadoLeadEnum[]>([]);
  const [selectedPrioridades, setSelectedPrioridades] = useState<PrioridadLeadEnum[]>([]);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('dias');

  // Cargar leads al montar el componente y cuando cambia la sucursal
  useEffect(() => {
    loadLeads();
  }, [sucursalFiltro]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await leadApi.getAll({
        sucursalId: sucursalFiltro
      });

      // Cargar recordatorios para cada lead
      const leadsConRecordatorios = await Promise.all(
        data.map(async (lead) => {
          try {
            const recordatorios = await leadApi.getRecordatorios(lead.id!);
            return { ...lead, recordatorios };
          } catch (err) {
            console.error(`Error al cargar recordatorios del lead ${lead.id}:`, err);
            return { ...lead, recordatorios: [] };
          }
        })
      );

      setLeads(leadsConRecordatorios);
    } catch (err) {
      console.error('Error al cargar leads:', err);
      setError('Error al cargar los leads. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este lead?')) {
      return;
    }

    try {
      await leadApi.delete(id);
      setLeads(leads.filter((lead) => lead.id !== id));
    } catch (err) {
      console.error('Error al eliminar lead:', err);
      alert('Error al eliminar el lead');
    }
  };

  const canConvert = (lead: LeadDTO): boolean => {
    return lead.estadoLead !== EstadoLeadEnum.CONVERTIDO &&
           lead.estadoLead !== EstadoLeadEnum.DESCARTADO;
  };

  const handleUpdatePriority = async (leadId: number, newPriority: any) => {
    try {
      // Encontrar el lead actual
      const leadActual = leads.find(l => l.id === leadId);
      if (!leadActual) {
        throw new Error('Lead no encontrado');
      }

      // Enviar el lead completo con la prioridad actualizada
      const leadActualizado = { ...leadActual, prioridad: newPriority };
      console.log('🔄 Actualizando prioridad del lead:', {
        leadId,
        prioridadAnterior: leadActual.prioridad,
        prioridadNueva: newPriority,
        leadActualizado
      });

      const resultado = await leadApi.update(leadId, leadActualizado);
      console.log('✅ Respuesta del servidor:', resultado);

      // Actualizar el lead en la lista local
      setLeads(leads.map(lead =>
        lead.id === leadId ? { ...lead, prioridad: newPriority } : lead
      ));
    } catch (err) {
      console.error('❌ Error al actualizar prioridad:', err);
      alert('Error al actualizar la prioridad del lead');
    }
  };

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const toggleEstado = (estado: EstadoLeadEnum) => {
    setSelectedEstados(prev =>
      prev.includes(estado)
        ? prev.filter(e => e !== estado)
        : [...prev, estado]
    );
  };

  const togglePrioridad = (prioridad: PrioridadLeadEnum) => {
    setSelectedPrioridades(prev =>
      prev.includes(prioridad)
        ? prev.filter(p => p !== prioridad)
        : [...prev, prioridad]
    );
  };

  // Calcular días desde primer contacto
  const calcularDias = (fechaPrimerContacto?: string): number => {
    if (!fechaPrimerContacto) return 0;
    const hoy = new Date();
    const fechaContacto = new Date(fechaPrimerContacto);
    return Math.floor((hoy.getTime() - fechaContacto.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fecha?: string): string => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  // Filtrar y ordenar leads
  const processedLeads = useMemo(() => {
    let filtered = leads.filter((lead) => {
      // Filtro por búsqueda
      if (searchTerm.trim() !== '') {
        const busqueda = searchTerm.toLowerCase();
        const nombreMatch = lead.nombre.toLowerCase().includes(busqueda);
        const telefonoMatch = lead.telefono.toLowerCase().includes(busqueda);
        if (!nombreMatch && !telefonoMatch) return false;
      }

      // Filtro por estados
      if (selectedEstados.length > 0) {
        if (!selectedEstados.includes(lead.estadoLead)) return false;
      }

      // Filtro por prioridades
      if (selectedPrioridades.length > 0) {
        if (!lead.prioridad || !selectedPrioridades.includes(lead.prioridad)) return false;
      }

      return true;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (orderBy) {
        case 'nombre':
          aValue = a.nombre.toLowerCase();
          bValue = b.nombre.toLowerCase();
          break;
        case 'telefono':
          aValue = a.telefono;
          bValue = b.telefono;
          break;
        case 'provincia':
          aValue = a.provincia || '';
          bValue = b.provincia || '';
          break;
        case 'canal':
          aValue = a.canal;
          bValue = b.canal;
          break;
        case 'estadoLead':
          aValue = a.estadoLead;
          bValue = b.estadoLead;
          break;
        case 'prioridad':
          // Ordenar por prioridad: HOT > WARM > COLD
          const prioridadOrder = { HOT: 1, WARM: 2, COLD: 3 };
          aValue = a.prioridad ? prioridadOrder[a.prioridad] : 999;
          bValue = b.prioridad ? prioridadOrder[b.prioridad] : 999;
          break;
        case 'dias':
          aValue = calcularDias(a.fechaPrimerContacto);
          bValue = calcularDias(b.fechaPrimerContacto);
          break;
        case 'fechaPrimerContacto':
          aValue = a.fechaPrimerContacto || '';
          bValue = b.fechaPrimerContacto || '';
          break;
        case 'fechaUltimoContacto':
          aValue = a.fechaUltimoContacto || '';
          bValue = b.fechaUltimoContacto || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [leads, searchTerm, selectedEstados, selectedPrioridades, order, orderBy]);

  // Obtener fecha de creación normalizada (solo fecha, sin hora)
  const getFechaCreacion = (lead: LeadDTO): string => {
    const fecha = lead.fechaCreacion || lead.fechaPrimerContacto;
    if (!fecha) return '';
    return fecha.split('T')[0]; // Obtener solo YYYY-MM-DD
  };

  // Determinar color de fondo alternado por día de creación
  const getRowBackgroundByDate = (lead: LeadDTO, index: number): string => {
    if (index === 0) return 'transparent';

    const fechaActual = getFechaCreacion(lead);
    const fechaAnterior = getFechaCreacion(processedLeads[index - 1]);

    // Si cambió el día, contar cuántos cambios de día hubo antes
    let grupoIndex = 0;
    for (let i = 1; i <= index; i++) {
      if (getFechaCreacion(processedLeads[i]) !== getFechaCreacion(processedLeads[i - 1])) {
        grupoIndex++;
      }
    }

    // Alternar entre fondo transparente y fondo gris suave
    return grupoIndex % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)';
  };

  // Determinar color de fila según días y estado (superpuesto al fondo de fecha)
  const getRowColor = (lead: LeadDTO): string => {
    const dias = calcularDias(lead.fechaPrimerContacto);

    if (lead.estadoLead === EstadoLeadEnum.CONVERTIDO) {
      return 'rgba(5, 150, 105, 0.08)'; // Verde suave
    }
    if (lead.estadoLead === EstadoLeadEnum.DESCARTADO || lead.estadoLead === EstadoLeadEnum.PERDIDO) {
      return 'rgba(107, 114, 128, 0.08)'; // Gris suave
    }
    if (dias > 30) {
      return 'rgba(239, 68, 68, 0.1)'; // Rojo suave - urgente
    }
    if (dias > 15) {
      return 'rgba(245, 158, 11, 0.1)'; // Amarillo suave - atención
    }
    if (dias > 7) {
      return 'rgba(59, 130, 246, 0.08)'; // Azul suave - seguimiento
    }
    return '';
  };

  const estadosDisponibles: EstadoLeadEnum[] = [
    EstadoLeadEnum.PRIMER_CONTACTO,
    EstadoLeadEnum.EN_SEGUIMIENTO,
    EstadoLeadEnum.CALIFICADO,
    EstadoLeadEnum.PROPUESTA_ENVIADA,
    EstadoLeadEnum.NEGOCIACION,
    EstadoLeadEnum.CONVERTIDO,
    EstadoLeadEnum.PERDIDO,
    EstadoLeadEnum.DESCARTADO
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header compacto */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          📊 Gestión de Leads - Vista Compacta
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Total: {processedLeads.length} de {leads.length} leads
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/leads/nuevo')}
          >
            Nuevo Lead
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Barra de búsqueda y filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          {/* Búsqueda */}
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
              ),
            }}
          />

          {/* Chips de filtro por estado */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Filtrar por estado:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {estadosDisponibles.map((estado) => (
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

          {/* Chips de filtro por prioridad */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Filtrar por prioridad:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {[PrioridadLeadEnum.HOT, PrioridadLeadEnum.WARM, PrioridadLeadEnum.COLD].map((prioridad) => (
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
        </Stack>
      </Paper>

      {/* Tabla compacta */}
      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 280px)' }}>
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
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '15%', minWidth: 150, display: { xs: 'none', xl: 'table-cell' } }}>Interés</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '6%', minWidth: 70, display: { xs: 'none', md: 'table-cell' } }}>Rec.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '7%', minWidth: 80, display: { xs: 'none', lg: 'table-cell' } }}>
                <TableSortLabel
                  active={orderBy === 'fechaPrimerContacto'}
                  direction={orderBy === 'fechaPrimerContacto' ? order : 'asc'}
                  onClick={() => handleRequestSort('fechaPrimerContacto')}
                >
                  1er Cont.
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '7%', minWidth: 80, display: { xs: 'none', xl: 'table-cell' } }}>
                <TableSortLabel
                  active={orderBy === 'fechaUltimoContacto'}
                  direction={orderBy === 'fechaUltimoContacto' ? order : 'asc'}
                  onClick={() => handleRequestSort('fechaUltimoContacto')}
                >
                  Últ. Cont.
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
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '10%', minWidth: 120 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron leads con los filtros seleccionados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              processedLeads.map((lead, index) => {
                const colorEstado = getRowColor(lead);
                const colorFecha = getRowBackgroundByDate(lead, index);
                const bgColor = colorEstado || colorFecha;

                return (
                  <TableRow
                    key={lead.id}
                    hover
                    sx={{
                      bgcolor: bgColor,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                  <TableCell sx={{ py: 0.75, fontSize: '0.875rem' }}>
                    {lead.nombre}
                  </TableCell>
                  <TableCell sx={{ py: 0.75, fontSize: '0.875rem' }}>
                    {lead.telefono}
                  </TableCell>
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
                  <TableCell sx={{ py: 0.75, fontSize: '0.75rem', maxWidth: 200, display: { xs: 'none', xl: 'table-cell' } }}>
                    {lead.productoInteresNombre ? (
                      <Typography variant="caption" display="block" noWrap>
                        📦 {lead.productoInteresNombre}
                        {lead.cantidadProductoInteres && ` (${lead.cantidadProductoInteres})`}
                      </Typography>
                    ) : (lead.recetaInteresNombre || lead.equipoFabricadoInteresNombre) ? (
                      <Typography variant="caption" display="block" noWrap>
                        🔧 {lead.modeloRecetaInteres || lead.modeloEquipoInteres || ''}
                        {(lead.colorRecetaInteres || lead.colorEquipoInteres) && ` | ${(lead.colorRecetaInteres || lead.colorEquipoInteres)?.replace(/_/g, ' ')}`}
                        {(lead.medidaRecetaInteres || lead.medidaEquipoInteres) && ` | ${lead.medidaRecetaInteres || lead.medidaEquipoInteres}`}
                        {(lead.cantidadRecetaInteres || lead.cantidadEquipoInteres) && (
                          <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold', ml: 0.5 }}>
                            ({lead.cantidadRecetaInteres || lead.cantidadEquipoInteres})
                          </Box>
                        )}
                      </Typography>
                    ) : lead.equipoInteresadoNombre ? (
                      <Typography variant="caption" display="block" noWrap>
                        {lead.equipoInteresadoNombre}
                      </Typography>
                    ) : '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.75, display: { xs: 'none', md: 'table-cell' } }}>
                    <RecordatorioStatusBadge recordatorios={lead.recordatorios} />
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.75, fontSize: '0.75rem', display: { xs: 'none', lg: 'table-cell' } }}>
                    {formatearFecha(lead.fechaPrimerContacto)}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.75, fontSize: '0.75rem', display: { xs: 'none', xl: 'table-cell' } }}>
                    {formatearFecha(lead.fechaUltimoContacto)}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.75, fontSize: '0.875rem' }}>
                    {calcularDias(lead.fechaPrimerContacto) || '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                      <Tooltip title="Ver detalle">
                        <IconButton
                          size="small"
                          sx={{ p: 0.5 }}
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
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
                          <IconButton
                            size="small"
                            sx={{ p: 0.5 }}
                            onClick={() => navigate(`/leads/${lead.id}/editar`)}
                          >
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
    </Box>
  );
};
