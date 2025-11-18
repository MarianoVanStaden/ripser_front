import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tab,
  Tabs,
  Tooltip,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
// Real API services
import { clienteApi, productApi, usuarioApi } from '../../api/services';
import { documentoApi } from '../../api/services/documentoApi';
import opcionFinanciamientoApi from '../../api/services/opcionFinanciamientoApi';
import opcionFinanciamientoTemplateApi, { type OpcionFinanciamientoTemplateDTO } from '../../api/services/opcionFinanciamientoTemplateApi';
import { recetaFabricacionApi } from '../../api/services/recetaFabricacionApi';
import SuccessDialog from "../common/SuccessDialog";
import AsignarEquiposDialog from "./AsignarEquiposDialog";
import { useAuth } from '../../context/AuthContext';
import type {
  Cliente,
  Usuario,
  Producto,
  DocumentoComercial,
  DetalleDocumento,
  MetodoPago,
  OpcionFinanciamientoDTO,
  RecetaFabricacionDTO,
  TipoItemDocumento,
} from '../../types';

// Types
const PAYMENT_METHODS: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
  { value: 'TRANSFERENCIA_BANCARIA', label: 'Transferencia Bancaria' },
];

type TipoIva = 'IVA_21' | 'IVA_10_5' | 'EXENTO';
const IVA_OPTIONS: { value: TipoIva; label: string; rate: number }[] = [
  { value: 'IVA_21', label: 'IVA 21%', rate: 0.21 },
  { value: 'IVA_10_5', label: 'IVA 10.5%', rate: 0.105 },
  { value: 'EXENTO', label: 'Exento 0%', rate: 0 },
];

const ESTADO_OPTIONS: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  PENDIENTE: { label: 'Pendiente', color: 'warning' },
  APROBADO: { label: 'Aprobado', color: 'success' },
  RECHAZADO: { label: 'Rechazado', color: 'secondary' },
  PAGADA: { label: 'Pagada', color: 'primary' },
  VENCIDA: { label: 'Vencida', color: 'error' },
  ANULADA: { label: 'Anulada', color: 'default' },
};

type CartItem = {
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioManualmenteModificado?: boolean;
  tipoItem: TipoItemDocumento;
  // PRODUCTO fields (optional when tipoItem is EQUIPO)
  productoId?: number;
  productoNombre?: string;
  // EQUIPO fields (optional when tipoItem is PRODUCTO)
  recetaId?: number;
  recetaNombre?: string;
  recetaModelo?: string;
  recetaTipo?: string;
};

type NotaCartItem = {
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tipoItem?: 'PRODUCTO' | 'EQUIPO';
  // PRODUCTO fields (optional when tipoItem is EQUIPO)
  productoId?: number;
  productoNombre?: string;
  // EQUIPO fields (optional when tipoItem is PRODUCTO)
  recetaId?: number;
  recetaNombre?: string;
  recetaModelo?: string;
  recetaTipo?: string;
  descripcionEquipo?: string;
};

const FacturacionPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Data
  const [clients, setClients] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<RecetaFabricacionDTO[]>([]);
  const [notasPedido, setNotasPedido] = useState<DocumentoComercial[]>([]);
  
  // Manual invoice form
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | ''>(user?.id ?? '');
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('EFECTIVO');
  const [invoiceDate, setInvoiceDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [dueDate, setDueDate] = useState(dayjs().add(30, 'days').format('YYYY-MM-DD'));
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedIva, setSelectedIva] = useState<TipoIva>('IVA_21');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // From Nota de Pedido
  const [selectedNotaPedido, setSelectedNotaPedido] = useState<DocumentoComercial | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [editingNotaItems, setEditingNotaItems] = useState(false);
  const [notaCart, setNotaCart] = useState<NotaCartItem[]>([]);
  
  // Estado management dialog
  const [estadoDialogOpen, setEstadoDialogOpen] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState<DocumentoComercial | null>(null);
  const [newEstado, setNewEstado] = useState<DocumentoComercial['estado']>('PENDIENTE');

  // Financiamiento states
  const [financiamientoDialogOpen, setFinanciamientoDialogOpen] = useState(false);
  const [opcionesFinanciamiento, setOpcionesFinanciamiento] = useState<OpcionFinanciamientoDTO[]>([]);
  const [selectedOpcionId, setSelectedOpcionId] = useState<number | null>(null);
  const [plantillasFinanciamiento, setPlantillasFinanciamiento] = useState<OpcionFinanciamientoTemplateDTO[]>([]);
  const [loadingOpciones, setLoadingOpciones] = useState(false);
  const [newOpcionForm, setNewOpcionForm] = useState({
    nombre: '',
    metodoPago: 'EFECTIVO' as MetodoPago,
    cantidadCuotas: 1,
    tasaInteres: 0,
    descripcion: '',
  });
  const [showNewOpcionForm, setShowNewOpcionForm] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdFactura, setCreatedFactura] = useState<DocumentoComercial | null>(null);
  const [asignarEquiposDialogOpen, setAsignarEquiposDialogOpen] = useState(false);
  const [notaParaAsignacion, setNotaParaAsignacion] = useState<DocumentoComercial | null>(null);
  const [isManualInvoice, setIsManualInvoice] = useState(false);
  const [notaOpcionesFinanciamiento, setNotaOpcionesFinanciamiento] = useState<Record<number, OpcionFinanciamientoDTO[]>>({});

  // Pagination for Notas de Pedido
  const [pageNotas, setPageNotas] = useState(0);
  const [rowsPerPageNotas, setRowsPerPageNotas] = useState(12);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsData, usuariosResponse, productsData, recetasData, notasData, plantillasData] = await Promise.all([
        clienteApi.getAll().catch(() => []),
        usuarioApi.getAll().catch((err: any) => {
          if (err?.response?.status === 403) return { content: [] };
          return { content: [] };
        }),
        productApi.getAll().catch(() => []),
        recetaFabricacionApi.findDisponiblesParaVenta().catch(() => []),
        documentoApi.getByTipo('NOTA_PEDIDO').catch(() => []),
        opcionFinanciamientoTemplateApi.obtenerActivas().catch(() => []),
      ]);

      setClients(Array.isArray(clientsData) ? clientsData : []);
      // Handle paginated response from usuarioApi
      const usuariosArray = Array.isArray(usuariosResponse)
        ? usuariosResponse
        : (usuariosResponse?.content || []);
      setUsuarios(usuariosArray);
      setProducts(Array.isArray(productsData) ? (productsData as Producto[]).filter(p => p && (p as any).id) : []);
      setRecetas(Array.isArray(recetasData) ? recetasData : []);
      setPlantillasFinanciamiento(Array.isArray(plantillasData) ? plantillasData : []);
      
      const invoiceableNotas = Array.isArray(notasData) 
        ? notasData.filter(n => n.estado === 'APROBADO' || n.estado === 'PENDIENTE')
        : [];
      setNotasPedido(invoiceableNotas);

      // Load financing options for each nota
      const opcionesMap: Record<number, OpcionFinanciamientoDTO[]> = {};
      await Promise.all(
        invoiceableNotas.map(async (nota) => {
          try {
            const opciones = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(nota.id);
            if (opciones && opciones.length > 0) {
              opcionesMap[nota.id] = opciones;
            }
          } catch (err) {
            console.error(`Error loading financing options for nota ${nota.id}:`, err);
          }
        })
      );
      setNotaOpcionesFinanciamiento(opcionesMap);
      
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError('No se pudieron cargar los datos necesarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user?.id && !selectedUsuarioId) {
      setSelectedUsuarioId(user.id);
    }
  }, [user?.id]);

  const subtotalVenta = useMemo(() => {
    return cart.reduce((sum, item) => {
      const itemSubtotal = item.cantidad * item.precioUnitario;
      const discountAmount = itemSubtotal * (item.descuento / 100);
      return sum + (itemSubtotal - discountAmount);
    }, 0);
  }, [cart]);

  const ivaAmount = useMemo(() => {
    const ivaRate = IVA_OPTIONS.find((option) => option.value === selectedIva)?.rate || 0;
    return subtotalVenta * ivaRate;
  }, [subtotalVenta, selectedIva]);

  const totalVenta = useMemo(() => subtotalVenta + ivaAmount, [subtotalVenta, ivaAmount]);

  const notaSubtotal = useMemo(() => {
    return notaCart.reduce((sum, item) => {
      const itemSubtotal = item.cantidad * item.precioUnitario;
      const discountAmount = itemSubtotal * (item.descuento / 100);
      return sum + (itemSubtotal - discountAmount);
    }, 0);
  }, [notaCart]);

  const notaFinancingAdjustment = useMemo(() => {
    const selectedOpcion = opcionesFinanciamiento[selectedOpcionId];
    if (!selectedOpcion || selectedOpcion.tasaInteres === 0) return 0;
    return notaSubtotal * (selectedOpcion.tasaInteres / 100);
  }, [notaSubtotal, selectedOpcionId, opcionesFinanciamiento]);

  const notaIvaAmount = useMemo(() => {
    if (!selectedNotaPedido) return 0;
    const ivaRate = IVA_OPTIONS.find((option) => option.value === (selectedNotaPedido as any).tipoIva)?.rate || 0.21;
    const subtotalConFinanciamiento = notaSubtotal + notaFinancingAdjustment;
    return subtotalConFinanciamiento * ivaRate;
  }, [notaSubtotal, notaFinancingAdjustment, selectedNotaPedido]);

  const notaTotalVenta = useMemo(() => notaSubtotal + notaFinancingAdjustment + notaIvaAmount, [notaSubtotal, notaFinancingAdjustment, notaIvaAmount]);

  // Sort and paginate Notas de Pedido
  const sortedNotasPedido = useMemo(() => {
    return [...notasPedido].sort((a, b) => {
      const dateA = new Date(a.fecha || a.fechaEmision || 0).getTime();
      const dateB = new Date(b.fecha || b.fechaEmision || 0).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }, [notasPedido]);

  const paginatedNotasPedido = useMemo(() => {
    return sortedNotasPedido.slice(
      pageNotas * rowsPerPageNotas,
      pageNotas * rowsPerPageNotas + rowsPerPageNotas
    );
  }, [sortedNotasPedido, pageNotas, rowsPerPageNotas]);

  const handleChangePageNotas = (_event: unknown, newPage: number) => {
    setPageNotas(newPage);
  };

  const handleChangeRowsPerPageNotas = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageNotas(parseInt(event.target.value, 10));
    setPageNotas(0);
  };

  // Helper functions for financing
  const getMetodoPagoIcon = (metodoPago: MetodoPago | string) => {
    switch (metodoPago) {
      case 'EFECTIVO':
        return <MoneyIcon fontSize="small" />;
      case 'TARJETA_CREDITO':
        return <CreditCardIcon fontSize="small" />;
      case 'TRANSFERENCIA_BANCARIA':
      case 'FINANCIACION_PROPIA':
        return <BankIcon fontSize="small" />;
      default:
        return <MoneyIcon fontSize="small" />;
    }
  };

  const getMetodoPagoLabel = (metodoPago: MetodoPago | string) => {
    switch (metodoPago) {
      case 'EFECTIVO': return 'Efectivo';
      case 'TARJETA_CREDITO': return 'Tarjeta de Crédito';
      case 'TARJETA_DEBITO': return 'Tarjeta de Débito';
      case 'TRANSFERENCIA_BANCARIA': return 'Transferencia bancaria';
      case 'FINANCIACION_PROPIA': return 'Financiación propia';
      case 'CHEQUE': return 'Cheque';
      default: return String(metodoPago);
    }
  };

  const clearForm = () => {
    setSelectedClientId('');
    setSelectedUsuarioId('');
    setPaymentMethod('EFECTIVO');
    setInvoiceDate(dayjs().format('YYYY-MM-DD'));
    setDueDate(dayjs().add(30, 'days').format('YYYY-MM-DD'));
    setNotes('');
    setCart([]);
    setSelectedIva('IVA_21');
    setInvoiceNumber('');
    setError(null);
    setSuccess(null);
  };

  const addItemToCart = () => {
    if (products.length === 0 && recetas.length === 0) {
      setError('No hay productos ni equipos disponibles para agregar.');
      return;
    }

    // Add PRODUCTO by default if available, otherwise EQUIPO
    if (products.length > 0) {
      const defaultProduct = products[0];
      setCart((prev) => [
        ...prev,
        {
          tipoItem: 'PRODUCTO',
          productoId: defaultProduct.id,
          productoNombre: defaultProduct.nombre || 'Producto sin nombre',
          cantidad: 1,
          precioUnitario: defaultProduct.precio || 0,
          descuento: 0,
          precioManualmenteModificado: false,
        },
      ]);
    } else if (recetas.length > 0) {
      const defaultReceta = recetas[0];
      setCart((prev) => [
        ...prev,
        {
          tipoItem: 'EQUIPO',
          recetaId: defaultReceta.id,
          recetaNombre: defaultReceta.nombre,
          recetaModelo: defaultReceta.modelo,
          recetaTipo: defaultReceta.tipoEquipo,
          cantidad: 1,
          precioUnitario: defaultReceta.precioVenta || 0,
          descuento: 0,
          precioManualmenteModificado: false,
        },
      ]);
    }
  };

  const updateCartItem = (index: number, field: 'tipoItem'|'productoId'|'recetaId'|'cantidad'|'precioUnitario'|'descuento', value: any) => {
    const newCart = [...cart];
    const item = { ...newCart[index] };

    if (field === 'tipoItem') {
      // Switch between PRODUCTO and EQUIPO
      const newTipoItem = value as TipoItemDocumento;
      item.tipoItem = newTipoItem;

      // Reset item-specific fields and set default
      if (newTipoItem === 'PRODUCTO' && products.length > 0) {
        const defaultProduct = products[0];
        item.productoId = defaultProduct.id;
        item.productoNombre = defaultProduct.nombre;
        item.precioUnitario = defaultProduct.precio || 0;
        // Clear equipo fields
        delete item.recetaId;
        delete item.recetaNombre;
        delete item.recetaModelo;
        delete item.recetaTipo;
      } else if (newTipoItem === 'EQUIPO' && recetas.length > 0) {
        const defaultReceta = recetas[0];
        item.recetaId = defaultReceta.id;
        item.recetaNombre = defaultReceta.nombre;
        item.recetaModelo = defaultReceta.modelo;
        item.recetaTipo = defaultReceta.tipoEquipo;
        item.precioUnitario = defaultReceta.precioVenta || 0;
        // Clear producto fields
        delete item.productoId;
        delete item.productoNombre;
      }
      item.precioManualmenteModificado = false;
    } else if (field === 'productoId') {
      const product = products.find((p) => p && p.id === Number(value));
      if (product) {
        item.productoId = product.id;
        item.productoNombre = product.nombre || 'Producto sin nombre';
        if (!item.precioManualmenteModificado) {
          item.precioUnitario = product.precio || 0;
        }
      }
    } else if (field === 'recetaId') {
      const receta = recetas.find((r) => r.id === Number(value));
      if (receta) {
        item.recetaId = receta.id;
        item.recetaNombre = receta.nombre;
        item.recetaModelo = receta.modelo;
        item.recetaTipo = receta.tipoEquipo;
        if (!item.precioManualmenteModificado) {
          item.precioUnitario = receta.precioVenta || 0;
        }
      }
    } else if (field === 'cantidad') {
      item.cantidad = Math.max(1, Number(value) || 1);
    } else if (field === 'precioUnitario') {
      item.precioUnitario = Math.max(0, Number(value) || 0);
      item.precioManualmenteModificado = true;
    } else if (field === 'descuento') {
      item.descuento = Math.min(100, Math.max(0, Number(value) || 0));
    }

    newCart[index] = item;
    setCart(newCart);
  };

  const removeItemFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitManualInvoice = async () => {
    if (!selectedClientId) return setError('Debe seleccionar un cliente.');
    if (!selectedUsuarioId) return setError('Debe seleccionar un usuario.');
    if (cart.length === 0) return setError('Debe agregar al menos un producto al carrito.');

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const presupuesto = await documentoApi.createPresupuesto({
        clienteId: Number(selectedClientId),
        usuarioId: Number(selectedUsuarioId),
        tipoIva: selectedIva,
        observaciones: notes || undefined,
        detalles: cart.map((item) => {
          const subtotal = Number((item.cantidad * item.precioUnitario) * (1 - (item.descuento || 0) / 100));

          // Base detalle with common fields
          const detalle: any = {
            tipoItem: item.tipoItem || 'PRODUCTO',
            cantidad: Number(item.cantidad),
            precioUnitario: Number(item.precioUnitario),
            descuento: Number(item.descuento) || 0,
            subtotal: subtotal,
          };

          // Add type-specific fields
          if (item.tipoItem === 'EQUIPO') {
            detalle.recetaId = Number(item.recetaId);
            const equipoDesc = item.recetaNombre
              ? `${item.recetaNombre}${item.recetaModelo ? ` - ${item.recetaModelo}` : ''}`
              : undefined;
            detalle.descripcionEquipo = equipoDesc;
            detalle.descripcion = equipoDesc; // Also set general descripcion for reports
          } else {
            detalle.productoId = Number(item.productoId);
            detalle.descripcion = item.productoNombre || undefined;
          }

          return detalle;
        }),
      });

      // If user selected a financing option, load generated options and select it
      if (selectedOpcionId !== null && typeof selectedOpcionId === 'number') {
        // Load the auto-generated financing options
        const generatedOpciones = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(presupuesto.id);
        
        // Find the option that matches the selected template index
        const selectedTemplate = plantillasFinanciamiento[selectedOpcionId];
        if (selectedTemplate && generatedOpciones.length > 0) {
          const matchingOpcion = generatedOpciones.find(o => 
            o.nombre === selectedTemplate.nombre && 
            o.cantidadCuotas === selectedTemplate.cantidadCuotas
          );
          
          if (matchingOpcion?.id) {
            await documentoApi.selectFinanciamiento(presupuesto.id, matchingOpcion.id);
          }
        }
      }

      const nota = await documentoApi.convertToNotaPedido({
        presupuestoId: presupuesto.id,
        metodoPago: paymentMethod,
        tipoIva: selectedIva,
      });


      // Check if there are EQUIPO items in the nota
      const detallesEquipo = nota.detalles?.filter(d => d.tipoItem === 'EQUIPO') || [];

      if (detallesEquipo.length > 0) {
        // Open AsignarEquiposDialog for equipment assignment
        setNotaParaAsignacion(nota);
        setIsManualInvoice(true);
        setAsignarEquiposDialogOpen(true);
        setLoading(false);
      } else {
        // No equipos, proceed directly with factura creation
        const factura = await documentoApi.convertToFactura({
          notaPedidoId: nota.id,
        });

        setCreatedFactura(factura);
        setSuccessDialogOpen(true);
        clearForm();
        setSelectedOpcionId(null);
        setOpcionesFinanciamiento([]);
        await loadData();
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error creando factura manual:', err);
      const msg = err?.response?.data?.message || err?.message || 'Error desconocido';
      setError(`No se pudo crear la factura: ${msg}`);
      setLoading(false);
    }
  };

  const handleConfirmEquiposAsignacion = async (asignaciones: { [detalleId: number]: number[] }) => {
    if (!notaParaAsignacion) return;

    setLoading(true);
    setError(null);
    setAsignarEquiposDialogOpen(false);

    try {
      const factura = await documentoApi.convertToFactura({
        notaPedidoId: notaParaAsignacion.id,
        equiposAsignaciones: asignaciones,
      });

      setNotaParaAsignacion(null);
      setCreatedFactura(factura);
      setSuccessDialogOpen(true);

      if (isManualInvoice) {
        // Clear manual invoice form
        clearForm();
        setSelectedOpcionId(null);
        setOpcionesFinanciamiento([]);
        setIsManualInvoice(false);
      } else {
        // Remove nota from list (facturacion desde nota)
        setNotasPedido((prev) => prev.filter((n) => n.id !== notaParaAsignacion.id));
        handleCloseConvertDialog();
      }

      await loadData();
    } catch (err: any) {
      console.error('Error converting to factura with equipos:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Error desconocido';
      setError(`Error al convertir a factura: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAsignarEquiposDialog = () => {
    setAsignarEquiposDialogOpen(false);
    setNotaParaAsignacion(null);
    setIsManualInvoice(false);
  };

  const handleOpenConvertDialog = async (nota: DocumentoComercial) => {
    setSelectedNotaPedido(nota);
    setNotaCart(
      nota.detalles
        ? (nota.detalles as DetalleDocumento[]).map((d) => ({
            // Common fields
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            descuento: d.descuento || 0,
            // Type indicator
            tipoItem: d.tipoItem || 'PRODUCTO',
            // PRODUCTO fields
            productoId: d.productoId,
            productoNombre: d.productoNombre,
            // EQUIPO fields
            recetaId: d.recetaId,
            recetaNombre: d.recetaNombre,
            recetaModelo: d.recetaModelo,
            recetaTipo: d.recetaTipo,
            descripcionEquipo: d.descripcionEquipo,
          }))
        : []
    );
    setEditingNotaItems(false);
    setConvertDialogOpen(true);

    // Load financing options for the nota
    try {
      setLoadingOpciones(true);
      const opciones = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(nota.id);
      setOpcionesFinanciamiento(opciones);
      const selected = opciones.find(o => o.esSeleccionada);
      if (selected?.id) {
        setSelectedOpcionId(selected.id);
      }
    } catch (err) {
      console.error('Error loading financing options:', err);
    } finally {
      setLoadingOpciones(false);
    }
  };

  const handleCloseConvertDialog = () => {
    setConvertDialogOpen(false);
    setSelectedNotaPedido(null);
    setNotaCart([]);
    setEditingNotaItems(false);
    setSelectedOpcionId(null);
    setOpcionesFinanciamiento([]);
  };

  const handleConvertNotaToFactura = async () => {
    if (!selectedNotaPedido) return;

    setLoading(true);
    setError(null);

    try {
      const notaId = selectedNotaPedido.id;
      
      // Apply selected financing option if different from current
      if (selectedOpcionId) {
        const currentSelected = opcionesFinanciamiento.find(o => o.esSeleccionada);
        if (currentSelected?.id !== selectedOpcionId) {
          await documentoApi.selectFinanciamiento(notaId, selectedOpcionId);
        }
      }

      // Check if there are EQUIPO items in the nota
      const detallesEquipo = selectedNotaPedido.detalles?.filter(d => d.tipoItem === 'EQUIPO') || [];

      if (detallesEquipo.length > 0) {
        // Open AsignarEquiposDialog for equipment assignment
        setNotaParaAsignacion(selectedNotaPedido);
        setIsManualInvoice(false);
        setAsignarEquiposDialogOpen(true);
        setLoading(false);
      } else {
        // No equipos, proceed directly with factura creation
        const factura = await documentoApi.convertToFactura({ notaPedidoId: notaId });
        setNotasPedido((prev) => prev.filter((n) => n.id !== notaId));
        handleCloseConvertDialog();
        setCreatedFactura(factura);
        setSuccessDialogOpen(true);
        loadData();
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error converting to factura:', err);
      console.error('Error response data:', err?.response?.data);
      console.error('Error response status:', err?.response?.status);
      console.error('Error response headers:', err?.response?.headers);
      const errorMessage = err?.response?.data?.message || err?.message || 'Error desconocido';
      setError(`Error al convertir a factura: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handleOpenEstadoDialog = (documento: DocumentoComercial) => {
    setSelectedDocumento(documento);
    setNewEstado(documento.estado);
    setEstadoDialogOpen(true);
  };

  const handleUpdateEstado = async () => {
    if (!selectedDocumento || !newEstado) return;

    setLoading(true);
    setError(null);

    try {
      await documentoApi.changeEstado(selectedDocumento.id, newEstado);
      setSuccess(`Estado actualizado exitosamente.`);
      setEstadoDialogOpen(false);
      setNotasPedido((prev) => {
        const isInvoiceable = newEstado === 'APROBADO' || newEstado === 'PENDIENTE';
        if (!isInvoiceable) return prev.filter((n) => n.id !== selectedDocumento.id);
        return prev.map((n) => (n.id === selectedDocumento.id ? { ...n, estado: newEstado } : n));
      });
      loadData();
    } catch (err: any) {
      console.error('Error updating estado:', err);
      setError(`Error al actualizar el estado: ${err?.message || 'Error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateNotaCartItem = (index: number, field: 'cantidad'|'precioUnitario'|'descuento', value: any) => {
    const newCart = [...notaCart];
    const item = { ...newCart[index] };

    if (field === 'cantidad') {
      item.cantidad = Math.max(1, Number(value) || 1);
    } else if (field === 'precioUnitario') {
      item.precioUnitario = Math.max(0, Number(value) || 0);
    } else if (field === 'descuento') {
      item.descuento = Math.min(100, Math.max(0, Number(value) || 0));
    }

    newCart[index] = item;
    setNotaCart(newCart);
  };

  const handleOpenFinanciamiento = async () => {
    setFinanciamientoDialogOpen(true);
    setShowNewOpcionForm(false);
    setNewOpcionForm({
      nombre: '',
      metodoPago: 'EFECTIVO',
      cantidadCuotas: 1,
      tasaInteres: 0,
      descripcion: '',
    });

    // Convert templates to financing options with calculated amounts
    const opcionesCalculadas: OpcionFinanciamientoDTO[] = plantillasFinanciamiento.map((template) => {
      const tasaDecimal = template.tasaInteres / 100;
      const montoTotal = totalVenta * (1 + tasaDecimal);
      const montoCuota = montoTotal / template.cantidadCuotas;
      
      return {
        nombre: template.nombre,
        metodoPago: template.metodoPago,
        cantidadCuotas: template.cantidadCuotas,
        tasaInteres: template.tasaInteres,
        montoTotal: montoTotal,
        montoCuota: montoCuota,
        descripcion: template.descripcion,
        ordenPresentacion: template.ordenPresentacion,
      };
    });
    
    setOpcionesFinanciamiento(opcionesCalculadas);
  };

  const handleAddNewOpcion = () => {
    const { nombre, metodoPago, cantidadCuotas, tasaInteres, descripcion } = newOpcionForm;
    
    if (!nombre.trim()) {
      setError('Debe ingresar un nombre para la opción');
      return;
    }

    const montoConInteres = totalVenta * (1 + tasaInteres / 100);
    const newOpcion: OpcionFinanciamientoDTO = {
      nombre,
      metodoPago,
      cantidadCuotas,
      tasaInteres,
      montoTotal: montoConInteres,
      montoCuota: montoConInteres / cantidadCuotas,
      descripcion,
      ordenPresentacion: opcionesFinanciamiento.length + 1,
    };

    setOpcionesFinanciamiento([...opcionesFinanciamiento, newOpcion]);
    setShowNewOpcionForm(false);
    setNewOpcionForm({
      nombre: '',
      metodoPago: 'EFECTIVO',
      cantidadCuotas: 1,
      tasaInteres: 0,
      descripcion: '',
    });
  };

  const ProductsTable = ({ items, onUpdate, onRemove, editable = true }: {
    items: CartItem[] | NotaCartItem[];
    onUpdate: (index: number, field: any, value: any) => void;
    onRemove: (index: number) => void;
    editable?: boolean;
  }) => (
    <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
      <Table stickyHeader size="small" sx={{ minWidth: { xs: 700, md: 900 }, width: '100%' }}>
        <TableHead>
          <TableRow>
            {editable && <TableCell sx={{ minWidth: { xs: 100, md: 120 } }}>Tipo</TableCell>}
            <TableCell sx={{ minWidth: { xs: 180, md: 220 } }}>Producto/Equipo</TableCell>
            <TableCell sx={{ minWidth: { xs: 90, md: 100 } }}>Color</TableCell>
            <TableCell sx={{ minWidth: { xs: 90, md: 100 } }}>Medida</TableCell>
            <TableCell align="center" sx={{ minWidth: { xs: 90, md: 120 } }}>Cantidad</TableCell>
            <TableCell align="right" sx={{ minWidth: { xs: 120, md: 160 } }}>Precio Unit.</TableCell>
            <TableCell align="right" sx={{ minWidth: { xs: 90, md: 120 } }}>Desc. %</TableCell>
            <TableCell align="right" sx={{ minWidth: { xs: 120, md: 160 } }}>Subtotal</TableCell>
            {editable && <TableCell align="center" sx={{ minWidth: { xs: 90, md: 120 } }}>Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => {
            const subtotal = item.cantidad * item.precioUnitario * (1 - item.descuento / 100);
            const itemAny = item as any; // Type assertion for optional fields
            return (
              <TableRow key={index} hover>
                {editable && (
                  <TableCell>
                    <Select
                      fullWidth
                      size="small"
                      value={itemAny.tipoItem || 'PRODUCTO'}
                      onChange={(e) => onUpdate(index, 'tipoItem', e.target.value)}
                    >
                      <MenuItem value="PRODUCTO">Producto</MenuItem>
                      <MenuItem value="EQUIPO">Equipo</MenuItem>
                    </Select>
                  </TableCell>
                )}
                <TableCell>
                  {editable ? (
                    itemAny.tipoItem === 'EQUIPO' ? (
                      <Select
                        fullWidth
                        size="small"
                        value={itemAny.recetaId || ''}
                        onChange={(e) => onUpdate(index, 'recetaId', e.target.value)}
                      >
                        {recetas.map((r) => (
                          <MenuItem key={r.id} value={r.id}>
                            {r.nombre} - {r.modelo} ({r.tipoEquipo})
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <Select
                        fullWidth
                        size="small"
                        value={itemAny.productoId || ''}
                        onChange={(e) => onUpdate(index, 'productoId', e.target.value)}
                      >
                        {products.filter(p => p && p.id).map((p) => (
                          <MenuItem key={p.id} value={p.id}>{p.nombre || 'Producto sin nombre'}</MenuItem>
                        ))}
                      </Select>
                    )
                  ) : (
                    <Typography noWrap maxWidth={360}>
                      {itemAny.tipoItem === 'EQUIPO'
                        ? `${itemAny.recetaNombre || ''} ${itemAny.recetaModelo ? `- ${itemAny.recetaModelo}` : ''}`
                        : item.productoNombre}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography>{itemAny.color || '-'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography>{itemAny.medida || '-'}</Typography>
                </TableCell>
                <TableCell align="center">
                  {editable ? (
                    <TextField
                      type="number"
                      size="small"
                      value={item.cantidad}
                      onChange={(e) => onUpdate(index, 'cantidad', e.target.value)}
                      inputProps={{ min: 1 }}
                      sx={{ width: 90 }}
                    />
                  ) : (
                    <Typography align="center">{item.cantidad}</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {editable ? (
                    <TextField
                      type="number"
                      size="small"
                      value={item.precioUnitario}
                      onChange={(e) => onUpdate(index, 'precioUnitario', e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ width: 140 }}
                    />
                  ) : (
                    <Typography align="right">${item.precioUnitario.toFixed(2)}</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {editable ? (
                    <TextField
                      type="number"
                      size="small"
                      value={item.descuento}
                      onChange={(e) => onUpdate(index, 'descuento', e.target.value)}
                      inputProps={{ min: 0, max: 100 }}
                      sx={{ width: 100 }}
                    />
                  ) : (
                    <Typography align="right">{item.descuento}%</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    ${subtotal.toFixed(2)}
                  </Typography>
                </TableCell>
                {editable && (
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => onRemove(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading && !products.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography ml={2}>Cargando datos iniciales...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', maxWidth: '100%', mx: 0 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          <ReceiptIcon />
          Sistema de Facturación
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
          disabled={loading}
        >
          Recargar Datos
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Facturación Manual" icon={<ShoppingCartIcon />} iconPosition="start" />
        <Tab label="Desde Nota de Pedido" icon={<DescriptionIcon />} iconPosition="start" />
      </Tabs>

      {/* Tab 0: Manual Invoice */}
      {activeTab === 0 && (
        <Box sx={{ width: '100%', maxWidth: '100%' }}>
          <Card sx={{ width: '100%' }}>
            <CardContent sx={{ width: '100%', boxSizing: 'border-box' }}>
              <Typography variant="h6" gutterBottom>
                Nueva Factura Manual
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3} sx={{ width: '100%' }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Cliente</InputLabel>
                    <Select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value as number)}
                      label="Cliente"
                    >
                      <MenuItem value="">Seleccionar Cliente</MenuItem>
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.nombre} - {client.cuit}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Vendedor</InputLabel>
                    <Select
                      value={selectedUsuarioId}
                      onChange={(e) => setSelectedUsuarioId(e.target.value as number)}
                      label="Vendedor"
                    >
                      <MenuItem value="">Seleccionar Vendedor</MenuItem>
                      {usuarios.map((usuario) => (
                        <MenuItem key={usuario.id} value={usuario.id}>
                          {usuario.nombre ? `${usuario.nombre} ${usuario.apellido || ''}`.trim() : usuario.username || usuario.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as MetodoPago)}
                      label="Método de Pago"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de IVA</InputLabel>
                    <Select
                      value={selectedIva}
                      onChange={(e) => setSelectedIva(e.target.value as TipoIva)}
                      label="Tipo de IVA"
                    >
                      {IVA_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Fecha de Vencimiento"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Observaciones"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales para la factura..."
                  />
                </Grid>
              </Grid>

              <Box mt={3} sx={{ width: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Items</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={addItemToCart}
                    disabled={products.length === 0}
                  >
                    Agregar Item
                  </Button>
                </Box>

                {cart.length > 0 ? (
                  <ProductsTable
                    items={cart}
                    onUpdate={updateCartItem}
                    onRemove={removeItemFromCart}
                  />
                ) : (
                  <Paper sx={{ p: 3, textAlign: 'center', width: '100%' }}>
                    <Typography color="text.secondary">
                      No hay productos en el carrito
                    </Typography>
                  </Paper>
                )}
              </Box>

              {cart.length > 0 && (
                <Box mt={3} sx={{ width: '100%' }}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', width: '100%' }}>
                    <Grid container spacing={2} sx={{ width: '100%' }}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Subtotal:
                        </Typography>
                        <Typography variant="h6">${subtotalVenta.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          IVA ({IVA_OPTIONS.find(o => o.value === selectedIva)?.label}):
                        </Typography>
                        <Typography variant="h6">${ivaAmount.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          Total:
                        </Typography>
                        <Typography variant="h5" color="primary">
                          ${totalVenta.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              )}

              <Box mt={3} display="flex" justifyContent="flex-end" gap={2} sx={{ width: '100%' }}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearForm}
                >
                  Limpiar
                </Button>
                {cart.length > 0 && (
                  <Button
                    variant="outlined"
                    onClick={handleOpenFinanciamiento}
                  >
                    Opciones de Financiamiento
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmitManualInvoice}
                  disabled={loading || !selectedClientId || !selectedUsuarioId || cart.length === 0}
                >
                  Crear Factura
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 1: From Nota de Pedido */}
      {activeTab === 1 && (
        <Box sx={{ width: '100%', maxWidth: '100%' }}>
          {sortedNotasPedido.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay Notas de Pedido disponibles
              </Typography>
              <Typography color="text.secondary">
                Las notas de pedido deben estar en estado APROBADO o PENDIENTE para poder facturarse.
              </Typography>
            </Paper>
          ) : (
            <>
              <Grid container spacing={3} sx={{ mb: 2 }}>
                {paginatedNotasPedido.map((nota) => (
                  <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={nota.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Typography variant="h6">
                            Nota #{nota.numeroDocumento}
                          </Typography>
                          <Chip
                            label={ESTADO_OPTIONS[nota.estado]?.label || nota.estado}
                            color={ESTADO_OPTIONS[nota.estado]?.color || 'default'}
                            size="small"
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Cliente: {nota.clienteNombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Fecha: {dayjs(nota.fecha).format('DD/MM/YYYY')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Items: {nota.detalles?.length || 0}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="h6" color="primary">
                          Total: ${nota.total?.toFixed(2) || '0.00'}
                        </Typography>

                        {notaOpcionesFinanciamiento[nota.id] && notaOpcionesFinanciamiento[nota.id].length > 0 && (
                          <Box mt={1}>
                            <Chip
                              icon={<CreditCardIcon />}
                              label={`${notaOpcionesFinanciamiento[nota.id].length} opciones de financiamiento`}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          </Box>
                        )}

                        <Box mt={2} display="flex" gap={1}>
                          <Button
                            size="small"
                            variant="contained"
                            fullWidth
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleOpenConvertDialog(nota)}
                          >
                            Facturar
                          </Button>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEstadoDialog(nota)}
                            title="Cambiar estado"
                          >
                            <EditIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box display="flex" justifyContent="center" mt={2}>
                <Paper>
                  <TablePagination
                    component="div"
                    count={sortedNotasPedido.length}
                    page={pageNotas}
                    onPageChange={handleChangePageNotas}
                    rowsPerPage={rowsPerPageNotas}
                    onRowsPerPageChange={handleChangeRowsPerPageNotas}
                    rowsPerPageOptions={[6, 12, 24, 48]}
                    labelRowsPerPage="Notas por página:"
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                    }
                  />
                </Paper>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Convert Dialog */}
      <Dialog
        open={convertDialogOpen}
        onClose={handleCloseConvertDialog}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: { xs: '100%', sm: '90vh' },
            m: { xs: 0, sm: 2 }
          }
        }}
      >
        <DialogTitle>
          Convertir Nota de Pedido a Factura
        </DialogTitle>
        <DialogContent>
          {selectedNotaPedido && (
            <>
              <Box mb={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Cliente:
                    </Typography>
                    <Typography>{selectedNotaPedido.clienteNombre}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Número de Documento:
                    </Typography>
                    <Typography>#{selectedNotaPedido.numeroDocumento}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Financing Options */}
              {loadingOpciones ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : opcionesFinanciamiento.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    Opciones de Financiamiento
                  </Typography>
                  <RadioGroup
                    value={selectedOpcionId || ''}
                    onChange={(e) => setSelectedOpcionId(Number(e.target.value))}
                  >
                    <Grid container spacing={2}>
                      {opcionesFinanciamiento.map((opcion, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              p: 1,
                              border: selectedOpcionId === index ? '2px solid' : '1px solid',
                              borderColor: selectedOpcionId === index ? 'primary.main' : 'divider',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedOpcionId(index)}
                          >
                            <FormControlLabel
                              value={index}
                              control={<Radio />}
                              label={
                                <Box>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {getMetodoPagoIcon(opcion.metodoPago)}
                                    <Typography variant="body2" fontWeight="bold">
                                      {opcion.nombre}
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {opcion.cantidadCuotas} cuota(s) - {opcion.tasaInteres}% interés
                                  </Typography>
                                  <Typography variant="body2" color="primary">
                                    Total: ${opcion.montoTotal?.toFixed(2)}
                                  </Typography>
                                  {opcion.cantidadCuotas > 1 && (
                                    <Typography variant="caption" color="text.secondary">
                                      ${opcion.montoCuota?.toFixed(2)}/cuota
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </RadioGroup>
                </Box>
              )}

              {/* Display selected financing option */}
              {selectedOpcionId && opcionesFinanciamiento.length > 0 && (
                <Box mb={2}>
                  <Alert severity="info" icon={<CreditCardIcon />}>
                    <Typography variant="body2">
                      <strong>Opción de Financiamiento Seleccionada:</strong> {opcionesFinanciamiento[selectedOpcionId]?.nombre}
                      {opcionesFinanciamiento[selectedOpcionId]?.tasaInteres !== 0 && (
                        <> ({opcionesFinanciamiento[selectedOpcionId]?.tasaInteres}% {(opcionesFinanciamiento[selectedOpcionId]?.tasaInteres || 0) > 0 ? 'recargo' : 'descuento'})</>
                      )}
                    </Typography>
                  </Alert>
                </Box>
              )}

              <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">
                  Items de la Nota
                </Typography>
                {!editingNotaItems && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditingNotaItems(true)}
                  >
                    Editar Items
                  </Button>
                )}
              </Box>

              <ProductsTable
                items={notaCart}
                onUpdate={updateNotaCartItem}
                onRemove={() => {}}
                editable={editingNotaItems}
              />

              <Box mt={3}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Subtotal:
                        </Typography>
                        <Typography variant="h6">${notaSubtotal.toFixed(2)}</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="subtitle2" color="text.secondary">
                          IVA:
                        </Typography>
                        <Typography variant="h6">${notaIvaAmount.toFixed(2)}</Typography>
                      </Box>
                    </Box>
                    {notaFinancingAdjustment !== 0 && (
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" color="text.secondary">
                          {notaFinancingAdjustment > 0 ? 'Recargo' : 'Descuento'} Financiamiento:
                        </Typography>
                        <Typography variant="h6" color={notaFinancingAdjustment > 0 ? 'error' : 'success'}>
                          {notaFinancingAdjustment > 0 ? '+' : ''}${notaFinancingAdjustment.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    <Divider />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" color="text.secondary">
                        Total:
                      </Typography>
                      <Typography variant="h5" color="primary">
                        ${notaTotalVenta.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConvertDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleConvertNotaToFactura}
            disabled={loading}
            startIcon={<CheckCircleIcon />}
          >
            Convertir a Factura
          </Button>
        </DialogActions>
      </Dialog>

      {/* Estado Dialog */}
      <Dialog open={estadoDialogOpen} onClose={() => setEstadoDialogOpen(false)}>
        <DialogTitle>Cambiar Estado del Documento</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Nuevo Estado</InputLabel>
            <Select
              value={newEstado}
              onChange={(e) => setNewEstado(e.target.value as DocumentoComercial['estado'])}
              label="Nuevo Estado"
            >
              {Object.entries(ESTADO_OPTIONS).map(([value, config]) => (
                <MenuItem key={value} value={value}>
                  <Chip
                    label={config.label}
                    color={config.color}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {config.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEstadoDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleUpdateEstado}
            disabled={loading}
          >
            Actualizar Estado
          </Button>
        </DialogActions>
      </Dialog>

      {/* Financiamiento Dialog */}
      <Dialog open={financiamientoDialogOpen} onClose={() => setFinanciamientoDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Opciones de Financiamiento
        </DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              Total de la venta: <strong>${totalVenta.toFixed(2)}</strong>
            </Typography>
          </Box>

          {!showNewOpcionForm && (
            <Box mb={2}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setShowNewOpcionForm(true)}
                size="small"
              >
                Agregar Nueva Opción
              </Button>
            </Box>
          )}

          {showNewOpcionForm && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Nueva Opción de Financiamiento
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nombre"
                    value={newOpcionForm.nombre}
                    onChange={(e) => setNewOpcionForm({ ...newOpcionForm, nombre: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      value={newOpcionForm.metodoPago}
                      onChange={(e) => setNewOpcionForm({ ...newOpcionForm, metodoPago: e.target.value as MetodoPago })}
                      label="Método de Pago"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Cantidad de Cuotas"
                    value={newOpcionForm.cantidadCuotas}
                    onChange={(e) => setNewOpcionForm({ ...newOpcionForm, cantidadCuotas: Number(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Tasa de Interés (%)"
                    value={newOpcionForm.tasaInteres}
                    onChange={(e) => setNewOpcionForm({ ...newOpcionForm, tasaInteres: Number(e.target.value) })}
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total con interés:
                  </Typography>
                  <Typography variant="h6">
                    ${(totalVenta * (1 + newOpcionForm.tasaInteres / 100)).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Descripción"
                    value={newOpcionForm.descripcion}
                    onChange={(e) => setNewOpcionForm({ ...newOpcionForm, descripcion: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      onClick={() => setShowNewOpcionForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleAddNewOpcion}
                    >
                      Agregar
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          <RadioGroup
            value={selectedOpcionId || ''}
            onChange={(e) => setSelectedOpcionId(Number(e.target.value))}
          >
            <Grid container spacing={2}>
              {opcionesFinanciamiento.map((opcion, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: selectedOpcionId === opcion.id ? '2px solid' : '1px solid',
                      borderColor: selectedOpcionId === opcion.id ? 'primary.main' : 'divider',
                    }}
                    onClick={() => setSelectedOpcionId(opcion.id || index)}
                  >
                    <FormControlLabel
                      value={opcion.id || index}
                      control={<Radio />}
                      label={
                        <Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getMetodoPagoIcon(opcion.metodoPago)}
                            <Typography variant="subtitle1" fontWeight="bold">
                              {opcion.nombre}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {getMetodoPagoLabel(opcion.metodoPago)}
                          </Typography>
                          <Typography variant="body2">
                            {opcion.cantidadCuotas} cuota(s) - {opcion.tasaInteres}% interés
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="h6" color="primary">
                            Total: ${opcion.montoTotal.toFixed(2)}
                          </Typography>
                          {opcion.cantidadCuotas > 1 && (
                            <Typography variant="body2" color="text.secondary">
                              ${opcion.montoCuota.toFixed(2)} por cuota
                            </Typography>
                          )}
                          {opcion.descripcion && (
                            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                              {opcion.descripcion}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinanciamientoDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={() => setFinanciamientoDialogOpen(false)}
            variant="contained"
            disabled={selectedOpcionId === null}
          >
            Confirmar Selección
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <SuccessDialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          setCreatedFactura(null);
        }}
        title="¡Factura Creada Exitosamente!"
        message="La factura ha sido generada correctamente"
        details={createdFactura ? [
          { label: 'Número de Documento', value: createdFactura.numeroDocumento },
          { label: 'Cliente', value: createdFactura.clienteNombre || '-' },
          { label: 'Total', value: `$${createdFactura.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
        ] : []}
        actions={[
          {
            label: 'Nueva Factura',
            onClick: () => {
              clearForm();
              setActiveTab(0);
            },
            icon: <AddIcon />,
            variant: 'outlined',
          },
        ]}
      />

      {/* Asignar Equipos Dialog */}
      <AsignarEquiposDialog
        open={asignarEquiposDialogOpen}
        onClose={handleCloseAsignarEquiposDialog}
        onConfirm={handleConfirmEquiposAsignacion}
        detallesEquipo={notaParaAsignacion?.detalles?.filter(d => d.tipoItem === 'EQUIPO') || []}
      />
    </Box>
  );
};

export default FacturacionPage;
