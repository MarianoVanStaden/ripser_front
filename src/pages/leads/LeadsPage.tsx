import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as ConvertIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { leadApi } from '../../api/services/leadApi';
import { EstadoLeadEnum, PROVINCIA_LABELS } from '../../types/lead.types';
import type { LeadDTO, LeadFilterState } from '../../types/lead.types';
import { LeadStatusBadge } from '../../components/leads/LeadStatusBadge';
import { CanalBadge } from '../../components/leads/CanalBadge';
import { LeadFilters } from '../../components/leads/LeadFilters';
import { RecordatorioStatusBadge } from '../../components/leads/RecordatorioStatusBadge';
import { useTenant } from '../../context/TenantContext';

export const LeadsPage = () => {
  const navigate = useNavigate();
  const { sucursalFiltro } = useTenant();
  const [leads, setLeads] = useState<LeadDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeadFilterState>({
    estados: [],
    canales: [],
    provincias: [],
    busqueda: ''
  });

  // Cargar leads al montar el componente y cuando cambia la sucursal
  useEffect(() => {
    loadLeads();
  }, [sucursalFiltro]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      // Pasar sucursalFiltro al API
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

  // Filtrar leads basado en los criterios seleccionados
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Filtro por estados
      if (filters.estados && filters.estados.length > 0) {
        if (!filters.estados.includes(lead.estadoLead)) {
          return false;
        }
      }

      // Filtro por canales
      if (filters.canales && filters.canales.length > 0) {
        if (!filters.canales.includes(lead.canal)) {
          return false;
        }
      }

      // Filtro por provincias
      if (filters.provincias && filters.provincias.length > 0) {
        if (!lead.provincia || !filters.provincias.includes(lead.provincia)) {
          return false;
        }
      }

      // Filtro por búsqueda (nombre o teléfono)
      if (filters.busqueda && filters.busqueda.trim() !== '') {
        const busqueda = filters.busqueda.toLowerCase();
        const nombreMatch = lead.nombre.toLowerCase().includes(busqueda);
        const telefonoMatch = lead.telefono.toLowerCase().includes(busqueda);
        if (!nombreMatch && !telefonoMatch) {
          return false;
        }
      }

      return true;
    });
  }, [leads, filters]);

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📊 Gestión de Leads
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/leads/nuevo')}
        >
          Nuevo Lead
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <LeadFilters filters={filters} onFilterChange={setFilters} />

      {/* Tabla de Leads */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Teléfono</strong></TableCell>
              <TableCell><strong>Provincia</strong></TableCell>
              <TableCell><strong>Canal</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Equipo Interesado</strong></TableCell>
              <TableCell align="center"><strong>Recordatorio</strong></TableCell>
              <TableCell align="center"><strong>Días</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No se encontraron leads con los filtros seleccionados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  hover
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    opacity: lead.estadoLead === EstadoLeadEnum.CONVERTIDO ? 0.6 : 1
                  }}
                >
                  <TableCell>{lead.nombre}</TableCell>
                  <TableCell>{lead.telefono}</TableCell>
                  <TableCell>{lead.provincia ? PROVINCIA_LABELS[lead.provincia] : '-'}</TableCell>
                  <TableCell>
                    <CanalBadge canal={lead.canal} />
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.estadoLead} />
                  </TableCell>
                  <TableCell>
                    {lead.productoInteresNombre && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          📦 {lead.productoInteresNombre}
                        </Typography>
                        {lead.cantidadProductoInteres && (
                          <Typography variant="caption" color="primary.main">
                            Cantidad: {lead.cantidadProductoInteres}
                          </Typography>
                        )}
                      </Box>
                    )}
                    {(lead.recetaInteresNombre || lead.equipoFabricadoInteresNombre) && (
                      <Box>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          🔧 RECETA: {lead.recetaInteresNombre || lead.equipoFabricadoInteresNombre}
                        </Typography>
                        {(lead.modeloRecetaInteres || lead.modeloEquipoInteres) && (
                          <Typography variant="caption" display="block">
                            Modelo: {lead.modeloRecetaInteres || lead.modeloEquipoInteres}
                          </Typography>
                        )}
                        {(lead.colorRecetaInteres || lead.colorEquipoInteres) && (
                          <Typography variant="caption" display="block">
                            Color: {(lead.colorRecetaInteres || lead.colorEquipoInteres)?.replace(/_/g, ' ')}
                          </Typography>
                        )}
                        {(lead.medidaRecetaInteres || lead.medidaEquipoInteres) && (
                          <Typography variant="caption" display="block">
                            Medida: {lead.medidaRecetaInteres || lead.medidaEquipoInteres}
                          </Typography>
                        )}
                        {(lead.cantidadRecetaInteres || lead.cantidadEquipoInteres) && (
                          <Typography variant="caption" color="success.main" display="block" fontWeight="bold">
                            Cantidad: {lead.cantidadRecetaInteres || lead.cantidadEquipoInteres}
                          </Typography>
                        )}
                      </Box>
                    )}
                    {!lead.productoInteresNombre && !lead.recetaInteresNombre && !lead.equipoFabricadoInteresNombre && (lead.equipoInteresadoNombre || '-')}
                  </TableCell>
                  <TableCell align="center">
                    <RecordatorioStatusBadge recordatorios={lead.recordatorios} />
                  </TableCell>
                  <TableCell align="center">
                    {lead.fechaPrimerContacto ? (() => {
                      const hoy = new Date();
                      const fechaContacto = new Date(lead.fechaPrimerContacto);
                      const diferenciaDias = Math.floor((hoy.getTime() - fechaContacto.getTime()) / (1000 * 60 * 60 * 24));
                      return diferenciaDias;
                    })() : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Ver detalle">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {lead.telefono && (
                        <Tooltip title="Abrir WhatsApp">
                          <IconButton
                            size="small"
                            sx={{ color: '#25D366' }}
                            onClick={() => {
                              const phone = lead.telefono.replace(/\D/g, '');
                              window.open(`https://wa.me/${phone}`, '_blank');
                            }}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {lead.estadoLead !== EstadoLeadEnum.CONVERTIDO && (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => navigate(`/leads/${lead.id}/editar`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canConvert(lead) && (
                        <Tooltip title="Convertir a Cliente">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => navigate(`/leads/${lead.id}/convertir`)}
                          >
                            <ConvertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {lead.estadoLead !== EstadoLeadEnum.CONVERTIDO && (
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(lead.id!)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Stats */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', px: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Total: {filteredLeads.length} leads
        </Typography>
        {filters.estados && filters.estados.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            Filtrados de {leads.length} leads totales
          </Typography>
        )}
      </Box>
    </Box>
  );
};
