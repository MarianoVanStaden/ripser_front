import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "../../hooks/useDebounce";
import { useLeadSearch } from "../../hooks/useLeadSearch";
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
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  Autocomplete,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { clienteApi, usuarioApi, productApi } from "../../api/services";
import { documentoApi } from "../../api/services/documentoApi";
import { recetaFabricacionApi } from "../../api/services/recetaFabricacionApi";
import opcionFinanciamientoApi from "../../api/services/opcionFinanciamientoApi";
import { prestamoPersonalApi } from "../../api/services/prestamoPersonalApi";
import { cuentaCorrienteApi } from "../../api/services/cuentaCorrienteApi";
import type { DocumentoComercial, Cliente, Usuario, Producto, EstadoDocumento, DetalleDocumento, OpcionFinanciamientoDTO, MetodoPago, RecetaFabricacionDTO, TipoItemDocumento, Lead, DeudaClienteError } from "../../types";
import { EstadoDocumento as EstadoDocumentoEnum } from "../../types";
import ColorPicker from "../common/ColorPicker";
import LoadingOverlay from "../common/LoadingOverlay";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import SuccessDialog from "../common/SuccessDialog";
import { generarPresupuestoPDF } from "../../services/pdfService";
import OpcionFinanciamientoLabel from "./OpcionFinanciamientoLabel";
import { getMetodoPagoLabel as getMetodoPagoLabelShared } from "../../utils/financiamiento";
import AuditoriaFlujo from "../common/AuditoriaFlujo";
import UsuarioBadge from "../common/UsuarioBadge";
import DeudaClienteConfirmDialog from "./DeudaClienteConfirmDialog";
import ClienteAutocomplete from "../common/ClienteAutocomplete";

const normalizeOpcionesFinanciamiento = (opciones?: Array<Partial<OpcionFinanciamientoDTO> & { esSeleccionada?: boolean; metodoPago?: MetodoPago | string }>): OpcionFinanciamientoDTO[] => {
  if (!Array.isArray(opciones)) return [];
  return opciones
    .filter((opcion): opcion is Partial<OpcionFinanciamientoDTO> & { esSeleccionada?: boolean; metodoPago?: MetodoPago | string } => Boolean(opcion))
    .map((opcion) => ({
      id: opcion.id,
      nombre: opcion.nombre ?? "",
      metodoPago: (opcion.metodoPago ?? "OTRO") as MetodoPago,
      cantidadCuotas: opcion.cantidadCuotas ?? 0,
      tasaInteres: opcion.tasaInteres ?? 0,
      montoTotal: opcion.montoTotal ?? 0,
      montoCuota: opcion.montoCuota ?? 0,
      descripcion: opcion.descripcion,
      ordenPresentacion: opcion.ordenPresentacion,
      esSeleccionada: opcion.esSeleccionada,
    }));
};

interface DetalleForm {
  id?: number;
  tipoItem: TipoItemDocumento;
  // For PRODUCTO type
  productoId?: string;
  // For EQUIPO type
  recetaId?: string;
  /** FK to the colores catalog (see ColoresContext). */
  colorId?: number;
  /** Cached display name of the color, populated from the response or
   *  the cached catalog. The backend is the source of truth via colorId. */
  colorNombre?: string;
  /** Cached medida id and display name. Derived from the recipe; never user-editable. */
  medidaId?: number;
  medidaNombre?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

type TipoDescuento = 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO';

interface FormData {
  clienteId: string;
  leadId: string;
  usuarioId: string;
  fechaEmision: string;
  observaciones: string;
  estado: EstadoDocumento;
  tipoIva: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
  descuentoTipo: TipoDescuento;
  descuentoValor: number;
}

const initialFormData: FormData = {
  clienteId: "",
  leadId: "",
  usuarioId: "",
  fechaEmision: new Date().toISOString().split("T")[0],
  observaciones: "",
  estado: EstadoDocumentoEnum.PENDIENTE,
  tipoIva: 'EXENTO',
  descuentoTipo: 'NONE',
  descuentoValor: 0,
};

const initialDetalle: DetalleForm = {
  tipoItem: 'EQUIPO',
  productoId: "",
  recetaId: "",
  colorId: undefined,
  colorNombre: undefined,
  medidaId: undefined,
  medidaNombre: undefined,
  descripcion: "",
  cantidad: 1,
  precioUnitario: 0,
  subtotal: 0,
};

const formatCurrency = (value: number | null | undefined): string =>
  `$${Number(value ?? 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

const computeIva = (presupuesto: DocumentoComercial): number => {
  if (typeof presupuesto.iva === 'number' && !Number.isNaN(presupuesto.iva)) {
    return presupuesto.iva;
  }
  if (typeof presupuesto.subtotal === 'number' && typeof presupuesto.total === 'number') {
    const diff = presupuesto.total - presupuesto.subtotal;
    return Number.isFinite(diff) ? diff : 0;
  }
  return 0;
};

const PresupuestosPage: React.FC = () => {
  const { user } = useAuth();
  const { empresaId } = useTenant();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EstadoDocumento>(EstadoDocumentoEnum.PENDIENTE);
  const [clientFilter, setClientFilter] = useState<Cliente | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Main data states. `presupuestos` ahora viene de useQuery (paginado server-side).
  // `leads` se carga lazy con useQuery cuando se abre el dialog del form.
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Reset page=0 cuando cambian filtros (evita pedir página vacía).
  useEffect(() => {
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, clientFilter?.id, dateFromFilter, dateToFilter]);

  const presupuestosQueryKey = useMemo(() => ([
    'presupuestos',
    {
      page,
      size: rowsPerPage,
      busqueda: debouncedSearch.trim() || undefined,
      estado: statusFilter || undefined,
      clienteId: clientFilter?.id,
      fechaDesde: dateFromFilter || undefined,
      fechaHasta: dateToFilter || undefined,
      empresaId,
    }
  ] as const), [page, rowsPerPage, debouncedSearch, statusFilter, clientFilter, dateFromFilter, dateToFilter, empresaId]);

  const presupuestosQuery = useQuery({
    queryKey: presupuestosQueryKey,
    queryFn: () => documentoApi.getByTipoPaginated('PRESUPUESTO',
      { page, size: rowsPerPage, sort: 'fechaEmision,desc' },
      {
        ...(debouncedSearch.trim() ? { busqueda: debouncedSearch.trim() } : {}),
        ...(statusFilter ? { estado: statusFilter } : {}),
        ...(clientFilter?.id ? { clienteId: clientFilter.id } : {}),
        ...(dateFromFilter ? { fechaDesde: dateFromFilter } : {}),
        ...(dateToFilter ? { fechaHasta: dateToFilter } : {}),
      }
    ),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const presupuestos: DocumentoComercial[] = useMemo(
    () => presupuestosQuery.data?.content ?? [],
    [presupuestosQuery.data]
  );
  const totalPresupuestos = presupuestosQuery.data?.totalElements ?? 0;
  const invalidatePresupuestos = useCallback(
    () => { queryClient.invalidateQueries({ queryKey: ['presupuestos'] }); },
    [queryClient]
  );

  const [leads, setLeads] = useState<Lead[]>([]);
  // Cliente seleccionado en el formulario (typeahead). Se carga on-demand.
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [destinatarioMode, setDestinatarioMode] = useState<'CLIENTE' | 'LEAD'>('CLIENTE');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<RecetaFabricacionDTO[]>([]);
  const [tipoEquipoFiltro, setTipoEquipoFiltro] = useState<'' | 'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO'>('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPresupuesto, setEditingPresupuesto] = useState<DocumentoComercial | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [detalles, setDetalles] = useState<DetalleForm[]>([]);
  const [readOnly, setReadOnly] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState<'close' | 'create' | null>(null);
  
  // Financiamiento UI state
  const [financiamientoDialogOpen, setFinanciamientoDialogOpen] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<DocumentoComercial | null>(null);
  const [opcionesFinanciamiento, setOpcionesFinanciamiento] = useState<OpcionFinanciamientoDTO[]>([]);
  const [selectedOpcionId, setSelectedOpcionId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const [presupuestosFinanciamiento, setPresupuestosFinanciamiento] = useState<Record<number, OpcionFinanciamientoDTO[]>>({});
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdPresupuesto, setCreatedPresupuesto] = useState<DocumentoComercial | null>(null);

  // Deuda cliente confirmation
  const [deudaError, setDeudaError] = useState<DeudaClienteError | null>(null);
  const pendingDeudaRef = useRef<(() => void) | null>(null);
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
    setConfirmDialogOpen(false);
    setConfirmDialogAction(null);
    setDialogOpen(false);
    setEditingPresupuesto(null);
    setFormData(initialFormData);
    setDetalles([]);
    setHasUnsavedChanges(false);
  }, []);

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
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )[0];
      const saldo = lastMovement?.saldo ?? 0;
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
    } catch (err) {
      console.warn('No se pudo verificar deuda del cliente de forma preventiva:', err);
      return null;
    }
  }, []);

  // Main fetch data function — solo carga datos accesorios para el form
  // (usuarios, productos, recetas). Presupuestos se manejan con useQuery
  // server-side (ver presupuestosQuery arriba). Leads se cargan lazy al abrir
  // el dialog (ver leadsQuery más abajo) en lugar de traerlos todos al mount.
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [usuariosData, productosData, recetasData] = await Promise.all([
        usuarioApi.getVendedores().catch(() => []),
        productApi.getAll({ page: 0, size: 10000 }).then(res => res.content).catch((err) => {
          console.error("Error fetching productos:", err);
          setError("Error al cargar productos: " + (err.response?.data?.message || err.message));
          return [];
        }),
        recetaFabricacionApi.findDisponiblesParaVenta().then(res => res).catch((err) => {
          console.error("Error fetching recetas:", err);
          setError("Error al cargar recetas de equipos: " + (err.response?.data?.message || err.message));
          return [];
        }),
      ]);

      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
      setRecetas(Array.isArray(recetasData) ? recetasData : []);
      setProductos(Array.isArray(productosData) ? productosData : []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar los datos: " + (err instanceof Error ? err.message : "Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, [empresaId]); // Re-fetch when tenant changes

  // Map de opciones de financiamiento embebidas: lo derivamos de la página
  // visible cada vez que llega data nueva. Antes vivía en un useState que se
  // poblaba en el fetch global; ahora el server pagina y queda en sync solo.
  useEffect(() => {
    if (!presupuestos.length) return;
    setPresupuestosFinanciamiento((prev) => {
      const next = { ...prev };
      let mutated = false;
      for (const presupuesto of presupuestos) {
        const normalizadas = normalizeOpcionesFinanciamiento((presupuesto as any).opcionesFinanciamiento);
        if (normalizadas.length > 0 && !next[presupuesto.id]) {
          next[presupuesto.id] = normalizadas;
          mutated = true;
        }
      }
      return mutated ? next : prev;
    });
  }, [presupuestos]);

  // Typeahead server-side de leads para el Autocomplete del form.
  // Antes esto cargaba 500 leads no convertidos al abrir el dialog (limitación
  // documentada en TECHNICAL_DEBT.md). Ahora busca en el server con debounce.
  const leadSearch = useLeadSearch({ excludeEstados: ['CONVERTIDO'], size: 20 });
  // Mantenemos el state `leads` como union de:
  //   - opciones del typeahead (lo que el usuario está buscando ahora)
  //   - el lead seleccionado actualmente (para que value={...} no sea null si
  //     viene de un presupuesto en edición que no figura en la búsqueda actual)
  useEffect(() => {
    setLeads((prev) => {
      const map = new Map(prev.map((l) => [l.id, l]));
      for (const l of leadSearch.options) if (l.id != null) map.set(l.id, l);
      return Array.from(map.values());
    });
  }, [leadSearch.options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtros y paginación se ejecutan ahora en el server (presupuestosQuery).
  // `presupuestos` ya viene como la página actual. Mantenemos los nombres de
  // variables que el JSX usa abajo para no tocar la UI.

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
      case EstadoDocumentoEnum.RECHAZADO: return "error";
      case EstadoDocumentoEnum.FACTURADA: return "info";
      default: return "default";
    }
  }, []);

  const getStatusLabel = useCallback((estado: EstadoDocumento): string => {
    switch (estado) {
      case EstadoDocumentoEnum.PENDIENTE: return "Pendiente";
      case EstadoDocumentoEnum.APROBADO: return "Aprobado";
      case EstadoDocumentoEnum.RECHAZADO: return "Rechazado";
      case EstadoDocumentoEnum.FACTURADA: return "Facturada";
      default: return estado;
    }
  }, []);

  // Calculate IVA based on selected type
  const getIvaPercentage = useCallback((tipoIva: 'IVA_21' | 'IVA_10_5' | 'EXENTO'): number => {
    switch (tipoIva) {
      case 'IVA_21': return 0.21;
      case 'IVA_10_5': return 0.105;
      case 'EXENTO': return 0;
      default: return 0.21;
    }
  }, []);

  // Helper function to get selected financing option for a presupuesto
  const getSelectedFinancingOption = useCallback((presupuesto: DocumentoComercial): OpcionFinanciamientoDTO | undefined => {
    const opcionesGuardadas = presupuestosFinanciamiento[presupuesto.id] || [];
    const selectedId = presupuesto.opcionFinanciamientoSeleccionadaId;

    if (selectedId) {
      const optionFromMap = opcionesGuardadas.find((opcion) => opcion.id === selectedId);
      if (optionFromMap) return optionFromMap;
    }

    const selectedByFlagInMap = opcionesGuardadas.find((opcion) => opcion.esSeleccionada);
    if (selectedByFlagInMap) return selectedByFlagInMap;

    const opcionesEmbebidas = normalizeOpcionesFinanciamiento((presupuesto as any).opcionesFinanciamiento);
    if (selectedId) {
      const optionFromEmbedded = opcionesEmbebidas.find((opcion) => opcion.id === selectedId);
      if (optionFromEmbedded) return optionFromEmbedded;
    }

    return opcionesEmbebidas.find((opcion) => opcion.esSeleccionada);
  }, [presupuestosFinanciamiento]);

  const subtotal = useMemo(() => detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0), [detalles]);
  const descuentoAmount = useMemo(() => {
    if (formData.descuentoTipo === 'PORCENTAJE') {
      const pct = Math.min(100, Math.max(0, formData.descuentoValor || 0));
      return subtotal * (pct / 100);
    }
    if (formData.descuentoTipo === 'MONTO_FIJO') {
      return Math.min(subtotal, Math.max(0, formData.descuentoValor || 0));
    }
    return 0;
  }, [subtotal, formData.descuentoTipo, formData.descuentoValor]);
  const subtotalNeto = useMemo(() => Math.max(0, subtotal - descuentoAmount), [subtotal, descuentoAmount]);
  const ivaAmount = useMemo(() => subtotalNeto * getIvaPercentage(formData.tipoIva), [subtotalNeto, formData.tipoIva, getIvaPercentage]);
  const total = useMemo(() => subtotalNeto + ivaAmount, [subtotalNeto, ivaAmount]);

  // Re-export desde utils compartido para consumidores que solo necesitan el label
  const getMetodoPagoLabel = getMetodoPagoLabelShared;

  const addDetalle = useCallback(() => {
    if (readOnly) return;
    setDetalles((prev) => [...prev, { ...initialDetalle }]);
    setHasUnsavedChanges(true);
  }, [readOnly]);

  const updateDetalle = useCallback((index: number, field: keyof DetalleForm, value: string | number) => {
    if (readOnly) return;
    setDetalles((prev) => {
      const newDetalles = [...prev];
      const detalle = newDetalles[index];

      if (field === "tipoItem") {
        detalle.tipoItem = value as TipoItemDocumento;
        // Reset item-specific fields when switching type
        detalle.productoId = "";
        detalle.recetaId = "";
        detalle.colorId = undefined;
        detalle.colorNombre = undefined;
        detalle.medidaId = undefined;
        detalle.medidaNombre = undefined;
        detalle.descripcion = "";
        detalle.precioUnitario = 0;
        detalle.subtotal = 0;
      } else if (field === "productoId") {
        detalle.productoId = value as string;
      } else if (field === "recetaId") {
        detalle.recetaId = value as string;
      } else if (field === "colorId") {
        const next = value === "" || value == null ? undefined : Number(value);
        detalle.colorId = next;
        detalle.colorNombre = undefined; // re-derived below from cache when needed
      } else if (field === "descripcion") {
        detalle.descripcion = value as string;
      } else if (field === "cantidad") {
        detalle.cantidad = Number(value) || 0;
      } else if (field === "precioUnitario") {
        detalle.precioUnitario = Number(value) || 0;
      }

      if (field === "cantidad" || field === "precioUnitario") {
        detalle.subtotal = detalle.cantidad * detalle.precioUnitario;
      }

      if (field === "productoId" && value) {
        const producto = productos.find((p) => p.id === Number(value));
        if (producto) {
          detalle.descripcion = producto.nombre;
          detalle.precioUnitario = producto.precio || 0;
          detalle.subtotal = detalle.cantidad * (producto.precio || 0);
        }
      }

      if (field === "recetaId" && value) {
        const receta = recetas.find((r) => r.id === Number(value));
        if (receta) {
          detalle.descripcion = `${receta.nombre} - ${receta.modelo || ''} (${receta.tipoEquipo})`;
          detalle.precioUnitario = receta.precioVenta || 0;
          detalle.subtotal = detalle.cantidad * (receta.precioVenta || 0);
          // La medida proviene siempre de la receta (no es editable por el usuario).
          detalle.medidaId = receta.medida?.id;
          detalle.medidaNombre = receta.medida?.nombre;
        }
      } else if (field === "recetaId" && !value) {
        detalle.medidaId = undefined;
        detalle.medidaNombre = undefined;
      }

      return newDetalles;
    });
    setHasUnsavedChanges(true);
  }, [readOnly, productos, recetas]);

  const removeDetalle = useCallback((index: number) => {
    if (readOnly) return;
    setDetalles((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  }, [readOnly]);

  const handleOpenDialog = useCallback((presupuesto?: DocumentoComercial, readOnlyMode = false) => {
    setReadOnly(readOnlyMode);
    setHasUnsavedChanges(false);
    if (presupuesto) {
      setEditingPresupuesto(presupuesto);
      setFormData({
        clienteId: presupuesto.clienteId?.toString() || "",
        leadId: (presupuesto as any).leadId?.toString() || "",
        usuarioId: presupuesto.usuarioId?.toString() || (user?.id ?? 0).toString(),
        fechaEmision: presupuesto.fechaEmision?.split("T")[0] || new Date().toISOString().split("T")[0],
        observaciones: presupuesto.observaciones || "",
        estado: presupuesto.estado,
        tipoIva: (presupuesto as any).tipoIva || 'IVA_21',
        descuentoTipo: (presupuesto.descuentoTipo as TipoDescuento) || 'NONE',
        descuentoValor: Number(presupuesto.descuentoValor) || 0,
      });
      setDestinatarioMode(presupuesto.clienteId ? 'CLIENTE' : 'LEAD');
      setSelectedCliente(null);
      if (presupuesto.clienteId) {
        // Resolver el cliente del backend para mostrar el nombre/razón social aunque no esté en cache local.
        clienteApi.getById(presupuesto.clienteId)
          .then(setSelectedCliente)
          .catch(() => setSelectedCliente(null));
      }
      setDetalles(
        Array.isArray(presupuesto.detalles)
          ? presupuesto.detalles.map((detalle: DetalleDocumento) => ({
              id: detalle.id,
              tipoItem: detalle.tipoItem,
              productoId: detalle.productoId?.toString() || "",
              recetaId: detalle.recetaId?.toString() || "",
              colorId: detalle.color?.id,
              colorNombre: detalle.color?.nombre,
              medidaId: detalle.medida?.id,
              medidaNombre: detalle.medida?.nombre,
              descripcion: detalle.descripcion || "",
              cantidad: detalle.cantidad,
              precioUnitario: detalle.precioUnitario,
              subtotal: detalle.subtotal,
            }))
          : []
      );
    } else {
      setEditingPresupuesto(null);
      setFormData({ ...initialFormData, usuarioId: (user?.id ?? 0).toString() });
      setDestinatarioMode('CLIENTE');
      setSelectedCliente(null);
      setDetalles([]);
    }
    setDialogOpen(true);
  }, [user]);

  const handleCloseDialog = useCallback(() => {
    if (hasUnsavedChanges && !readOnly) {
      setConfirmDialogAction('close');
      setConfirmDialogOpen(true);
    } else {
      setDialogOpen(false);
      setEditingPresupuesto(null);
      setFormData({ ...initialFormData, usuarioId: (user?.id ?? 0).toString() });
      setSelectedCliente(null);
      setDestinatarioMode('CLIENTE');
      setDetalles([]);
      setError(null);
      setHasUnsavedChanges(false);
      deudaYaConfirmadaRef.current = false;
    }
  }, [hasUnsavedChanges, user, readOnly]);

  const handleConfirmClose = useCallback(() => {
    setConfirmDialogOpen(false);
    setDialogOpen(false);
    setEditingPresupuesto(null);
    setFormData({ ...initialFormData, usuarioId: (user?.id ?? 0).toString() });
    setSelectedCliente(null);
    setDestinatarioMode('CLIENTE');
    setDetalles([]);
    setError(null);
    setHasUnsavedChanges(false);
    setConfirmDialogAction(null);
    deudaYaConfirmadaRef.current = false;
  }, [user]);

  const handleSavePresupuesto = useCallback(async () => {
    if (!user) {
      setError("Debe iniciar sesión");
      return;
    }

    // Show confirmation dialog before creating
    if (!editingPresupuesto && confirmDialogAction !== 'create') {
      setConfirmDialogAction('create');
      setConfirmDialogOpen(true);
      return;
    }

    const payload: any = {
      ...(formData.clienteId ? { clienteId: Number(formData.clienteId) } : {}),
      ...(formData.leadId ? { leadId: Number(formData.leadId) } : {}),
      usuarioId: Number(formData.usuarioId) || (user?.id ?? 0),
      observaciones: formData.observaciones,
      tipoIva: formData.tipoIva,
      descuentoTipo: formData.descuentoTipo,
      descuentoValor: formData.descuentoTipo === 'NONE' ? 0 : formData.descuentoValor,
      detalles: detalles.map((d) => {
        const baseDetalle: any = {
          tipoItem: d.tipoItem,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          descripcion: d.descripcion,
        };

        if (d.tipoItem === 'PRODUCTO') {
          baseDetalle.productoId = Number(d.productoId);
        } else if (d.tipoItem === 'EQUIPO') {
          baseDetalle.recetaId = Number(d.recetaId);
          baseDetalle.colorId = d.colorId ?? undefined;
          // medida no se envía: el backend la deriva de la receta.
        }

        return baseDetalle;
      }),
    };

    try {
      if (!formData.clienteId && !formData.leadId) {
        setError("Debe seleccionar un cliente o lead");
        return;
      }
      if (detalles.length === 0) {
        setError("Debe agregar al menos un detalle");
        return;
      }
      for (const detalle of detalles) {
        if (detalle.tipoItem === 'PRODUCTO') {
          if (!detalle.productoId || isNaN(Number(detalle.productoId)) || Number(detalle.productoId) <= 0) {
            setError("Todos los detalles de tipo PRODUCTO deben tener un producto válido");
            return;
          }
        } else if (detalle.tipoItem === 'EQUIPO') {
          if (!detalle.recetaId || isNaN(Number(detalle.recetaId)) || Number(detalle.recetaId) <= 0) {
            setError("Todos los detalles de tipo EQUIPO deben tener una receta válida");
            return;
          }
        }
        if (!detalle.descripcion.trim()) {
          setError("Todos los detalles deben tener una descripción");
          return;
        }
        if (detalle.cantidad <= 0) {
          setError("La cantidad debe ser mayor a 0");
          return;
        }
        if (detalle.precioUnitario <= 0) {
          setError("El precio unitario debe ser mayor a 0");
          return;
        }
      }

      // Pre-check de deuda del cliente antes de crear el presupuesto
      if (!editingPresupuesto && formData.clienteId && !deudaYaConfirmadaRef.current) {
        const deudaData = await checkClienteDeuda(Number(formData.clienteId));
        if (deudaData) {
          setDeudaError(deudaData);
          pendingDeudaRef.current = () => {
            deudaYaConfirmadaRef.current = true;
            handleSavePresupuesto();
          };
          return;
        }
      }

      setFormLoading(true);
      setError(null);

      let savedPresupuesto: DocumentoComercial;
      if (editingPresupuesto) {
        savedPresupuesto = await documentoApi.changeEstado(editingPresupuesto.id, formData.estado);
        const observacionesOriginales = editingPresupuesto.observaciones ?? '';
        if (formData.observaciones !== observacionesOriginales) {
          savedPresupuesto = await documentoApi.updateObservaciones(
            editingPresupuesto.id,
            formData.observaciones || null
          );
        }
      } else {
        try {
          savedPresupuesto = await documentoApi.createPresupuesto(payload);
        } catch (createErr: any) {
          const deudaData = parseDeudaError(createErr);
          if (deudaData) {
            setDeudaError(deudaData);
            pendingDeudaRef.current = () => {
              deudaYaConfirmadaRef.current = true;
              handleSavePresupuesto();
            };
            return;
          }
          throw createErr;
        }
      }
      invalidatePresupuestos();

      deudaYaConfirmadaRef.current = false;

      setConfirmDialogOpen(false);
      setConfirmDialogAction(null);
      handleConfirmClose();

      // Show success modal for new presupuestos, snackbar for updates
      if (editingPresupuesto) {
        setSnackbar({
          open: true,
          message: 'Presupuesto actualizado exitosamente',
          severity: 'success'
        });
      } else {
        setCreatedPresupuesto(savedPresupuesto);
        setSuccessDialogOpen(true);
      }
    } catch (err: unknown) {
      console.error("Error saving presupuesto:", err);
      let errorMessage = "Error al guardar el presupuesto";
      if (typeof err === 'object' && err && 'response' in err) {
        type Resp = { data?: unknown; status?: number };
        const r = (err as { response?: Resp }).response;
        if (r?.data) {
          const data = r.data as Record<string, unknown>;
          if (typeof data.message === 'string') errorMessage = data.message;
          else if (typeof data.error === 'string') errorMessage = `${data.error}: ${typeof data.message === 'string' ? data.message : ''}`;
          else errorMessage = `Error ${r.status}: ${JSON.stringify(r.data)}`;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setConfirmDialogOpen(false);
      setConfirmDialogAction(null);
    } finally {
      setFormLoading(false);
    }
  }, [user, formData, detalles, editingPresupuesto, confirmDialogAction, handleConfirmClose, checkClienteDeuda]);

  // Financiamiento handlers
  const handleOpenFinanciamiento = useCallback(async (presupuesto: DocumentoComercial) => {
    setSelectedPresupuesto(presupuesto);
    setFinanciamientoDialogOpen(true);

    let opciones = presupuestosFinanciamiento[presupuesto.id] ?? [];

    if (opciones.length === 0) {
      try {
        opciones = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(presupuesto.id);
        if (opciones.length > 0) {
          setPresupuestosFinanciamiento(prev => ({ ...prev, [presupuesto.id]: opciones }));
        }
      } catch (error) {
        console.error('Error fetching financing options:', error);
      }
    }

    setOpcionesFinanciamiento(opciones);
    const seleccionada = opciones.find(o => o.id === presupuesto.opcionFinanciamientoSeleccionadaId)
      ?? opciones.find(o => o.esSeleccionada);
    setSelectedOpcionId(presupuesto.opcionFinanciamientoSeleccionadaId || (seleccionada?.id ?? null));
  }, [presupuestosFinanciamiento]);

  const handleSelectOpcion = useCallback(async () => {
    if (!selectedPresupuesto || !selectedOpcionId) return;
    try {
      await documentoApi.selectFinanciamiento(selectedPresupuesto.id, selectedOpcionId);

      // Refresca el listado server-side.
      invalidatePresupuestos();

      // Mantiene el cache local de financiamiento por presupuesto (evita re-fetch
      // del subsidiario al reabrir el dialog).
      setPresupuestosFinanciamiento(prev => ({
        ...prev,
        [selectedPresupuesto.id]: opcionesFinanciamiento
      }));

      setSnackbar({ open: true, message: 'Financiamiento seleccionado', severity: 'success' });
      setFinanciamientoDialogOpen(false);
    } catch (e) {
      console.error('Error seleccionando opción:', e);
      setSnackbar({ open: true, message: 'No se pudo seleccionar la opción', severity: 'error' });
    }
  }, [selectedPresupuesto, selectedOpcionId, opcionesFinanciamiento]);

  // Handler para exportar presupuesto a PDF
  const handleExportarPDF = useCallback(async (presupuesto: DocumentoComercial) => {
    try {
      if (!presupuesto.clienteId) {
        setSnackbar({
          open: true,
          message: 'Este presupuesto no tiene cliente asociado',
          severity: 'error'
        });
        return;
      }
      // Traer el cliente completo del backend (no se cachea localmente para soportar +700 clientes)
      const cliente = await clienteApi.getById(presupuesto.clienteId);

      // Obtener las opciones de financiamiento del presupuesto (ya embebidas en la respuesta del backend)
      const opciones: OpcionFinanciamientoDTO[] = presupuestosFinanciamiento[presupuesto.id] ?? [];

      // Generar el PDF
      generarPresupuestoPDF({
        presupuesto,
        cliente,
        opcionesFinanciamiento: opciones
      });

      setSnackbar({
        open: true,
        message: 'PDF generado exitosamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setSnackbar({
        open: true,
        message: 'Error al generar el PDF',
        severity: 'error'
      });
    }
  }, [presupuestosFinanciamiento]);

  // El reload manual ahora es: invalidatePresupuestos() (ver useQuery arriba).

  const recetasCountPorTipo = useMemo(() => {
    const counts: Record<'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO', number> = {
      HELADERA: 0, COOLBOX: 0, EXHIBIDOR: 0, OTRO: 0,
    };
    recetas.forEach((r) => {
      const t = r.tipoEquipo as 'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO' | undefined;
      if (t && t in counts) counts[t]++;
    });
    return counts;
  }, [recetas]);

  const recetasFiltradasPorTipo = useMemo(
    () => (tipoEquipoFiltro ? recetas.filter((r) => r.tipoEquipo === tipoEquipoFiltro) : recetas),
    [recetas, tipoEquipoFiltro]
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <LoadingOverlay
        open={loading || formLoading}
        message={formLoading ? "Guardando presupuesto..." : "Cargando presupuestos..."}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Presupuestos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
          aria-label="Crear nuevo presupuesto"
        >
          Nuevo Presupuesto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {productos.length === 0 && recetas.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No hay productos ni equipos disponibles para la venta. Contacte al administrador.
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
              label="Buscar Presupuestos"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Escriba número de presupuesto, cliente o lead..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              helperText={`Mostrando ${presupuestos.length} de ${totalPresupuestos} presupuestos`}
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
                <MenuItem value={EstadoDocumentoEnum.RECHAZADO}>Rechazado</MenuItem>
              </Select>
            </FormControl>
            <ClienteAutocomplete
              value={clientFilter}
              onChange={setClientFilter}
              size="small"
              label="Cliente"
              placeholder="Filtrar por cliente…"
              pageSize={50}
            />
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
            <Table aria-label="Tabla de presupuestos" sx={{ minWidth: { xs: 800, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 100 }}>Número</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Cliente / Lead</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>Fecha</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                  <TableCell sx={{ minWidth: 110 }} align="right">Subtotal</TableCell>
                  <TableCell sx={{ minWidth: 100 }} align="right">IVA</TableCell>
                  <TableCell sx={{ minWidth: 110 }} align="right">Total</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Financiamiento</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>Creado por</TableCell>
                  <TableCell sx={{ minWidth: 200, whiteSpace: 'nowrap' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {presupuestos.map((presupuesto) => {
                  const selectedOption = getSelectedFinancingOption(presupuesto);
                  const totalConFinanciamiento = selectedOption ? selectedOption.montoTotal : presupuesto.total;

                  return (
                    <TableRow key={presupuesto.id}>
                      <TableCell>{presupuesto.numeroDocumento}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {presupuesto.clienteNombre || presupuesto.leadNombre || '-'}
                          </Typography>
                          {presupuesto.clienteNombre && (
                            <Chip label="Cliente" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                          {presupuesto.leadNombre && (
                            <Chip label="Lead" size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{new Date(presupuesto.fechaEmision).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(presupuesto.estado)}
                          color={getStatusColor(presupuesto.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(presupuesto.subtotal)}</TableCell>
                      <TableCell align="right">{formatCurrency(computeIva(presupuesto))}</TableCell>
                      <TableCell align="right">{formatCurrency(totalConFinanciamiento)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: '160px' }}>
                          {selectedOption ? (
                            <Chip
                              label={selectedOption.nombre}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ) : (
                            <Chip
                              label="Sin seleccionar"
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <UsuarioBadge nombre={presupuesto.usuarioCreadorPresupuestoNombre ?? null} />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Ver">
                          <IconButton size="small" color="primary" onClick={() => handleOpenDialog(presupuesto, true)} aria-label={`Ver presupuesto ${presupuesto.numeroDocumento}`}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary" onClick={() => handleOpenDialog(presupuesto, false)} aria-label={`Editar presupuesto ${presupuesto.numeroDocumento}`}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Opciones de financiamiento">
                          <IconButton size="small" color="secondary" onClick={() => handleOpenFinanciamiento(presupuesto)} aria-label={`Financiamiento presupuesto ${presupuesto.numeroDocumento}`}>
                            <MoneyIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Exportar PDF">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleExportarPDF(presupuesto)}
                            aria-label={`Exportar PDF presupuesto ${presupuesto.numeroDocumento}`}
                          >
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Enviar">
                          <IconButton size="small" color="info" aria-label={`Enviar presupuesto ${presupuesto.numeroDocumento}`}>
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
            count={totalPresupuestos}
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

          {presupuestos.length === 0 && !presupuestosQuery.isLoading && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay presupuestos registrados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Comience creando su primer presupuesto
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                disabled={loading}
                aria-label="Crear primer presupuesto"
              >
                Crear Presupuesto
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Main Presupuesto Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        fullScreen={false}
        aria-labelledby="presupuesto-dialog-title"
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: { xs: '100%', sm: '90vh' },
            m: { xs: 0, sm: 2 }
          }
        }}
      >
        <DialogTitle id="presupuesto-dialog-title">
          {editingPresupuesto ? (readOnly ? "Ver Presupuesto" : "Editar Presupuesto") : "Nuevo Presupuesto"}
        </DialogTitle>
        <DialogContent sx={{ minHeight: { xs: "auto", sm: "500px" } }}>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(auto-fit, minmax(280px, 1fr))" }, gap: 2 }}>
              <Box sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}>
                <ToggleButtonGroup
                  value={destinatarioMode}
                  exclusive
                  size="small"
                  onChange={(_, newMode: 'CLIENTE' | 'LEAD' | null) => {
                    if (!newMode || readOnly || !!editingPresupuesto) return;
                    setDestinatarioMode(newMode);
                    if (newMode === 'CLIENTE') {
                      setFormData({ ...formData, leadId: '' });
                    } else {
                      setFormData({ ...formData, clienteId: '' });
                      setSelectedCliente(null);
                    }
                    deudaYaConfirmadaRef.current = false;
                    setHasUnsavedChanges(true);
                  }}
                  disabled={readOnly || !!editingPresupuesto}
                  sx={{ mb: 1 }}
                  aria-label="Tipo de destinatario"
                >
                  <ToggleButton value="CLIENTE" aria-label="Cliente">Cliente</ToggleButton>
                  <ToggleButton value="LEAD" aria-label="Lead">Lead</ToggleButton>
                </ToggleButtonGroup>

                {destinatarioMode === 'CLIENTE' ? (
                  <ClienteAutocomplete
                    value={selectedCliente}
                    onChange={async (cliente) => {
                      setSelectedCliente(cliente);
                      setFormData({
                        ...formData,
                        clienteId: cliente ? cliente.id.toString() : '',
                        leadId: '',
                      });
                      deudaYaConfirmadaRef.current = false;
                      if (cliente) {
                        const deudaData = await checkClienteDeuda(cliente.id);
                        if (deudaData) {
                          setDeudaError(deudaData);
                          pendingDeudaRef.current = () => {
                            deudaYaConfirmadaRef.current = true;
                          };
                        }
                      }
                      setHasUnsavedChanges(true);
                    }}
                    disabled={readOnly || !!editingPresupuesto}
                    label="Cliente"
                    placeholder="Escribí nombre, razón social o CUIT…"
                    required
                    error={!formData.clienteId && hasUnsavedChanges}
                    helperText={!formData.clienteId && hasUnsavedChanges ? 'Seleccioná un cliente' : ' '}
                    size="medium"
                    pageSize={50}
                  />
                ) : (
                  <Autocomplete
                    fullWidth
                    options={leads.filter(l => l.estadoLead !== 'CONVERTIDO')}
                    getOptionLabel={(l) => (l.apellido ? `${l.nombre} ${l.apellido}` : l.nombre || '')}
                    isOptionEqualToValue={(option, val) => option.id === val.id}
                    value={leads.find(l => l.id != null && l.id.toString() === formData.leadId) || null}
                    inputValue={leadSearch.inputValue}
                    onInputChange={(_, value) => leadSearch.setInputValue(value)}
                    // Backend ya filtra por busqueda; deshabilitamos filtrado client-side de MUI.
                    filterOptions={(opts) => opts}
                    loading={leadSearch.loading}
                    onChange={(_, newValue) => {
                      setFormData({
                        ...formData,
                        leadId: newValue?.id ? newValue.id.toString() : '',
                        clienteId: '',
                      });
                      setSelectedCliente(null);
                      deudaYaConfirmadaRef.current = false;
                      setHasUnsavedChanges(true);
                    }}
                    disabled={readOnly || !!editingPresupuesto}
                    renderOption={({ key, ...props }, option) => (
                      <Box component="li" key={key as React.Key} {...props}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            {option.apellido ? `${option.nombre} ${option.apellido}` : option.nombre}
                          </Typography>
                          <Chip label="Lead" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Lead"
                        placeholder="Escribí nombre o apellido…"
                        required
                        error={!formData.leadId && hasUnsavedChanges}
                        helperText={!formData.leadId && hasUnsavedChanges ? 'Seleccioná un lead' : ' '}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon color="action" fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                    noOptionsText="No se encontraron leads"
                  />
                )}
              </Box>

              {editingPresupuesto && usuarios.length > 0 && (
                <TextField
                  fullWidth
                  select
                  label="Usuario"
                  value={formData.usuarioId}
                  onChange={(e) => {
                    console.log("Usuario seleccionado:", e.target.value);
                    setFormData({ ...formData, usuarioId: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  margin="normal"
                  disabled={readOnly}
                >
                  <MenuItem value="">Seleccionar usuario</MenuItem>
                  {usuarios.map((usuario) => (
                    <MenuItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo de IVA</InputLabel>
                <Select
                  value={formData.tipoIva}
                  onChange={(e) => {
                    setFormData({ ...formData, tipoIva: e.target.value as 'IVA_21' | 'IVA_10_5' | 'EXENTO' });
                    setHasUnsavedChanges(true);
                  }}
                  label="Tipo de IVA"
                  disabled={readOnly}
                >
                  <MenuItem value="IVA_21">IVA 21%</MenuItem>
                  <MenuItem value="IVA_10_5">IVA 10.5%</MenuItem>
                  <MenuItem value="EXENTO">Exento</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mt: 1 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Tipo de descuento</InputLabel>
                  <Select
                    value={formData.descuentoTipo}
                    onChange={(e) => {
                      const next = e.target.value as TipoDescuento;
                      setFormData({
                        ...formData,
                        descuentoTipo: next,
                        descuentoValor: next === 'NONE' ? 0 : formData.descuentoValor,
                      });
                      setHasUnsavedChanges(true);
                    }}
                    label="Tipo de descuento"
                    disabled={readOnly}
                  >
                    <MenuItem value="NONE">Sin descuento</MenuItem>
                    <MenuItem value="PORCENTAJE">Porcentaje (%)</MenuItem>
                    <MenuItem value="MONTO_FIJO">Monto fijo ($)</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  type="number"
                  label={formData.descuentoTipo === 'PORCENTAJE' ? 'Descuento (%)' : 'Descuento ($)'}
                  value={formData.descuentoTipo === 'NONE' ? '' : formData.descuentoValor}
                  onChange={(e) => {
                    const raw = parseFloat(e.target.value);
                    const valor = Number.isFinite(raw) ? Math.max(0, raw) : 0;
                    setFormData({
                      ...formData,
                      descuentoValor: formData.descuentoTipo === 'PORCENTAJE' ? Math.min(100, valor) : valor,
                    });
                    setHasUnsavedChanges(true);
                  }}
                  inputProps={{
                    min: 0,
                    max: formData.descuentoTipo === 'PORCENTAJE' ? 100 : undefined,
                    step: formData.descuentoTipo === 'PORCENTAJE' ? 0.5 : 0.01,
                  }}
                  margin="normal"
                  disabled={readOnly || formData.descuentoTipo === 'NONE'}
                  helperText={
                    formData.descuentoTipo === 'MONTO_FIJO' && formData.descuentoValor > subtotal
                      ? 'El descuento no puede superar el subtotal'
                      : undefined
                  }
                  error={formData.descuentoTipo === 'MONTO_FIJO' && formData.descuentoValor > subtotal}
                />
              </Box>

              <TextField
                fullWidth
                select
                label="Estado"
                value={formData.estado}
                onChange={(e) => {
                  setFormData({ ...formData, estado: e.target.value as EstadoDocumento });
                  setHasUnsavedChanges(true);
                }}
                margin="normal"
                required
                disabled={readOnly || !editingPresupuesto}
              >
                <MenuItem value={EstadoDocumentoEnum.PENDIENTE}>Pendiente</MenuItem>
                <MenuItem value={EstadoDocumentoEnum.APROBADO}>Aprobado</MenuItem>
                <MenuItem value={EstadoDocumentoEnum.RECHAZADO}>Rechazado</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Fecha de Emisión"
                type="date"
                value={formData.fechaEmision}
                onChange={(e) => {
                  setFormData({ ...formData, fechaEmision: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
                disabled
              />
            </Box>

            <TextField
              fullWidth
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => {
                setFormData({ ...formData, observaciones: e.target.value });
                setHasUnsavedChanges(true);
              }}
              margin="normal"
              multiline
              rows={3}
              disabled={readOnly}
            />

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Detalles del Presupuesto
            </Typography>

            {productos.length === 0 && recetas.length === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No hay productos ni equipos disponibles para la venta. Contacte al administrador.
              </Alert>
            )}
            {productos.length === 0 && recetas.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Solo equipos disponibles. No hay productos en el catálogo.
              </Alert>
            )}
            {productos.length > 0 && recetas.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Solo productos disponibles. No hay equipos configurados para la venta.
              </Alert>
            )}

            {!readOnly && !editingPresupuesto && recetas.length > 0 && detalles.some((d) => d.tipoItem === 'EQUIPO') && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  select
                  size="small"
                  label="Filtrar equipos por tipo"
                  value={tipoEquipoFiltro}
                  onChange={(e) => setTipoEquipoFiltro(e.target.value as typeof tipoEquipoFiltro)}
                  sx={{ minWidth: 260 }}
                >
                  <MenuItem value="">
                    Todos ({recetas.length})
                  </MenuItem>
                  <MenuItem value="HELADERA" disabled={recetasCountPorTipo.HELADERA === 0}>
                    Heladera ({recetasCountPorTipo.HELADERA})
                  </MenuItem>
                  <MenuItem value="COOLBOX" disabled={recetasCountPorTipo.COOLBOX === 0}>
                    Coolbox ({recetasCountPorTipo.COOLBOX})
                  </MenuItem>
                  <MenuItem value="EXHIBIDOR" disabled={recetasCountPorTipo.EXHIBIDOR === 0}>
                    Exhibidor ({recetasCountPorTipo.EXHIBIDOR})
                  </MenuItem>
                  <MenuItem value="OTRO" disabled={recetasCountPorTipo.OTRO === 0}>
                    Otro ({recetasCountPorTipo.OTRO})
                  </MenuItem>
                </TextField>
                {tipoEquipoFiltro && (
                  <Button size="small" variant="text" onClick={() => setTipoEquipoFiltro('')}>
                    Limpiar filtro
                  </Button>
                )}
              </Box>
            )}

            <TableContainer component={Paper} sx={{ mb: 2, overflowX: 'auto' }}>
              <Table size="small" aria-label="Tabla de detalles del presupuesto" sx={{ minWidth: { xs: 700, sm: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    {!readOnly && !editingPresupuesto && <TableCell sx={{ minWidth: 120 }}>Tipo</TableCell>}
                    <TableCell sx={{ minWidth: 220 }}>Producto/Equipo</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Color</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Medida</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Cantidad</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Precio Unit.</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Subtotal</TableCell>
                    {!readOnly && !editingPresupuesto && <TableCell sx={{ minWidth: 80 }}>Acciones</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalles.length > 0 ? (
                    detalles.map((detalle, index) => (
                      <TableRow key={index}>
                        {!readOnly && !editingPresupuesto && (
                          <TableCell>
                            <TextField
                              select
                              size="small"
                              fullWidth
                              value={detalle.tipoItem}
                              onChange={(e) => updateDetalle(index, "tipoItem", e.target.value)}
                              disabled={readOnly || !!editingPresupuesto}
                            >
                              <MenuItem value="PRODUCTO">Producto</MenuItem>
                              <MenuItem value="EQUIPO">Equipo</MenuItem>
                            </TextField>
                          </TableCell>
                        )}
                        <TableCell>
                          {detalle.tipoItem === 'PRODUCTO' ? (
                            <TextField
                              select
                              size="small"
                              fullWidth
                              value={detalle.productoId || ""}
                              onChange={(e) => updateDetalle(index, "productoId", e.target.value)}
                              disabled={readOnly || !!editingPresupuesto}
                              error={!detalle.productoId && hasUnsavedChanges}
                            >
                              <MenuItem value="">Seleccionar producto</MenuItem>
                              {productos.length === 0 ? (
                                <MenuItem disabled>No hay productos disponibles</MenuItem>
                              ) : (
                                productos.map((producto) => (
                                  <MenuItem key={producto.id} value={producto.id.toString()}>
                                    {producto.nombre}
                                  </MenuItem>
                                ))
                              )}
                            </TextField>
                          ) : (
                            <TextField
                              select
                              size="small"
                              fullWidth
                              value={detalle.recetaId || ""}
                              onChange={(e) => updateDetalle(index, "recetaId", e.target.value)}
                              disabled={readOnly || !!editingPresupuesto}
                              error={!detalle.recetaId && hasUnsavedChanges}
                            >
                              <MenuItem value="">Seleccionar equipo</MenuItem>
                              {recetasFiltradasPorTipo.length === 0 ? (
                                <MenuItem disabled>
                                  {recetas.length === 0
                                    ? 'No hay equipos disponibles'
                                    : `No hay equipos del tipo ${tipoEquipoFiltro}`}
                                </MenuItem>
                              ) : (
                                recetasFiltradasPorTipo.map((receta) => (
                                  <MenuItem key={receta.id} value={receta.id.toString()}>
                                    {receta.modelo} ({receta.tipoEquipo})
                                  </MenuItem>
                                ))
                              )}
                            </TextField>
                          )}
                        </TableCell>
                        <TableCell>
                          {readOnly || editingPresupuesto ? (
                            <Typography variant="body2">
                              {detalle.colorNombre || '-'}
                            </Typography>
                          ) : (
                            <ColorPicker
                              value={detalle.colorId}
                              onChange={(colorId) => updateDetalle(index, "colorId", colorId ?? "")}
                              disabled={detalle.tipoItem !== 'EQUIPO'}
                              label=""
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {detalle.medidaNombre || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            value={detalle.cantidad}
                            onChange={(e) => updateDetalle(index, "cantidad", parseInt(e.target.value) || 0)}
                            inputProps={{ min: 1 }}
                            disabled={readOnly || !!editingPresupuesto}
                            error={detalle.cantidad <= 0 && hasUnsavedChanges}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            value={detalle.precioUnitario}
                            onChange={(e) => updateDetalle(index, "precioUnitario", parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                            disabled={readOnly || !!editingPresupuesto}
                            error={detalle.precioUnitario <= 0 && hasUnsavedChanges}
                          />
                        </TableCell>
                        <TableCell>
                          ${detalle.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        {!readOnly && !editingPresupuesto && (
                          <TableCell>
                            <Tooltip title="Eliminar detalle">
                              <IconButton size="small" color="error" onClick={() => removeDetalle(index)} aria-label="Eliminar detalle">
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={readOnly || editingPresupuesto ? 7 : 9} align="center">
                        No hay detalles para este presupuesto.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {!readOnly && !editingPresupuesto && (
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addDetalle}
                  disabled={productos.length === 0 && recetas.length === 0}
                >
                  Agregar Detalle
                </Button>
                {productos.length === 0 && recetas.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    No hay productos ni equipos disponibles
                  </Typography>
                )}
              </Box>
            )}

{/* Totals section with IVA and Financing */}
            <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-end" }}>
                <Typography variant="body1">
                  Subtotal: ${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </Typography>
                {formData.descuentoTipo !== 'NONE' && descuentoAmount > 0 && (
                  <Typography variant="body1" color="error.main">
                    Descuento {formData.descuentoTipo === 'PORCENTAJE' ? `(${formData.descuentoValor}%)` : '(monto fijo)'}:
                    -${descuentoAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </Typography>
                )}
                <Typography variant="body1">
                  IVA ({formData.tipoIva === 'IVA_21' ? '21%' : formData.tipoIva === 'IVA_10_5' ? '10.5%' : '0%'}):
                  ${ivaAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </Typography>
                <Divider sx={{ width: '200px', my: 1 }} />
                <Typography variant="body1" fontWeight="medium">
                  Subtotal con IVA: ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </Typography>
                
                {/* Show financing option if viewing an existing presupuesto */}
                {editingPresupuesto && (() => {
                  const selectedFinancing = getSelectedFinancingOption(editingPresupuesto);
                  if (selectedFinancing) {
                    return (
                      <>
                        <Divider sx={{ width: '200px', my: 1 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                          <Typography variant="body2" color="text.secondary">
                            Opción de financiamiento: {selectedFinancing.nombre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getMetodoPagoLabel(selectedFinancing.metodoPago)} - {selectedFinancing.cantidadCuotas} cuotas
                          </Typography>
                          {selectedFinancing.tasaInteres !== 0 && (
                            <Typography variant="body2" color={selectedFinancing.tasaInteres < 0 ? 'success.main' : 'text.secondary'}>
                              {selectedFinancing.tasaInteres < 0 
                                ? `Descuento: ${Math.abs(selectedFinancing.tasaInteres)}%`
                                : `Interés: ${selectedFinancing.tasaInteres}%`}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Valor cuota: ${selectedFinancing.montoCuota.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                        <Divider sx={{ width: '200px', my: 1 }} />
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          Total con financiamiento: ${selectedFinancing.montoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </Typography>
                      </>
                    );
                  }
                  return null;
                })()}
                
                {/* If no financing option selected, show regular total */}
                {(!editingPresupuesto || !getSelectedFinancingOption(editingPresupuesto)) && (
                  <>
                    <Divider sx={{ width: '200px', my: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Total: ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </Typography>
                  </>
                )}
              </Box>
            </Paper>
          {readOnly && editingPresupuesto && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="subtitle2" gutterBottom>
                Trazabilidad del flujo
              </Typography>
              <AuditoriaFlujo documento={editingPresupuesto} />
            </Box>
          )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={formLoading}>
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!readOnly && (
            <Button
              variant="contained"
              onClick={handleSavePresupuesto}
              disabled={formLoading || (!formData.clienteId && !formData.leadId) || detalles.length === 0}
              aria-label={editingPresupuesto ? "Actualizar presupuesto" : "Crear presupuesto"}
            >
              {formLoading ? <CircularProgress size={24} /> : editingPresupuesto ? "Actualizar" : "Crear"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmDialogAction === 'close' ? 'Confirmar cierre' : 'Confirmar creación'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialogAction === 'close' 
              ? '¿Está seguro que desea cerrar? Se perderán todos los cambios no guardados.'
              : `¿Está seguro que desea crear este presupuesto con un total de ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}?`
            }
          </Typography>
          {confirmDialogAction === 'create' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Cliente: {selectedCliente
                  ? (selectedCliente.razonSocial || `${selectedCliente.nombre} ${selectedCliente.apellido || ''}`.trim())
                  : (leads.find(l => l.id != null && l.id.toString() === formData.leadId)?.nombre || '—')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cantidad de items: {detalles.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Subtotal: ${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </Typography>
              {formData.descuentoTipo !== 'NONE' && descuentoAmount > 0 && (
                <Typography variant="body2" color="error.main">
                  Descuento {formData.descuentoTipo === 'PORCENTAJE' ? `(${formData.descuentoValor}%)` : '(monto fijo)'}:
                  -${descuentoAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                IVA ({formData.tipoIva === 'IVA_21' ? '21%' : formData.tipoIva === 'IVA_10_5' ? '10.5%' : '0%'}):
                ${ivaAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setConfirmDialogOpen(false);
            setConfirmDialogAction(null);
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmDialogAction === 'close' ? handleConfirmClose : handleSavePresupuesto}
            variant="contained" 
            color={confirmDialogAction === 'close' ? 'error' : 'primary'}
          >
            {confirmDialogAction === 'close' ? 'Cerrar sin guardar' : 'Confirmar y crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Opciones de Financiamiento */}
      <Dialog
        open={financiamientoDialogOpen}
        onClose={() => setFinanciamientoDialogOpen(false)}
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
          Opciones de Financiamiento
          <Typography variant="body2" color="text.secondary">Seleccione la opción de pago preferida</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedPresupuesto && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Presupuesto: {selectedPresupuesto.numeroDocumento}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedPresupuesto.clienteNombre ? 'Cliente:' : 'Lead:'} {selectedPresupuesto.clienteNombre || selectedPresupuesto.leadNombre}
                </Typography>
                {selectedPresupuesto.clienteNombre && (
                  <Chip label="Cliente" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
                {selectedPresupuesto.leadNombre && (
                  <Chip label="Lead" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
              </Box>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>Subtotal: ${selectedPresupuesto.subtotal?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
            </Box>
          )}
          <Divider sx={{ mb: 2 }} />
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
                        baseImporte={selectedPresupuesto?.subtotal ?? 0}
                      />
                    }
                  />
                </Box>
              );
            })}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinanciamientoDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSelectOpcion} variant="contained" disabled={!selectedOpcionId}>
            Confirmar selección
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Success Dialog */}
      <SuccessDialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          setCreatedPresupuesto(null);
        }}
        title="¡Presupuesto Creado Exitosamente!"
        message="El presupuesto ha sido generado correctamente"
        details={createdPresupuesto ? [
          { label: 'Número de Documento', value: createdPresupuesto.numeroDocumento },
          { 
            label: createdPresupuesto.clienteNombre ? 'Cliente' : 'Lead', 
            value: createdPresupuesto.clienteNombre || createdPresupuesto.leadNombre || '-' 
          },
          { label: 'Total', value: `$${createdPresupuesto.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
        ] : []}
        actions={[
          {
            label: 'Crear Otro',
            onClick: () => handleOpenDialog(),
            icon: <AddIcon />,
            variant: 'outlined',
          },
        ]}
      />

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

export default PresupuestosPage;

