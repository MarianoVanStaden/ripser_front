import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "../../hooks/useDebounce";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  IconButton,
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
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Send as SendIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  Palette as PaletteIcon,
} from "@mui/icons-material";
import { clienteApi, leadApi, usuarioApi } from "../../api/services";
import { documentoApi } from "../../api/services/documentoApi";
import opcionFinanciamientoApi from "../../api/services/opcionFinanciamientoApi";
import type { DocumentoComercial, Cliente, Usuario, EstadoDocumento, OpcionFinanciamientoDTO } from "../../types";
import { EstadoDocumento as EstadoDocumentoEnum } from "../../types";
import LoadingOverlay from "../common/LoadingOverlay";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import SuccessDialog from "../common/SuccessDialog";
import { generarPresupuestoPDF } from "../../services/pdfService";
import UsuarioBadge from "../common/UsuarioBadge";
import ClienteAutocomplete from "../common/ClienteAutocomplete";
// FRONT-003: extracted to keep this file orchestrator-shaped.
import { computeIva, formatCurrency, getStatusColor, getStatusLabel, normalizeOpcionesFinanciamiento } from './Presupuestos/utils';
import OpcionesFinanciamientoDialog from './Presupuestos/dialogs/OpcionesFinanciamientoDialog';
import CalculadoraPDFDialog from './Presupuestos/dialogs/CalculadoraPDFDialog';
import VerPresupuestoDialog from './Presupuestos/dialogs/VerPresupuestoDialog';
import EditarColorDetalleDialog from './NotasPedido/dialogs/EditarColorDetalleDialog';
import PresupuestoFormDialog from './Presupuestos/PresupuestoFormDialog';

const PresupuestosPage: React.FC = () => {
  const { user } = useAuth();
  const { empresaId, esSuperAdmin, rolActual } = useTenant();
  // Admins deben elegir explícitamente el vendedor al que se atribuye la venta
  // (reportes de unidades y bonos); el resto se autoasigna como hasta ahora.
  const isAdmin = esSuperAdmin || (rolActual as string) === 'ADMIN' || rolActual === 'ADMIN_EMPRESA' || rolActual === 'ADMIN_EMPRESA_LIMITADO';
  // Reasignar el vendedor de un presupuesto ya creado (no en la creación) es una
  // corrección administrativa — mismos roles habilitados en el backend (PATCH /vendedor).
  const canReassignVendedor = isAdmin || rolActual === 'SUPERVISOR';
  
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

  // Editar color de líneas EQUIPO (informado post-creación).
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [docParaColor, setDocParaColor] = useState<DocumentoComercial | null>(null);

  const handleOpenColorDialog = useCallback(async (presupuesto: DocumentoComercial) => {
    try {
      // El listado puede no traer las líneas; traemos el documento completo.
      const full = await documentoApi.getById(presupuesto.id);
      setDocParaColor(full);
      setColorDialogOpen(true);
    } catch {
      setSnackbar({ open: true, message: 'No se pudo cargar el presupuesto para editar el color', severity: 'error' });
    }
  }, []);

  // Cliente seleccionado en el formulario (typeahead). Se carga on-demand.
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPresupuesto, setEditingPresupuesto] = useState<DocumentoComercial | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  
  
  // Financiamiento UI state
  const [financiamientoDialogOpen, setFinanciamientoDialogOpen] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<DocumentoComercial | null>(null);
  const [opcionesFinanciamiento, setOpcionesFinanciamiento] = useState<OpcionFinanciamientoDTO[]>([]);
  const [selectedOpcionId, setSelectedOpcionId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const [presupuestosFinanciamiento, setPresupuestosFinanciamiento] = useState<Record<number, OpcionFinanciamientoDTO[]>>({});
  // Calculadora previa a exportar PDF
  const [calculadoraOpen, setCalculadoraOpen] = useState(false);
  const [presupuestoParaPDF, setPresupuestoParaPDF] = useState<DocumentoComercial | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdPresupuesto, setCreatedPresupuesto] = useState<DocumentoComercial | null>(null);


  // View dialog (read-only) state — espejo del de NotasPedidoPage.
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingPresupuesto, setViewingPresupuesto] = useState<DocumentoComercial | null>(null);
  const [editingObsView, setEditingObsView] = useState(false);
  const [obsViewValue, setObsViewValue] = useState('');
  const [editingVendedorView, setEditingVendedorView] = useState(false);
  const [vendedorViewValue, setVendedorViewValue] = useState<number | ''>('');

  // Deuda cliente confirmation

  // Carga los vendedores (para el selector del form y la reasignación en la
  // vista). Productos/recetas ahora los carga PresupuestoFormDialog al abrir.
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const usuariosData = await usuarioApi.getVendedores().catch(() => []);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
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

  // Calculate IVA based on selected type

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




  // Opciones del selector de vendedor: vendedores/supervisores activos de la
  // empresa + el usuario logueado si no figura (autoasignación de OFICINA/GERENTE).
  const usuarioOptions = useMemo(() => {
    if (user?.id && !usuarios.some((u) => u.id === user.id)) {
      return [...usuarios, { id: user.id, nombre: user.nombre || '' } as Usuario];
    }
    return usuarios;
  }, [usuarios, user]);

  // Abre el form (alta, edición o vista). La población del formulario vive en
  // PresupuestoFormDialog; acá solo se fija qué presupuesto y en qué modo.
  const handleOpenDialog = useCallback((presupuesto?: DocumentoComercial, readOnlyMode = false) => {
    setEditingPresupuesto(presupuesto ?? null);
    setReadOnly(readOnlyMode);
    setDialogOpen(true);
  }, []);

  // Deep-link desde el detalle de lead: /ventas/presupuestos?leadId=123 abre el
  // dialog de alta con el lead preseleccionado. Se consume una sola vez y se
  // limpia el query param para que refresh/back no reabran el dialog.
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialLeadId, setInitialLeadId] = useState<string | null>(null);
  const deepLinkLeadHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkLeadHandledRef.current) return;
    const leadIdParam = searchParams.get('leadId');
    if (!leadIdParam) return;
    deepLinkLeadHandledRef.current = true;
    setSearchParams({}, { replace: true });
    const leadIdNum = Number(leadIdParam);
    if (!Number.isFinite(leadIdNum) || leadIdNum <= 0) return;
    setInitialLeadId(leadIdParam);
    handleOpenDialog();
  }, [searchParams, setSearchParams, handleOpenDialog]);

  const handleFormClose = useCallback(() => {
    setDialogOpen(false);
    setEditingPresupuesto(null);
    setInitialLeadId(null);
  }, []);

  const handleFormSaved = useCallback((saved: DocumentoComercial, isNew: boolean) => {
    invalidatePresupuestos();
    if (isNew) {
      setCreatedPresupuesto(saved);
      setSuccessDialogOpen(true);
    } else {
      setSnackbar({ open: true, message: 'Presupuesto actualizado exitosamente', severity: 'success' });
    }
  }, [invalidatePresupuestos]);


  const handleOpenViewDialog = useCallback((presupuesto: DocumentoComercial) => {
    setViewingPresupuesto(presupuesto);
    setEditingObsView(false);
    setObsViewValue('');
    setViewDialogOpen(true);
  }, []);

  const handleCloseViewDialog = useCallback(() => {
    setViewDialogOpen(false);
    setViewingPresupuesto(null);
    setEditingObsView(false);
    setEditingVendedorView(false);
  }, []);

  const handleSaveObsView = useCallback(async () => {
    if (!viewingPresupuesto) return;
    try {
      const updated = await documentoApi.updateObservaciones(viewingPresupuesto.id, obsViewValue || null);
      setViewingPresupuesto(updated);
      setEditingObsView(false);
      invalidatePresupuestos();
      setSnackbar({ open: true, message: 'Observaciones actualizadas', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Error al guardar observaciones', severity: 'error' });
    }
  }, [viewingPresupuesto, obsViewValue, invalidatePresupuestos]);

  const handleSaveVendedorView = useCallback(async () => {
    if (!viewingPresupuesto || vendedorViewValue === '') return;
    try {
      const updated = await documentoApi.updateVendedor(viewingPresupuesto.id, vendedorViewValue);
      setViewingPresupuesto(updated);
      setEditingVendedorView(false);
      invalidatePresupuestos();
      setSnackbar({ open: true, message: 'Vendedor reasignado', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Error al reasignar el vendedor', severity: 'error' });
    }
  }, [viewingPresupuesto, vendedorViewValue, invalidatePresupuestos]);



  // Financiamiento handlers
  const handleOpenFinanciamiento = useCallback(async (presupuesto: DocumentoComercial) => {
    setSelectedPresupuesto(presupuesto);
    setFinanciamientoDialogOpen(true);

    let opciones = presupuestosFinanciamiento[presupuesto.id] ?? [];

    if (opciones.length === 0) {
      try {
        // Sincroniza contra los templates activos: aditivo, incorpora formas de pago nuevas
        // en presupuestos pendientes viejos. El backend no toca presupuestos ya convertidos.
        opciones = await opcionFinanciamientoApi.sincronizarTemplates(presupuesto.id);
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

  // Handler para exportar presupuesto a PDF: abre la calculadora de financiación.
  const handleExportarPDF = useCallback((presupuesto: DocumentoComercial) => {
    if (!presupuesto.clienteId && !presupuesto.leadId) {
      setSnackbar({
        open: true,
        message: 'Este presupuesto no tiene cliente ni lead asociado',
        severity: 'error'
      });
      return;
    }
    setPresupuestoParaPDF(presupuesto);
    setCalculadoraOpen(true);
  }, []);

  // Genera el PDF con las opciones de financiación elegidas en la calculadora.
  const handleGenerarPDFConOpciones = useCallback(async (opciones: OpcionFinanciamientoDTO[]) => {
    const presupuesto = presupuestoParaPDF;
    if (!presupuesto) return;
    try {
      if (presupuesto.clienteId) {
        const cliente = await clienteApi.getById(presupuesto.clienteId);
        generarPresupuestoPDF({ presupuesto, cliente, opcionesFinanciamiento: opciones });
      } else {
        const lead = await leadApi.getById(presupuesto.leadId!);
        generarPresupuestoPDF({ presupuesto, lead, opcionesFinanciamiento: opciones });
      }

      setSnackbar({
        open: true,
        message: 'PDF generado exitosamente',
        severity: 'success'
      });
      setCalculadoraOpen(false);
      setPresupuestoParaPDF(null);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setSnackbar({
        open: true,
        message: 'Error al generar el PDF',
        severity: 'error'
      });
    }
  }, [presupuestoParaPDF]);

  // El reload manual ahora es: invalidatePresupuestos() (ver useQuery arriba).


  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <LoadingOverlay
        open={loading}
        message="Cargando presupuestos..."
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
            <Table aria-label="Tabla de presupuestos" sx={{ minWidth: 1280 }}>
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
                  <TableCell
                    sx={{
                      minWidth: 220,
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      right: 0,
                      backgroundColor: 'background.paper',
                      zIndex: 2,
                      boxShadow: '-4px 0 6px -2px rgba(0,0,0,0.08)',
                    }}
                  >
                    Acciones
                  </TableCell>
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
                      <TableCell
                        sx={{
                          whiteSpace: 'nowrap',
                          position: 'sticky',
                          right: 0,
                          backgroundColor: 'background.paper',
                          zIndex: 1,
                          boxShadow: '-4px 0 6px -2px rgba(0,0,0,0.08)',
                        }}
                      >
                        <Tooltip title="Ver">
                          <IconButton size="small" color="primary" onClick={() => handleOpenViewDialog(presupuesto)} aria-label={`Ver presupuesto ${presupuesto.numeroDocumento}`}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary" onClick={() => handleOpenDialog(presupuesto, false)} aria-label={`Editar presupuesto ${presupuesto.numeroDocumento}`}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar color de equipos">
                          <IconButton size="small" color="secondary" onClick={() => handleOpenColorDialog(presupuesto)} aria-label={`Editar color de equipos del presupuesto ${presupuesto.numeroDocumento}`}>
                            <PaletteIcon />
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
      <PresupuestoFormDialog
        open={dialogOpen}
        presupuesto={editingPresupuesto}
        readOnly={readOnly}
        initialLeadId={initialLeadId}
        usuarioOptions={usuarioOptions}
        isAdmin={isAdmin}
        canReassignVendedor={canReassignVendedor}
        getSelectedFinancingOption={getSelectedFinancingOption}
        onClose={handleFormClose}
        onSaved={handleFormSaved}
      />


      <OpcionesFinanciamientoDialog
        open={financiamientoDialogOpen}
        onClose={() => setFinanciamientoDialogOpen(false)}
        onConfirm={handleSelectOpcion}
        presupuesto={selectedPresupuesto}
        opciones={opcionesFinanciamiento}
        selectedOpcionId={selectedOpcionId}
        onSelectOpcion={setSelectedOpcionId}
      />

      <CalculadoraPDFDialog
        open={calculadoraOpen}
        onClose={() => { setCalculadoraOpen(false); setPresupuestoParaPDF(null); }}
        presupuesto={presupuestoParaPDF}
        onExport={handleGenerarPDFConOpciones}
      />

      <VerPresupuestoDialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        presupuesto={viewingPresupuesto}
        editingObservaciones={editingObsView}
        setEditingObservaciones={setEditingObsView}
        observacionesValue={obsViewValue}
        setObservacionesValue={setObsViewValue}
        onSaveObservaciones={handleSaveObsView}
        canReassignVendedor={canReassignVendedor}
        usuarioOptions={usuarioOptions}
        editingVendedor={editingVendedorView}
        setEditingVendedor={setEditingVendedorView}
        vendedorValue={vendedorViewValue}
        setVendedorValue={setVendedorViewValue}
        onSaveVendedor={handleSaveVendedorView}
      />


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


      <EditarColorDetalleDialog
        open={colorDialogOpen}
        onClose={() => { setColorDialogOpen(false); setDocParaColor(null); }}
        onSaved={() => {
          invalidatePresupuestos();
          setSnackbar({ open: true, message: 'Color actualizado correctamente', severity: 'success' });
        }}
        documento={docParaColor}
      />
    </Box>
  );
};

export default PresupuestosPage;

