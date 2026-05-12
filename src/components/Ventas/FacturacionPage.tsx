import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Box,
  Button,
  Typography,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Add as AddIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
// Real API services
import { productApi, usuarioApi } from '../../api/services';
import { documentoApi, type CreateFacturaDirectaPayload } from '../../api/services/documentoApi';
import opcionFinanciamientoApi from '../../api/services/opcionFinanciamientoApi';
import opcionFinanciamientoTemplateApi, { type OpcionFinanciamientoTemplateDTO } from '../../api/services/opcionFinanciamientoTemplateApi';
import { recetaFabricacionApi } from '../../api/services/recetaFabricacionApi';
import { useOfertasVigentes } from '../../hooks/useOfertasVigentes';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import { cuentaCorrienteApi } from '../../api/services/cuentaCorrienteApi';
import SuccessDialog from "../common/SuccessDialog";
import LoadingOverlay from "../common/LoadingOverlay";
import AsignarEquiposDialog from "./AsignarEquiposDialog";
import { metodoPagoRequiereCaja, type CajaRef } from '../../types/caja.types';
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
  DeudaClienteError,
} from '../../types';
import DeudaClienteConfirmDialog from './DeudaClienteConfirmDialog';
// FRONT-002: extracted to keep this file orchestrator-shaped.
import { IVA_OPTIONS, type TipoIva } from './Facturacion/constants';
import type { CartItem, NotaCartItem } from './Facturacion/types';
import {
  isFinanciamiento,
  buildCajaPayload,
  normalizeMetodoPagoToBackend,
  resolveEntregaFields,
} from './Facturacion/utils';
import CambiarEstadoDialog from './Facturacion/dialogs/CambiarEstadoDialog';
import BillingDialog, { type BillingFormValues } from './Facturacion/dialogs/BillingDialog';
import ConfigFinanciamientoDialog from './Facturacion/dialogs/ConfigFinanciamientoDialog';
import FabricacionConfirmDialog from './Facturacion/dialogs/FabricacionConfirmDialog';
import ConvertToFacturaDialog from './Facturacion/dialogs/ConvertToFacturaDialog';
import DesdeNotaPedidoTab from './Facturacion/tabs/DesdeNotaPedidoTab';
import FacturarManualTab from './Facturacion/tabs/FacturarManualTab';

const FacturacionPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();
  const { empresaId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Data
  const queryClient = useQueryClient();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<RecetaFabricacionDTO[]>([]);
  const { getPrecioEfectivo } = useOfertasVigentes();
  // notasPedido viene de useQuery server-side; mantenemos la variable con
  // el mismo nombre para no romper el resto de la página.

  // Manual invoice form
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const selectedClientId: number | '' = selectedCliente?.id ?? '';
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | ''>(user?.id ?? '');
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('EFECTIVO');
  const [cajaContadoRef, setCajaContadoRef] = useState<CajaRef | null>(null);
  const [cantidadCuotas, setCantidadCuotas] = useState<number | null>(null);
  const [tipoFinanciacion, setTipoFinanciacion] = useState<string>('MENSUAL');
  const [primerVencimiento, setPrimerVencimiento] = useState<string>('');
  const [dueDate, setDueDate] = useState(dayjs().add(30, 'days').format('YYYY-MM-DD'));
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedIva, setSelectedIva] = useState<TipoIva>('EXENTO');
  const [descuentoTipo, setDescuentoTipo] = useState<'NONE' | 'PORCENTAJE' | 'MONTO_FIJO'>('NONE');
  const [descuentoValor, setDescuentoValor] = useState<number>(0);
  const [notaDescuentoTipo, setNotaDescuentoTipo] = useState<'NONE' | 'PORCENTAJE' | 'MONTO_FIJO'>('NONE');
  const [notaDescuentoValor, setNotaDescuentoValor] = useState<number>(0);
  
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

  // Estado management dialog: documento != null ⇒ open. Lifecycle is owned
  // by CambiarEstadoDialog (FRONT-002 extraction).
  const [estadoDoc, setEstadoDoc] = useState<DocumentoComercial | null>(null);

  // Financiamiento states
  const [financiamientoDialogOpen, setFinanciamientoDialogOpen] = useState(false);
  const [opcionesFinanciamiento, setOpcionesFinanciamiento] = useState<OpcionFinanciamientoDTO[]>([]);
  const [selectedOpcionId, setSelectedOpcionId] = useState<number | null>(null);
  const [plantillasFinanciamiento, setPlantillasFinanciamiento] = useState<OpcionFinanciamientoTemplateDTO[]>([]);
  const [loadingOpciones, setLoadingOpciones] = useState(false);
  // newOpcionForm/showNewOpcionForm moved into ConfigFinanciamientoDialog.
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdFactura, setCreatedFactura] = useState<DocumentoComercial | null>(null);
  const [asignarEquiposDialogOpen, setAsignarEquiposDialogOpen] = useState(false);
  const [notaParaAsignacion, setNotaParaAsignacion] = useState<DocumentoComercial | null>(null);
  const [isManualInvoice, setIsManualInvoice] = useState(false);
  // Snapshot del payload + detalles virtuales cuando el flujo manual con equipos
  // tiene que pausar para que el usuario asigne equipos en AsignarEquiposDialog.
  // El factura se crea recién cuando el usuario confirma la asignación.
  const [manualFacturaDraft, setManualFacturaDraft] = useState<{
    payload: CreateFacturaDirectaPayload;
    virtualDetallesEquipo: DetalleDocumento[];
  } | null>(null);
  const [notaOpcionesFinanciamiento, setNotaOpcionesFinanciamiento] = useState<Record<number, OpcionFinanciamientoDTO[]>>({});

  // Pagination for Notas de Pedido (server-side ahora).
  const [pageNotas, setPageNotas] = useState(0);
  const [rowsPerPageNotas, setRowsPerPageNotas] = useState(12);

  // Search filter for Notas de Pedido (debounced + enviado al server).
  const [notasSearchTerm, setNotasSearchTerm] = useState('');
  const debouncedNotasSearch = useDebounce(notasSearchTerm, 300);

  useEffect(() => { setPageNotas(0); }, [debouncedNotasSearch]);

  const notasQuery = useQuery({
    queryKey: ['facturacion-notasPedido', {
      page: pageNotas, size: rowsPerPageNotas,
      busqueda: debouncedNotasSearch.trim() || undefined,
      empresaId,
    }] as const,
    queryFn: () => documentoApi.getByTipoPaginated('NOTA_PEDIDO',
      { page: pageNotas, size: rowsPerPageNotas, sort: 'fechaEmision,desc' },
      {
        // Solo notas facturables — APROBADO o PENDIENTE.
        estados: ['APROBADO', 'PENDIENTE'],
        ...(debouncedNotasSearch.trim() ? { busqueda: debouncedNotasSearch.trim() } : {}),
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
    () => { queryClient.invalidateQueries({ queryKey: ['facturacion-notasPedido'] }); },
    [queryClient]
  );

  // Fabrication confirmation dialog
  const [fabricacionDialogOpen, setFabricacionDialogOpen] = useState(false);
  const [itemPendienteFabricacion, setItemPendienteFabricacion] = useState<{
    recetaId: number;
    recetaNombre: string;
    cantidad: number;
    colorId?: number;
    medidaId?: number;
    medidaNombre?: string;
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
    setManualFacturaDraft(null);
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
      const [usuariosResponse, productsData, recetasData, plantillasData] = await Promise.all([
        usuarioApi.getAll().catch((err: any) => {
          if (err?.response?.status === 403) return { content: [] };
          return { content: [] };
        }),
        productApi.getAll({ page: 0, size: 10000 }).catch(() => []),
        recetaFabricacionApi.findDisponiblesParaVenta().catch(() => []),
        opcionFinanciamientoTemplateApi.obtenerActivas().catch(() => []),
      ]);

      // Handle paginated response from usuarioApi
      const usuariosArray = Array.isArray(usuariosResponse)
        ? usuariosResponse
        : (usuariosResponse?.content || []);
      setUsuarios(usuariosArray);

      const productsList = Array.isArray(productsData) ? productsData : (productsData as any)?.content || [];
      setProducts((productsList as Producto[]).filter(p => p && p.id));

      setRecetas(Array.isArray(recetasData) ? recetasData : []);
      setPlantillasFinanciamiento(Array.isArray(plantillasData) ? plantillasData : []);

      // Las notas de pedido (y sus opciones de financiamiento) se cargan en
      // notasQuery + el effect de abajo. Antes acá había un N+1 por nota
      // (un fetch de opciones por cada nota); ahora solo se cargan las opciones
      // de las notas visibles en la página actual.

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

  // Carga opciones de financiamiento solo para las notas visibles. El backend
  // hace una request por nota (N+1) pero N = page size = 12, no el total.
  useEffect(() => {
    if (!notasPedido.length) return;
    const missingIds = notasPedido
      .filter((n) => !notaOpcionesFinanciamiento[n.id])
      .map((n) => n.id);
    if (missingIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const opciones = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(id);
            return [id, opciones?.length ? opciones : null] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );
      if (cancelled) return;
      setNotaOpcionesFinanciamiento((prev) => {
        const next = { ...prev };
        let mutated = false;
        for (const [id, opciones] of entries) {
          if (opciones && !next[id]) {
            next[id] = opciones;
            mutated = true;
          }
        }
        return mutated ? next : prev;
      });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notasPedido]);

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

  const descuentoAmount = useMemo(() => {
    if (descuentoTipo === 'PORCENTAJE') {
      return subtotalVenta * (Math.min(100, Math.max(0, descuentoValor || 0)) / 100);
    }
    if (descuentoTipo === 'MONTO_FIJO') {
      return Math.min(subtotalVenta, Math.max(0, descuentoValor || 0));
    }
    return 0;
  }, [subtotalVenta, descuentoTipo, descuentoValor]);

  const subtotalVentaNeto = useMemo(() => Math.max(0, subtotalVenta - descuentoAmount), [subtotalVenta, descuentoAmount]);

  const ivaAmount = useMemo(() => {
    const ivaRate = IVA_OPTIONS.find((option) => option.value === selectedIva)?.rate || 0;
    return subtotalVentaNeto * ivaRate;
  }, [subtotalVentaNeto, selectedIva]);

  const totalVenta = useMemo(() => subtotalVentaNeto + ivaAmount, [subtotalVentaNeto, ivaAmount]);

  const notaSubtotal = useMemo(() => {
    return notaCart.reduce((sum, item) => {
      const itemSubtotal = item.cantidad * item.precioUnitario;
      const discountAmount = itemSubtotal * (item.descuento / 100);
      return sum + (itemSubtotal - discountAmount);
    }, 0);
  }, [notaCart]);

  const notaDescuentoAmount = useMemo(() => {
    if (notaDescuentoTipo === 'PORCENTAJE') {
      return notaSubtotal * (Math.min(100, Math.max(0, notaDescuentoValor || 0)) / 100);
    }
    if (notaDescuentoTipo === 'MONTO_FIJO') {
      return Math.min(notaSubtotal, Math.max(0, notaDescuentoValor || 0));
    }
    return 0;
  }, [notaSubtotal, notaDescuentoTipo, notaDescuentoValor]);

  const notaSubtotalNeto = useMemo(() => Math.max(0, notaSubtotal - notaDescuentoAmount), [notaSubtotal, notaDescuentoAmount]);

  const notaFinancingAdjustment = useMemo(() => {
    if (!selectedOpcionId) return 0;
    const selectedOpcion = opcionesFinanciamiento[selectedOpcionId];
    if (!selectedOpcion || selectedOpcion.tasaInteres === 0) return 0;
    // Compute actual financed amount based on user's down payment choice (not a hardcoded 40/60 split)
    let entregaInicial = 0;
    if (notaEntregaInicial) {
      if (notaUsePorcentaje && notaPorcentajeEntrega != null) {
        entregaInicial = notaSubtotalNeto * notaPorcentajeEntrega / 100;
      } else if (!notaUsePorcentaje && notaMontoFijoEntrega != null) {
        entregaInicial = notaMontoFijoEntrega;
      }
    }
    const financiado = notaSubtotalNeto - entregaInicial;
    return financiado > 0 ? financiado * (selectedOpcion.tasaInteres / 100) : 0;
  }, [notaSubtotalNeto, selectedOpcionId, opcionesFinanciamiento, notaEntregaInicial, notaUsePorcentaje, notaPorcentajeEntrega, notaMontoFijoEntrega]);

  const notaIvaAmount = useMemo(() => {
    const ivaRate = IVA_OPTIONS.find((option) => option.value === (selectedNotaPedido as any)?.tipoIva)?.rate || 0.21;
    const subtotalConFinanciamiento = notaSubtotalNeto + notaFinancingAdjustment;
    return subtotalConFinanciamiento * ivaRate;
  }, [notaSubtotalNeto, notaFinancingAdjustment, selectedNotaPedido]);

  const notaTotalVenta = useMemo(() => notaSubtotalNeto + notaFinancingAdjustment + notaIvaAmount, [notaSubtotalNeto, notaFinancingAdjustment, notaIvaAmount]);

  // Entrega inicial computed (manual)
  const montoEntregaCalculado = useMemo(() => {
    if (!entregarInicial) return 0;
    if (usePorcentaje) return totalVenta * (porcentajeEntrega || 0) / 100;
    return montoFijoEntrega || 0;
  }, [entregarInicial, usePorcentaje, totalVenta, porcentajeEntrega, montoFijoEntrega]);

  // Entrega inicial computed (nota de pedido) — based on product subtotal, not on notaTotalVenta,
  // so the down payment percentage applies to the product price (matching backend behaviour).
  const notaMontoEntregaCalculado = useMemo(() => {
    if (!notaEntregaInicial) return 0;
    if (notaUsePorcentaje) return notaSubtotalNeto * (notaPorcentajeEntrega || 0) / 100;
    return notaMontoFijoEntrega || 0;
  }, [notaEntregaInicial, notaUsePorcentaje, notaSubtotalNeto, notaPorcentajeEntrega, notaMontoFijoEntrega]);

  const notaMontoFinanciado = useMemo(() => notaTotalVenta - notaMontoEntregaCalculado, [notaTotalVenta, notaMontoEntregaCalculado]);

  // El filtrado, búsqueda y orden ya los aplica notasQuery server-side.
  // Mantenemos los nombres `sortedNotasPedido`/`paginatedNotasPedido` apuntando
  // a la página actual para no tocar el JSX.
  const sortedNotasPedido = notasPedido;
  const paginatedNotasPedido = notasPedido;

  const handleChangePageNotas = (_event: unknown, newPage: number) => {
    setPageNotas(newPage);
  };

  const handleChangeRowsPerPageNotas = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageNotas(parseInt(event.target.value, 10));
    setPageNotas(0);
  };

  // Helper functions for financing
  // getMetodoPagoIcon/getMetodoPagoLabel moved to ./Facturacion/paymentMethodIcons.

  const clearForm = () => {
    setSelectedCliente(null);
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
    setDescuentoTipo('NONE');
    setDescuentoValor(0);
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
      const precioRec = getPrecioEfectivo('RECETA', defaultReceta.id!, defaultReceta.precioVenta || 0).precioEfectivo;
      setCart((prev) => [
        ...prev,
        {
          tipoItem: 'EQUIPO',
          recetaId: defaultReceta.id,
          recetaNombre: defaultReceta.nombre,
          recetaModelo: defaultReceta.modelo,
          recetaTipo: defaultReceta.tipoEquipo,
          cantidad: 1,
          precioUnitario: precioRec,
          descuento: 0,
          precioManualmenteModificado: false,
        },
      ]);
    } else if (products.length > 0) {
      const defaultProduct = products[0];
      const precioProd = getPrecioEfectivo('PRODUCTO', defaultProduct.id!, defaultProduct.precio || 0).precioEfectivo;
      setCart((prev) => [
        ...prev,
        {
          tipoItem: 'PRODUCTO',
          productoId: defaultProduct.id,
          productoNombre: defaultProduct.nombre || 'Producto sin nombre',
          cantidad: 1,
          precioUnitario: precioProd,
          descuento: 0,
          precioManualmenteModificado: false,
        },
      ]);
    }
  };

  // Función para verificar stock disponible de un equipo
  const verificarStockEquipo = useCallback(async (recetaId: number, colorId?: number, medidaId?: number): Promise<number> => {
    try {
      const equiposDisponibles = await equipoFabricadoApi.findDisponiblesParaVentaByReceta(recetaId);

      // Filtrar por color (id) y medida (id) si están especificados
      const equiposFiltrados = equiposDisponibles.filter(equipo => {
        const matchColor = !colorId || equipo.color?.id === colorId;
        const matchMedida = !medidaId || equipo.medida?.id === medidaId;
        return matchColor && matchMedida;
      });

      return equiposFiltrados.length;
    } catch (error) {
      console.error('Error verificando stock:', error);
      return 0;
    }
  }, []);

  const updateCartItem = async (index: number, field: 'tipoItem'|'productoId'|'recetaId'|'cantidad'|'precioUnitario'|'descuento'|'colorId', value: any) => {
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
        item.precioUnitario = getPrecioEfectivo('PRODUCTO', defaultProduct.id!, defaultProduct.precio || 0).precioEfectivo;
        // Clear equipo fields
        delete item.recetaId;
        delete item.recetaNombre;
        delete item.recetaModelo;
        delete item.recetaTipo;
        delete item.colorId;
        delete item.colorNombre;
        delete item.medidaId;
        delete item.medidaNombre;
        delete item.stockDisponible;
        delete item.stockVerificado;
        delete item.requiereFabricacion;
      } else if (newTipoItem === 'EQUIPO' && recetas.length > 0) {
        const defaultReceta = recetas[0];
        item.recetaId = defaultReceta.id;
        item.recetaNombre = defaultReceta.nombre;
        item.recetaModelo = defaultReceta.modelo;
        item.recetaTipo = defaultReceta.tipoEquipo;
        item.precioUnitario = getPrecioEfectivo('RECETA', defaultReceta.id!, defaultReceta.precioVenta || 0).precioEfectivo;
        // Set default color and medida from receta
        item.colorId = defaultReceta.color?.id;
        item.colorNombre = defaultReceta.color?.nombre;
        item.medidaId = defaultReceta.medida?.id;
        item.medidaNombre = defaultReceta.medida?.nombre;
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
          item.precioUnitario = getPrecioEfectivo('PRODUCTO', product.id!, product.precio || 0).precioEfectivo;
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
        item.colorId = receta.color?.id;
        item.colorNombre = receta.color?.nombre;
        item.medidaId = receta.medida?.id;
        item.medidaNombre = receta.medida?.nombre;
        if (!item.precioManualmenteModificado) {
          item.precioUnitario = getPrecioEfectivo('RECETA', receta.id!, receta.precioVenta || 0).precioEfectivo;
        }
        // Reset stock verification
        item.stockVerificado = false;
        delete item.stockDisponible;
        delete item.requiereFabricacion;
      }
    } else if (field === 'colorId') {
      // Update color (medida is no longer user-editable; it comes from the recipe)
      const nextId = value === '' || value == null ? undefined : Number(value);
      item.colorId = nextId;
      item.colorNombre = undefined; // re-derived on next render via colores cache
      // Reset stock verification when color changes
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
    if (item.tipoItem === 'EQUIPO' && item.recetaId && (field === 'recetaId' || field === 'colorId' || field === 'cantidad')) {
      const stockDisponible = await verificarStockEquipo(item.recetaId, item.colorId, item.medidaId);
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
        colorId: itemPendienteFabricacion.colorId ?? null,
        medidaId: itemPendienteFabricacion.medidaId ?? null,
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
                item.colorId === itemPendienteFabricacion.colorId &&
                item.medidaId === itemPendienteFabricacion.medidaId
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

  // Construye el payload para POST /api/documentos/factura-directa a partir del estado
  // del carrito y la financiación. equiposAsignaciones se agrega aparte cuando el
  // usuario los confirma desde AsignarEquiposDialog.
  const buildFacturaDirectaPayload = (): CreateFacturaDirectaPayload => {
    const fin = billingForm;
    const finPorcentajeEntrega = fin.usePorcentaje ? fin.porcentajeEntregaInicial : null;
    const finMontoFijoEntrega = !fin.usePorcentaje ? fin.montoEntregaInicial : null;

    // tasaInteres: el modal manual gana sobre la plantilla seleccionada cuando el usuario la fijó.
    const tasaInteresManual = fin.tasaInteres > 0
      ? fin.tasaInteres
      : (selectedOpcionId != null ? (plantillasFinanciamiento[selectedOpcionId]?.tasaInteres ?? 0) : 0);

    const detalles = cart.map((item) => {
      const subtotal = Number((item.cantidad * item.precioUnitario) * (1 - (item.descuento || 0) / 100));
      const detalle: any = {
        tipoItem: item.tipoItem || 'PRODUCTO',
        cantidad: Number(item.cantidad),
        precioUnitario: Number(item.precioUnitario),
        descuento: Number(item.descuento) || 0,
        subtotal,
      };
      if (item.tipoItem === 'EQUIPO') {
        detalle.recetaId = Number(item.recetaId);
        const equipoDesc = item.recetaNombre
          ? `${item.recetaNombre}${item.recetaModelo ? ` - ${item.recetaModelo}` : ''}`
          : undefined;
        detalle.descripcionEquipo = equipoDesc;
        detalle.descripcion = equipoDesc;
        if (item.colorId != null) detalle.colorId = item.colorId;
      } else {
        detalle.productoId = Number(item.productoId);
        detalle.descripcion = item.productoNombre || undefined;
      }
      return detalle;
    });

    return {
      clienteId: Number(selectedClientId),
      usuarioId: Number(selectedUsuarioId),
      metodoPago: paymentMethod,
      tipoIva: selectedIva,
      descuentoTipo,
      descuentoValor: descuentoTipo === 'NONE' ? 0 : descuentoValor,
      observaciones: notes || undefined,
      detalles,
      ...(isFinanciamiento(paymentMethod) && {
        cantidadCuotas: fin.cantidadCuotas,
        tipoFinanciacion: fin.tipoFinanciacion,
        tasaInteres: tasaInteresManual,
        ...(fin.primerVencimiento && { primerVencimiento: fin.primerVencimiento }),
        ...resolveEntregaFields(paymentMethod, fin.entregarInicial, fin.usePorcentaje, finPorcentajeEntrega, finMontoFijoEntrega),
      }),
      ...buildCajaPayload(paymentMethod, cajaContadoRef),
    };
  };

  // Detalles "virtuales" para que AsignarEquiposDialog funcione con líneas que
  // todavía no fueron persistidas. Usa el índice en `cart` como id; el backend
  // remappea ese índice al detalleId real después de crear la factura.
  const buildVirtualDetallesEquipo = (): DetalleDocumento[] =>
    cart
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.tipoItem === 'EQUIPO' && item.recetaId)
      .map(({ item, index }) => ({
        id: index,
        tipoItem: 'EQUIPO',
        recetaId: item.recetaId,
        recetaNombre: item.recetaNombre,
        recetaModelo: item.recetaModelo,
        recetaTipo: item.recetaTipo,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: item.descuento || 0,
        subtotal: 0,
        ...(item.colorId != null && {
          color: { id: item.colorId, nombre: item.colorNombre || '' } as any,
        }),
        ...(item.medidaId != null && {
          medida: { id: item.medidaId, nombre: item.medidaNombre || '' } as any,
        }),
      }) as unknown as DetalleDocumento);

  // Llama al endpoint factura-directa, maneja deuda pendiente (HTTP 409) y
  // navega al success dialog. Reusable entre el path "sin equipos" (submit
  // directo) y el path "con equipos" (después de AsignarEquiposDialog).
  const submitFacturaDirecta = async (
    payload: CreateFacturaDirectaPayload,
    asignaciones?: { [lineIndex: number]: number[] }
  ) => {
    setLoading(true);
    setError(null);
    const deudaPreconfirmada = deudaYaConfirmadaRef.current;
    deudaYaConfirmadaRef.current = false;
    try {
      const factura = await documentoApi.createFacturaDirecta({
        ...payload,
        ...(asignaciones && { equiposAsignaciones: asignaciones }),
        ...(deudaPreconfirmada && { confirmarConDeudaPendiente: true }),
      });

      const fin = billingForm;
      const finMontoEntregaCalculado = fin.entregarInicial
        ? (fin.usePorcentaje ? subtotalVenta * (fin.porcentajeEntregaInicial / 100) : fin.montoEntregaInicial)
        : 0;
      const finMontoFinanciado = subtotalVenta - finMontoEntregaCalculado;
      if (isFinanciamiento(payload.metodoPago) && fin.entregarInicial && finMontoEntregaCalculado > 0) {
        setFacturaEntregaInfo({
          montoEntrega: finMontoEntregaCalculado,
          montoFinanciado: finMontoFinanciado,
          cantidadCuotas: payload.cantidadCuotas ?? null,
        });
      } else {
        setFacturaEntregaInfo(null);
      }
      setAsignarEquiposDialogOpen(false);
      setManualFacturaDraft(null);
      setIsManualInvoice(false);
      setCreatedFactura(factura);
      setSuccessDialogOpen(true);
      clearForm();
      setSelectedOpcionId(null);
      setOpcionesFinanciamiento([]);
      await loadData();
    } catch (err: any) {
      console.error('Error creando factura directa:', err);
      const deudaData = parseDeudaError(err);
      if (deudaData) {
        setDeudaError(deudaData);
        pendingDeudaRef.current = async () => {
          deudaYaConfirmadaRef.current = true;
          await submitFacturaDirecta(payload, asignaciones);
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
          '⚠️ Error de Asignación Duplicada\n\n' +
          'Uno o más equipos ya están asignados a otra factura. ' +
          'Cada equipo solo puede ser asignado una vez.\n\n' +
          '💡 Verifique los equipos seleccionados o consulte el inventario.';
      } else if (backendMsg) {
        errorMessage = backendMsg;
      } else if (err?.response?.status === 500) {
        errorMessage =
          'Error interno del servidor al crear la factura. ' +
          'Intente con equipos diferentes o contacte al administrador.';
      } else {
        errorMessage = err?.message || 'Error desconocido al crear la factura';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitManualInvoice = async () => {
    if (!selectedClientId) return setError('Debe seleccionar un cliente.');
    if (!selectedUsuarioId) return setError('Debe seleccionar un usuario.');
    if (cart.length === 0) return setError('Debe agregar al menos un producto al carrito.');

    if (!isFinanciamiento(paymentMethod) && metodoPagoRequiereCaja(paymentMethod) && !cajaContadoRef) {
      return setError('Seleccioná la caja donde ingresa el pago al contado.');
    }

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

    // Gate 2 — Preemptive debt check before facturar.
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

    // Gate 3 — Stock de equipos.
    const equiposEnCarrito = cart.filter(item => item.tipoItem === 'EQUIPO' && item.recetaId);

    for (const item of equiposEnCarrito) {
      const stockDisponible = await verificarStockEquipo(item.recetaId!, item.colorId, item.medidaId);

      if (stockDisponible < item.cantidad) {
        setItemPendienteFabricacion({
          recetaId: item.recetaId!,
          recetaNombre: item.recetaNombre || 'Equipo',
          cantidad: item.cantidad - stockDisponible,
          colorId: item.colorId,
          medidaId: item.medidaId,
          medidaNombre: item.medidaNombre,
          stockDisponible,
        });
        setFabricacionDialogOpen(true);
        return;
      }
    }

    setError(null);
    setSuccess(null);

    const payload = buildFacturaDirectaPayload();

    // Si hay equipos, abrir AsignarEquiposDialog: la factura se crea recién
    // cuando el usuario confirma la asignación. Snapshot del payload para que
    // los cambios al carrito durante el modal no afecten la factura final.
    if (equiposEnCarrito.length > 0) {
      setManualFacturaDraft({
        payload,
        virtualDetallesEquipo: buildVirtualDetallesEquipo(),
      });
      setIsManualInvoice(true);
      setNotaParaAsignacion(null);
      setAsignarEquiposDialogOpen(true);
      return;
    }

    // Sin equipos: factura directa al toque.
    await submitFacturaDirecta(payload);
  };

  const handleConfirmEquiposAsignacion = async (asignaciones: { [detalleId: number]: number[] }) => {
    // Flujo manual: la "factura" todavía no existe; el dialog devuelve un mapa
    // indexado por línea del carrito (ver buildVirtualDetallesEquipo), que el
    // backend remappea a detalleIds reales después de crear la factura directa.
    if (isManualInvoice) {
      if (!manualFacturaDraft) {
        setError('Estado inconsistente: borrador de factura manual perdido. Volvé a intentar.');
        return;
      }
      await submitFacturaDirecta(manualFacturaDraft.payload, asignaciones);
      return;
    }

    // Flujo desde Nota de Pedido: la NP ya existe, convertimos a Factura.
    if (!notaParaAsignacion) return;

    setLoading(true);
    setError(null);

    const cuotasParaEnviar = notaCantidadCuotas;
    // Prefer the billing modal's tasa when the user set one; otherwise fall back
    // to the selected financing option's tasa.
    const notaMetodoEsFinanciamiento = isFinanciamiento(selectedNotaPedido?.metodoPago ?? '');
    const tasaInteresParaEnviar = notaMetodoEsFinanciamiento && billingForm.tasaInteres > 0
      ? billingForm.tasaInteres
      : (opcionesFinanciamiento.find(o => o.id === selectedOpcionId)?.tasaInteres ?? 0);

    try {
      const deudaPreconfirmada = deudaYaConfirmadaRef.current;
      deudaYaConfirmadaRef.current = false;
      const factura = await documentoApi.convertToFactura({
        notaPedidoId: notaParaAsignacion.id,
        equiposAsignaciones: asignaciones,
        descuentoTipo: notaDescuentoTipo,
        descuentoValor: notaDescuentoTipo === 'NONE' ? 0 : notaDescuentoValor,
        ...(deudaPreconfirmada && { confirmarConDeudaPendiente: true }),
        ...(cuotasParaEnviar != null && { cantidadCuotas: cuotasParaEnviar }),
        tipoFinanciacion: notaTipoFinanciacion,
        tasaInteres: tasaInteresParaEnviar,
        ...(notaPrimerVencimiento && { primerVencimiento: notaPrimerVencimiento }),
        ...resolveEntregaFields(selectedNotaPedido?.metodoPago ?? '', notaEntregaInicial, notaUsePorcentaje, notaPorcentajeEntrega, notaMontoFijoEntrega),
        ...buildCajaPayload(selectedNotaPedido?.metodoPago ?? '', cajaContadoRef),
      });

      if (notaEntregaInicial && notaMontoEntregaCalculado > 0) {
        setFacturaEntregaInfo({
          montoEntrega: notaMontoEntregaCalculado,
          montoFinanciado: notaMontoFinanciado,
          cantidadCuotas: cuotasParaEnviar,
        });
      } else {
        setFacturaEntregaInfo(null);
      }
      setAsignarEquiposDialogOpen(false);
      setNotaParaAsignacion(null);
      setCreatedFactura(factura);
      setSuccessDialogOpen(true);
      invalidateNotas();
      handleCloseConvertDialog();
    } catch (err: any) {
      console.error('Error converting to factura with equipos:', err);

      const deudaEquiposData = parseDeudaError(err);
      if (deudaEquiposData) {
        setDeudaError(deudaEquiposData);
        const notaId = notaParaAsignacion.id;
        const capturedMetodoPago = selectedNotaPedido?.metodoPago ?? '';
        const capturedCuotas = cuotasParaEnviar;
        const capturedTipoFin = notaTipoFinanciacion;
        const capturedVencimiento = notaPrimerVencimiento;
        const capturedEntregaInicial = notaEntregaInicial;
        const capturedUsePorcentaje = notaUsePorcentaje;
        const capturedPorcentajeEntrega = notaPorcentajeEntrega;
        const capturedMontoFijoEntrega = notaMontoFijoEntrega;
        const capturedMontoEntrega = notaMontoEntregaCalculado;
        const capturedMontoFinanciado = notaMontoFinanciado;
        const capturedTasaInteres = tasaInteresParaEnviar;
        pendingDeudaRef.current = async () => {
          setLoading(true);
          try {
            const facturaRetry = await documentoApi.convertToFactura({
              notaPedidoId: notaId,
              equiposAsignaciones: asignaciones,
              confirmarConDeudaPendiente: true,
              ...(capturedCuotas != null && { cantidadCuotas: capturedCuotas }),
              tipoFinanciacion: capturedTipoFin,
              tasaInteres: capturedTasaInteres,
              ...(capturedVencimiento && { primerVencimiento: capturedVencimiento }),
              ...resolveEntregaFields(capturedMetodoPago, capturedEntregaInicial, capturedUsePorcentaje, capturedPorcentajeEntrega, capturedMontoFijoEntrega),
              ...buildCajaPayload(capturedMetodoPago, cajaContadoRef),
            });
            if (capturedEntregaInicial && capturedMontoEntrega > 0) {
              setFacturaEntregaInfo({
                montoEntrega: capturedMontoEntrega,
                montoFinanciado: capturedMontoFinanciado,
                cantidadCuotas: capturedCuotas,
              });
            } else {
              setFacturaEntregaInfo(null);
            }
            setAsignarEquiposDialogOpen(false);
            setNotaParaAsignacion(null);
            setCreatedFactura(facturaRetry);
            setSuccessDialogOpen(true);
            invalidateNotas();
            handleCloseConvertDialog();
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
    setManualFacturaDraft(null);
  };

  const handleCloseBillingDialog = () => setBillingDialogOpen(false);

  // Apply billing values to the relevant state slice (manual vs nota) and
  // re-trigger the submit. setTimeout(0) so state commits before the submit
  // handler reads the new values. `billingConfirmedRef` short-circuits the
  // re-entry into the billing dialog when the submit handler runs again.
  const handleBillingConfirm = (values: BillingFormValues) => {
    billingConfirmedRef.current = true;
    setBillingForm(values); // keep latest values for any consumer that reads it (interest rate, etc.)
    if (billingMode === 'manual') {
      setCantidadCuotas(values.cantidadCuotas);
      setTipoFinanciacion(values.tipoFinanciacion);
      setPrimerVencimiento(values.primerVencimiento);
      setEntregarInicial(values.entregarInicial);
      setUsePorcentaje(values.usePorcentaje);
      setPorcentajeEntrega(values.usePorcentaje ? values.porcentajeEntregaInicial : null);
      setMontoFijoEntrega(!values.usePorcentaje ? values.montoEntregaInicial : null);
      setManualTasaInteres(values.tasaInteres);
      setBillingDialogOpen(false);
      setTimeout(() => handleSubmitManualInvoice(), 0);
    } else {
      setNotaCantidadCuotas(values.cantidadCuotas);
      setNotaTipoFinanciacion(values.tipoFinanciacion);
      setNotaPrimerVencimiento(values.primerVencimiento);
      setNotaEntregaInicial(values.entregarInicial);
      setNotaUsePorcentaje(values.usePorcentaje);
      setNotaPorcentajeEntrega(values.usePorcentaje ? values.porcentajeEntregaInicial : null);
      setNotaMontoFijoEntrega(!values.usePorcentaje ? values.montoEntregaInicial : null);
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
            colorId: d.color?.id,
            colorNombre: d.color?.nombre,
            medidaId: d.medida?.id,
            medidaNombre: d.medida?.nombre,
          }))
        : []
    );
    setEditingNotaItems(false);
    setNotaDescuentoTipo((nota.descuentoTipo as 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO') || 'NONE');
    setNotaDescuentoValor(Number(nota.descuentoValor) || 0);
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
    setNotaDescuentoTipo('NONE');
    setNotaDescuentoValor(0);
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
          descuentoTipo: notaDescuentoTipo,
          descuentoValor: notaDescuentoTipo === 'NONE' ? 0 : notaDescuentoValor,
          ...(deudaYaConfirmadaRef.current && { confirmarConDeudaPendiente: true }),
          ...(notaCantidadCuotas != null && { cantidadCuotas: notaCantidadCuotas }),
          tipoFinanciacion: notaTipoFinanciacion,
          tasaInteres: notaTasaInteres,
          ...(notaPrimerVencimiento && { primerVencimiento: notaPrimerVencimiento }),
          ...resolveEntregaFields(selectedNotaPedido?.metodoPago ?? '', notaEntregaInicial, notaUsePorcentaje, notaPorcentajeEntrega, notaMontoFijoEntrega),
          ...buildCajaPayload(selectedNotaPedido?.metodoPago ?? '', cajaContadoRef),
        });
        if (notaEntregaInicial && notaMontoEntregaCalculado > 0) {
          setFacturaEntregaInfo({ montoEntrega: notaMontoEntregaCalculado, montoFinanciado: notaMontoFinanciado, cantidadCuotas: notaCantidadCuotas });
        } else {
          setFacturaEntregaInfo(null);
        }
        invalidateNotas();
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

  // handleOpenEstadoDialog/handleUpdateEstado moved to CambiarEstadoDialog.

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
  // Normalizes legacy 'TRANSFERENCIA' to backend 'TRANSFERENCIA_BANCARIA' so the Select
  // actually finds a matching MenuItem (otherwise it renders blank).
  useEffect(() => {
    if (selectedOpcionId === null) return;
    const opcion = findOpcionByValue(selectedOpcionId);
    const normalized = normalizeMetodoPagoToBackend(opcion?.metodoPago);
    if (normalized) {
      setPaymentMethod((current) => (current === normalized ? current : normalized));
    }
  }, [selectedOpcionId, findOpcionByValue]);

  // Reverse direction: changing the method manually drops a stale option whose metodoPago
  // no longer matches, so the UI doesn't show a radio button that is effectively dead.
  // Compares after normalization so legacy 'TRANSFERENCIA' options stay linked to the
  // backend 'TRANSFERENCIA_BANCARIA' value in the Select.
  const handleChangePaymentMethod = useCallback(
    (newMethod: MetodoPago) => {
      setPaymentMethod(newMethod);
      setCajaContadoRef(null);
      if (selectedOpcionId !== null) {
        const currentOpcion = findOpcionByValue(selectedOpcionId);
        const opcionMethod = normalizeMetodoPagoToBackend(currentOpcion?.metodoPago);
        if (currentOpcion && opcionMethod !== newMethod) {
          setSelectedOpcionId(null);
        }
      }
    },
    [findOpcionByValue, selectedOpcionId]
  );

  const handleOpenFinanciamiento = async () => {
    setFinanciamientoDialogOpen(true);
    // Convert templates to financing options with calculated amounts (40/60 split,
    // template tasaInteres applied to the financed portion).
    const opcionesCalculadas: OpcionFinanciamientoDTO[] = plantillasFinanciamiento.map((template) => {
      const tasaDecimal = template.tasaInteres / 100;
      const pagoAnticipo = totalVenta * 0.4;
      const pagoFinanciado = totalVenta * 0.6 * (1 + tasaDecimal);
      return {
        nombre: template.nombre,
        metodoPago: template.metodoPago,
        cantidadCuotas: template.cantidadCuotas,
        tasaInteres: template.tasaInteres,
        montoTotal: pagoAnticipo + pagoFinanciado,
        montoCuota: pagoFinanciado / template.cantidadCuotas,
        descripcion: template.descripcion,
        ordenPresentacion: template.ordenPresentacion,
      };
    });
    setOpcionesFinanciamiento(opcionesCalculadas);
  };

  // ConfigFinanciamientoDialog manages its own newOpcionForm/showNewForm state.
  const handleAddOpcionFromDialog = (opcion: OpcionFinanciamientoDTO) => {
    setOpcionesFinanciamiento((prev) => [...prev, opcion]);
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
        <FacturarManualTab
          selectedCliente={selectedCliente}
          onChangeCliente={async (cliente) => {
            setSelectedCliente(cliente);
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
          }}
          selectedUsuarioId={selectedUsuarioId}
          onChangeUsuario={setSelectedUsuarioId}
          usuarios={usuarios}
          paymentMethod={paymentMethod}
          onChangePaymentMethod={handleChangePaymentMethod}
          cajaContadoRef={cajaContadoRef}
          onChangeCajaContado={setCajaContadoRef}
          selectedIva={selectedIva}
          onChangeIva={setSelectedIva}
          dueDate={dueDate}
          onChangeDueDate={setDueDate}
          descuentoTipo={descuentoTipo}
          onChangeDescuentoTipo={setDescuentoTipo}
          descuentoValor={descuentoValor}
          onChangeDescuentoValor={setDescuentoValor}
          notes={notes}
          onChangeNotes={setNotes}
          cart={cart}
          onAddItem={addItemToCart}
          onUpdateCartItem={updateCartItem}
          onRemoveCartItem={removeItemFromCart}
          products={products}
          recetas={recetas}
          totals={{ subtotal: subtotalVenta, descuento: descuentoAmount, iva: ivaAmount, total: totalVenta }}
          loading={loading}
          selectedClientId={selectedClientId}
          onClear={clearForm}
          onOpenFinanciamiento={handleOpenFinanciamiento}
          onSubmit={handleSubmitManualInvoice}
        />
      )}

      {/* Tab 1: From Nota de Pedido */}
      {activeTab === 1 && (
        <DesdeNotaPedidoTab
          searchTerm={notasSearchTerm}
          onChangeSearchTerm={setNotasSearchTerm}
          notasShownCount={notasPedido.length}
          totalNotas={totalNotasPedido}
          isLoading={notasQuery.isLoading}
          sortedNotas={sortedNotasPedido}
          paginatedNotas={paginatedNotasPedido}
          page={pageNotas}
          rowsPerPage={rowsPerPageNotas}
          onChangePage={handleChangePageNotas}
          onChangeRowsPerPage={handleChangeRowsPerPageNotas}
          notaOpcionesFinanciamiento={notaOpcionesFinanciamiento}
          onConvert={handleOpenConvertDialog}
          onCambiarEstado={setEstadoDoc}
        />
      )}

      <ConvertToFacturaDialog
        open={convertDialogOpen}
        onClose={handleCloseConvertDialog}
        onConfirm={handleConvertNotaToFactura}
        loading={loading}
        selectedNotaPedido={selectedNotaPedido}
        loadingOpciones={loadingOpciones}
        opcionesFinanciamiento={opcionesFinanciamiento}
        selectedOpcionId={selectedOpcionId}
        onSelectOpcion={setSelectedOpcionId}
        editingNotaItems={editingNotaItems}
        onStartEditItems={() => setEditingNotaItems(true)}
        notaCart={notaCart}
        onUpdateNotaCartItem={updateNotaCartItem}
        products={products}
        recetas={recetas}
        notaDescuentoTipo={notaDescuentoTipo}
        onChangeNotaDescuentoTipo={(next) => {
          setNotaDescuentoTipo(next);
          if (next === 'NONE') setNotaDescuentoValor(0);
        }}
        notaDescuentoValor={notaDescuentoValor}
        onChangeNotaDescuentoValor={setNotaDescuentoValor}
        notaSubtotal={notaSubtotal}
        notaDescuentoAmount={notaDescuentoAmount}
        notaIvaAmount={notaIvaAmount}
        notaFinancingAdjustment={notaFinancingAdjustment}
        notaTotalVenta={notaTotalVenta}
      />

      <CambiarEstadoDialog
        documento={estadoDoc}
        onClose={() => setEstadoDoc(null)}
        onUpdated={() => {
          setSuccess('Estado actualizado exitosamente.');
          invalidateNotas();
          loadData();
        }}
        onError={setError}
      />

      {/* Financiamiento Dialog */}
      <ConfigFinanciamientoDialog
        open={financiamientoDialogOpen}
        onClose={() => setFinanciamientoDialogOpen(false)}
        totalVenta={totalVenta}
        opciones={opcionesFinanciamiento}
        selectedOpcionId={selectedOpcionId}
        onSelectOpcion={handleSelectOpcionFinanciamiento}
        onAddOpcion={handleAddOpcionFromDialog}
        onError={setError}
      />

      <FabricacionConfirmDialog
        open={fabricacionDialogOpen}
        item={itemPendienteFabricacion}
        loading={loading}
        onCancel={handleCancelarFabricacion}
        onConfirm={handleConfirmarFabricacion}
      />

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
          ...(createdFactura.prestamoId ? [{ label: 'Crédito Personal generado', value: `#${createdFactura.prestamoId}` }] : []),
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
            label: 'Ver Crédito Personal',
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
        detallesEquipo={
          isManualInvoice
            ? (manualFacturaDraft?.virtualDetallesEquipo ?? [])
            : (notaParaAsignacion?.detalles?.filter(d => d.tipoItem === 'EQUIPO') || [])
        }
        clienteId={isManualInvoice ? selectedCliente?.id : undefined}
        notaPedidoId={isManualInvoice ? undefined : notaParaAsignacion?.id}
      />

      <BillingDialog
        open={billingDialogOpen}
        baseTotal={billingBaseTotal}
        defaultValues={billingForm}
        onClose={handleCloseBillingDialog}
        onConfirm={handleBillingConfirm}
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

export default FacturacionPage;


