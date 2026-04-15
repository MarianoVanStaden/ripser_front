// @ts-nocheck - Temporary: MUI v7 Grid compatibility issue - see MUI_V7_GRID_FIX.md
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  Stack,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Grid,
  Chip,
  Autocomplete,
  Divider,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Badge,
  Menu,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TimerOff as TimerOffIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  EventBusy as EventBusyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Create as CreateIcon,
  Settings as SettingsIcon,
  GetApp as GetAppIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  BarChart as ChartIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { registroAsistenciaApi } from '../../api/services/registroAsistenciaApi';
import { employeeApi } from '../../api/services/employeeApi';
import { configuracionAsistenciaApi } from '../../api/services/configuracionAsistenciaApi';
import { excepcionAsistenciaApi } from '../../api/services/excepcionAsistenciaApi';
import { asistenciaAutomaticaApi } from '../../api/services/asistenciaAutomaticaApi';
import type { RegistroAsistencia, Empleado } from '../../types';
import dayjs from 'dayjs';

const AsistenciasPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isFirstRender = useRef(true);
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  const [asistencias, setAsistencias] = useState<RegistroAsistencia[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RegistroAsistencia | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editingAsistencia, setEditingAsistencia] = useState<RegistroAsistencia | null>(null);
  
  // Configuraciones y excepciones
  const [configuraciones, setConfiguraciones] = useState<any[]>([]);
  const [excepciones, setExcepciones] = useState<any[]>([]);
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [openExcepcionDialog, setOpenExcepcionDialog] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [tipoExcepcion, setTipoExcepcion] = useState('');
  const [configFormData, setConfigFormData] = useState({
    lunes: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
    martes: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
    miercoles: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
    jueves: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
    viernes: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
    sabado: { trabaja: false, horaEntrada: '08:00', horaSalida: '12:00' },
    domingo: { trabaja: false, horaEntrada: '08:00', horaSalida: '12:00' }
  });
  const [excepcionFormData, setExcepcionFormData] = useState({
    empleadoId: '',
    fecha: dayjs().format('YYYY-MM-DD'),
    tipo: '',
    horaEntradaReal: '',
    horaSalidaReal: '',
    horasExtras: '',
    minutosTardanza: '',
    motivo: '',
    observaciones: '',
    justificado: false
  });
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [empleadoFilter, setEmpleadoFilter] = useState<Empleado | null>(null);
  const [fechaDesde, setFechaDesde] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [fechaHasta, setFechaHasta] = useState(dayjs().format('YYYY-MM-DD'));

  // Filtros específicos para reportes
  const [reportEmpleadoFilter, setReportEmpleadoFilter] = useState<Empleado | null>(null);
  const [reportFechaDesde, setReportFechaDesde] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [reportFechaHasta, setReportFechaHasta] = useState(dayjs().format('YYYY-MM-DD'));
  const [reportTipoFilter, setReportTipoFilter] = useState<string>('TODOS');
  
  // Estados para exportación y visualización
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [showCharts, setShowCharts] = useState(false);
  
  // Estados para comparación de períodos
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonFechaDesde, setComparisonFechaDesde] = useState(
    dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
  );
  const [comparisonFechaHasta, setComparisonFechaHasta] = useState(
    dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
  );

  // Form state
  const [formData, setFormData] = useState({
    empleadoId: '',
    fecha: dayjs().format('YYYY-MM-DD'),
    horaEntrada: '09:00',
    horaSalida: '18:00',
    horasTrabajadas: '',
    horasExtras: '0',
    observaciones: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (fechaDesde && fechaHasta) {
      loadAsistenciasByPeriodo();
    }
  }, [fechaDesde, fechaHasta]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Primero cargar empleados
      const empleadosData = await employeeApi.getAllList().catch(() => []);
      const empleadosArray = Array.isArray(empleadosData) ? empleadosData : [];
      setEmpleados(empleadosArray);
      
      // Luego cargar configuraciones y excepciones en paralelo
      const [configsData, excepcionesData] = await Promise.all([
        configuracionAsistenciaApi.getAll().catch(() => []),
        excepcionAsistenciaApi.getByPeriodo(
          dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
          dayjs().format('YYYY-MM-DD')
        ).catch(() => [])
      ]);
      
      console.log('Configuraciones data:', configsData);
      console.log('Excepciones data:', excepcionesData);
      
      setConfiguraciones(Array.isArray(configsData) ? configsData : []);
      setExcepciones(Array.isArray(excepcionesData) ? excepcionesData : []);
      
      // Finalmente cargar asistencias con empleados ya disponibles
      await loadAsistenciasByPeriodoWithEmpleados(empleadosArray);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
      setEmpleados([]);
      setAsistencias([]);
      setConfiguraciones([]);
      setExcepciones([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAsistenciasByPeriodoWithEmpleados = async (empleadosData: Empleado[]) => {
    try {
      setError(null);
      const data = await registroAsistenciaApi.getByPeriodo(fechaDesde, fechaHasta);
      
      console.log('Asistencias raw data:', data);
      console.log('Empleados disponibles:', empleadosData);
      
      // Mapear las asistencias para incluir el objeto empleado completo
      const asistenciasConEmpleado = Array.isArray(data)
        ? data.map((asistencia: any) => {
            const empleado = empleadosData.find((e: any) => e.id === asistencia.empleadoId);
            return {
              ...asistencia,
              empleado: empleado || {
                id: asistencia.empleadoId,
                nombre: asistencia.empleadoNombre || '',
                apellido: asistencia.empleadoApellido || '',
                dni: asistencia.empleadoDni || ''
              }
            };
          })
        : [];
      
      console.log('Asistencias mapped:', asistenciasConEmpleado);
      
      setAsistencias(asistenciasConEmpleado);
    } catch (err) {
      setError('Error al cargar las asistencias');
      console.error('Error loading asistencias:', err);
      setAsistencias([]);
    }
  };

  const loadAsistenciasByPeriodo = async () => {
    await loadAsistenciasByPeriodoWithEmpleados(empleados);
  };

  const getEmpleadoNombre = (empleado: Empleado) => {
    return `${empleado.nombre} ${empleado.apellido}`;
  };

  const calcularHorasTrabajadas = (entrada: string, salida: string): number => {
    if (!entrada || !salida) return 0;
    
    const [horaEntrada, minEntrada] = entrada.split(':').map(Number);
    const [horaSalida, minSalida] = salida.split(':').map(Number);
    
    const minutosEntrada = horaEntrada * 60 + minEntrada;
    const minutosSalida = horaSalida * 60 + minSalida;
    
    const diferenciaMinutos = minutosSalida - minutosEntrada;
    return Math.max(0, Math.round((diferenciaMinutos / 60) * 100) / 100);
  };

  const filteredAsistencias = asistencias.filter(a => {
    if (!a.empleado) return false;
    
    const matchesEmpleado = !empleadoFilter || a.empleado.id === empleadoFilter.id;
    
    const matchesSearch = !searchTerm ||
      getEmpleadoNombre(a.empleado).toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.observaciones?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEmpleado && matchesSearch;
  });

  const handleOpenForm = (asistencia?: RegistroAsistencia) => {
    if (asistencia) {
      setEditingAsistencia(asistencia);
      setFormData({
        empleadoId: asistencia.empleado?.id?.toString() || '',
        fecha: asistencia.fecha,
        horaEntrada: asistencia.horaEntrada,
        horaSalida: asistencia.horaSalida,
        horasTrabajadas: asistencia.horasTrabajadas.toString(),
        horasExtras: asistencia.horasExtras.toString(),
        observaciones: asistencia.observaciones || ''
      });
    } else {
      setEditingAsistencia(null);
      setFormData({
        empleadoId: '',
        fecha: dayjs().format('YYYY-MM-DD'),
        horaEntrada: '09:00',
        horaSalida: '18:00',
        horasTrabajadas: '',
        horasExtras: '0',
        observaciones: ''
      });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingAsistencia(null);
    setFormData({
      empleadoId: '',
      fecha: dayjs().format('YYYY-MM-DD'),
      horaEntrada: '09:00',
      horaSalida: '18:00',
      horasTrabajadas: '',
      horasExtras: '0',
      observaciones: ''
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calcular horas trabajadas cuando cambian entrada o salida
      if (name === 'horaEntrada' || name === 'horaSalida') {
        const entrada = name === 'horaEntrada' ? value : prev.horaEntrada;
        const salida = name === 'horaSalida' ? value : prev.horaSalida;
        newData.horasTrabajadas = calcularHorasTrabajadas(entrada, salida).toString();
      }
      
      return newData;
    });
  };

  const handleSaveAsistencia = async () => {
    try {
      setError(null);

      if (!formData.empleadoId) {
        setError('Debe seleccionar un empleado');
        return;
      }

      const empleadoIdParsed = parseInt(formData.empleadoId);
      if (isNaN(empleadoIdParsed) || empleadoIdParsed <= 0) {
        setError('ID de empleado inválido');
        return;
      }

      if (!formData.fecha) {
        setError('La fecha es obligatoria');
        return;
      }

      if (!formData.horaEntrada || !formData.horaSalida) {
        setError('Las horas de entrada y salida son obligatorias');
        return;
      }

      const horasTrabajadas = parseFloat(formData.horasTrabajadas) || 0;
      const horasExtras = parseFloat(formData.horasExtras) || 0;

      if (horasTrabajadas <= 0) {
        setError('Las horas trabajadas deben ser mayor a 0');
        return;
      }

      const asistenciaData: any = {
        empleadoId: empleadoIdParsed,
        fecha: formData.fecha,
        horaEntrada: formData.horaEntrada,
        horaSalida: formData.horaSalida,
        horasTrabajadas: horasTrabajadas,
        horasExtras: horasExtras,
        observaciones: formData.observaciones.trim() || null
      };

      if (editingAsistencia) {
        await registroAsistenciaApi.update(editingAsistencia.id, { ...asistenciaData, id: editingAsistencia.id });
      } else {
        await registroAsistenciaApi.create(asistenciaData);
      }

      await loadAsistenciasByPeriodo();
      handleCloseForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la asistencia');
      console.error('Error saving asistencia:', err);
    }
  };

  const handleDeleteAsistencia = async () => {
    if (!selected) return;
    
    try {
      setError(null);
      await registroAsistenciaApi.delete(selected.id);
      await loadAsistenciasByPeriodo();
      setOpenDelete(false);
      setSelected(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar la asistencia');
      console.error('Error deleting asistencia:', err);
      setOpenDelete(false);
    }
  };

  const handleViewDetails = (asistencia: RegistroAsistencia) => {
    setSelected(asistencia);
    setOpenDetail(true);
  };

  const handleOpenDelete = (asistencia: RegistroAsistencia) => {
    setSelected(asistencia);
    setOpenDelete(true);
  };

  // Funciones de exportación
  const exportToExcel = async () => {
    const data = reportFilteredAsistencias.map(asistencia => {
      const excepcion = Array.isArray(excepciones) ? excepciones.find(ex => 
        ex.empleadoId === asistencia.empleadoId && 
        dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(asistencia.fecha).format('YYYY-MM-DD')
      ) : null;
      
      return {
        'Fecha': dayjs(asistencia.fecha).format('DD/MM/YYYY'),
        'Día': dayjs(asistencia.fecha).format('dddd'),
        'Empleado': asistencia.empleado ? getEmpleadoNombre(asistencia.empleado) : 'N/A',
        'Estado': excepcion ? excepcion.tipo : 'PRESENTE',
        'Hora Entrada': asistencia.horaEntrada || '-',
        'Hora Salida': asistencia.horaSalida || '-',
        'Horas Trabajadas': asistencia.horasTrabajadas.toFixed(2),
        'Horas Extras': asistencia.horasExtras.toFixed(2),
        'Observaciones': excepcion ? (excepcion.observaciones || excepcion.motivo || '-') : (asistencia.observaciones || '-')
      };
    });

    // Agregar resumen al final
    data.push({});
    data.push({
      'Fecha': 'RESUMEN',
      'Día': '',
      'Empleado': '',
      'Estado': '',
      'Hora Entrada': '',
      'Hora Salida': '',
      'Horas Trabajadas': '',
      'Horas Extras': '',
      'Observaciones': ''
    });
    data.push({
      'Fecha': 'Total Horas Trabajadas',
      'Día': reportStats.totalHoras.toFixed(2),
      'Empleado': 'Total Horas Extras',
      'Estado': reportStats.totalHorasExtras.toFixed(2),
      'Hora Entrada': 'Promedio Diario',
      'Hora Salida': reportStats.promedioHoras.toFixed(2),
      'Horas Trabajadas': 'Días Trabajados',
      'Horas Extras': reportFilteredAsistencias.length.toString(),
      'Observaciones': ''
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistencias');
    const headers = Object.keys(data[0] || {});
    worksheet.addRow(headers);
    data.forEach(row => worksheet.addRow(headers.map(h => (row as any)[h] ?? '')));

    const fileName = `Reporte_Asistencias_${dayjs(reportFechaDesde).format('DDMMYYYY')}_${dayjs(reportFechaHasta).format('DDMMYYYY')}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Reporte de Asistencias', 14, 22);
    
    // Información del reporte
    doc.setFontSize(11);
    doc.text(`Período: ${dayjs(reportFechaDesde).format('DD/MM/YYYY')} - ${dayjs(reportFechaHasta).format('DD/MM/YYYY')}`, 14, 30);
    if (reportEmpleadoFilter) {
      doc.text(`Empleado: ${getEmpleadoNombre(reportEmpleadoFilter)}`, 14, 36);
    }
    if (reportTipoFilter !== 'TODOS') {
      doc.text(`Tipo: ${reportTipoFilter}`, 14, reportEmpleadoFilter ? 42 : 36);
    }
    
    // Tabla de datos
    const tableData = reportFilteredAsistencias.map(asistencia => {
      const excepcion = Array.isArray(excepciones) ? excepciones.find(ex => 
        ex.empleadoId === asistencia.empleadoId && 
        dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(asistencia.fecha).format('YYYY-MM-DD')
      ) : null;
      
      return [
        dayjs(asistencia.fecha).format('DD/MM/YYYY'),
        asistencia.empleado ? getEmpleadoNombre(asistencia.empleado) : 'N/A',
        excepcion ? excepcion.tipo : 'PRESENTE',
        asistencia.horaEntrada || '-',
        asistencia.horaSalida || '-',
        asistencia.horasTrabajadas.toFixed(1) + 'h',
        asistencia.horasExtras > 0 ? '+' + asistencia.horasExtras.toFixed(1) + 'h' : '-'
      ];
    });

    autoTable(doc, {
      head: [['Fecha', 'Empleado', 'Estado', 'Entrada', 'Salida', 'Horas', 'Extras']],
      body: tableData,
      startY: reportEmpleadoFilter || reportTipoFilter !== 'TODOS' ? 48 : 38,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [63, 81, 181] }
    });

    // Resumen
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Resumen:', 14, finalY);
    doc.setFontSize(10);
    doc.text(`Total Horas Trabajadas: ${reportStats.totalHoras.toFixed(2)} horas`, 14, finalY + 7);
    doc.text(`Total Horas Extras: ${reportStats.totalHorasExtras.toFixed(2)} horas`, 14, finalY + 14);
    doc.text(`Promedio Diario: ${reportStats.promedioHoras.toFixed(2)} horas`, 14, finalY + 21);
    doc.text(`Días Trabajados: ${reportFilteredAsistencias.length}`, 14, finalY + 28);
    doc.text(`Tardanzas: ${reportStats.tardanzas}`, 100, finalY + 7);
    doc.text(`Inasistencias: ${reportStats.inasistencias}`, 100, finalY + 14);
    
    const fileName = `Reporte_Asistencias_${dayjs(reportFechaDesde).format('DDMMYYYY')}_${dayjs(reportFechaHasta).format('DDMMYYYY')}.pdf`;
    doc.save(fileName);
    setExportMenuAnchor(null);
  };

  // Handlers para configuración de horarios
  const handleCrearHorarioEstandar = async (empleadoId: number) => {
    try {
      await configuracionAsistenciaApi.createHorarioEstandar(empleadoId);
      await loadData();
      // Mostrar notificación de éxito
    } catch (error) {
      console.error('Error al crear horario estándar:', error);
      setError('Error al crear horario estándar');
    }
  };

  // Handlers para excepciones
  const handleDeleteExcepcion = async (excepcionId: number) => {
    try {
      await excepcionAsistenciaApi.delete(excepcionId);
      await loadData();
      // Mostrar notificación de éxito
    } catch (error) {
      console.error('Error al eliminar excepción:', error);
      setError('Error al eliminar excepción');
    }
  };

  const handleOpenConfigDialog = (empleado: Empleado | null = null) => {
    setSelectedEmpleado(empleado);
    if (empleado && Array.isArray(configuraciones)) {
      const config = configuraciones.find(c => c.empleadoId === empleado.id);
      if (config) {
        setConfigFormData({
          lunes: config.lunes || { trabaja: false, horaEntrada: '08:00', horaSalida: '17:00' },
          martes: config.martes || { trabaja: false, horaEntrada: '08:00', horaSalida: '17:00' },
          miercoles: config.miercoles || { trabaja: false, horaEntrada: '08:00', horaSalida: '17:00' },
          jueves: config.jueves || { trabaja: false, horaEntrada: '08:00', horaSalida: '17:00' },
          viernes: config.viernes || { trabaja: false, horaEntrada: '08:00', horaSalida: '17:00' },
          sabado: config.sabado || { trabaja: false, horaEntrada: '08:00', horaSalida: '12:00' },
          domingo: config.domingo || { trabaja: false, horaEntrada: '08:00', horaSalida: '12:00' }
        });
      }
    }
    setOpenConfigDialog(true);
  };

  const handleCloseConfigDialog = () => {
    setOpenConfigDialog(false);
    setSelectedEmpleado(null);
    setConfigFormData({
      lunes: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
      martes: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
      miercoles: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
      jueves: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
      viernes: { trabaja: true, horaEntrada: '08:00', horaSalida: '17:00' },
      sabado: { trabaja: false, horaEntrada: '08:00', horaSalida: '12:00' },
      domingo: { trabaja: false, horaEntrada: '08:00', horaSalida: '12:00' }
    });
  };

  const handleSaveConfiguracion = async () => {
    if (!selectedEmpleado) return;
    
    try {
      const config = Array.isArray(configuraciones) ? configuraciones.find(c => c.empleadoId === selectedEmpleado.id) : null;
      const payload = {
        empleadoId: selectedEmpleado.id,
        activo: true,
        ...configFormData
      };
      
      if (config) {
        await configuracionAsistenciaApi.update(config.id, payload);
      } else {
        await configuracionAsistenciaApi.create(payload);
      }
      
      await loadData();
      handleCloseConfigDialog();
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setError('Error al guardar configuración de horarios');
    }
  };

  const handleOpenExcepcionDialog = () => {
    setExcepcionFormData({
      empleadoId: '',
      fecha: dayjs().format('YYYY-MM-DD'),
      tipo: '',
      horaEntradaReal: '',
      horaSalidaReal: '',
      horasExtras: '',
      minutosTardanza: '',
      motivo: '',
      observaciones: '',
      justificado: false
    });
    setOpenExcepcionDialog(true);
  };

  const handleCloseExcepcionDialog = () => {
    setOpenExcepcionDialog(false);
    setExcepcionFormData({
      empleadoId: '',
      fecha: dayjs().format('YYYY-MM-DD'),
      tipo: '',
      horaEntradaReal: '',
      horaSalidaReal: '',
      horasExtras: '',
      minutosTardanza: '',
      motivo: '',
      observaciones: '',
      justificado: false
    });
  };

  const handleSaveExcepcion = async () => {
    try {
      // Validar que debe trabajar ese día
      const debeTrabajar = await asistenciaAutomaticaApi.debeTrabajar(
        parseInt(excepcionFormData.empleadoId),
        excepcionFormData.fecha
      );
      
      if (!debeTrabajar && excepcionFormData.tipo !== 'INASISTENCIA') {
        setError('El empleado no tiene configurado trabajar este día');
        return;
      }
      
      const payload: any = {
        empleadoId: parseInt(excepcionFormData.empleadoId),
        fecha: excepcionFormData.fecha,
        tipo: excepcionFormData.tipo,
        justificado: excepcionFormData.justificado,
        observaciones: excepcionFormData.observaciones
      };
      
      // Agregar campos específicos según tipo
      if (excepcionFormData.tipo === 'LLEGADA_TARDE' && excepcionFormData.minutosTardanza) {
        payload.minutosTardanza = parseInt(excepcionFormData.minutosTardanza);
        
        // Calcular la hora de entrada real sumando los minutos de tardanza
        // Buscar la asistencia del día para obtener la hora de entrada configurada
        const asistenciaDelDia = asistencias.find(a => 
          a.empleadoId === parseInt(excepcionFormData.empleadoId) && 
          dayjs(a.fecha).format('YYYY-MM-DD') === excepcionFormData.fecha
        );
        
        if (asistenciaDelDia && asistenciaDelDia.horaEntrada) {
          const [horas, minutos] = asistenciaDelDia.horaEntrada.split(':').map(Number);
          const totalMinutos = horas * 60 + minutos + parseInt(excepcionFormData.minutosTardanza);
          const nuevasHoras = Math.floor(totalMinutos / 60);
          const nuevosMinutos = totalMinutos % 60;
          payload.horaEntradaReal = `${String(nuevasHoras).padStart(2, '0')}:${String(nuevosMinutos).padStart(2, '0')}:00`;
          console.log('Calculada hora entrada real para tardanza:', payload.horaEntradaReal);
        }
      }
      if (excepcionFormData.tipo === 'HORAS_EXTRAS' && excepcionFormData.horasExtras) {
        payload.horasExtras = parseFloat(excepcionFormData.horasExtras);
      }
      if (['SALIDA_ANTICIPADA', 'MODIFICACION_HORARIO'].includes(excepcionFormData.tipo)) {
        if (excepcionFormData.horaEntradaReal) payload.horaEntradaReal = excepcionFormData.horaEntradaReal;
        if (excepcionFormData.horaSalidaReal) payload.horaSalidaReal = excepcionFormData.horaSalidaReal;
      }
      if (excepcionFormData.tipo === 'INASISTENCIA' && excepcionFormData.motivo) {
        payload.motivo = excepcionFormData.motivo;
      }
      
      console.log('Payload de excepción a enviar:', payload);
      await excepcionAsistenciaApi.create(payload);
      await loadData();
      handleCloseExcepcionDialog();
    } catch (error) {
      console.error('Error al guardar excepción:', error);
      setError('Error al guardar excepción');
    }
  };

  // Estadísticas
  const totalHorasTrabajadas = filteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0);
  const totalHorasExtras = filteredAsistencias.reduce((sum, a) => sum + a.horasExtras, 0);
  const promedioHorasDiarias = filteredAsistencias.length > 0 
    ? totalHorasTrabajadas / filteredAsistencias.length 
    : 0;
  const empleadosUnicos = new Set(
    filteredAsistencias
      .filter(a => a.empleado?.id)
      .map(a => a.empleado.id)
  ).size;

  // Datos filtrados para reportes
  const reportFilteredAsistencias = asistencias.filter(a => {
    if (!a.empleado) return false;
    
    // Filtro por empleado
    const matchesEmpleado = !reportEmpleadoFilter || a.empleado.id === reportEmpleadoFilter.id;
    
    // Filtro por fecha
    const asistenciaDate = dayjs(a.fecha);
    const matchesFecha = asistenciaDate.isBetween(
      dayjs(reportFechaDesde), 
      dayjs(reportFechaHasta), 
      null, 
      '[]'
    );
    
    // Filtro por tipo de excepción
    let matchesTipo = true;
    if (reportTipoFilter !== 'TODOS') {
      const excepcion = Array.isArray(excepciones) ? excepciones.find(ex => 
        ex.empleadoId === a.empleadoId && 
        dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(a.fecha).format('YYYY-MM-DD')
      ) : null;
      
      if (reportTipoFilter === 'PRESENTE') {
        matchesTipo = !excepcion;
      } else {
        matchesTipo = excepcion?.tipo === reportTipoFilter;
      }
    }
    
    return matchesEmpleado && matchesFecha && matchesTipo;
  });

  // Estadísticas del reporte
  const reportStats = {
    totalAsistencias: reportFilteredAsistencias.length,
    totalHoras: reportFilteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0),
    totalHorasExtras: reportFilteredAsistencias.reduce((sum, a) => sum + a.horasExtras, 0),
    promedioHoras: reportFilteredAsistencias.length > 0 
      ? reportFilteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0) / reportFilteredAsistencias.length 
      : 0,
    tardanzas: Array.isArray(excepciones) ? excepciones.filter(ex => 
      ex.tipo === 'LLEGADA_TARDE' && 
      dayjs(ex.fecha).isBetween(dayjs(reportFechaDesde), dayjs(reportFechaHasta), null, '[]') &&
      (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length : 0,
    inasistencias: Array.isArray(excepciones) ? excepciones.filter(ex => 
      ex.tipo === 'INASISTENCIA' && 
      dayjs(ex.fecha).isBetween(dayjs(reportFechaDesde), dayjs(reportFechaHasta), null, '[]') &&
      (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length : 0,
    empleadosUnicos: new Set(
      reportFilteredAsistencias
        .filter(a => a.empleado?.id)
        .map(a => a.empleado.id)
    ).size
  };

  // Datos para gráficos
  const chartColors = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0', '#00bcd4'];
  
  // Gráfico de distribución de estados
  const estadosDistribucion = [
    { name: 'Presente', value: reportFilteredAsistencias.filter(a => {
      const excepcion = Array.isArray(excepciones) ? excepciones.find(ex => 
        ex.empleadoId === a.empleadoId && 
        dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(a.fecha).format('YYYY-MM-DD')
      ) : null;
      return !excepcion;
    }).length, color: '#4caf50' },
    { name: 'Tardanza', value: reportStats.tardanzas, color: '#ff9800' },
    { name: 'Inasistencia', value: reportStats.inasistencias, color: '#f44336' },
    { name: 'Horas Extras', value: Array.isArray(excepciones) ? excepciones.filter(ex => 
      ex.tipo === 'HORAS_EXTRAS' && 
      dayjs(ex.fecha).isBetween(dayjs(reportFechaDesde), dayjs(reportFechaHasta), null, '[]') &&
      (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length : 0, color: '#2196f3' }
  ].filter(item => item.value > 0);

  // Gráfico de horas por empleado (top 10)
  const horasPorEmpleado = reportEmpleadoFilter 
    ? []
    : Object.entries(
        reportFilteredAsistencias.reduce((acc: any, asistencia) => {
          if (asistencia.empleado) {
            const nombre = getEmpleadoNombre(asistencia.empleado);
            if (!acc[nombre]) {
              acc[nombre] = { nombre, horas: 0, extras: 0 };
            }
            acc[nombre].horas += asistencia.horasTrabajadas;
            acc[nombre].extras += asistencia.horasExtras;
          }
          return acc;
        }, {})
      )
      .map(([_, data]: any) => data)
      .sort((a: any, b: any) => b.horas - a.horas)
      .slice(0, 10);

  // Gráfico de tendencia diaria (últimos 30 días o período filtrado)
  const tendenciaDiaria = reportFilteredAsistencias
    .reduce((acc: any, asistencia) => {
      const fecha = dayjs(asistencia.fecha).format('DD/MM');
      if (!acc[fecha]) {
        acc[fecha] = { fecha, horas: 0, count: 0 };
      }
      acc[fecha].horas += asistencia.horasTrabajadas;
      acc[fecha].count += 1;
      return acc;
    }, {});
  
  const tendenciaDiariaArray = Object.values(tendenciaDiaria)
    .map((item: any) => ({
      ...item,
      promedio: item.horas / item.count
    }))
    .sort((a: any, b: any) => {
      const [diaA, mesA] = a.fecha.split('/').map(Number);
      const [diaB, mesB] = b.fecha.split('/').map(Number);
      return mesA !== mesB ? mesA - mesB : diaA - diaB;
    });

  // Gráfico de asistencias por día de la semana
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const asistenciasPorDiaSemana = reportFilteredAsistencias.reduce((acc: any, asistencia) => {
    const diaSemana = dayjs(asistencia.fecha).day(); // 0 = domingo, 1 = lunes, etc.
    const diaIndex = diaSemana === 0 ? 6 : diaSemana - 1; // Convertir a índice comenzando en lunes
    const nombreDia = diasSemana[diaIndex];
    
    if (!acc[nombreDia]) {
      acc[nombreDia] = { 
        dia: nombreDia, 
        asistencias: 0, 
        tardanzas: 0, 
        inasistencias: 0,
        horas: 0
      };
    }
    
    acc[nombreDia].asistencias += 1;
    acc[nombreDia].horas += asistencia.horasTrabajadas;
    
    const excepcion = Array.isArray(excepciones) ? excepciones.find(ex => 
      ex.empleadoId === asistencia.empleadoId && 
      dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(asistencia.fecha).format('YYYY-MM-DD')
    ) : null;
    
    if (excepcion?.tipo === 'LLEGADA_TARDE') acc[nombreDia].tardanzas += 1;
    if (excepcion?.tipo === 'INASISTENCIA') acc[nombreDia].inasistencias += 1;
    
    return acc;
  }, {});

  const asistenciasPorDiaArray = diasSemana.map(dia => 
    asistenciasPorDiaSemana[dia] || { 
      dia, 
      asistencias: 0, 
      tardanzas: 0, 
      inasistencias: 0,
      horas: 0 
    }
  );

  // Datos de comparación entre períodos
  const comparisonFilteredAsistencias = showComparison ? asistencias.filter(a => {
    if (!a.empleado) return false;
    
    const matchesEmpleado = !reportEmpleadoFilter || a.empleado.id === reportEmpleadoFilter.id;
    const asistenciaDate = dayjs(a.fecha);
    const matchesFecha = asistenciaDate.isBetween(
      dayjs(comparisonFechaDesde), 
      dayjs(comparisonFechaHasta), 
      null, 
      '[]'
    );
    
    return matchesEmpleado && matchesFecha;
  }) : [];

  const comparisonStats = showComparison ? {
    totalHoras: comparisonFilteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0),
    totalHorasExtras: comparisonFilteredAsistencias.reduce((sum, a) => sum + a.horasExtras, 0),
    promedioHoras: comparisonFilteredAsistencias.length > 0 
      ? comparisonFilteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0) / comparisonFilteredAsistencias.length 
      : 0,
    tardanzas: Array.isArray(excepciones) ? excepciones.filter(ex => 
      ex.tipo === 'LLEGADA_TARDE' && 
      dayjs(ex.fecha).isBetween(dayjs(comparisonFechaDesde), dayjs(comparisonFechaHasta), null, '[]') &&
      (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length : 0,
    inasistencias: Array.isArray(excepciones) ? excepciones.filter(ex => 
      ex.tipo === 'INASISTENCIA' && 
      dayjs(ex.fecha).isBetween(dayjs(comparisonFechaDesde), dayjs(comparisonFechaHasta), null, '[]') &&
      (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length : 0
  } : null;

  const periodosComparacion = showComparison && comparisonStats ? [
    {
      periodo: 'Período Actual',
      horas: reportStats.totalHoras,
      promedio: reportStats.promedioHoras,
      tardanzas: reportStats.tardanzas,
      inasistencias: reportStats.inasistencias
    },
    {
      periodo: 'Período Anterior',
      horas: comparisonStats.totalHoras,
      promedio: comparisonStats.promedioHoras,
      tardanzas: comparisonStats.tardanzas,
      inasistencias: comparisonStats.inasistencias
    }
  ] : [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Asistencias - Sistema Inteligente
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, overflowX: 'auto' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
        >
          <Tab icon={<CalendarIcon />} label={isMobile ? 'Resumen' : 'Resumen Diario'} iconPosition="start" />
          <Tab icon={<ScheduleIcon />} label={isMobile ? 'Horarios' : 'Configurar Horarios'} iconPosition="start" />
          <Tab icon={<EventBusyIcon />} label="Excepciones" iconPosition="start" />
          <Tab icon={<TrendingUpIcon />} label="Reportes" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab 0: Resumen Diario (Sistema Inteligente) */}
      {tabValue === 0 && (
        <>
          {/* KPIs Inteligentes */}
          <Grid container spacing={{ xs: 2, sm: 2 }} mb={3}>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                    <CheckCircleIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'success.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                        {filteredAsistencias.filter(a =>
                          !Array.isArray(excepciones) ? true : !excepciones.find(ex =>
                            ex.empleadoId === a.empleadoId &&
                            dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(a.fecha).format('YYYY-MM-DD')
                          )
                        ).length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Asist. Normales
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                    <WarningIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="warning.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                        {Array.isArray(excepciones) ? excepciones.filter(ex =>
                          ex.tipo === 'LLEGADA_TARDE' &&
                          dayjs(ex.fecha).isBetween(dayjs(fechaDesde), dayjs(fechaHasta), null, '[]')
                        ).length : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Tardanzas
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ bgcolor: 'error.50', borderLeft: '4px solid', borderColor: 'error.main' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                    <CancelIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'error.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="error.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                        {Array.isArray(excepciones) ? excepciones.filter(ex =>
                          ex.tipo === 'INASISTENCIA' &&
                          dayjs(ex.fecha).isBetween(dayjs(fechaDesde), dayjs(fechaHasta), null, '[]')
                        ).length : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Inasistencias
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                    <TrendingUpIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'info.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="info.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                        {Array.isArray(excepciones) ? excepciones
                          .filter(ex => ex.tipo === 'HORAS_EXTRAS' && dayjs(ex.fecha).isBetween(dayjs(fechaDesde), dayjs(fechaHasta), null, '[]'))
                          .reduce((sum, ex) => sum + (ex.horasExtras || 0), 0) : 0}h
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Horas Extras
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" mb={2} flexWrap="wrap" gap={2}>
                <Typography variant="h6">Vista General de Asistencias</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  <TextField
                    type="date"
                    label="Desde"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    type="date"
                    label="Hasta"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={async () => {
                      try {
                        await asistenciaAutomaticaApi.ejecutarGeneracionDiaria();
                        await loadData();
                      } catch (error) {
                        console.error('Error al generar asistencias:', error);
                        setError('Error al generar asistencias automáticas');
                      }
                    }}
                  >
                    Generar Automáticas
                  </Button>
                </Stack>
              </Stack>

              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Sistema Inteligente:</strong> Las asistencias se generan automáticamente según la configuración de horarios. 
                Solo registre excepciones (tardanzas, inasistencias, etc.) en la pestaña "Excepciones".
              </Alert>

              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 150 }}>Empleado</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Fecha</TableCell>
                      <TableCell align="center" sx={{ minWidth: 130 }}>Estado</TableCell>
                      <TableCell align="center" sx={{ minWidth: 80 }}>Entrada</TableCell>
                      <TableCell align="center" sx={{ minWidth: 80 }}>Salida</TableCell>
                      <TableCell align="center" sx={{ minWidth: 70 }}>Horas</TableCell>
                      <TableCell align="center" sx={{ minWidth: 110 }}>Tipo Registro</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Observaciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAsistencias.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="body2" color="textSecondary" py={3}>
                            No hay asistencias en el período seleccionado. 
                            Haga clic en "Generar Automáticas" para crear registros.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAsistencias.map(asistencia => {
                        const excepcion = Array.isArray(excepciones) ? excepciones.find(ex => 
                          ex.empleadoId === asistencia.empleadoId && 
                          dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(asistencia.fecha).format('YYYY-MM-DD')
                        ) : null;
                        
                        const esAutomatica = !excepcion;
                        const estadoFinal = excepcion ? excepcion.tipo : 'PRESENTE';
                        
                        return (
                          <TableRow key={asistencia.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="600">
                                {asistencia.empleado ? getEmpleadoNombre(asistencia.empleado) : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {dayjs(asistencia.fecha).format('DD/MM/YYYY')}
                            </TableCell>
                            <TableCell align="center">
                              {estadoFinal === 'PRESENTE' && (
                                <Chip label="Presente" color="success" size="small" icon={<CheckCircleIcon />} />
                              )}
                              {estadoFinal === 'LLEGADA_TARDE' && excepcion && (
                                <Chip 
                                  label={`Tardanza (${excepcion.minutosTardanza || 0} min)`} 
                                  color="warning" 
                                  size="small" 
                                  icon={<WarningIcon />} 
                                />
                              )}
                              {estadoFinal === 'INASISTENCIA' && (
                                <Chip label="Ausente" color="error" size="small" icon={<CancelIcon />} />
                              )}
                              {estadoFinal === 'HORAS_EXTRAS' && excepcion && (
                                <Chip 
                                  label={`+ ${excepcion.horasExtras || 0}h extras`} 
                                  color="info" 
                                  size="small" 
                                  icon={<TrendingUpIcon />} 
                                />
                              )}
                              {['SALIDA_ANTICIPADA', 'PERMISO', 'MODIFICACION_HORARIO'].includes(estadoFinal) && (
                                <Chip label={estadoFinal.replace(/_/g, ' ')} color="default" size="small" />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {asistencia.horaEntrada ? (
                                <Chip
                                  icon={<TimeIcon />}
                                  label={asistencia.horaEntrada}
                                  size="small"
                                  color={excepcion?.tipo === 'LLEGADA_TARDE' ? 'warning' : 'default'}
                                  variant="outlined"
                                />
                              ) : '-'}
                            </TableCell>
                            <TableCell align="center">
                              {asistencia.horaSalida ? (
                                <Chip
                                  icon={<TimerOffIcon />}
                                  label={asistencia.horaSalida}
                                  size="small"
                                  color="default"
                                  variant="outlined"
                                />
                              ) : '-'}
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="600" color="success.main">
                                {asistencia.horasTrabajadas || 0}h
                                {excepcion && excepcion.horasExtras ? (
                                  <Typography component="span" color="info.main" ml={1}>
                                    +{excepcion.horasExtras}h
                                  </Typography>
                                ) : null}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {esAutomatica ? (
                                <Tooltip title="Generada automáticamente por el sistema">
                                  <Chip 
                                    icon={<AutoAwesomeIcon />} 
                                    label="Automática" 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                  />
                                </Tooltip>
                              ) : (
                                <Tooltip title="Modificada por excepción registrada">
                                  <Chip 
                                    icon={<CreateIcon />} 
                                    label="Con Excepción" 
                                    size="small" 
                                    color="secondary" 
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {excepcion ? (excepcion.observaciones || excepcion.motivo || '-') : (asistencia.observaciones || '-')}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Tab 1: Configurar Horarios */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Configuración de Horarios por Empleado</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenConfigDialog()}
              >
                Nuevo Horario
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Lunes</TableCell>
                    <TableCell align="center">Martes</TableCell>
                    <TableCell align="center">Miércoles</TableCell>
                    <TableCell align="center">Jueves</TableCell>
                    <TableCell align="center">Viernes</TableCell>
                    <TableCell align="center">Sábado</TableCell>
                    <TableCell align="center">Domingo</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {empleados.map((empleado) => {
                    const config = Array.isArray(configuraciones) ? configuraciones.find(c => c.empleadoId === empleado.id) : null;
                    return (
                      <TableRow key={empleado.id}>
                        <TableCell>{getEmpleadoNombre(empleado)}</TableCell>
                        <TableCell>
                          {config ? (
                            <Chip 
                              label={config.activo ? 'Activo' : 'Inactivo'} 
                              color={config.activo ? 'success' : 'default'} 
                              size="small" 
                            />
                          ) : (
                            <Chip label="Sin configurar" color="warning" size="small" />
                          )}
                        </TableCell>
                        {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => (
                          <TableCell key={dia} align="center">
                            {config && config[dia] && config[dia].trabaja ? (
                              <Tooltip title={`${config[dia].horaEntrada} - ${config[dia].horaSalida}`}>
                                <CheckCircleIcon color="success" fontSize="small" />
                              </Tooltip>
                            ) : (
                              <CancelIcon color="disabled" fontSize="small" />
                            )}
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            {config ? (
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenConfigDialog(empleado)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Crear Horario Estándar (L-V 8:00-17:00)">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleCrearHorarioEstandar(empleado.id)}
                                >
                                  <AutoAwesomeIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Excepciones */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Registro de Excepciones</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenExcepcionDialog}
              >
                Nueva Excepción
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Detalles</TableCell>
                    <TableCell>Justificado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!Array.isArray(excepciones) || excepciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No hay excepciones registradas
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    excepciones.map((excepcion: any) => {
                      const empleado = empleados.find(e => e.id === excepcion.empleadoId);
                      return (
                        <TableRow key={excepcion.id}>
                          <TableCell>{dayjs(excepcion.fecha).format('DD/MM/YYYY')}</TableCell>
                          <TableCell>{empleado ? getEmpleadoNombre(empleado) : 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={excepcion.tipo} 
                              size="small"
                              color={
                                excepcion.tipo === 'INASISTENCIA' ? 'error' :
                                excepcion.tipo === 'LLEGADA_TARDE' ? 'warning' :
                                excepcion.tipo === 'HORAS_EXTRAS' ? 'success' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {excepcion.tipo === 'LLEGADA_TARDE' && excepcion.minutosTardanza !== undefined && excepcion.minutosTardanza !== null && `${excepcion.minutosTardanza} minutos`}
                            {excepcion.tipo === 'HORAS_EXTRAS' && excepcion.horasExtras !== undefined && excepcion.horasExtras !== null && `${excepcion.horasExtras} horas`}
                            {excepcion.tipo === 'INASISTENCIA' && excepcion.motivo}
                            {excepcion.observaciones && ` - ${excepcion.observaciones}`}
                          </TableCell>
                          <TableCell>
                            {excepcion.justificado ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <WarningIcon color="warning" fontSize="small" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteExcepcion(excepcion.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Reportes */}
      {tabValue === 3 && (
        <>
          {/* Filtros de Reporte */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Filtros de Búsqueda</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant={showCharts ? 'contained' : 'outlined'}
                    startIcon={<ChartIcon />}
                    onClick={() => setShowCharts(!showCharts)}
                    size="small"
                  >
                    {showCharts ? 'Ocultar' : 'Ver'} Gráficos
                  </Button>
                  <Button
                    variant={showComparison ? 'contained' : 'outlined'}
                    startIcon={<CalendarIcon />}
                    onClick={() => setShowComparison(!showComparison)}
                    size="small"
                    color="secondary"
                  >
                    Comparar Períodos
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<GetAppIcon />}
                    onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                    size="small"
                  >
                    Exportar
                  </Button>
                </Stack>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Autocomplete
                    options={empleados}
                    getOptionLabel={(option) => getEmpleadoNombre(option)}
                    value={reportEmpleadoFilter}
                    onChange={(_, newValue) => setReportEmpleadoFilter(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Empleado" placeholder="Todos" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    type="date"
                    label="Desde"
                    value={reportFechaDesde}
                    onChange={(e) => setReportFechaDesde(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    type="date"
                    label="Hasta"
                    value={reportFechaHasta}
                    onChange={(e) => setReportFechaHasta(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Registro</InputLabel>
                    <Select
                      value={reportTipoFilter}
                      onChange={(e) => setReportTipoFilter(e.target.value)}
                      label="Tipo de Registro"
                    >
                      <MenuItem value="TODOS">Todos</MenuItem>
                      <MenuItem value="PRESENTE">Presente</MenuItem>
                      <MenuItem value="LLEGADA_TARDE">Llegada Tarde</MenuItem>
                      <MenuItem value="INASISTENCIA">Inasistencia</MenuItem>
                      <MenuItem value="HORAS_EXTRAS">Horas Extras</MenuItem>
                      <MenuItem value="SALIDA_ANTICIPADA">Salida Anticipada</MenuItem>
                      <MenuItem value="PERMISO">Permiso</MenuItem>
                      <MenuItem value="MODIFICACION_HORARIO">Modificación de Horario</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ height: '56px' }}
                    onClick={() => {
                      setReportEmpleadoFilter(null);
                      setReportFechaDesde(dayjs().startOf('month').format('YYYY-MM-DD'));
                      setReportFechaHasta(dayjs().format('YYYY-MM-DD'));
                      setReportTipoFilter('TODOS');
                    }}
                  >
                    Limpiar Filtros
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Comparación de Períodos */}
          {showComparison && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" mb={2}>Configurar Período de Comparación</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      type="date"
                      label="Período Anterior - Desde"
                      value={comparisonFechaDesde}
                      onChange={(e) => setComparisonFechaDesde(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      type="date"
                      label="Período Anterior - Hasta"
                      value={comparisonFechaHasta}
                      onChange={(e) => setComparisonFechaHasta(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Alert severity="info" sx={{ py: 0 }}>
                      <Typography variant="caption">
                        <strong>Período Actual:</strong> {dayjs(reportFechaDesde).format('DD/MM/YYYY')} - {dayjs(reportFechaHasta).format('DD/MM/YYYY')}
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>

                {/* Gráfico de comparación */}
                {periodosComparacion.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="subtitle1" mb={2} fontWeight="600">
                      Comparación de Métricas
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={periodosComparacion}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="horas" fill="#4caf50" name="Horas Totales" />
                        <Bar dataKey="promedio" fill="#2196f3" name="Promedio Diario" />
                        <Bar dataKey="tardanzas" fill="#ff9800" name="Tardanzas" />
                        <Bar dataKey="inasistencias" fill="#f44336" name="Inasistencias" />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Análisis de cambio */}
                    <Grid container spacing={2} mt={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                          <Typography variant="caption" color="textSecondary">
                            Cambio en Horas Totales
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={
                              reportStats.totalHoras > comparisonStats.totalHoras 
                                ? 'success.main' 
                                : reportStats.totalHoras < comparisonStats.totalHoras 
                                  ? 'error.main' 
                                  : 'textPrimary'
                            }
                            fontWeight="bold"
                          >
                            {reportStats.totalHoras > comparisonStats.totalHoras ? '+' : ''}
                            {(reportStats.totalHoras - comparisonStats.totalHoras).toFixed(1)}h
                            <Typography component="span" variant="caption" ml={1}>
                              ({comparisonStats.totalHoras > 0 
                                ? ((reportStats.totalHoras - comparisonStats.totalHoras) / comparisonStats.totalHoras * 100).toFixed(1) 
                                : '0'}%)
                            </Typography>
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: 'warning.50' }}>
                          <Typography variant="caption" color="textSecondary">
                            Cambio en Tardanzas
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={
                              reportStats.tardanzas < comparisonStats.tardanzas 
                                ? 'success.main' 
                                : reportStats.tardanzas > comparisonStats.tardanzas 
                                  ? 'error.main' 
                                  : 'textPrimary'
                            }
                            fontWeight="bold"
                          >
                            {reportStats.tardanzas > comparisonStats.tardanzas ? '+' : ''}
                            {reportStats.tardanzas - comparisonStats.tardanzas}
                            <Typography component="span" variant="caption" ml={1}>
                              ({reportStats.tardanzas < comparisonStats.tardanzas ? '↓ Mejor' : reportStats.tardanzas > comparisonStats.tardanzas ? '↑ Peor' : '='})
                            </Typography>
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: 'error.50' }}>
                          <Typography variant="caption" color="textSecondary">
                            Cambio en Inasistencias
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={
                              reportStats.inasistencias < comparisonStats.inasistencias 
                                ? 'success.main' 
                                : reportStats.inasistencias > comparisonStats.inasistencias 
                                  ? 'error.main' 
                                  : 'textPrimary'
                            }
                            fontWeight="bold"
                          >
                            {reportStats.inasistencias > comparisonStats.inasistencias ? '+' : ''}
                            {reportStats.inasistencias - comparisonStats.inasistencias}
                            <Typography component="span" variant="caption" ml={1}>
                              ({reportStats.inasistencias < comparisonStats.inasistencias ? '↓ Mejor' : reportStats.inasistencias > comparisonStats.inasistencias ? '↑ Peor' : '='})
                            </Typography>
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
                          <Typography variant="caption" color="textSecondary">
                            Cambio en Promedio Diario
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={
                              reportStats.promedioHoras > comparisonStats.promedioHoras 
                                ? 'success.main' 
                                : reportStats.promedioHoras < comparisonStats.promedioHoras 
                                  ? 'error.main' 
                                  : 'textPrimary'
                            }
                            fontWeight="bold"
                          >
                            {reportStats.promedioHoras > comparisonStats.promedioHoras ? '+' : ''}
                            {(reportStats.promedioHoras - comparisonStats.promedioHoras).toFixed(1)}h
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* KPIs del Reporte */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CalendarIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {reportStats.totalAsistencias}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Registros
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TimeIcon sx={{ fontSize: 40, color: 'success.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {reportStats.totalHoras.toFixed(1)}h
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Horas Trabajadas
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        {reportStats.tardanzas}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Tardanzas
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'error.50', borderLeft: '4px solid', borderColor: 'error.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CancelIcon sx={{ fontSize: 40, color: 'error.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="error.main">
                        {reportStats.inasistencias}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Inasistencias
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="info.main">
                        {reportStats.totalHorasExtras.toFixed(1)}h
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Horas Extras Totales
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: 'secondary.50', borderLeft: '4px solid', borderColor: 'secondary.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <PersonIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="secondary.main">
                        {reportStats.empleadosUnicos}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Empleados Únicos
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {reportStats.promedioHoras.toFixed(1)}h
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Promedio Diario
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Gráficos */}
          {showCharts && reportFilteredAsistencias.length > 0 && (
            <Grid container spacing={3} mb={3}>
              {/* Gráfico de Distribución de Estados */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2} display="flex" alignItems="center">
                      <PieChartIcon sx={{ mr: 1 }} />
                      Distribución de Estados
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={estadosDistribucion}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {estadosDistribucion.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráfico de Tendencia Diaria */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2} display="flex" alignItems="center">
                      <ChartIcon sx={{ mr: 1 }} />
                      Tendencia de Horas Diarias
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={tendenciaDiariaArray}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="horas" 
                          stroke="#4caf50" 
                          name="Horas Totales"
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="promedio" 
                          stroke="#2196f3" 
                          name="Promedio"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráfico de Horas por Empleado (solo si no hay filtro de empleado) */}
              {!reportEmpleadoFilter && horasPorEmpleado.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" mb={2} display="flex" alignItems="center">
                        <TrendingUpIcon sx={{ mr: 1 }} />
                        Top 10 Empleados por Horas Trabajadas
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={horasPorEmpleado}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="nombre" 
                            angle={-45} 
                            textAnchor="end" 
                            height={100}
                          />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="horas" fill="#4caf50" name="Horas Normales" />
                          <Bar dataKey="extras" fill="#2196f3" name="Horas Extras" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Gráfico de Asistencias por Día de la Semana */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2} display="flex" alignItems="center">
                      <CalendarIcon sx={{ mr: 1 }} />
                      Análisis por Día de la Semana
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={asistenciasPorDiaArray}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dia" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="asistencias" fill="#4caf50" name="Asistencias" />
                        <Bar dataKey="tardanzas" fill="#ff9800" name="Tardanzas" />
                        <Bar dataKey="inasistencias" fill="#f44336" name="Inasistencias" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráfico de Horas Promedio por Día de la Semana */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2} display="flex" alignItems="center">
                      <ScheduleIcon sx={{ mr: 1 }} />
                      Horas Promedio por Día de Semana
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={asistenciasPorDiaArray}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dia" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar 
                          dataKey={(data: any) => data.asistencias > 0 ? (data.horas / data.asistencias).toFixed(2) : 0} 
                          fill="#2196f3" 
                          name="Horas Promedio"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <Box mt={2}>
                      <Typography variant="caption" color="textSecondary" display="block">
                        <strong>Día más productivo:</strong> {
                          asistenciasPorDiaArray.reduce((max, dia) => 
                            (dia.asistencias > 0 && dia.horas / dia.asistencias > (max.horas / (max.asistencias || 1))) ? dia : max
                          , asistenciasPorDiaArray[0] || {dia: 'N/A', horas: 0, asistencias: 1}).dia
                        }
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        <strong>Día con más tardanzas:</strong> {
                          asistenciasPorDiaArray.reduce((max, dia) => 
                            dia.tardanzas > max.tardanzas ? dia : max
                          , {dia: 'N/A', tardanzas: 0}).dia
                        }
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tabla de Detalles */}
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Detalle de Asistencias
                {reportEmpleadoFilter && (
                  <Chip 
                    label={`Empleado: ${getEmpleadoNombre(reportEmpleadoFilter)}`} 
                    onDelete={() => setReportEmpleadoFilter(null)}
                    sx={{ ml: 2 }}
                    color="primary"
                  />
                )}
                {reportTipoFilter !== 'TODOS' && (
                  <Chip 
                    label={`Tipo: ${reportTipoFilter}`} 
                    onDelete={() => setReportTipoFilter('TODOS')}
                    sx={{ ml: 1 }}
                    color="secondary"
                  />
                )}
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Empleado</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Entrada</TableCell>
                      <TableCell align="center">Salida</TableCell>
                      <TableCell align="center">Horas Trabajadas</TableCell>
                      <TableCell align="center">Horas Extras</TableCell>
                      <TableCell>Observaciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportFilteredAsistencias.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="body2" color="textSecondary" py={3}>
                            No se encontraron registros con los filtros aplicados
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportFilteredAsistencias.map(asistencia => {
                        const excepcion = Array.isArray(excepciones) ? excepciones.find(ex => 
                          ex.empleadoId === asistencia.empleadoId && 
                          dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(asistencia.fecha).format('YYYY-MM-DD')
                        ) : null;
                        
                        const estadoFinal = excepcion ? excepcion.tipo : 'PRESENTE';
                        
                        return (
                          <TableRow key={asistencia.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="500">
                                {dayjs(asistencia.fecha).format('DD/MM/YYYY')}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {dayjs(asistencia.fecha).format('dddd')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="600">
                                {asistencia.empleado ? getEmpleadoNombre(asistencia.empleado) : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {estadoFinal === 'PRESENTE' && (
                                <Chip label="Presente" color="success" size="small" icon={<CheckCircleIcon />} />
                              )}
                              {estadoFinal === 'LLEGADA_TARDE' && excepcion && (
                                <Chip 
                                  label={`Tardanza (${excepcion.minutosTardanza || 0} min)`} 
                                  color="warning" 
                                  size="small" 
                                  icon={<WarningIcon />} 
                                />
                              )}
                              {estadoFinal === 'INASISTENCIA' && (
                                <Chip label="Ausente" color="error" size="small" icon={<CancelIcon />} />
                              )}
                              {estadoFinal === 'HORAS_EXTRAS' && excepcion && (
                                <Chip 
                                  label={`+ ${excepcion.horasExtras || 0}h extras`} 
                                  color="info" 
                                  size="small" 
                                  icon={<TrendingUpIcon />} 
                                />
                              )}
                              {['SALIDA_ANTICIPADA', 'PERMISO', 'MODIFICACION_HORARIO'].includes(estadoFinal) && (
                                <Chip 
                                  label={estadoFinal.replace(/_/g, ' ')} 
                                  color="default" 
                                  size="small" 
                                />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {asistencia.horaEntrada ? (
                                <Typography variant="body2" fontWeight="500">
                                  {asistencia.horaEntrada}
                                </Typography>
                              ) : '-'}
                            </TableCell>
                            <TableCell align="center">
                              {asistencia.horaSalida ? (
                                <Typography variant="body2" fontWeight="500">
                                  {asistencia.horaSalida}
                                </Typography>
                              ) : '-'}
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="600" color="success.main">
                                {asistencia.horasTrabajadas.toFixed(1)}h
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography 
                                variant="body2" 
                                fontWeight="600" 
                                color={asistencia.horasExtras > 0 ? 'info.main' : 'textSecondary'}
                              >
                                {asistencia.horasExtras > 0 ? `+${asistencia.horasExtras.toFixed(1)}h` : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {excepcion ? (excepcion.observaciones || excepcion.motivo || '-') : (asistencia.observaciones || '-')}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Resumen al pie de la tabla */}
              {reportFilteredAsistencias.length > 0 && (
                <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="textSecondary">
                        Total Horas Trabajadas
                      </Typography>
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        {reportStats.totalHoras.toFixed(2)} horas
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="textSecondary">
                        Total Horas Extras
                      </Typography>
                      <Typography variant="h6" color="info.main" fontWeight="bold">
                        {reportStats.totalHorasExtras.toFixed(2)} horas
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="textSecondary">
                        Promedio Horas/Día
                      </Typography>
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        {reportStats.promedioHoras.toFixed(2)} horas
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="textSecondary">
                        Días Trabajados
                      </Typography>
                      <Typography variant="h6" color="secondary.main" fontWeight="bold">
                        {reportFilteredAsistencias.length} días
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Menú de Exportación */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={exportToExcel}>
          <ListItemIcon>
            <ExcelIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Exportar a Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={exportToPDF}>
          <ListItemIcon>
            <PdfIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Exportar a PDF</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog de Configuración de Horarios */}
      <Dialog open={openConfigDialog} onClose={handleCloseConfigDialog} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          {selectedEmpleado 
            ? `Configurar Horario - ${getEmpleadoNombre(selectedEmpleado)}`
            : 'Seleccionar Empleado'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {!selectedEmpleado && (
              <Autocomplete
                options={empleados}
                getOptionLabel={(option) => getEmpleadoNombre(option)}
                value={selectedEmpleado}
                onChange={(_, newValue) => setSelectedEmpleado(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Empleado" required />
                )}
              />
            )}
            
            {selectedEmpleado && (
              <>
                <Alert severity="info">
                  Configure los días y horarios laborales. Los días sin marcar se considerarán no laborables.
                </Alert>
                
                {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => (
                  <Box key={dia} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={configFormData[dia as keyof typeof configFormData]?.trabaja || false}
                              onChange={(e) => {
                                setConfigFormData(prev => ({
                                  ...prev,
                                  [dia]: {
                                    ...prev[dia as keyof typeof prev],
                                    trabaja: e.target.checked
                                  }
                                }));
                              }}
                            />
                          }
                          label={dia.charAt(0).toUpperCase() + dia.slice(1)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Hora Entrada"
                          type="time"
                          value={configFormData[dia as keyof typeof configFormData]?.horaEntrada || ''}
                          onChange={(e) => {
                            setConfigFormData(prev => ({
                              ...prev,
                              [dia]: {
                                ...prev[dia as keyof typeof prev],
                                horaEntrada: e.target.value
                              }
                            }));
                          }}
                          disabled={!configFormData[dia as keyof typeof configFormData]?.trabaja}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Hora Salida"
                          type="time"
                          value={configFormData[dia as keyof typeof configFormData]?.horaSalida || ''}
                          onChange={(e) => {
                            setConfigFormData(prev => ({
                              ...prev,
                              [dia]: {
                                ...prev[dia as keyof typeof prev],
                                horaSalida: e.target.value
                              }
                            }));
                          }}
                          disabled={!configFormData[dia as keyof typeof configFormData]?.trabaja}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleCloseConfigDialog}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveConfiguracion}
            disabled={!selectedEmpleado}
          >
            Guardar Configuración
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Excepciones */}
      <Dialog open={openExcepcionDialog} onClose={handleCloseExcepcionDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Registrar Excepción</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Autocomplete
              options={empleados}
              getOptionLabel={(option) => getEmpleadoNombre(option)}
              value={empleados.find(e => e.id.toString() === excepcionFormData.empleadoId) || null}
              onChange={(_, newValue) => {
                setExcepcionFormData(prev => ({
                  ...prev,
                  empleadoId: newValue ? newValue.id.toString() : ''
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Empleado" required />
              )}
            />
            
            <TextField
              label="Fecha"
              type="date"
              value={excepcionFormData.fecha}
              onChange={(e) => {
                setExcepcionFormData(prev => ({
                  ...prev,
                  fecha: e.target.value
                }));
              }}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            
            <FormControl fullWidth required>
              <InputLabel>Tipo de Excepción</InputLabel>
              <Select
                value={excepcionFormData.tipo}
                onChange={(e) => {
                  setExcepcionFormData(prev => ({
                    ...prev,
                    tipo: e.target.value
                  }));
                }}
                label="Tipo de Excepción"
              >
                <MenuItem value="INASISTENCIA">Inasistencia</MenuItem>
                <MenuItem value="LLEGADA_TARDE">Llegada Tarde</MenuItem>
                <MenuItem value="SALIDA_ANTICIPADA">Salida Anticipada</MenuItem>
                <MenuItem value="HORAS_EXTRAS">Horas Extras</MenuItem>
                <MenuItem value="PERMISO">Permiso</MenuItem>
                <MenuItem value="MODIFICACION_HORARIO">Modificación de Horario</MenuItem>
              </Select>
            </FormControl>

            {/* Campos dinámicos según tipo */}
            {excepcionFormData.tipo === 'LLEGADA_TARDE' && (
              <TextField
                label="Minutos de Tardanza"
                type="number"
                value={excepcionFormData.minutosTardanza}
                onChange={(e) => {
                  setExcepcionFormData(prev => ({
                    ...prev,
                    minutosTardanza: e.target.value
                  }));
                }}
                fullWidth
                required
                inputProps={{ min: 1 }}
              />
            )}

            {excepcionFormData.tipo === 'HORAS_EXTRAS' && (
              <TextField
                label="Horas Extras"
                type="number"
                value={excepcionFormData.horasExtras}
                onChange={(e) => {
                  setExcepcionFormData(prev => ({
                    ...prev,
                    horasExtras: e.target.value
                  }));
                }}
                fullWidth
                required
                inputProps={{ step: 0.5, min: 0.5 }}
              />
            )}

            {['SALIDA_ANTICIPADA', 'MODIFICACION_HORARIO'].includes(excepcionFormData.tipo) && (
              <>
                <TextField
                  label="Hora Entrada Real"
                  type="time"
                  value={excepcionFormData.horaEntradaReal}
                  onChange={(e) => {
                    setExcepcionFormData(prev => ({
                      ...prev,
                      horaEntradaReal: e.target.value
                    }));
                  }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Hora Salida Real"
                  type="time"
                  value={excepcionFormData.horaSalidaReal}
                  onChange={(e) => {
                    setExcepcionFormData(prev => ({
                      ...prev,
                      horaSalidaReal: e.target.value
                    }));
                  }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}

            {excepcionFormData.tipo === 'INASISTENCIA' && (
              <TextField
                label="Motivo"
                value={excepcionFormData.motivo}
                onChange={(e) => {
                  setExcepcionFormData(prev => ({
                    ...prev,
                    motivo: e.target.value
                  }));
                }}
                fullWidth
                required
              />
            )}

            <TextField
              label="Observaciones"
              value={excepcionFormData.observaciones}
              onChange={(e) => {
                setExcepcionFormData(prev => ({
                  ...prev,
                  observaciones: e.target.value
                }));
              }}
              fullWidth
              multiline
              rows={2}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={excepcionFormData.justificado}
                  onChange={(e) => {
                    setExcepcionFormData(prev => ({
                      ...prev,
                      justificado: e.target.checked
                    }));
                  }}
                />
              }
              label="Justificado"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleCloseExcepcionDialog}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveExcepcion}
            disabled={!excepcionFormData.empleadoId || !excepcionFormData.tipo}
          >
            Registrar Excepción
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AsistenciasPage;
