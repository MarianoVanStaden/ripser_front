import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, IconButton, TextField, Stack, 
  Chip, Alert, CircularProgress, Grid, InputAdornment, Autocomplete, Dialog,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Search as SearchIcon,
  Block as BlockIcon,
  Visibility as VisibilityIcon,
  LocalShipping as ShippingIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { garantiaApi, type GarantiaDTO } from '../../api/services/garantiaApi';
import { productApi } from '../../api/services/productApi';
import { documentoApi } from '../../api/documentoApi';
import GarantiaFormDialog from './GarantiaFormDialog';
import GarantiaDetailPage from './GarantiaDetailPage';

const GarantiasPage: React.FC = () => {
  const [garantias, setGarantias] = useState<GarantiaDTO[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [productoFilter, setProductoFilter] = useState<any>(null);
  
  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedGarantia, setSelectedGarantia] = useState<GarantiaDTO | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load data with error handling for each request
      const [garantiasData, productosData, facturasData] = await Promise.allSettled([
        garantiaApi.findAll(),
        productApi.getAll(),
        documentoApi.getByTipo('FACTURA')
      ]);
      
      // Handle garantias
      if (garantiasData.status === 'fulfilled') {
        setGarantias(Array.isArray(garantiasData.value) ? garantiasData.value : []);
      } else {
        console.error('Error loading garantias:', garantiasData.reason);
        setError('Error al cargar las garantías: ' + (garantiasData.reason?.response?.data?.message || garantiasData.reason?.message || 'Error desconocido'));
      }
      
      // Handle productos
      if (productosData.status === 'fulfilled') {
        setProductos(Array.isArray(productosData.value) ? productosData.value : []);
      } else {
        console.error('Error loading productos:', productosData.reason);
      }
      
      // Handle facturas
      if (facturasData.status === 'fulfilled') {
        setFacturas(Array.isArray(facturasData.value) ? facturasData.value : []);
      } else {
        console.error('Error loading facturas:', facturasData.reason);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Handle anular garantia
  const handleAnular = async (id: number) => {
    if (!window.confirm('¿Está seguro de anular esta garantía?')) return;
    
    try {
      const updated = await garantiaApi.anular(id);
      setGarantias(garantias.map(g => g.id === id ? updated : g));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al anular la garantía');
    }
  };

  // Filter garantias
  const filteredGarantias = garantias.filter(g => {
    const matchSearch = search === '' || 
      g.producto.nombre.toLowerCase().includes(search.toLowerCase()) ||
      g.numeroSerie.toLowerCase().includes(search.toLowerCase()) ||
      g.venta.numeroComprobante?.toLowerCase().includes(search.toLowerCase());
    
    const matchEstado = estadoFilter === 'TODOS' || g.estado === estadoFilter;
    const matchProducto = !productoFilter || g.producto.id === productoFilter.id;
    
    return matchSearch && matchEstado && matchProducto;
  });

  // Get status color
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'VIGENTE':
        return 'success';
      case 'VENCIDA':
        return 'error';
      case 'ANULADA':
        return 'default';
      default:
        return 'warning';
    }
  };

  // Calculate statistics
  const stats = {
    total: garantias.length,
    vigentes: garantias.filter(g => g.estado === 'VIGENTE').length,
    vencidas: garantias.filter(g => g.estado === 'VENCIDA').length,
    anuladas: garantias.filter(g => g.estado === 'ANULADA').length,
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3} fontWeight="bold">
        Gestión de Garantías
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Garantías
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ShippingIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.vigentes}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Vigentes
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.50', borderLeft: '4px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <BlockIcon sx={{ fontSize: 40, color: 'error.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {stats.vencidas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Vencidas
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'grey.100', borderLeft: '4px solid', borderColor: 'grey.500' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <BlockIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="grey.700">
                    {stats.anuladas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Anuladas
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar por producto, serie o venta"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estadoFilter}
                  label="Estado"
                  onChange={(e) => setEstadoFilter(e.target.value)}
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="VIGENTE">Vigente</MenuItem>
                  <MenuItem value="VENCIDA">Vencida</MenuItem>
                  <MenuItem value="ANULADA">Anulada</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                options={productos}
                getOptionLabel={(option) => option.nombre}
                value={productoFilter}
                onChange={(_, newValue) => setProductoFilter(newValue)}
                renderInput={(params) => <TextField {...params} label="Producto" />}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedGarantia(null);
                  setFormOpen(true);
                }}
              >
                Nueva Garantía
              </Button>
            </Grid>
          </Grid>

          {/* Active Filters */}
          {(estadoFilter !== 'TODOS' || productoFilter || search) && (
            <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
              {search && (
                <Chip 
                  label={`Búsqueda: "${search}"`} 
                  onDelete={() => setSearch('')} 
                  size="small"
                />
              )}
              {estadoFilter !== 'TODOS' && (
                <Chip 
                  label={`Estado: ${estadoFilter}`} 
                  onDelete={() => setEstadoFilter('TODOS')} 
                  size="small"
                  color="primary"
                />
              )}
              {productoFilter && (
                <Chip 
                  label={`Producto: ${productoFilter.nombre}`} 
                  onDelete={() => setProductoFilter(null)} 
                  size="small"
                  color="secondary"
                />
              )}
              <Button 
                size="small" 
                onClick={() => {
                  setSearch('');
                  setEstadoFilter('TODOS');
                  setProductoFilter(null);
                }}
              >
                Limpiar Filtros
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>N° Serie</strong></TableCell>
              <TableCell><strong>Producto</strong></TableCell>
              <TableCell><strong>N° Venta</strong></TableCell>
              <TableCell align="center"><strong>Fecha Compra</strong></TableCell>
              <TableCell align="center"><strong>Fecha Vencimiento</strong></TableCell>
              <TableCell align="center"><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredGarantias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="textSecondary" py={4}>
                    No se encontraron garantías
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredGarantias.map((garantia) => (
                <TableRow key={garantia.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {garantia.numeroSerie}
                    </Typography>
                  </TableCell>
                  <TableCell>{garantia.producto?.nombre || 'Sin producto'}</TableCell>
                  <TableCell>
                    {garantia.venta?.numeroComprobante || `#${garantia.venta?.id || ''}`}
                  </TableCell>
                  <TableCell align="center">
                    {dayjs(garantia.fechaCompra).format('DD/MM/YYYY')}
                  </TableCell>
                  <TableCell align="center">
                    <Typography 
                      variant="body2"
                      color={
                        garantia.estado === 'VENCIDA' 
                          ? 'error.main' 
                          : dayjs(garantia.fechaVencimiento).diff(dayjs(), 'day') < 30
                            ? 'warning.main'
                            : 'textPrimary'
                      }
                      fontWeight="500"
                    >
                      {dayjs(garantia.fechaVencimiento).format('DD/MM/YYYY')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={garantia.estado} 
                      color={getStatusColor(garantia.estado)}
                      size="small"
                      sx={{ fontWeight: 600, minWidth: 90 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setSelectedGarantia(garantia);
                          setDetailOpen(true);
                        }}
                        title="Ver Detalle"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      
                      {garantia.estado === 'VIGENTE' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleAnular(garantia.id)}
                          title="Anular Garantía"
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogs */}
      <GarantiaFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedGarantia(null);
        }}
        onSave={() => {
          setFormOpen(false);
          setSelectedGarantia(null);
          loadData();
        }}
        productos={productos}
        ventas={facturas}
      />

      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedGarantia && (
          <GarantiaDetailPage
            garantia={selectedGarantia}
            onBack={() => setDetailOpen(false)}
            onAnular={() => {
              handleAnular(selectedGarantia.id);
              setDetailOpen(false);
            }}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default GarantiasPage;
