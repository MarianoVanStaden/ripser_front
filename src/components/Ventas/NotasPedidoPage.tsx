import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "../../hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  Snackbar,
  Autocomplete,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { documentoApi, clienteApi, opcionFinanciamientoApi, leadApi } from "../../api/services";
import { equipoFabricadoApi } from "../../api/services/equipoFabricadoApi";
import { prestamoPersonalApi } from "../../api/services/prestamoPersonalApi";
import { cuentaCorrienteApi } from "../../api/services/cuentaCorrienteApi";
import { useTenant } from "../../context/TenantContext";
import type {
  DocumentoComercial,
  EstadoDocumento,
  MetodoPago,
  DetalleDocumento,
  OpcionFinanciamientoDTO,
  DeudaClienteError,
} from "../../types";
import DeudaClienteConfirmDialog from "./DeudaClienteConfirmDialog";
import { EstadoDocumento as EstadoDocumentoEnum } from "../../types";
import SuccessDialog from "../common/SuccessDialog";
import AsignarEquiposDialog from "./AsignarEquiposDialog";
import AuditoriaFlujo from "../common/AuditoriaFlujo";
import UsuarioBadge from "../common/UsuarioBadge";
import LoadingOverlay from "../common/LoadingOverlay";
import { generarNotaPedidoPDF } from "../../services/pdfService";
import OpcionFinanciamientoLabel from "./OpcionFinanciamientoLabel";

type TipoIva = 'IVA_21' | 'IVA_10_5' | 'EXENTO';
type TipoDescuento = 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO';

interface ConvertFormData {
  presupuestoId: string;
  metodoPago: MetodoPago;
  tipoIva: TipoIva;
  descuentoTipo: TipoDescuento;
  descuentoValor: number;
}

const initialConvertForm: ConvertFormData = {
  presupuestoId: "",
  metodoPago: "EFECTIVO" as MetodoPago,
  tipoIva: "EXENTO",
  descuentoTipo: "NONE",
  descuentoValor: 0,
};

const IVA_RATES: Record<TipoIva, number> = {
  IVA_21: 0.21,
  IVA_10_5: 0.105,
  EXENTO: 0,
};

const NotasPedidoPage: React.FC = () => {
  const navigate = useNavigate();
  const { empresaId } = useTenant();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EstadoDocumento>(EstadoDocumentoEnum.APROBADO);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Main data states. notasPedido viene de useQuery server-side.
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Reset page=0 cuando cambian filtros (evita pedir página vacía).
  useEffect(() => {
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, clientFilter, dateFromFilter, dateToFilter]);

  const notasQuery = useQuery({
    queryKey: ['notasPedido', {
      page, size: rowsPerPage,
      busqueda: debouncedSearch.trim() || undefined,
      estado: statusFilter || undefined,
      clienteId: clientFilter !== 'all' ? Number(clientFilter) : undefined,
      fechaDesde: dateFromFilter || undefined,
      fechaHasta: dateToFilter || undefined,
      empresaId,
    }] as const,
    queryFn: () => documentoApi.getByTipoPaginated('NOTA_PEDIDO',
      { page, size: rowsPerPage, sort: 'fechaEmision,desc' },
      {
        ...(debouncedSearch.trim() ? { busqueda: debouncedSearch.trim() } : {}),
        ...(statusFilter ? { estado: statusFilter } : {}),
        ...(clientFilter !== 'all' ? { clienteId: Number(clientFilter) } : {}),
        ...(dateFromFilter ? { fechaDesde: dateFromFilter } : {}),
        ...(dateToFilter ? { fechaHasta: dateToFilter } : {}),
      }
    ),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const notasPedido: DocumentoComercial[] = useMemo(
    () => notasQuery.data?.content ?? [],
    [notasQuery.data]
  );
  const totalNotasPedido = notasQuery.data?.totalElements ?? 0;
  const invalidateNotas = useCallback(
    () => { queryClient.invalidateQueries({ queryKey: ['notasPedido'] }); },
    [queryClient]
  );

  // Presupuestos PENDIENTES para conversión: query separada con cache largo.
  // Solo se usa cuando se abre el dialog de conversión, así que `enabled` lo
  // gateamos por convertDialogOpen (definido más abajo). Mientras, mantenemos
  // un useState como cache local para no romper consumers que lo leen.
  const [presupuestos, setPresupuestos] = useState<DocumentoComercial[]>([]);

  // Dropdown de clientes con notas de pedido — viene del endpoint dedicado,
  // no se deriva de la página visible. Antes se reconstruía a partir de
  // notasPedido lo que dejaba clientes fuera cuando estaban en otra página.
  const clientesQuery = useQuery({
    queryKey: ['clientesConDocumentos', 'NOTA_PEDIDO', empresaId] as const,
    queryFn: () => documentoApi.getClientesConDocumentos('NOTA_PEDIDO'),
    staleTime: 5 * 60 * 1000,
  });
  const clientes = clientesQuery.data ?? [];

  useEffect(() => {
    if (!notasPedido.length) return;
    setNotasFinanciamiento((prev) => {
      const next = { ...prev };
      let mutated = false;
      for (const nota of notasPedido as any[]) {
        if (Array.isArray(nota.opcionesFinanciamiento) && nota.opcionesFinanciamiento.length > 0 && !next[nota.id]) {
          next[nota.id] = nota.opcionesFinanciamiento.map((o: any) => ({
            id: o.id, nombre: o.nombre ?? '', metodoPago: o.metodoPago ?? 'EFECTIVO',
            cantidadCuotas: o.cantidadCuotas ?? 0, tasaInteres: o.tasaInteres ?? 0,
            montoTotal: o.montoTotal ?? 0, montoCuota: o.montoCuota ?? 0,
            descripcion: o.descripcion, ordenPresentacion: o.ordenPresentacion,
            esSeleccionada: o.esSeleccionada,
          }));
          mutated = true;
        }
      }
      return mutated ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notasPedido]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedNota, setSelectedNota] = useState<DocumentoComercial | null>(null);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<DocumentoComercial | null>(null);
  const [editingObsNota, setEditingObsNota] = useState(false);
  const [obsNotaValue, setObsNotaValue] = useState('');
  const [convertForm, setConvertForm] = useState<ConvertFormData>(initialConvertForm);
  const [asignarEquiposDialogOpen, setAsignarEquiposDialogOpen] = useState(false);
  const [notaForAsignacion, setNotaForAsignacion] = useState<DocumentoComercial | null>(null);
  const pendingBillingDataRef = useRef<any>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdNota, setCreatedNota] = useState<DocumentoComercial | null>(null);
  const [facturaSuccessDialogOpen, setFacturaSuccessDialogOpen] = useState(false);
  const [createdFactura, setCreatedFactura] = useState<DocumentoComercial | null>(null);
  const [facturaTotalConFinanciamiento, setFacturaTotalConFinanciamiento] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [opcionesConvertDialog, setOpcionesConvertDialog] = useState<OpcionFinanciamientoDTO[]>([]);
  const [selectedOpcionConvertId, setSelectedOpcionConvertId] = useState<number | null>(null);

  const [financiamientoDialogOpen, setFinanciamientoDialogOpen] = useState(false);
  const [notaParaFinanciamiento, setNotaParaFinanciamiento] = useState<DocumentoComercial | null>(null);
  const [opcionesFinanciamiento, setOpcionesFinanciamiento] = useState<OpcionFinanciamientoDTO[]>([]);
  const [selectedOpcionId, setSelectedOpcionId] = useState<number | null>(null);
  const [notasFinanciamiento, setNotasFinanciamiento] = useState<Record<number, OpcionFinanciamientoDTO[]>>({});
  const [loadingOpciones, setLoadingOpciones] = useState(false);

  const [leadConversionDialogOpen, setLeadConversionDialogOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<DocumentoComercial | null>(null);
  void setLeadConversionDialogOpen; // Used in future implementation
  void leadToConvert; // Used in future implementation

  // Edit dialog (descuento + observaciones — solo PENDIENTE).
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [notaToEdit, setNotaToEdit] = useState<DocumentoComercial | null>(null);
  const [editForm, setEditForm] = useState<{
    descuentoTipo: 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO';
    descuentoValor: number;
    observaciones: string;
  }>({ descuentoTipo: 'NONE', descuentoValor: 0, observaciones: '' });
  const [editLoading, setEditLoading] = useState(false);

  // Deuda cliente confirmation
  const [deudaError, setDeudaError] = useState<DeudaClienteError | null>(null);
  const pendingDeudaRef = useRef<(() => void) | null>(null);
  const deudaYaConfirmadaRef = useRef(false);

  // Detects a debt-block response regardless of HTTP status or missing requiereConfirmacion flag.
  // The backend may return 400/409/422 and may omit requiereConfirmacion on some endpoints.
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
    // Fallback: detect by message content (backend may send plain 500/400 without structured fields)
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
    setConvertDialogOpen(false);
    setConvertForm(initialConvertForm);
    setSelectedPresupuesto(null);
    setOpcionesConvertDialog([]);
    setSelectedOpcionConvertId(null);
    setBillingDialogOpen(false);
    setNotaToBill(null);
  }, []);

  const getMetodoPagoIcon = (metodoPago: MetodoPago | string) => {
    switch (metodoPago) {
      case 'EFECTIVO': return <MoneyIcon fontSize="small" />;
      case 'TARJETA_CREDITO':
      case 'TARJETA_DEBITO': return <CreditCardIcon fontSize="small" />;
      case 'TRANSFERENCIA':
      case 'TRANSFERENCIA_BANCARIA':
      case 'FINANCIAMIENTO':
      case 'FINANCIACION_PROPIA':
      case 'CUENTA_CORRIENTE': return <BankIcon fontSize="small" />;
      default: return <MoneyIcon fontSize="small" />;
    }
  };

  /**
   * Asegura que la nota tenga su propio set de opciones de financiamiento.
   * El backend, al convertir presupuesto → nota, suele copiar 0 ó 1 opción.
   * Si detectamos que faltan, las materializamos clonando las del presupuesto origen
   * con IDs propios de la nota. Operación idempotente: solo se ejecuta cuando la nota
   * tiene menos opciones que su origen.
   */
  const ensureOpcionesNotaPedido = useCallback(
    async (nota: DocumentoComercial): Promise<OpcionFinanciamientoDTO[]> => {
      const propias = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(nota.id);

      if (!nota.documentoOrigenId) {
        return propias;
      }

      const origen = await opcionFinanciamientoApi
        .obtenerOpcionesPorDocumento(nota.documentoOrigenId)
        .catch(() => [] as OpcionFinanciamientoDTO[]);

      if (origen.length <= propias.length) {
        return propias;
      }

      // Materializar las opciones faltantes en la nota (sin id, para que el backend asigne uno).
      const clones: OpcionFinanciamientoDTO[] = origen.map(({ id: _ignored, esSeleccionada: _sel, ...rest }) => ({
        ...rest,
        esSeleccionada: false,
      }));
      const creadas = await opcionFinanciamientoApi.crearMultiples(nota.id, clones);
      return creadas;
    },
    []
  );

  const handleOpenFinanciamiento = useCallback(async (nota: DocumentoComercial) => {
    setNotaParaFinanciamiento(nota);
    setFinanciamientoDialogOpen(true);

    const cached = notasFinanciamiento[nota.id] ?? [];
    if (cached.length > 0) {
      setOpcionesFinanciamiento(cached);
      const preSelected = cached.find(o => o.id === nota.opcionFinanciamientoSeleccionadaId)
        ?? cached.find(o => o.esSeleccionada);
      setSelectedOpcionId(preSelected?.id ?? null);
      return;
    }

    setLoadingOpciones(true);
    try {
      const opciones = await ensureOpcionesNotaPedido(nota);
      setOpcionesFinanciamiento(opciones);
      if (opciones.length > 0) {
        setNotasFinanciamiento(prev => ({ ...prev, [nota.id]: opciones }));
      }
      const preSelected = opciones.find(o => o.id === nota.opcionFinanciamientoSeleccionadaId)
        ?? opciones.find(o => o.esSeleccionada)
        ?? opciones.find(o => o.metodoPago === nota.metodoPago);
      setSelectedOpcionId(preSelected?.id ?? null);
    } catch (error) {
      console.error('Error fetching financing options:', error);
      setOpcionesFinanciamiento([]);
      setSelectedOpcionId(null);
      setSnackbar({ open: true, message: 'No se pudieron cargar las opciones de financiamiento', severity: 'error' });
    } finally {
      setLoadingOpciones(false);
    }
  }, [notasFinanciamiento, ensureOpcionesNotaPedido]);

  const handleSelectOpcion = useCallback(async () => {
    if (!notaParaFinanciamiento || !selectedOpcionId) return;
    const opcionSeleccionada = opcionesFinanciamiento.find(o => o.id === selectedOpcionId);
    if (!opcionSeleccionada) return;
    try {
      await documentoApi.selectFinanciamientoNotaPedido(
        notaParaFinanciamiento.id,
        selectedOpcionId
      );
      invalidateNotas();
      const opcionesActualizadas = opcionesFinanciamiento.map(o => ({
        ...o,
        esSeleccionada: o.id === selectedOpcionId,
      }));
      setNotasFinanciamiento(prev => ({ ...prev, [notaParaFinanciamiento.id]: opcionesActualizadas }));
      setSnackbar({ open: true, message: 'Financiamiento seleccionado', severity: 'success' });
      setFinanciamientoDialogOpen(false);
    } catch {
      setSnackbar({ open: true, message: 'No se pudo seleccionar el financiamiento', severity: 'error' });
    }
  }, [notaParaFinanciamiento, selectedOpcionId, opcionesFinanciamiento]);

  // Presupuestos PENDIENTES candidatos a conversión.
  // Backend filtra por estado=PENDIENTE; a clienteId != null se chequea client-side.
  // Limitamos a 200 (los más recientes) — si hay más, se documenta como deuda.
  const presupuestosPendientesQuery = useQuery({
    queryKey: ['presupuestosPendientesParaNotaPedido', empresaId],
    queryFn: () => documentoApi.getByTipoPaginated('PRESUPUESTO',
      { page: 0, size: 200, sort: 'fechaEmision,desc' },
      { estado: 'PENDIENTE' }
    ),
    staleTime: 60_000,
  });
  useEffect(() => {
    const data = presupuestosPendientesQuery.data?.content ?? [];
    setPresupuestos(data.filter((p) => p.clienteId != null));
  }, [presupuestosPendientesQuery.data]);

  // El loading global ahora lo dicta solo el query de notas (es lo que se ve).
  useEffect(() => {
    setLoading(notasQuery.isLoading);
  }, [notasQuery.isLoading]);
  useEffect(() => {
    if (notasQuery.error) {
      const err = notasQuery.error as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message || err?.message || 'Error al cargar las notas de pedido');
    } else {
      setError(null);
    }
  }, [notasQuery.error]);

  // Filtros y paginación se ejecutan en el server (notasQuery).

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = useCallback((estado: EstadoDocumento): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (estado) {
      case EstadoDocumentoEnum.PENDIENTE: return "warning";
      case EstadoDocumentoEnum.APROBADO: return "success";
      case EstadoDocumentoEnum.PAGADA: return "primary";
      case EstadoDocumentoEnum.VENCIDA: return "error";
      case EstadoDocumentoEnum.FACTURADA: return "info";
      default: return "default";
    }
  }, []);

  const getStatusLabel = useCallback((estado: EstadoDocumento): string => {
    switch (estado) {
      case EstadoDocumentoEnum.PENDIENTE: return "Pendiente";
      case EstadoDocumentoEnum.APROBADO: return "Aprobado";
      case EstadoDocumentoEnum.PAGADA: return "Pagada";
      case EstadoDocumentoEnum.VENCIDA: return "Vencida";
      case EstadoDocumentoEnum.FACTURADA: return "Facturada";
      default: return estado;
    }
  }, []);

  const getSelectedFinancingOption = useCallback((nota: DocumentoComercial): OpcionFinanciamientoDTO | undefined => {
    const opciones = notasFinanciamiento[nota.id] ?? [];
    const selectedId = nota.opcionFinanciamientoSeleccionadaId;
    if (selectedId) {
      const found = opciones.find(o => o.id === selectedId);
      if (found) return found;
    }
    return opciones.find(o => o.esSeleccionada);
  }, [notasFinanciamiento]);

  const getMetodoPagoLabel = (metodo: MetodoPago | string): string => {
    const labels: Record<string, string> = {
      EFECTIVO: "Efectivo",
      TARJETA_CREDITO: "Tarjeta de Crédito",
      TARJETA_DEBITO: "Tarjeta de Débito",
      TRANSFERENCIA: "Transferencia Bancaria",
      TRANSFERENCIA_BANCARIA: "Transferencia Bancaria",
      CHEQUE: "Cheque",
      FINANCIAMIENTO: "Financiamiento",
      FINANCIACION_PROPIA: "Financiamiento",
      CUENTA_CORRIENTE: "Cuenta Corriente",
      MERCADO_PAGO: "Mercado Pago",
    };
    return labels[metodo] || String(metodo);
  };

  const getTipoIvaLabel = (tipo: TipoIva): string => {
    const labels: Record<TipoIva, string> = {
      IVA_21: "IVA 21%",
      IVA_10_5: "IVA 10.5%",
      EXENTO: "Exento",
    };
    return labels[tipo] || tipo;
  };

  const handleOpenConvertDialog = useCallback(() => {
    setConvertForm(initialConvertForm);
    setSelectedPresupuesto(null);
    setConvertDialogOpen(true);
  }, []);

  const handleCloseConvertDialog = useCallback(() => {
    setConvertDialogOpen(false);
    setConvertForm(initialConvertForm);
    setSelectedPresupuesto(null);
    setOpcionesConvertDialog([]);
    setSelectedOpcionConvertId(null);
    setError(null);
    deudaYaConfirmadaRef.current = false;
  }, []);

  const handlePresupuestoSelect = useCallback(async (presupuestoId: string) => {
    const presupuesto = presupuestos.find(p => p.id.toString() === presupuestoId);
    setSelectedPresupuesto(presupuesto || null);
    deudaYaConfirmadaRef.current = false;

    // Reset opciones de financiamiento
    setOpcionesConvertDialog([]);
    setSelectedOpcionConvertId(null);

    // If presupuesto has tipoIva/descuento defined, inherit them in the form.
    // The user can still override before converting.
    const inheritedDescuentoTipo = (presupuesto?.descuentoTipo as TipoDescuento) || 'NONE';
    const inheritedDescuentoValor = Number(presupuesto?.descuentoValor) || 0;
    if (presupuesto && presupuesto.tipoIva) {
      setConvertForm(prev => ({
        ...prev,
        presupuestoId,
        tipoIva: presupuesto.tipoIva as TipoIva,
        descuentoTipo: inheritedDescuentoTipo,
        descuentoValor: inheritedDescuentoValor,
      }));
    } else {
      setConvertForm(prev => ({
        ...prev,
        presupuestoId,
        descuentoTipo: inheritedDescuentoTipo,
        descuentoValor: inheritedDescuentoValor,
      }));
    }

    // Fetch financing options for this presupuesto and pre-select the active one
    if (presupuesto) {
      try {
        const opciones = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(presupuesto.id);
        if (opciones.length > 0) {
          setOpcionesConvertDialog(opciones);
          const seleccionada = opciones.find(o => o.id === presupuesto.opcionFinanciamientoSeleccionadaId)
            ?? opciones.find(o => o.esSeleccionada);
          const opcionId = seleccionada?.id ?? opciones[0].id;
          setSelectedOpcionConvertId(opcionId ?? null);
          const opcionMetodo = opciones.find(o => o.id === opcionId)?.metodoPago;
          if (opcionMetodo) {
            setConvertForm(prev => ({ ...prev, metodoPago: opcionMetodo }));
          }
        }
      } catch {
        // Non-fatal: user can still select manually
      }
    }

    // Debt check on selection so the warning appears before the user fills the form
    const clienteId = presupuesto?.clienteId;
    if (!clienteId) return;
    try {
      const [prestamos, ccPage] = await Promise.all([
        prestamoPersonalApi.getByCliente(clienteId),
        cuentaCorrienteApi.getByClienteId(clienteId),
      ]);
      const activoStates = ['ACTIVO', 'EN_MORA', 'EN_LEGAL'];
      const prestamosActivos = prestamos.filter(p => activoStates.includes(p.estado));
      const cuotasPendientes = prestamosActivos.reduce((sum, p) => sum + (p.cuotasPendientes || 0), 0);
      const montoCuotasPendientes = prestamosActivos.reduce((sum, p) => sum + (p.saldoPendiente || 0), 0);
      const movements = ccPage.content;
      const lastMovement = [...movements].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )[0];
      const saldo = lastMovement?.saldo ?? 0;
      const deudaCC = saldo < 0 ? saldo : null;
      if (cuotasPendientes > 0 || deudaCC !== null) {
        setDeudaError({
          error: 'Cliente con deuda pendiente',
          message: '',
          cuotasPendientes,
          montoCuotasPendientes: cuotasPendientes > 0 ? montoCuotasPendientes : null,
          deudaCuentaCorriente: deudaCC,
          requiereConfirmacion: true,
        });
        // On confirm just mark as acknowledged; the actual conversion happens on submit
        pendingDeudaRef.current = () => { deudaYaConfirmadaRef.current = true; };
      }
    } catch {
      // Non-fatal: debt will be caught by backend if needed
    }
  }, [presupuestos]);


  const handleConvertToNotaPedido = useCallback(async (confirmarConDeudaPendiente?: boolean) => {
    if (!convertForm.presupuestoId) {
      setError("Debe seleccionar un presupuesto");
      return;
    }

    // Check if presupuesto is from a lead
    if (selectedPresupuesto?.leadId && !selectedPresupuesto?.clienteId) {
      // Verificar si el lead ya fue convertido a cliente
      try {
        const lead = await leadApi.getById(selectedPresupuesto.leadId);
        
        if (lead.estadoLead === 'CONVERTIDO' && lead.clienteIdConvertido) {
          // Lead ya convertido - mostrar opción de migrar presupuesto
          setSnackbar({
            open: true,
            message: `Este lead ya fue convertido a cliente. Actualizando presupuesto al cliente ID ${lead.clienteIdConvertido}...`,
            severity: 'info'
          });
          
          // Intentar actualizar el presupuesto al cliente
          try {
            // Aquí deberíamos llamar a un endpoint del backend que actualice el presupuesto
            // Como workaround temporal, mostramos mensaje y continuamos
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setError(
              `⚠️ IMPORTANTE: Este presupuesto está asociado al lead "${selectedPresupuesto.leadNombre}" que ya fue convertido a cliente.\n\n` +
              `El backend debe actualizar automáticamente estos presupuestos durante la conversión del lead.\n\n` +
              `Por favor, contacte al administrador del sistema para que implemente la migración automática de presupuestos en el endpoint de conversión de leads.\n\n` +
              `Cliente ID: ${lead.clienteIdConvertido}`
            );
            setFormLoading(false);
            return;
          } catch (updateErr) {
            console.error('Error actualizando presupuesto:', updateErr);
          }
        } else {
          // Lead no convertido - mostrar diálogo de conversión
          setLeadToConvert(selectedPresupuesto);
          setLeadConversionDialogOpen(true);
          return;
        }
      } catch (leadErr) {
        console.error('Error verificando lead:', leadErr);
        // Si no se puede verificar, mostrar diálogo normal
        setLeadToConvert(selectedPresupuesto);
        setLeadConversionDialogOpen(true);
        return;
      }
    }

    // Preemptive debt check: run before any API side-effects so the warning appears before
    // equipo resolution starts. Skipped when the user has already confirmed via the modal
    // (either at selection time or via a previous submit attempt).
    if (!confirmarConDeudaPendiente && !deudaYaConfirmadaRef.current) {
      const clienteId = selectedPresupuesto?.clienteId;
      if (clienteId) {
        try {
          const [prestamos, ccPage] = await Promise.all([
            prestamoPersonalApi.getByCliente(clienteId),
            cuentaCorrienteApi.getByClienteId(clienteId),
          ]);

          const activoStates = ['ACTIVO', 'EN_MORA', 'EN_LEGAL'];
          const prestamosActivos = prestamos.filter(p => activoStates.includes(p.estado));
          const cuotasPendientes = prestamosActivos.reduce((sum, p) => sum + (p.cuotasPendientes || 0), 0);
          const montoCuotasPendientes = prestamosActivos.reduce((sum, p) => sum + (p.saldoPendiente || 0), 0);

          const movements = ccPage.content;
          const lastMovement = [...movements].sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          )[0];
          const saldo = lastMovement?.saldo ?? 0;
          const deudaCC = saldo < 0 ? saldo : null;

          if (cuotasPendientes > 0 || deudaCC !== null) {
            setDeudaError({
              error: 'Cliente con deuda pendiente',
              message: '',
              cuotasPendientes,
              montoCuotasPendientes: cuotasPendientes > 0 ? montoCuotasPendientes : null,
              deudaCuentaCorriente: deudaCC,
              requiereConfirmacion: true,
            });
            pendingDeudaRef.current = () => handleConvertToNotaPedido(true);
            return;
          }
        } catch (checkErr) {
          // Non-fatal: proceed normally; backend will catch any debt on its end
          console.warn('No se pudo verificar deuda del cliente de forma preventiva:', checkErr);
        }
      }
    }

    try {
      setFormLoading(true);
      setError(null);

      // Fetch the full presupuesto (with detalles) to preserve colors — the list endpoint
      // may not include detalles in the summary response.
      let presupDetalles: DetalleDocumento[] = selectedPresupuesto?.detalles || [];
      try {
        const fullPresupuesto = await documentoApi.getById(Number(convertForm.presupuestoId));
        if (fullPresupuesto.detalles?.length) {
          presupDetalles = fullPresupuesto.detalles;
        }
      } catch (e) {
        console.warn('No se pudieron obtener los detalles completos del presupuesto:', e);
      }

      const payload = {
        presupuestoId: Number(convertForm.presupuestoId),
        metodoPago: convertForm.metodoPago,
        tipoIva: convertForm.tipoIva,
        descuentoTipo: convertForm.descuentoTipo,
        descuentoValor: convertForm.descuentoTipo === 'NONE' ? 0 : convertForm.descuentoValor,
        ...(confirmarConDeudaPendiente && { confirmarConDeudaPendiente: true }),
      };

      // Backend now returns { documento, resolucionesEquipo } and resolves stock
      // (P1 → P2 → P3) server-side inside the same @Transactional. The frontend
      // just unwraps the documento and surfaces the resolution messages.
      const { documento: nuevaNota, resolucionesEquipo } = await documentoApi.convertToNotaPedido(payload);
      invalidateNotas();

      // Fetch full nota to ensure detalles have their IDs (required for reservarParaNota).
      // convertToNotaPedido may return the document without nested detalle IDs.
      let notaConDetalles = nuevaNota;
      if (nuevaNota.id) {
        try {
          const fullNota = await documentoApi.getById(nuevaNota.id);
          if (fullNota.detalles?.length) {
            // Some backend DTO mappings omit the detalle ID in certain responses (missing setId()).
            // Merge: prefer the source that has a non-null id for each position.
            const mergedDetalles = fullNota.detalles.map((d, idx) => ({
              ...d,
              id: d.id ?? nuevaNota.detalles?.[idx]?.id,
            }));
            notaConDetalles = { ...fullNota, detalles: mergedDetalles };
          }
        } catch {
          console.warn('No se pudo obtener la nota completa; los detalles pueden carecer de ID.');
        }
      }

      // Enrich nota's detalles with colors from presupuesto when backend doesn't preserve them
      const enrichedDetalles = (notaConDetalles.detalles || []).map((d, idx) => {
        if (d.tipoItem === 'EQUIPO' && !d.color) {
          // Try to match by position first (most reliable if backend preserves order)
          const presupDetalle = presupDetalles[idx];
          if (presupDetalle?.tipoItem === 'EQUIPO' && presupDetalle.color) {
            return { ...d, color: presupDetalle.color };
          }
          // Fallback: match by recetaId
          const presupDetalleByReceta = presupDetalles.find(
            pd => pd.tipoItem === 'EQUIPO' && pd.recetaId === d.recetaId && pd.color
          );
          if (presupDetalleByReceta?.color) {
            return { ...d, color: presupDetalleByReceta.color };
          }
        }
        return d;
      });

      // Update local state with enriched nota so the view dialog shows colors from the presupuesto.
      // The DB may not persist colors (backend bug in convertToNotaPedido), but we can at least
      // show the correct colors for the current session.
      const notaEnriquecida = { ...notaConDetalles, detalles: enrichedDetalles };
      invalidateNotas();

      // Populate financing options cache for the new nota so the table shows the selected
      // option name (e.g. "18 cuotas - 45% interés") instead of the generic metodoPago label.
      if (nuevaNota.id && opcionesConvertDialog.length > 0) {
        const opcionesConSelected = opcionesConvertDialog.map(o => ({
          ...o,
          esSeleccionada: o.id === selectedOpcionConvertId,
        }));
        setNotasFinanciamiento(prev => ({ ...prev, [nuevaNota.id]: opcionesConSelected }));
      }

      // Persist the selected financing option on the new nota so the backend uses its
      // tasaInteres when creating the personal credit during billing.
      if (nuevaNota.id && selectedOpcionConvertId) {
        try {
          // Fetch the nota's own financing options (backend copies them on creation).
          const notaOpciones = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(nuevaNota.id);
          const selectedPresupOp = opcionesConvertDialog.find(o => o.id === selectedOpcionConvertId);
          // Match the nota option by nombre (backend preserves names when copying).
          const matchedNotaOp = selectedPresupOp
            ? notaOpciones.find(o => o.nombre === selectedPresupOp.nombre)
            : null;
          const idToSelect = matchedNotaOp?.id ?? (notaOpciones.length === 0 ? selectedOpcionConvertId : null);
          if (idToSelect) {
            await documentoApi.selectFinanciamientoNotaPedido(nuevaNota.id, idToSelect);
            invalidateNotas();
          }
        } catch {
          // Non-fatal: billing will still work but without financing cost increment.
        }
      }

      // Stock resolution already happened server-side. We just (a) link the cliente
      // on each reserved equipo (the backend doesn't set clienteId on EquipoFabricado)
      // and (b) build snackbar messages from the resoluciones returned by the backend.
      const clienteIdParaVincular = notaConDetalles.clienteId;
      const resoluciones: string[] = [];
      const advertenciasResolucion: string[] = [];

      for (const r of resolucionesEquipo) {
        if (!r.exito || r.modo === 'ERROR') {
          advertenciasResolucion.push(`${r.detalleNombre}: ${r.mensaje}`);
          continue;
        }

        if (r.equipoId && clienteIdParaVincular) {
          try {
            await equipoFabricadoApi.update(r.equipoId, { clienteId: clienteIdParaVincular });
          } catch {
            // Non-fatal: client linking failed, but reservation is still valid
          }
        }

        const icon =
          r.modo === 'STOCK_TERMINADO' ? '✅' :
          r.modo === 'BASE_RESERVADA' ? '🎨' :
          '🏭';
        resoluciones.push(`${icon} ${r.mensaje}`);
      }

      if (resoluciones.length > 0 || advertenciasResolucion.length > 0) {
        const lines = [
          ...resoluciones,
          ...advertenciasResolucion.map(a => `⚠️ ${a}`),
        ];
        setSnackbar({
          open: true,
          message: lines.join('\n'),
          severity: advertenciasResolucion.length > 0
            ? (resoluciones.length > 0 ? 'info' : 'warning')
            : 'success',
        });
      }

      // Remove converted presupuesto from available list
      setPresupuestos(prev => prev.filter(p => p.id !== Number(convertForm.presupuestoId)));

      handleCloseConvertDialog();
      setCreatedNota(notaEnriquecida);
      setSuccessDialogOpen(true);
    } catch (err: any) {
      console.error("Error converting to nota de pedido:", err);

      // Deuda cliente: mostrar modal de confirmación
      const deudaData = parseDeudaError(err);
      if (deudaData) {
        setDeudaError(deudaData);
        pendingDeudaRef.current = () => handleConvertToNotaPedido(true);
        return;
      }

      let errorMessage = "Error al convertir el presupuesto";

      // Check if error is due to lead conversion requirement
      if (err.response?.data?.message && err.response.data.message.includes("lead")) {
        errorMessage = "⚠️ No se puede convertir a Nota de Pedido: Este presupuesto está asociado a un lead.\n\n" +
                      "Para continuar, primero debe convertir el lead a cliente.\n" +
                      "Puede hacerlo desde la página de Leads.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);

      // Also show error in snackbar for better visibility
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  }, [convertForm, handleCloseConvertDialog, opcionesConvertDialog, selectedOpcionConvertId]);

  const handleViewNota = useCallback((nota: DocumentoComercial) => {
    setSelectedNota(nota);
    setViewDialogOpen(true);
  }, []);

  const handleCloseViewDialog = useCallback(() => {
    setViewDialogOpen(false);
    setSelectedNota(null);
    setEditingObsNota(false);
  }, []);

  const handleSaveObsNota = useCallback(async () => {
    if (!selectedNota) return;
    try {
      const updated = await documentoApi.updateObservaciones(selectedNota.id, obsNotaValue || null);
      setSelectedNota(updated);
      setEditingObsNota(false);
      queryClient.invalidateQueries({ queryKey: ['notasPedido'] });
      setSnackbar({ open: true, message: 'Observaciones actualizadas', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Error al guardar observaciones', severity: 'error' });
    }
  }, [selectedNota, obsNotaValue, queryClient]);

  const handleOpenEditDialog = useCallback((nota: DocumentoComercial) => {
    setNotaToEdit(nota);
    setEditForm({
      descuentoTipo: (nota.descuentoTipo as 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO') || 'NONE',
      descuentoValor: Number(nota.descuentoValor) || 0,
      observaciones: nota.observaciones || '',
    });
    setEditDialogOpen(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setNotaToEdit(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!notaToEdit) return;
    setEditLoading(true);
    try {
      const tipoOriginal = (notaToEdit.descuentoTipo as 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO') || 'NONE';
      const valorOriginal = Number(notaToEdit.descuentoValor) || 0;
      const obsOriginal = notaToEdit.observaciones || '';
      const nuevoTipo = editForm.descuentoTipo;
      const nuevoValor = nuevoTipo === 'NONE' ? 0 : editForm.descuentoValor;

      if (nuevoTipo !== tipoOriginal || nuevoValor !== valorOriginal) {
        await documentoApi.updateDescuento(notaToEdit.id, nuevoTipo, nuevoValor);
      }
      if (editForm.observaciones !== obsOriginal) {
        await documentoApi.updateObservaciones(notaToEdit.id, editForm.observaciones || null);
      }

      queryClient.invalidateQueries({ queryKey: ['notasPedido'] });
      setSnackbar({ open: true, message: 'Nota de pedido actualizada', severity: 'success' });
      handleCloseEditDialog();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al guardar';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setEditLoading(false);
    }
  }, [notaToEdit, editForm, queryClient, handleCloseEditDialog]);

  // Billing Dialog state (para Financiación Propia)
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [notaToBill, setNotaToBill] = useState<DocumentoComercial | null>(null);
  const [billingForm, setBillingForm] = useState({
    cantidadCuotas: 1,
    tipoFinanciacion: 'MENSUAL',
    primerVencimiento: '',
    entregarInicial: false,
    usePorcentaje: true,
    porcentajeEntregaInicial: 0,
    montoEntregaInicial: 0,
    tasaInteres: 0,
  });

  const handleOpenBillingDialog = useCallback((nota: DocumentoComercial) => {
    const esFinanciamiento = nota.metodoPago === 'FINANCIAMIENTO' || nota.metodoPago === 'FINANCIACION_PROPIA';
    if (esFinanciamiento) {
      // Pre-populate cuotas from selected option; default entrega inicial 40%
      const opciones = notasFinanciamiento[nota.id] ?? [];
      const opcionSeleccionada = opciones.find(o => o.id === nota.opcionFinanciamientoSeleccionadaId)
        ?? opciones.find(o => o.esSeleccionada);
      const cuotas = opcionSeleccionada?.cantidadCuotas ?? 1;
      const tasa = (opcionSeleccionada?.tasaInteres ?? 0) > 0 ? opcionSeleccionada!.tasaInteres : 0;
      setBillingForm({
        cantidadCuotas: cuotas,
        tipoFinanciacion: 'MENSUAL',
        primerVencimiento: '',
        entregarInicial: true,
        usePorcentaje: true,
        porcentajeEntregaInicial: 40,
        montoEntregaInicial: 0,
        tasaInteres: tasa,
      });
      setNotaToBill(nota);
      setBillingDialogOpen(true);
    } else {
      handleConvertToFactura(nota.id);
    }
  }, [notasPedido, notasFinanciamiento]);

  const handleCloseBillingDialog = () => {
    setBillingDialogOpen(false);
    setNotaToBill(null);
  };

  const submitBillingDialog = () => {
    if (!notaToBill) return;
    // Compute the real total with interest so the success dialog shows the correct value
    const montoBase = notaToBill.subtotal ?? 0;
    const entregaInicial = billingForm.entregarInicial
      ? (billingForm.usePorcentaje
          ? montoBase * (billingForm.porcentajeEntregaInicial / 100)
          : billingForm.montoEntregaInicial)
      : 0;
    const saldoFinanciado = montoBase - entregaInicial;
    const interesTotal = saldoFinanciado * (billingForm.tasaInteres / 100);
    setFacturaTotalConFinanciamiento(billingForm.tasaInteres > 0 ? montoBase + interesTotal : null);
    handleConvertToFactura(notaToBill.id, false, billingForm);
    handleCloseBillingDialog();
  };

  const handleConvertToFactura = useCallback(async (notaId: number, confirmarConDeudaPendiente = false, extraData?: any) => {
    // Find the nota
    const nota = notasPedido.find(n => n.id === notaId);
    if (!nota) {
      setError("Nota de pedido no encontrada");
      return;
    }

    // Build payload early so it's available for all code paths (including early returns)
    const baseFacturaPayload: any = { notaPedidoId: notaId };
    if (extraData && (nota?.metodoPago === 'FINANCIAMIENTO' || nota?.metodoPago === 'FINANCIACION_PROPIA')) {
      baseFacturaPayload.cantidadCuotas = extraData.cantidadCuotas;
      baseFacturaPayload.tipoFinanciacion = extraData.tipoFinanciacion;
      baseFacturaPayload.tasaInteres = extraData.tasaInteres ?? 0;
      if (extraData.primerVencimiento) baseFacturaPayload.primerVencimiento = extraData.primerVencimiento;
      if (extraData.entregarInicial) {
        if (extraData.usePorcentaje) {
          baseFacturaPayload.porcentajeEntregaInicial = extraData.porcentajeEntregaInicial;
        } else {
          baseFacturaPayload.montoEntregaInicial = extraData.montoEntregaInicial;
        }
      }
    }

    // Preemptive debt check (same pattern as convert-to-nota flow)
    if (!confirmarConDeudaPendiente && !deudaYaConfirmadaRef.current) {
      const clienteId = nota.clienteId;
      if (clienteId) {
        try {
          const [prestamos, ccPage] = await Promise.all([
            prestamoPersonalApi.getByCliente(clienteId),
            cuentaCorrienteApi.getByClienteId(clienteId),
          ]);
          const activoStates = ['ACTIVO', 'EN_MORA', 'EN_LEGAL'];
          const prestamosActivos = prestamos.filter(p => activoStates.includes(p.estado));
          const cuotasPendientes = prestamosActivos.reduce((sum, p) => sum + (p.cuotasPendientes || 0), 0);
          const montoCuotasPendientes = prestamosActivos.reduce((sum, p) => sum + (p.saldoPendiente || 0), 0);
          const movements = ccPage.content;
          const lastMovement = [...movements].sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          )[0];
          const saldo = lastMovement?.saldo ?? 0;
          const deudaCC = saldo < 0 ? saldo : null;
          if (cuotasPendientes > 0 || deudaCC !== null) {
            setDeudaError({
              error: 'Cliente con deuda pendiente',
              message: '',
              cuotasPendientes,
              montoCuotasPendientes: cuotasPendientes > 0 ? montoCuotasPendientes : null,
              deudaCuentaCorriente: deudaCC,
              requiereConfirmacion: true,
            });
            const tieneEquipos = (nota.detalles?.filter(d => d.tipoItem === 'EQUIPO') || []).length > 0;
            if (tieneEquipos) {
              // Persist billing data so handleConfirmAsignacion can include it
              pendingBillingDataRef.current = Object.keys(baseFacturaPayload).length > 1 ? baseFacturaPayload : null;
              // Skip probe; go directly to equipment selection with debt already confirmed
              pendingDeudaRef.current = () => {
                deudaYaConfirmadaRef.current = true;
                setNotaForAsignacion(nota);
                setAsignarEquiposDialogOpen(true);
              };
            } else {
              pendingDeudaRef.current = () => handleConvertToFactura(notaId, true, extraData);
            }
            return;
          }
        } catch {
          // Non-fatal: proceed; backend will catch debt on its end
        }
      }
    }
    deudaYaConfirmadaRef.current = false;

    // Check if there are EQUIPO items in the detalles
    const detallesEquipo = nota.detalles?.filter(d => d.tipoItem === 'EQUIPO') || [];

    if (detallesEquipo.length > 0) {
      // Persist billing data so handleConfirmAsignacion can include it in the final payload
      pendingBillingDataRef.current = Object.keys(baseFacturaPayload).length > 1 ? baseFacturaPayload : null;

      // Probe for debt BEFORE opening AsignarEquiposDialog so the warning appears first.
      try {
        const probeResult = await documentoApi.convertToFactura(baseFacturaPayload);
        // Unexpected success (nota converted without equipos): accept and show success dialog.
        invalidateNotas();
        setCreatedFactura(probeResult);
        setFacturaSuccessDialogOpen(true);
      } catch (probeErr: any) {
        const deudaData = parseDeudaError(probeErr);
        if (deudaData) {
          setDeudaError(deudaData);
          pendingDeudaRef.current = () => {
            deudaYaConfirmadaRef.current = true;
            setNotaForAsignacion(nota);
            setAsignarEquiposDialogOpen(true);
          };
          return;
        }
        // Non-debt error (e.g. backend requires equipos) → proceed to selection dialog
        setNotaForAsignacion(nota);
        setAsignarEquiposDialogOpen(true);
      }
    } else {
      // No equipos, proceed directly with conversion
      if (!confirmarConDeudaPendiente && !window.confirm("¿Está seguro de convertir esta Nota de Pedido en Factura?")) {
        return;
      }

      try {
        setError(null);
        const factura = await documentoApi.convertToFactura({
          ...baseFacturaPayload,
          ...(confirmarConDeudaPendiente && { confirmarConDeudaPendiente: true }),
        });
        // Remove nota from local state
        invalidateNotas();
        // Show success dialog
        setCreatedFactura(factura);
        setFacturaSuccessDialogOpen(true);
      } catch (err: any) {
        console.error("Error converting to factura:", err);
        const deudaData = parseDeudaError(err);
        if (deudaData) {
          setDeudaError(deudaData);
          pendingDeudaRef.current = async () => {
            try {
              setError(null);
              const facturaRetry = await documentoApi.convertToFactura({ ...baseFacturaPayload, confirmarConDeudaPendiente: true });
              invalidateNotas();
              setCreatedFactura(facturaRetry);
              setFacturaSuccessDialogOpen(true);
            } catch (retryErr: any) {
              setError(retryErr?.response?.data?.message || retryErr?.message || "Error desconocido al convertir a factura");
            }
          };
          return;
        }
        const errorMessage = err?.response?.data?.message || err?.message || "Error desconocido al convertir a factura";
        setError(errorMessage);
      }
    }
  }, [notasPedido, invalidateNotas]);

  // Handler para exportar nota de pedido a PDF
  const handleExportarPDF = useCallback(async (nota: DocumentoComercial) => {
    try {
      console.log('Iniciando generación de PDF para nota de pedido:', nota);
      console.log('opcionFinanciamientoSeleccionadaId:', nota.opcionFinanciamientoSeleccionadaId);

      // Obtener el cliente completo
      const cliente = await clienteApi.getById(nota.clienteId!);
      console.log('Cliente encontrado:', cliente);

      // Obtener la opción de financiamiento seleccionada si existe
      let opcionSeleccionada: OpcionFinanciamientoDTO | undefined;

      // Intentar obtener por ID si existe
      if (nota.opcionFinanciamientoSeleccionadaId) {
        try {
          opcionSeleccionada = await opcionFinanciamientoApi.obtenerPorId(nota.opcionFinanciamientoSeleccionadaId);
          console.log('Opción de financiamiento obtenida por ID:', opcionSeleccionada);
        } catch (e) {
          console.warn('No se pudo cargar la opción de financiamiento por ID:', e);
        }
      }

      // Si no se obtuvo por ID, intentar obtener todas las opciones del documento y buscar la seleccionada
      if (!opcionSeleccionada) {
        try {
          console.log('Intentando obtener opciones de financiamiento por documento ID:', nota.id);
          const opciones = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(nota.id);
          console.log('Opciones encontradas:', opciones);
          opcionSeleccionada = opciones.find(o => o.esSeleccionada);
          console.log('Opción seleccionada encontrada:', opcionSeleccionada);
        } catch (e) {
          console.warn('No se pudieron cargar las opciones de financiamiento del documento:', e);
        }
      }

      console.log('Generando PDF con opción de financiamiento:', opcionSeleccionada);

      // Generar el PDF
      generarNotaPedidoPDF({
        documento: nota,
        cliente,
        opcionSeleccionada
      });

      console.log('PDF generado exitosamente');
    } catch (error) {
      console.error('Error detallado al generar PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al generar el PDF de la nota de pedido: ${errorMessage}`);
    }
  }, []);

  const handleConfirmAsignacion = useCallback(async (asignaciones: { [detalleId: number]: number[] }) => {
    if (!notaForAsignacion) return;

    const deudaPreconfirmada = deudaYaConfirmadaRef.current;
    deudaYaConfirmadaRef.current = false;

    try {
      setError(null);
      setAsignarEquiposDialogOpen(false);

      const billingData = pendingBillingDataRef.current ?? {};
      pendingBillingDataRef.current = null;
      const factura = await documentoApi.convertToFactura({
        notaPedidoId: notaForAsignacion.id,
        equiposAsignaciones: asignaciones,
        ...billingData,
        ...(deudaPreconfirmada && { confirmarConDeudaPendiente: true }),
      });

      // Remove nota from local state
      invalidateNotas();
      setNotaForAsignacion(null);
      // Show success dialog
      setCreatedFactura(factura);
      setFacturaSuccessDialogOpen(true);
    } catch (err: any) {
      console.error("Error converting to factura with equipos:", err);
      const deudaData = parseDeudaError(err);
      if (deudaData) {
        const notaId = notaForAsignacion.id;
        setDeudaError(deudaData);
        pendingDeudaRef.current = async () => {
          try {
            setError(null);
            const retryBillingData = pendingBillingDataRef.current ?? {};
            pendingBillingDataRef.current = null;
            const facturaRetry = await documentoApi.convertToFactura({
              notaPedidoId: notaId,
              equiposAsignaciones: asignaciones,
              ...retryBillingData,
              confirmarConDeudaPendiente: true,
            });
            invalidateNotas();
            setNotaForAsignacion(null);
            setCreatedFactura(facturaRetry);
            setFacturaSuccessDialogOpen(true);
          } catch (retryErr: any) {
            setError(retryErr?.response?.data?.message || retryErr?.message || "Error desconocido al convertir a factura");
          }
        };
        return;
      }
      const errorMessage = err?.response?.data?.message || err?.message || "Error desconocido al convertir a factura";
      setError(errorMessage);
    }
  }, [notaForAsignacion, invalidateNotas]);

  const handleCloseAsignarEquiposDialog = useCallback(() => {
    setAsignarEquiposDialogOpen(false);
    setNotaForAsignacion(null);
  }, []);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <LoadingOverlay
        open={loading || formLoading}
        message={formLoading ? "Convirtiendo presupuesto..." : "Cargando notas de pedido..."}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Notas de Pedido
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenConvertDialog}
          disabled={loading || presupuestos.length === 0}
        >
          Convertir Presupuesto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {presupuestos.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No hay presupuestos pendientes disponibles para convertir en Nota de Pedido.
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Typography variant="h6">Filtros</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Buscar"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número, cliente..."
            />
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(e) => setStatusFilter(e.target.value as EstadoDocumento)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={EstadoDocumentoEnum.PENDIENTE}>Pendiente</MenuItem>
                <MenuItem value={EstadoDocumentoEnum.APROBADO}>Aprobado</MenuItem>
                <MenuItem value={EstadoDocumentoEnum.PAGADA}>Pagada</MenuItem>
                <MenuItem value={EstadoDocumentoEnum.VENCIDA}>Vencida</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Cliente</InputLabel>
              <Select
                value={clientFilter}
                label="Cliente"
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                {clientes.map((client) => (
                  <MenuItem key={client.id} value={client.id.toString()}>
                    {client.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Desde"
              type="date"
              size="small"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Hasta"
              type="date"
              size="small"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 120 }}>Número</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Cliente</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Fecha Emisión</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Fecha Vencimiento</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Financiamiento</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>Total</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Creado por</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notasPedido.map((nota) => {
                  const selectedFinancing = getSelectedFinancingOption(nota);
                  return (
                  <TableRow key={nota.id}>
                    <TableCell>{nota.numeroDocumento}</TableCell>
                    <TableCell>{nota.clienteNombre}</TableCell>
                    <TableCell>{new Date(nota.fechaEmision).toLocaleDateString("es-AR")}</TableCell>
                    <TableCell>
                      {nota.fechaVencimiento
                        ? new Date(nota.fechaVencimiento).toLocaleDateString("es-AR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: '160px' }}>
                        {selectedFinancing ? (
                          <Chip
                            label={selectedFinancing.nombre}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ) : (
                          <Chip
                            label={nota.metodoPago ? getMetodoPagoLabel(nota.metodoPago) : "Sin seleccionar"}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(nota.estado)}
                        color={getStatusColor(nota.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${nota.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <UsuarioBadge nombre={nota.usuarioCreadorPresupuestoNombre ?? null} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewNota(nota)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={nota.estado === EstadoDocumentoEnum.PENDIENTE ? 'Editar descuento y observaciones' : 'Solo se puede editar en estado PENDIENTE'}>
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEditDialog(nota)}
                            disabled={nota.estado !== EstadoDocumentoEnum.PENDIENTE}
                            aria-label={`Editar nota de pedido ${nota.numeroDocumento}`}
                          >
                            <EditIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={nota.estado === EstadoDocumentoEnum.APROBADO ? 'Convertir a Factura' : 'Solo se puede facturar una nota APROBADA'}>
                        <span>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleOpenBillingDialog(nota)}
                            disabled={nota.estado !== EstadoDocumentoEnum.APROBADO}
                          >
                            <ReceiptIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Exportar PDF">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleExportarPDF(nota)}
                        >
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Opciones de financiamiento">
                        <IconButton size="small" color="secondary" onClick={() => handleOpenFinanciamiento(nota)}>
                          <PaymentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Enviar">
                        <IconButton size="small" color="primary">
                          <SendIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalNotasPedido}
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

          {notasPedido.length === 0 && !notasQuery.isLoading && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay notas de pedido registradas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Convierta un presupuesto aprobado para crear una nota de pedido
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenConvertDialog}
                disabled={presupuestos.length === 0}
              >
                Convertir Presupuesto
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Convert Dialog */}
      <Dialog
        open={convertDialogOpen}
        onClose={handleCloseConvertDialog}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: { xs: '100%', sm: '90vh' },
            m: { xs: 0, sm: 2 }
          }
        }}
      >
        <DialogTitle>Convertir Presupuesto a Nota de Pedido</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Autocomplete
              fullWidth
              options={presupuestos}
              value={presupuestos.find(p => p.id.toString() === convertForm.presupuestoId) || null}
              onChange={(_, newValue) => {
                handlePresupuestoSelect(newValue ? newValue.id.toString() : '');
              }}
              getOptionLabel={(option) => 
                `${option.numeroDocumento} - ${option.clienteNombre || option.leadNombre} - $${option.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
              }
              filterOptions={(options, { inputValue }) => {
                const searchTerm = inputValue.toLowerCase().trim();
                if (!searchTerm) return options;
                return options.filter(option => {
                  const numero = (option.numeroDocumento || '').toLowerCase();
                  const cliente = (option.clienteNombre || '').toLowerCase();
                  const lead = (option.leadNombre || '').toLowerCase();
                  return numero.includes(searchTerm) || cliente.includes(searchTerm) || lead.includes(searchTerm);
                });
              }}
              renderOption={({ key, ...props }, option) => (
                <Box component="li" key={key} {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {option.numeroDocumento} - {option.clienteNombre || option.leadNombre} - 
                      ${option.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </Typography>
                    {option.clienteNombre && (
                      <Chip label="Cliente" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                    )}
                    {option.leadNombre && (
                      <Chip label="Lead" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                    )}
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar Presupuesto"
                  placeholder="Escriba número de presupuesto o nombre de cliente/lead..."
                  margin="normal"
                  required
                  error={!convertForm.presupuestoId && formLoading}
                  helperText="Busque por número de presupuesto, nombre de cliente o lead"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              noOptionsText="No se encontraron presupuestos"
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />

            {selectedPresupuesto && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: "grey.50" }}>
                <Typography variant="subtitle2" gutterBottom>
                  Detalles del Presupuesto
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="body2">
                    {selectedPresupuesto.clienteNombre ? 'Cliente:' : 'Lead:'} {selectedPresupuesto.clienteNombre || selectedPresupuesto.leadNombre}
                  </Typography>
                  {selectedPresupuesto.clienteNombre && (
                    <Chip label="Cliente" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                  )}
                  {selectedPresupuesto.leadNombre && (
                    <Chip label="Lead" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                  )}
                </Box>
                <Typography variant="body2">
                  Fecha: {new Date(selectedPresupuesto.fechaEmision).toLocaleDateString("es-AR")}
                </Typography>
                <Typography variant="body2">
                  Total: ${selectedPresupuesto.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </Typography>
                {selectedPresupuesto.tipoIva && (
                  <Typography variant="body2">
                    Tipo de IVA: {getTipoIvaLabel(selectedPresupuesto.tipoIva as TipoIva)}
                  </Typography>
                )}
                {selectedPresupuesto.observaciones && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Observaciones: {selectedPresupuesto.observaciones}
                  </Typography>
                )}
              </Paper>
            )}

            {opcionesConvertDialog.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Opción de Financiamiento</Typography>
                <RadioGroup
                  value={selectedOpcionConvertId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedOpcionConvertId(id);
                    const opcion = opcionesConvertDialog.find(o => o.id === id);
                    if (opcion) setConvertForm(prev => ({ ...prev, metodoPago: opcion.metodoPago }));
                  }}
                >
                  {opcionesConvertDialog.map((opcion) => (
                    <Box key={opcion.id} sx={{ p: 1.5, border: '1px solid', borderColor: selectedOpcionConvertId === opcion.id ? 'primary.main' : 'divider', borderRadius: 1, mb: 1 }}>
                      <FormControlLabel value={opcion.id} control={<Radio />} label={
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            {getMetodoPagoIcon(opcion.metodoPago)}
                            <Typography variant="subtitle2">{opcion.nombre}</Typography>
                            {opcion.tasaInteres < 0 && (
                              <Chip size="small" color="success" label={`${Math.abs(opcion.tasaInteres)}% OFF`} />
                            )}
                          </Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5 }}>
                            <Typography variant="caption">Método: {getMetodoPagoLabel(opcion.metodoPago)}</Typography>
                            <Typography variant="caption">Cuotas: {opcion.cantidadCuotas}</Typography>
                            <Typography variant="caption">Cuota: ${opcion.montoCuota.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                            <Typography variant="caption">Total: ${opcion.montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                          </Box>
                          {opcion.descripcion && <Typography variant="caption" color="text.secondary">{opcion.descripcion}</Typography>}
                        </Box>
                      } />
                    </Box>
                  ))}
                </RadioGroup>
              </Box>
            ) : (
              <TextField
                fullWidth
                select
                label="Método de Pago"
                value={convertForm.metodoPago}
                onChange={(e) => setConvertForm(prev => ({
                  ...prev,
                  metodoPago: e.target.value as MetodoPago
                }))}
                margin="normal"
                required
              >
                <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                <MenuItem value="TARJETA_CREDITO">Tarjeta de Crédito</MenuItem>
                <MenuItem value="TARJETA_DEBITO">Tarjeta de Débito</MenuItem>
                <MenuItem value="TRANSFERENCIA">Transferencia Bancaria</MenuItem>
                <MenuItem value="CHEQUE">Cheque</MenuItem>
                <MenuItem value="FINANCIAMIENTO">Financiamiento</MenuItem>
                <MenuItem value="CUENTA_CORRIENTE">Cuenta Corriente</MenuItem>
              </TextField>
            )}

            <TextField
              fullWidth
              select
              label="Tipo de IVA"
              value={convertForm.tipoIva}
              onChange={(e) => setConvertForm(prev => ({
                ...prev,
                tipoIva: e.target.value as TipoIva
              }))}
              margin="normal"
              required
              helperText={
                selectedPresupuesto?.tipoIva
                  ? `Heredado del presupuesto (${getTipoIvaLabel(selectedPresupuesto.tipoIva as TipoIva)}). Puede modificarse.`
                  : "Seleccione el tipo de IVA"
              }
            >
              <MenuItem value="IVA_21">IVA 21%</MenuItem>
              <MenuItem value="IVA_10_5">IVA 10.5%</MenuItem>
              <MenuItem value="EXENTO">Exento</MenuItem>
            </TextField>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mt: 1 }}>
              <TextField
                fullWidth
                select
                label="Tipo de descuento"
                value={convertForm.descuentoTipo}
                onChange={(e) => {
                  const next = e.target.value as TipoDescuento;
                  setConvertForm(prev => ({
                    ...prev,
                    descuentoTipo: next,
                    descuentoValor: next === 'NONE' ? 0 : prev.descuentoValor,
                  }));
                }}
                margin="normal"
              >
                <MenuItem value="NONE">Sin descuento</MenuItem>
                <MenuItem value="PORCENTAJE">Porcentaje (%)</MenuItem>
                <MenuItem value="MONTO_FIJO">Monto fijo ($)</MenuItem>
              </TextField>
              <TextField
                fullWidth
                type="number"
                label={convertForm.descuentoTipo === 'PORCENTAJE' ? 'Descuento (%)' : 'Descuento ($)'}
                value={convertForm.descuentoTipo === 'NONE' ? '' : convertForm.descuentoValor}
                onChange={(e) => {
                  const raw = parseFloat(e.target.value);
                  const valor = Number.isFinite(raw) ? Math.max(0, raw) : 0;
                  setConvertForm(prev => ({
                    ...prev,
                    descuentoValor: prev.descuentoTipo === 'PORCENTAJE' ? Math.min(100, valor) : valor,
                  }));
                }}
                inputProps={{
                  min: 0,
                  max: convertForm.descuentoTipo === 'PORCENTAJE' ? 100 : undefined,
                  step: convertForm.descuentoTipo === 'PORCENTAJE' ? 0.5 : 0.01,
                }}
                margin="normal"
                disabled={convertForm.descuentoTipo === 'NONE'}
              />
            </Box>

            {selectedPresupuesto && (() => {
              const baseSubtotal = selectedPresupuesto.subtotal ?? 0;
              const descAmt = convertForm.descuentoTipo === 'PORCENTAJE'
                ? baseSubtotal * (Math.min(100, Math.max(0, convertForm.descuentoValor || 0)) / 100)
                : convertForm.descuentoTipo === 'MONTO_FIJO'
                  ? Math.min(baseSubtotal, Math.max(0, convertForm.descuentoValor || 0))
                  : 0;
              const subNeto = Math.max(0, baseSubtotal - descAmt);
              const ivaRate = IVA_RATES[convertForm.tipoIva];
              const ivaAmt = subNeto * ivaRate;
              const totalPreview = subNeto + ivaAmt;
              return (
                <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>Resumen de totales</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">${baseSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                  </Box>
                  {descAmt > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="error.main">
                        Descuento {convertForm.descuentoTipo === 'PORCENTAJE' ? `(${convertForm.descuentoValor}%)` : '(monto fijo)'}:
                      </Typography>
                      <Typography variant="body2" color="error.main">-${descAmt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">IVA ({(ivaRate * 100).toFixed(ivaRate === 0.105 ? 1 : 0)}%):</Typography>
                    <Typography variant="body2">${ivaAmt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                      ${totalPreview.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Paper>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConvertDialog} disabled={formLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => handleConvertToNotaPedido()}
            disabled={formLoading || !convertForm.presupuestoId}
            startIcon={formLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {formLoading ? "Convirtiendo..." : "Convertir"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: { xs: '100%', sm: '90vh' },
            m: { xs: 0, sm: 2 }
          }
        }}
      >
        <DialogTitle>
          Nota de Pedido {selectedNota?.numeroDocumento}
        </DialogTitle>
        <DialogContent>
          {selectedNota && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography>{selectedNota.clienteNombre}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Usuario
                  </Typography>
                  <Typography>{selectedNota.usuarioNombre}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Emisión
                  </Typography>
                  <Typography>
                    {new Date(selectedNota.fechaEmision).toLocaleDateString("es-AR")}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Vencimiento
                  </Typography>
                  <Typography>
                    {selectedNota.fechaVencimiento 
                      ? new Date(selectedNota.fechaVencimiento).toLocaleDateString("es-AR")
                      : "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Método de Pago
                  </Typography>
                  <Typography>
                    {selectedNota.metodoPago ? getMetodoPagoLabel(selectedNota.metodoPago) : "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo de IVA
                  </Typography>
                  <Typography>
                    {selectedNota.tipoIva ? getTipoIvaLabel(selectedNota.tipoIva as TipoIva) : "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedNota.estado)}
                    color={getStatusColor(selectedNota.estado)}
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Observaciones
                  </Typography>
                  {!editingObsNota && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setObsNotaValue(selectedNota.observaciones ?? '');
                        setEditingObsNota(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                {editingObsNota ? (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={obsNotaValue}
                      onChange={(e) => setObsNotaValue(e.target.value)}
                      size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button size="small" variant="contained" onClick={handleSaveObsNota}>
                        Guardar
                      </Button>
                      <Button size="small" onClick={() => setEditingObsNota(false)}>
                        Cancelar
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography color={selectedNota.observaciones ? 'text.primary' : 'text.secondary'}>
                    {selectedNota.observaciones || 'Sin observaciones'}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Detalles
              </Typography>
              <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: { xs: 500, sm: 'auto' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 120 }}>Producto/Equipo</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Color</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Medida</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Descripción</TableCell>
                      <TableCell align="center" sx={{ minWidth: 80 }}>Cantidad</TableCell>
                      <TableCell align="right" sx={{ minWidth: 100 }}>Precio Unit.</TableCell>
                      <TableCell align="right" sx={{ minWidth: 100 }}>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedNota.detalles?.map((detalle: DetalleDocumento, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          {detalle.tipoItem === 'EQUIPO'
                            ? `${detalle.recetaNombre || ''} ${detalle.recetaModelo ? `- ${detalle.recetaModelo}` : ''}`
                            : detalle.productoNombre || "-"}
                        </TableCell>
                        <TableCell>{detalle.color?.nombre || '-'}</TableCell>
                        <TableCell>{detalle.medida?.nombre || '-'}</TableCell>
                        <TableCell>{detalle.descripcion}</TableCell>
                        <TableCell align="center">{detalle.cantidad}</TableCell>
                        <TableCell align="right">
                          ${detalle.precioUnitario.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right">
                          ${detalle.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography sx={{ mr: 4 }}>Subtotal:</Typography>
                    <Typography>
                      ${selectedNota.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography sx={{ mr: 4 }}>IVA:</Typography>
                    <Typography>
                      ${selectedNota.iva.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="h6" sx={{ mr: 4 }}>Total:</Typography>
                    <Typography variant="h6">
                      ${selectedNota.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Trazabilidad del flujo
              </Typography>
              <AuditoriaFlujo documento={selectedNota} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog: descuento + observaciones (solo PENDIENTE) */}
      <Dialog
        open={editDialogOpen}
        onClose={editLoading ? undefined : handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Editar Nota de Pedido {notaToEdit?.numeroDocumento}
        </DialogTitle>
        <DialogContent>
          {notaToEdit && (() => {
            const subtotal = Number(notaToEdit.subtotal) || 0;
            const tipo = editForm.descuentoTipo;
            const valor = editForm.descuentoValor;
            let descuentoMonto = 0;
            if (tipo === 'PORCENTAJE') {
              const pct = Math.min(100, Math.max(0, valor || 0));
              descuentoMonto = subtotal * (pct / 100);
            } else if (tipo === 'MONTO_FIJO') {
              descuentoMonto = Math.min(subtotal, Math.max(0, valor || 0));
            }
            const subtotalNeto = Math.max(0, subtotal - descuentoMonto);
            const tipoIvaActual = (notaToEdit as any).tipoIva || 'IVA_21';
            const ivaPct = tipoIvaActual === 'IVA_21' ? 0.21 : tipoIvaActual === 'IVA_10_5' ? 0.105 : 0;
            const ivaPreview = subtotalNeto * ivaPct;
            const totalPreview = subtotalNeto + ivaPreview;
            return (
              <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="info">
                  Solo podés editar descuento y observaciones cuando la nota está en PENDIENTE.
                  Cambiar el descuento regenera las opciones de financiamiento.
                </Alert>
                <FormControl size="small" fullWidth>
                  <InputLabel>Tipo de descuento</InputLabel>
                  <Select
                    label="Tipo de descuento"
                    value={editForm.descuentoTipo}
                    onChange={(e) => {
                      const next = e.target.value as 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO';
                      setEditForm((prev) => ({
                        ...prev,
                        descuentoTipo: next,
                        descuentoValor: next === 'NONE' ? 0 : prev.descuentoValor,
                      }));
                    }}
                  >
                    <MenuItem value="NONE">Sin descuento</MenuItem>
                    <MenuItem value="PORCENTAJE">Porcentaje</MenuItem>
                    <MenuItem value="MONTO_FIJO">Monto fijo</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  type="number"
                  label={editForm.descuentoTipo === 'PORCENTAJE' ? 'Descuento (%)' : 'Descuento ($)'}
                  value={editForm.descuentoTipo === 'NONE' ? '' : editForm.descuentoValor}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setEditForm((prev) => ({
                      ...prev,
                      descuentoValor: prev.descuentoTipo === 'PORCENTAJE' ? Math.min(100, v) : v,
                    }));
                  }}
                  disabled={editForm.descuentoTipo === 'NONE'}
                  inputProps={{
                    min: 0,
                    max: editForm.descuentoTipo === 'PORCENTAJE' ? 100 : undefined,
                    step: editForm.descuentoTipo === 'PORCENTAJE' ? 0.5 : 0.01,
                  }}
                  error={editForm.descuentoTipo === 'MONTO_FIJO' && editForm.descuentoValor > subtotal}
                  helperText={
                    editForm.descuentoTipo === 'MONTO_FIJO' && editForm.descuentoValor > subtotal
                      ? `El descuento no puede superar el subtotal (${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })})`
                      : ' '
                  }
                  fullWidth
                />
                <TextField
                  size="small"
                  label="Observaciones"
                  value={editForm.observaciones}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                />
                <Divider />
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">
                      ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  {tipo !== 'NONE' && descuentoMonto > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        Descuento {tipo === 'PORCENTAJE' ? `(${valor}%)` : '(monto fijo)'}:
                      </Typography>
                      <Typography variant="body2" color="error.main">
                        -${descuentoMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">
                      IVA ({tipoIvaActual === 'IVA_21' ? '21%' : tipoIvaActual === 'IVA_10_5' ? '10.5%' : '0%'}):
                    </Typography>
                    <Typography variant="body2">
                      ${ivaPreview.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight={600}>Total estimado:</Typography>
                    <Typography variant="subtitle1" fontWeight={600}>
                      ${totalPreview.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    El backend recalcula el total exacto al guardar.
                  </Typography>
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={editLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={
              editLoading ||
              (editForm.descuentoTipo === 'MONTO_FIJO' &&
                editForm.descuentoValor > (Number(notaToEdit?.subtotal) || 0))
            }
          >
            {editLoading ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AsignarEquiposDialog for Factura conversion */}
      {notaForAsignacion && (
        <AsignarEquiposDialog
          open={asignarEquiposDialogOpen}
          onClose={handleCloseAsignarEquiposDialog}
          onConfirm={handleConfirmAsignacion}
          detallesEquipo={notaForAsignacion.detalles?.filter(d => d.tipoItem === 'EQUIPO') || []}
          clienteId={notaForAsignacion.clienteId ?? undefined}
          notaPedidoId={notaForAsignacion.id}
        />
      )}

      {/* Success Dialog - Nota de Pedido Creada */}
      <SuccessDialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          setCreatedNota(null);
        }}
        title="¡Nota de Pedido Creada Exitosamente!"
        message="La nota de pedido ha sido generada correctamente"
        details={(() => {
          if (!createdNota) return [];
          const selectedOpcion = createdNota.id != null
            ? (notasFinanciamiento[createdNota.id] ?? []).find(o => o.esSeleccionada || o.id === createdNota.opcionFinanciamientoSeleccionadaId)
            : undefined;
          return [
            { label: 'Número de Documento', value: createdNota.numeroDocumento },
            { label: 'Cliente', value: createdNota.clienteNombre || '-' },
            { label: 'Total del producto', value: `$${createdNota.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
            ...(selectedOpcion && selectedOpcion.tasaInteres > 0
              ? [{ label: 'Financiamiento', value: `${selectedOpcion.cantidadCuotas} cuotas · ${selectedOpcion.tasaInteres}% interés (interés aplicado al momento de facturar)` }]
              : []),
          ];
        })()}
      />

      {/* Success Dialog - Factura Creada */}
      <SuccessDialog
        open={facturaSuccessDialogOpen}
        onClose={() => {
          setFacturaSuccessDialogOpen(false);
          setCreatedFactura(null);
          setFacturaTotalConFinanciamiento(null);
        }}
        title="¡Factura Creada Exitosamente!"
        message="La nota de pedido ha sido facturada correctamente"
        details={createdFactura ? [
          { label: 'Número de Factura', value: createdFactura.numeroDocumento },
          { label: 'Cliente', value: createdFactura.clienteNombre || '-' },
          { label: facturaTotalConFinanciamiento != null ? 'Total con financiamiento' : 'Total', value: `$${(facturaTotalConFinanciamiento ?? createdFactura.total)?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
        ] : []}
      />

      {/* Lead Conversion Dialog */}
      <Dialog
        open={leadConversionDialogOpen}
        onClose={() => setLeadConversionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          ⚠️ Conversión de Lead a Cliente Requerida
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Este presupuesto está asociado a un <strong>Lead</strong> y no puede convertirse a Nota de Pedido directamente.
            </Alert>
            
            <Box sx={{ my: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Lead a convertir:
              </Typography>
              <Typography variant="body1">
                <strong>{leadToConvert?.leadNombre}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {leadToConvert?.leadId}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Para continuar con la creación de la Nota de Pedido, primero debe convertir este lead a cliente 
              completando toda su información (datos fiscales, dirección, etc.).
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>📋 Pasos a seguir:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                <ol style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                  <li>Haga clic en "Ir a Leads" para abrir la página de gestión de leads</li>
                  <li>Complete todos los datos del cliente (CUIT, dirección, condición fiscal, etc.)</li>
                  <li>Confirme la conversión del lead a cliente</li>
                  <li>Regrese a esta página y los presupuestos se actualizarán automáticamente</li>
                </ol>
              </Typography>
            </Alert>

            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>✅ Después de la conversión:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ marginTop: 4, marginBottom: 0 }}>
                  <li>El lead se convertirá en un cliente completo</li>
                  <li>Todos los presupuestos asociados al lead se vincularán automáticamente al nuevo cliente</li>
                  <li>Podrá crear notas de pedido y facturas normalmente</li>
                </ul>
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setLeadConversionDialogOpen(false);
              setLeadToConvert(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // Navigate directly to lead conversion page
              navigate(`/leads/${leadToConvert?.leadId}/convertir`);
              // Close dialog
              setLeadConversionDialogOpen(false);
              setLeadToConvert(null);
            }}
          >
            Convertir Lead a Cliente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for equipment creation messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={8000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', whiteSpace: 'pre-line' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Deuda cliente confirmation dialog */}
      <DeudaClienteConfirmDialog
        open={deudaError !== null}
        error={deudaError}
        onConfirm={handleDeudaConfirm}
        onCancel={handleDeudaCancel}
      />
      {/* Billing Dialog for FINANCIAMIENTO */}
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
              const montoTotal = notaToBill?.subtotal ?? 0;
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

      {/* Dialog: Opciones de Financiamiento */}
      <Dialog
        open={financiamientoDialogOpen}
        onClose={() => setFinanciamientoDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { maxHeight: { xs: '100%', sm: '90vh' }, m: { xs: 0, sm: 2 } } }}
      >
        <DialogTitle>
          Opciones de Financiamiento
          <Typography variant="body2" color="text.secondary">Seleccione la opción de pago preferida</Typography>
        </DialogTitle>
        <DialogContent>
          {notaParaFinanciamiento && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Nota de Pedido: {notaParaFinanciamiento.numeroDocumento}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {notaParaFinanciamiento.clienteNombre ? 'Cliente:' : 'Lead:'} {notaParaFinanciamiento.clienteNombre || notaParaFinanciamiento.leadNombre}
                </Typography>
              </Box>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>Subtotal: ${notaParaFinanciamiento.subtotal?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
            </Box>
          )}
          <Divider sx={{ mb: 2 }} />
          {loadingOpciones ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Cargando opciones de financiamiento…
              </Typography>
            </Box>
          ) : opcionesFinanciamiento.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No hay opciones de financiamiento disponibles para este documento.</Typography>
          ) : (
            <RadioGroup value={selectedOpcionId} onChange={(e) => setSelectedOpcionId(Number(e.target.value))}>
              {opcionesFinanciamiento.map((opcion) => {
                const isSelected = selectedOpcionId === opcion.id;
                return (
                  <Box
                    key={opcion.id}
                    onClick={() => opcion.id != null && setSelectedOpcionId(opcion.id)}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      mb: 1.5,
                      cursor: 'pointer',
                      transition: 'border-color 120ms, background-color 120ms',
                      bgcolor: isSelected ? 'action.selected' : 'background.paper',
                      '&:hover': { borderColor: 'primary.light' },
                    }}
                  >
                    <FormControlLabel
                      value={opcion.id}
                      control={<Radio />}
                      sx={{ width: '100%', alignItems: 'flex-start', m: 0, '& .MuiFormControlLabel-label': { width: '100%' } }}
                      label={
                        <OpcionFinanciamientoLabel
                          opcion={opcion}
                          baseImporte={notaParaFinanciamiento?.subtotal ?? 0}
                        />
                      }
                    />
                  </Box>
                );
              })}
            </RadioGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinanciamientoDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSelectOpcion} variant="contained" disabled={!selectedOpcionId}>
            Confirmar selección
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotasPedidoPage;

