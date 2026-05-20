import React, { useState, useEffect, useMemo } from 'react';
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
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  InputAdornment,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  AttachMoney as AttachMoneyIcon,
  AccountCircle as AccountCircleIcon,
  LinkOff as LinkOffIcon,
  Link as LinkIcon,
  CalendarMonth as CalendarMonthIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  AccountBalance as AccountBalanceIcon,
  MedicalServices as MedicalServicesIcon,
  School as SchoolIcon,
  ContactMail as ContactMailIcon,
} from '@mui/icons-material';
import { employeeApi } from '../../api/services/employeeApi';
import { puestoApi } from '../../api/services/puestoApi';
import { categoriaSalarialApi } from '../../api/services/categoriaSalarialApi';
import { documentoEmpleadoApi } from '../../api/services/documentoEmpleadoApi';
import EmpleadoDisciplinaTab from './Disciplina/EmpleadoDisciplinaTab';
import {
  CargasFamiliaresTab,
  ContactosEmergenciaTab,
  IdiomasEmpleadoTab,
} from './EmpleadoRelaciones';
import CatalogoAutocomplete from '../common/CatalogoAutocomplete';
import { bancosApi, obrasSocialesApi, artsApi } from '../../api/services/catalogosGlobalesApi';
import EmpleadoFotoAvatar from './EmpleadoFotoAvatar';
import EmpleadoFotoUploader from './EmpleadoFotoUploader';
import usuarioAdminApi, { type UsuarioDTO } from '../../api/services/usuarioAdminApi';
import { sucursalService } from '../../services/sucursalService';
import { useTenant } from '../../context/TenantContext';
import DocumentManager from '../shared/DocumentManager';
import type { Empleado, Puesto, EmpleadoCreateDTO, Sucursal, CategoriaSalarial } from '../../types';
import {
  GENEROS, GENERO_LABEL,
  ESTADOS_CIVILES, ESTADO_CIVIL_LABEL,
  TIPOS_MANO_OBRA, TIPO_MANO_OBRA_LABEL,
  TIPOS_CONTRATO, TIPO_CONTRATO_LABEL,
  MOTIVOS_EGRESO, MOTIVO_EGRESO_LABEL,
  TIPOS_CUENTA, TIPO_CUENTA_LABEL,
  MONEDAS, MONEDA_LABEL,
  GRUPOS_SANGUINEOS,
  NIVELES_ESTUDIOS, NIVEL_ESTUDIOS_LABEL,
} from '../../types/rrhh.types';

// Estado de los campos de legajo dentro del form. El legajo es 1:1 con el
// empleado y se crea/edita en la misma pantalla. Todos los campos son
// opcionales: si se dejan vacíos, el backend autogenera lo que falte.
interface LegajoFormState {
  numeroLegajo: string;
  fechaAlta: string;
  fechaBaja: string;
  motivoBaja: string;
  observaciones: string;
  documentacion: string;
  activo: boolean;
}

const emptyLegajoFormState = (fechaAlta = ''): LegajoFormState => ({
  numeroLegajo: '',
  fechaAlta,
  fechaBaja: '',
  motivoBaja: '',
  observaciones: '',
  documentacion: '',
  activo: true,
});

// Estado de los ~50 campos planos de Fase 1 dentro del form. Todos los
// strings se inicializan a '' para que MUI no marque los TextField como
// uncontrolled→controlled cuando entran al edit. Los selects con valor fijo
// también van como '' (== "sin asignar").
const emptyFase1Fields = () => ({
  cuil: '', nombre2: '', apellido2: '',
  paisNacimiento: '', provinciaNacimiento: '', ciudadNacimiento: '',
  nacionalidad1: '', nacionalidad2: '', docNacionalidad2: '',
  genero: '' as '' | (typeof GENEROS)[number],
  estadoCivil: '' as '' | (typeof ESTADOS_CIVILES)[number],
  estadoCivilDesde: '',
  telCodigoPais: '', telArea: '', telNumero: '', emailContacto: '',
  domCalle: '', domAltura: '', domPiso: '', domDepto: '',
  domBarrio: '', domCp: '', domLocalidad: '', domProvincia: '', domPais: '',
  fechaIngresoLegal: '', locacion: '',
  areaNombre: '', departamentoNombre: '', sectorNombre: '',
  supervisorDirectoId: '' as '' | number,
  tipoManoObra: '' as '' | (typeof TIPOS_MANO_OBRA)[number],
  tipoContrato: '' as '' | (typeof TIPOS_CONTRATO)[number],
  motivoEgreso: '' as '' | (typeof MOTIVOS_EGRESO)[number],
  telLaboralArea: '', telLaboralNumero: '', emailLaboral: '',
  cbu: '', bancoNombre: '',
  tipoCuenta: '' as '' | (typeof TIPOS_CUENTA)[number],
  numeroCuenta: '', convenioColectivo: '', categoriaLaboral: '',
  moneda: '' as '' | (typeof MONEDAS)[number],
  sindicato: '',
  afiliadoSindicato: false,
  obraSocialCodigo: '', obraSocialDetalle: '',
  grupoSanguineo: '' as '' | (typeof GRUPOS_SANGUINEOS)[number],
  alergiasCondiciones: '', artNombre: '', fechaExamenPreocupacional: '',
  nivelEstudios: '' as '' | (typeof NIVELES_ESTUDIOS)[number],
  tituloCarrera: '',
});

type Fase1State = ReturnType<typeof emptyFase1Fields>;

// Toma un Empleado existente y devuelve los Fase 1 fields como strings
// editables (null/undefined → ''). Se usa al abrir el form en modo edición.
const fase1FromEmpleado = (e: Empleado): Fase1State => ({
  cuil: e.cuil ?? '', nombre2: e.nombre2 ?? '', apellido2: e.apellido2 ?? '',
  paisNacimiento: e.paisNacimiento ?? '',
  provinciaNacimiento: e.provinciaNacimiento ?? '',
  ciudadNacimiento: e.ciudadNacimiento ?? '',
  nacionalidad1: e.nacionalidad1 ?? '', nacionalidad2: e.nacionalidad2 ?? '',
  docNacionalidad2: e.docNacionalidad2 ?? '',
  genero: (e.genero ?? '') as Fase1State['genero'],
  estadoCivil: (e.estadoCivil ?? '') as Fase1State['estadoCivil'],
  estadoCivilDesde: e.estadoCivilDesde ?? '',
  telCodigoPais: e.telCodigoPais ?? '', telArea: e.telArea ?? '',
  telNumero: e.telNumero ?? '', emailContacto: e.emailContacto ?? '',
  domCalle: e.domCalle ?? '', domAltura: e.domAltura ?? '',
  domPiso: e.domPiso ?? '', domDepto: e.domDepto ?? '',
  domBarrio: e.domBarrio ?? '', domCp: e.domCp ?? '',
  domLocalidad: e.domLocalidad ?? '', domProvincia: e.domProvincia ?? '',
  domPais: e.domPais ?? '',
  fechaIngresoLegal: e.fechaIngresoLegal ?? '', locacion: e.locacion ?? '',
  areaNombre: e.areaNombre ?? '', departamentoNombre: e.departamentoNombre ?? '',
  sectorNombre: e.sectorNombre ?? '',
  supervisorDirectoId: (e.supervisorDirectoId ?? '') as Fase1State['supervisorDirectoId'],
  tipoManoObra: (e.tipoManoObra ?? '') as Fase1State['tipoManoObra'],
  tipoContrato: (e.tipoContrato ?? '') as Fase1State['tipoContrato'],
  motivoEgreso: (e.motivoEgreso ?? '') as Fase1State['motivoEgreso'],
  telLaboralArea: e.telLaboralArea ?? '', telLaboralNumero: e.telLaboralNumero ?? '',
  emailLaboral: e.emailLaboral ?? '',
  cbu: e.cbu ?? '', bancoNombre: e.bancoNombre ?? '',
  tipoCuenta: (e.tipoCuenta ?? '') as Fase1State['tipoCuenta'],
  numeroCuenta: e.numeroCuenta ?? '',
  convenioColectivo: e.convenioColectivo ?? '',
  categoriaLaboral: e.categoriaLaboral ?? '',
  moneda: (e.moneda ?? '') as Fase1State['moneda'],
  sindicato: e.sindicato ?? '',
  afiliadoSindicato: e.afiliadoSindicato ?? false,
  obraSocialCodigo: e.obraSocialCodigo ?? '',
  obraSocialDetalle: e.obraSocialDetalle ?? '',
  grupoSanguineo: (e.grupoSanguineo ?? '') as Fase1State['grupoSanguineo'],
  alergiasCondiciones: e.alergiasCondiciones ?? '',
  artNombre: e.artNombre ?? '',
  fechaExamenPreocupacional: e.fechaExamenPreocupacional ?? '',
  nivelEstudios: (e.nivelEstudios ?? '') as Fase1State['nivelEstudios'],
  tituloCarrera: e.tituloCarrera ?? '',
});

// Serializa los Fase 1 fields al payload de API: '' → null, valores válidos
// → tal cual. Lo manda como `Partial<EmpleadoCreateDTO>` parcial — el backend
// usa NullValuePropertyMappingStrategy.IGNORE así que no pisa valores existentes
// al actualizar.
const fase1ToPayload = (s: Fase1State) => {
  const out: Record<string, unknown> = {};
  (Object.keys(s) as Array<keyof Fase1State>).forEach(k => {
    const v = s[k];
    if (typeof v === 'string') out[k] = v.trim() === '' ? null : v;
    else if (typeof v === 'number') out[k] = v;
    else if (typeof v === 'boolean') out[k] = v;
    else out[k] = v;
  });
  return out;
};

// Lista de campos legalmente obligatorios para el legajo (banner amarillo).
// El doc los marca en rojo: si faltan, NO bloquea el save (decisión del usuario),
// pero se muestra una alerta para que RRHH sepa qué completar.
const CAMPOS_LEGALMENTE_OBLIGATORIOS: Array<{
  label: string;
  check: (f: { formData: any; fase1: Fase1State; legajo: LegajoFormState }) => boolean;
}> = [
  { label: 'CUIL', check: ({ fase1 }) => !fase1.cuil },
  { label: 'Nombre 1', check: ({ formData }) => !formData.nombre },
  { label: 'Apellido 1', check: ({ formData }) => !formData.apellido },
  { label: 'DNI', check: ({ formData }) => !formData.dni },
  { label: 'Fecha de nacimiento', check: ({ formData }) => !formData.fechaNacimiento },
  { label: 'Género', check: ({ fase1 }) => !fase1.genero },
  { label: 'Estado civil', check: ({ fase1 }) => !fase1.estadoCivil },
  { label: 'Teléfono (área + número)', check: ({ fase1 }) => !fase1.telArea || !fase1.telNumero },
  { label: 'Email de contacto', check: ({ fase1 }) => !fase1.emailContacto },
  { label: 'Domicilio: calle y altura', check: ({ fase1 }) => !fase1.domCalle || !fase1.domAltura },
  { label: 'Domicilio: CP, localidad, provincia, país', check: ({ fase1 }) =>
      !fase1.domCp || !fase1.domLocalidad || !fase1.domProvincia || !fase1.domPais },
  { label: 'Fecha de ingreso', check: ({ formData }) => !formData.fechaIngreso },
  { label: 'Fecha de ingreso legal (AFIP)', check: ({ fase1 }) => !fase1.fechaIngresoLegal },
  { label: 'Sucursal / Sede', check: ({ formData }) => !formData.sucursalId },
  { label: 'Locación', check: ({ fase1 }) => !fase1.locacion },
  { label: 'Área', check: ({ fase1 }) => !fase1.areaNombre },
  { label: 'Puesto', check: ({ formData }) => !formData.puestoId },
  { label: 'Tipo de mano de obra', check: ({ fase1 }) => !fase1.tipoManoObra },
  { label: 'Situación de revista (estado)', check: ({ formData }) => !formData.estado },
  { label: 'Tipo de contrato', check: ({ fase1 }) => !fase1.tipoContrato },
  { label: 'CBU', check: ({ fase1 }) => !fase1.cbu },
  { label: 'Banco', check: ({ fase1 }) => !fase1.bancoNombre },
  { label: 'Tipo de cuenta y Nº de cuenta', check: ({ fase1 }) => !fase1.tipoCuenta || !fase1.numeroCuenta },
  { label: 'Convenio colectivo', check: ({ fase1 }) => !fase1.convenioColectivo },
  { label: 'Categoría laboral (convenio)', check: ({ fase1 }) => !fase1.categoriaLaboral },
  { label: 'Moneda', check: ({ fase1 }) => !fase1.moneda },
  { label: 'Obra social: código y detalle', check: ({ fase1 }) =>
      !fase1.obraSocialCodigo || !fase1.obraSocialDetalle },
  { label: 'ART', check: ({ fase1 }) => !fase1.artNombre },
  { label: 'Fecha de examen preocupacional', check: ({ fase1 }) => !fase1.fechaExamenPreocupacional },
];
import LoadingOverlay from '../common/LoadingOverlay';
import ConfirmDialog from '../common/ConfirmDialog';

// Categorías de documentos para empleados
const CATEGORIAS_EMPLEADO = [
  'DNI',
  'CUIT',
  'CV',
  'CERTIFICADO_TRABAJO',
  'RECIBO_SUELDO',
  'LICENCIA_CONDUCIR',
  'CERTIFICADO_MEDICO',
  'EXAMEN_PREOCUPACIONAL',
  'ALTA_AFIP',
  'ALTA_ARCA',
  'CERT_SERVICIOS_REMUNERACIONES',
  'CONTRATO',
  'CERTIFICADO',
  'FOTO',
  'OTROS',
];

// Categorías obligatorias por ley (banner amarillo "Documentación legal
// faltante" y chip "OBLIGATORIO" en el selector de upload). Vienen del
// pedido de RRHH: Examen Preocupacional, Alta ARCA, Certificado de Servicios
// y Remuneraciones.
const CATEGORIAS_EMPLEADO_OBLIGATORIAS = [
  'EXAMEN_PREOCUPACIONAL',
  'ALTA_ARCA',
  'CERT_SERVICIOS_REMUNERACIONES',
];

const EmpleadosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { empresaId } = useTenant();

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [categoriasSalariales, setCategoriasSalariales] = useState<CategoriaSalarial[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
  const [detailTabValue, setDetailTabValue] = useState(0);

  // Vincular usuario dialog
  const [vincularDialogOpen, setVincularDialogOpen] = useState(false);
  const [vincularEmpleadoTarget, setVincularEmpleadoTarget] = useState<Empleado | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioDTO | null>(null);
  const [vincularLoading, setVincularLoading] = useState(false);
  const [empleadoToDelete, setEmpleadoToDelete] = useState<Empleado | null>(null);
  const [deleteEmpleadoLoading, setDeleteEmpleadoLoading] = useState(false);
  const [desvincularTarget, setDesvincularTarget] = useState<Empleado | null>(null);
  const [desvincularLoading, setDesvincularLoading] = useState(false);
  const [inactiveWarning, setInactiveWarning] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [puestoFilter, setPuestoFilter] = useState<number | null>(null);

  // Form data
  const [formData, setFormData] = useState<EmpleadoCreateDTO & { confirmPassword?: string }>({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
    fechaIngreso: '',
    puestoId: 0,
    categoriaSalarialId: null,
    salario: 0,
    estado: 'ACTIVO',
    sucursalId: undefined,
    crearUsuario: false,
    usuarioPassword: '',
    confirmPassword: '',
  });

  // Estado del legajo en el form (separado para no contaminar el DTO de empleado)
  const [legajoData, setLegajoData] = useState<LegajoFormState>(emptyLegajoFormState());

  // Estado de los ~50 campos planos de la Fase 1 (Datos Personales, Contacto,
  // Laborales, Bancarios, Salud, Formación). Separado para no inflar el
  // EmpleadoCreateDTO state que ya es complejo (crearUsuario + password).
  const [fase1Data, setFase1Data] = useState<Fase1State>(emptyFase1Fields());

  // Campos legalmente obligatorios que faltan en el form actual — alimenta
  // el banner amarillo "Legajo incompleto". NO bloquea el save.
  const camposFaltantes = useMemo(() => {
    return CAMPOS_LEGALMENTE_OBLIGATORIOS
      .filter(c => c.check({ formData, fase1: fase1Data, legajo: legajoData }))
      .map(c => c.label);
  }, [formData, fase1Data, legajoData]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empleadosData, puestosData, categoriasData] = await Promise.all([
        employeeApi.getAllList(),
        puestoApi.getAll(),
        categoriaSalarialApi.getAll().catch(() => [] as CategoriaSalarial[]),
      ]);
      setEmpleados(empleadosData);
      setPuestos(puestosData.content || []);
      setCategoriasSalariales(Array.isArray(categoriasData) ? categoriasData : []);

      if (empresaId) {
        try {
          const sucursalesData = await sucursalService.getByEmpresa(empresaId);
          setSucursales(sucursalesData.filter(s => s.estado === 'ACTIVO'));
        } catch {
          // sucursales not critical
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (empleado: Empleado) => {
    setSelectedEmpleado(empleado);
    setDetailTabValue(0);
    setDetailDialogOpen(true);
  };

  const handleOpenForm = (empleado?: Empleado) => {
    if (empleado) {
      setEditingEmpleado(empleado);
      setFormData({
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        dni: empleado.dni,
        email: empleado.email || '',
        telefono: empleado.telefono || '',
        direccion: empleado.direccion || '',
        fechaNacimiento: empleado.fechaNacimiento || '',
        fechaIngreso: empleado.fechaIngreso || '',
        // El backend devuelve `puestoId` flat, no `puesto.id` anidado —
        // priorizamos el flat y dejamos el nested como fallback defensivo.
        puestoId: empleado.puestoId ?? empleado.puesto?.id ?? 0,
        categoriaSalarialId: empleado.categoriaSalarialId ?? null,
        salario: empleado.salario || 0,
        estado: empleado.estado || 'ACTIVO',
        sucursalId: empleado.sucursalId,
        crearUsuario: false,
        usuarioPassword: '',
        confirmPassword: '',
      });
      setLegajoData({
        numeroLegajo: empleado.numeroLegajo || '',
        fechaAlta: empleado.legajoFechaAlta || empleado.fechaIngreso || '',
        fechaBaja: empleado.legajoFechaBaja || '',
        motivoBaja: empleado.legajoMotivoBaja || '',
        observaciones: empleado.legajoObservaciones || '',
        documentacion: empleado.legajoDocumentacion || '',
        activo: empleado.legajoActivo ?? true,
      });
      setFase1Data(fase1FromEmpleado(empleado));
    } else {
      setEditingEmpleado(null);
      const hoy = new Date().toISOString().split('T')[0];
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
        direccion: '',
        fechaNacimiento: '',
        fechaIngreso: hoy,
        puestoId: 0,
        categoriaSalarialId: null,
        salario: 0,
        estado: 'ACTIVO',
        sucursalId: undefined,
        crearUsuario: false,
        usuarioPassword: '',
        confirmPassword: '',
      });
      setLegajoData(emptyLegajoFormState(hoy));
      setFase1Data(emptyFase1Fields());
    }
    setFormDialogOpen(true);
  };

  const handleCloseForm = () => {
    setFormDialogOpen(false);
    setEditingEmpleado(null);
    setError(null);
  };

  const handleSaveEmpleado = async () => {
    try {
      setError(null);

      // Validaciones de campos mínimos: SÓLO en creación. En edición las
      // saltamos a propósito para poder corregir empleados migrados con huecos
      // (ver comentario en el botón "Guardar Cambios"). Si en algún momento
      // querés volver al check estricto, sacá los `!editingEmpleado &&`.
      if (!editingEmpleado && (!formData.nombre || !formData.apellido || !formData.dni)) {
        setError('Nombre, Apellido y DNI son requeridos');
        return;
      }

      if (!editingEmpleado && (!formData.puestoId || formData.puestoId === 0)) {
        setError('Debe seleccionar un puesto');
        return;
      }

      if (!editingEmpleado && formData.crearUsuario) {
        if (!formData.email) {
          setError('El email es requerido para crear una cuenta de acceso');
          return;
        }
        if (!formData.usuarioPassword || formData.usuarioPassword.length < 8) {
          setError('La contraseña debe tener al menos 8 caracteres');
          return;
        }
        if (formData.usuarioPassword !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          return;
        }
      }

      const { confirmPassword: _confirmPassword, ...payload } = formData;
      if (!payload.crearUsuario) {
        delete payload.usuarioPassword;
      }

      // Campos planos de Fase 1: '' → null. El backend tiene
      // NullValuePropertyMappingStrategy.IGNORE, así que en update los nulls
      // se ignoran y no pisan valores existentes; en create, null = "sin dato"
      // (los campos son todos NULLABLE en la migración V81).
      const fase1Payload = fase1ToPayload(fase1Data);

      if (editingEmpleado) {
        // Update: mandamos todos los campos del legajo, incluyendo motivo/fecha
        // de baja. Los strings vacíos quedan así para no “pisar accidentalmente”
        // valores existentes: el backend solo aplica los campos != null, así
        // que pasamos undefined cuando no hay nada que cambiar.
        const updatePayload: any = {
          ...payload,
          ...fase1Payload,
          numeroLegajo: legajoData.numeroLegajo || undefined,
          legajoFechaAlta: legajoData.fechaAlta || undefined,
          legajoFechaBaja: legajoData.fechaBaja || null,
          legajoMotivoBaja: legajoData.motivoBaja || null,
          legajoDocumentacion: legajoData.documentacion || null,
          legajoObservaciones: legajoData.observaciones || null,
          legajoActivo: legajoData.activo,
        };
        await employeeApi.update(editingEmpleado.id, updatePayload);
        setSuccess('Empleado actualizado exitosamente');
      } else {
        const createPayload: EmpleadoCreateDTO = {
          ...payload,
          ...fase1Payload,
          numeroLegajo: legajoData.numeroLegajo || undefined,
          legajoFechaAlta: legajoData.fechaAlta || undefined,
          legajoObservaciones: legajoData.observaciones || undefined,
          legajoDocumentacion: legajoData.documentacion || undefined,
        } as EmpleadoCreateDTO;
        await employeeApi.create(createPayload);
        setSuccess(
          createPayload.crearUsuario
            ? `Empleado creado exitosamente. Se creó la cuenta de acceso con usuario emp_${createPayload.dni}`
            : 'Empleado creado exitosamente'
        );
      }

      await loadData();
      handleCloseForm();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el empleado');
      console.error('Error saving empleado:', err);
    }
  };

  const handleDeleteEmpleado = (id: number) => {
    const emp = empleados.find((e) => e.id === id);
    if (emp) setEmpleadoToDelete(emp);
  };

  const handleConfirmDeleteEmpleado = async () => {
    if (!empleadoToDelete) return;
    setDeleteEmpleadoLoading(true);
    try {
      await employeeApi.delete(empleadoToDelete.id);
      setSuccess('Empleado eliminado exitosamente');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
      setEmpleadoToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el empleado');
      console.error('Error deleting empleado:', err);
    } finally {
      setDeleteEmpleadoLoading(false);
    }
  };

  const handleOpenVincularDialog = async (empleado: Empleado) => {
    setVincularEmpleadoTarget(empleado);
    setSelectedUsuario(null);
    setVincularLoading(true);
    setVincularDialogOpen(true);
    try {
      const data = await usuarioAdminApi.getAll(0, 200);
      // Only show users that don't have a linked empleado (or are already this one's)
      setUsuarios(data.content.filter(u => u.empleadoId === null || u.empleadoId === empleado.usuarioId));
    } catch {
      setUsuarios([]);
    } finally {
      setVincularLoading(false);
    }
  };

  const handleConfirmVincular = async () => {
    if (!vincularEmpleadoTarget || !selectedUsuario) return;
    try {
      await employeeApi.vincularUsuario(vincularEmpleadoTarget.id, selectedUsuario.id);
      setSuccess('Usuario vinculado correctamente');
      setVincularDialogOpen(false);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al vincular usuario');
    }
  };

  const handleDesvincularUsuario = (empleado: Empleado) => {
    setDesvincularTarget(empleado);
  };

  const handleConfirmDesvincularUsuario = async () => {
    if (!desvincularTarget) return;
    setDesvincularLoading(true);
    try {
      await employeeApi.desvincularUsuario(desvincularTarget.id);
      setSuccess('Usuario desvinculado correctamente');
      await loadData();
      if (selectedEmpleado?.id === desvincularTarget.id) {
        setSelectedEmpleado({ ...selectedEmpleado, usuarioId: null });
      }
      setTimeout(() => setSuccess(null), 3000);
      setDesvincularTarget(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al desvincular usuario');
    } finally {
      setDesvincularLoading(false);
    }
  };

  const getEstadoColor = (estado: string): 'default' | 'success' | 'error' | 'warning' => {
    switch (estado) {
      case 'ACTIVO': return 'success';
      case 'INACTIVO': return 'error';
      case 'LICENCIA': return 'warning';
      default: return 'default';
    }
  };

  const filteredEmpleados = empleados.filter(emp => {
    const matchesEstado = estadoFilter === 'TODOS' || emp.estado === estadoFilter;
    // Backend devuelve puestoId flat; emp.puesto?.id queda como fallback defensivo.
    const matchesPuesto = puestoFilter === null
      || emp.puestoId === puestoFilter
      || emp.puesto?.id === puestoFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      emp.nombre.toLowerCase().includes(q) ||
      emp.apellido.toLowerCase().includes(q) ||
      emp.dni.includes(searchTerm) ||
      (emp.numeroLegajo ?? '').toLowerCase().includes(q);
    return matchesEstado && matchesPuesto && matchesSearch;
  });

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Cargando empleados..." />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
          <PersonIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
              Empleados
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Gestión de personal y empleados
            </Typography>
          </Box>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            fullWidth={isMobile}
          >
            Nuevo Empleado
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {inactiveWarning && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setInactiveWarning(null)}>
          {inactiveWarning}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Filtros */}
          <Box mb={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Nombre, Apellido, DNI o Nº legajo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Estado"
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="ACTIVO">Activo</MenuItem>
                  <MenuItem value="INACTIVO">Inactivo</MenuItem>
                  <MenuItem value="LICENCIA">Licencia</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Puesto"
                  value={puestoFilter || ''}
                  onChange={(e) => setPuestoFilter(e.target.value ? Number(e.target.value) : null)}
                  size="small"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {puestos.map(puesto => (
                    <MenuItem key={puesto.id} value={puesto.id}>
                      {puesto.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 180 }}>Empleado</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>DNI</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>Legajo</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Puesto</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Email</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Teléfono</TableCell>
                  <TableCell sx={{ minWidth: 90 }}>Estado</TableCell>
                  <TableCell align="center" sx={{ minWidth: 60 }}>Acceso</TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmpleados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay empleados disponibles
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmpleados.map(empleado => (
                    <TableRow key={empleado.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmpleadoFotoAvatar
                            empleadoId={empleado.id}
                            nombre={empleado.nombre}
                            apellido={empleado.apellido}
                            size={36}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              {empleado.nombre} {empleado.apellido}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{empleado.dni}</TableCell>
                      <TableCell>
                        {empleado.numeroLegajo ? (
                          <Chip
                            icon={<BadgeIcon />}
                            label={empleado.numeroLegajo}
                            size="small"
                            variant="outlined"
                            color={empleado.legajoActivo === false ? 'default' : 'primary'}
                          />
                        ) : (
                          <Typography variant="caption" color="textSecondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<WorkIcon />}
                          label={empleado.puesto?.nombre || empleado.puestoNombre || '-'}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{empleado.email || '-'}</TableCell>
                      <TableCell>{empleado.telefono || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={empleado.estado}
                          size="small"
                          color={getEstadoColor(empleado.estado)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {empleado.usuarioId !== null ? (
                          <Tooltip title={`Usuario #${empleado.usuarioId} vinculado`}>
                            <AccountCircleIcon color="success" fontSize="small" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Sin cuenta de acceso">
                            <AccountCircleIcon color="disabled" fontSize="small" />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="Ver Detalle">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDetail(empleado)}
                              color="info"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenForm(empleado)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteEmpleado(empleado.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog de Detalle */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        {selectedEmpleado && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pb: 2 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <EmpleadoFotoAvatar
                  empleadoId={selectedEmpleado.id}
                  nombre={selectedEmpleado.nombre}
                  apellido={selectedEmpleado.apellido}
                  size={56}
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                />
                <Box>
                  <Typography variant="h5" fontWeight="700">
                    {selectedEmpleado.nombre} {selectedEmpleado.apellido}
                  </Typography>
                  <Chip
                    label={selectedEmpleado.estado}
                    size="small"
                    sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
              </Box>
            </DialogTitle>
            <Tabs
              value={detailTabValue}
              onChange={(_, newValue) => setDetailTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Información" />
              <Tab label="Legajo" />
              <Tab label="Acceso al sistema" />
              <Tab label="Documentos" />
              <Tab label="Disciplina" />
              <Tab label="Cargas de Familia" />
              <Tab label="Contactos Emergencia" />
              <Tab label="Idiomas" />
            </Tabs>
            <DialogContent sx={{ pt: 3, minHeight: 400 }}>
              {detailTabValue === 0 && (
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" color="textSecondary" fontWeight="600" display="block" mb={1}>
                      INFORMACIÓN PERSONAL
                    </Typography>
                    <Stack spacing={1.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <BadgeIcon color="action" />
                        <Typography><strong>DNI:</strong> {selectedEmpleado.dni}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <EmailIcon color="action" />
                        <Typography><strong>Email:</strong> {selectedEmpleado.email || '-'}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PhoneIcon color="action" />
                        <Typography><strong>Teléfono:</strong> {selectedEmpleado.telefono || '-'}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <HomeIcon color="action" />
                        <Typography><strong>Dirección:</strong> {selectedEmpleado.direccion || '-'}</Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="caption" color="textSecondary" fontWeight="600" display="block" mb={1}>
                      INFORMACIÓN LABORAL
                    </Typography>
                    <Stack spacing={1.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <WorkIcon color="action" />
                        <Typography><strong>Puesto:</strong> {selectedEmpleado.puesto?.nombre || selectedEmpleado.puestoNombre || '-'}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <BadgeIcon color="action" />
                        <Typography><strong>Categoría salarial:</strong> {selectedEmpleado.categoriaSalarialNombre || '— sin asignar —'}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AttachMoneyIcon color="action" />
                        {(() => {
                          // Salario derivado de la categoría (no del campo legacy).
                          // Si todavía no tiene categoría asignada, fallback al campo viejo
                          // por retro-compatibilidad de empleados antes del cutover.
                          const cat = categoriasSalariales.find(c => c.id === selectedEmpleado.categoriaSalarialId);
                          const sueldoCalc = cat ? Number(cat.sueldoFijo) : Number(selectedEmpleado.salario || 0);
                          const fuente = cat ? `según categoría ${cat.nombre}` : 'sin categoría asignada';
                          return (
                            <Typography>
                              <strong>Salario:</strong> ${sueldoCalc.toLocaleString('es-AR')}
                              <Typography component="span" variant="caption" color="textSecondary" ml={1}>
                                ({fuente})
                              </Typography>
                            </Typography>
                          );
                        })()}
                      </Box>
                      <Typography><strong>Fecha Nacimiento:</strong> {selectedEmpleado.fechaNacimiento || '-'}</Typography>
                      <Typography><strong>Fecha Ingreso:</strong> {selectedEmpleado.fechaIngreso || '-'}</Typography>
                      {selectedEmpleado.sucursalId && (
                        <Typography>
                          <strong>Sucursal:</strong>{' '}
                          {sucursales.find(s => s.id === selectedEmpleado.sucursalId)?.nombre || `#${selectedEmpleado.sucursalId}`}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              )}

              {detailTabValue === 1 && (
                <Stack spacing={2.5}>
                  {!selectedEmpleado.numeroLegajo ? (
                    <Alert severity="info">
                      Este empleado todavía no tiene legajo. Editalo para generar uno.
                    </Alert>
                  ) : (
                    <>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                          <Chip
                            icon={<BadgeIcon />}
                            label={selectedEmpleado.numeroLegajo}
                            color="primary"
                          />
                          {selectedEmpleado.legajoActivo === false ? (
                            <Chip icon={<CancelIcon />} label="Inactivo" color="error" size="small" />
                          ) : (
                            <Chip icon={<CheckCircleIcon />} label="Activo" color="success" size="small" />
                          )}
                          {selectedEmpleado.legajoFechaAlta && (() => {
                            const inicio = new Date(selectedEmpleado.legajoFechaAlta);
                            const fin = selectedEmpleado.legajoFechaBaja
                              ? new Date(selectedEmpleado.legajoFechaBaja)
                              : new Date();
                            const meses = (fin.getFullYear() - inicio.getFullYear()) * 12
                              + (fin.getMonth() - inicio.getMonth());
                            const anios = Math.floor(meses / 12);
                            const mesesRestantes = meses % 12;
                            return (
                              <Chip
                                icon={<CalendarMonthIcon />}
                                label={`Antigüedad: ${anios}a ${mesesRestantes}m`}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            );
                          })()}
                        </Box>
                      </Paper>

                      <Box>
                        <Typography variant="caption" color="textSecondary" fontWeight="600" display="block" mb={1}>
                          FECHAS
                        </Typography>
                        <Stack spacing={1.5}>
                          <Typography><strong>Fecha de Alta:</strong> {selectedEmpleado.legajoFechaAlta || '-'}</Typography>
                          <Typography><strong>Fecha de Baja:</strong> {selectedEmpleado.legajoFechaBaja || '—'}</Typography>
                          {selectedEmpleado.legajoMotivoBaja && (
                            <Typography><strong>Motivo de baja:</strong> {selectedEmpleado.legajoMotivoBaja}</Typography>
                          )}
                        </Stack>
                      </Box>

                      {(selectedEmpleado.legajoDocumentacion || selectedEmpleado.legajoObservaciones) && (
                        <Divider />
                      )}

                      {selectedEmpleado.legajoDocumentacion && (
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" display="block" mb={1}>
                            DOCUMENTACIÓN
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {selectedEmpleado.legajoDocumentacion}
                          </Typography>
                        </Box>
                      )}

                      {selectedEmpleado.legajoObservaciones && (
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" display="block" mb={1}>
                            OBSERVACIONES
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {selectedEmpleado.legajoObservaciones}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Stack>
              )}

              {detailTabValue === 2 && (
                <Stack spacing={2}>
                  {selectedEmpleado.usuarioId !== null ? (
                    <Box>
                      <Alert severity="success" icon={<AccountCircleIcon />} sx={{ mb: 2 }}>
                        Este empleado tiene acceso al sistema
                      </Alert>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Stack spacing={1}>
                          <Typography variant="body2">
                            <strong>Usuario vinculado:</strong> #{selectedEmpleado.usuarioId}
                          </Typography>
                        </Stack>
                      </Paper>
                      <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<LinkOffIcon />}
                          onClick={() => handleDesvincularUsuario(selectedEmpleado)}
                        >
                          Desvincular cuenta
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Este empleado no tiene cuenta de acceso al sistema
                      </Alert>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<LinkIcon />}
                          onClick={() => {
                            setDetailDialogOpen(false);
                            handleOpenVincularDialog(selectedEmpleado);
                          }}
                        >
                          Vincular cuenta existente
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              )}

              {detailTabValue === 4 && (
                <EmpleadoDisciplinaTab empleado={selectedEmpleado} />
              )}

              {detailTabValue === 5 && <CargasFamiliaresTab empleadoId={selectedEmpleado.id} />}
              {detailTabValue === 6 && <ContactosEmergenciaTab empleadoId={selectedEmpleado.id} />}
              {detailTabValue === 7 && <IdiomasEmpleadoTab empleadoId={selectedEmpleado.id} />}

              {detailTabValue === 3 && (
                <DocumentManager
                  entityId={selectedEmpleado.id}
                  categorias={CATEGORIAS_EMPLEADO}
                  categoriasObligatorias={CATEGORIAS_EMPLEADO_OBLIGATORIAS}
                  onUpload={async (file, categoria, descripcion) => {
                    await documentoEmpleadoApi.upload(selectedEmpleado.id, file, categoria, descripcion);
                  }}
                  onDownload={async (id, fileName) => {
                    await documentoEmpleadoApi.downloadAndSave(selectedEmpleado.id, id, fileName);
                  }}
                  onDelete={async (id) => {
                    await documentoEmpleadoApi.delete(selectedEmpleado.id, id);
                  }}
                  onLoad={async (empleadoId) => {
                    const docs = await documentoEmpleadoApi.getByEmpleadoId(empleadoId);
                    return docs.map(doc => ({
                      id: doc.id,
                      nombreArchivo: doc.nombreOriginal,
                      tipoArchivo: doc.mimeType || '',
                      tamanioBytes: doc.sizeBytes,
                      descripcion: doc.descripcion,
                      categoria: doc.categoria,
                      fechaSubida: doc.fechaSubida,
                      subidoPor: doc.subidoPor || ''
                    }));
                  }}
                />
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.50' }}>
              <Button onClick={() => setDetailDialogOpen(false)} variant="outlined">
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleOpenForm(selectedEmpleado);
                }}
                variant="contained"
                startIcon={<EditIcon />}
              >
                Editar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de Formulario */}
      <Dialog
        open={formDialogOpen}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 2.5 }}>
          <Typography variant="h5" fontWeight="600">
            {editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, bgcolor: 'grey.50' }}>
          {/* Banner amarillo: campos legalmente obligatorios faltantes.
              No bloquea el save — sirve a RRHH para ver qué falta completar. */}
          {camposFaltantes.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Legajo incompleto</AlertTitle>
              Faltan <strong>{camposFaltantes.length}</strong> dato(s) requerido(s).
              Podés guardar igual, pero conviene completarlos cuanto antes:
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
                {camposFaltantes.map(c => <li key={c}>{c}</li>)}
              </Box>
            </Alert>
          )}

          <Stack spacing={1.5}>
            {/* ─── 1. Datos Personales (identificación) ─────────────────── */}
            <Accordion defaultExpanded disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon color="primary" />
                  <Typography fontWeight={700}>Datos Personales (identificación)</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {editingEmpleado && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <EmpleadoFotoUploader
                      empleadoId={editingEmpleado.id}
                      nombre={editingEmpleado.nombre}
                      apellido={editingEmpleado.apellido}
                    />
                  </Box>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="CUIL (11 dígitos)" value={fase1Data.cuil}
                      onChange={(e) => setFase1Data({ ...fase1Data, cuil: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                      inputProps={{ inputMode: 'numeric', maxLength: 11 }} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="DNI *" value={formData.dni}
                      onChange={(e) => setFormData({ ...formData, dni: e.target.value })} required />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Fecha de Nacimiento" type="date"
                      value={formData.fechaNacimiento}
                      onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                      InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Apellido 1 *" value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Apellido 2" value={fase1Data.apellido2}
                      onChange={(e) => setFase1Data({ ...fase1Data, apellido2: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Nombre 1 *" value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Nombre 2" value={fase1Data.nombre2}
                      onChange={(e) => setFase1Data({ ...fase1Data, nombre2: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="País de Nacimiento" value={fase1Data.paisNacimiento}
                      onChange={(e) => setFase1Data({ ...fase1Data, paisNacimiento: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Provincia de Nacimiento" value={fase1Data.provinciaNacimiento}
                      onChange={(e) => setFase1Data({ ...fase1Data, provinciaNacimiento: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Ciudad de Nacimiento" value={fase1Data.ciudadNacimiento}
                      onChange={(e) => setFase1Data({ ...fase1Data, ciudadNacimiento: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Nacionalidad 1" value={fase1Data.nacionalidad1}
                      onChange={(e) => setFase1Data({ ...fase1Data, nacionalidad1: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Nacionalidad 2" value={fase1Data.nacionalidad2}
                      onChange={(e) => setFase1Data({ ...fase1Data, nacionalidad2: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Documento Nacionalidad 2" value={fase1Data.docNacionalidad2}
                      onChange={(e) => setFase1Data({ ...fase1Data, docNacionalidad2: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth select label="Género" value={fase1Data.genero}
                      onChange={(e) => setFase1Data({ ...fase1Data, genero: e.target.value as Fase1State['genero'] })}>
                      <MenuItem value="">— Sin asignar —</MenuItem>
                      {GENEROS.map(g => <MenuItem key={g} value={g}>{GENERO_LABEL[g]}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth select label="Estado Civil" value={fase1Data.estadoCivil}
                      onChange={(e) => setFase1Data({ ...fase1Data, estadoCivil: e.target.value as Fase1State['estadoCivil'] })}>
                      <MenuItem value="">— Sin asignar —</MenuItem>
                      {ESTADOS_CIVILES.map(ec => <MenuItem key={ec} value={ec}>{ESTADO_CIVIL_LABEL[ec]}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Estado Civil — Desde" type="date"
                      value={fase1Data.estadoCivilDesde}
                      onChange={(e) => setFase1Data({ ...fase1Data, estadoCivilDesde: e.target.value })}
                      InputLabelProps={{ shrink: true }} disabled={!fase1Data.estadoCivil} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* ─── 2. Contacto y Ubicación ─────────────────────────────── */}
            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ContactMailIcon color="primary" />
                  <Typography fontWeight={700}>Datos de Contacto y Ubicación</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="caption" color="textSecondary" display="block" mb={1.5}>
                  Teléfono particular
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4} sm={2}>
                    <TextField fullWidth label="Cód. País" placeholder="54"
                      value={fase1Data.telCodigoPais}
                      onChange={(e) => setFase1Data({ ...fase1Data, telCodigoPais: e.target.value })} />
                  </Grid>
                  <Grid item xs={4} sm={3}>
                    <TextField fullWidth label="Área (sin 0)" placeholder="11"
                      value={fase1Data.telArea}
                      onChange={(e) => setFase1Data({ ...fase1Data, telArea: e.target.value })} />
                  </Grid>
                  <Grid item xs={4} sm={4}>
                    <TextField fullWidth label="Número (sin 15)" value={fase1Data.telNumero}
                      onChange={(e) => setFase1Data({ ...fase1Data, telNumero: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField fullWidth label="Email de Contacto" type="email"
                      value={fase1Data.emailContacto}
                      onChange={(e) => setFase1Data({ ...fase1Data, emailContacto: e.target.value })} />
                  </Grid>
                </Grid>

                <Typography variant="caption" color="textSecondary" display="block" mt={2} mb={1.5}>
                  Domicilio real
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Calle" value={fase1Data.domCalle}
                      onChange={(e) => setFase1Data({ ...fase1Data, domCalle: e.target.value })} />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField fullWidth label="Altura" value={fase1Data.domAltura}
                      onChange={(e) => setFase1Data({ ...fase1Data, domAltura: e.target.value })} />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField fullWidth label="Piso" value={fase1Data.domPiso}
                      onChange={(e) => setFase1Data({ ...fase1Data, domPiso: e.target.value })} />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField fullWidth label="Depto" value={fase1Data.domDepto}
                      onChange={(e) => setFase1Data({ ...fase1Data, domDepto: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Barrio / Otra info" value={fase1Data.domBarrio}
                      onChange={(e) => setFase1Data({ ...fase1Data, domBarrio: e.target.value })} />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField fullWidth label="CP (CPA)" inputProps={{ maxLength: 8 }}
                      value={fase1Data.domCp}
                      onChange={(e) => setFase1Data({ ...fase1Data, domCp: e.target.value })} />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField fullWidth label="Localidad" value={fase1Data.domLocalidad}
                      onChange={(e) => setFase1Data({ ...fase1Data, domLocalidad: e.target.value })} />
                  </Grid>
                  <Grid item xs={6} sm={6}>
                    <TextField fullWidth label="Provincia" value={fase1Data.domProvincia}
                      onChange={(e) => setFase1Data({ ...fase1Data, domProvincia: e.target.value })} />
                  </Grid>
                  <Grid item xs={6} sm={6}>
                    <TextField fullWidth label="País" value={fase1Data.domPais}
                      onChange={(e) => setFase1Data({ ...fase1Data, domPais: e.target.value })} />
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 2 }}>
                  El contacto de emergencia se carga en el detalle del empleado (Fase 2).
                </Alert>
              </AccordionDetails>
            </Accordion>

            {/* ─── 3. Datos Laborales y Contractuales ───────────────────── */}
            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <WorkIcon color="primary" />
                  <Typography fontWeight={700}>Datos Laborales y Contractuales</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Fecha de Ingreso" type="date"
                      value={formData.fechaIngreso}
                      onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                      InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Fecha de Ingreso Legal (AFIP)" type="date"
                      value={fase1Data.fechaIngresoLegal}
                      onChange={(e) => setFase1Data({ ...fase1Data, fechaIngresoLegal: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      helperText='Alta temprana AFIP — puede diferir de la fecha real de inicio.' />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="Sucursal / Sede"
                      value={formData.sucursalId || ''}
                      onChange={(e) => setFormData({ ...formData, sucursalId: e.target.value ? Number(e.target.value) : undefined })}>
                      <MenuItem value="">— Sin asignar —</MenuItem>
                      {sucursales.map(s => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Locación" value={fase1Data.locacion}
                      onChange={(e) => setFase1Data({ ...fase1Data, locacion: e.target.value })}
                      helperText='Oficinas, Taller, otro' />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Área" value={fase1Data.areaNombre}
                      onChange={(e) => setFase1Data({ ...fase1Data, areaNombre: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Departamento" value={fase1Data.departamentoNombre}
                      onChange={(e) => setFase1Data({ ...fase1Data, departamentoNombre: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Sector" value={fase1Data.sectorNombre}
                      onChange={(e) => setFase1Data({ ...fase1Data, sectorNombre: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="Puesto *" value={formData.puestoId}
                      onChange={(e) => setFormData({ ...formData, puestoId: Number(e.target.value) })} required>
                      <MenuItem value={0}>— Seleccione un puesto —</MenuItem>
                      {puestos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="Supervisor Directo"
                      value={fase1Data.supervisorDirectoId === '' ? '' : fase1Data.supervisorDirectoId}
                      onChange={(e) => setFase1Data({
                        ...fase1Data,
                        supervisorDirectoId: e.target.value === '' ? '' : Number(e.target.value),
                      })}
                      helperText="Jefe inmediato — base para el organigrama">
                      <MenuItem value="">— Sin supervisor —</MenuItem>
                      {empleados
                        .filter(e => !editingEmpleado || e.id !== editingEmpleado.id)
                        .map(e => (
                          <MenuItem key={e.id} value={e.id}>
                            {e.apellido}, {e.nombre} {e.numeroLegajo ? `(${e.numeroLegajo})` : ''}
                          </MenuItem>
                        ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="Tipo de Mano de Obra" value={fase1Data.tipoManoObra}
                      onChange={(e) => setFase1Data({ ...fase1Data, tipoManoObra: e.target.value as Fase1State['tipoManoObra'] })}>
                      <MenuItem value="">— Sin asignar —</MenuItem>
                      {TIPOS_MANO_OBRA.map(t => <MenuItem key={t} value={t}>{TIPO_MANO_OBRA_LABEL[t]}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="Situación de Revista (Estado) *"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })} required>
                      <MenuItem value="ACTIVO">Activo</MenuItem>
                      <MenuItem value="INACTIVO">Baja</MenuItem>
                      <MenuItem value="LICENCIA">Licencia</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="Tipo de Contrato" value={fase1Data.tipoContrato}
                      onChange={(e) => setFase1Data({ ...fase1Data, tipoContrato: e.target.value as Fase1State['tipoContrato'] })}>
                      <MenuItem value="">— Sin asignar —</MenuItem>
                      {TIPOS_CONTRATO.map(t => <MenuItem key={t} value={t}>{TIPO_CONTRATO_LABEL[t]}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="Motivo de Egreso"
                      value={fase1Data.motivoEgreso}
                      onChange={(e) => setFase1Data({ ...fase1Data, motivoEgreso: e.target.value as Fase1State['motivoEgreso'] })}
                      disabled={formData.estado !== 'INACTIVO'}
                      helperText={formData.estado !== 'INACTIVO' ? 'Solo aplica si el estado es Baja' : undefined}>
                      <MenuItem value="">— Sin asignar —</MenuItem>
                      {MOTIVOS_EGRESO.map(m => <MenuItem key={m} value={m}>{MOTIVO_EGRESO_LABEL[m]}</MenuItem>)}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}><Typography variant="caption" color="textSecondary">Contacto laboral</Typography></Divider>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField fullWidth label="Tel. Lab. Área" value={fase1Data.telLaboralArea}
                      onChange={(e) => setFase1Data({ ...fase1Data, telLaboralArea: e.target.value })} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField fullWidth label="Tel. Lab. Número" value={fase1Data.telLaboralNumero}
                      onChange={(e) => setFase1Data({ ...fase1Data, telLaboralNumero: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email Laboral" type="email"
                      value={fase1Data.emailLaboral}
                      onChange={(e) => setFase1Data({ ...fase1Data, emailLaboral: e.target.value })} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* ─── 4. Compensaciones y Datos Bancarios ──────────────────── */}
            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <AccountBalanceIcon color="primary" />
                  <Typography fontWeight={700}>Compensaciones y Datos Bancarios</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="CBU (22 dígitos)" value={fase1Data.cbu}
                      onChange={(e) => setFase1Data({ ...fase1Data, cbu: e.target.value.replace(/\D/g, '').slice(0, 22) })}
                      inputProps={{ inputMode: 'numeric', maxLength: 22 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CatalogoAutocomplete label="Banco" value={fase1Data.bancoNombre}
                      onChange={(v) => setFase1Data({ ...fase1Data, bancoNombre: v })}
                      fetcher={bancosApi.list}
                      helperText="Sugiere desde el catálogo global; podés escribir libre si falta uno" />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth select label="Tipo de Cuenta" value={fase1Data.tipoCuenta}
                      onChange={(e) => setFase1Data({ ...fase1Data, tipoCuenta: e.target.value as Fase1State['tipoCuenta'] })}>
                      <MenuItem value="">— Sin asignar —</MenuItem>
                      {TIPOS_CUENTA.map(t => <MenuItem key={t} value={t}>{TIPO_CUENTA_LABEL[t]}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField fullWidth label="Nº de Cuenta" value={fase1Data.numeroCuenta}
                      onChange={(e) => setFase1Data({ ...fase1Data, numeroCuenta: e.target.value })} />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}><Typography variant="caption" color="textSecondary">Convenio y salario</Typography></Divider>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Convenio Colectivo" value={fase1Data.convenioColectivo}
                      onChange={(e) => setFase1Data({ ...fase1Data, convenioColectivo: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Categoría Laboral (convenio)" value={fase1Data.categoriaLaboral}
                      onChange={(e) => setFase1Data({ ...fase1Data, categoriaLaboral: e.target.value })}
                      helperText="Denominación del convenio — distinta de la categoría salarial interna" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="Categoría Salarial (interna)"
                      value={formData.categoriaSalarialId ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        categoriaSalarialId: e.target.value === '' ? null : Number(e.target.value),
                      })}
                      helperText={
                        categoriasSalariales.length === 0
                          ? 'Sin categorías — configurarlas en RRHH → Config. Sueldos'
                          : 'Default de la calculadora de Sueldos'
                      }>
                      <MenuItem value="">— Sin asignar —</MenuItem>
                      {categoriasSalariales.filter(c => c.activo !== false).map(c => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.nombre} (${Number(c.sueldoFijo).toLocaleString('es-AR')})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {(() => {
                      const cat = categoriasSalariales.find(c => c.id === formData.categoriaSalarialId);
                      const valor = cat ? Number(cat.sueldoFijo) : Number(formData.salario || 0);
                      return (
                        <TextField fullWidth label="Salario básico (derivado)" type="number" value={valor} disabled
                          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                          helperText={cat
                            ? `Tomado de la categoría "${cat.nombre}". Editable en RRHH → Config. Sueldos.`
                            : 'Asigná una categoría salarial para definir el salario.'} />
                      );
                    })()}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="Moneda" value={fase1Data.moneda}
                      onChange={(e) => setFase1Data({ ...fase1Data, moneda: e.target.value as Fase1State['moneda'] })}>
                      <MenuItem value="">— Sin asignar —</MenuItem>
                      {MONEDAS.map(m => <MenuItem key={m} value={m}>{MONEDA_LABEL[m]}</MenuItem>)}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}><Typography variant="caption" color="textSecondary">Sindicato</Typography></Divider>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField fullWidth label="Sindicato" value={fase1Data.sindicato}
                      onChange={(e) => setFase1Data({ ...fase1Data, sindicato: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={<Checkbox checked={fase1Data.afiliadoSindicato}
                        onChange={(e) => setFase1Data({ ...fase1Data, afiliadoSindicato: e.target.checked })} />}
                      label="Afiliado/a al sindicato"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* ─── 5. Salud y Seguridad Social ──────────────────────────── */}
            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <MedicalServicesIcon color="primary" />
                  <Typography fontWeight={700}>Salud y Seguridad Social</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Código Obra Social / Prepaga"
                      value={fase1Data.obraSocialCodigo}
                      onChange={(e) => setFase1Data({ ...fase1Data, obraSocialCodigo: e.target.value })}
                      placeholder="#-####-#" />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <CatalogoAutocomplete label="Detalle Obra Social / Prepaga"
                      value={fase1Data.obraSocialDetalle}
                      onChange={(v) => setFase1Data({ ...fase1Data, obraSocialDetalle: v })}
                      fetcher={obrasSocialesApi.list}
                      helperText="Sugiere desde el catálogo de obras sociales" />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth select label="Grupo Sanguíneo" value={fase1Data.grupoSanguineo}
                      onChange={(e) => setFase1Data({ ...fase1Data, grupoSanguineo: e.target.value as Fase1State['grupoSanguineo'] })}>
                      <MenuItem value="">— Sin asignar —</MenuItem>
                      {GRUPOS_SANGUINEOS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <CatalogoAutocomplete label="ART" value={fase1Data.artNombre}
                      onChange={(v) => setFase1Data({ ...fase1Data, artNombre: v })}
                      fetcher={artsApi.list} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Alergias / Condiciones de salud relevantes (discapacidad)"
                      value={fase1Data.alergiasCondiciones}
                      onChange={(e) => setFase1Data({ ...fase1Data, alergiasCondiciones: e.target.value })}
                      multiline rows={2} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Fecha de Examen Preocupacional" type="date"
                      value={fase1Data.fechaExamenPreocupacional}
                      onChange={(e) => setFase1Data({ ...fase1Data, fechaExamenPreocupacional: e.target.value })}
                      InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Las cargas de familia (cónyuge / hijos / hijos con discapacidad) se cargan en el detalle del empleado (Fase 2).
                </Alert>
              </AccordionDetails>
            </Accordion>

            {/* ─── 6. Formación y Perfil Profesional ────────────────────── */}
            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <SchoolIcon color="primary" />
                  <Typography fontWeight={700}>Formación y Perfil Profesional</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="Nivel de Estudios" value={fase1Data.nivelEstudios}
                      onChange={(e) => setFase1Data({ ...fase1Data, nivelEstudios: e.target.value as Fase1State['nivelEstudios'] })}>
                      <MenuItem value="">— Sin asignar —</MenuItem>
                      {NIVELES_ESTUDIOS.map(n => <MenuItem key={n} value={n}>{NIVEL_ESTUDIOS_LABEL[n]}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Título / Carrera (profesión o especialidad)"
                      value={fase1Data.tituloCarrera}
                      onChange={(e) => setFase1Data({ ...fase1Data, tituloCarrera: e.target.value })} />
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Los idiomas y su nivel de dominio se cargan en el detalle del empleado (Fase 2).
                </Alert>
              </AccordionDetails>
            </Accordion>

            {/* ─── 7. Legajo (administrativo) ───────────────────────────── */}
            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <BadgeIcon color="primary" />
                  <Typography fontWeight={700}>Legajo</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="caption" color="textSecondary" display="block" mb={2}>
                  Si dejás el número vacío, se autogenera (ej. LEG-00012).
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Número de Legajo" value={legajoData.numeroLegajo}
                      onChange={(e) => setLegajoData({ ...legajoData, numeroLegajo: e.target.value })}
                      placeholder={editingEmpleado ? '' : 'Se autogenera'}
                      InputProps={{ startAdornment: (<InputAdornment position="start"><BadgeIcon fontSize="small" /></InputAdornment>) }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Fecha de Alta" type="date" value={legajoData.fechaAlta}
                      onChange={(e) => setLegajoData({ ...legajoData, fechaAlta: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      helperText={editingEmpleado ? undefined : 'Por defecto, igual a la fecha de ingreso'} />
                  </Grid>
                  {editingEmpleado && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Fecha de Baja" type="date" value={legajoData.fechaBaja}
                          onChange={(e) => setLegajoData({ ...legajoData, fechaBaja: e.target.value })}
                          InputLabelProps={{ shrink: true }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={<Checkbox checked={legajoData.activo}
                            onChange={(e) => setLegajoData({ ...legajoData, activo: e.target.checked })} />}
                          label="Legajo activo" />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Motivo de Baja (texto)" value={legajoData.motivoBaja}
                          onChange={(e) => setLegajoData({ ...legajoData, motivoBaja: e.target.value })}
                          multiline rows={2} disabled={!legajoData.fechaBaja && legajoData.activo} />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12}>
                    <TextField fullWidth label="Documentación" value={legajoData.documentacion}
                      onChange={(e) => setLegajoData({ ...legajoData, documentacion: e.target.value })}
                      multiline rows={2} placeholder="Referencias a documentos físicos / archivos / carpetas" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Observaciones" value={legajoData.observaciones}
                      onChange={(e) => setLegajoData({ ...legajoData, observaciones: e.target.value })}
                      multiline rows={3} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* ─── 8. Cuenta de acceso — solo en creación ───────────────── */}
            {!editingEmpleado && (
              <Accordion disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccountCircleIcon color="primary" />
                    <Typography fontWeight={700}>Acceso al Sistema</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <FormControlLabel
                    control={<Checkbox checked={!!formData.crearUsuario}
                      onChange={(e) => setFormData({ ...formData, crearUsuario: e.target.checked })} />}
                    label="Crear cuenta de acceso al sistema" />
                  {formData.crearUsuario && (
                    <Stack spacing={2} mt={2}>
                      <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                        Se creará el usuario <strong>emp_{formData.dni || '{DNI}'}</strong> con roles derivados del puesto seleccionado.
                      </Alert>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label={formData.crearUsuario ? 'Email *' : 'Email'} type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={6} />
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Contraseña *" type="password"
                            value={formData.usuarioPassword}
                            onChange={(e) => setFormData({ ...formData, usuarioPassword: e.target.value })}
                            helperText="Mínimo 8 caracteres" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Confirmar contraseña *" type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            error={!!formData.confirmPassword && formData.confirmPassword !== formData.usuarioPassword}
                            helperText={formData.confirmPassword && formData.confirmPassword !== formData.usuarioPassword
                              ? 'Las contraseñas no coinciden' : ''} />
                        </Grid>
                      </Grid>
                    </Stack>
                  )}
                </AccordionDetails>
              </Accordion>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'grey.100' }}>
          <Button onClick={handleCloseForm} variant="outlined" sx={{ minWidth: 120 }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEmpleado}
            variant="contained"
            // Restricción de campos mínimos sólo en CREACIÓN. En edición permitimos
            // guardar aunque falten datos: estamos migrando empleados y hay legajos
            // con huecos (típicamente `puestoId`) que se completan de a poco. Si en
            // algún momento querés volver al check estricto, sumá `|| !!editingEmpleado`
            // dentro del paréntesis o restablecé la condición original.
            disabled={
              !editingEmpleado &&
              (!formData.nombre || !formData.apellido || !formData.dni || !formData.puestoId)
            }
            sx={{ minWidth: 160 }}
          >
            {editingEmpleado ? 'Guardar Cambios' : 'Crear Empleado'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Vincular usuario existente */}
      <Dialog
        open={vincularDialogOpen}
        onClose={() => setVincularDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Vincular cuenta de acceso</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {vincularLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" color="textSecondary">
                Seleccione el usuario a vincular con <strong>{vincularEmpleadoTarget?.nombre} {vincularEmpleadoTarget?.apellido}</strong>
              </Typography>
              <Autocomplete
                options={usuarios}
                getOptionLabel={(u) => `${u.username} (${u.email})`}
                value={selectedUsuario}
                onChange={(_, val) => setSelectedUsuario(val)}
                renderInput={(params) => (
                  <TextField {...params} label="Usuario" placeholder="Buscar usuario..." />
                )}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVincularDialogOpen(false)} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmVincular}
            variant="contained"
            disabled={!selectedUsuario}
          >
            Vincular
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!empleadoToDelete}
        onClose={() => setEmpleadoToDelete(null)}
        onConfirm={handleConfirmDeleteEmpleado}
        title="¿Eliminar empleado?"
        severity="error"
        warning="Esta acción no se puede deshacer."
        description="Está a punto de eliminar el siguiente empleado:"
        itemDetails={
          empleadoToDelete && (
            <>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {empleadoToDelete.nombre} {empleadoToDelete.apellido}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                DNI: {empleadoToDelete.dni}
                {empleadoToDelete.puesto?.nombre ? ` · ${empleadoToDelete.puesto.nombre}` : ''}
              </Typography>
            </>
          )
        }
        confirmLabel="Eliminar"
        loadingLabel="Eliminando…"
        loading={deleteEmpleadoLoading}
      />

      <ConfirmDialog
        open={!!desvincularTarget}
        onClose={() => setDesvincularTarget(null)}
        onConfirm={handleConfirmDesvincularUsuario}
        title="Desvincular cuenta de acceso"
        severity="warning"
        description="La cuenta de usuario va a dejar de estar asociada al empleado. El empleado y la cuenta siguen existiendo y se pueden volver a vincular más adelante."
        itemDetails={
          desvincularTarget && (
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {desvincularTarget.nombre} {desvincularTarget.apellido}
            </Typography>
          )
        }
        confirmLabel="Desvincular"
        loadingLabel="Desvinculando…"
        loading={desvincularLoading}
      />
    </Box>
  );
};

export default EmpleadosPage;
