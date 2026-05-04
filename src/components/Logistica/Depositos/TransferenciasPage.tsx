import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Tooltip,
  TablePagination,
  Switch,
  FormControlLabel,
  Collapse,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Send as SendIcon,
  CheckCircle as ReceiveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  LocalShipping as ShippingIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  FileDownload as FileDownloadIcon,
  TableChart as TableChartIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { transferenciaApi, depositoApi, stockDepositoApi } from '../../../api/services';
import { ubicacionEquipoApi } from '../../../api/services/ubicacionEquipoApi';
import { useAuth } from '../../../context/AuthContext';
import type {
  TransferenciaDepositoDTO,
  TransferenciaCreateDTO,
  ConfirmarRecepcionDTO,
  EstadoTransferencia,
  Deposito,
  StockDeposito,
  EquipoFabricadoDTO,
} from '../../../types';
import LoadingOverlay from '../../common/LoadingOverlay';
import { exportToExcel, prepareTableDataForExport } from '../../../utils/exportExcel';
import { exportToPDF, prepareTableDataForPDF } from '../../../utils/exportPDF';
// FRONT-003: extracted to keep this file orchestrator-shaped.
import type { ItemRecepcion, NewTransferenciaForm, RecepcionForm } from './Transferencias/types';
import { getEstadoChip } from './Transferencias/utils';
import CancelTransferenciaDialog from './Transferencias/dialogs/CancelTransferenciaDialog';
import EnvioTransferenciaDialog from './Transferencias/dialogs/EnvioTransferenciaDialog';
import ViewTransferenciaDialog from './Transferencias/dialogs/ViewTransferenciaDialog';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

dayjs.locale('es');

const TransferenciasPage: React.FC = () => {
  const { user } = useAuth();
  const [transferencias, setTransferencias] = useState<TransferenciaDepositoDTO[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [depositoFilter, setDepositoFilter] = useState<string>('all');

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Diálogos
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [envioDialogOpen, setEnvioDialogOpen] = useState(false);
  const [selectedTransferencia, setSelectedTransferencia] = useState<TransferenciaDepositoDTO | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  // Form para crear transferencia
  const [newTransferencia, setNewTransferencia] = useState<NewTransferenciaForm>({
    depositoOrigenId: '',
    depositoDestinoId: '',
    fechaTransferencia: dayjs(),
    observaciones: '',
    items: [],
  });

  // Estados para selección de productos/equipos
  const [stocksDisponibles, setStocksDisponibles] = useState<StockDeposito[]>([]);
  const [stocksDestino, setStocksDestino] = useState<StockDeposito[]>([]); // Stock en depósito destino
  const [equiposDisponibles, setEquiposDisponibles] = useState<EquipoFabricadoDTO[]>([]);
  const [selectedItemType, setSelectedItemType] = useState<'PRODUCTO' | 'EQUIPO'>('PRODUCTO');

  const [recepcionData, setRecepcionData] = useState<RecepcionForm>({
    fechaRecepcion: dayjs(),
    items: [],
    usarDistribucionMultiple: false,
  });

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Export menu state
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const exportMenuOpen = Boolean(exportAnchorEl);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar depósitos primero (siempre necesarios)
      try {
        const depositosData = await depositoApi.getAll();
        const depositosArray = Array.isArray(depositosData) 
          ? depositosData 
          : (depositosData as any)?.content || [];
        setDepositos(depositosArray.filter((d: any) => d.activo));
      } catch (errDepositos) {
        console.error('Error loading depositos:', errDepositos);
      }

      // Cargar transferencias (puede fallar si el endpoint no existe aún)
      try {
        const transferenciasData = await transferenciaApi.getAll({}, { empresaId: user?.empresaId });
        const transferenciasArray = Array.isArray(transferenciasData) 
          ? transferenciasData 
          : (transferenciasData as any)?.content || [];
        setTransferencias(transferenciasArray);
      } catch (errTransferencias: any) {
        console.error('Error loading transferencias:', errTransferencias);
        // Si es 403/404, el endpoint puede no estar implementado en el backend
        if (errTransferencias.response?.status === 403 || errTransferencias.response?.status === 404) {
          console.warn('Endpoint de transferencias no disponible o sin permisos');
          setTransferencias([]);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadStocksDisponibles = async (depositoId: number) => {
    try {
      const stocksData = await stockDepositoApi.getByDeposito(depositoId);
      const stocksArray = Array.isArray(stocksData) 
        ? stocksData 
        : (stocksData as any)?.content || [];
      setStocksDisponibles(stocksArray.filter((s: any) => s.cantidad > 0));
    } catch (err) {
      console.error('Error loading stocks:', err);
    }
  };

  const loadStocksDestino = async (depositoId: number) => {
    try {
      const stocksData = await stockDepositoApi.getByDeposito(depositoId);
      const stocksArray = Array.isArray(stocksData) 
        ? stocksData 
        : (stocksData as any)?.content || [];
      setStocksDestino(stocksArray);
    } catch (err) {
      console.error('Error loading stocks destino:', err);
      setStocksDestino([]);
    }
  };

  const loadEquiposDisponibles = async (depositoId: number) => {
    try {
      // Obtener ubicaciones de equipos en el depósito de origen
      const ubicaciones = await ubicacionEquipoApi.getByDeposito(depositoId);
      
      // Obtener los IDs de equipos ubicados en este depósito
      const equiposEnDeposito = ubicaciones.map(u => ({
        id: u.equipoFabricadoId,
        numeroHeladera: u.equipoNumeroHeladera,
        modelo: u.equipoModelo,
        tipo: u.equipoTipo
      }));
      
      // Convertir a formato EquipoFabricadoDTO para el selector
      setEquiposDisponibles(
        equiposEnDeposito.map(e => ({
          id: e.id,
          numeroHeladera: e.numeroHeladera,
          modelo: e.modelo,
          tipo: e.tipo,
          estado: 'COMPLETADO',
          estadoAsignacion: 'DISPONIBLE'
        } as any))
      );
    } catch (err) {
      console.error('Error loading equipos disponibles:', err);
      setEquiposDisponibles([]);
    }
  };

  const handleCreateTransferencia = async () => {
    if (!newTransferencia.depositoOrigenId || !newTransferencia.depositoDestinoId) {
      setError('Debe seleccionar depósito origen y destino');
      return;
    }

    if (newTransferencia.items.length === 0) {
      setError('Debe agregar al menos un ítem a la transferencia');
      return;
    }

    // Validar que ningún item exceda el stock disponible
    const itemsConExceso = newTransferencia.items.filter(item => {
      if (item.tipo === 'PRODUCTO' && item.productoId) {
        const stockOrigen = stocksDisponibles.find(s => s.productoId === item.productoId);
        return (item.cantidad || 0) > (stockOrigen?.cantidad || 0);
      }
      return false;
    });

    if (itemsConExceso.length > 0) {
      setError('No puede transferir más unidades de las disponibles en el depósito de origen');
      return;
    }

    // Validar que todos los items tengan cantidad válida (mayor a 0)
    const itemsSinCantidad = newTransferencia.items.filter(item => 
      item.tipo === 'PRODUCTO' && (!item.cantidad || item.cantidad <= 0)
    );

    if (itemsSinCantidad.length > 0) {
      setError('Todos los productos deben tener una cantidad mayor a 0');
      return;
    }

    try {
      setLoading(true);

      const dto: TransferenciaCreateDTO = {
        depositoOrigenId: newTransferencia.depositoOrigenId as number,
        depositoDestinoId: newTransferencia.depositoDestinoId as number,
        fechaTransferencia: newTransferencia.fechaTransferencia.toISOString(),
        observaciones: newTransferencia.observaciones,
        usuarioSolicitudId: user?.id || 0,
        items: newTransferencia.items.map(item => ({
          productoId: item.productoId,
          equipoFabricadoId: item.equipoFabricadoId,
          cantidadSolicitada: item.cantidad, // Backend espera cantidadSolicitada
        })),
      };

      await transferenciaApi.create(dto);
      setSuccess('Transferencia creada correctamente');
      setCreateDialogOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      console.error('Error creating transferencia:', err);
      setError(err.response?.data?.message || 'Error al crear la transferencia');
    } finally {
      setLoading(false);
    }
  };

  // Inicializar datos de recepción cuando se abre el diálogo
  const inicializarRecepcion = (transferencia: TransferenciaDepositoDTO) => {
    const items: ItemRecepcion[] = transferencia.items.map(item => ({
      detalleId: item.id!,
      productoId: item.productoId,
      equipoFabricadoId: item.equipoFabricadoId,
      nombreItem: item.productoId
        ? `${item.productoNombre} (${item.productoCodigo})`
        : `Equipo: ${item.equipoNumero}`,
      cantidadSolicitada: item.cantidadSolicitada,
      cantidadRecibida: item.cantidadSolicitada, // Por defecto, recibir todo
      distribuciones: [],
      observaciones: '',
    }));

    setRecepcionData({
      fechaRecepcion: dayjs(),
      items,
      usarDistribucionMultiple: false,
    });
  };

  const resetRecepcionData = () => {
    setRecepcionData({
      fechaRecepcion: dayjs(),
      items: [],
      usarDistribucionMultiple: false,
    });
    setExpandedItems(new Set());
  };

  const validarDistribuciones = (items: ItemRecepcion[]): string[] => {
    const errores: string[] = [];

    items.forEach((item) => {
      if (item.cantidadRecibida === 0) return;

      const sumaDistribuciones = item.distribuciones.reduce((sum, d) => sum + d.cantidad, 0);

      if (sumaDistribuciones !== item.cantidadRecibida) {
        errores.push(
          `${item.nombreItem}: suma de distribuciones (${sumaDistribuciones}) ≠ cantidad recibida (${item.cantidadRecibida})`
        );
      }

      // Validar depósitos duplicados
      const depositosIds = item.distribuciones.map(d => d.depositoId);
      const duplicados = depositosIds.filter((id, idx) => depositosIds.indexOf(id) !== idx);
      if (duplicados.length > 0) {
        errores.push(`${item.nombreItem}: depósito duplicado`);
      }
    });

    return errores;
  };

  // Export functions
  const handleExportExcel = async () => {
    try {
      const filtrosAplicados: Record<string, any> = {};

      if (estadoFilter !== 'all') {
        filtrosAplicados['Estado'] = estadoFilter;
      }
      if (depositoFilter !== 'all') {
        const deposito = depositos.find(d => d.id.toString() === depositoFilter);
        filtrosAplicados['Depósito'] = deposito?.nombre || depositoFilter;
      }

      const dataParaExportar = prepareTableDataForExport(filteredTransferencias, [
        {
          key: 'numero' as keyof TransferenciaDepositoDTO,
          header: 'Número',
          transform: (_, row) => `#${row.id}`
        },
        { key: 'fechaTransferencia', header: 'Fecha', format: 'datetime' },
        { key: 'depositoOrigenNombre', header: 'Origen' },
        { key: 'depositoDestinoNombre', header: 'Destino' },
        {
          key: 'items',
          header: 'Productos/Equipos',
          transform: (items) => items?.length || 0
        },
        { key: 'estado', header: 'Estado' },
        { key: 'usuarioSolicitudNombre', header: 'Creado Por' },
        { key: 'observaciones', header: 'Observaciones' },
      ]);

      // Preparar datos de items por transferencia
      const detalleItems = filteredTransferencias.flatMap(trans =>
        trans.items.map(item => ({
          'Transferencia': `#${trans.id}`,
          'Fecha': dayjs(trans.fechaTransferencia).format('DD/MM/YYYY HH:mm'),
          'Tipo': item.productoId ? 'Producto' : 'Equipo',
          'Item': item.productoId ? item.productoNombre : item.equipoNumero,
          'Código': item.productoCodigo || '-',
          'Cantidad Solicitada': item.cantidadSolicitada,
          'Cantidad Recibida': item.cantidadRecibida || '-',
          'Estado': trans.estado,
        }))
      );

      await exportToExcel({
        fileName: `transferencias-${dayjs().format('YYYY-MM-DD')}`,
        metadata: {
          title: 'Transferencias entre Depósitos',
          generatedBy: user?.nombre || 'Usuario',
          generatedAt: dayjs().format('DD/MM/YYYY HH:mm:ss'),
          filters: filtrosAplicados,
        },
        sheets: [
          {
            name: 'Resumen',
            data: dataParaExportar,
          },
          {
            name: 'Detalle de Items',
            data: detalleItems,
          },
        ],
      });

      setSuccess('Archivo Excel exportado correctamente');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      setError('Error al exportar a Excel');
    }
  };

  const handleExportPDF = () => {
    try {
      const filtrosAplicados: Record<string, any> = {};

      if (estadoFilter !== 'all') {
        filtrosAplicados['Estado'] = estadoFilter;
      }
      if (depositoFilter !== 'all') {
        const deposito = depositos.find(d => d.id.toString() === depositoFilter);
        filtrosAplicados['Depósito'] = deposito?.nombre || depositoFilter;
      }

      const { headers, rows } = prepareTableDataForPDF(filteredTransferencias, [
        {
          key: 'id',
          header: 'Nº',
          transform: (id) => `#${id}`
        },
        { key: 'fechaTransferencia', header: 'Fecha', format: 'datetime' },
        { key: 'depositoOrigenNombre', header: 'Origen' },
        { key: 'depositoDestinoNombre', header: 'Destino' },
        {
          key: 'items',
          header: 'Items',
          transform: (items) => items?.length || 0
        },
        { key: 'estado', header: 'Estado' },
      ]);

      exportToPDF({
        fileName: `transferencias-${dayjs().format('YYYY-MM-DD')}`,
        title: 'Transferencias entre Depósitos',
        orientation: 'landscape',
        metadata: {
          generatedBy: user?.nombre || 'Usuario',
          generatedAt: dayjs().format('DD/MM/YYYY HH:mm:ss'),
          filters: filtrosAplicados,
        },
        tables: [
          {
            headers,
            rows,
            showFooter: true,
            footerText: `Total de transferencias: ${filteredTransferencias.length}`,
          },
        ],
      });

      setSuccess('Archivo PDF exportado correctamente');
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      setError('Error al exportar a PDF');
    }
  };

  const handleOpenEnvioDialog = (transferencia: TransferenciaDepositoDTO) => {
    setSelectedTransferencia(transferencia);
    setEnvioDialogOpen(true);
  };

  const handleConfirmarEnvio = async () => {
    if (!selectedTransferencia) return;

    try {
      setLoading(true);
      await transferenciaApi.confirmarEnvio(selectedTransferencia.id!);
      setSuccess('Transferencia enviada correctamente');
      setEnvioDialogOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Error confirming envío:', err);
      setError(err.response?.data?.message || 'Error al confirmar el envío');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarRecepcion = async () => {
    if (!selectedTransferencia) return;

    // Validar que al menos un item tenga cantidad > 0
    const tieneItemsRecibidos = recepcionData.items.some(item => item.cantidadRecibida > 0);
    if (!tieneItemsRecibidos) {
      setError('Debe recibir al menos un item');
      return;
    }

    // Validar distribuciones si están habilitadas
    if (recepcionData.usarDistribucionMultiple) {
      const erroresDistribucion = validarDistribuciones(recepcionData.items);
      if (erroresDistribucion.length > 0) {
        setError(erroresDistribucion.join(', '));
        return;
      }
    }

    try {
      setLoading(true);

      const dto: ConfirmarRecepcionDTO = {
        transferenciaId: selectedTransferencia.id!,
        fechaRecepcion: recepcionData.fechaRecepcion.toISOString(),
        usuarioRecepcionId: user?.id || 0,
        items: recepcionData.items.map(item => ({
          id: item.detalleId,
          cantidadRecibida: item.cantidadRecibida,
          observaciones: item.observaciones,
          // Si hay distribuciones, incluirlas
          distribucionDepositos: recepcionData.usarDistribucionMultiple && item.distribuciones.length > 0
            ? item.distribuciones.map(d => ({
                depositoId: d.depositoId,
                cantidad: d.cantidad
              }))
            : undefined
        }))
      };

      await transferenciaApi.confirmarRecepcion(dto);
      setSuccess('Recepción confirmada correctamente');
      setReceiveDialogOpen(false);
      resetRecepcionData();
      setSelectedTransferencia(null);
      await loadData();
    } catch (err: any) {
      console.error('Error confirming recepción:', err);
      setError(err.response?.data?.message || 'Error al confirmar la recepción');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancelDialog = (transferencia: TransferenciaDepositoDTO) => {
    setSelectedTransferencia(transferencia);
    setMotivoCancelacion('');
    setCancelDialogOpen(true);
  };

  const handleCancelarTransferencia = async () => {
    if (!selectedTransferencia || !motivoCancelacion.trim()) {
      setError('Debe ingresar un motivo de cancelación');
      return;
    }

    try {
      setLoading(true);
      await transferenciaApi.cancelar(selectedTransferencia.id!, motivoCancelacion);
      setSuccess('Transferencia cancelada correctamente');
      setCancelDialogOpen(false);
      setMotivoCancelacion('');
      await loadData();
    } catch (err: any) {
      console.error('Error cancelling transferencia:', err);
      setError(err.response?.data?.message || 'Error al cancelar la transferencia');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarItem = () => {
    if (selectedItemType === 'PRODUCTO') {
      setNewTransferencia(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            tipo: 'PRODUCTO',
            productoId: undefined,
            cantidad: 1,
          },
        ],
      }));
    } else {
      setNewTransferencia(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            tipo: 'EQUIPO',
            equipoFabricadoId: undefined,
            cantidad: 1, // Los equipos siempre tienen cantidad 1
          },
        ],
      }));
    }
  };

  const handleEliminarItem = (index: number) => {
    setNewTransferencia(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setNewTransferencia(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          // Si se selecciona un producto, buscar su información
          if (field === 'productoId') {
            const stock = stocksDisponibles.find(s => s.productoId === value);
            return {
              ...item,
              productoId: value,
              productoNombre: stock?.productoNombre,
            };
          }
          // Si se selecciona un equipo, buscar su información
          if (field === 'equipoFabricadoId') {
            const equipo = equiposDisponibles.find(e => e.id === value);
            return {
              ...item,
              equipoFabricadoId: value,
              equipoNumero: equipo?.numeroHeladera,
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      }),
    }));
  };

  const resetForm = () => {
    setNewTransferencia({
      depositoOrigenId: '',
      depositoDestinoId: '',
      fechaTransferencia: dayjs(),
      observaciones: '',
      items: [],
    });
    setStocksDisponibles([]);
    setStocksDestino([]);
    setEquiposDisponibles([]);
  };

  const filteredTransferencias = transferencias.filter(t => {
    const matchesEstado = estadoFilter === 'all' || t.estado === estadoFilter;
    const matchesDeposito =
      depositoFilter === 'all' ||
      t.depositoOrigenId === Number(depositoFilter) ||
      t.depositoDestinoId === Number(depositoFilter);
    return matchesEstado && matchesDeposito;
  });

  const paginatedTransferencias = filteredTransferencias.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Metrics calculations
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const transferenciasPorEstado = useMemo(() => {
    const estadoMap = new Map<EstadoTransferencia, number>();
    transferencias.forEach((t) => {
      const count = estadoMap.get(t.estado) || 0;
      estadoMap.set(t.estado, count + 1);
    });

    return [
      { name: 'Pendiente', value: estadoMap.get('PENDIENTE') || 0, estado: 'PENDIENTE' },
      { name: 'En Tránsito', value: estadoMap.get('EN_TRANSITO') || 0, estado: 'EN_TRANSITO' },
      { name: 'Recibida', value: estadoMap.get('RECIBIDA') || 0, estado: 'RECIBIDA' },
      { name: 'Cancelada', value: estadoMap.get('CANCELADA') || 0, estado: 'CANCELADA' },
    ].filter((item) => item.value > 0);
  }, [transferencias]);

  const transferenciasUltimosMeses = useMemo(() => {
    const monthMap = new Map<string, number>();
    const now = dayjs();

    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const month = now.subtract(i, 'month').format('MMM YYYY');
      monthMap.set(month, 0);
    }

    transferencias.forEach((t) => {
      const month = dayjs(t.fechaTransferencia).format('MMM YYYY');
      if (monthMap.has(month)) {
        monthMap.set(month, (monthMap.get(month) || 0) + 1);
      }
    });

    return Array.from(monthMap.entries()).map(([month, count]) => ({
      month,
      count,
    }));
  }, [transferencias]);

  const depositosConMasMovimientos = useMemo(() => {
    const depositoMap = new Map<number, { nombre: string; salidas: number; entradas: number }>();

    transferencias.forEach((t) => {
      // Contabilizar salidas
      if (!depositoMap.has(t.depositoOrigenId)) {
        depositoMap.set(t.depositoOrigenId, {
          nombre: t.depositoOrigenNombre || `Depósito ${t.depositoOrigenId}`,
          salidas: 0,
          entradas: 0,
        });
      }
      const origen = depositoMap.get(t.depositoOrigenId)!;
      origen.salidas += 1;

      // Contabilizar entradas
      if (!depositoMap.has(t.depositoDestinoId)) {
        depositoMap.set(t.depositoDestinoId, {
          nombre: t.depositoDestinoNombre || `Depósito ${t.depositoDestinoId}`,
          salidas: 0,
          entradas: 0,
        });
      }
      const destino = depositoMap.get(t.depositoDestinoId)!;
      destino.entradas += 1;
    });

    return Array.from(depositoMap.values())
      .map((d) => ({
        nombre: d.nombre,
        salidas: d.salidas,
        entradas: d.entradas,
        total: d.salidas + d.entradas,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transferencias]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        <LoadingOverlay open={loading} message="Cargando transferencias..." />
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
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
            }}
          >
            <ShippingIcon sx={{ fontSize: { xs: 28, md: 35 } }} />
            Transferencias
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={(e) => setExportAnchorEl(e.currentTarget)}
              fullWidth
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Exportar
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
              fullWidth
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              fullWidth
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Nueva
            </Button>
          </Box>
        </Box>

        {/* Export Menu */}
        <Menu
          anchorEl={exportAnchorEl}
          open={exportMenuOpen}
          onClose={() => setExportAnchorEl(null)}
        >
          <MenuItem
            onClick={() => {
              handleExportExcel();
              setExportAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <TableChartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Exportar a Excel</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleExportPDF();
              setExportAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <PictureAsPdfIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Exportar a PDF</ListItemText>
          </MenuItem>
        </Menu>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Transferencias
                </Typography>
                <Typography variant="h4">{transferencias.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Pendientes
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {transferencias.filter((t) => t.estado === 'PENDIENTE').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  En Tránsito
                </Typography>
                <Typography variant="h4" color="info.main">
                  {transferencias.filter((t) => t.estado === 'EN_TRANSITO').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Recibidas
                </Typography>
                <Typography variant="h4" color="success.main">
                  {transferencias.filter((t) => t.estado === 'RECIBIDA').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Transferencias por Estado
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={transferenciasPorEstado}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {transferenciasPorEstado.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Transferencias Últimos 6 Meses
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={transferenciasUltimosMeses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Transferencias"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top 5 Depósitos con Más Movimientos
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={depositosConMasMovimientos} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nombre" type="category" width={100} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="salidas" fill="#FF8042" name="Salidas" />
                    <Bar dataKey="entradas" fill="#00C49F" name="Entradas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={estadoFilter}
                    label="Estado"
                    onChange={(e) => setEstadoFilter(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                    <MenuItem value="EN_TRANSITO">En Tránsito</MenuItem>
                    <MenuItem value="RECIBIDA">Recibida</MenuItem>
                    <MenuItem value="CANCELADA">Cancelada</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Depósito</InputLabel>
                  <Select
                    value={depositoFilter}
                    label="Depósito"
                    onChange={(e) => setDepositoFilter(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {depositos.map(d => (
                      <MenuItem key={d.id} value={d.id.toString()}>
                        {d.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de Transferencias */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Origen</TableCell>
                    <TableCell>Destino</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTransferencias.map(transferencia => (
                    <TableRow key={transferencia.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {transferencia.numero}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {dayjs(transferencia.fechaTransferencia).format('DD/MM/YYYY HH:mm')}
                      </TableCell>
                      <TableCell>{transferencia.depositoOrigenNombre}</TableCell>
                      <TableCell>{transferencia.depositoDestinoNombre}</TableCell>
                      <TableCell>{getEstadoChip(transferencia.estado)}</TableCell>
                      <TableCell>{transferencia.items.length}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transferencia.usuarioSolicitudNombre}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="Ver detalle">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedTransferencia(transferencia);
                                setViewDialogOpen(true);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          {transferencia.estado === 'PENDIENTE' && (
                            <>
                              <Tooltip title="Confirmar envío">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenEnvioDialog(transferencia)}
                                >
                                  <SendIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancelar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenCancelDialog(transferencia)}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                          {transferencia.estado === 'EN_TRANSITO' && (
                            <>
                              <Tooltip title="Confirmar recepción">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => {
                                    setSelectedTransferencia(transferencia);
                                    inicializarRecepcion(transferencia);
                                    setReceiveDialogOpen(true);
                                  }}
                                >
                                  <ReceiveIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancelar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenCancelDialog(transferencia)}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedTransferencias.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" py={4}>
                          No se encontraron transferencias
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredTransferencias.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </CardContent>
        </Card>

        {/* Diálogo: Crear Transferencia */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Nueva Transferencia</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Depósito Origen</InputLabel>
                    <Select
                      value={newTransferencia.depositoOrigenId}
                      label="Depósito Origen"
                      onChange={(e) => {
                        const depositoId = e.target.value as number;
                        setNewTransferencia(prev => ({
                          ...prev,
                          depositoOrigenId: depositoId,
                        }));
                        if (depositoId) {
                          loadStocksDisponibles(depositoId);
                          loadEquiposDisponibles(depositoId);
                        }
                      }}
                    >
                      {depositos.map(d => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Depósito Destino</InputLabel>
                    <Select
                      value={newTransferencia.depositoDestinoId}
                      label="Depósito Destino"
                      onChange={(e) => {
                        const depositoId = e.target.value as number;
                        setNewTransferencia(prev => ({
                          ...prev,
                          depositoDestinoId: depositoId,
                        }));
                        if (depositoId) {
                          loadStocksDestino(depositoId);
                        }
                      }}
                      disabled={!newTransferencia.depositoOrigenId}
                    >
                      {depositos
                        .filter(d => d.id !== newTransferencia.depositoOrigenId)
                        .map(d => (
                          <MenuItem key={d.id} value={d.id}>
                            {d.nombre}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <DateTimePicker
                label="Fecha de Transferencia"
                value={newTransferencia.fechaTransferencia}
                onChange={(newValue) =>
                  setNewTransferencia(prev => ({
                    ...prev,
                    fechaTransferencia: newValue ? dayjs(newValue) : dayjs(),
                  }))
                }
                slotProps={{ textField: { fullWidth: true } }}
              />

              <TextField
                label="Observaciones"
                multiline
                rows={3}
                value={newTransferencia.observaciones}
                onChange={(e) =>
                  setNewTransferencia(prev => ({
                    ...prev,
                    observaciones: e.target.value,
                  }))
                }
                fullWidth
              />

              {/* Sección de Items */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Items a Transferir</Typography>
                  <Box display="flex" gap={1}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Tipo de Item</InputLabel>
                      <Select
                        value={selectedItemType}
                        label="Tipo de Item"
                        onChange={(e) => setSelectedItemType(e.target.value as 'PRODUCTO' | 'EQUIPO')}
                      >
                        <MenuItem value="PRODUCTO">Producto</MenuItem>
                        <MenuItem value="EQUIPO">Equipo</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAgregarItem}
                      disabled={!newTransferencia.depositoOrigenId}
                    >
                      Agregar Item
                    </Button>
                  </Box>
                </Box>

                {newTransferencia.items.map((item, index) => {
                  // Obtener info de stock en origen y destino para este producto
                  const stockOrigen = stocksDisponibles.find(s => s.productoId === item.productoId);
                  const stockDestino = stocksDestino.find(s => s.productoId === item.productoId);
                  const depositoOrigenNombre = depositos.find(d => d.id === newTransferencia.depositoOrigenId)?.nombre;
                  const depositoDestinoNombre = depositos.find(d => d.id === newTransferencia.depositoDestinoId)?.nombre;
                  
                  return (
                  <Card key={index} sx={{ mb: 2, p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={item.tipo === 'PRODUCTO' ? 5 : 8}>
                        <FormControl fullWidth size="small">
                          <InputLabel>
                            {item.tipo === 'PRODUCTO' ? 'Producto' : 'Equipo'}
                          </InputLabel>
                          <Select
                            value={item.tipo === 'PRODUCTO' ? item.productoId || '' : item.equipoFabricadoId || ''}
                            label={item.tipo === 'PRODUCTO' ? 'Producto' : 'Equipo'}
                            onChange={(e) =>
                              handleUpdateItem(
                                index,
                                item.tipo === 'PRODUCTO' ? 'productoId' : 'equipoFabricadoId',
                                e.target.value
                              )
                            }
                          >
                            {item.tipo === 'PRODUCTO'
                              ? stocksDisponibles.map(s => (
                                  <MenuItem key={s.productoId} value={s.productoId}>
                                    {s.productoNombre} (Stock: {s.cantidad})
                                  </MenuItem>
                                ))
                              : equiposDisponibles.map(e => (
                                  <MenuItem key={e.id} value={e.id}>
                                    {e.numeroHeladera} - {e.modelo}
                                  </MenuItem>
                                ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {item.tipo === 'PRODUCTO' && (
                        <Grid item xs={12} md={3}>
                          <TextField
                            label="Cantidad"
                            type="number"
                            size="small"
                            value={item.cantidad || 1}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              const maxStock = stockOrigen?.cantidad || 0;
                              // Limitar al máximo disponible
                              const limitedValue = Math.min(Math.max(1, value), maxStock);
                              handleUpdateItem(index, 'cantidad', limitedValue);
                            }}
                            inputProps={{
                              min: 1,
                              max: stockOrigen?.cantidad || 0,
                            }}
                            error={(item.cantidad || 0) > (stockOrigen?.cantidad || 0)}
                            helperText={
                              (item.cantidad || 0) > (stockOrigen?.cantidad || 0)
                                ? `Máximo disponible: ${stockOrigen?.cantidad || 0}`
                                : `Disponible: ${stockOrigen?.cantidad || 0}`
                            }
                            fullWidth
                          />
                        </Grid>
                      )}

                      <Grid item xs={12} md={2}>
                        <IconButton
                          color="error"
                          onClick={() => handleEliminarItem(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>

                      {/* Mostrar información de stock en ambos depósitos */}
                      {item.tipo === 'PRODUCTO' && item.productoId && (
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Box display="flex" gap={3} flexWrap="wrap" alignItems="center">
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Stock en {depositoOrigenNombre || 'Origen'}:
                              </Typography>
                              <Chip 
                                label={stockOrigen?.cantidad ?? 0} 
                                size="small" 
                                color={stockOrigen && stockOrigen.cantidad > 0 ? 'success' : 'error'}
                                sx={{ ml: 1 }}
                              />
                            </Box>
                            {newTransferencia.depositoDestinoId && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Stock en {depositoDestinoNombre || 'Destino'}:
                                </Typography>
                                <Chip 
                                  label={stockDestino?.cantidad ?? 0} 
                                  size="small" 
                                  color="info"
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                            )}
                            {item.cantidad && stockOrigen && (() => {
                              const stockRestante = (stockOrigen?.cantidad || 0) - (item.cantidad || 0);
                              const esExceso = stockRestante < 0;
                              return (
                              <Box>
                                <Typography variant="caption" color={esExceso ? 'error' : 'text.secondary'}>
                                  Después de transferir:
                                </Typography>
                                <Chip 
                                  label={`${depositoOrigenNombre}: ${stockRestante}`} 
                                  size="small" 
                                  color={esExceso ? 'error' : 'warning'}
                                  variant={esExceso ? 'filled' : 'outlined'}
                                  sx={{ ml: 1 }}
                                />
                                <Chip 
                                  label={`${depositoDestinoNombre}: ${(stockDestino?.cantidad ?? 0) + (item.cantidad || 0)}`} 
                                  size="small" 
                                  color="success"
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                                {esExceso && (
                                  <Chip 
                                    icon={<WarningIcon />}
                                    label="Stock insuficiente" 
                                    size="small" 
                                    color="error"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                              );
                            })()}
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Card>
                  );
                })}

                {newTransferencia.items.length === 0 && (
                  <Alert severity="info">
                    Agregue al menos un item para crear la transferencia
                  </Alert>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setCreateDialogOpen(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateTransferencia}
              disabled={
                loading ||
                !newTransferencia.depositoOrigenId ||
                !newTransferencia.depositoDestinoId ||
                newTransferencia.items.length === 0
              }
            >
              Crear Transferencia
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo: Ver Detalle */}
        <ViewTransferenciaDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          transferencia={selectedTransferencia}
        />

        {/* Diálogo: Confirmar Recepción Mejorado */}
        <Dialog
          open={receiveDialogOpen}
          onClose={() => {
            setReceiveDialogOpen(false);
            resetRecepcionData();
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Confirmar Recepción - {selectedTransferencia?.numero}
              </Typography>
              {selectedTransferencia && (
                <Typography variant="body2" color="text.secondary">
                  {selectedTransferencia.depositoOrigenNombre} → {selectedTransferencia.depositoDestinoNombre}
                </Typography>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {/* Toggle para distribución multi-depósito */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={recepcionData.usarDistribucionMultiple}
                      onChange={(e) =>
                        setRecepcionData(prev => ({
                          ...prev,
                          usarDistribucionMultiple: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Habilitar distribución a múltiples depósitos"
                />
                <DateTimePicker
                  label="Fecha de Recepción"
                  value={recepcionData.fechaRecepcion}
                  onChange={(newValue) =>
                    setRecepcionData(prev => ({
                      ...prev,
                      fechaRecepcion: newValue ? dayjs(newValue) : dayjs(),
                    }))
                  }
                  slotProps={{ textField: { size: 'small', sx: { width: 250 } } }}
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Tabla de Items */}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={40}></TableCell>
                      <TableCell>Producto/Equipo</TableCell>
                      <TableCell align="center" width={120}>Solicitada</TableCell>
                      <TableCell align="center" width={120}>A Recibir</TableCell>
                      <TableCell align="center" width={100}>Diferencia</TableCell>
                      <TableCell width={200}>Observaciones</TableCell>
                      {recepcionData.usarDistribucionMultiple && (
                        <TableCell align="center" width={120}>Distribución</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recepcionData.items.map((item, index) => (
                      <React.Fragment key={index}>
                        <TableRow>
                          <TableCell>
                            {recepcionData.usarDistribucionMultiple && (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const newExpanded = new Set(expandedItems);
                                  if (newExpanded.has(index)) {
                                    newExpanded.delete(index);
                                  } else {
                                    newExpanded.add(index);
                                  }
                                  setExpandedItems(newExpanded);
                                }}
                              >
                                {expandedItems.has(index) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.nombreItem}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={item.cantidadSolicitada} size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={item.cantidadRecibida}
                              onChange={(e) => {
                                const valor = parseInt(e.target.value) || 0;
                                const newItems = [...recepcionData.items];
                                newItems[index].cantidadRecibida = Math.max(0, Math.min(valor, item.cantidadSolicitada));
                                setRecepcionData(prev => ({ ...prev, items: newItems }));
                              }}
                              inputProps={{
                                min: 0,
                                max: item.cantidadSolicitada,
                                style: { textAlign: 'center' }
                              }}
                              sx={{ width: 80 }}
                              error={item.cantidadRecibida > item.cantidadSolicitada}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.cantidadRecibida - item.cantidadSolicitada}
                              size="small"
                              color={
                                item.cantidadRecibida === item.cantidadSolicitada
                                  ? 'success'
                                  : item.cantidadRecibida < item.cantidadSolicitada
                                  ? 'warning'
                                  : 'error'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="Observaciones..."
                              value={item.observaciones}
                              onChange={(e) => {
                                const newItems = [...recepcionData.items];
                                newItems[index].observaciones = e.target.value;
                                setRecepcionData(prev => ({ ...prev, items: newItems }));
                              }}
                            />
                          </TableCell>
                          {recepcionData.usarDistribucionMultiple && (
                            <TableCell align="center">
                              {item.distribuciones.length > 0 && (
                                <Chip
                                  label={`${item.distribuciones.reduce((sum, d) => sum + d.cantidad, 0)} / ${item.cantidadRecibida}`}
                                  size="small"
                                  color={
                                    item.distribuciones.reduce((sum, d) => sum + d.cantidad, 0) === item.cantidadRecibida
                                      ? 'success'
                                      : 'warning'
                                  }
                                  icon={
                                    item.distribuciones.reduce((sum, d) => sum + d.cantidad, 0) !== item.cantidadRecibida
                                      ? <WarningIcon />
                                      : undefined
                                  }
                                />
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                        {/* Panel de distribución expandible */}
                        {recepcionData.usarDistribucionMultiple && (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ p: 0, borderBottom: expandedItems.has(index) ? 1 : 0 }}>
                              <Collapse in={expandedItems.has(index)}>
                                <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Distribución por Depósito - {item.nombreItem}
                                  </Typography>
                                  <Grid container spacing={2}>
                                    {item.distribuciones.map((dist, distIndex) => (
                                      <Grid item xs={12} md={6} key={distIndex}>
                                        <Card variant="outlined">
                                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                            <Grid container spacing={2} alignItems="center">
                                              <Grid item xs={7}>
                                                <FormControl fullWidth size="small">
                                                  <InputLabel>Depósito</InputLabel>
                                                  <Select
                                                    value={dist.depositoId}
                                                    label="Depósito"
                                                    onChange={(e) => {
                                                      const deposito = depositos.find(d => d.id === e.target.value);
                                                      const newItems = [...recepcionData.items];
                                                      newItems[index].distribuciones[distIndex] = {
                                                        depositoId: e.target.value as number,
                                                        depositoNombre: deposito?.nombre || '',
                                                        cantidad: dist.cantidad,
                                                      };
                                                      setRecepcionData(prev => ({ ...prev, items: newItems }));
                                                    }}
                                                  >
                                                    {depositos.map(d => (
                                                      <MenuItem key={d.id} value={d.id}>
                                                        {d.nombre}
                                                      </MenuItem>
                                                    ))}
                                                  </Select>
                                                </FormControl>
                                              </Grid>
                                              <Grid item xs={3}>
                                                <TextField
                                                  type="number"
                                                  size="small"
                                                  label="Cantidad"
                                                  value={dist.cantidad}
                                                  onChange={(e) => {
                                                    const valor = parseInt(e.target.value) || 0;
                                                    const newItems = [...recepcionData.items];
                                                    newItems[index].distribuciones[distIndex].cantidad = Math.max(0, valor);
                                                    setRecepcionData(prev => ({ ...prev, items: newItems }));
                                                  }}
                                                  inputProps={{ min: 0 }}
                                                  fullWidth
                                                />
                                              </Grid>
                                              <Grid item xs={2}>
                                                <IconButton
                                                  size="small"
                                                  color="error"
                                                  onClick={() => {
                                                    const newItems = [...recepcionData.items];
                                                    newItems[index].distribuciones.splice(distIndex, 1);
                                                    setRecepcionData(prev => ({ ...prev, items: newItems }));
                                                  }}
                                                >
                                                  <DeleteIcon />
                                                </IconButton>
                                              </Grid>
                                            </Grid>
                                          </CardContent>
                                        </Card>
                                      </Grid>
                                    ))}
                                    <Grid item xs={12}>
                                      <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                          const newItems = [...recepcionData.items];
                                          newItems[index].distribuciones.push({
                                            depositoId: 0,
                                            depositoNombre: '',
                                            cantidad: 0,
                                          });
                                          setRecepcionData(prev => ({ ...prev, items: newItems }));
                                        }}
                                      >
                                        Agregar Depósito
                                      </Button>
                                      <Typography variant="caption" sx={{ ml: 2 }} color={
                                        item.distribuciones.reduce((sum, d) => sum + d.cantidad, 0) === item.cantidadRecibida
                                          ? 'success.main'
                                          : 'warning.main'
                                      }>
                                        Total distribuido: {item.distribuciones.reduce((sum, d) => sum + d.cantidad, 0)} / {item.cantidadRecibida}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Resumen */}
              <Box sx={{ mt: 2 }}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Resumen:</strong>{' '}
                    {recepcionData.items.filter(i => i.cantidadRecibida !== i.cantidadSolicitada).length} de{' '}
                    {recepcionData.items.length} items con diferencias
                  </Typography>
                  {recepcionData.usarDistribucionMultiple && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Nota:</strong> La distribución a múltiples depósitos requiere que la suma de cantidades distribuidas sea igual a la cantidad recibida para cada item.
                    </Typography>
                  )}
                </Alert>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setReceiveDialogOpen(false);
              resetRecepcionData();
            }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleConfirmarRecepcion}
              disabled={loading || recepcionData.items.length === 0}
            >
              Confirmar Recepción
            </Button>
          </DialogActions>
        </Dialog>

        <EnvioTransferenciaDialog
          open={envioDialogOpen}
          onClose={() => setEnvioDialogOpen(false)}
          onConfirm={handleConfirmarEnvio}
          loading={loading}
          transferencia={selectedTransferencia}
        />

        {/* Modal de Cancelación de Transferencia */}
        <CancelTransferenciaDialog
          open={cancelDialogOpen}
          onClose={() => {
            setCancelDialogOpen(false);
            setMotivoCancelacion('');
          }}
          onConfirm={handleCancelarTransferencia}
          loading={loading}
          transferencia={selectedTransferencia}
          motivo={motivoCancelacion}
          setMotivo={setMotivoCancelacion}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default TransferenciasPage;
