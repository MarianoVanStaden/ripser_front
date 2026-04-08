import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Box,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as ActivarIcon,
  Block as DesactivarIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';
import { proveedorProductoApi } from '../../api/services/proveedorProductoApi';
import { productApi } from '../../api/services/productApi';
import type { ProveedorDTO, ProveedorProductoDTO, Producto } from '../../types';

interface Props {
  open: boolean;
  proveedor: ProveedorDTO | null;
  onClose: () => void;
}

const ProveedorProductosDialog: React.FC<Props> = ({ open, proveedor, onClose }) => {
  const [relaciones, setRelaciones] = useState<ProveedorProductoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [todosProductos, setTodosProductos] = useState<Producto[]>([]);

  // Sub-dialog "Asociar producto"
  const [openAsociar, setOpenAsociar] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [precioInput, setPrecioInput] = useState('');
  const [savingAsociar, setSavingAsociar] = useState(false);
  const [errorAsociar, setErrorAsociar] = useState<string | null>(null);

  // Confirm eliminar
  const [confirmEliminarId, setConfirmEliminarId] = useState<number | null>(null);

  useEffect(() => {
    if (open && proveedor) {
      loadRelaciones();
      loadTodosProductos();
    }
  }, [open, proveedor]);

  const loadRelaciones = async () => {
    if (!proveedor) return;
    try {
      setLoading(true);
      setError(null);
      const data = await proveedorProductoApi.getByProveedor(proveedor.id);
      setRelaciones(data);
    } catch (err: any) {
      setError('Error al cargar los productos del proveedor');
    } finally {
      setLoading(false);
    }
  };

  const loadTodosProductos = async () => {
    try {
      const page = await productApi.getAll({ size: 10000 });
      const data = Array.isArray(page) ? page : (page?.content ?? []);
      setTodosProductos(data);
    } catch {
      // silencioso: si falla, el selector quedará vacío
    }
  };

  const handleActivar = async (id: number) => {
    try {
      const updated = await proveedorProductoApi.activar(id);
      setRelaciones((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al activar el producto');
    }
  };

  const handleDesactivar = async (id: number) => {
    try {
      const updated = await proveedorProductoApi.desactivar(id);
      setRelaciones((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al desactivar el producto');
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await proveedorProductoApi.delete(id);
      setRelaciones((prev) => prev.filter((r) => r.id !== id));
      setConfirmEliminarId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el producto');
      setConfirmEliminarId(null);
    }
  };

  const handleGuardarAsociar = async () => {
    if (!proveedor || !productoSeleccionado) return;
    try {
      setSavingAsociar(true);
      setErrorAsociar(null);
      const nuevaRelacion = await proveedorProductoApi.create({
        proveedorId: proveedor.id,
        productoId: productoSeleccionado.id,
        precioProveedor: precioInput ? parseFloat(precioInput) : undefined,
      });
      setRelaciones((prev) => [...prev, nuevaRelacion]);
      setOpenAsociar(false);
      setProductoSeleccionado(null);
      setPrecioInput('');
    } catch (err: any) {
      setErrorAsociar(
        err.response?.data?.message || 'El producto ya está asociado a este proveedor'
      );
    } finally {
      setSavingAsociar(false);
    }
  };

  const handleCloseAsociar = () => {
    setOpenAsociar(false);
    setProductoSeleccionado(null);
    setPrecioInput('');
    setErrorAsociar(null);
  };

  const productosDisponibles = todosProductos.filter(
    (p) => !relaciones.some((r) => r.productoId === p.id)
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Productos — {proveedor?.razonSocial}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAsociar(true)}
              size="small"
            >
              Asociar producto
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Precio proveedor</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {relaciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" py={2}>
                          No hay productos asociados a este proveedor
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    relaciones.map((rel) => (
                      <TableRow key={rel.id}>
                        <TableCell>{rel.productoCodigo}</TableCell>
                        <TableCell>{rel.productoNombre}</TableCell>
                        <TableCell>
                          {rel.precioProveedor != null
                            ? `$${rel.precioProveedor.toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={rel.activo ? 'Activo' : 'Inactivo'}
                            color={rel.activo ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {rel.activo ? (
                            <IconButton
                              size="small"
                              title="Desactivar"
                              onClick={() => handleDesactivar(rel.id)}
                            >
                              <DesactivarIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="small"
                              title="Activar"
                              onClick={() => handleActivar(rel.id)}
                            >
                              <ActivarIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            title="Eliminar"
                            color="error"
                            disabled={rel.activo}
                            onClick={() => setConfirmEliminarId(rel.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Sub-dialog: Asociar producto */}
      <Dialog open={openAsociar} onClose={handleCloseAsociar} maxWidth="sm" fullWidth>
        <DialogTitle>Asociar producto a {proveedor?.razonSocial}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {errorAsociar && (
              <Alert severity="error">{errorAsociar}</Alert>
            )}
            <Autocomplete
              options={productosDisponibles}
              getOptionLabel={(option) => `${option.nombre} (${option.codigo || 'sin código'})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={productoSeleccionado}
              onChange={(_, newValue) => setProductoSeleccionado(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Producto"
                  required
                  placeholder="Buscar producto..."
                />
              )}
            />
            <TextField
              label="Precio del proveedor (opcional)"
              type="number"
              value={precioInput}
              onChange={(e) => setPrecioInput(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAsociar} disabled={savingAsociar}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardarAsociar}
            disabled={!productoSeleccionado || savingAsociar}
          >
            {savingAsociar ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm eliminar */}
      <Dialog open={confirmEliminarId !== null} onClose={() => setConfirmEliminarId(null)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar este producto de la lista del proveedor? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmEliminarId(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => confirmEliminarId !== null && handleEliminar(confirmEliminarId)}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProveedorProductosDialog;
