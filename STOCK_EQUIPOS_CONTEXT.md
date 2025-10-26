# Contexto para Crear StockEquiposPage

## 🎯 Objetivo
Crear una página **StockEquiposPage** similar a StockPage.tsx pero para gestionar el inventario de equipos fabricados (heladeras, coolboxes, exhibidores).

---

## 📁 Archivo de Referencia Principal

### StockPage.tsx (Productos)
```tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { productApi } from '../../api/services/productApi';
import { movimientoStockApi } from '../../api/services/movimientoStockApi';
import { categoriaProductoApi } from '../../api/services/categoriaProductoApi';
import type { Producto, MovimientoStock, CategoriaProducto } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stock-tabpanel-${index}`}
      aria-labelledby={`stock-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StockPage: React.FC = () => {
  const [products, setProducts] = useState<Producto[]>([]);
  const [stockMovements, setStockMovements] = useState<MovimientoStock[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    stockMinimo: 0,
    categoriaProductoId: 1,
    activo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, movementsData, categoriasData] = await Promise.all([
        productApi.getAll(),
        movimientoStockApi.getAll(),
        categoriaProductoApi.getAll(),
      ]);

      setProducts(productsData);
      setStockMovements(movementsData);
      setCategorias(categoriasData);
      setError(null);
    } catch (err) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 403 || error.response?.status === 401) {
        setError('No tiene permisos para acceder a esta información. Por favor, inicie sesión nuevamente.');
      } else {
        setError('Error al cargar los datos');
      }
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Producto) => {
    setSelectedProduct(product);
    setEditForm({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio: product.precio,
      stockMinimo: product.stockMinimo,
      categoriaProductoId: product.categoriaProducto?.id || product.categoriaProductoId || 1,
      activo: product.activo,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      await productApi.update(selectedProduct.id, {
        nombre: editForm.nombre,
        descripcion: editForm.descripcion,
        precio: editForm.precio,
        stockMinimo: editForm.stockMinimo,
        categoriaProductoId: editForm.categoriaProductoId,
        activo: editForm.activo,
      });

      await loadData();
      setEditDialogOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Error al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  const lowStockCount = products.filter(p => p.stockActual <= p.stockMinimo && p.stockActual > 0).length;
  const outOfStockCount = products.filter(p => p.stockActual === 0).length;

  const getStockChip = (stock: number, stockMinimo: number, activo: boolean) => {
    if (!activo) {
      return <Chip label="Inactivo" color="default" size="small" />;
    } else if (stock === 0) {
      return <Chip label="Sin Stock" color="error" size="small" />;
    } else if (stock <= stockMinimo) {
      return <Chip label="Stock Bajo" color="warning" size="small" />;
    } else {
      return <Chip label="Disponible" color="success" size="small" />;
    }
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <InventoryIcon />
          Gestión de Stock
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3} sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <InventoryIcon color="primary" />
              <Box>
                <Typography variant="h4">{products.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Productos
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge badgeContent={lowStockCount} color="warning">
                <WarningIcon color="warning" />
              </Badge>
              <Box>
                <Typography variant="h4">{lowStockCount}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Stock Bajo
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge badgeContent={outOfStockCount} color="error">
                <TrendingDownIcon color="error" />
              </Badge>
              <Box>
                <Typography variant="h4">{outOfStockCount}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Sin Stock
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <InventoryIcon color="info" />
              <Box>
                <Typography variant="h4">
                  ${products.reduce((sum, p) => sum + (p.precio * p.stockActual), 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valor Total
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Inventario" />
          <Tab label="Movimientos" />
        </Tabs>
      </Box>

      {/* Tab Panel 0: Inventory */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="center">Stock Actual</TableCell>
                    <TableCell align="center">Stock Mínimo</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.codigo}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {product.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.descripcion}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold">
                          {product.stockActual}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {product.stockMinimo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.categoriaProductoNombre || product.categoriaProducto?.nombre || 'Sin categoría'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>${product.precio.toLocaleString()}</TableCell>
                      <TableCell>
                        {getStockChip(product.stockActual, product.stockMinimo, product.activo)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditProduct(product)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab Panel 1: Movements */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="center">Cantidad</TableCell>
                    <TableCell>Concepto</TableCell>
                    <TableCell>Comprobante</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stockMovements.map((movement) => {
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.fecha).toLocaleString()}
                        </TableCell>
                        <TableCell>{movement.productoNombre || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              movement.tipo === 'ENTRADA' ? 'Entrada' :
                              movement.tipo === 'SALIDA' ? 'Salida' :
                              movement.tipo === 'SALIDA_FABRICACION' ? 'Salida Fab.' :
                              movement.tipo === 'REINGRESO_CANCELACION_FABRICACION' ? 'Reingreso' :
                              movement.tipo === 'RECUENTO' ? 'Recuento' :
                              'Ajuste'
                            }
                            color={
                              movement.tipo === 'ENTRADA' || movement.tipo === 'REINGRESO_CANCELACION_FABRICACION' ? 'success' :
                              movement.tipo === 'SALIDA' || movement.tipo === 'SALIDA_FABRICACION' ? 'error' :
                              'info'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            fontWeight="bold"
                            color={
                              movement.tipo === 'ENTRADA' ||
                              movement.tipo === 'REINGRESO_CANCELACION_FABRICACION' ||
                              (movement.tipo === 'AJUSTE' && movement.cantidad > 0)
                                ? 'success.main'
                                : movement.tipo === 'SALIDA' ||
                                  movement.tipo === 'SALIDA_FABRICACION' ||
                                  (movement.tipo === 'AJUSTE' && movement.cantidad < 0)
                                ? 'error.main'
                                : 'text.primary'
                            }
                          >
                            {movement.tipo === 'AJUSTE'
                              ? (movement.cantidad >= 0 ? '+' : '') + movement.cantidad
                              : movement.tipo === 'ENTRADA' || movement.tipo === 'REINGRESO_CANCELACION_FABRICACION'
                              ? '+' + Math.abs(movement.cantidad)
                              : '-' + Math.abs(movement.cantidad)
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>{movement.concepto}</TableCell>
                        <TableCell>{movement.numeroComprobante}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Producto: {selectedProduct?.nombre}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nombre"
              value={editForm.nombre}
              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Descripción"
              value={editForm.descripcion}
              onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              label="Precio"
              type="number"
              value={editForm.precio}
              onChange={(e) => setEditForm({ ...editForm, precio: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
              inputProps={{ step: '0.01', min: '0' }}
            />

            <TextField
              label="Stock Mínimo"
              type="number"
              value={editForm.stockMinimo}
              onChange={(e) => setEditForm({ ...editForm, stockMinimo: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Define el umbral para 'Stock Bajo'"
            />

            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={editForm.categoriaProductoId}
                label="Categoría"
                onChange={(e) => setEditForm({ ...editForm, categoriaProductoId: e.target.value as number })}
              >
                {categorias.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={editForm.activo}
                  onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
                />
              }
              label="Producto Activo"
            />

            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Código: <strong>{selectedProduct?.codigo}</strong>
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                Stock Actual: <strong>{selectedProduct?.stockActual}</strong>
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                Stock se actualiza automáticamente desde Compras
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockPage;
```

---

## 📦 Tipos TypeScript para Equipos

### EquipoFabricadoDTO Interfaces

```typescript
// Tipo de equipo
export type TipoEquipo = 'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO';

// Estados de fabricación
export type EstadoFabricacion = 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';

// DTO completo del equipo
export interface EquipoFabricadoDTO {
  id: number;
  recetaId?: number;
  recetaNombre?: string;
  recetaCodigo?: string;
  tipo: TipoEquipo;
  modelo: string;
  equipo?: string;
  medida?: string;
  color?: string;
  observaciones?: string;
  fechaCreacion: string;
  numeroHeladera: string;
  cantidad: number;
  asignado: boolean;
  estado: EstadoFabricacion;
  fechaFinalizacion?: string;
  responsableId?: number;
  responsableNombre?: string;
  clienteId?: number;
  clienteNombre?: string;
}

// DTO para listados (versión simplificada)
export interface EquipoFabricadoListDTO {
  id: number;
  tipo: TipoEquipo;
  modelo: string;
  numeroHeladera: string;
  color?: string;
  cantidad: number;
  asignado: boolean;
  estado: EstadoFabricacion;
  fechaCreacion: string;
  fechaFinalizacion?: string;
  responsableNombre?: string;
  clienteNombre?: string;
}

// DTO para crear equipos
export interface EquipoFabricadoCreateDTO {
  recetaId?: number;
  tipo: TipoEquipo;
  modelo: string;
  equipo?: string;
  medida?: string;
  color?: string;
  observaciones?: string;
  numeroHeladera: string;
  cantidad: number;
  estado?: EstadoFabricacion;
  responsableId?: number;
  clienteId?: number;
}

// DTO para actualizar equipos
export interface EquipoFabricadoUpdateDTO {
  recetaId?: number;
  tipo?: TipoEquipo;
  modelo?: string;
  equipo?: string;
  medida?: string;
  color?: string;
  observaciones?: string;
  numeroHeladera?: string;
  cantidad?: number;
  estado?: EstadoFabricacion;
  responsableId?: number;
  clienteId?: number;
}

// Validación de stock
export interface ValidacionStockDTO {
  disponible: boolean;
  mensaje: string;
  detalles?: {
    productoNombre: string;
    cantidadRequerida: number;
    cantidadDisponible: number;
  }[];
}
```

---

## � Interface MovimientoStock

```typescript
export interface MovimientoStock {
  id?: number;
  productoId: number;
  productoNombre?: string;
  productoCodigo?: string;
  producto?: Producto;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'RECUENTO' | 'SALIDA_FABRICACION' | 'REINGRESO_CANCELACION_FABRICACION';
  cantidad: number;
  stockAnterior?: number;
  stockActual?: number;
  concepto?: string;
  numeroComprobante?: string;
  fecha: string;
  usuarioId?: number;
  usuarioNombre?: string;
  usuario?: Usuario;
  equipoFabricadoId?: number;
  equipoFabricadoNumero?: string; // IMPORTANTE: Número de heladera del equipo relacionado
}
```

---

## �🔌 API Service - equipoFabricadoApi.ts

```typescript
import api from '../config';

import type {
  TipoEquipo,
  EquipoFabricadoDTO,
  EquipoFabricadoListDTO,
  EquipoFabricadoCreateDTO,
  EquipoFabricadoUpdateDTO,
  EstadoFabricacion,
  ValidacionStockDTO,
} from '../../types';

export const equipoFabricadoApi = {
  // CRUD básico
  findAll: async (page: number = 0, size: number = 10) => {
    const response = await api.get<any>('/api/equipos-fabricados', {
      params: { page, size }
    });
    return response.data;
  },

  findById: async (id: number) => {
    const response = await api.get<EquipoFabricadoDTO>(`/api/equipos-fabricados/${id}`);
    return response.data;
  },

  findByNumeroHeladera: async (numeroHeladera: string) => {
    const response = await api.get<EquipoFabricadoDTO>(`/api/equipos-fabricados/numero/${numeroHeladera}`);
    return response.data;
  },

  create: async (equipo: EquipoFabricadoCreateDTO) => {
    const response = await api.post<EquipoFabricadoDTO>('/api/equipos-fabricados', equipo);
    return response.data;
  },

  update: async (id: number, equipo: EquipoFabricadoUpdateDTO) => {
    const response = await api.put<EquipoFabricadoDTO>(`/api/equipos-fabricados/${id}`, equipo);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/equipos-fabricados/${id}`);
  },

  // Búsquedas específicas
  findByTipo: async (tipo: TipoEquipo) => {
    const response = await api.get<EquipoFabricadoListDTO[]>(`/api/equipos-fabricados/tipo/${tipo}`);
    return response.data;
  },

  findByEstado: async (estado: EstadoFabricacion) => {
    const response = await api.get<EquipoFabricadoListDTO[]>(`/api/equipos-fabricados/estado/${estado}`);
    return response.data;
  },

  findDisponibles: async () => {
    const response = await api.get<EquipoFabricadoListDTO[]>('/api/equipos-fabricados/disponibles');
    return response.data;
  },

  findNoAsignados: async () => {
    const response = await api.get<EquipoFabricadoListDTO[]>('/api/equipos-fabricados/no-asignados');
    return response.data;
  },

  findByReceta: async (recetaId: number) => {
    const response = await api.get<EquipoFabricadoListDTO[]>(`/api/equipos-fabricados/receta/${recetaId}`);
    return response.data;
  },

  findByCliente: async (clienteId: number) => {
    const response = await api.get<EquipoFabricadoListDTO[]>(`/api/equipos-fabricados/cliente/${clienteId}`);
    return response.data;
  },

  findByResponsable: async (responsableId: number) => {
    const response = await api.get<EquipoFabricadoListDTO[]>(`/api/equipos-fabricados/responsable/${responsableId}`);
    return response.data;
  },

  findCompletadosEntreFechas: async (fechaInicio: string, fechaFin: string) => {
    const response = await api.get<EquipoFabricadoListDTO[]>('/api/equipos-fabricados/completados', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Acciones de estado y asignación
  asignarEquipo: async (equipoId: number, clienteId: number) => {
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/asignar/${clienteId}`
    );
    return response.data;
  },

  desasignarEquipo: async (equipoId: number) => {
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/desasignar`
    );
    return response.data;
  },

  completarFabricacion: async (equipoId: number) => {
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/completar`
    );
    return response.data;
  },

  cancelarFabricacion: async (equipoId: number) => {
    const response = await api.patch<EquipoFabricadoDTO>(
      `/api/equipos-fabricados/${equipoId}/cancelar`
    );
    return response.data;
  },

  // Validación de stock
  validarStock: async (equipo: EquipoFabricadoCreateDTO): Promise<ValidacionStockDTO> => {
    const response = await api.post<ValidacionStockDTO>(
      '/api/equipos-fabricados/validar-stock',
      equipo
    );
    return response.data;
  },

  validarStockEquipoExistente: async (equipoId: number): Promise<ValidacionStockDTO> => {
    const response = await api.get<ValidacionStockDTO>(
      `/api/equipos-fabricados/${equipoId}/validar-stock`
    );
    return response.data;
  },

  // Get equipos available for sale by receta
  findDisponiblesParaVentaByReceta: async (recetaId: number): Promise<EquipoFabricadoDTO[]> => {
    const response = await api.get<EquipoFabricadoDTO[]>(
      `/api/equipos-fabricados/disponibles-venta/receta/${recetaId}`
    );
    return response.data;
  },
};
```

---

## � API Service - movimientoStockFabricacionApi.ts

```typescript
import api from '../config';
import type { MovimientoStock } from '../../types';

export const movimientoStockFabricacionApi = {
  /**
   * Obtener todos los movimientos de stock
   */
  findAll: async (): Promise<MovimientoStock[]> => {
    const response = await api.get<MovimientoStock[]>('/api/movimientos-stock');
    return response.data;
  },

  /**
   * Obtener movimientos por equipo fabricado
   */
  findByEquipoFabricado: async (equipoId: number): Promise<MovimientoStock[]> => {
    const response = await api.get<MovimientoStock[]>(`/api/movimientos-stock/equipo-fabricado/${equipoId}`);
    return response.data;
  },

  /**
   * Obtener movimientos por producto
   */
  findByProducto: async (productoId: number): Promise<MovimientoStock[]> => {
    const response = await api.get<MovimientoStock[]>(`/api/movimientos-stock/producto/${productoId}`);
    return response.data;
  },

  /**
   * Obtener movimientos por tipo
   */
  findByTipo: async (tipo: string): Promise<MovimientoStock[]> => {
    const response = await api.get<MovimientoStock[]>(`/api/movimientos-stock/tipo/${tipo}`);
    return response.data;
  },

  /**
   * Obtener movimientos de fabricación (materias primas)
   */
  findMovimientosFabricacion: async (): Promise<MovimientoStock[]> => {
    const response = await api.get<MovimientoStock[]>('/api/movimientos-stock');
    // Filtrar solo movimientos relacionados con fabricación
    return response.data.filter(m =>
      m.tipo === 'SALIDA_FABRICACION' || m.tipo === 'REINGRESO_CANCELACION_FABRICACION'
    );
  },
};
```

---

## �📊 Requisitos para StockEquiposPage

### Estructura de la Página

**Ubicación:** `src/components/Fabricacion/StockEquiposPage.tsx`

**Tabs:**
1. Inventario (lista de equipos)
2. **Registro de Movimientos de Equipos** (historial de asignaciones y cambios de estado)
3. Movimientos de Stock de Materias Primas (opcional)

### Métricas a Mostrar (Summary Cards)

1. **Total Equipos**: Cantidad total de equipos fabricados
2. **Equipos Completados**: Equipos con estado `COMPLETADO`
3. **En Proceso**: Equipos con estado `EN_PROCESO`
4. **Asignados a Clientes**: Equipos donde `asignado === true`

### Tab 1: Inventario de Equipos

**Columnas de la tabla:**
- Número Heladera
- Tipo (Chip con color según tipo)
- Modelo
- Color
- Estado (Chip con color según estado)
- Asignado (Chip Sí/No)
- Cliente (si está asignado)
- Fecha Creación
- Fecha Finalización
- Acciones (Editar)

### Tab 2: Movimientos de Equipos (NUEVO - Registro Detallado)

**IMPORTANTE**: Esta sección debe mostrar el historial de movimientos de equipos, NO de materias primas.

**Fuente de datos**: Usar `equipoFabricadoApi.findAll()` y mostrar el historial de:
- Equipos asignados a clientes
- Equipos desasignados
- Equipos completados
- Equipos cancelados

**Columnas de la tabla de movimientos:**
- Fecha (fechaCreacion o fechaFinalizacion)
- Número Heladera (numeroHeladera)
- Tipo de Equipo (tipo: HELADERA, COOLBOX, etc.)
- Modelo
- Acción (Chip con tipo de movimiento)
  - "Asignado a Cliente" (cuando asignado cambia a true)
  - "Desasignado" (cuando asignado cambia a false)
  - "Completado" (cuando estado cambia a COMPLETADO)
  - "Cancelado" (cuando estado cambia a CANCELADO)
- Cliente (clienteNombre si está asignado)
- Responsable (responsableNombre)
- Observaciones

**Tipos de movimiento a mostrar:**
```typescript
const getMovimientoChip = (accion: string, asignado: boolean) => {
  if (asignado) {
    return <Chip label="Asignado a Cliente" color="success" size="small" icon={<PersonIcon />} />;
  }
  switch (accion) {
    case 'COMPLETADO':
      return <Chip label="Completado" color="success" size="small" icon={<CheckCircleIcon />} />;
    case 'CANCELADO':
      return <Chip label="Cancelado" color="error" size="small" icon={<CancelIcon />} />;
    case 'DESASIGNADO':
      return <Chip label="Desasignado" color="warning" size="small" icon={<RemoveCircleIcon />} />;
    default:
      return <Chip label="En Proceso" color="info" size="small" icon={<BuildIcon />} />;
  }
};
```

### Tab 3: Movimientos de Stock de Materias Primas (Opcional)

Si quieres también mostrar los movimientos de materias primas usadas en fabricación:
- `SALIDA_FABRICACION` (materias primas consumidas)
- `REINGRESO_CANCELACION_FABRICACION` (materias primas devueltas al cancelar)

### Funciones Helper

```typescript
const getEstadoChip = (estado: EstadoFabricacion) => {
  const config = {
    EN_PROCESO: { label: 'En Proceso', color: 'warning' as const },
    COMPLETADO: { label: 'Completado', color: 'success' as const },
    CANCELADO: { label: 'Cancelado', color: 'error' as const },
  };
  return <Chip {...config[estado]} size="small" />;
};

const getTipoChip = (tipo: TipoEquipo) => {
  const config = {
    HELADERA: { label: 'Heladera', color: 'primary' as const },
    COOLBOX: { label: 'Coolbox', color: 'info' as const },
    EXHIBIDOR: { label: 'Exhibidor', color: 'secondary' as const },
    OTRO: { label: 'Otro', color: 'default' as const },
  };
  return <Chip {...config[tipo]} size="small" variant="outlined" />;
};
```

### Diálogo de Edición

Campos editables:
- Modelo
- Color
- Observaciones
- Estado (Select con opciones: EN_PROCESO, COMPLETADO, CANCELADO)

Campos de solo lectura (mostrar en sección informativa):
- Número Heladera
- Tipo
- Fecha Creación
- Cliente Asignado
- Responsable

---

## 🎨 Iconos Sugeridos de Material-UI

```typescript
import {
  Inventory2 as Inventory2Icon, // Para equipos
  Build as BuildIcon, // Para fabricación
  CheckCircle as CheckCircleIcon, // Para completados
  Schedule as ScheduleIcon, // Para en proceso
  Person as PersonIcon, // Para asignados
  Cancel as CancelIcon, // Para cancelados
  RemoveCircle as RemoveCircleIcon, // Para desasignados
  History as HistoryIcon, // Para historial/movimientos
  Assignment as AssignmentIcon, // Para asignaciones
} from '@mui/icons-material';
```

---

## 📜 Lógica de Registro de Movimientos de Equipos

Para crear el historial de movimientos de equipos, necesitas transformar los datos de equipos en un formato de "eventos" o "movimientos":

```typescript
interface EquipoMovimiento {
  id: number;
  fecha: string;
  numeroHeladera: string;
  tipo: TipoEquipo;
  modelo: string;
  accion: 'CREADO' | 'COMPLETADO' | 'CANCELADO' | 'ASIGNADO' | 'DESASIGNADO';
  clienteNombre?: string;
  responsableNombre?: string;
  observaciones?: string;
}

// Función para generar el historial de movimientos
const generarHistorialMovimientos = (equipos: EquipoFabricadoDTO[]): EquipoMovimiento[] => {
  const movimientos: EquipoMovimiento[] = [];
  
  equipos.forEach(equipo => {
    // Movimiento de creación
    movimientos.push({
      id: equipo.id,
      fecha: equipo.fechaCreacion,
      numeroHeladera: equipo.numeroHeladera,
      tipo: equipo.tipo,
      modelo: equipo.modelo,
      accion: 'CREADO',
      responsableNombre: equipo.responsableNombre,
      observaciones: equipo.observaciones,
    });

    // Movimiento de finalización (si está completado)
    if (equipo.estado === 'COMPLETADO' && equipo.fechaFinalizacion) {
      movimientos.push({
        id: equipo.id,
        fecha: equipo.fechaFinalizacion,
        numeroHeladera: equipo.numeroHeladera,
        tipo: equipo.tipo,
        modelo: equipo.modelo,
        accion: 'COMPLETADO',
        responsableNombre: equipo.responsableNombre,
        observaciones: 'Fabricación completada',
      });
    }

    // Movimiento de cancelación (si está cancelado)
    if (equipo.estado === 'CANCELADO' && equipo.fechaFinalizacion) {
      movimientos.push({
        id: equipo.id,
        fecha: equipo.fechaFinalizacion,
        numeroHeladera: equipo.numeroHeladera,
        tipo: equipo.tipo,
        modelo: equipo.modelo,
        accion: 'CANCELADO',
        responsableNombre: equipo.responsableNombre,
        observaciones: 'Fabricación cancelada',
      });
    }

    // Movimiento de asignación a cliente (si está asignado)
    if (equipo.asignado && equipo.clienteNombre) {
      movimientos.push({
        id: equipo.id,
        fecha: equipo.fechaFinalizacion || equipo.fechaCreacion, // Usar fecha de finalización o creación
        numeroHeladera: equipo.numeroHeladera,
        tipo: equipo.tipo,
        modelo: equipo.modelo,
        accion: 'ASIGNADO',
        clienteNombre: equipo.clienteNombre,
        responsableNombre: equipo.responsableNombre,
        observaciones: `Asignado a ${equipo.clienteNombre}`,
      });
    }
  });

  // Ordenar por fecha descendente (más reciente primero)
  return movimientos.sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
};
```

---

## ✅ Checklist de Implementación

- [ ] Crear `StockEquiposPage.tsx` en `src/components/Fabricacion/`
- [ ] Importar `equipoFabricadoApi`, `movimientoStockFabricacionApi` y tipos necesarios
- [ ] Implementar estado local (equipos, movimientos, loading, error, tabValue, etc.)
- [ ] Crear función `loadData()` que cargue equipos y movimientos
- [ ] Implementar las 4 Summary Cards con métricas
- [ ] Crear Tab Panel 0: Inventario con tabla de equipos
- [ ] **Crear Tab Panel 1: Registro de Movimientos de Equipos (NUEVO)**
  - [ ] Implementar función `generarHistorialMovimientos()`
  - [ ] Crear tabla con columnas: Fecha, Nº Heladera, Tipo, Modelo, Acción, Cliente, Responsable
  - [ ] Implementar chips de colores según acción
  - [ ] Filtros opcionales: por tipo de equipo, por cliente, por acción
- [ ] Crear Tab Panel 2: Movimientos de Stock de Materias Primas (opcional)
- [ ] Implementar diálogo de edición
- [ ] Agregar funciones helper para chips de estado, tipo y acciones
- [ ] Manejar errores 401/403 con mensajes apropiados
- [ ] Probar la integración con el backend

---

## 🔗 Integración con Rutas

Recuerda agregar la ruta en tu archivo de rutas:

```typescript
// En tu archivo de rutas (App.tsx o similar)
import StockEquiposPage from './components/Fabricacion/StockEquiposPage';

// Dentro de tus rutas
<Route path="/fabricacion/stock-equipos" element={<StockEquiposPage />} />
```

---

## 📝 Notas Importantes

1. **Paginación**: La API `findAll()` soporta paginación. Para simplicidad inicial, puedes cargar todos los equipos con un `size` grande, pero considera implementar paginación si hay muchos equipos.

2. **Movimientos**: Los movimientos de stock relacionados con equipos tienen tipos específicos:
   - `SALIDA_FABRICACION`: Salida de materias primas para fabricar
   - `REINGRESO_CANCELACION_FABRICACION`: Reingreso cuando se cancela una fabricación

3. **Estados**: Los equipos tienen 3 estados posibles:
   - `EN_PROCESO`: Equipo en fabricación
   - `COMPLETADO`: Equipo finalizado
   - `CANCELADO`: Fabricación cancelada

4. **Asignación**: Un equipo puede estar asignado a un cliente (`asignado: true`) o disponible para asignación.

5. **Validación de Stock**: Antes de crear/editar equipos, considera usar `validarStock()` para verificar disponibilidad de materias primas.

---

## 🚀 Prompt para Claude Opus

**Copia y pega esto:**

```
Necesito crear una página **StockEquiposPage** para gestionar el inventario de equipos fabricados.

**Contexto:**
- Ya existe StockPage.tsx para productos (ver arriba)
- Necesito una página similar pero para equipos fabricados (heladeras, coolboxes, exhibidores)

**Archivo a crear:**
`src/components/Fabricacion/StockEquiposPage.tsx`

**Tipos disponibles:**
- EquipoFabricadoDTO (ver tipos arriba)
- TipoEquipo: 'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO'
- EstadoFabricacion: 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO'

**API disponible:**
- equipoFabricadoApi (ver métodos arriba)

**Requisitos:**
1. Estructura de 3 tabs:
   - Tab 0: Inventario de Equipos
   - **Tab 1: Registro de Movimientos de Equipos (NUEVO - PRINCIPAL)**
   - Tab 2: Movimientos de Materias Primas (opcional)

2. Summary Cards con métricas:
   - Total Equipos
   - Equipos Completados
   - En Proceso
   - Asignados a Clientes

3. Tab 0 - Inventario: tabla con columnas
   - Número Heladera
   - Tipo (con Chip de color)
   - Modelo
   - Color
   - Estado (con Chip de color)
   - Asignado (Sí/No)
   - Cliente
   - Fecha Creación
   - Acciones (Editar)

4. **Tab 1 - Registro de Movimientos de Equipos (IMPORTANTE):**
   Mostrar historial de EQUIPOS (no materias primas):
   - Fecha del movimiento
   - Número de Heladera (numeroHeladera)
   - Tipo de Equipo (HELADERA, COOLBOX, etc.)
   - Modelo
   - Acción realizada (Chip con color):
     * "Creado" (color: info)
     * "Completado" (color: success)
     * "Cancelado" (color: error)
     * "Asignado a Cliente" (color: success con icono Person)
     * "Desasignado" (color: warning)
   - Cliente (si aplica)
   - Responsable
   - Observaciones

   **Implementación del historial:**
   ```typescript
   // Generar eventos a partir de los equipos
   const historialMovimientos = generarHistorialMovimientos(equipos);
   ```

5. Tab 2 - Movimientos de Materias Primas (opcional):
   Mostrar movimientos de tipo SALIDA_FABRICACION y REINGRESO_CANCELACION_FABRICACION

6. Diálogo editar: campos editables (modelo, color, observaciones, estado)

6. Helpers para chips de estado y tipo

**Estilo:**
- Usar Material-UI igual que StockPage
- Mismo patrón de manejo de errores
- Loading states con CircularProgress
- Responsive design

Por favor, genera el código completo de StockEquiposPage.tsx
```

---

¡Listo! Con este documento tienes todo lo necesario para que Claude Opus cree la página completa. 🚀
