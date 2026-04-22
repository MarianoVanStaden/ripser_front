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
import LoadingOverlay from '../../components/common/LoadingOverlay';

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
      
      console.log('🔄 Loading leads with sucursalFiltro:', sucursalFiltro);
      
      // Pasar sucursalFiltro al API (filtering params are second argument)
      // First argument is pagination, passing empty object for default or first page
      // Default page size 1000 to get all leads for client-side filtering if needed
      const response = await leadApi.getAll(
        { page: 0, size: 1000 }, 
        { sucursalId: sucursalFiltro }
      );
      
      const data = response.content || [];
      console.log(`✅ Loaded ${data.length} leads from API`);

      // 🔍 DEBUG & CLIENT-SIDE FILTERING FALLBACK
      // Si el backend no filtra (el usuario reporta error), filtramos en el cliente si es posible
      let filteredData = data;
      
      if (sucursalFiltro && filteredData.length > 0) {
        // Verificar estructura de datos
        // Intentamos encontrar campos de sucursal
        const sampleItem = filteredData[0] as any;
        const hasSucursalId = sampleItem.sucursalId !== undefined;
        const hasSucursalObj = sampleItem.sucursal && sampleItem.sucursal.id !== undefined;
        
        // Solo aplicar filtro si detectamos que la info existe en la respuesta
        if (hasSucursalId || hasSucursalObj) {
          const initialCount = filteredData.length;
          filteredData = filteredData.filter((item: any) => {
            const itemSucursalId = item.sucursalId || item.sucursal?.id;
            // Si el item no tiene sucursal asignada (es null), asumimos que es global o de empresa
            // Pero si estamos filtrando por una sucursal específica, ¿deberíamos mostrarlo?
            // Generalmente NO.
            return itemSucursalId && Number(itemSucursalId) === Number(sucursalFiltro);
          });
          
          if (filteredData.length < initialCount) {
             console.log(`📉 Applied client-side filtering: ${initialCount} -> ${filteredData.length} leads for sucursal ${sucursalFiltro}`);
          }
        }
      }
      
      // Cargar recordatorios para cada lead
      const leadsConRecordatorios = await Promise.all(
        filteredData.map(async (lead) => {
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

  return (
    <Box sx={{ p: 3 }}>
      <LoadingOverlay open={loading} message="Cargando leads..." />
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
                    {lead.productoInteresNombre ? (
                      <Typography variant="body2" noWrap title={lead.productoInteresNombre}>
                        {lead.productoInteresNombre}
                      </Typography>
                    ) : (lead.modeloRecetaInteres || lead.modeloEquipoInteres) ? (
                      <Typography variant="body2" noWrap title={lead.modeloRecetaInteres || lead.modeloEquipoInteres}>
                        {lead.modeloRecetaInteres || lead.modeloEquipoInteres}
                      </Typography>
                    ) : lead.equipoInteresadoNombre ? (
                      <Typography variant="body2" noWrap title={lead.equipoInteresadoNombre}>
                        {lead.equipoInteresadoNombre}
                      </Typography>
                    ) : '-'}
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
