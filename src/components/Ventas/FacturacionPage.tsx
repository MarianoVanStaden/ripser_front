import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  FormControlLabel,
  RadioGroup,
  Radio,
  InputAdornment,
  Checkbox,
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
  Search as SearchIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
// Real API services
import { clienteApi, productApi, usuarioApi } from '../../api/services';
import { documentoApi } from '../../api/services/documentoApi';
import opcionFinanciamientoApi from '../../api/services/opcionFinanciamientoApi';
import opcionFinanciamientoTemplateApi, { type OpcionFinanciamientoTemplateDTO } from '../../api/services/opcionFinanciamientoTemplateApi';
import { recetaFabricacionApi } from '../../api/services/recetaFabricacionApi';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import { cuentaCorrienteApi } from '../../api/services/cuentaCorrienteApi';
import SuccessDialog from "../common/SuccessDialog";
import LoadingOverlay from "../common/LoadingOverlay";
import AsignarEquiposDialog from "./AsignarEquiposDialog";
import AuditoriaFlujo from "../common/AuditoriaFlujo";
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
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
  ColorEquipo,
  MedidaEquipo,
  DeudaClienteError,
} from '../../types';
import DeudaClienteConfirmDialog from './DeudaClienteConfirmDialog';
import { COLORES_EQUIPO, MEDIDAS_EQUIPO } from '../../types';

// Types
const PAYMENT_METHODS: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
  { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' },
  { value: 'FINANCIACION_PROPIA', label: 'Financiación Propia' },
];

const isFinanciamiento = (m: string) => m === 'FINANCIAMIENTO' || m === 'FINANCIACION_PROPIA';

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
  FACTURADA: { label: 'Facturada', color: 'info' },
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
  color?: ColorEquipo;
  medida?: MedidaEquipo;
  // Stock validation fields
  stockDisponible?: number;
  stockVerificado?: boolean;
  requiereFabricacion?: boolean;
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
  color?: ColorEquipo;
  medida?: MedidaEquipo;
  // Stock validation fields
  stockDisponible?: number;
  stockVerificado?: boolean;
};

// When FINANCIAMIENTO and no explicit entrega is configured,
// default to 40% down payment so the backend always gets the correct split.
function resolveEntregaFields(
  metodoPago: string,
  entregaActiva: boolean,
  usePorcentaje: boolean,
  porcentaje: number | null,
  montoFijo: number | null,
): { porcentajeEntregaInicial?: number; montoEntregaInicial?: number } {
  if (entregaActiva && usePorcentaje && porcentaje != null) return { porcentajeEntregaInicial: porcentaje };
  if (entregaActiva && !usePorcentaje && montoFijo != null) return { montoEntregaInicial: montoFijo };
  if (isFinanciamiento(metodoPago)) return { porcentajeEntregaInicial: 40 };
  return {};
}

// Extracted outside FacturacionPage so React keeps a stable component reference
// across re-renders, preventing input focus loss when editing cart fields.
const ProductsTable = React.memo(({ items, onUpdate, onRemove, editable = true, products, recetas }: {
  items: CartItem[] | NotaCartItem[];
  onUpdate: (index: number, field: any, value: any) => void;
  onRemove: (index: number) => void;
  editable?: boolean;
  products: Producto[];
  recetas: RecetaFabricacionDTO[];
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
          const itemAny = item as any;
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
                {editable && itemAny.tipoItem === 'EQUIPO' ? (
                  <Select
                    fullWidth
                    size="small"
                    value={itemAny.color || ''}
                    onChange={(e) => onUpdate(index, 'color', e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">Sin especificar</MenuItem>
                    {COLORES_EQUIPO.map((color) => (
                      <MenuItem key={color} value={color}>
                        {color.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <Typography>{itemAny.color ? itemAny.color.replace(/_/g, ' ') : '-'}</Typography>
                )}
              </TableCell>
              <TableCell>
                {editable && itemAny.tipoItem === 'EQUIPO' ? (
                  <Select
                    fullWidth
                    size="small"
                    value={itemAny.medida || ''}
                    onChange={(e) => onUpdate(index, 'medida', e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">Sin especificar</MenuItem>
                    {MEDIDAS_EQUIPO.map((medida) => (
                      <MenuItem key={medida} value={medida}>
                        {medida}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <Typography>{itemAny.medida || '-'}</Typography>
                )}
              </TableCell>
              <TableCell align="center">
                <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
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
                  {itemAny.tipoItem === 'EQUIPO' && itemAny.stockVerificado && (
                    <Tooltip
                      title={`Stock disponible: ${itemAny.stockDisponible || 0} unidades`}
                      arrow
                    >
                      <Chip
                        size="small"
                        label={itemAny.requiereFabricacion ? `Stock: ${itemAny.stockDisponible}` : '✓ Stock OK'}
                        color={itemAny.requiereFabricacion ? 'warning' : 'success'}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Tooltip>
                  )}
                </Box>
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
));

const FacturacionPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();
  const { empresaId } = useTenant();
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
  const [cantidadCuotas, setCantidadCuotas] = useState<number | null>(null);
  const [tipoFinanciacion, setTipoFinanciacion] = useState<string>('MENSUAL');
  const [primerVencimiento, setPrimerVencimiento] = useState<string>('');
  const [dueDate, setDueDate] = useState(dayjs().add(30, 'days').format('YYYY-MM-DD'));
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedIva, setSelectedIva] = useState<TipoIva>('EXENTO');
  
  // From Nota de Pedido
  const [selectedNotaPedido, setSelectedNotaPedido] = useState<DocumentoComercial | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [editingNotaItems, setEditingNotaItems] = useState(false);
  const [notaCart, setNotaCart] = useState<NotaCartItem[]>([]);
  const [notaCantidadCuotas, setNotaCantidadCuotas] = useState<number | null>(null);
  const [notaTipoFinanciacion, setNotaTipoFinanciacion] = useState<string>('MENSUAL');
  const [notaPrimerVencimiento, setNotaPrimerVencimiento] = useState<string>('');

  // Financiación propia (manual invoice)
  const [manualTasaInteres, setManualTasaInteres] = useState<number>(0);

  // Entrega inicial (manual invoice)
  const [entregarInicial, setEntregarInicial] = useState(false);
  const [usePorcentaje, setUsePorcentaje] = useState(true);
  const [porcentajeEntrega, setPorcentajeEntrega] = useState<number | null>(null);
  const [montoFijoEntrega, setMontoFijoEntrega] = useState<number | null>(null);

  // Entrega inicial (nota de pedido)
  const [notaEntregaInicial, setNotaEntregaInicial] = useState(false);
  const [notaUsePorcentaje, setNotaUsePorcentaje] = useState(true);
  const [notaPorcentajeEntrega, setNotaPorcentajeEntrega] = useState<number | null>(null);
  const [notaMontoFijoEntrega, setNotaMontoFijoEntrega] = useState<number | null>(null);

  // Entrega info captured for success dialog
  const [facturaEntregaInfo, setFacturaEntregaInfo] = useState<{
    montoEntrega: number;
    montoFinanciado: number;
    cantidadCuotas: number | null;
  } | null>(null);

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

  // Search filter for Notas de Pedido
  const [notasSearchTerm, setNotasSearchTerm] = useState('');

  // Fabrication confirmation dialog
  const [fabricacionDialogOpen, setFabricacionDialogOpen] = useState(false);
  const [itemPendienteFabricacion, setItemPendienteFabricacion] = useState<{
    recetaId: number;
    recetaNombre: string;
    cantidad: number;
    color?: ColorEquipo;
    medida?: MedidaEquipo;
    stockDisponible: number;
  } | null>(null);

  // Deuda cliente confirmation
  const [deudaError, setDeudaError] = useState<DeudaClienteError | null>(null);
  const pendingDeudaRef = useRef<(() => void) | null>(null);
  // Set to true when user confirms debt at nota step, so factura call can skip the second dialog
  const deudaYaConfirmadaRef = useRef(false);

  const parseDeudaError = (err: any): DeudaClienteError | null => {
    const data = err?.response?.data;
    if (!data) return null;
    if (data.requiereConfirmacion || data.cuotasPendientes != null) {
      return {
        error: data.error || 'Cliente con deuda pendiente',
        message: data.message || '',
        cuotasPendientes: data.cuotasPendientes ?? 0,
        montoCuotasPendientes: data.montoCuotasPendientes ?? null,
        deudaCuentaCorriente: data.deudaCuentaCorriente ?? null,
        requiereConfirmacion: true,
      };
    }
    if (typeof data.message === 'string' && data.message.toLowerCase().includes('deuda pendiente')) {
      return {
        error: 'Cliente con deuda pendiente',
        message: data.message,
        cuotasPendientes: 0,
        deudaCuentaCorriente: null,
        requiereConfirmacion: true,
      };
    }
    return null;
  };

  const handleDeudaConfirm = useCallback(() => {
    setDeudaError(null);
    const fn = pendingDeudaRef.current;
    pendingDeudaRef.current = null;
    fn?.();
  }, []);

  const handleDeudaCancel = useCallback(() => {
    setDeudaError(null);
    pendingDeudaRef.current = null;
    deudaYaConfirmadaRef.current = false;
    billingConfirmedRef.current = false;
    setBillingDialogOpen(false);
    setConvertDialogOpen(false);
    setAsignarEquiposDialogOpen(false);
    setNotaParaAsignacion(null);
    setSelectedNotaPedido(null);
    setNotaCart([]);
    setEditingNotaItems(false);
    setSelectedOpcionId(null);
    setOpcionesFinanciamiento([]);
    setIsManualInvoice(false);
  }, []);

  // Billing Dialog state (Datos de Financiación Propia) — mirrors NotasPedidoPage
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [billingMode, setBillingMode] = useState<'manual' | 'nota'>('manual');
  const [billingForm, setBillingForm] = useState({
    cantidadCuotas: 1,
    tipoFinanciacion: 'MENSUAL',
    primerVencimiento: '',
    entregarInicial: true,
    usePorcentaje: true,
    porcentajeEntregaInicial: 40,
    montoEntregaInicial: 0,
    tasaInteres: 0,
  });
  // True right after the user confirms the billing modal, so the submit handler can proceed.
  const billingConfirmedRef = useRef(false);

  // Preemptive debt check — runs before any API side-effects so the warning appears first.
  // Same logic as NotasPedidoPage.
  const checkClienteDeuda = useCallback(async (clienteId: number): Promise<DeudaClienteError | null> => {
    try {
      const [prestamos, ccPage] = await Promise.all([
        prestamoPersonalApi.getByCliente(clienteId),
        cuentaCorrienteApi.getByClienteId(clienteId),
      ]);
      const activoStates = ['ACTIVO', 'EN_MORA', 'EN_LEGAL'];
      const prestamosActivos = prestamos.filter((p: any) => activoStates.includes(p.estado));
      const cuotasPendientes = prestamosActivos.reduce((sum: number, p: any) => sum + (p.cuotasPendientes || 0), 0);
      const montoCuotasPendientes = prestamosActivos.reduce((sum: number, p: any) => sum + (p.saldoPendiente || 0), 0);
      const movements = ccPage.content;
      const lastMovement = [...movements].sort(
        (a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )[0];
      const saldo = (lastMovement as any)?.saldo ?? 0;
      const deudaCC = saldo < 0 ? saldo : null;
      if (cuotasPendientes > 0 || deudaCC !== null) {
        return {
          error: 'Cliente con deuda pendiente',
          message: '',
          cuotasPendientes,
          montoCuotasPendientes: cuotasPendientes > 0 ? montoCuotasPendientes : null,
          deudaCuentaCorriente: deudaCC,
          requiereConfirmacion: true,
        };
      }
      return null;
    } catch {
      // Non-fatal: proceed; backend will still catch debt on its end.
      return null;
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsData, usuariosResponse, productsData, recetasData, notasData, plantillasData] = await Promise.all([
        clienteApi.getAll({ page: 0, size: 500 }).then(res => res.content).catch(() => []),
        usuarioApi.getAll().catch((err: any) => {
          if (err?.response?.status === 403) return { content: [] };
          return { content: [] };
        }),
        productApi.getAll({ page: 0, size: 10000 }).catch(() => []),
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
      
      const productsList = Array.isArray(productsData) ? productsData : (productsData as any)?.content || [];
      setProducts((productsList as Producto[]).filter(p => p && p.id));
      
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
  }, [empresaId]); // Re-fetch when tenant changes

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
    if (!selectedOpcionId) return 0;
    const selectedOpcion = opcionesFinanciamiento[selectedOpcionId];
    if (!selectedOpcion || selectedOpcion.tasaInteres === 0) return 0;
    // Compute actual financed amount based on user's down payment choice (not a hardcoded 40/60 split)
    let entregaInicial = 0;
    if (notaEntregaInicial) {
      if (notaUsePorcentaje && notaPorcentajeEntrega != null) {
        entregaInicial = notaSubtotal * notaPorcentajeEntrega / 100;
      } else if (!notaUsePorcentaje && notaMontoFijoEntrega != null) {
        entregaInicial = notaMontoFijoEntrega;
      }
    }
    const financiado = notaSubtotal - entregaInicial;
    return financiado > 0 ? financiado * (selectedOpcion.tasaInteres / 100) : 0;
  }, [notaSubtotal, selectedOpcionId, opcionesFinanciamiento, notaEntregaInicial, notaUsePorcentaje, notaPorcentajeEntrega, notaMontoFijoEntrega]);

  const notaIvaAmount = useMemo(() => {
    const ivaRate = IVA_OPTIONS.find((option) => option.value === (selectedNotaPedido as any)?.tipoIva)?.rate || 0.21;
    const subtotalConFinanciamiento = notaSubtotal + notaFinancingAdjustment;
    return subtotalConFinanciamiento * ivaRate;
  }, [notaSubtotal, notaFinancingAdjustment, selectedNotaPedido]);

  const notaTotalVenta = useMemo(() => notaSubtotal + notaFinancingAdjustment + notaIvaAmount, [notaSubtotal, notaFinancingAdjustment, notaIvaAmount]);

  // Entrega inicial computed (manual)
  const montoEntregaCalculado = useMemo(() => {
    if (!entregarInicial) return 0;
    if (usePorcentaje) return totalVenta * (porcentajeEntrega || 0) / 100;
    return montoFijoEntrega || 0;
  }, [entregarInicial, usePorcentaje, totalVenta, porcentajeEntrega, montoFijoEntrega]);

  const montoFinanciado = useMemo(() => totalVenta - montoEntregaCalculado, [totalVenta, montoEntregaCalculado]);

  // Entrega inicial computed (nota de pedido) — based on product subtotal, not on notaTotalVenta,
  // so the down payment percentage applies to the product price (matching backend behaviour).
  const notaMontoEntregaCalculado = useMemo(() => {
    if (!notaEntregaInicial) return 0;
    if (notaUsePorcentaje) return notaSubtotal * (notaPorcentajeEntrega || 0) / 100;
    return notaMontoFijoEntrega || 0;
  }, [notaEntregaInicial, notaUsePorcentaje, notaSubtotal, notaPorcentajeEntrega, notaMontoFijoEntrega]);

  const notaMontoFinanciado = useMemo(() => notaTotalVenta - notaMontoEntregaCalculado, [notaTotalVenta, notaMontoEntregaCalculado]);

  // Sort and filter Notas de Pedido
  const sortedNotasPedido = useMemo(() => {
    let filtered = [...notasPedido];

    // Apply search filter
    if (notasSearchTerm.trim()) {
      const searchTerm = notasSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(nota => {
        const numero = (nota.numeroDocumento || '').toString().toLowerCase();
        const cliente = (nota.clienteNombre || '').toLowerCase();
        const lead = (nota.leadNombre || '').toLowerCase();
        const total = nota.total?.toString() || '';

        return numero.includes(searchTerm) ||
               cliente.includes(searchTerm) ||
               lead.includes(searchTerm) ||
               total.includes(searchTerm);
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.fecha || a.fechaEmision || 0).getTime();
      const dateB = new Date(b.fecha || b.fechaEmision || 0).getTime();
      return dateB - dateA;
    });
  }, [notasPedido, notasSearchTerm]);

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
      case 'TRANSFERENCIA':
      case 'FINANCIAMIENTO':
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
      case 'TRANSFERENCIA': return 'Transferencia bancaria';
      case 'FINANCIAMIENTO': return 'Financiación propia';
      case 'FINANCIACION_PROPIA': return 'Financiación Propia';
      case 'CHEQUE': return 'Cheque';
      default: return String(metodoPago);
    }
  };

  const clearForm = () => {
    setSelectedClientId('');
    setSelectedUsuarioId('');
    setPaymentMethod('EFECTIVO');
    setCantidadCuotas(null);
    setTipoFinanciacion('MENSUAL');
    setPrimerVencimiento('');
    setManualTasaInteres(0);
    setEntregarInicial(false);
    setUsePorcentaje(true);
    setPorcentajeEntrega(null);
    setMontoFijoEntrega(null);
    setDueDate(dayjs().add(30, 'days').format('YYYY-MM-DD'));
    setNotes('');
    setCart([]);
    setSelectedIva('EXENTO');
    setError(null);
    setSuccess(null);
    billingConfirmedRef.current = false;
    deudaYaConfirmadaRef.current = false;
  };

  const addItemToCart = () => {
    if (products.length === 0 && recetas.length === 0) {
      setError('No hay productos ni equipos disponibles para agregar.');
      return;
    }

    // Add EQUIPO by default if available, otherwise PRODUCTO
    if (recetas.length > 0) {
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
    } else if (products.length > 0) {
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
    }
  };

  // Función para verificar stock disponible de un equipo
  const verificarStockEquipo = useCallback(async (recetaId: number, color?: ColorEquipo, medida?: MedidaEquipo): Promise<number> => {
    try {
      const equiposDisponibles = await equipoFabricadoApi.findDisponiblesParaVentaByReceta(recetaId);
      
      // Filtrar por color y medida si están especificados
      const equiposFiltrados = equiposDisponibles.filter(equipo => {
        const matchColor = !color || equipo.color === color;
        const matchMedida = !medida || equipo.medida === medida;
        return matchColor && matchMedida;
      });

      return equiposFiltrados.length;
    } catch (error) {
      console.error('Error verificando stock:', error);
      return 0;
    }
  }, []);

  const updateCartItem = async (index: number, field: 'tipoItem'|'productoId'|'recetaId'|'cantidad'|'precioUnitario'|'descuento'|'color'|'medida', value: any) => {
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
        delete item.color;
        delete item.medida;
        delete item.stockDisponible;
        delete item.stockVerificado;
        delete item.requiereFabricacion;
      } else if (newTipoItem === 'EQUIPO' && recetas.length > 0) {
        const defaultReceta = recetas[0];
        item.recetaId = defaultReceta.id;
        item.recetaNombre = defaultReceta.nombre;
        item.recetaModelo = defaultReceta.modelo;
        item.recetaTipo = defaultReceta.tipoEquipo;
        item.precioUnitario = defaultReceta.precioVenta || 0;
        // Set default color and medida from receta
        item.color = defaultReceta.color as ColorEquipo;
        item.medida = defaultReceta.medida as MedidaEquipo;
        // Clear producto fields
        delete item.productoId;
        delete item.productoNombre;
        // Reset stock verification
        item.stockVerificado = false;
        delete item.stockDisponible;
        delete item.requiereFabricacion;
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
        // Set default color and medida from receta
        item.color = receta.color as ColorEquipo;
        item.medida = receta.medida as MedidaEquipo;
        if (!item.precioManualmenteModificado) {
          item.precioUnitario = receta.precioVenta || 0;
        }
        // Reset stock verification
        item.stockVerificado = false;
        delete item.stockDisponible;
        delete item.requiereFabricacion;
      }
    } else if (field === 'color' || field === 'medida') {
      // Update color or medida
      item[field] = value || undefined;
      // Reset stock verification when color/medida changes
      item.stockVerificado = false;
      delete item.stockDisponible;
      delete item.requiereFabricacion;
    } else if (field === 'cantidad') {
      item.cantidad = Math.max(1, Number(value) || 1);
      // Reset stock verification when cantidad changes
      if (item.tipoItem === 'EQUIPO') {
        item.stockVerificado = false;
        delete item.requiereFabricacion;
      }
    } else if (field === 'precioUnitario') {
      item.precioUnitario = Math.max(0, Number(value) || 0);
      item.precioManualmenteModificado = true;
    } else if (field === 'descuento') {
      item.descuento = Math.min(100, Math.max(0, Number(value) || 0));
    }

    newCart[index] = item;
    setCart(newCart);

    // Solo verificar stock de forma silenciosa (sin abrir dialog), para mostrar indicadores
    if (item.tipoItem === 'EQUIPO' && item.recetaId && (field === 'recetaId' || field === 'color' || field === 'medida' || field === 'cantidad')) {
      const stockDisponible = await verificarStockEquipo(item.recetaId, item.color, item.medida);
      newCart[index].stockDisponible = stockDisponible;
      newCart[index].stockVerificado = true;
      newCart[index].requiereFabricacion = stockDisponible < item.cantidad;
      
      setCart([...newCart]);
      
      // NO mostrar dialog aquí - solo actualizar indicadores visuales
    }
  };

  const removeItemFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Función para crear pedido de fabricación automáticamente
  const handleConfirmarFabricacion = useCallback(async () => {
    if (!itemPendienteFabricacion) return;

    setLoading(true);
    setFabricacionDialogOpen(false);

    try {
      // Crear los equipos en estado EN_PROCESO
      const equipoData: any = {
        recetaId: itemPendienteFabricacion.recetaId,
        cantidad: itemPendienteFabricacion.cantidad,
        color: itemPendienteFabricacion.color,
        medida: itemPendienteFabricacion.medida,
        estado: 'EN_PROCESO',
      };

      const receta = recetas.find(r => r.id === itemPendienteFabricacion.recetaId);
      if (receta) {
        equipoData.tipo = receta.tipoEquipo || 'HELADERA';
        equipoData.modelo = receta.modelo || '';
      }

      await equipoFabricadoApi.createBatch(equipoData);

      // Actualizar verificación de stock en el carrito
      const updatedCart = [...cart];
      const itemIndex = updatedCart.findIndex(
        item => item.recetaId === itemPendienteFabricacion.recetaId &&
                item.color === itemPendienteFabricacion.color &&
                item.medida === itemPendienteFabricacion.medida
      );
      
      if (itemIndex >= 0) {
        const newStock = (itemPendienteFabricacion.stockDisponible || 0) + itemPendienteFabricacion.cantidad;
        updatedCart[itemIndex].stockDisponible = newStock;
        updatedCart[itemIndex].requiereFabricacion = false;
        setCart(updatedCart);
      }

      setItemPendienteFabricacion(null);
      
      // Mostrar mensaje de éxito temporal
      setSuccess(
        `✅ Pedido de fabricación creado: ${itemPendienteFabricacion.cantidad} equipo(s) "${itemPendienteFabricacion.recetaNombre}" en producción.`
      );
      
      // Continuar con la creación de la factura automáticamente
      // Llamar a handleSubmitManualInvoice después de 1 segundo para que el usuario vea el mensaje
      setTimeout(() => {
        handleSubmitManualInvoice();
      }, 1000);
      
    } catch (err: any) {
      console.error('Error creando pedido de fabricación:', err);
      
      let errorMessage = 'Error desconocido al crear el pedido de fabricación';
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
        
        // Check if it's a stock insufficiency error (409 Conflict)
        if (err?.response?.status === 409) {
          errorMessage = 
            `⚠️ Stock Insuficiente de Componentes\n\n` +
            `No se pueden fabricar los equipos solicitados porque faltan componentes en el inventario.\n\n` +
            `💡 Debes:\n` +
            `1. Revisar el inventario de componentes necesarios\n` +
            `2. Realizar compras de los componentes faltantes\n` +
            `3. Luego crear el pedido de fabricación manualmente desde Producción → Equipos Fabricados\n\n` +
            `Detalles: ${err.response.data.message}`;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  }, [itemPendienteFabricacion, recetas, cart]);

  const handleCancelarFabricacion = useCallback(() => {
    setFabricacionDialogOpen(false);
    setItemPendienteFabricacion(null);
  }, []);

  const handleSubmitManualInvoice = async () => {
    if (!selectedClientId) return setError('Debe seleccionar un cliente.');
    if (!selectedUsuarioId) return setError('Debe seleccionar un usuario.');
    if (cart.length === 0) return setError('Debe agregar al menos un producto al carrito.');

    if (isFinanciamiento(paymentMethod)) {
      if (cantidadCuotas != null && cantidadCuotas < 1) return setError('Mínimo 1 cuota');
      if (entregarInicial) {
        if (usePorcentaje && (porcentajeEntrega ?? 0) > 100) return setError('El porcentaje no puede superar 100%');
        if (montoEntregaCalculado < 0) return setError('La entrega no puede ser negativa');
        if (montoEntregaCalculado >= totalVenta) return setError('La entrega no puede ser igual o mayor al total');
      }
    }

    // Gate 1 — Financiación Propia modal (same UX as NotasPedidoPage):
    // if the user picked financiamiento and hasn't confirmed the billing form yet,
    // open the modal so they set entrega inicial + diferencia financiada + tasa de interés.
    if (isFinanciamiento(paymentMethod) && !billingConfirmedRef.current) {
      setBillingMode('manual');
      setBillingForm({
        cantidadCuotas: cantidadCuotas ?? 1,
        tipoFinanciacion: tipoFinanciacion || 'MENSUAL',
        primerVencimiento: primerVencimiento || '',
        entregarInicial: true,
        usePorcentaje: usePorcentaje,
        porcentajeEntregaInicial: porcentajeEntrega ?? 40,
        montoEntregaInicial: montoFijoEntrega ?? 0,
        tasaInteres: manualTasaInteres || 0,
      });
      setBillingDialogOpen(true);
      return;
    }

    // Gate 2 — Preemptive debt check before generating the presupuesto.
    // Same pattern as NotasPedidoPage.handleConvertToNotaPedido.
    if (!deudaYaConfirmadaRef.current) {
      const deudaData = await checkClienteDeuda(Number(selectedClientId));
      if (deudaData) {
        setDeudaError(deudaData);
        pendingDeudaRef.current = () => {
          deudaYaConfirmadaRef.current = true;
          handleSubmitManualInvoice();
        };
        return;
      }
    }

    // Verificar stock de equipos antes de crear factura
    const equiposEnCarrito = cart.filter(item => item.tipoItem === 'EQUIPO' && item.recetaId);
    
    for (const item of equiposEnCarrito) {
      const stockDisponible = await verificarStockEquipo(item.recetaId!, item.color, item.medida);
      
      if (stockDisponible < item.cantidad) {
        // Mostrar dialog de confirmación
        setItemPendienteFabricacion({
          recetaId: item.recetaId!,
          recetaNombre: item.recetaNombre || 'Equipo',
          cantidad: item.cantidad - stockDisponible,
          color: item.color,
          medida: item.medida,
          stockDisponible,
        });
        setFabricacionDialogOpen(true);
        return; // Detener el proceso hasta que el usuario decida
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Financing data source: once the billing modal has been confirmed (Gate 1 passed),
    // read from billingForm rather than state. The setTimeout re-entry from submitBillingDialog
    // sees a stale closure where the setCantidadCuotas/etc writes have not yet been committed,
    // so state-backed reads return pre-modal defaults (cantidadCuotas=null → empty financing
    // payload → backend falls back to defaults). billingForm was already captured with the
    // user's latest inputs at click time, so it is safe to use directly.
    const fin = billingForm;
    const finPorcentajeEntrega = fin.usePorcentaje ? fin.porcentajeEntregaInicial : null;
    const finMontoFijoEntrega = !fin.usePorcentaje ? fin.montoEntregaInicial : null;
    const finMontoEntregaCalculado = fin.entregarInicial
      ? (fin.usePorcentaje ? subtotalVenta * (fin.porcentajeEntregaInicial / 100) : fin.montoEntregaInicial)
      : 0;
    const finMontoFinanciado = subtotalVenta - finMontoEntregaCalculado;

    // Use the user-entered tasaInteres (for FINANCIACION_PROPIA),
    // falling back to the selected financing template (for FINANCIAMIENTO with templates)
    const tasaInteresManual = fin.tasaInteres > 0
      ? fin.tasaInteres
      : (selectedOpcionId != null ? (plantillasFinanciamiento[selectedOpcionId]?.tasaInteres ?? 0) : 0);

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
            // Include color and medida for filtering in AsignarEquiposDialog
            if (item.color) {
              detalle.color = item.color;
            }
            if (item.medida) {
              detalle.medida = item.medida;
            }
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

      let nota: DocumentoComercial;
      try {
        nota = await documentoApi.convertToNotaPedido({
          presupuestoId: presupuesto.id,
          metodoPago: paymentMethod,
          tipoIva: selectedIva,
          ...(deudaYaConfirmadaRef.current && { confirmarConDeudaPendiente: true }),
        });
      } catch (notaErr: any) {
        const deudaNotaData = parseDeudaError(notaErr);
        if (deudaNotaData) {
          setDeudaError(deudaNotaData);
          const presupuestoId = presupuesto.id;
          const capturedPayment = paymentMethod;
          const capturedIva = selectedIva;
          const capturedCuotas = fin.cantidadCuotas;
          const capturedTipoFin = fin.tipoFinanciacion;
          const capturedVencimiento = fin.primerVencimiento;
          const capturedEntregaInicial1 = fin.entregarInicial;
          const capturedUsePorcentaje1 = fin.usePorcentaje;
          const capturedPorcentajeEntrega1 = finPorcentajeEntrega;
          const capturedMontoFijoEntrega1 = finMontoFijoEntrega;
          const capturedMontoEntrega1 = finMontoEntregaCalculado;
          const capturedMontoFinanciado1 = finMontoFinanciado;
          const capturedTasaInteres1 = tasaInteresManual;
          pendingDeudaRef.current = async () => {
            setLoading(true);
            try {
              const retryNota = await documentoApi.convertToNotaPedido({
                presupuestoId,
                metodoPago: capturedPayment,
                tipoIva: capturedIva,
                confirmarConDeudaPendiente: true,
              });
              const detallesEquipoRetry = retryNota.detalles?.filter(d => d.tipoItem === 'EQUIPO') || [];
              if (detallesEquipoRetry.length > 0) {
                deudaYaConfirmadaRef.current = true; // debt confirmed — skip second dialog at factura step
                setNotaParaAsignacion(retryNota);
                setIsManualInvoice(true);
                setAsignarEquiposDialogOpen(true);
              } else {
                const facturaRetry = await documentoApi.convertToFactura({
                  notaPedidoId: retryNota.id,
                  confirmarConDeudaPendiente: true,
                  ...(capturedCuotas != null && { cantidadCuotas: capturedCuotas }),
                  tipoFinanciacion: capturedTipoFin,
                  tasaInteres: capturedTasaInteres1,
                  ...(capturedVencimiento && { primerVencimiento: capturedVencimiento }),
                  ...resolveEntregaFields(capturedPayment, capturedEntregaInicial1, capturedUsePorcentaje1, capturedPorcentajeEntrega1, capturedMontoFijoEntrega1),
                });
                if (isFinanciamiento(capturedPayment) && capturedEntregaInicial1 && capturedMontoEntrega1 > 0) {
                  setFacturaEntregaInfo({ montoEntrega: capturedMontoEntrega1, montoFinanciado: capturedMontoFinanciado1, cantidadCuotas: capturedCuotas });
                } else {
                  setFacturaEntregaInfo(null);
                }
                setCreatedFactura(facturaRetry);
                setSuccessDialogOpen(true);
                clearForm();
                setSelectedOpcionId(null);
                setOpcionesFinanciamiento([]);
                await loadData();
              }
            } catch (retryErr: any) {
              setError(retryErr?.response?.data?.message || retryErr?.message || 'Error desconocido al crear la factura');
            } finally {
              setLoading(false);
            }
          };
          setLoading(false);
          return;
        }
        throw notaErr;
      }

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
        let factura: DocumentoComercial;
        try {
          factura = await documentoApi.convertToFactura({
            notaPedidoId: nota.id,
            ...(deudaYaConfirmadaRef.current && { confirmarConDeudaPendiente: true }),
            ...(isFinanciamiento(paymentMethod) && {
              cantidadCuotas: fin.cantidadCuotas,
              tipoFinanciacion: fin.tipoFinanciacion,
              tasaInteres: tasaInteresManual,
              ...(fin.primerVencimiento && { primerVencimiento: fin.primerVencimiento }),
              ...resolveEntregaFields(paymentMethod, fin.entregarInicial, fin.usePorcentaje, finPorcentajeEntrega, finMontoFijoEntrega),
            }),
          });
        } catch (facturaErr: any) {
          const deudaFacturaData = parseDeudaError(facturaErr);
          if (deudaFacturaData) {
            setDeudaError(deudaFacturaData);
            const notaId = nota.id;
            const capturedPayment = paymentMethod;
            const capturedCuotas = fin.cantidadCuotas;
            const capturedTipoFin = fin.tipoFinanciacion;
            const capturedVencimiento = fin.primerVencimiento;
            const capturedEntregaInicial2 = fin.entregarInicial;
            const capturedUsePorcentaje2 = fin.usePorcentaje;
            const capturedPorcentajeEntrega2 = finPorcentajeEntrega;
            const capturedMontoFijoEntrega2 = finMontoFijoEntrega;
            const capturedMontoEntrega2 = finMontoEntregaCalculado;
            const capturedMontoFinanciado2 = finMontoFinanciado;
            const capturedTasaInteres2 = tasaInteresManual;
            pendingDeudaRef.current = async () => {
              setLoading(true);
              try {
                const facturaRetry = await documentoApi.convertToFactura({
                  notaPedidoId: notaId,
                  confirmarConDeudaPendiente: true,
                  ...(capturedCuotas != null && { cantidadCuotas: capturedCuotas }),
                  tipoFinanciacion: capturedTipoFin,
                  tasaInteres: capturedTasaInteres2,
                  ...(capturedVencimiento && { primerVencimiento: capturedVencimiento }),
                  ...resolveEntregaFields(capturedPayment, capturedEntregaInicial2, capturedUsePorcentaje2, capturedPorcentajeEntrega2, capturedMontoFijoEntrega2),
                });
                if (isFinanciamiento(capturedPayment) && capturedEntregaInicial2 && capturedMontoEntrega2 > 0) {
                  setFacturaEntregaInfo({ montoEntrega: capturedMontoEntrega2, montoFinanciado: capturedMontoFinanciado2, cantidadCuotas: capturedCuotas });
                } else {
                  setFacturaEntregaInfo(null);
                }
                setCreatedFactura(facturaRetry);
                setSuccessDialogOpen(true);
                clearForm();
                setSelectedOpcionId(null);
                setOpcionesFinanciamiento([]);
                await loadData();
              } catch (retryErr: any) {
                setError(retryErr?.response?.data?.message || retryErr?.message || 'Error desconocido al crear la factura');
              } finally {
                setLoading(false);
              }
            };
            setLoading(false);
            return;
          }
          throw facturaErr;
        }

        if (isFinanciamiento(paymentMethod) && fin.entregarInicial && finMontoEntregaCalculado > 0) {
          setFacturaEntregaInfo({ montoEntrega: finMontoEntregaCalculado, montoFinanciado: finMontoFinanciado, cantidadCuotas: fin.cantidadCuotas });
        } else {
          setFacturaEntregaInfo(null);
        }
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
      let errorMessage = 'Error desconocido al crear la factura';

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;

        // Detectar error de lead conversion
        if (errorMessage.includes('lead')) {
          errorMessage = '⚠️ No se puede crear Factura: El presupuesto está asociado a un lead.\n\n' +
                        'Para continuar, primero debe convertir el lead a cliente.\n' +
                        'Puede hacerlo desde la página de Leads.';
        }
        // Detectar error de constraint de equipo único
        else if (errorMessage.includes('uk_equipo_unico') ||
            errorMessage.includes('constraint') ||
            errorMessage.includes('Duplicate entry') ||
            errorMessage.includes('ya está asignado') ||
            errorMessage.includes('already assigned')) {
          errorMessage = '⚠️ Error de Asignación Duplicada\n\n' +
                        'Uno o más equipos ya están asignados a esta u otra factura. ' +
                        'Cada equipo solo puede ser asignado una vez.\n\n' +
                        '💡 Soluciones:\n' +
                        '• Verifique que no haya seleccionado el mismo equipo múltiples veces\n' +
                        '• Revise si los equipos ya fueron facturados previamente\n' +
                        '• Seleccione equipos diferentes del inventario';
        }
      } else if (err?.response?.status === 500 && err?.response?.data) {
        // Intentar extraer información del error 500
        const responseData = JSON.stringify(err.response.data);
        if (responseData.includes('uk_equipo_unico') || responseData.includes('Duplicate')) {
          errorMessage = '⚠️ Error de Asignación Duplicada\n\n' +
                        'El sistema detectó que está intentando asignar equipos que ya están en uso.\n\n' +
                        '💡 Por favor:\n' +
                        '• Verifique los equipos seleccionados\n' +
                        '• Asegúrese de no repetir números de equipo\n' +
                        '• Consulte el inventario de equipos disponibles';
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleConfirmEquiposAsignacion = async (asignaciones: { [detalleId: number]: number[] }) => {
    if (!notaParaAsignacion) return;

    setLoading(true);
    setError(null);

    const cuotasParaEnviar = isManualInvoice ? cantidadCuotas : notaCantidadCuotas;
    // For the nota flow, prefer the billing modal's tasa when the user set one; otherwise
    // fall back to the selected financing option's tasa.
    const notaMetodoEsFinanciamiento = isFinanciamiento(selectedNotaPedido?.metodoPago ?? '');
    const tasaInteresParaEnviar = isManualInvoice
      ? (manualTasaInteres > 0 ? manualTasaInteres : (selectedOpcionId != null ? (plantillasFinanciamiento[selectedOpcionId]?.tasaInteres ?? 0) : 0))
      : (notaMetodoEsFinanciamiento && billingForm.tasaInteres > 0
          ? billingForm.tasaInteres
          : (opcionesFinanciamiento.find(o => o.id === selectedOpcionId)?.tasaInteres ?? 0));

    try {
      const deudaPreconfirmada = deudaYaConfirmadaRef.current;
      deudaYaConfirmadaRef.current = false; // reset before the call
      const factura = await documentoApi.convertToFactura({
        notaPedidoId: notaParaAsignacion.id,
        equiposAsignaciones: asignaciones,
        ...(deudaPreconfirmada && { confirmarConDeudaPendiente: true }),
        ...(cuotasParaEnviar != null && { cantidadCuotas: cuotasParaEnviar }),
        tipoFinanciacion: isManualInvoice ? tipoFinanciacion : notaTipoFinanciacion,
        tasaInteres: tasaInteresParaEnviar,
        ...((isManualInvoice ? primerVencimiento : notaPrimerVencimiento) && {
          primerVencimiento: isManualInvoice ? primerVencimiento : notaPrimerVencimiento,
        }),
        ...(isManualInvoice
          ? resolveEntregaFields(paymentMethod, entregarInicial, usePorcentaje, porcentajeEntrega, montoFijoEntrega)
          : resolveEntregaFields(selectedNotaPedido?.metodoPago ?? '', notaEntregaInicial, notaUsePorcentaje, notaPorcentajeEntrega, notaMontoFijoEntrega)),
      });

      const entregaActiva = isManualInvoice ? entregarInicial : notaEntregaInicial;
      const entregaMonto = isManualInvoice ? montoEntregaCalculado : notaMontoEntregaCalculado;
      const entregaFinanciado = isManualInvoice ? montoFinanciado : notaMontoFinanciado;
      if (entregaActiva && entregaMonto > 0) {
        setFacturaEntregaInfo({ montoEntrega: entregaMonto, montoFinanciado: entregaFinanciado, cantidadCuotas: cuotasParaEnviar });
      } else {
        setFacturaEntregaInfo(null);
      }
      setAsignarEquiposDialogOpen(false);
      setNotaParaAsignacion(null);
      setCreatedFactura(factura);
      setSuccessDialogOpen(true);

      if (isManualInvoice) {
        clearForm();
        setSelectedOpcionId(null);
        setOpcionesFinanciamiento([]);
        setIsManualInvoice(false);
        await loadData();
      } else {
        setNotasPedido((prev) => prev.filter((n) => n.id !== notaParaAsignacion.id));
        handleCloseConvertDialog();
      }
    } catch (err: any) {
      console.error('Error converting to factura with equipos:', err);

      // Deuda cliente: mostrar modal de confirmación
      const deudaEquiposData = parseDeudaError(err);
      if (deudaEquiposData) {
        setDeudaError(deudaEquiposData);
        const notaId = notaParaAsignacion.id;
        const capturedIsManual = isManualInvoice;
        const capturedMetodoPago3 = isManualInvoice ? paymentMethod : (selectedNotaPedido?.metodoPago ?? '');
        const capturedCuotas = isManualInvoice ? cantidadCuotas : notaCantidadCuotas;
        const capturedTipoFin = isManualInvoice ? tipoFinanciacion : notaTipoFinanciacion;
        const capturedVencimiento = isManualInvoice ? primerVencimiento : notaPrimerVencimiento;
        const capturedEntregaInicial3 = isManualInvoice ? entregarInicial : notaEntregaInicial;
        const capturedUsePorcentaje3 = isManualInvoice ? usePorcentaje : notaUsePorcentaje;
        const capturedPorcentajeEntrega3 = isManualInvoice ? porcentajeEntrega : notaPorcentajeEntrega;
        const capturedMontoFijoEntrega3 = isManualInvoice ? montoFijoEntrega : notaMontoFijoEntrega;
        const capturedMontoEntrega3 = isManualInvoice ? montoEntregaCalculado : notaMontoEntregaCalculado;
        const capturedMontoFinanciado3 = isManualInvoice ? montoFinanciado : notaMontoFinanciado;
        const capturedTasaInteres3 = tasaInteresParaEnviar;
        pendingDeudaRef.current = async () => {
          setLoading(true);
          try {
            const facturaRetry = await documentoApi.convertToFactura({
              notaPedidoId: notaId,
              equiposAsignaciones: asignaciones,
              confirmarConDeudaPendiente: true,
              ...(capturedCuotas != null && { cantidadCuotas: capturedCuotas }),
              tipoFinanciacion: capturedTipoFin,
              tasaInteres: capturedTasaInteres3,
              ...(capturedVencimiento && { primerVencimiento: capturedVencimiento }),
              ...resolveEntregaFields(capturedMetodoPago3, capturedEntregaInicial3, capturedUsePorcentaje3, capturedPorcentajeEntrega3, capturedMontoFijoEntrega3),
            });
            if (capturedEntregaInicial3 && capturedMontoEntrega3 > 0) {
              setFacturaEntregaInfo({ montoEntrega: capturedMontoEntrega3, montoFinanciado: capturedMontoFinanciado3, cantidadCuotas: capturedCuotas });
            } else {
              setFacturaEntregaInfo(null);
            }
            setAsignarEquiposDialogOpen(false);
            setNotaParaAsignacion(null);
            setCreatedFactura(facturaRetry);
            setSuccessDialogOpen(true);
            if (capturedIsManual) {
              clearForm();
              setSelectedOpcionId(null);
              setOpcionesFinanciamiento([]);
              setIsManualInvoice(false);
              await loadData();
            } else {
              setNotasPedido((prev) => prev.filter((n) => n.id !== notaId));
              handleCloseConvertDialog();
            }
          } catch (retryErr: any) {
            setError(retryErr?.response?.data?.message || retryErr?.message || 'Error desconocido al convertir a factura');
          } finally {
            setLoading(false);
          }
        };
        setLoading(false);
        return;
      }

      const data = err?.response?.data;
      const rawText = data ? JSON.stringify(data) : '';
      const backendMsg: string = data?.message || data?.error || data?.detail || '';

      let errorMessage: string;

      if (
        rawText.includes('uk_equipo_unico') ||
        rawText.includes('Duplicate') ||
        backendMsg.includes('constraint') ||
        backendMsg.includes('ya está asignado') ||
        backendMsg.includes('already assigned')
      ) {
        errorMessage =
          'Uno o más equipos ya están asignados a otra factura. ' +
          'Seleccione equipos diferentes e intente nuevamente.';
      } else if (backendMsg) {
        errorMessage = backendMsg;
      } else if (err?.response?.status === 500) {
        errorMessage =
          'Error interno del servidor al crear la factura. ' +
          'Intente con equipos diferentes o contacte al administrador.';
      } else {
        errorMessage = err?.message || 'Error desconocido al convertir a factura';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAsignarEquiposDialog = () => {
    setAsignarEquiposDialogOpen(false);
    setNotaParaAsignacion(null);
    setIsManualInvoice(false);
  };

  const handleCloseBillingDialog = () => {
    setBillingDialogOpen(false);
  };

  // Apply billing form to the relevant state slice (manual vs nota) and re-trigger the submit.
  // Using setTimeout(0) so the state updates commit before the submit handler reads them.
  const submitBillingDialog = () => {
    billingConfirmedRef.current = true;
    if (billingMode === 'manual') {
      setCantidadCuotas(billingForm.cantidadCuotas);
      setTipoFinanciacion(billingForm.tipoFinanciacion);
      setPrimerVencimiento(billingForm.primerVencimiento);
      setEntregarInicial(billingForm.entregarInicial);
      setUsePorcentaje(billingForm.usePorcentaje);
      setPorcentajeEntrega(billingForm.usePorcentaje ? billingForm.porcentajeEntregaInicial : null);
      setMontoFijoEntrega(!billingForm.usePorcentaje ? billingForm.montoEntregaInicial : null);
      setManualTasaInteres(billingForm.tasaInteres);
      setBillingDialogOpen(false);
      setTimeout(() => handleSubmitManualInvoice(), 0);
    } else {
      setNotaCantidadCuotas(billingForm.cantidadCuotas);
      setNotaTipoFinanciacion(billingForm.tipoFinanciacion);
      setNotaPrimerVencimiento(billingForm.primerVencimiento);
      setNotaEntregaInicial(billingForm.entregarInicial);
      setNotaUsePorcentaje(billingForm.usePorcentaje);
      setNotaPorcentajeEntrega(billingForm.usePorcentaje ? billingForm.porcentajeEntregaInicial : null);
      setNotaMontoFijoEntrega(!billingForm.usePorcentaje ? billingForm.montoEntregaInicial : null);
      setBillingDialogOpen(false);
      setTimeout(() => handleConvertNotaToFactura(), 0);
    }
  };

  // Base total used by the billing dialog's summary. In 'manual' mode use the cart subtotal
  // (entrega inicial should apply to the product total, not the post-IVA total). In 'nota'
  // mode use the selected nota's subtotal.
  const billingBaseTotal = billingMode === 'manual'
    ? subtotalVenta
    : (selectedNotaPedido?.subtotal ?? notaSubtotal);

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
            color: d.color as ColorEquipo,
            medida: d.medida as MedidaEquipo,
          }))
        : []
    );
    setEditingNotaItems(false);
    setConvertDialogOpen(true);
    deudaYaConfirmadaRef.current = false;

    // Preemptive debt check on open so the warning appears before the user fills anything
    if (nota.clienteId) {
      const deudaData = await checkClienteDeuda(nota.clienteId);
      if (deudaData) {
        setDeudaError(deudaData);
        pendingDeudaRef.current = () => {
          deudaYaConfirmadaRef.current = true;
        };
      }
    }

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
    setNotaCantidadCuotas(null);
    setNotaTipoFinanciacion('MENSUAL');
    setNotaPrimerVencimiento('');
    setNotaEntregaInicial(false);
    setNotaUsePorcentaje(true);
    setNotaPorcentajeEntrega(null);
    setNotaMontoFijoEntrega(null);
    billingConfirmedRef.current = false;
    deudaYaConfirmadaRef.current = false;
  };

  const handleConvertNotaToFactura = async () => {
    if (!selectedNotaPedido) return;

    if (isFinanciamiento(selectedNotaPedido.metodoPago)) {
      if (notaCantidadCuotas != null && notaCantidadCuotas < 1) return setError('Mínimo 1 cuota');
      if (notaEntregaInicial) {
        if (notaUsePorcentaje && (notaPorcentajeEntrega ?? 0) > 100) return setError('El porcentaje no puede superar 100%');
        if (notaMontoEntregaCalculado < 0) return setError('La entrega no puede ser negativa');
        if (notaMontoEntregaCalculado >= notaTotalVenta) return setError('La entrega no puede ser igual o mayor al total');
      }
    }

    // Gate 1 — Financiación Propia modal (same UX as NotasPedidoPage):
    // force the user to confirm entrega inicial + diferencia financiada + tasa before billing.
    if (isFinanciamiento(selectedNotaPedido.metodoPago) && !billingConfirmedRef.current) {
      const opcionSeleccionada = opcionesFinanciamiento.find(o => o.id === selectedOpcionId)
        ?? opcionesFinanciamiento.find(o => o.esSeleccionada);
      const cuotasPrefill = notaCantidadCuotas ?? opcionSeleccionada?.cantidadCuotas ?? 1;
      const tasaPrefill = notaCantidadCuotas != null
        ? 0
        : (opcionSeleccionada && opcionSeleccionada.tasaInteres > 0 ? opcionSeleccionada.tasaInteres : 0);
      setBillingMode('nota');
      setBillingForm({
        cantidadCuotas: cuotasPrefill,
        tipoFinanciacion: notaTipoFinanciacion || 'MENSUAL',
        primerVencimiento: notaPrimerVencimiento || '',
        entregarInicial: true,
        usePorcentaje: notaUsePorcentaje,
        porcentajeEntregaInicial: notaPorcentajeEntrega ?? 40,
        montoEntregaInicial: notaMontoFijoEntrega ?? 0,
        tasaInteres: tasaPrefill,
      });
      setBillingDialogOpen(true);
      return;
    }

    // Gate 2 — Preemptive debt check before invoicing.
    if (!deudaYaConfirmadaRef.current && selectedNotaPedido.clienteId) {
      const deudaData = await checkClienteDeuda(selectedNotaPedido.clienteId);
      if (deudaData) {
        setDeudaError(deudaData);
        pendingDeudaRef.current = () => {
          deudaYaConfirmadaRef.current = true;
          handleConvertNotaToFactura();
        };
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const notaId = selectedNotaPedido.id;

      // Apply selected financing option if different from current
      if (selectedOpcionId !== null && selectedOpcionId !== undefined) {
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
        // When FINANCIACION_PROPIA, prefer the manual tasa from the billing modal over the financing option's tasa.
        const metodoEsFinanciamiento = isFinanciamiento(selectedNotaPedido?.metodoPago ?? '');
        const notaTasaInteres = metodoEsFinanciamiento && billingForm.tasaInteres > 0
          ? billingForm.tasaInteres
          : (opcionesFinanciamiento.find(o => o.id === selectedOpcionId)?.tasaInteres ?? 0);
        const factura = await documentoApi.convertToFactura({
          notaPedidoId: notaId,
          ...(deudaYaConfirmadaRef.current && { confirmarConDeudaPendiente: true }),
          ...(notaCantidadCuotas != null && { cantidadCuotas: notaCantidadCuotas }),
          tipoFinanciacion: notaTipoFinanciacion,
          tasaInteres: notaTasaInteres,
          ...(notaPrimerVencimiento && { primerVencimiento: notaPrimerVencimiento }),
          ...resolveEntregaFields(selectedNotaPedido?.metodoPago ?? '', notaEntregaInicial, notaUsePorcentaje, notaPorcentajeEntrega, notaMontoFijoEntrega),
        });
        if (notaEntregaInicial && notaMontoEntregaCalculado > 0) {
          setFacturaEntregaInfo({ montoEntrega: notaMontoEntregaCalculado, montoFinanciado: notaMontoFinanciado, cantidadCuotas: notaCantidadCuotas });
        } else {
          setFacturaEntregaInfo(null);
        }
        setNotasPedido((prev) => prev.filter((n) => n.id !== notaId));
        handleCloseConvertDialog();
        setCreatedFactura(factura);
        setSuccessDialogOpen(true);
        // NO recargar datos aquí - la nota ya fue removida del estado local
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

  // Resolve an option from the list using the same key convention used by the RadioGroup
  // (falls back to index when the option has no persisted id).
  const findOpcionByValue = useCallback(
    (optionValue: number | null) => {
      if (optionValue === null) return undefined;
      return opcionesFinanciamiento.find(
        (o, idx) => (o.id !== undefined ? o.id : idx) === optionValue
      );
    },
    [opcionesFinanciamiento]
  );

  // Selecting a financing option is just a setState; the effect below syncs paymentMethod.
  // This keeps the Opciones dialog as the single source of truth for financing method:
  // whichever path writes selectedOpcionId (card click, radio, external logic) is picked up.
  const handleSelectOpcionFinanciamiento = useCallback((optionValue: number) => {
    setSelectedOpcionId(optionValue);
  }, []);

  // Effect-based sync: whenever the selected option changes, mirror its metodoPago into
  // paymentMethod so Gate 1 (billing modal), payload construction and UI all agree.
  // Declarative and robust to any caller that sets selectedOpcionId directly.
  useEffect(() => {
    if (selectedOpcionId === null) return;
    const opcion = findOpcionByValue(selectedOpcionId);
    if (opcion?.metodoPago) {
      setPaymentMethod((current) =>
        current === opcion.metodoPago ? current : (opcion.metodoPago as MetodoPago)
      );
    }
  }, [selectedOpcionId, findOpcionByValue]);

  // Reverse direction: changing the method manually drops a stale option whose metodoPago
  // no longer matches, so the UI doesn't show a radio button that is effectively dead.
  const handleChangePaymentMethod = useCallback(
    (newMethod: MetodoPago) => {
      setPaymentMethod(newMethod);
      if (selectedOpcionId !== null) {
        const currentOpcion = findOpcionByValue(selectedOpcionId);
        if (currentOpcion && currentOpcion.metodoPago !== newMethod) {
          setSelectedOpcionId(null);
        }
      }
    },
    [findOpcionByValue, selectedOpcionId]
  );

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
      const pagoAnticipo = totalVenta * 0.4;
      const pagoFinanciado = totalVenta * 0.6 * (1 + tasaDecimal);
      const montoTotal = pagoAnticipo + pagoFinanciado;
      const montoCuota = pagoFinanciado / template.cantidadCuotas;
      
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

      const pagoAnticipo = totalVenta * 0.4;
      const pagoFinanciado = totalVenta * 0.6 * (1 + tasaInteres / 100);
      const montoConInteres = pagoAnticipo + pagoFinanciado;
      const montoCuota = pagoFinanciado / cantidadCuotas;

      const newOpcion: OpcionFinanciamientoDTO = {
        nombre,
        metodoPago,
        cantidadCuotas,
        tasaInteres,
        montoTotal: montoConInteres,
        montoCuota: montoCuota,
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

  // ProductsTable is defined outside FacturacionPage (see above)

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', maxWidth: '100%', mx: 0 }}>
      <LoadingOverlay
        open={loading}
        message={products.length ? 'Procesando...' : 'Cargando datos iniciales...'}
      />
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
        <Alert 
          severity="error" 
          onClose={() => setError(null)} 
          sx={{ 
            mb: 3,
            '& .MuiAlert-message': {
              width: '100%',
              fontSize: '0.95rem',
            }
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Error en la operación
            </Typography>
            <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-line' }}>
              {error}
            </Typography>
          </Box>
        </Alert>
      )}
      
      {success && (
        <Alert 
          severity="success" 
          onClose={() => setSuccess(null)} 
          sx={{ 
            mb: 3,
            '& .MuiAlert-message': {
              width: '100%',
              fontSize: '0.95rem',
            }
          }}
        >
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
                      onChange={async (e) => {
                        const newId = e.target.value as number;
                        setSelectedClientId(newId);
                        deudaYaConfirmadaRef.current = false;
                        if (newId) {
                          const deudaData = await checkClienteDeuda(Number(newId));
                          if (deudaData) {
                            setDeudaError(deudaData);
                            pendingDeudaRef.current = () => {
                              deudaYaConfirmadaRef.current = true;
                            };
                          }
                        }
                      }}
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
                      onChange={(e) => handleChangePaymentMethod(e.target.value as MetodoPago)}
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

                {isFinanciamiento(paymentMethod) && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Los datos de financiación (cuotas, tasa, entrega inicial) se configuran al confirmar la factura.
                    </Alert>
                  </Grid>
                )}

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
                    products={products}
                    recetas={recetas}
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
          {/* Search field for Notas de Pedido */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar por número de nota, cliente, lead o total..."
              value={notasSearchTerm}
              onChange={(e) => setNotasSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              helperText={notasSearchTerm ? `Mostrando ${sortedNotasPedido.length} resultado(s) de ${notasPedido.length} notas` : `Total: ${notasPedido.length} notas de pedido`}
            />
          </Box>

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

                        <Box mt={1}>
                          <AuditoriaFlujo documento={nota} />
                        </Box>

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
                    value={selectedOpcionId !== null ? String(selectedOpcionId) : ''}
                    onChange={(e) => setSelectedOpcionId(Number(e.target.value))}
                  >
                    <Grid container spacing={2}>
                      {opcionesFinanciamiento.map((opcion, index) => {
                        const optionValue = opcion.id !== undefined ? opcion.id : index;
                        return (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card
                              variant="outlined"
                              sx={{
                                p: 1,
                                border: selectedOpcionId === optionValue ? '2px solid' : '1px solid',
                                borderColor: selectedOpcionId === optionValue ? 'primary.main' : 'divider',
                                cursor: 'pointer'
                              }}
                              onClick={() => setSelectedOpcionId(optionValue)}
                            >
                              <FormControlLabel
                                value={optionValue}
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
                        );
                      })}
                    </Grid>
                  </RadioGroup>
                </Box>
              )}

              {/* Display selected financing option */}
              {selectedOpcionId !== null && selectedOpcionId !== undefined && opcionesFinanciamiento.length > 0 && (
                <Box mb={2}>
                  <Alert severity="info" icon={<CreditCardIcon />}>
                    <Typography variant="body2">
                      <strong>Opción de Financiamiento Seleccionada:</strong> {opcionesFinanciamiento.find(o => (o.id !== undefined ? o.id : opcionesFinanciamiento.indexOf(o)) === selectedOpcionId)?.nombre}
                      {(() => {
                        const selectedOption = opcionesFinanciamiento.find(o => (o.id !== undefined ? o.id : opcionesFinanciamiento.indexOf(o)) === selectedOpcionId);
                        return selectedOption && selectedOption.tasaInteres !== 0 && (
                          <> ({selectedOption.tasaInteres}% {selectedOption.tasaInteres > 0 ? 'recargo' : 'descuento'})</>
                        );
                      })()}
                    </Typography>
                  </Alert>
                </Box>
              )}

              {/* Financing fields configured in modal — same UX as NotasPedidoPage */}
              {isFinanciamiento(selectedNotaPedido?.metodoPago ?? '') && (
                <Box mb={3}>
                  <Alert severity="info">
                    Los datos de financiación (cuotas, tasa, entrega inicial) se configuran al confirmar la factura.
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
                products={products}
                recetas={recetas}
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
                    ${(totalVenta * 0.4 + (totalVenta * 0.6 * (1 + newOpcionForm.tasaInteres / 100))).toFixed(2)}
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
            value={selectedOpcionId !== null ? String(selectedOpcionId) : ''}
            onChange={(e) => handleSelectOpcionFinanciamiento(Number(e.target.value))}
          >
            <Grid container spacing={2}>
              {opcionesFinanciamiento.map((opcion, index) => {
                const optionValue = opcion.id !== undefined ? opcion.id : index;
                return (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedOpcionId === optionValue ? '2px solid' : '1px solid',
                        borderColor: selectedOpcionId === optionValue ? 'primary.main' : 'divider',
                      }}
                      onClick={() => handleSelectOpcionFinanciamiento(optionValue)}
                    >
                      <FormControlLabel
                        value={optionValue}
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
                );
              })}
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

      {/* Fabricacion Confirmation Dialog */}
      <Dialog
        open={fabricacionDialogOpen}
        onClose={handleCancelarFabricacion}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ShoppingCartIcon color="warning" />
            <Typography variant="h6">Stock Insuficiente</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {itemPendienteFabricacion && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                No hay suficiente stock disponible para completar este pedido
              </Alert>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  Detalle del Equipo:
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Equipo:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {itemPendienteFabricacion.recetaNombre}
                    </Typography>
                  </Box>
                  {itemPendienteFabricacion.color && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Color:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {itemPendienteFabricacion.color.replace(/_/g, ' ')}
                      </Typography>
                    </Box>
                  )}
                  {itemPendienteFabricacion.medida && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Medida:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {itemPendienteFabricacion.medida}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Cantidad solicitada:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {itemPendienteFabricacion.cantidad + itemPendienteFabricacion.stockDisponible}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Stock disponible:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {itemPendienteFabricacion.stockDisponible}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Faltante:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="error.main">
                      {itemPendienteFabricacion.cantidad}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Typography variant="body2" paragraph>
                ¿Deseas generar un pedido de fabricación para crear los{' '}
                <strong>{itemPendienteFabricacion.cantidad}</strong> equipos faltantes?
              </Typography>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  💡 Los equipos se crearán en estado <strong>EN_PROCESO</strong> y podrás 
                  verlos en el módulo <strong>Producción → Equipos Fabricados</strong>.
                  <br /><br />
                  Después de crear el pedido, la facturación continuará automáticamente.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelarFabricacion} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmarFabricacion}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Sí, Generar Pedido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <SuccessDialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          setCreatedFactura(null);
          setFacturaEntregaInfo(null);
        }}
        title="¡Factura Creada Exitosamente!"
        message="La factura ha sido generada correctamente"
        details={createdFactura ? [
          { label: 'Número de Documento', value: createdFactura.numeroDocumento },
          { label: 'Cliente', value: createdFactura.clienteNombre || '-' },
          ...(facturaEntregaInfo
            ? [
                { label: 'Total con financiamiento', value: `$${(facturaEntregaInfo.montoEntrega + facturaEntregaInfo.montoFinanciado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
                { label: 'Entrega inicial (CC débito)', value: `$${facturaEntregaInfo.montoEntrega.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
                { label: 'Monto financiado', value: `$${facturaEntregaInfo.montoFinanciado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
                ...(facturaEntregaInfo.cantidadCuotas ? [{ label: 'Cuotas', value: `${facturaEntregaInfo.cantidadCuotas} × $${(facturaEntregaInfo.montoFinanciado / facturaEntregaInfo.cantidadCuotas).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` }] : []),
              ]
            : [{ label: 'Total', value: `$${createdFactura.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` }]),
          ...(createdFactura.prestamoId ? [{ label: 'Préstamo generado', value: `#${createdFactura.prestamoId}` }] : []),
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
          ...(createdFactura?.prestamoId ? [{
            label: 'Ver Préstamo',
            onClick: () => navigate(`/prestamos/${createdFactura.prestamoId}`),
            icon: <MoneyIcon />,
            variant: 'contained' as const,
            color: 'secondary' as const,
          }] : []),
        ]}
      />

      {/* Asignar Equipos Dialog */}
      <AsignarEquiposDialog
        open={asignarEquiposDialogOpen}
        onClose={handleCloseAsignarEquiposDialog}
        onConfirm={handleConfirmEquiposAsignacion}
        detallesEquipo={notaParaAsignacion?.detalles?.filter(d => d.tipoItem === 'EQUIPO') || []}
        notaPedidoId={notaParaAsignacion?.id}
      />

      {/* Billing Dialog — Datos de Financiación Propia */}
      <Dialog open={billingDialogOpen} onClose={handleCloseBillingDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Datos de Financiación Propia</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Cantidad de Cuotas"
              type="number"
              fullWidth
              value={billingForm.cantidadCuotas}
              onChange={(e) => setBillingForm(prev => ({ ...prev, cantidadCuotas: parseInt(e.target.value) || 1 }))}
              inputProps={{ min: 1 }}
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de Financiación</InputLabel>
              <Select
                value={billingForm.tipoFinanciacion}
                onChange={(e) => setBillingForm(prev => ({ ...prev, tipoFinanciacion: e.target.value }))}
                label="Tipo de Financiación"
              >
                {['SEMANAL', 'QUINCENAL', 'MENSUAL', 'PLAN_PP', 'CONTADO', 'CHEQUES'].map((t) => (
                  <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Primer Vencimiento"
              type="date"
              fullWidth
              value={billingForm.primerVencimiento}
              onChange={(e) => setBillingForm(prev => ({ ...prev, primerVencimiento: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={<Checkbox checked={billingForm.entregarInicial} onChange={(e) => setBillingForm(prev => ({ ...prev, entregarInicial: e.target.checked }))} />}
              label="Entrega inicial"
            />
            {billingForm.entregarInicial && (
              <Box sx={{ pl: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <RadioGroup
                  row
                  value={billingForm.usePorcentaje ? 'porcentaje' : 'monto'}
                  onChange={(e) => setBillingForm(prev => ({ ...prev, usePorcentaje: e.target.value === 'porcentaje' }))}
                >
                  <FormControlLabel value="porcentaje" control={<Radio />} label="Por porcentaje" />
                  <FormControlLabel value="monto" control={<Radio />} label="Monto fijo" />
                </RadioGroup>
                {billingForm.usePorcentaje ? (
                  <TextField
                    label="Porcentaje de entrega"
                    type="number"
                    value={billingForm.porcentajeEntregaInicial}
                    onChange={(e) => setBillingForm(prev => ({ ...prev, porcentajeEntregaInicial: parseFloat(e.target.value) || 0 }))}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  />
                ) : (
                  <TextField
                    label="Monto de entrega"
                    type="number"
                    value={billingForm.montoEntregaInicial}
                    onChange={(e) => setBillingForm(prev => ({ ...prev, montoEntregaInicial: parseFloat(e.target.value) || 0 }))}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  />
                )}
              </Box>
            )}
            <TextField
              label="Tasa de interés"
              type="number"
              fullWidth
              value={billingForm.tasaInteres}
              onChange={(e) => setBillingForm(prev => ({ ...prev, tasaInteres: parseFloat(e.target.value) || 0 }))}
              inputProps={{ min: 0, max: 999, step: 0.5 }}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              helperText="Interés simple sobre el saldo financiado. 0% = sin interés."
            />
            {(() => {
              const montoTotal = billingBaseTotal;
              const entregaInicial = billingForm.entregarInicial
                ? (billingForm.usePorcentaje
                    ? montoTotal * (billingForm.porcentajeEntregaInicial / 100)
                    : billingForm.montoEntregaInicial)
                : 0;
              const saldoFinanciado = montoTotal - entregaInicial;
              const interesTotal = saldoFinanciado * (billingForm.tasaInteres / 100);
              const montoConInteres = saldoFinanciado + interesTotal;
              const valorCuota = billingForm.cantidadCuotas > 0 ? montoConInteres / billingForm.cantidadCuotas : 0;
              const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Resumen del financiamiento</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                    <Typography variant="body2">Total documento:</Typography>
                    <Typography variant="body2" fontWeight={600}>${fmt(montoTotal)}</Typography>
                    <Typography variant="body2">Entrega inicial:</Typography>
                    <Typography variant="body2">${fmt(entregaInicial)}</Typography>
                    <Typography variant="body2">Saldo financiado:</Typography>
                    <Typography variant="body2">${fmt(saldoFinanciado)}</Typography>
                    {billingForm.tasaInteres > 0 && <>
                      <Typography variant="body2">Interés ({billingForm.tasaInteres}%):</Typography>
                      <Typography variant="body2" color="warning.main">${fmt(interesTotal)}</Typography>
                      <Typography variant="body2">Total a financiar:</Typography>
                      <Typography variant="body2" fontWeight={600}>${fmt(montoConInteres)}</Typography>
                    </>}
                    <Typography variant="body2">Valor cuota ({billingForm.cantidadCuotas}x):</Typography>
                    <Typography variant="body2" fontWeight={600} color="primary.main">${fmt(valorCuota)}</Typography>
                  </Box>
                </Box>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBillingDialog}>Cancelar</Button>
          <Button variant="contained" onClick={submitBillingDialog}>Confirmar Facturación</Button>
        </DialogActions>
      </Dialog>

      {/* Deuda cliente confirmation dialog */}
      <DeudaClienteConfirmDialog
        open={deudaError !== null}
        error={deudaError}
        onConfirm={handleDeudaConfirm}
        onCancel={handleDeudaCancel}
      />
    </Box>
  );
};

export default FacturacionPage;


