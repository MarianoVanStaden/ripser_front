 
import React, { useState, useEffect } from 'react';
 
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
 
  Chip,
 
  Table,
 
  TableBody,
 
  TableCell,
 
  TableContainer,
 
  TableHead,
 
  TableRow,
 
  Paper,
 
  FormControl,
 
  InputLabel,
 
  Select,
 
  MenuItem,
 
  Tooltip,
 
  FormHelperText,
 
  Divider,
 
  useMediaQuery,
 
  useTheme,
 
  Autocomplete,
 
  InputAdornment,
 
} from '@mui/material';
 
import {
 
  Add as AddIcon,
 
  Edit as EditIcon,
 
  Delete as DeleteIcon,
 
  Person as PersonIcon,
 
  Security as SecurityIcon,
 
  Business as BusinessIcon,
 
  Warning as WarningIcon,
 
  CheckCircle as CheckCircleIcon,
 
  Visibility as VisibilityIcon,
 
  VisibilityOff as VisibilityOffIcon,
 
  Link as LinkIcon,
 
  LinkOff as LinkOffIcon,
 
  Badge as BadgeIcon,
 
  VpnKey as VpnKeyIcon,
 
} from '@mui/icons-material';
 
import usuarioAdminApi, { type TipoRol, type ChangePasswordDTO } from '../../api/services/usuarioAdminApi';
 
import { employeeApi } from '../../api/services/employeeApi';
 
import type { Empleado } from '../../types';
 
import { useAuth } from '../../context/AuthContext';
 
import { useTenant } from '../../context/TenantContext';
 
import { empresaService } from '../../services/empresaService';
 
import { sucursalService } from '../../services/sucursalService';
 
import { usuarioEmpresaService } from '../../services/usuarioEmpresaService';
 
import { usuarioEmpresaIntegrationService } from '../../services/usuarioEmpresaIntegrationService';
 
import { getAvailableRolesForUser, getRolEmpresaOption, mapRolEmpresaToSystemRole } from '../../utils/roleMapper';
 
import type { CreateUsuarioWithEmpresaDTO, UsuarioWithEmpresa, RolEmpresaOption } from '../../types/usuario-enhanced.types';
 
import type { Empresa, Sucursal, RolEmpresa } from '../../types';
 
import LoadingOverlay from '../common/LoadingOverlay';
 

 
// Available roles with labels and colors (for table display)
 
const availableRoles = [
 
  { value: 'SUPER_ADMIN' as TipoRol, label: 'Super Administrador', color: '#d32f2f' },
 
  { value: 'ADMIN' as TipoRol, label: 'Administrador', color: '#c62828' },
 
  { value: 'GERENTE_SUCURSAL' as TipoRol, label: 'Gerente de Sucursal', color: '#1976d2' },
 
  { value: 'VENDEDOR' as TipoRol, label: 'Vendedor', color: '#1565c0' },
 
  { value: 'TALLER' as TipoRol, label: 'Técnico de Taller', color: '#5d4037' },
 
  { value: 'OFICINA' as TipoRol, label: 'Personal de Oficina', color: '#0288d1' },
 
  { value: 'USUARIO' as TipoRol, label: 'Usuario', color: '#7b1fa2' },
 
  { value: 'USER' as TipoRol, label: 'Usuario (básico)', color: '#6a1b9a' },
 
];
 

 
// System roles available for explicit assignment in the form
 
const systemRoleOptions: { value: TipoRol; label: string; description: string; color: string }[] = [
 
  { value: 'ADMIN', label: 'Administrador', description: 'Acceso completo a todos los módulos', color: '#c62828' },
 
  { value: 'GERENTE_SUCURSAL', label: 'Gerente de Sucursal', description: 'Gestión completa de una sucursal', color: '#1976d2' },
 
  { value: 'VENDEDOR', label: 'Vendedor', description: 'Acceso a ventas y clientes', color: '#1565c0' },
 
  { value: 'TALLER', label: 'Técnico de Taller', description: 'Acceso a taller, garantías y logística', color: '#5d4037' },
 
  { value: 'OFICINA', label: 'Personal de Oficina', description: 'Acceso a ventas, clientes, proveedores y logística', color: '#0288d1' },
 
  { value: 'USUARIO', label: 'Usuario', description: 'Solo acceso al dashboard', color: '#7b1fa2' },
 
];
 

 
const UsersPage: React.FC = () => {
 
  const theme = useTheme();
 
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
 
  // Context hooks
 
  const { esSuperAdmin } = useAuth();
 
  const { empresaId: currentEmpresaId } = useTenant();
 

 
  // State for users with empresa info
 
  const [users, setUsers] = useState<UsuarioWithEmpresa[]>([]);
 
  const [loading, setLoading] = useState(true);
 
  const [error, setError] = useState<string | null>(null);
 
  const [success, setSuccess] = useState<string | null>(null);
 
  const [dialogOpen, setDialogOpen] = useState(false);
 
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
 
  const [confirmSuperAdminDialogOpen, setConfirmSuperAdminDialogOpen] = useState(false);
 
  const [confirmSaveDialogOpen, setConfirmSaveDialogOpen] = useState(false);
 
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
 
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
 
  const [createdUserInfo, setCreatedUserInfo] = useState<{ username: string; role: string; isEdit: boolean } | null>(null);
 
  const [editingUser, setEditingUser] = useState<UsuarioWithEmpresa | null>(null);
 
  const [userToDelete, setUserToDelete] = useState<UsuarioWithEmpresa | null>(null);
 
  const [viewingUser, setViewingUser] = useState<UsuarioWithEmpresa | null>(null);
 
  const [deleting, setDeleting] = useState(false);
 
  const [saving, setSaving] = useState(false);
 

 
  // Change password
 
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
 
  const [passwordTarget, setPasswordTarget] = useState<UsuarioWithEmpresa | null>(null);
 
  const [passwordForm, setPasswordForm] = useState<ChangePasswordDTO>({ currentPassword: '', newPassword: '' });
 
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
 
  const [showNewPassword, setShowNewPassword] = useState(false);
 
  const [passwordError, setPasswordError] = useState<string | null>(null);
 

 
  // Vincular empleado
 
  const [vincularEmpleadoDialogOpen, setVincularEmpleadoDialogOpen] = useState(false);
 
  const [vincularEmpleadoTarget, setVincularEmpleadoTarget] = useState<UsuarioWithEmpresa | null>(null);
 
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
 
  const [selectedEmpleadoToLink, setSelectedEmpleadoToLink] = useState<Empleado | null>(null);
 
  const [empleadosLoading, setEmpleadosLoading] = useState(false);
 

 
  // Empresa and Sucursal data
 
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
 
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
 
  const [allSucursales, setAllSucursales] = useState<Sucursal[]>([]); // Para el modal de vista
 

 
  // Helper functions to get names
 
  const getEmpresaName = (empresaId: number): string => {
 
    const empresa = empresas.find(e => e.id === empresaId);
 
    return empresa?.nombre || `Empresa ID: ${empresaId}`;
 
  };
 

 
  const getSucursalName = (sucursalId: number): string => {
 
    // Buscar en todas las sucursales cargadas
 
    const sucursal = allSucursales.find(s => s.id === sucursalId) || sucursales.find(s => s.id === sucursalId);
 
    return sucursal?.nombre || `Sucursal ID: ${sucursalId}`;
 
  };
 

 
  // Enhanced form data with empresa assignment
 
  const [formData, setFormData] = useState<CreateUsuarioWithEmpresaDTO>({
 
    username: '',
 
    email: '',
 
    nombre: '',
 
    apellido: '',
 
    password: '',
 
    rolEmpresa: 'USUARIO_SUCURSAL',
 
    systemRole: 'USUARIO',
 
    empresaId: currentEmpresaId || 0,
 
    sucursalId: undefined,
 
    sucursalDefectoId: undefined,
 
    observaciones: '',
 
  });
 

 
  // UI helpers
 
  const [selectedRolOption, setSelectedRolOption] = useState<RolEmpresaOption | null>(null);
 
  const [checkingUsername, setCheckingUsername] = useState(false);
 

 
  // Validation errors
 
  const [validationErrors, setValidationErrors] = useState({
 
    username: '',
 
    email: '',
 
    password: '',
 
    roles: '',
 
  });
 

 
   
 
  useEffect(() => {
 
    loadData();
/* eslint-disable react-hooks/exhaustive-deps */
  }, []);
 

 
  // Debounced username validation
 
   
 
  useEffect(() => {
 
    if (!formData.username || editingUser) return;
 

 
    const timeoutId = setTimeout(async () => {
 
      if (formData.username.length < 3) {
 
        setValidationErrors(v => ({ ...v, username: 'Mínimo 3 caracteres' }));
 
        return;
 
      }
 

 
      setCheckingUsername(true);
 
      try {
 
        // Check if username already exists in the users list
 
        const existingUser = users.find(
 
          u => u.username.toLowerCase() === formData.username.toLowerCase()
 
        );
 

 
        if (existingUser) {
 
          setValidationErrors(v => ({
 
            ...v,
 
            username: '⚠️ Este nombre de usuario ya existe. Por favor elija otro.'
 
          }));
 
        } else {
 
          setValidationErrors(v => ({ ...v, username: '' }));
 
        }
 
      } catch (err) {
 
        console.error('Error checking username:', err);
 
      } finally {
 
        setCheckingUsername(false);
 
      }
 
    }, 500); // Wait 500ms after user stops typing
 

 
    return () => clearTimeout(timeoutId);
 
  }, [formData.username, editingUser, users]);
 

 
  const loadData = async () => {
 
    try {
 
      setLoading(true);
 

 
      // Load empresas for Super Admin or current empresa for ADMIN_EMPRESA
 
      if (esSuperAdmin) {
 
        const empresasData = await empresaService.getActive();
 
        setEmpresas(empresasData);
 

 
        // Load all sucursales for all empresas (for viewing user details)
 
        const allSucursalesPromises = empresasData.map(emp =>
 
          sucursalService.getByEmpresa(emp.id).catch(() => [])
 
        );
 
        const allSucursalesArrays = await Promise.all(allSucursalesPromises);
 
        const flatSucursales = allSucursalesArrays.flat();
 
        setAllSucursales(flatSucursales);
 
      } else if (currentEmpresaId) {
 
        // Load current empresa info
 
        const currentEmpresa = await empresaService.getById(currentEmpresaId);
 
        setEmpresas([currentEmpresa]);
 

 
        // Load sucursales for current empresa
 
        const sucursalesData = await sucursalService.getByEmpresa(currentEmpresaId);
 
        setAllSucursales(sucursalesData);
 
      }
 

 
      // Load users with empresa assignments (filtered by empresaId for ADMIN_EMPRESA)
 
      const filterEmpresaId = esSuperAdmin ? undefined : currentEmpresaId!;
 
      const response = await usuarioEmpresaIntegrationService.getUsuariosWithEmpresas(
 
        filterEmpresaId,
 
        0,
 
        100
 
      );
 

 
      setUsers(response.content);
 
      setError(null);
/* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
 
      setError('Error al cargar los usuarios');
 
      console.error('Error loading users:', err);
 
    } finally {
 
      setLoading(false);
 
    }
 
  };
 

 
  // Load sucursales when empresa changes
 
  const loadSucursales = async (empresaId: number) => {
 
    try {
 
      const data = await sucursalService.getByEmpresa(empresaId);
 
      const activas = data.filter(s => s.estado === 'ACTIVO');
 
      setSucursales(activas);
 
    } catch (err) {
 
      console.error('Error loading sucursales:', err);
 
      setSucursales([]);
 
    }
 
  };
 

 
  const handleAdd = async () => {
 
    setEditingUser(null);
 
    const defaultRolOption = getRolEmpresaOption('USUARIO_SUCURSAL');
 
    setFormData({
 
      username: '',
 
      email: '',
 
      nombre: '',
 
      apellido: '',
 
      password: '',
 
      rolEmpresa: 'USUARIO_SUCURSAL',
 
      systemRole: defaultRolOption?.systemRole || 'USUARIO',
 
      empresaId: currentEmpresaId || (empresas.length > 0 ? empresas[0].id : 0),
 
      sucursalId: undefined,
 
      sucursalDefectoId: undefined,
 
      observaciones: '',
 
    });
 
    setSelectedRolOption(defaultRolOption || null);
 

 
    // Load sucursales for the selected empresa
 
    if (currentEmpresaId) {
 
      await loadSucursales(currentEmpresaId);
 
    } else if (empresas.length > 0) {
 
      await loadSucursales(empresas[0].id);
 
    }
 

 
    setDialogOpen(true);
 
  };
 

 
  const handleEdit = async (user: UsuarioWithEmpresa) => {
 
    setEditingUser(user);
 

 
    // Get the first empresa assignment if available
 
    const firstAssignment = user.usuarioEmpresas && user.usuarioEmpresas.length > 0
 
      ? user.usuarioEmpresas[0]
 
      : null;
 

 
    // Load sucursales for the empresa
 
    if (firstAssignment?.empresaId) {
 
      await loadSucursales(firstAssignment.empresaId);
 
    }
 

 
    setFormData({
 
      username: user.username,
 
      email: user.email,
 
      nombre: user.nombre || '',
 
      apellido: user.apellido || '',
 
      password: '',
 
      rolEmpresa: firstAssignment?.rol || 'USUARIO_SUCURSAL',
 
      systemRole: (user.roles && user.roles.length > 0 ? user.roles[0] : undefined) as TipoRol | undefined,
 
      empresaId: firstAssignment?.empresaId || currentEmpresaId || 0,
 
      sucursalId: firstAssignment?.sucursalId || undefined,
 
      sucursalDefectoId: firstAssignment?.sucursalDefectoId || undefined,
 
      observaciones: firstAssignment?.observaciones || '',
 
    });
 

 
    setSelectedRolOption(getRolEmpresaOption(firstAssignment?.rol || 'USUARIO_SUCURSAL') || null);
 
    setDialogOpen(true);
 
  };
 

 
  // Extracted create user logic
 
  const createUser = async () => {
 
    try {
 
      const rolOption = getRolEmpresaOption(formData.rolEmpresa);
 

 
      console.log('📝 Datos del formulario a enviar:', formData);
 

 
      // Create new user with empresa assignment
 
      const result = await usuarioEmpresaIntegrationService.createUsuarioWithEmpresa(formData);
 

 
      if (result.success) {
 
        // Store info for success dialog
 
        setCreatedUserInfo({
 
          username: formData.username,
 
          role: rolOption?.label || formData.rolEmpresa,
 
          isEdit: false
 
        });
 

 
        setDialogOpen(false);
 
        setConfirmSuperAdminDialogOpen(false);
 
        setConfirmSaveDialogOpen(false);
 
        setSuccessDialogOpen(true);
 
        loadData();
 
      } else {
 
        setError(result.error || 'Error al crear el usuario');
 
      }
/* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
 
      setError(err.response?.data?.message || 'Error al crear el usuario');
 
      console.error('Error creating user:', err);
 
    }
 
  };
 

 
  const handleConfirmSuperAdmin = async () => {
 
    await createUser();
 
  };
 

 
  const handleCancelSuperAdmin = () => {
 
    setConfirmSuperAdminDialogOpen(false);
 
  };
 

 
  const handleSave = async () => {
 
    try {
 
      setError(null);
 
      setSuccess(null);
 

 
      // Basic validation
 
      if (!formData.username || formData.username.length < 3) {
 
        setError('El nombre de usuario debe tener al menos 3 caracteres');
 
        return;
 
      }
 

 
      // Check for duplicate username (only when creating new user)
 
      if (!editingUser) {
 
        const existingUser = users.find(
 
          u => u.username.toLowerCase() === formData.username.toLowerCase()
 
        );
 
        if (existingUser) {
 
          setError(`El nombre de usuario "${formData.username}" ya existe. Por favor elija otro nombre de usuario.`);
 
          return;
 
        }
 
      }
 
      if (!formData.email || !formData.email.includes('@')) {
 
        setError('El email es requerido y debe ser válido');
 
        return;
 
      }
 
      if (!editingUser && (!formData.password || formData.password.length < 8)) {
 
        setError('La contraseña debe tener al menos 8 caracteres');
 
        return;
 
      }
 
      if (!formData.rolEmpresa) {
 
        setError('Debe seleccionar un rol de empresa');
 
        return;
 
      }
 
      if (!formData.empresaId) {
 
        setError('Debe seleccionar una empresa');
 
        return;
 
      }
 

 
      // Check if sucursal is required
 
      const rolOption = getRolEmpresaOption(formData.rolEmpresa);
 
      if (rolOption?.requiresSucursal && !formData.sucursalId) {
 
        setError(`El rol ${rolOption.label} requiere asignación a una sucursal específica`);
 
        return;
 
      }
 

 
      // Permission validation
 
      if (!esSuperAdmin && formData.empresaId !== currentEmpresaId) {
 
        setError('No tiene permisos para crear usuarios en otras empresas');
 
        return;
 
      }
 
      if (formData.rolEmpresa === 'SUPER_ADMIN' && !esSuperAdmin) {
 
        setError('Solo Super Administradores pueden crear otros Super Admins');
 
        return;
 
      }
 

 
      // Show confirmation dialog for SUPER_ADMIN
 
      if (!editingUser && formData.rolEmpresa === 'SUPER_ADMIN') {
 
        setConfirmSuperAdminDialogOpen(true);
 
        return;
 
      }
 

 
      // Show general confirmation dialog
 
      setConfirmSaveDialogOpen(true);
/* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
 
      setError(err.response?.data?.message || 'Error al guardar el usuario');
 
      console.error('Error saving user:', err);
 
    }
 
  };
 

 
  const handleConfirmSave = async () => {
 
    try {
 
      setSaving(true);
 
      const rolOption = getRolEmpresaOption(formData.rolEmpresa);
 

 
      if (editingUser) {
 
        // Update existing user's basic info
 
        const systemRole = formData.systemRole ?? mapRolEmpresaToSystemRole(formData.rolEmpresa);
 
        await usuarioAdminApi.update(editingUser.id, {
 
          email: formData.email,
 
          nombre: formData.nombre || undefined,
 
          apellido: formData.apellido || undefined,
 
          enabled: true,
 
          roles: [systemRole],
 
        });
 

 
        // Update empresa assignment if user has one
 
        const editingUserWithEmpresa = editingUser as UsuarioWithEmpresa;
 
        if (editingUserWithEmpresa.usuarioEmpresas && editingUserWithEmpresa.usuarioEmpresas.length > 0) {
 
          const assignmentId = editingUserWithEmpresa.usuarioEmpresas[0].id;
 
          await usuarioEmpresaService.update(assignmentId, {
 
            rol: formData.rolEmpresa,
 
            sucursalId: formData.sucursalId,
 
            sucursalDefectoId: formData.sucursalDefectoId,
 
            observaciones: formData.observaciones,
 
          });
 
        }
 

 
        // Set success info
 
        setCreatedUserInfo({
 
          username: formData.username,
 
          role: rolOption?.label || formData.rolEmpresa,
 
          isEdit: true
 
        });
 
      } else {
 
        // Create new user
 
        await createUser();
 
        return; // createUser handles success dialog
 
      }
 

 
      setConfirmSaveDialogOpen(false);
 
      setDialogOpen(false);
 
      setSuccessDialogOpen(true);
 
      loadData();
/* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
 
      setError(err.response?.data?.message || 'Error al guardar el usuario');
 
      console.error('Error saving user:', err);
 
    } finally {
 
      setSaving(false);
 
    }
 
  };
 

 
  const handleCancelSave = () => {
 
    setConfirmSaveDialogOpen(false);
 
  };
 

 
  const handleDeleteClick = (userId: number) => {
 
    const user = users.find(u => u.id === userId);
 
    if (!user) return;
 

 
    setUserToDelete(user);
 
    setDeleteDialogOpen(true);
 
  };
 

 
  const handleConfirmDelete = async () => {
 
    if (!userToDelete) return;
 

 
    try {
 
      setDeleting(true);
 
      setError(null);
 
      setSuccess(null);
 
      await usuarioAdminApi.delete(userToDelete.id);
 
      setSuccess(`Usuario "${userToDelete.username}" eliminado correctamente`);
 
      setDeleteDialogOpen(false);
 
      setUserToDelete(null);
 
      loadData();
/* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
 
      setError(err.response?.data?.message || 'Error al eliminar el usuario');
 
      console.error('Error deleting user:', err);
 
    } finally {
 
      setDeleting(false);
 
    }
 
  };
 

 
  const handleCancelDelete = () => {
 
    setDeleteDialogOpen(false);
 
    setUserToDelete(null);
 
  };
 

 
  const handleView = (user: UsuarioWithEmpresa) => {
 
    setViewingUser(user);
 
    setViewDialogOpen(true);
 
  };
 

 
  const handleOpenVincularEmpleado = async (user: UsuarioWithEmpresa) => {
 
    setVincularEmpleadoTarget(user);
 
    setSelectedEmpleadoToLink(null);
 
    setEmpleadosLoading(true);
 
    setVincularEmpleadoDialogOpen(true);
 
    try {
 
      const lista = await employeeApi.getAllList();
 
      // Only show employees without a linked user (or already linked to this one)
 
      setEmpleados(lista.filter(e => e.usuarioId === null || e.usuarioId === user.empleadoId));
 
    } catch {
 
      setEmpleados([]);
 
    } finally {
 
      setEmpleadosLoading(false);
 
    }
 
  };
 

 
  const handleConfirmVincularEmpleado = async () => {
 
    if (!vincularEmpleadoTarget || !selectedEmpleadoToLink) return;
 
    try {
 
      await usuarioAdminApi.vincularEmpleado(vincularEmpleadoTarget.id, selectedEmpleadoToLink.id);
 
      setSuccess('Empleado vinculado correctamente');
 
      setVincularEmpleadoDialogOpen(false);
 
      // Refresh viewing user
 
      const updated = await usuarioAdminApi.getById(vincularEmpleadoTarget.id);
 
      if (viewingUser?.id === vincularEmpleadoTarget.id) {
 
        setViewingUser({ ...viewingUser, empleadoId: updated.empleadoId } as UsuarioWithEmpresa);
 
      }
 
      loadData();
 
      setTimeout(() => setSuccess(null), 3000);
/* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
 
      setError(err.response?.data?.message || 'Error al vincular empleado');
 
    }
 
  };
 

 
  const openPasswordDialog = (user: UsuarioWithEmpresa) => {
 
    setPasswordTarget(user);
 
    setPasswordForm({ currentPassword: '', newPassword: '' });
 
    setShowCurrentPassword(false);
 
    setShowNewPassword(false);
 
    setPasswordError(null);
 
    setPasswordDialogOpen(true);
 
  };
 

 
  const handleChangePassword = async () => {
 
    if (!passwordTarget) return;
 
    try {
 
      setPasswordError(null);
 
      if (!passwordForm.currentPassword || !passwordForm.newPassword) {
 
        setPasswordError('Debe completar ambos campos');
 
        return;
 
      }
 
      if (passwordForm.newPassword.length < 8) {
 
        setPasswordError('La nueva contraseña debe tener al menos 8 caracteres');
 
        return;
 
      }
 
      await usuarioAdminApi.changePassword(passwordTarget.id, passwordForm);
 
      setSuccess('Contraseña cambiada correctamente');
 
      setPasswordDialogOpen(false);
 
      setPasswordTarget(null);
/* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
 
      setPasswordError(err.response?.data?.message || 'Error al cambiar la contraseña');
 
    }
 
  };
 

 
  const handleDesvincularEmpleado = async (user: UsuarioWithEmpresa) => {
 
    if (!window.confirm('¿Desvincular el empleado de este usuario?')) return;
 
    try {
 
      await usuarioAdminApi.desvincularEmpleado(user.id);
 
      setSuccess('Empleado desvinculado correctamente');
 
      if (viewingUser?.id === user.id) {
 
        setViewingUser({ ...viewingUser, empleadoId: null } as UsuarioWithEmpresa);
 
      }
 
      loadData();
 
      setTimeout(() => setSuccess(null), 3000);
/* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
 
      setError(err.response?.data?.message || 'Error al desvincular empleado');
 
    }
 
  };
 

 
  // Get role label and color
 
  const getRoleInfo = (role: TipoRol) => {
 
    return availableRoles.find(r => r.value === role) || { label: role, color: '#757575' };
 
  };
 

 
  return (
 
    <Box p={{ xs: 2, sm: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <LoadingOverlay open={loading} message="Cargando usuarios..." />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Typography variant="h4" display="flex" alignItems="center" gap={1} sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <PersonIcon sx={{ fontSize: { xs: 24, sm: 35 } }} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          Gestión de Usuarios
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Button
 
          variant="contained"
 
          startIcon={<AddIcon />}
 
          onClick={handleAdd}
 
          fullWidth={isMobile}
 
        >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          Agregar Usuario
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {error && (
 
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {error}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Alert>
 
      )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {success && (
 
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {success}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Alert>
 
      )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Typography variant="h6" gutterBottom>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Usuarios Registrados ({users.length})
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <TableHead>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <TableRow>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell sx={{ minWidth: 120 }}>Usuario</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell sx={{ minWidth: 180 }}>Email</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell sx={{ minWidth: 150 }}>Roles del Sistema</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell sx={{ minWidth: 150 }}>Roles en Empresas</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell align="center" sx={{ minWidth: 90 }}>Estado</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell sx={{ minWidth: 140 }}>Último Acceso</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell align="center" sx={{ minWidth: 110 }}>Acciones</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </TableRow>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </TableHead>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <TableBody>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {users.length === 0 ? (
 
                  <TableRow>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <TableCell colSpan={7} align="center">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <Box py={4}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Typography variant="body1" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          No hay usuarios registrados
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </TableRow>
 
                ) : (
 
                  users.map((user) => (
 
                    <TableRow key={user.id}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Typography variant="body2" fontWeight="bold">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          {user.username}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell>{user.email}</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Box display="flex" gap={0.5} flexWrap="wrap">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          {user.roles.map((role) => {
 
                            const roleInfo = getRoleInfo(role);
 
                            return (
 
                              <Chip
 
                                key={role}
 
                                label={roleInfo.label}
 
                                size="small"
 
                                sx={{
 
                                  bgcolor: roleInfo.color,
 
                                  color: 'white',
 
                                  fontWeight: 600,
 
                                }}
 
                              />
 
                            );
 
                          })}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Box display="flex" gap={0.5} flexWrap="wrap">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          {user.usuarioEmpresas && user.usuarioEmpresas.length > 0 ? (
 
                            user.usuarioEmpresas.map((ue) => {
 
                              const rolOption = getRolEmpresaOption(ue.rol);
 
                              return (
 
                                <Tooltip
 
                                  key={ue.id}
 
                                  title={`Empresa ID: ${ue.empresaId}${ue.sucursalId ? ` - Sucursal ID: ${ue.sucursalId}` : ''}`}
 
                                >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                  <Chip
 
                                    label={rolOption?.label || ue.rol}
 
                                    size="small"
 
                                    sx={{
 
                                      bgcolor: rolOption?.color || '#757575',
 
                                      color: 'white',
 
                                      fontWeight: 600,
 
                                    }}
 
                                  />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                </Tooltip>
 
                              );
 
                            })
 
                          ) : (
 
                            <Typography variant="caption" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              Sin asignación
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            </Typography>
 
                          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell align="center">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Chip
 
                          label={user.enabled ? 'Activo' : 'Inactivo'}
 
                          color={user.enabled ? 'success' : 'error'}
 
                          size="small"
 
                        />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Nunca'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell align="center">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Tooltip title="Ver detalles">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <IconButton onClick={() => handleView(user)} size="small" color="info">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <VisibilityIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </IconButton>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Tooltip>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Tooltip title="Editar">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <IconButton onClick={() => handleEdit(user)} size="small" color="primary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <EditIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </IconButton>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Tooltip>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Tooltip title="Cambiar Contraseña">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <IconButton onClick={() => openPasswordDialog(user)} size="small" color="warning">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <VpnKeyIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </IconButton>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Tooltip>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Tooltip title="Eliminar">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <IconButton onClick={() => handleDeleteClick(user.id)} size="small" color="error">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <DeleteIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </IconButton>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Tooltip>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </TableRow>
 
                  ))
 
                )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </TableBody>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Table>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </TableContainer>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* User Dialog */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Box display="flex" alignItems="center" gap={1}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <SecurityIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <TextField
 
              label="Nombre de Usuario *"
 
              value={formData.username}
 
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
 
              fullWidth
 
              required
 
              disabled={!!editingUser}
 
              error={!editingUser && !!validationErrors.username}
 
              helperText={
 
                editingUser
 
                  ? 'El username no se puede cambiar'
 
                  : validationErrors.username
 
                  ? validationErrors.username
 
                  : checkingUsername
 
                  ? 'Verificando disponibilidad...'
 
                  : 'Mínimo 3 caracteres'
 
              }
 
            />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <TextField
 
              label="Email *"
 
              type="email"
 
              value={formData.email}
 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 
              fullWidth
 
              required
 
            />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Box display="flex" gap={2}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <TextField
 
                label="Nombre"
 
                value={formData.nombre}
 
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
 
                fullWidth
 
              />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <TextField
 
                label="Apellido"
 
                value={formData.apellido}
 
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
 
                fullWidth
 
              />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <TextField
 
              label={editingUser ? "Nueva Contraseña (opcional)" : "Contraseña *"}
 
              type="password"
 
              value={formData.password}
 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
 
              fullWidth
 
              required={!editingUser}
 
              helperText={editingUser ? "Dejar en blanco para mantener la contraseña actual" : "Mínimo 8 caracteres"}
 
            />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {/* Show empresa assignment fields for both create and edit */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {(
 
              <>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Divider sx={{ my: 2 }} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <BusinessIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Asignación de Empresa y Rol
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {/* Empresa Selection (only for Super Admin when creating) */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {esSuperAdmin && !editingUser && (
 
                  <FormControl fullWidth>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <InputLabel>Empresa *</InputLabel>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Select
 
                      value={formData.empresaId}
 
                      onChange={async (e) => {
 
                        const empresaId = e.target.value as number;
 
                        setFormData({ ...formData, empresaId, sucursalId: undefined, sucursalDefectoId: undefined });
 
                        await loadSucursales(empresaId);
 
                      }}
 
                      label="Empresa *"
 
                    >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {empresas.map(empresa => (
 
                        <MenuItem key={empresa.id} value={empresa.id}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          {empresa.nombre}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </MenuItem>
 
                      ))}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Select>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </FormControl>
 
                )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {/* Show empresa info when editing */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {editingUser && (
 
                  <Alert severity="info">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    La empresa asignada no se puede cambiar desde aquí. Solo puede modificar el rol y sucursal.
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Alert>
 
                )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {/* If ADMIN_EMPRESA, show info */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {!esSuperAdmin && (
 
                  <Alert severity="info">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    El usuario será asignado a su empresa actual
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Alert>
 
                )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {/* Role Selection */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <FormControl fullWidth>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <InputLabel>Rol en Empresa *</InputLabel>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Select
 
                    value={formData.rolEmpresa}
 
                    onChange={(e) => {
 
                      const rol = e.target.value as RolEmpresa;
 
                      const option = getRolEmpresaOption(rol);
 
                      setFormData({
 
                        ...formData,
 
                        rolEmpresa: rol,
 
                        systemRole: option?.systemRole,
 
                        sucursalId: undefined,
 
                      });
 
                      setSelectedRolOption(option || null);
 
                    }}
 
                    label="Rol en Empresa *"
 
                  >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {getAvailableRolesForUser(esSuperAdmin).map(role => (
 
                      <MenuItem key={role.value} value={role.value}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Box display="flex" flexDirection="column" width="100%">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <Typography variant="body1">{role.label}</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <Typography variant="caption" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            {role.description}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </MenuItem>
 
                    ))}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Select>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  {selectedRolOption && (
 
                    <Box mt={1}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <Chip
 
                        label={selectedRolOption.label}
 
                        sx={{ bgcolor: selectedRolOption.color, color: 'white' }}
 
                        size="small"
 
                      />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Box>
 
                  )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </FormControl>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {/* System Role Selection */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <FormControl fullWidth>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <InputLabel>Rol del Sistema *</InputLabel>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Select
 
                    value={formData.systemRole || ''}
 
                    onChange={(e) => {
 
                      setFormData({ ...formData, systemRole: e.target.value as TipoRol });
 
                    }}
 
                    label="Rol del Sistema *"
 
                  >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {[
 
                      ...(esSuperAdmin ? [{ value: 'SUPER_ADMIN' as TipoRol, label: 'Super Administrador', description: 'Acceso completo al sistema', color: '#d32f2f' }] : []),
 
                      ...systemRoleOptions,
 
                    ].map(role => (
 
                      <MenuItem key={role.value} value={role.value}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Box display="flex" alignItems="center" gap={1} width="100%">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <Chip
 
                            label={role.label}
 
                            size="small"
 
                            sx={{ bgcolor: role.color, color: 'white', fontWeight: 600, minWidth: 130 }}
 
                          />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <Typography variant="caption" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            {role.description}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </MenuItem>
 
                    ))}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Select>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <FormHelperText>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    Define los permisos de acceso a módulos. Por defecto se deriva del Rol en Empresa.
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </FormHelperText>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </FormControl>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {/* Sucursal Selection (conditional based on role) */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {selectedRolOption?.requiresSucursal && (
 
                  <FormControl fullWidth>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <InputLabel>Sucursal Asignada *</InputLabel>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Select
 
                      value={formData.sucursalId || ''}
 
                      onChange={(e) => {
 
                        const sucursalId = e.target.value as number;
 
                        // Cuando se asigna una sucursal, también establecerla como defecto
 
                        setFormData({
 
                          ...formData,
 
                          sucursalId,
 
                          sucursalDefectoId: sucursalId
 
                        });
 
                      }}
 
                      label="Sucursal Asignada *"
 
                    >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {sucursales.map(sucursal => (
 
                        <MenuItem key={sucursal.id} value={sucursal.id}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          {sucursal.nombre} {sucursal.esPrincipal && '(Principal)'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </MenuItem>
 
                      ))}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Select>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <FormHelperText>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Esta sucursal será asignada y configurada como predeterminada
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </FormHelperText>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </FormControl>
 
                )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {/* Default Sucursal (optional, for roles that can switch) */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {!selectedRolOption?.requiresSucursal && sucursales.length > 0 && (
 
                  <FormControl fullWidth>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <InputLabel>Sucursal por Defecto</InputLabel>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Select
 
                      value={formData.sucursalDefectoId || ''}
 
                      onChange={(e) => setFormData({ ...formData, sucursalDefectoId: (e.target.value as number) || undefined })}
 
                      label="Sucursal por Defecto"
 
                    >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <MenuItem value="">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <em>Sin sucursal por defecto</em>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {sucursales.map(sucursal => (
 
                        <MenuItem key={sucursal.id} value={sucursal.id}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          {sucursal.nombre} {sucursal.esPrincipal && '(Principal)'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </MenuItem>
 
                      ))}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Select>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <FormHelperText>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Sucursal que se seleccionará automáticamente al iniciar sesión
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </FormHelperText>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </FormControl>
 
                )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {/* Observations */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <TextField
 
                  label="Observaciones"
 
                  value={formData.observaciones || ''}
 
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
 
                  fullWidth
 
                  multiline
 
                  rows={2}
 
                  placeholder="Notas adicionales sobre el usuario..."
 
                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </>
 
            )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button onClick={handleSave} variant="contained">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {editingUser ? 'Actualizar' : 'Crear Usuario'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Dialog>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* General Save Confirmation Dialog */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Dialog
 
        open={confirmSaveDialogOpen}
 
        onClose={handleCancelSave}
 
        maxWidth="sm"
 
        fullWidth
 
        fullScreen={isMobile}
 
      >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <CheckCircleIcon color="primary" />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {editingUser ? '¿Actualizar Usuario?' : '¿Crear Usuario?'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Alert severity="info" sx={{ mb: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Por favor, revise los datos antes de continuar.
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Alert>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body1" paragraph>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {editingUser ? 'Está a punto de actualizar el usuario:' : 'Está a punto de crear el usuario:'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" sx={{ mb: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <strong>Usuario:</strong> {formData.username}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" sx={{ mb: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <strong>Email:</strong> {formData.email}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {(formData.nombre || formData.apellido) && (
 
                <Typography variant="body2" sx={{ mb: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <strong>Nombre:</strong> {formData.nombre} {formData.apellido}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
 
              )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" sx={{ mb: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <strong>Empresa:</strong> {getEmpresaName(formData.empresaId)}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" sx={{ mb: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <strong>Rol:</strong>{' '}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Chip
 
                  label={getRolEmpresaOption(formData.rolEmpresa)?.label || formData.rolEmpresa}
 
                  size="small"
 
                  sx={{
 
                    bgcolor: getRolEmpresaOption(formData.rolEmpresa)?.color || '#757575',
 
                    color: 'white',
 
                    fontWeight: 600,
 
                  }}
 
                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {formData.sucursalId && (
 
                <Typography variant="body2" sx={{ mb: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <strong>Sucursal:</strong> {getSucursalName(formData.sucursalId)}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
 
              )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {formData.sucursalDefectoId && formData.sucursalDefectoId !== formData.sucursalId && (
 
                <Typography variant="body2">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <strong>Sucursal por Defecto:</strong> {getSucursalName(formData.sucursalDefectoId)}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
 
              )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              ¿Confirma que los datos son correctos?
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button onClick={handleCancelSave} color="inherit" disabled={saving}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Cancelar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button
 
            onClick={handleConfirmSave}
 
            variant="contained"
 
            color="primary"
 
            disabled={saving}
 
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
 
          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {saving ? (editingUser ? 'Actualizando...' : 'Creando...') : (editingUser ? 'Sí, Actualizar' : 'Sí, Crear Usuario')}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Dialog>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* Super Admin Confirmation Dialog */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Dialog
 
        open={confirmSuperAdminDialogOpen}
 
        onClose={handleCancelSuperAdmin}
 
        maxWidth="sm"
 
        fullWidth
 
        fullScreen={isMobile}
 
      >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <SecurityIcon color="error" />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          ¿Crear Super Administrador?
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Alert severity="warning" sx={{ mb: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <strong>¡Advertencia!</strong> Está a punto de crear un Super Administrador.
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Alert>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Typography variant="body1" paragraph>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            El usuario <strong>{formData.username}</strong> tendrá:
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Box component="ul" sx={{ pl: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <li>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2">Acceso completo a <strong>todas las empresas</strong> del sistema</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </li>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <li>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2">Permisos para crear, modificar y eliminar cualquier dato</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </li>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <li>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2">Capacidad de crear otros Super Administradores</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </li>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <li>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2">Control total sobre usuarios y configuraciones</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </li>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            ¿Está seguro de que desea continuar?
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button onClick={handleCancelSuperAdmin} color="inherit">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Cancelar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button onClick={handleConfirmSuperAdmin} variant="contained" color="error" autoFocus>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Sí, Crear Super Administrador
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Dialog>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* Delete Confirmation Dialog */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Dialog
 
        open={deleteDialogOpen}
 
        onClose={handleCancelDelete}
 
        maxWidth="sm"
 
        fullWidth
 
        fullScreen={isMobile}
 
      >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <WarningIcon color="error" />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          ¿Eliminar Usuario?
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Alert severity="error" sx={{ mb: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <strong>¡Atención!</strong> Esta acción no se puede deshacer.
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Alert>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {userToDelete && (
 
            <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1" paragraph>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Está a punto de eliminar el usuario:
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  {userToDelete.username}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  {userToDelete.email}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {/* Show empresa roles if any */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {userToDelete.usuarioEmpresas && userToDelete.usuarioEmpresas.length > 0 && (
 
                <Alert severity="warning" sx={{ mb: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    Este usuario tiene asignaciones a empresas:
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {userToDelete.usuarioEmpresas.map((ue) => {
 
                      const rolOption = getRolEmpresaOption(ue.rol);
 
                      return (
 
                        <Chip
 
                          key={ue.id}
 
                          label={rolOption?.label || ue.rol}
 
                          size="small"
 
                          sx={{
 
                            bgcolor: rolOption?.color || '#757575',
 
                            color: 'white',
 
                            fontWeight: 600,
 
                          }}
 
                        />
 
                      );
 
                    })}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    Todas estas asignaciones también serán eliminadas.
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Alert>
 
              )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                ¿Está seguro de que desea continuar?
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Box>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button onClick={handleCancelDelete} color="inherit" disabled={deleting}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Cancelar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button
 
            onClick={handleConfirmDelete}
 
            variant="contained"
 
            color="error"
 
            disabled={deleting}
 
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
 
          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {deleting ? 'Eliminando...' : 'Sí, Eliminar Usuario'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Dialog>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* Success Dialog */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Dialog
 
        open={successDialogOpen}
 
        onClose={() => setSuccessDialogOpen(false)}
 
        maxWidth="sm"
 
        fullWidth
 
        fullScreen={isMobile}
 
      >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#388e3c' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <PersonIcon color="success" />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {createdUserInfo?.isEdit ? '¡Usuario Actualizado Exitosamente!' : '¡Usuario Creado Exitosamente!'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Alert severity="success" sx={{ mb: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {createdUserInfo?.isEdit
 
              ? 'Los cambios han sido guardados correctamente.'
 
              : 'El usuario ha sido creado y asignado correctamente.'
 
            }
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Alert>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {createdUserInfo && (
 
            <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1" paragraph>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <strong>Nombre de usuario:</strong> {createdUserInfo.username}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1" paragraph>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <strong>Rol asignado:</strong>{' '}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Chip
 
                  label={createdUserInfo.role}
 
                  size="small"
 
                  sx={{
 
                    bgcolor: getRolEmpresaOption(formData.rolEmpresa)?.color || '#757575',
 
                    color: 'white',
 
                    fontWeight: 600,
 
                  }}
 
                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {!createdUserInfo.isEdit && (
 
                <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  El usuario puede iniciar sesión inmediatamente con las credenciales proporcionadas.
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
 
              )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {createdUserInfo.isEdit && (
 
                <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Los cambios están disponibles de inmediato.
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
 
              )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Box>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button onClick={() => setSuccessDialogOpen(false)} variant="contained" color="success">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Entendido
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Dialog>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* View User Dialog (Read-only) */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Dialog
 
        open={viewDialogOpen}
 
        onClose={() => setViewDialogOpen(false)}
 
        maxWidth="md"
 
        fullWidth
 
        fullScreen={isMobile}
 
      >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#1976d2', color: 'white' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <VisibilityIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          Detalles del Usuario
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogContent sx={{ mt: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {viewingUser && (
 
            <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {/* Basic Information */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Box sx={{ mb: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#1976d2' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <PersonIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Información Básica
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Divider sx={{ mb: 2 }} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Nombre de Usuario
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {viewingUser.username}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Email
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {viewingUser.email}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Nombre Completo
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {viewingUser.nombre || viewingUser.apellido
 
                        ? `${viewingUser.nombre || ''} ${viewingUser.apellido || ''}`.trim()
 
                        : 'No especificado'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Estado
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Box sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <Chip
 
                        label={viewingUser.enabled ? 'Activo' : 'Inactivo'}
 
                        color={viewingUser.enabled ? 'success' : 'error'}
 
                        size="small"
 
                      />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Fecha de Creación
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString() : 'No disponible'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Último Acceso
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {viewingUser.lastLoginAt ? new Date(viewingUser.lastLoginAt).toLocaleString() : 'Nunca'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {/* System Roles */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Box sx={{ mb: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#1976d2' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <SecurityIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Roles del Sistema
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Divider sx={{ mb: 2 }} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  {viewingUser.roles && viewingUser.roles.length > 0 ? (
 
                    viewingUser.roles.map((role) => {
 
                      const roleInfo = getRoleInfo(role);
 
                      return (
 
                        <Chip
 
                          key={role}
 
                          label={roleInfo.label}
 
                          sx={{
 
                            bgcolor: roleInfo.color,
 
                            color: 'white',
 
                            fontWeight: 600,
 
                          }}
 
                        />
 
                      );
 
                    })
 
                  ) : (
 
                    <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Sin roles asignados
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
 
                  )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {/* Empresa Assignments */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Box sx={{ mb: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#1976d2' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <BusinessIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Asignaciones a Empresas
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Divider sx={{ mb: 2 }} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {viewingUser.usuarioEmpresas && viewingUser.usuarioEmpresas.length > 0 ? (
 
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {viewingUser.usuarioEmpresas.map((ue) => {
 
                      const rolOption = getRolEmpresaOption(ue.rol);
 
                      return (
 
                        <Box
 
                          key={ue.id}
 
                          sx={{
 
                            p: 2,
 
                            bgcolor: '#f5f5f5',
 
                            borderRadius: 1,
 
                            border: '1px solid #e0e0e0',
 
                          }}
 
                        >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                Rol en Empresa
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Box sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                <Chip
 
                                  label={rolOption?.label || ue.rol}
 
                                  size="small"
 
                                  sx={{
 
                                    bgcolor: rolOption?.color || '#757575',
 
                                    color: 'white',
 
                                    fontWeight: 600,
 
                                  }}
 
                                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                Estado
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Box sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                <Chip
 
                                  label={ue.esActivo ? 'Activo' : 'Inactivo'}
 
                                  color={ue.esActivo ? 'success' : 'error'}
 
                                  size="small"
 
                                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                Empresa
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                {getEmpresaName(ue.empresaId)}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                Sucursal Asignada
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                {ue.sucursalId ? getSucursalName(ue.sucursalId) : 'No asignada'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                Sucursal por Defecto
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                {ue.sucursalDefectoId ? getSucursalName(ue.sucursalDefectoId) : 'No configurada'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                Fecha de Asignación
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                {ue.fechaAsignacion ? new Date(ue.fechaAsignacion).toLocaleDateString() : 'No disponible'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            {ue.observaciones && (
 
                              <Box sx={{ gridColumn: '1 / -1' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                  Observaciones
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                  {ue.observaciones}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                                </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              </Box>
 
                            )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Box>
 
                      );
 
                    })}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Box>
 
                ) : (
 
                  <Alert severity="info">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    Este usuario no tiene asignaciones a empresas.
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Alert>
 
                )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {/* Empleado vinculado */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Box sx={{ mb: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#1976d2' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <BadgeIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Empleado Vinculado
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Divider sx={{ mb: 2 }} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {viewingUser.empleadoId !== null ? (
 
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Alert severity="success" icon={<BadgeIcon />} sx={{ flex: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Empleado vinculado: <strong>#{viewingUser.empleadoId}</strong>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Alert>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Button
 
                      variant="outlined"
 
                      color="error"
 
                      size="small"
 
                      startIcon={<LinkOffIcon />}
 
                      onClick={() => handleDesvincularEmpleado(viewingUser)}
 
                    >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Desvincular
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Box>
 
                ) : (
 
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Alert severity="info" sx={{ flex: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Este usuario no tiene un empleado vinculado
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Alert>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Button
 
                      variant="outlined"
 
                      color="primary"
 
                      size="small"
 
                      startIcon={<LinkIcon />}
 
                      onClick={() => handleOpenVincularEmpleado(viewingUser)}
 
                    >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Vincular empleado
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Box>
 
                )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {/* Additional Info */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {(viewingUser.updatedAt) && (
 
                <Box sx={{ mb: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    Última Actualización
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {new Date(viewingUser.updatedAt).toLocaleString()}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Box>
 
              )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Box>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogActions sx={{ px: 3, py: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button onClick={() => setViewDialogOpen(false)} variant="contained" color="primary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Cerrar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Dialog>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* Change Password Dialog */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogTitle>Cambiar Contraseña: {passwordTarget?.username}</DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {passwordError && (
 
              <Alert severity="error" onClose={() => setPasswordError(null)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {passwordError}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Alert>
 
            )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <TextField
 
              fullWidth
 
              label="Contraseña Actual *"
 
              type={showCurrentPassword ? 'text' : 'password'}
 
              value={passwordForm.currentPassword}
 
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
 
              InputProps={{
 
                endAdornment: (
 
                  <InputAdornment position="end">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </IconButton>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </InputAdornment>
 
                ),
 
              }}
 
            />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <TextField
 
              fullWidth
 
              label="Nueva Contraseña *"
 
              type={showNewPassword ? 'text' : 'password'}
 
              value={passwordForm.newPassword}
 
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
 
              helperText="Mínimo 8 caracteres"
 
              InputProps={{
 
                endAdornment: (
 
                  <InputAdornment position="end">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </IconButton>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </InputAdornment>
 
                ),
 
              }}
 
            />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button variant="contained" color="warning" onClick={handleChangePassword}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Cambiar Contraseña
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Dialog>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* Vincular Empleado Dialog */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Dialog
 
        open={vincularEmpleadoDialogOpen}
 
        onClose={() => setVincularEmpleadoDialogOpen(false)}
 
        maxWidth="sm"
 
        fullWidth
 
      >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogTitle>Vincular empleado al usuario</DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogContent sx={{ pt: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {empleadosLoading ? (
 
            <Box display="flex" justifyContent="center" py={4}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <CircularProgress />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Box>
 
          ) : (
 
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Seleccione el empleado a vincular con el usuario <strong>{vincularEmpleadoTarget?.username}</strong>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Autocomplete
 
                options={empleados}
 
                getOptionLabel={(e) => `${e.nombre} ${e.apellido} (DNI: ${e.dni})`}
 
                value={selectedEmpleadoToLink}
 
                onChange={(_, val) => setSelectedEmpleadoToLink(val)}
 
                renderInput={(params) => (
 
                  <TextField {...params} label="Empleado" placeholder="Buscar empleado..." />
 
                )}
 
              />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Box>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button onClick={() => setVincularEmpleadoDialogOpen(false)} color="inherit">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Cancelar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button
 
            onClick={handleConfirmVincularEmpleado}
 
            variant="contained"
 
            disabled={!selectedEmpleadoToLink}
 
          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Vincular
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Dialog>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
    </Box>
 
  );
 
};
 

 
export default UsersPage;
