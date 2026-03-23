import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { documentoApi, clienteApi, opcionFinanciamientoApi, leadApi } from "../../api/services";
import { recetaFabricacionApi } from "../../api/services/recetaFabricacionApi";
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
  RecetaFabricacionDTO,
  DeudaClienteError,
} from "../../types";
import DeudaClienteConfirmDialog from "./DeudaClienteConfirmDialog";
import { EstadoDocumento as EstadoDocumentoEnum } from "../../types";
import SuccessDialog from "../common/SuccessDialog";
import AsignarEquiposDialog from "./AsignarEquiposDialog";
import AuditoriaFlujo from "../common/AuditoriaFlujo";
import UsuarioBadge from "../common/UsuarioBadge";
import { generarNotaPedidoPDF } from "../../services/pdfService";

type TipoIva = 'IVA_21' | 'IVA_10_5' | 'EXENTO';

interface ConvertFormData {
  presupuestoId: string;
  metodoPago: MetodoPago;
  tipoIva: TipoIva;
}

const initialConvertForm: ConvertFormData = {
  presupuestoId: "",
  metodoPago: "EFECTIVO" as MetodoPago,
  tipoIva: "IVA_21",
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

  // Main data states
  const [notasPedido, setNotasPedido] = useState<DocumentoComercial[]>([]);
  const [presupuestos, setPresupuestos] = useState<DocumentoComercial[]>([]);
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedNota, setSelectedNota] = useState<DocumentoComercial | null>(null);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<DocumentoComercial | null>(null);
  const [convertForm, setConvertForm] = useState<ConvertFormData>(initialConvertForm);
  const [asignarEquiposDialogOpen, setAsignarEquiposDialogOpen] = useState(false);
  const [notaForAsignacion, setNotaForAsignacion] = useState<DocumentoComercial | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdNota, setCreatedNota] = useState<DocumentoComercial | null>(null);
  const [facturaSuccessDialogOpen, setFacturaSuccessDialogOpen] = useState(false);
  const [createdFactura, setCreatedFactura] = useState<DocumentoComercial | null>(null);
  const [recetas, setRecetas] = useState<RecetaFabricacionDTO[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [leadConversionDialogOpen, setLeadConversionDialogOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<DocumentoComercial | null>(null);
  void setLeadConversionDialogOpen; // Used in future implementation
  void leadToConvert; // Used in future implementation

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
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [notasData, presupuestosData, recetasData] = await Promise.all([
        documentoApi.getByTipo("NOTA_PEDIDO").catch((err) => {
          console.error("Error fetching notas de pedido:", err);
          return [];
        }),
        documentoApi.getByTipo("PRESUPUESTO").catch((err) => {
          console.error("Error fetching presupuestos:", err);
          return [];
        }),
        recetaFabricacionApi.findAllActive().catch((err) => {
          console.error("Error fetching recetas:", err);
          return [];
        }),
      ]);

      setRecetas((Array.isArray(recetasData) ? (recetasData as unknown) : []) as RecetaFabricacionDTO[]);

      const notasArray = Array.isArray(notasData) ? notasData : [];
      
      // Sort notas in reverse order (most recent first)
      const sortedNotas = notasArray.sort((a, b) => {
        const dateA = new Date(a.fechaEmision || 0).getTime();
        const dateB = new Date(b.fechaEmision || 0).getTime();
        return dateB - dateA; // Descending order
      });
      
      setNotasPedido(sortedNotas);
      
      // Backend requires PRESUPUESTO in PENDIENTE state for conversion
      const pendientes = Array.isArray(presupuestosData)
        ? presupuestosData.filter(p => p.estado === EstadoDocumentoEnum.PENDIENTE)
        : [];
      setPresupuestos(pendientes);

      // Extract unique clients from notas de pedido
      const uniqueClients = new Map<number, { id: number; nombre: string }>();
      notasArray.forEach((nota: DocumentoComercial) => {
        if (nota.clienteId && nota.clienteNombre) {
          uniqueClients.set(nota.clienteId, {
            id: nota.clienteId,
            nombre: nota.clienteNombre,
          });
        }
      });
      setClientes(Array.from(uniqueClients.values()));
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [empresaId]); // Re-fetch when tenant changes

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter notas de pedido
  const filteredNotasPedido = useMemo(() => {
    return notasPedido.filter((nota) => {
      const matchesSearch = searchTerm === '' ||
        nota.numeroDocumento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nota.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || nota.estado === statusFilter;
      const matchesClient = clientFilter === 'all' || nota.clienteId?.toString() === clientFilter;
      
      const fecha = nota.fechaEmision ? new Date(nota.fechaEmision) : null;
      const matchesDateFrom = !dateFromFilter || (fecha && fecha >= new Date(dateFromFilter));
      const matchesDateTo = !dateToFilter || (fecha && fecha <= new Date(dateToFilter));
      
      return matchesSearch && matchesStatus && matchesClient && matchesDateFrom && matchesDateTo;
    });
  }, [notasPedido, searchTerm, statusFilter, clientFilter, dateFromFilter, dateToFilter]);

  // Paginate filtered notas
  const paginatedNotasPedido = useMemo(() => {
    return filteredNotasPedido.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredNotasPedido, page, rowsPerPage]);

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

  const getMetodoPagoLabel = (metodo: MetodoPago): string => {
    const labels: Record<string, string> = {
      EFECTIVO: "Efectivo",
      TARJETA_CREDITO: "Tarjeta de Crédito",
      TARJETA_DEBITO: "Tarjeta de Débito",
      TRANSFERENCIA_BANCARIA: "Transferencia Bancaria",
      TRANSFERENCIA: "Transferencia Bancaria",
      CHEQUE: "Cheque",
    };
    return labels[metodo] || metodo;
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
    setError(null);
  }, []);

  const handlePresupuestoSelect = useCallback((presupuestoId: string) => {
    const presupuesto = presupuestos.find(p => p.id.toString() === presupuestoId);
    setSelectedPresupuesto(presupuesto || null);
    
    // If presupuesto has tipoIva defined, set it in the form
    if (presupuesto && presupuesto.tipoIva) {
      setConvertForm(prev => ({ 
        ...prev, 
        presupuestoId,
        tipoIva: presupuesto.tipoIva as TipoIva
      }));
    } else {
      setConvertForm(prev => ({ ...prev, presupuestoId }));
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
    // equipo resolution starts. Skipped when the user has already confirmed via the modal.
    if (!confirmarConDeudaPendiente) {
      const clienteId = selectedPresupuesto?.clienteId;
      if (clienteId) {
        try {
          const [prestamos, ccPage] = await Promise.all([
            prestamoPersonalApi.getByCliente(clienteId),
            cuentaCorrienteApi.getByClienteId(clienteId),
          ]);

          const activoStates = ['ACTIVO', 'EN_MORA', 'EN_LEGAL'];
          const cuotasPendientes = prestamos
            .filter(p => activoStates.includes(p.estado))
            .reduce((sum, p) => sum + (p.cuotasPendientes || 0), 0);

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
        ...(confirmarConDeudaPendiente && { confirmarConDeudaPendiente: true }),
      };

      const nuevaNota = await documentoApi.convertToNotaPedido(payload);
      setNotasPedido(prev => [nuevaNota, ...prev]);

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
      setNotasPedido(prev => prev.map(n => n.id === notaEnriquecida.id ? notaEnriquecida : n));

      // Resolve stock for each EQUIPO detalle using the unified backend endpoint.
      // Backend applies P1 → P2 → P3 automatically and creates the DetalleEquipoAsignacion link.
      const detallesEquipo = enrichedDetalles.filter(d => d.tipoItem === 'EQUIPO');
      const resoluciones: string[] = [];
      const advertenciasResolucion: string[] = [];

      for (const detalle of detallesEquipo) {
        if (!detalle.id) {
          advertenciasResolucion.push(
            `${detalle.recetaNombre || 'Ítem'}: ID de detalle no disponible — asignación pendiente`
          );
          continue;
        }

        const receta = recetas.find(r => r.id === Number(detalle.recetaId));
        const cantidad = detalle.cantidad || 1;

        for (let i = 0; i < cantidad; i++) {
          try {
            const equipo = await equipoFabricadoApi.resolverParaPedido({
              tipo: (receta?.tipoEquipo as any) || 'HELADERA',
              modelo: detalle.recetaModelo || receta?.modelo || '',
              medida: detalle.medida,
              color: detalle.color,
              detalleNotaPedidoId: detalle.id!,
            });

            // Link the equipo to the client if not already set by the backend.
            // Use update({ clienteId }) for all states — asignarEquipo fails on already-reserved equipos.
            const clienteId = notaConDetalles.clienteId;
            if (equipo.id && clienteId && !equipo.clienteId) {
              try {
                await equipoFabricadoApi.update(equipo.id, { clienteId });
              } catch {
                // Non-fatal: client linking failed, but reservation is still valid
              }
            }

            if (equipo.estado === 'COMPLETADO') {
              resoluciones.push(`✅ Stock reservado: ${equipo.numeroHeladera} (${equipo.color || 'sin color'})`);
            } else if (equipo.estado === 'FABRICADO_SIN_TERMINACION') {
              resoluciones.push(`🎨 Base reservada: ${equipo.numeroHeladera}${detalle.color ? ` → terminación ${detalle.color}` : ''}`);
            } else {
              resoluciones.push(`🏭 En cola de fabricación: ${equipo.numeroHeladera} (${detalle.color || 'sin color'})`);
            }
          } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Error desconocido';
            advertenciasResolucion.push(`${detalle.recetaNombre || 'Ítem'}: ${msg}`);
          }
        }
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
      setCreatedNota(nuevaNota);
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
  }, [convertForm, handleCloseConvertDialog, recetas]);

  const handleViewNota = useCallback((nota: DocumentoComercial) => {
    setSelectedNota(nota);
    setViewDialogOpen(true);
  }, []);

  const handleCloseViewDialog = useCallback(() => {
    setViewDialogOpen(false);
    setSelectedNota(null);
  }, []);

  const handleConvertToFactura = useCallback(async (notaId: number) => {
    // Find the nota
    const nota = notasPedido.find(n => n.id === notaId);
    if (!nota) {
      setError("Nota de pedido no encontrada");
      return;
    }

    // Check if there are EQUIPO items in the detalles
    const detallesEquipo = nota.detalles?.filter(d => d.tipoItem === 'EQUIPO') || [];

    if (detallesEquipo.length > 0) {
      // Probe for debt BEFORE opening AsignarEquiposDialog so the warning appears first.
      // The call intentionally omits equiposAsignaciones — the backend should reject it
      // (missing equipos) unless there is a debt error, which takes priority.
      try {
        const probeResult = await documentoApi.convertToFactura({ notaPedidoId: notaId });
        // Unexpected success (nota converted without equipos): accept and show success dialog.
        setNotasPedido((prev) => prev.filter((n) => n.id !== notaId));
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
      if (!window.confirm("¿Está seguro de convertir esta Nota de Pedido en Factura?")) {
        return;
      }

      try {
        setError(null);
        const factura = await documentoApi.convertToFactura({ notaPedidoId: notaId });
        // Remove nota from local state
        setNotasPedido((prev) => prev.filter((n) => n.id !== notaId));
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
              const facturaRetry = await documentoApi.convertToFactura({ notaPedidoId: notaId, confirmarConDeudaPendiente: true });
              setNotasPedido((prev) => prev.filter((n) => n.id !== notaId));
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
  }, [notasPedido, fetchData]);

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

      const factura = await documentoApi.convertToFactura({
        notaPedidoId: notaForAsignacion.id,
        equiposAsignaciones: asignaciones,
        ...(deudaPreconfirmada && { confirmarConDeudaPendiente: true }),
      });

      // Remove nota from local state
      setNotasPedido((prev) => prev.filter((n) => n.id !== notaForAsignacion.id));
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
            const facturaRetry = await documentoApi.convertToFactura({
              notaPedidoId: notaId,
              equiposAsignaciones: asignaciones,
              confirmarConDeudaPendiente: true,
            });
            setNotasPedido((prev) => prev.filter((n) => n.id !== notaId));
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
  }, [notaForAsignacion, fetchData]);

  const handleCloseAsignarEquiposDialog = useCallback(() => {
    setAsignarEquiposDialogOpen(false);
    setNotaForAsignacion(null);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
                  <TableCell sx={{ minWidth: 150 }}>Método de Pago</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>Total</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Creado por</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedNotasPedido.map((nota) => (
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
                      {nota.metodoPago ? getMetodoPagoLabel(nota.metodoPago) : "-"}
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
                      <Tooltip title="Convertir a Factura">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleConvertToFactura(nota.id)}
                          disabled={nota.estado !== EstadoDocumentoEnum.APROBADO && nota.estado !== EstadoDocumentoEnum.PENDIENTE}
                        >
                          <ReceiptIcon />
                        </IconButton>
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
                      <Tooltip title="Enviar">
                        <IconButton size="small" color="primary">
                          <SendIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredNotasPedido.length}
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

          {filteredNotasPedido.length === 0 && (
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
              <MenuItem value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</MenuItem>
              <MenuItem value="CHEQUE">Cheque</MenuItem>
            </TextField>

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
              disabled={selectedPresupuesto?.tipoIva != null}
              helperText={selectedPresupuesto?.tipoIva ? "Tipo de IVA definido en el presupuesto" : "Seleccione el tipo de IVA"}
            >
              <MenuItem value="IVA_21">IVA 21%</MenuItem>
              <MenuItem value="IVA_10_5">IVA 10.5%</MenuItem>
              <MenuItem value="EXENTO">Exento</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConvertDialog} disabled={formLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConvertToNotaPedido}
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

              {selectedNota.observaciones && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography>{selectedNota.observaciones}</Typography>
                </Box>
              )}

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
                        <TableCell>{detalle.color || '-'}</TableCell>
                        <TableCell>{detalle.medida || '-'}</TableCell>
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
        details={createdNota ? [
          { label: 'Número de Documento', value: createdNota.numeroDocumento },
          { label: 'Cliente', value: createdNota.clienteNombre || '-' },
          { label: 'Total', value: `$${createdNota.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
        ] : []}
      />

      {/* Success Dialog - Factura Creada */}
      <SuccessDialog
        open={facturaSuccessDialogOpen}
        onClose={() => {
          setFacturaSuccessDialogOpen(false);
          setCreatedFactura(null);
        }}
        title="¡Factura Creada Exitosamente!"
        message="La nota de pedido ha sido facturada correctamente"
        details={createdFactura ? [
          { label: 'Número de Factura', value: createdFactura.numeroDocumento },
          { label: 'Cliente', value: createdFactura.clienteNombre || '-' },
          { label: 'Total', value: `$${createdFactura.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
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
    </Box>
  );
};

export default NotasPedidoPage;

