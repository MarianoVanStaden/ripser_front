// @ts-nocheck - Temporary: MUI v7 Grid compatibility issue
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Autocomplete,
  InputAdornment,
  Grid,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { materialUtilizadoApi } from '../../api/services/materialUtilizadoApi';
import { productApi } from '../../api/services/productApi';
import { ordenServicioApi } from '../../api/services/ordenServicioApi';
import type { MaterialUtilizado, Producto, OrdenServicio } from '../../types';
import LoadingOverlay from '../common/LoadingOverlay';

const ControlMaterialesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [materiales, setMateriales] = useState<MaterialUtilizado[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialUtilizado | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenFilter, setOrdenFilter] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    ordenServicioId: string;
    productoId: string;
    cantidad: string;
    precioUnitario: string;
  }>({
    ordenServicioId: '',
    productoId: '',
    cantidad: '1',
    precioUnitario: '0'
  });

  useEffect(() => {
    loadMateriales();
    loadOrdenes();
    loadProductos();
  }, []);

  const loadMateriales = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await materialUtilizadoApi.getAll();
      setMateriales(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar los materiales utilizados');
      console.error('Error loading materiales:', err);
      setMateriales([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrdenes = async () => {
    try {
      const data = await ordenServicioApi.getAll();
      // Filtrar solo órdenes que no estén finalizadas o canceladas
      const ordenesActivas = (Array.isArray(data) ? data : []).filter(
        (o: OrdenServicio) => o.estado === 'PENDIENTE' || o.estado === 'EN_PROCESO'
      );
      setOrdenes(ordenesActivas);
    } catch (err) {
      console.error('Error loading ordenes:', err);
      setOrdenes([]);
    }
  };

  const loadProductos = async () => {
    try {
      const data = await productApi.getActivos();
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading productos:', err);
      setProductos([]);
    }
  };

  const handleOpenForm = (material?: MaterialUtilizado) => {
    if (material) {
      console.log('Opening form for material:', material);
      console.log('productoId:', material.productoId);
      setEditingMaterial(material);
      setFormData({
        ordenServicioId: material.ordenServicioId?.toString() || '',
        productoId: (material.productoId || material.productoTerminadoId)?.toString() || '',
        cantidad: material.cantidad.toString(),
        precioUnitario: material.precioUnitario.toString()
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        ordenServicioId: '',
        productoId: '',
        cantidad: '1',
        precioUnitario: '0'
      });
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingMaterial(null);
    setFormData({
      ordenServicioId: '',
      productoId: '',
      cantidad: '1',
      precioUnitario: '0'
    });
  };

  const handleSaveMaterial = async () => {
    // En modo edición, usar los IDs del material existente
    // En modo creación, validar que estén seleccionados
    if (editingMaterial) {
      // Modo edición: usar los IDs del material original
      const materialData: any = {
        id: editingMaterial.id,
        ordenServicioId: editingMaterial.ordenServicioId,
        productoId: editingMaterial.productoId || editingMaterial.productoTerminadoId, // El backend usa 'productoId'
        cantidad: parseInt(formData.cantidad) || 1,
        precioUnitario: parseFloat(formData.precioUnitario) || 0
      };
      
      console.log('Updating material with data:', materialData);
      console.log('editingMaterial:', editingMaterial);

      try {
        await materialUtilizadoApi.update(editingMaterial.id, materialData);
        await loadMateriales();
        handleCloseForm();
        setError(null);
      } catch (err: any) {
        let errorMsg = 'Error al actualizar el material';
        if (err.response?.status === 400) {
          const errors = err.response?.data;
          if (typeof errors === 'object' && errors !== null) {
            const errorMessages = Object.values(errors).join(', ');
            errorMsg = `Error de validación: ${errorMessages}`;
          } else if (typeof errors === 'string') {
            errorMsg = errors;
          }
        } else if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        }
        console.error('Error al actualizar material:', err);
        setError(errorMsg);
      }
      return;
    }

    // Modo creación: validar que estén seleccionados orden y producto
    if (!formData.ordenServicioId || !formData.productoId) {
      setError('Por favor seleccione una Orden de Servicio y un Producto');
      return;
    }

    // Crear el objeto DTO que el backend espera
    const materialData: any = {
      ordenServicioId: parseInt(formData.ordenServicioId),
      productoId: parseInt(formData.productoId),
      cantidad: parseInt(formData.cantidad) || 1,
      precioUnitario: parseFloat(formData.precioUnitario) || 0
    };

    try {
      await materialUtilizadoApi.create(materialData);

      await loadMateriales();
      handleCloseForm();
      setError(null);
    } catch (err: any) {
      let errorMsg = 'Error al guardar el material';

      if (err.response?.status === 400) {
        // Error de validación
        const errors = err.response?.data;
        if (typeof errors === 'object' && errors !== null) {
          const errorMessages = Object.values(errors).join(', ');
          errorMsg = `Error de validación: ${errorMessages}`;
        } else {
          errorMsg = 'Error de validación. Verifique los datos ingresados.';
        }
      } else if (err.response?.status === 415) {
        errorMsg = '⚠️ Error de configuración del servidor. El backend necesita actualización para soportar DTOs.';
      } else if (err.response?.status === 403) {
        errorMsg = 'Error de permisos o problema de serialización en el backend';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      console.error('Error saving material:', err);
      console.error('Error response:', err.response);
      console.error('Data sent:', materialData);
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este material?')) return;

    try {
      await materialUtilizadoApi.delete(id);
      await loadMateriales();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el material');
      console.error('Error deleting material:', err);
    }
  };

  const getOrdenInfo = (material: MaterialUtilizado) => {
    const orden = ordenes.find(o => o.id === material.ordenServicioId);
    return orden ? `${orden.numeroOrden} - ${orden.clienteNombre || 'Sin cliente'}` : `Orden #${material.ordenServicioId}`;
  };

  const getProductoNombre = (material: MaterialUtilizado) => {
    // Primero intentar usar productoNombre del DTO
    if (material.productoNombre) {
      return material.productoNombre;
    }
    // Fallback a objeto productoTerminado completo
    const productoId = material.productoId || material.productoTerminadoId;
    return material.productoTerminado?.nombre || `Producto #${productoId}`;
  };

  const filteredMateriales = materiales.filter(m => {
    const matchesOrden = ordenFilter === null || m.ordenServicioId === ordenFilter;
    const matchesSearch = !searchTerm ||
      getProductoNombre(m).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getOrdenInfo(m).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesOrden && matchesSearch;
  });

  // Calcular el producto seleccionado y actualizar el precio
  useEffect(() => {
    if (formData.productoId) {
      const producto = productos.find(p => p.id.toString() === formData.productoId);
      if (producto) {
        setFormData(prev => ({
          ...prev,
          precioUnitario: producto.precio.toString()
        }));
      }
    }
  }, [formData.productoId, productos]);

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Cargando materiales..." />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Control de Materiales
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadMateriales} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            fullWidth={isMobile}
          >
            Agregar Material
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box mb={2} display="flex" gap={2} flexWrap="wrap">
            <TextField
              label="Buscar"
              placeholder="Producto, N° Orden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 300 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Autocomplete
              options={[{ id: 0, numeroOrden: 'Todas las órdenes' }, ...ordenes]}
              getOptionLabel={(option: any) =>
                option.id === 0 ? option.numeroOrden : `${option.numeroOrden} - ${option.clienteNombre || ''}`
              }
              value={ordenFilter === null ? { id: 0, numeroOrden: 'Todas las órdenes' } : ordenes.find(o => o.id === ordenFilter) || null}
              onChange={(_, value: any) => setOrdenFilter(value?.id === 0 ? null : value?.id || null)}
              sx={{ minWidth: { xs: '100%', sm: 300 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              renderInput={(params) => (
                <TextField {...params} label="Filtrar por Orden" size="small" />
              )}
            />
          </Box>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 180 }}>Orden de Servicio</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Producto</TableCell>
                  <TableCell align="center" sx={{ minWidth: 80 }}>Cantidad</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>Precio Unitario</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100 }}>Subtotal</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMateriales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay materiales utilizados disponibles
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMateriales.map(material => (
                    <TableRow key={material.id} hover>
                      <TableCell>{getOrdenInfo(material)}</TableCell>
                      <TableCell>{getProductoNombre(material)}</TableCell>
                      <TableCell align="center">
                        <Chip label={material.cantidad} size="small" color="primary" />
                      </TableCell>
                      <TableCell align="right">${material.precioUnitario.toLocaleString('es-AR')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        ${material.subtotal.toLocaleString('es-AR')}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenForm(material)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteMaterial(material.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog de Formulario */}
      <Dialog
        open={formOpen}
        onClose={handleCloseForm}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            py: 2.5
          }}
        >
          <Box>
            <Typography component="div" sx={{ fontSize: '1.5rem', fontWeight: 600 }}>
              {editingMaterial ? '✏️ Editar Material' : '➕ Agregar Material'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
              {editingMaterial ? 'Modifique los campos necesarios' : 'Complete los datos del material utilizado'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom sx={{ mb: 2 }}>
                  📋 INFORMACIÓN DEL MATERIAL
                </Typography>
                <Stack spacing={2}>
                  {editingMaterial ? (
                    // Mostrar TextField de solo lectura al editar
                    <TextField
                      fullWidth
                      label="Orden de Servicio"
                      value={getOrdenInfo(editingMaterial)}
                      InputProps={{
                        readOnly: true,
                      }}
                      disabled
                      helperText="No se puede cambiar la orden al editar"
                    />
                  ) : (
                    // Mostrar Autocomplete al crear
                    <Autocomplete
                      options={ordenes}
                      getOptionLabel={(option) => `${option.numeroOrden} - ${option.clienteNombre || 'Sin cliente'} (${option.estado})`}
                      value={ordenes.find(o => o.id.toString() === formData.ordenServicioId) || null}
                      onChange={(_, value) =>
                        setFormData({ ...formData, ordenServicioId: value?.id.toString() || '' })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Orden de Servicio *"
                          required
                          placeholder="Seleccione una orden"
                        />
                      )}
                    />
                  )}

                  {editingMaterial ? (
                    // Mostrar TextField de solo lectura al editar
                    <TextField
                      fullWidth
                      label="Producto"
                      value={getProductoNombre(editingMaterial)}
                      InputProps={{
                        readOnly: true,
                      }}
                      disabled
                      helperText="No se puede cambiar el producto al editar"
                    />
                  ) : (
                    // Mostrar Autocomplete al crear
                    <Autocomplete
                      options={productos}
                      getOptionLabel={(option) => `${option.nombre} - $${option.precio} (Stock: ${option.stockActual})`}
                      value={productos.find(p => p.id.toString() === formData.productoId) || null}
                      onChange={(_, value) =>
                        setFormData({ ...formData, productoId: value?.id.toString() || '' })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Producto *"
                          required
                          placeholder="Seleccione un producto"
                        />
                      )}
                    />
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Cantidad *"
                        value={formData.cantidad}
                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                        required
                        inputProps={{ min: 1 }}
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Precio Unitario *"
                        value={formData.precioUnitario}
                        onChange={(e) => setFormData({ ...formData, precioUnitario: e.target.value })}
                        required
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>
                  </Grid>

                  <Alert severity="info">
                    <Typography variant="caption">
                      <strong>Subtotal:</strong> ${(parseFloat(formData.cantidad) * parseFloat(formData.precioUnitario) || 0).toLocaleString('es-AR')}
                    </Typography>
                  </Alert>
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'grey.100', borderTop: '1px solid', borderColor: 'grey.300' }}>
          <Button
            onClick={handleCloseForm}
            size="large"
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveMaterial}
            variant="contained"
            size="large"
            disabled={
              editingMaterial 
                ? (!formData.cantidad || !formData.precioUnitario)
                : (!formData.ordenServicioId || !formData.productoId || !formData.cantidad || !formData.precioUnitario)
            }
            sx={{ minWidth: 160 }}
          >
            {editingMaterial ? '💾 Guardar' : '➕ Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ControlMaterialesPage;
