import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle,
  Cancel,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  recetaFabricacionApi,
} from '../../api/services/recetaFabricacionApi';
import type { DetalleRecetaCreateDTO, RecetaFabricacionDTO } from  '../../types';
import api from '../../api/config';
import RecetaCosteoSection from './RecetaCosteoSection';

interface Producto {
  id: number;
  nombre: string;
  codigo: string;
  precio: number;
  costo: number | null;
}

const RecetaDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [receta, setReceta] = useState<RecetaFabricacionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);

  // Estado para agregar material
  const [addDialog, setAddDialog] = useState(false);
  const [newDetalle, setNewDetalle] = useState<DetalleRecetaCreateDTO>({
    productoId: 0,
    cantidad: 1,
    costoUnitario: 0,
    observaciones: '',
  });
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Estado para recalculo de costos
  const [recalculatingCosts, setRecalculatingCosts] = useState(false);

  useEffect(() => {
    if (id) {
      loadReceta();
      loadProductos();
    }
  }, [id]);

  const loadReceta = async () => {
    try {
      setLoading(true);
      const data = await recetaFabricacionApi.findById(Number(id));
      setReceta(data);
    } catch (error) {
      console.error('Error loading receta:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar la receta',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProductos = async () => {
    try {
      const response = await api.get('/api/productos/activos');
      setProductos(response.data || []);
    } catch (error) {
      console.error('Error loading productos:', error);
    }
  };

  const handleAddDetalle = async () => {
    if (!selectedProducto || newDetalle.cantidad <= 0) {
      setSnackbar({
        open: true,
        message: 'Complete todos los campos requeridos',
        severity: 'error',
      });
      return;
    }

    try {
      const detalle: DetalleRecetaCreateDTO = {
        productoId: selectedProducto.id,
        cantidad: newDetalle.cantidad,
        costoUnitario: newDetalle.costoUnitario || selectedProducto.precio,
        observaciones: newDetalle.observaciones,
      };

      await recetaFabricacionApi.addDetalle(Number(id), detalle);
      setSnackbar({
        open: true,
        message: 'Material agregado correctamente',
        severity: 'success',
      });
      setAddDialog(false);
      resetNewDetalle();
      loadReceta();
    } catch (error) {
      console.error('Error adding detalle:', error);
      setSnackbar({
        open: true,
        message: 'Error al agregar el material',
        severity: 'error',
      });
    }
  };

  const handleRemoveDetalle = async (detalleId: number) => {
    try {
      await recetaFabricacionApi.removeDetalle(Number(id), detalleId);
      setSnackbar({
        open: true,
        message: 'Material eliminado correctamente',
        severity: 'success',
      });
      loadReceta();
    } catch (error) {
      console.error('Error removing detalle:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar el material',
        severity: 'error',
      });
    }
  };

  const handleToggleActive = async () => {
    if (!receta) return;
    try {
      if (receta.activo) {
        await recetaFabricacionApi.deactivate(receta.id);
      } else {
        await recetaFabricacionApi.activate(receta.id);
      }
      loadReceta();
      setSnackbar({
        open: true,
        message: `Receta ${receta.activo ? 'desactivada' : 'activada'} correctamente`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al cambiar el estado',
        severity: 'error',
      });
    }
  };

  const handleRecalcularCostos = async () => {
    if (!receta) return;
    try {
      setRecalculatingCosts(true);
      const updated = await recetaFabricacionApi.recalcularCostos(receta.id);
      setReceta(updated);
      setSnackbar({
        open: true,
        message: 'Costos recalculados correctamente',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error recalculating costs:', error);
      setSnackbar({
        open: true,
        message: 'Error al recalcular los costos',
        severity: 'error',
      });
    } finally {
      setRecalculatingCosts(false);
    }
  };

  const resetNewDetalle = () => {
    setNewDetalle({
      productoId: 0,
      cantidad: 1,
      costoUnitario: 0,
      observaciones: '',
    });
    setSelectedProducto(null);
  };

  const totalCost = receta?.detalles.reduce((sum, d) => sum + d.subtotal, 0) || 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!receta) {
    return (
      <Box p={3}>
        <Alert severity="error">Receta no encontrada</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/fabricacion/recetas')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="600">
            {receta.nombre}
          </Typography>
          <Chip
            label={receta.activo ? 'Activa' : 'Inactiva'}
            color={receta.activo ? 'success' : 'default'}
          />
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={receta.activo ? <Cancel /> : <CheckCircle />}
            onClick={handleToggleActive}
          >
            {receta.activo ? 'Desactivar' : 'Activar'}
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/fabricacion/recetas/editar/${receta.id}`)}
          >
            Editar
          </Button>
        </Stack>
      </Box>

      {/* Información General */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información General
              </Typography>
              <Stack spacing={2} mt={2}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Código
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {receta.codigo}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Tipo de Equipo
                  </Typography>
                  <Box mt={0.5}>
                    <Chip label={receta.tipoEquipo} color="primary" size="small" />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Modelo
                  </Typography>
                  <Typography variant="body1">{receta.modelo || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Medida
                  </Typography>
                  <Typography variant="body1">{receta.medida || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Precio de Venta
                  </Typography>
                  <Typography variant="body1" fontWeight="600" color="primary">
                    {receta.precioVenta
                      ? `$${receta.precioVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                      : 'No configurado'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Costo de Fabricacion
                  </Typography>
                  <Typography variant="body1" fontWeight="600" color="secondary">
                    {receta.costoFabricacion != null
                      ? `$${receta.costoFabricacion.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                      : 'No calculado'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Disponible para Venta
                  </Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={receta.disponibleParaVenta ? 'Sí' : 'No'}
                      color={receta.disponibleParaVenta ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Descripción
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={2}>
                {receta.descripcion || 'Sin descripción'}
              </Typography>
              <Box mt={3}>
                <Typography variant="caption" color="textSecondary">
                  Fecha de Creación
                </Typography>
                <Typography variant="body1">
                  {dayjs(receta.fechaCreacion).format('DD/MM/YYYY HH:mm')}
                </Typography>
              </Box>
              {receta.observaciones && (
                <Box mt={2}>
                  <Typography variant="caption" color="textSecondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body2">{receta.observaciones}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Materiales/Detalles */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Lista de Materiales</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={recalculatingCosts ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={handleRecalcularCostos}
              disabled={recalculatingCosts || receta.detalles.length === 0}
            >
              Recalcular Costos
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAddDialog(true)}
            >
              Agregar Material
            </Button>
          </Stack>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Código</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Costo Unit.</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell>Observaciones</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receta.detalles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No hay materiales agregados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                receta.detalles.map((detalle) => (
                  <TableRow key={detalle.id}>
                    <TableCell>{detalle.productoNombre}</TableCell>
                    <TableCell>{detalle.productoCodigo}</TableCell>
                    <TableCell align="right">{detalle.cantidad}</TableCell>
                    <TableCell align="right">
                      ${detalle.costoUnitario.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="500">
                        ${detalle.subtotal.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>{detalle.observaciones || '-'}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveDetalle(detalle.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {receta.detalles.length > 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="right">
                    <Typography variant="h6">Total:</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" color="primary">
                      ${totalCost.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Costeo */}
      <RecetaCosteoSection recetaId={Number(id)} />

      {/* Dialog para agregar material */}
      <Dialog
        open={addDialog}
        onClose={() => {
          setAddDialog(false);
          resetNewDetalle();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agregar Material</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Autocomplete
              options={productos}
              getOptionLabel={(option) => `${option.nombre} (${option.codigo})`}
              value={selectedProducto}
              onChange={(_, newValue) => {
                setSelectedProducto(newValue);
                if (newValue) {
                  setNewDetalle((prev) => ({
                    ...prev,
                    productoId: newValue.id,
                    costoUnitario: newValue.costo ?? newValue.precio,
                  }));
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Producto *" required />
              )}
            />
            <TextField
              label="Cantidad *"
              type="number"
              value={newDetalle.cantidad}
              onChange={(e) =>
                setNewDetalle((prev) => ({
                  ...prev,
                  cantidad: Number(e.target.value),
                }))
              }
              InputProps={{ inputProps: { min: 1 } }}
              required
            />
            <TextField
              label="Costo Unitario *"
              type="number"
              value={newDetalle.costoUnitario}
              onChange={(e) =>
                setNewDetalle((prev) => ({
                  ...prev,
                  costoUnitario: Number(e.target.value),
                }))
              }
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              required
            />
            <TextField
              label="Observaciones"
              multiline
              rows={3}
              value={newDetalle.observaciones}
              onChange={(e) =>
                setNewDetalle((prev) => ({
                  ...prev,
                  observaciones: e.target.value,
                }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddDialog(false);
              resetNewDetalle();
            }}
          >
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleAddDetalle}>
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecetaDetail;
