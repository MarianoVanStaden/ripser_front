import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Avatar,
  TablePagination,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  GetApp as GetAppIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { supplierApi } from '../../api/services/supplierApi';
import { compraApi} from '../../api/services/compraApi';
import { proveedorProductoApi } from '../../api/services/proveedorProductoApi';
import type { ProveedorDTO, CompraDTO, CreateCompraDTO, RecepcionCompraDTO, Producto, OrdenCompra, CategoriaProducto, ProveedorProductoDTO } from '../../types';
import Autocomplete from '@mui/material/Autocomplete';
import { productApi } from '../../api/services/productApi';
import { movimientoStockApi } from '../../api/services/movimientoStockApi';
import { categoriaProductoApi } from '../../api/services/categoriaProductoApi';
import { generatePurchaseOrdersListPDF, generatePurchaseOrderDetailPDF } from '../../utils/pdfExportUtils';
import LoadingOverlay from '../common/LoadingOverlay';
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <Alert severity="error">Algo salió mal. Por favor, intenta de nuevo.</Alert>;
    }
    return this.props.children;
  }
}
const ComprasPedidosPage: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDTO[]>([]);
  const [compras, setCompras] = useState<CompraDTO[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(null);
  const [openOrdenDialog, setOpenOrdenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Productos filtrados por proveedor seleccionado
  const [productosProveedor, setProductosProveedor] = useState<ProveedorProductoDTO[]>([]);
  const [loadingProductosProveedor, setLoadingProductosProveedor] = useState(false);
  const [errorProductosProveedor, setErrorProductosProveedor] = useState<string | null>(null);

  // Price change confirmation dialog
  const [openPriceChangeDialog, setOpenPriceChangeDialog] = useState(false);
  const [priceChanges, setPriceChanges] = useState<Array<{
    productoId: number;
    nombreProducto: string;
    precioAnterior: number;
    precioNuevo: number;
    shouldUpdate: boolean;
  }>>([]);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete confirmation modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ordenToDelete, setOrdenToDelete] = useState<OrdenCompra | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

  // Reception dialog states
  const [openRecepcionDialog, setOpenRecepcionDialog] = useState(false);
  const [ordenToReceive, setOrdenToReceive] = useState<OrdenCompra | null>(null);
  const [recepcionItems, setRecepcionItems] = useState<Array<{
    detalleCompraId: number;
    productoId: number;
    productoNombre: string;
    cantidadCompra: number;
    cantidadRecibida: number;
    observaciones: string;
  }>>([]);
  const [recepcionObservaciones, setRecepcionObservaciones] = useState('');
  const [recepcionLoading, setRecepcionLoading] = useState(false);
  const [recepcionSuccess, setRecepcionSuccess] = useState<string | null>(null);
  const [recepcionError, setRecepcionError] = useState<string | null>(null);

const [newOrden, setNewOrden] = useState({
  supplierId: '',
  fechaEntregaEstimada: dayjs().add(15, 'day'),
  observaciones: '',
  estado: 'PENDIENTE', // Add estado field
  metodoPago: '' as '' | 'EFECTIVO' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'TRANSFERENCIA' | 'CHEQUE' | 'FINANCIACION_PROPIA',
  items: [{
    productoId: '',
    nombreProductoTemporal: '',
    descripcionProductoTemporal: '',
    codigoProductoTemporal: '',
    categoriaId: '',
    esProductoNuevo: false,
    cantidad: 1,
    precioUnitario: 0,
  }],
});

  useEffect(() => {
    loadProveedores();
    loadCompras();
    loadProductos();
    loadCategorias();
  }, []);

const loadProveedores = async () => {
  try {
    setLoading(true);
    const data = await supplierApi.getAll();
    console.log('Proveedores:', data); // Debug log
    setProveedores(data as ProveedorDTO[]);
    setError(null);
  } catch (err: any) {
    if (err.response?.status === 403) {
      setError('No tiene permisos para acceder a esta información. Por favor, inicie sesión nuevamente.');
    } else if (err.response?.status === 401) {
      setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
    } else {
      setError('Error al cargar los proveedores');
    }
    console.error('Error loading proveedores:', err);
  } finally {
    setLoading(false);
  }
};

const loadCompras = async () => {
  try {
    setLoading(true);
    const pageData = await compraApi.getAll({ size: 1000 });
    const data = Array.isArray(pageData) ? pageData : (pageData?.content ?? []);
    console.log('Compras data:', JSON.stringify(data, null, 2));
    setCompras((data as unknown) as CompraDTO[]);
    setOrdenes(
      data.map((compra) => {
        console.log(`Compra ID: ${compra.id}, proveedorId: ${compra.proveedorId}, proveedor: ${JSON.stringify(compra.proveedor, null, 2)}`);
        const orden = {
          id: compra.id,
          numero: (compra as any).numero || `COMPRA-${compra.id}`,
          proveedor: (compra.proveedor as unknown) as ProveedorDTO,
          supplierId: compra.proveedorId
            ? compra.proveedorId.toString()
            : compra.proveedor?.id
              ? compra.proveedor.id.toString()
              : '',
          fechaCreacion: (compra as any).fechaCreacion && dayjs((compra as any).fechaCreacion).isValid()
            ? (compra as any).fechaCreacion
            : new Date().toISOString(),
          fechaEntregaEstimada: (compra as any).fechaEntrega && dayjs((compra as any).fechaEntrega).isValid()
            ? (compra as any).fechaEntrega
            : new Date().toISOString(),
          estado: compra.estado,
          total: (compra as any).detalles?.reduce((sum: number, item: any) => sum + item.cantidad * item.costoUnitario, 0) || 0,
          items: ((compra as any).detalles || []).map((detalle: any) => ({
            id: detalle.id,
            productoId: detalle.productoId ? detalle.productoId.toString() : '',
            descripcion: detalle.nombreProductoTemporal || detalle.descripcionProductoTemporal || '',
            cantidad: detalle.cantidad,
            precioUnitario: detalle.costoUnitario,
            subtotal: detalle.cantidad * detalle.costoUnitario,
            // Include fields needed for editing
            nombreProductoTemporal: detalle.nombreProductoTemporal || '',
            descripcionProductoTemporal: detalle.descripcionProductoTemporal || '',
            codigoProductoTemporal: detalle.codigoProductoTemporal || '',
            categoriaProductoId: detalle.categoriaProductoId,
            esProductoNuevo: detalle.esProductoNuevo ?? !detalle.productoId,
          })),
          observaciones: compra.observaciones,
          metodoPago: (compra as any).metodoPago || 'EFECTIVO',
        };
        return orden;
      })
    );
    setError(null);
  } catch (err: any) {
    console.error('Error loading compras:', err);
    if (err.response?.status === 403) {
      setError('No tiene permisos para acceder a esta información. Por favor, inicie sesión nuevamente.');
    } else if (err.response?.status === 401) {
      setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
    } else {
      setError('Error al cargar las compras');
    }
  } finally {
    setLoading(false);
  }
};

const loadProductos = async () => {
  try {
    setLoading(true);
    const productosPage = await productApi.getAll({ size: 10000 });
    const data = Array.isArray(productosPage) ? productosPage : (productosPage?.content ?? []);
    console.log('Productos response:', data); // Log the full response
    setProductos(data || []);
    setError(null);
  } catch (err: any) {
    console.error('Error loading productos:', err);
    if (err.response?.status === 403) {
      setError('No tiene permisos para acceder a esta información. Por favor, inicie sesión nuevamente.');
    } else if (err.response?.status === 401) {
      setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
    } else {
      setError('Error al cargar los productos');
    }
  } finally {
    setLoading(false);
  }
};

const loadCategorias = async () => {
  try {
    const data = await categoriaProductoApi.getAll();
    console.log('Categorías response:', data);
    setCategorias(data || []);
  } catch (err: any) {
    console.error('Error loading categorías:', err);
    // No mostramos error porque las categorías son opcionales
  }
};

const loadProductosDelProveedor = async (proveedorId: string) => {
  if (!proveedorId) {
    setProductosProveedor([]);
    return;
  }
  try {
    setLoadingProductosProveedor(true);
    setErrorProductosProveedor(null);
    const data = await proveedorProductoApi.getActivosByProveedor(parseInt(proveedorId));
    setProductosProveedor(data);
  } catch (err: any) {
    setErrorProductosProveedor('Error al cargar los productos del proveedor');
    setProductosProveedor([]);
  } finally {
    setLoadingProductosProveedor(false);
  }
};

// Handle opening the reception dialog
const handleOpenRecepcion = async (orden: OrdenCompra) => {
  setOrdenToReceive(orden);
  setRecepcionError(null);
  setRecepcionSuccess(null);

  // Ya no es necesario cargar depósitos - el backend asigna automáticamente al depósito principal

  // Initialize reception items from the order items
  const items = orden.items.map((item) => ({
    detalleCompraId: item.id || 0,
    productoId: item.productoId ? parseInt(item.productoId.toString()) : 0,
    productoNombre: item.nombreProductoTemporal || item.descripcion || `Producto ${item.productoId}`,
    cantidadCompra: item.cantidad,
    cantidadRecibida: item.cantidad,
    observaciones: '',
  }));

  setRecepcionItems(items);
  setRecepcionObservaciones('');
  setOpenRecepcionDialog(true);
};

// Handle reception submission
const handleSubmitRecepcion = async () => {
  if (!ordenToReceive) return;

  // Validate all items have quantity > 0
  const itemsSinCantidad = recepcionItems.filter(item => item.cantidadRecibida <= 0);
  if (itemsSinCantidad.length > 0) {
    setRecepcionError('La cantidad recibida debe ser mayor a 0 para todos los productos');
    return;
  }

  setRecepcionLoading(true);
  setRecepcionError(null);

  try {
    const recepcionData: RecepcionCompraDTO = {
      compraId: ordenToReceive.id,
      fechaRecepcion: dayjs().toISOString(),
      recepciones: recepcionItems.map(item => ({
        detalleCompraId: item.detalleCompraId,
        productoId: item.productoId,
        // NO incluir depositoId - backend lo asigna automáticamente al depósito principal
        cantidadRecibida: item.cantidadRecibida,
        esRecepcionParcial: item.cantidadRecibida < item.cantidadCompra,
        observaciones: item.observaciones,
      })),
      observaciones: recepcionObservaciones,
    };

    const response = await compraApi.recibirCompra(recepcionData);

    if (response.success) {
      setRecepcionSuccess(
        `✅ Compra recibida correctamente. ${response.movimientosCreados || 0} movimientos de stock creados en el depósito principal.`
      );
      // Reload data after successful reception
      setTimeout(() => {
        setOpenRecepcionDialog(false);
        loadCompras();
      }, 2500);
    } else {
      setRecepcionError(response.message || 'Error al recibir la compra');
    }
  } catch (err: any) {
    console.error('Error al recibir compra:', err);

    // El backend devuelve errores como 409 CONFLICT con estructura:
    // { error: "Invalid state", message: "..." }

    if (err.response?.status === 409 && err.response?.data?.error === 'Invalid state') {
      // Mostrar mensaje personalizado del backend directamente
      const backendMessage = err.response.data.message;

      // Agregar contexto adicional para el usuario
      if (backendMessage.includes('depósito principal configurado')) {
        setRecepcionError(
          `⚠️ ${backendMessage}\n\nPor favor, contacte al administrador para configurar un depósito como principal en Logística > Depósitos.`
        );
      } else if (backendMessage.includes('múltiples depósitos')) {
        setRecepcionError(
          `⚠️ ${backendMessage}\n\nPor favor, contacte al administrador para corregir la configuración en Logística > Depósitos.`
        );
      } else {
        setRecepcionError(`⚠️ ${backendMessage}`);
      }
    } else {
      // Otros errores genéricos
      const errorMessage = err.response?.data?.message || err.message || 'Error al procesar la recepción';
      setRecepcionError(errorMessage);
    }
  } finally {
    setRecepcionLoading(false);
  }
};

  const handleViewOrden = (orden: OrdenCompra) => {
    setSelectedOrden(orden);
    setOpenViewDialog(true);
  };

const handleEditOrden = (orden: OrdenCompra) => {
  setSelectedOrden(orden);
  setIsEditMode(true);
  setNewOrden({
    supplierId: orden.supplierId ? orden.supplierId.toString() : '',
    fechaEntregaEstimada: dayjs(orden.fechaEntregaEstimada),
    observaciones: orden.observaciones || '',
    estado: orden.estado || 'PENDIENTE', // Set estado from the selected order
    metodoPago: (orden.metodoPago || '') as '' | 'EFECTIVO' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'TRANSFERENCIA' | 'CHEQUE' | 'FINANCIACION_PROPIA',
    items: orden.items.map((item) => ({
      productoId: item.productoId ? item.productoId.toString() : '',
      nombreProductoTemporal: item.nombreProductoTemporal || item.descripcion || '',
      descripcionProductoTemporal: item.descripcionProductoTemporal || item.descripcion || '',
      codigoProductoTemporal: item.codigoProductoTemporal || '',
      categoriaId: item.categoriaProductoId ? item.categoriaProductoId.toString() : '',
      esProductoNuevo: item.esProductoNuevo ?? !item.productoId,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
    })),
  });
  if (orden.supplierId) {
    loadProductosDelProveedor(orden.supplierId.toString());
  }
  setOpenOrdenDialog(true);
};
// Function to create new products
const createNewProduct = async (item: CompraDTO['detalles'][0]): Promise<number> => {
  try {
    // Validate that category is present
    if (!item.categoriaProductoId) {
      throw new Error(`El producto "${item.nombreProductoTemporal}" requiere una categoría`);
    }

    const newProduct = await productApi.create({
      nombre: item.nombreProductoTemporal || 'Producto sin nombre',
      descripcion: item.descripcionProductoTemporal || item.nombreProductoTemporal || '',
      codigo: item.codigoProductoTemporal || `PROD-${Date.now()}`,
      precio: item.costoUnitario,
      stockActual: 0, // Initial stock is 0, will be updated via stock movement
      stockMinimo: 0,
      categoriaProductoId: item.categoriaProductoId, // Category is required, no default
    });
    console.log('Created new product:', newProduct);
    return newProduct.id;
  } catch (error) {
    console.error('Error creating new product:', error);
    throw new Error(`No se pudo crear el producto: ${item.nombreProductoTemporal || 'desconocido'}`);
  }
};

// Function to create stock movements for received items
const createStockMovementsForReceivedItems = async (compra: CompraDTO): Promise<void> => {
  try {
    console.log('Creating stock movements for compra:', compra.id);

    for (const detalle of compra.detalles) {
      let productoId = detalle.productoId;

      // If it's a new product, create it first
      if (detalle.esProductoNuevo && !productoId) {
        productoId = await createNewProduct(detalle);
      }

      if (!productoId) {
        console.warn('Skipping stock movement - no productoId for detalle:', detalle);
        continue;
      }

      // Get current stock to calculate stockAnterior and stockActual
      let stockAnterior = 0;
      let producto;
      try {
        producto = await productApi.getById(productoId);
        stockAnterior = producto.stockActual || 0;
      } catch (err) {
        console.warn('Could not get current stock for producto:', productoId, err);
        // If we can't get the product, skip this movement
        continue;
      }

      const stockActual = stockAnterior + detalle.cantidad;

      // Create stock movement for the product
      // The backend expects the full producto object (ManyToOne relationship)
      const movimiento = {
        producto: {
          id: productoId
        },
        tipo: 'ENTRADA' as const,
        cantidad: detalle.cantidad,
        stockAnterior: stockAnterior,
        stockActual: stockActual,
        concepto: 'Compra recibida',
        numeroComprobante: compra.numero || `COMPRA-${compra.id}`,
        fecha: new Date().toISOString(),
      };

      await movimientoStockApi.create(movimiento);
      console.log('Stock movement created for producto:', productoId, {
        stockAnterior,
        cantidad: detalle.cantidad,
        stockActual
      });
    }

    console.log('All stock movements created successfully');
  } catch (error) {
    console.error('Error creating stock movements:', error);
    throw new Error('Error al actualizar el stock de los productos');
  }
};

// Function to detect price changes and show confirmation dialog
const detectPriceChanges = () => {
  const changes: Array<{
    productoId: number;
    nombreProducto: string;
    precioAnterior: number;
    precioNuevo: number;
    shouldUpdate: boolean;
  }> = [];

  newOrden.items.forEach((item) => {
    if (item.productoId && !item.esProductoNuevo) {
      const producto = productos.find(p => p.id.toString() === item.productoId);
      // Comparar con el costo anterior (precio de compra), no el precio de venta
      const costoAnterior = producto?.costo ?? 0;
      if (producto && costoAnterior !== item.precioUnitario) {
        changes.push({
          productoId: producto.id,
          nombreProducto: producto.nombre,
          precioAnterior: costoAnterior,
          precioNuevo: item.precioUnitario,
          shouldUpdate: true, // Default to true
        });
      }
    }
  });

  return changes;
};

const handleSaveOrden = async () => {
  try {
    setLoading(true);

    if (!newOrden.supplierId) {
      setError('Debe seleccionar un proveedor');
      setLoading(false);
      return;
    }
    if (
      newOrden.items.length === 0 ||
      newOrden.items.some(
        (item) =>
          (!item.productoId && !item.nombreProductoTemporal) ||
          item.cantidad <= 0 ||
          item.precioUnitario <= 0
      )
    ) {
      setError('Todos los items deben tener un producto (existente o nuevo), cantidad y precio unitario válidos');
      setLoading(false);
      return;
    }
    if (!newOrden.estado) {
      setError('Debe seleccionar un estado válido');
      setLoading(false);
      return;
    }

    // Detect price changes before saving
    const detectedChanges = detectPriceChanges();
    if (detectedChanges.length > 0) {
      setPriceChanges(detectedChanges);
      setOpenPriceChangeDialog(true);
      setLoading(false);
      return; // Stop here and wait for user confirmation
    }

    // If no price changes, proceed with saving
    await saveOrdenWithPriceUpdates([]);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    setError(`Error al guardar la compra: ${errorMessage}`);
    console.error('Error saving compra:', err);
    setLoading(false);
  }
};

// Separated function to save orden and update prices
const saveOrdenWithPriceUpdates = async (priceUpdates: Array<{ productoId: number; precioNuevo: number }>) => {
  try {
    setLoading(true);

    // Check if estado is changing to RECIBIDA
    const wasNotRecibida = isEditMode && selectedOrden?.estado !== 'RECIBIDA';
    const isNowRecibida = newOrden.estado === 'RECIBIDA';
    const shouldUpdateStock = isNowRecibida && (!isEditMode || wasNotRecibida);

    const compraPayload: CreateCompraDTO = {
      proveedorId: parseInt(newOrden.supplierId),
      fechaEntrega: newOrden.fechaEntregaEstimada.format('YYYY-MM-DDTHH:mm:ss'),
      observaciones: newOrden.observaciones,
      estado: newOrden.estado,
      metodoPago: newOrden.metodoPago || undefined,
      detalles: newOrden.items.map((item) => ({
        productoId: item.productoId ? parseInt(item.productoId) : undefined,
        nombreProductoTemporal: item.esProductoNuevo ? item.nombreProductoTemporal : undefined,
        descripcionProductoTemporal: item.esProductoNuevo ? (item.descripcionProductoTemporal || item.nombreProductoTemporal) : undefined,
        codigoProductoTemporal: item.codigoProductoTemporal || undefined,
        categoriaProductoId: item.categoriaId ? parseInt(item.categoriaId) : undefined,
        esProductoNuevo: item.esProductoNuevo,
        cantidad: item.cantidad,
        costoUnitario: item.precioUnitario,
      })),
    };

    console.log('Compra Payload:', JSON.stringify(compraPayload, null, 2));
    console.log('Should update stock:', shouldUpdateStock);

    let createdOrUpdatedCompra: CompraDTO;
    if (isEditMode && selectedOrden?.id) {
      createdOrUpdatedCompra = await compraApi.update(selectedOrden.id, compraPayload);
      setCompras(compras.map((c) => (c.id === selectedOrden.id ? createdOrUpdatedCompra : c)));
    } else {
      createdOrUpdatedCompra = await compraApi.create(compraPayload);
      setCompras([createdOrUpdatedCompra, ...compras]);
    }

    // If estado changed to RECIBIDA, create stock movements
    if (shouldUpdateStock) {
      console.log('Estado changed to RECIBIDA, updating stock...');
      await createStockMovementsForReceivedItems(createdOrUpdatedCompra);
    }

    // Update prices for selected products
    for (const update of priceUpdates) {
      try {
        await productApi.update(update.productoId, {
          precio: update.precioNuevo,
        });
        console.log(`Updated price for product ${update.productoId} to ${update.precioNuevo}`);
      } catch (err) {
        console.error(`Error updating price for product ${update.productoId}:`, err);
      }
    }

    await loadCompras();
    await loadProductos(); // Reload products to show updated prices and stock
    setOpenOrdenDialog(false);
    setOpenPriceChangeDialog(false);
    setIsEditMode(false);
    setSelectedOrden(null);
    setPriceChanges([]);
    setNewOrden({
      supplierId: '',
      fechaEntregaEstimada: dayjs().add(15, 'day'),
      observaciones: '',
      estado: 'PENDIENTE',
      metodoPago: '' as '' | 'EFECTIVO' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'TRANSFERENCIA' | 'CHEQUE' | 'FINANCIACION_PROPIA',
      items: [{
        productoId: '',
        nombreProductoTemporal: '',
        descripcionProductoTemporal: '',
        codigoProductoTemporal: '',
        categoriaId: '',
        esProductoNuevo: false,
        cantidad: 1,
        precioUnitario: 0,
      }],
    });
    setError(null);
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
    setError(errorMessage);
    console.error('Error saving compra:', err);
  } finally {
    setLoading(false);
  }
};

const handleDeleteOrdenClick = (orden: OrdenCompra) => {
  // Verificar si la orden está en estado RECIBIDA
  if (orden.estado === 'RECIBIDA') {
    setDeleteErrorMessage('No se puede eliminar una orden en estado RECIBIDA. Los productos ya fueron ingresados al stock.');
    setDeleteConfirmOpen(true);
    setOrdenToDelete(null);
  } else {
    setOrdenToDelete(orden);
    setDeleteErrorMessage('');
    setDeleteConfirmOpen(true);
  }
};

const handleConfirmDelete = async () => {
  if (!ordenToDelete) {
    setDeleteConfirmOpen(false);
    return;
  }

  try {
    setLoading(true);
    await compraApi.delete(ordenToDelete.id);
    setError(null);
    setDeleteConfirmOpen(false);
    setOrdenToDelete(null);
    setOpenOrdenDialog(false);
    setSelectedOrden(null);
    setIsEditMode(false);
    // Recargar las órdenes
    loadCompras();
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
    setDeleteErrorMessage(errorMessage);
    console.error('Error deleting compra:', err);
  } finally {
    setLoading(false);
  }
};

const handleCancelDelete = () => {
  setDeleteConfirmOpen(false);
  setOrdenToDelete(null);
  setDeleteErrorMessage('');
};

  const handleAddItem = () => {
    setNewOrden({
      ...newOrden,
      items: [
        ...newOrden.items,
        { productoId: '', nombreProductoTemporal: '', descripcionProductoTemporal: '', codigoProductoTemporal: '', categoriaId: '', esProductoNuevo: false, cantidad: 1, precioUnitario: 0 },
      ],
    });
  };

  const handleRemoveItem = (index: number) => {
    setNewOrden({
      ...newOrden,
      items: newOrden.items.filter((_, i) => i !== index)
    });
  };

// Function to generate automatic code based on category
const generateProductCode = (categoriaId: string): string => {
  if (!categoriaId) return '';

  const categoria = categorias.find(c => c.id.toString() === categoriaId);
  if (!categoria) return '';

  // Get first 3 letters of category name in uppercase
  const prefix = categoria.nombre.substring(0, 3).toUpperCase();

  // Find all existing products with this prefix
  const existingCodes = productos
    .filter(p => p.codigo && p.codigo.startsWith(prefix))
    .map(p => p.codigo);

  // Also consider codes in current order items
  const currentOrderCodes = newOrden.items
    .filter(item => item.codigoProductoTemporal && item.codigoProductoTemporal.startsWith(prefix))
    .map(item => item.codigoProductoTemporal);

  // Combine all codes
  const allCodes = [...existingCodes, ...currentOrderCodes].filter(code => code);

  // Find the highest number used with this prefix
  let maxNumber = 0;
  allCodes.forEach(code => {
    const numberPart = code!.replace(prefix, '');
    const num = parseInt(numberPart, 10);
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num;
    }
  });

  // Generate next code
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  return `${prefix}${nextNumber}`;
};

const handleItemChange = (index: number, field: string, value: any) => {
  const updatedItems = [...newOrden.items];
  updatedItems[index] = { ...updatedItems[index], [field]: value };

  // If changing the product name for a new product, update descripcionProductoTemporal
  if (field === 'nombreProductoTemporal') {
    updatedItems[index].descripcionProductoTemporal = value;
    updatedItems[index].esProductoNuevo = !!value; // Mark as new product if nombreProductoTemporal is set
  }

  // If changing category for a new product, regenerate code
  if (field === 'categoriaId' && updatedItems[index].esProductoNuevo && value) {
    const currentCode = updatedItems[index].codigoProductoTemporal || '';

    // Check if current code looks like auto-generated (3-letter prefix + 3 digits)
    const isAutoGenerated = /^[A-Z]{3}\d{3}$/.test(currentCode);

    // Always regenerate if no code exists, or if it's auto-generated pattern
    if (!currentCode || isAutoGenerated) {
      const autoCode = generateProductCode(value);
      if (autoCode) {
        updatedItems[index].codigoProductoTemporal = autoCode;
        console.log(`🔄 Código regenerado automáticamente para categoría ${value}: ${autoCode}`);
      }
    } else {
      console.log(`ℹ️ Código personalizado detectado (${currentCode}), no se regenera automáticamente`);
    }
  }

  setNewOrden({ ...newOrden, items: updatedItems });
};

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'warning';
      case 'CONFIRMADA': return 'info';
      case 'EN_TRANSITO': return 'primary';
      case 'RECIBIDA': return 'success';
      case 'CANCELADA': return 'error';
      default: return 'default';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <ScheduleIcon />;
      case 'CONFIRMADA': return <CheckIcon />;
      case 'EN_TRANSITO': return <ShippingIcon />;
      case 'RECIBIDA': return <CheckIcon />;
      case 'CANCELADA': return <CancelIcon />;
      default: return <ReceiptIcon />;
    }
  };

const filteredOrdenes = ordenes
  .filter((orden) => {
    const matchesSearch =
      orden.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (orden.proveedor?.razonSocial.toLowerCase()?.includes(searchTerm.toLowerCase()) || false);

    const matchesEstado = !estadoFilter || orden.estado === estadoFilter;

    const ordenSupplierId = orden.supplierId ? orden.supplierId.toString() : '';
    const matchesSupplier = !supplierFilter || ordenSupplierId === supplierFilter;

    const fechaOrden = dayjs(orden.fechaCreacion);
    const matchesFecha =
      (!fechaDesde || fechaOrden.isAfter(fechaDesde.subtract(1, 'day'))) &&
      (!fechaHasta || fechaOrden.isBefore(fechaHasta.add(1, 'day')));

    if (!matchesSupplier && supplierFilter) {
      console.log(`Supplier mismatch: orden.supplierId=${ordenSupplierId}, supplierFilter=${supplierFilter}`);
    }

    return matchesSearch && matchesEstado && matchesSupplier && matchesFecha;
  })
  .sort((a, b) => {
    // Ordenar por fecha de creación descendente (más reciente primero)
    const fechaA = dayjs(a.fechaCreacion);
    const fechaB = dayjs(b.fechaCreacion);
    return fechaB.diff(fechaA);
  });

// Paginate filtered ordenes
const paginatedOrdenes = filteredOrdenes.slice(
  page * rowsPerPage,
  page * rowsPerPage + rowsPerPage
);

const handleChangePage = (_event: unknown, newPage: number) => {
  setPage(newPage);
};

const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
  setRowsPerPage(parseInt(event.target.value, 10));
  setPage(0);
};

  // Handler para exportar lista completa de órdenes a PDF
  const handleExportarListaPDF = async (): Promise<void> => {
    try {
      const proveedorNombre = supplierFilter
        ? proveedores.find(p => p.id.toString() === supplierFilter)?.razonSocial || ''
        : '';

      await generatePurchaseOrdersListPDF(
        filteredOrdenes,
        {
          searchTerm,
          estadoFilter,
          supplierFilter: proveedorNombre,
          fechaDesde: fechaDesde ? fechaDesde.format('YYYY-MM-DD') : '',
          fechaHasta: fechaHasta ? fechaHasta.format('YYYY-MM-DD') : '',
        },
        {
          pendientes: getOrderCountByStatus('PENDIENTE'),
          enTransito: getOrderCountByStatus('EN_TRANSITO'),
          recibidas: getOrderCountByStatus('RECIBIDA'),
          totalAmount: getTotalAmount(),
        }
      );
    } catch (error) {
      console.error('Error al generar PDF de lista de órdenes:', error);
      setError('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  // Handler para exportar detalle de orden a PDF
  const handleExportarOrdenPDF = async (orden: OrdenCompra): Promise<void> => {
    try {
      await generatePurchaseOrderDetailPDF(orden);
    } catch (error) {
      console.error('Error al generar PDF de orden:', error);
      setError('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  const getTotalAmount = () => {
    return filteredOrdenes.reduce((sum, orden) => sum + orden.total, 0);
  };

  const getOrderCountByStatus = (status: string) => {
    return ordenes.filter(orden => orden.estado === status).length;
  };

const [openDeleteDialog, setOpenDeleteDialog] = useState<number | null>(null);

const handleDeleteCompra = async (id: number) => {
  try {
    setLoading(true);
    await compraApi.delete(id);
    setCompras(compras.filter(c => c.id !== id));
    setOpenDeleteDialog(null);
  } catch (err) {
    setError('Error al eliminar la compra');
  } finally {
    setLoading(false);
  }
};

  // Reemplaza el uso de loadData por una función que recargue proveedores y compras:
  const reloadData = async () => {
    await Promise.all([loadProveedores(), loadCompras()]);
  };

  return (
    <ErrorBoundary>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box p={{ xs: 1.5, sm: 2, md: 3 }}>
          <LoadingOverlay open={loading} message="Cargando compras..." />
          {/* Header */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 2,
              mb: 3 
            }}
          >
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
              }}
            >
              <ShoppingCartIcon sx={{ mr: 1.5, fontSize: { xs: 28, md: 35 } }} />
              Compras y Pedidos
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<GetAppIcon />}
                onClick={handleExportarListaPDF}
                fullWidth
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Exportar PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setIsEditMode(false);
                  setSelectedOrden(null);
                  setProductosProveedor([]);
                  setErrorProductosProveedor(null);
                  setOpenOrdenDialog(true);
                }}
                fullWidth
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Nueva Orden
              </Button>
            </Box>
          </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Pendientes</Typography>
              </Box>
              <Typography variant="h4">
                {getOrderCountByStatus('PENDIENTE')}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ShippingIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">En Tránsito</Typography>
              </Box>
              <Typography variant="h4">
                {getOrderCountByStatus('EN_TRANSITO')}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Recibidas</Typography>
              </Box>
              <Typography variant="h4">
                {getOrderCountByStatus('RECIBIDA')}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Filtrado</Typography>
              </Box>
              <Typography variant="h4">
                ${getTotalAmount().toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Filters */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />

            <TextField
              select
              label="Estado"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="PENDIENTE">Pendiente</MenuItem>
              <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
              <MenuItem value="EN_TRANSITO">En Tránsito</MenuItem>
              <MenuItem value="RECIBIDA">Recibida</MenuItem>
              <MenuItem value="CANCELADA">Cancelada</MenuItem>
            </TextField>

<TextField
  select
  label="Proveedor"
  value={supplierFilter}
  onChange={(e) => setSupplierFilter(e.target.value)}
  sx={{ minWidth: 200 }}
>
  <MenuItem value="">Todos</MenuItem>
  {proveedores.map((proveedor) => (
    <MenuItem key={proveedor.id} value={proveedor.id.toString()}>
      {proveedor.razonSocial}
    </MenuItem>
  ))}
</TextField>

            <DatePicker
              label="Desde"
              value={fechaDesde}
              onChange={(newValue) => setFechaDesde(newValue as Dayjs | null)}
              slotProps={{ textField: { size: 'small' } }}
            />

            <DatePicker
              label="Hasta"
              value={fechaHasta}
              onChange={(newValue) => setFechaHasta(newValue as Dayjs | null)}
              slotProps={{ textField: { size: 'small' } }}
            />

            <IconButton onClick={reloadData}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* Orders Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell>Entrega Estimada</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrdenes.map((orden) => (
                <TableRow key={orden.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {orden.numero}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          {orden.proveedor?.razonSocial}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {orden.proveedor?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                 <TableCell>
  {orden.fechaCreacion && dayjs(orden.fechaCreacion).isValid()
    ? dayjs(orden.fechaCreacion).format('DD/MM/YYYY')
    : 'Sin fecha'}
</TableCell>
<TableCell>
  {orden.fechaEntregaEstimada && dayjs(orden.fechaEntregaEstimada).isValid()
    ? dayjs(orden.fechaEntregaEstimada).format('DD/MM/YYYY')
    : 'Sin fecha'}
</TableCell>
                  <TableCell>
                    <Chip
                      icon={getEstadoIcon(orden.estado)}
                      label={orden.estado}
                      color={getEstadoColor(orden.estado) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2">
                      ${orden.total.toLocaleString()
                      }
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewOrden(orden)}
                      color="primary"
                      title="Ver detalles"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEditOrden(orden)}
                      color="default"
                      title="Editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteOrdenClick(orden)}
                      color="error"
                      title="Eliminar"
                    >
                      <DeleteIcon />
                    </IconButton>
                    {/* Recibir button - only show for CONFIRMADA or EN_TRANSITO orders */}
                    {(orden.estado === 'CONFIRMADA' || orden.estado === 'EN_TRANSITO') && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenRecepcion(orden)}
                        color="success"
                        title="Recibir Compra"
                      >
                        <InventoryIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleExportarOrdenPDF(orden)}
                      color="info"
                      title="Exportar PDF"
                    >
                      <PrintIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredOrdenes.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </TableContainer>

        {filteredOrdenes.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No se encontraron órdenes de compra
            </Typography>
          </Box>
        )}

        {/* New/Edit Order Dialog */}
<Dialog
  open={openOrdenDialog}
  onClose={() => setOpenOrdenDialog(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>{isEditMode ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}</DialogTitle>
  <DialogContent>
    <Box pt={2}>
      <TextField
        fullWidth
        select
        label="Proveedor"
        value={newOrden.supplierId}
        onChange={(e) => {
          const newSupplierId = e.target.value;
          setNewOrden({
            ...newOrden,
            supplierId: newSupplierId,
            items: [{ productoId: '', nombreProductoTemporal: '', descripcionProductoTemporal: '', codigoProductoTemporal: '', categoriaId: '', esProductoNuevo: false, cantidad: 1, precioUnitario: 0 }],
          });
          loadProductosDelProveedor(newSupplierId);
        }}
        margin="normal"
        required
        disabled={isEditMode}
        helperText={isEditMode ? "El proveedor no se puede modificar al editar una orden" : ""}
      >
        {proveedores.map((proveedor) => (
          <MenuItem key={proveedor.id} value={proveedor.id.toString()}>
            {proveedor.razonSocial}
          </MenuItem>
        ))}
      </TextField>




<TextField
  fullWidth
  select
  label="Estado"
  value={newOrden.estado || 'PENDIENTE'}
  onChange={(e) => setNewOrden({ ...newOrden, estado: e.target.value })}
  margin="normal"
  required
>
  {['PENDIENTE', 'CONFIRMADA', 'EN_TRANSITO', 'RECIBIDA', 'CANCELADA'].map((estado) => (
    <MenuItem key={estado} value={estado}>
      {estado}
    </MenuItem>
  ))}
</TextField>

<TextField
  fullWidth
  select
  label="Forma de Pago"
  value={newOrden.metodoPago || ''}
  onChange={(e) => setNewOrden({ ...newOrden, metodoPago: e.target.value as '' | 'EFECTIVO' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'TRANSFERENCIA' | 'CHEQUE' | 'FINANCIACION_PROPIA' })}
  margin="normal"
>
  <MenuItem value="">Seleccione...</MenuItem>
  <MenuItem value="EFECTIVO">Efectivo</MenuItem>
  <MenuItem value="TARJETA_CREDITO">Tarjeta de Crédito</MenuItem>
  <MenuItem value="TARJETA_DEBITO">Tarjeta de Débito</MenuItem>
  <MenuItem value="TRANSFERENCIA">Transferencia Bancaria</MenuItem>
  <MenuItem value="CHEQUE">Cheque</MenuItem>
  <MenuItem value="FINANCIACION_PROPIA">Financiación Propia</MenuItem>
</TextField>

      <DatePicker
        label="Fecha de Entrega Estimada"
        value={newOrden.fechaEntregaEstimada}
        onChange={(date) => setNewOrden({ ...newOrden, fechaEntregaEstimada: (date as Dayjs) || dayjs() })}
        slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
      />

      <TextField
        fullWidth
        label="Observaciones"
        value={newOrden.observaciones}
        onChange={(e) => setNewOrden({ ...newOrden, observaciones: e.target.value })}
        margin="normal"
        multiline
        rows={2}
      />

      <Typography variant="h6" sx={{ mt: 2 }}>
        Items de la Orden
      </Typography>

      {loadingProductosProveedor && (
        <Box display="flex" alignItems="center" gap={1} my={1}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Cargando productos del proveedor...
          </Typography>
        </Box>
      )}

      {errorProductosProveedor && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button size="small" onClick={() => loadProductosDelProveedor(newOrden.supplierId)}>
            Reintentar
          </Button>
        }>
          {errorProductosProveedor}
        </Alert>
      )}

      {newOrden.supplierId && !loadingProductosProveedor && !errorProductosProveedor && productosProveedor.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Este proveedor no tiene productos configurados. Ir a Proveedores → Productos para asociarlos.
        </Alert>
      )}

      {newOrden.items.map((item, index) => {
        const opcionesProducto = productosProveedor.map((pp) => ({
          id: pp.productoId,
          nombre: pp.productoNombre,
          codigo: pp.productoCodigo,
          precio: pp.precioProveedor ?? 0,
          stockActual: 0,
        } as Producto));
        return (
  <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
    <Box display="flex" gap={2} alignItems="flex-start" mb={2}>
      <Autocomplete
        options={opcionesProducto}
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : `${option.nombre} (${option.codigo || 'sin código'})`
        }
        getOptionKey={(option) =>
          typeof option === 'string' ? option : option.id.toString()
        }
        isOptionEqualToValue={(option, value) =>
          typeof option === 'object' && typeof value === 'object' && option.id === value.id
        }
        value={
          item.productoId
            ? opcionesProducto.find((p) => p.id.toString() === item.productoId) || null
            : null
        }
        inputValue={
          item.productoId
            ? opcionesProducto.find((p) => p.id.toString() === item.productoId)?.nombre || ''
            : item.nombreProductoTemporal || ''
        }
        onChange={(_, newValue) => {
          const updatedItems = [...newOrden.items];
          if (typeof newValue === 'string') {
            // User typed a new product name
            updatedItems[index] = {
              ...updatedItems[index],
              productoId: '',
              nombreProductoTemporal: newValue,
              descripcionProductoTemporal: newValue,
              esProductoNuevo: true,
              precioUnitario: updatedItems[index].precioUnitario || 0,
            };
          } else if (newValue && newValue.id) {
            // User selected an existing product
            updatedItems[index] = {
              ...updatedItems[index],
              productoId: newValue.id.toString(),
              nombreProductoTemporal: newValue.nombre,
              descripcionProductoTemporal: newValue.nombre,
              codigoProductoTemporal: newValue.codigo || '',
              esProductoNuevo: false,
              precioUnitario: newValue.precio || updatedItems[index].precioUnitario || 0,
            };
          } else {
            // User cleared the selection
            updatedItems[index] = {
              ...updatedItems[index],
              productoId: '',
              nombreProductoTemporal: '',
              descripcionProductoTemporal: '',
              codigoProductoTemporal: '',
              esProductoNuevo: false,
              precioUnitario: updatedItems[index].precioUnitario || 0,
            };
          }
          setNewOrden({ ...newOrden, items: updatedItems });
        }}
        onInputChange={(_, newInputValue, reason) => {
          // Only update when user is typing, not when selecting from dropdown
          if (reason === 'input') {
            const updatedItems = [...newOrden.items];
            // Don't override if a product was already selected
            if (!updatedItems[index].productoId) {
              updatedItems[index] = {
                ...updatedItems[index],
                nombreProductoTemporal: newInputValue,
                descripcionProductoTemporal: newInputValue,
                esProductoNuevo: !!newInputValue && newInputValue.trim() !== '',
                productoId: '',
                precioUnitario: updatedItems[index].precioUnitario || 0,
              };
              setNewOrden({ ...newOrden, items: updatedItems });
            }
          } else if (reason === 'clear') {
            const updatedItems = [...newOrden.items];
            updatedItems[index] = {
              ...updatedItems[index],
              productoId: '',
              nombreProductoTemporal: '',
              descripcionProductoTemporal: '',
              codigoProductoTemporal: '',
              esProductoNuevo: false,
            };
            setNewOrden({ ...newOrden, items: updatedItems });
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Producto"
            required
            helperText={item.productoId ? 'Producto seleccionado' : ''}
          />
        )}
        sx={{ flex: 1 }}
      />
      <IconButton
        onClick={() => handleRemoveItem(index)}
        disabled={newOrden.items.length === 1}
        color="error"
      >
        <DeleteIcon />
      </IconButton>
    </Box>
    <Box display="flex" gap={2} flexWrap="wrap">
      {item.esProductoNuevo && (
        <TextField
          select
          label="Categoría *"
          value={item.categoriaId || ''}
          onChange={(e) => handleItemChange(index, 'categoriaId', e.target.value)}
          sx={{ minWidth: 200 }}
          required={item.esProductoNuevo}
          helperText="Requerido - genera código automáticamente"
          error={!item.categoriaId}
        >
          <MenuItem value="">Seleccione...</MenuItem>
          {categorias.map((cat) => (
            <MenuItem key={cat.id} value={cat.id.toString()}>
              {cat.nombre}
            </MenuItem>
          ))}
        </TextField>
      )}
      <TextField
        label="Código"
        value={item.codigoProductoTemporal || ''}
        onChange={(e) => handleItemChange(index, 'codigoProductoTemporal', e.target.value)}
        sx={{ minWidth: 150 }}
        helperText={item.esProductoNuevo ? "Auto-generado (editable)" : "Código del producto"}
      />
      <TextField
        type="number"
        label="Cantidad"
        value={item.cantidad}
        onChange={(e) => handleItemChange(index, 'cantidad', parseInt(e.target.value) || 0)}
        sx={{ width: 100 }}
        required
      />
      <TextField
        type="number"
        label="Precio Unitario"
        value={item.precioUnitario}
        onChange={(e) => handleItemChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
        sx={{ width: 120 }}
        required
      />
      <TextField
        label="Total"
        value={(item.cantidad * item.precioUnitario).toFixed(2)}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
          readOnly: true,
        }}
        sx={{ width: 120 }}
      />
    </Box>
  </Box>
        );
      })}
      <Button
        onClick={handleAddItem}
        sx={{ mb: 2 }}
        startIcon={<AddIcon />}
        disabled={newOrden.supplierId !== '' && productosProveedor.length === 0 && !loadingProductosProveedor}
      >
        Agregar Item
      </Button>
      <Typography>
        Total: $
        {newOrden.items
          .reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)
          .toLocaleString()}
      </Typography>
    </Box>
  </DialogContent>
  <DialogActions sx={{ justifyContent: 'space-between' }}>
    <Box>
      {isEditMode && selectedOrden && (
        <Button
          startIcon={<DeleteIcon />}
          color="error"
          onClick={() => handleDeleteOrdenClick(selectedOrden)}
          disabled={loading}
        >
          Eliminar
        </Button>
      )}
    </Box>
    <Box>
      <Button onClick={() => setOpenOrdenDialog(false)}>Cancelar</Button>
      <Button
        variant="contained"
        onClick={handleSaveOrden}
        disabled={
    !newOrden.supplierId ||
    newOrden.items.length === 0 ||
    newOrden.items.some(
      (item) =>
        (!item.productoId && !item.nombreProductoTemporal) ||
        item.cantidad <= 0 ||
        item.precioUnitario <= 0
    )
  }
      >
        {isEditMode ? 'Actualizar' : 'Crear'} Orden
      </Button>
    </Box>
  </DialogActions>
</Dialog>
        <Dialog
  open={openDeleteDialog !== null}
  onClose={() => setOpenDeleteDialog(null)}
>
  <DialogTitle>Confirmar Eliminación</DialogTitle>
  <DialogContent>
    <Typography>¿Está seguro de que desea eliminar esta compra?</Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenDeleteDialog(null)}>Cancelar</Button>
    <Button
      variant="contained"
      color="error"
      onClick={() => handleDeleteCompra(openDeleteDialog!)}
    >
      Eliminar
    </Button>
  </DialogActions>
</Dialog>

        {/* View Order Dialog */}
        <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Orden de Compra {selectedOrden?.numero}
          </DialogTitle>
          <DialogContent>
            {selectedOrden && (
              <Box pt={2}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Información General
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Proveedor</Typography>
                      <Typography variant="body1">{selectedOrden.proveedor?.razonSocial}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Estado</Typography>
                      <Chip
                        icon={getEstadoIcon(selectedOrden.estado)}
                        label={selectedOrden.estado}
                        color={getEstadoColor(selectedOrden.estado) as any}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Fecha Creación</Typography>
                      <Typography variant="body1">{new Date(selectedOrden.fechaCreacion).toLocaleDateString()}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Entrega Estimada</Typography>
                      <Typography variant="body1">{new Date(selectedOrden.fechaEntregaEstimada).toLocaleDateString()}</Typography>
                    </Box>
                    {selectedOrden.fechaEntregaReal && (
                      <>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Entrega Real</Typography>
                          <Typography variant="body1">{new Date(selectedOrden.fechaEntregaReal).toLocaleDateString()}</Typography>
                        </Box>
                      </>
                    )}
                    {selectedOrden.metodoPago && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Forma de Pago</Typography>
                        <Typography variant="body1">
                          {selectedOrden.metodoPago === 'EFECTIVO' && 'Efectivo'}
                          {selectedOrden.metodoPago === 'TARJETA_CREDITO' && 'Tarjeta de Crédito'}
                          {selectedOrden.metodoPago === 'TARJETA_DEBITO' && 'Tarjeta de Débito'}
                          {selectedOrden.metodoPago === 'TRANSFERENCIA' && 'Transferencia Bancaria'}
                          {selectedOrden.metodoPago === 'CHEQUE' && 'Cheque'}
                          {selectedOrden.metodoPago === 'FINANCIACION_PROPIA' && 'Financiación Propia'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {selectedOrden.observaciones && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">Observaciones</Typography>
                      <Typography variant="body1">{selectedOrden.observaciones}</Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="h6" gutterBottom>
                  Items de la Orden
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Cantidad</TableCell>
                        <TableCell align="right">Precio Unit.</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrden.items.map((item) => {
                        // Try to find the product from the productos array if we have a productoId
                        const producto = item.productoId ? productos.find(p => p.id === Number(item.productoId)) : null;
                        const productName = item.nombreProductoTemporal || (item as any).nombre || (item as any).productoNombre || producto?.nombre || item.descripcion || 'Producto sin nombre';
                        const productCode = item.codigoProductoTemporal || (item as any).codigo || producto?.codigo || '';
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {productName}
                              </Typography>
                              {productCode && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Código: {productCode}
                                </Typography>
                              )}
                              {item.descripcionProductoTemporal && item.descripcionProductoTemporal !== productName && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {item.descripcionProductoTemporal}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">{item.cantidad}</TableCell>
                            <TableCell align="right">${item.precioUnitario.toLocaleString()}</TableCell>
                            <TableCell align="right">${item.subtotal.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          ${selectedOrden.total.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>
              Cerrar
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => selectedOrden && handleExportarOrdenPDF(selectedOrden)}
            >
              Imprimir PDF
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleCancelDelete}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <DeleteIcon color={deleteErrorMessage ? 'disabled' : 'error'} />
              <Typography variant="h6">
                {ordenToDelete ? 'Confirmar Eliminación' : 'No se puede eliminar'}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {deleteErrorMessage ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                {deleteErrorMessage}
              </Alert>
            ) : ordenToDelete ? (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1" gutterBottom>
                  ¿Está seguro de que desea eliminar la orden de compra <strong>#{ordenToDelete.numero}</strong>?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Esta acción no se puede deshacer.
                </Typography>
              </Box>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} color="inherit">
              {deleteErrorMessage ? 'Cerrar' : 'Cancelar'}
            </Button>
            {ordenToDelete && !deleteErrorMessage && (
              <Button
                onClick={handleConfirmDelete}
                color="error"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Price Change Confirmation Dialog */}
        <Dialog
          open={openPriceChangeDialog}
          onClose={() => {
            setOpenPriceChangeDialog(false);
            setPriceChanges([]);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <MoneyIcon color="warning" />
              <Typography variant="h6">Cambios de Precio Detectados</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Se detectaron cambios en los precios de compra. Seleccione los productos cuyos precios desea actualizar en el sistema.
            </Alert>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Actualizar</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Costo Anterior</TableCell>
                    <TableCell align="center">→</TableCell>
                    <TableCell align="right">Costo Nuevo</TableCell>
                    <TableCell align="right">Variación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {priceChanges.map((change, index) => {
                    // Proteger contra división por cero cuando el costo anterior es 0
                    const variation = change.precioAnterior > 0
                      ? ((change.precioNuevo - change.precioAnterior) / change.precioAnterior) * 100
                      : (change.precioNuevo > 0 ? 100 : 0); // Si no había costo anterior, es 100% nuevo
                    const isIncrease = variation > 0;

                    return (
                      <TableRow key={change.productoId}>
                        <TableCell>
                          <Checkbox
                            checked={change.shouldUpdate}
                            onChange={(e) => {
                              const updated = [...priceChanges];
                              updated[index].shouldUpdate = e.target.checked;
                              setPriceChanges(updated);
                            }}
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {change.nombreProducto}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            ${change.precioAnterior.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography color={isIncrease ? 'error' : 'success'}>
                            →
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={isIncrease ? 'error.main' : 'success.main'}
                          >
                            ${change.precioNuevo.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${isIncrease ? '+' : ''}${variation.toFixed(1)}%`}
                            color={isIncrease ? 'error' : 'success'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={priceChanges.every(c => c.shouldUpdate)}
                    indeterminate={
                      priceChanges.some(c => c.shouldUpdate) &&
                      !priceChanges.every(c => c.shouldUpdate)
                    }
                    onChange={(e) => {
                      const allChecked = e.target.checked;
                      setPriceChanges(priceChanges.map(c => ({ ...c, shouldUpdate: allChecked })));
                    }}
                  />
                }
                label="Seleccionar todos"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                // Save without updating prices
                saveOrdenWithPriceUpdates([]);
              }}
              color="inherit"
            >
              Guardar sin Actualizar Precios
            </Button>
            <Button
              onClick={() => {
                // Save with selected price updates
                const updates = priceChanges
                  .filter(c => c.shouldUpdate)
                  .map(c => ({
                    productoId: c.productoId,
                    precioNuevo: c.precioNuevo,
                  }));
                saveOrdenWithPriceUpdates(updates);
              }}
              variant="contained"
              color="primary"
              disabled={!priceChanges.some(c => c.shouldUpdate)}
            >
              Actualizar {priceChanges.filter(c => c.shouldUpdate).length} Precio(s)
            </Button>
          </DialogActions>
        </Dialog>

        {/* Recepción de Compra Dialog */}
        <Dialog
          open={openRecepcionDialog}
          onClose={() => !recepcionLoading && setOpenRecepcionDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon color="success" />
              <Typography variant="h6">
                Recibir Compra {ordenToReceive?.numero}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {recepcionError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRecepcionError(null)}>
                {recepcionError}
              </Alert>
            )}
            {recepcionSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {recepcionSuccess}
              </Alert>
            )}

            {/* NUEVO: Mensaje informativo sobre asignación automática */}
            <Alert severity="info" sx={{ mb: 2 }} icon={<InventoryIcon />}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Asignación Automática de Stock
              </Typography>
              <Typography variant="body2">
                El stock de esta compra ingresará automáticamente al <strong>depósito principal</strong> de la empresa.
                Desde allí podrás realizar transferencias a otros depósitos según sea necesario.
              </Typography>
            </Alert>

            {ordenToReceive && (
              <Box sx={{ pt: 1 }}>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Información de la Compra
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Proveedor</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {ordenToReceive.proveedor?.razonSocial || proveedores.find(p => p.id.toString() === ordenToReceive.supplierId)?.razonSocial || '-'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Fecha Compra</Typography>
                      <Typography variant="body1">
                        {dayjs(ordenToReceive.fechaCreacion).format('DD/MM/YYYY')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        ${ordenToReceive.total?.toLocaleString() || '0'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Productos a Recibir
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell>Producto</TableCell>
                        <TableCell align="center">Cant. Comprada</TableCell>
                        <TableCell align="center" sx={{ minWidth: 120 }}>Cant. Recibida *</TableCell>
                        <TableCell>Observaciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recepcionItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {item.productoNombre}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={item.cantidadCompra} size="small" />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              fullWidth
                              size="small"
                              value={item.cantidadRecibida}
                              onChange={(e) => {
                                const updated = [...recepcionItems];
                                updated[index].cantidadRecibida = parseInt(e.target.value) || 0;
                                setRecepcionItems(updated);
                              }}
                              inputProps={{ min: 0, max: item.cantidadCompra }}
                              error={item.cantidadRecibida <= 0}
                              disabled={recepcionLoading}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={item.observaciones}
                              onChange={(e) => {
                                const updated = [...recepcionItems];
                                updated[index].observaciones = e.target.value;
                                setRecepcionItems(updated);
                              }}
                              placeholder="Opcional"
                              disabled={recepcionLoading}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Observaciones Generales"
                  value={recepcionObservaciones}
                  onChange={(e) => setRecepcionObservaciones(e.target.value)}
                  disabled={recepcionLoading}
                  sx={{ mt: 1 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setOpenRecepcionDialog(false)}
              disabled={recepcionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmitRecepcion}
              disabled={recepcionLoading || recepcionItems.some(i => i.cantidadRecibida <= 0)}
              startIcon={recepcionLoading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
            >
              {recepcionLoading ? 'Procesando...' : 'Confirmar Recepción'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </LocalizationProvider>
    </ErrorBoundary>
  );
};
export default ComprasPedidosPage;
