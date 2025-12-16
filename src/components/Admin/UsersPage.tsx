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
  Checkbox,
  ListItemText,
  OutlinedInput,
  Tooltip,
  FormHelperText,
  Divider,
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
} from '@mui/icons-material';
import usuarioAdminApi, { type UsuarioDTO, type TipoRol } from '../../api/services/usuarioAdminApi';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { empresaService } from '../../services/empresaService';
import { sucursalService } from '../../services/sucursalService';
import { usuarioEmpresaService } from '../../services/usuarioEmpresaService';
import { usuarioEmpresaIntegrationService } from '../../services/usuarioEmpresaIntegrationService';
import { ROLES_EMPRESA_OPTIONS, getAvailableRolesForUser, getRolEmpresaOption, mapRolEmpresaToSystemRole } from '../../utils/roleMapper';
import type { CreateUsuarioWithEmpresaDTO, UsuarioWithEmpresa, RolEmpresaOption } from '../../types/usuario-enhanced.types';
import type { Empresa, Sucursal, RolEmpresa } from '../../types';

// Available roles with labels and colors
const availableRoles = [
  { value: 'ADMIN' as TipoRol, label: 'Administrador', color: '#d32f2f' },
  { value: 'VENDEDOR' as TipoRol, label: 'Vendedor', color: '#1976d2' },
  { value: 'TALLER' as TipoRol, label: 'Taller', color: '#388e3c' },
  { value: 'OFICINA' as TipoRol, label: 'Oficina', color: '#f57c00' },
  { value: 'USUARIO' as TipoRol, label: 'Usuario', color: '#7b1fa2' },
];

const UsersPage: React.FC = () => {
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
  const [createdUserInfo, setCreatedUserInfo] = useState<{ username: string; role: string; isEdit: boolean } | null>(null);
  const [editingUser, setEditingUser] = useState<UsuarioWithEmpresa | null>(null);
  const [userToDelete, setUserToDelete] = useState<UsuarioWithEmpresa | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Empresa and Sucursal data
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // Enhanced form data with empresa assignment
  const [formData, setFormData] = useState<CreateUsuarioWithEmpresaDTO>({
    username: '',
    email: '',
    nombre: '',
    apellido: '',
    password: '',
    rolEmpresa: 'USUARIO_SUCURSAL',
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
  }, []);

  // Debounced username validation
  useEffect(() => {
    if (!formData.username || editingUser) return;

    const timeoutId = setTimeout(async () => {
      if (formData.username.length < 3) {
        setValidationErrors({ ...validationErrors, username: 'Mínimo 3 caracteres' });
        return;
      }

      setCheckingUsername(true);
      try {
        // Check if username already exists in the users list
        const existingUser = users.find(
          u => u.username.toLowerCase() === formData.username.toLowerCase()
        );

        if (existingUser) {
          setValidationErrors({
            ...validationErrors,
            username: '⚠️ Este nombre de usuario ya existe. Por favor elija otro.'
          });
        } else {
          setValidationErrors({ ...validationErrors, username: '' });
        }
      } catch (err) {
        console.error('Error checking username:', err);
      } finally {
        setCheckingUsername(false);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.username, editingUser]);

  // Real-time validation
  const validateUsername = (value: string): string => {
    if (!value) return 'El nombre de usuario es requerido';
    if (value.length < 3) return 'Mínimo 3 caracteres';
    if (value.length > 60) return 'Máximo 60 caracteres';
    return '';
  };

  const validateEmail = (value: string): string => {
    if (!value) return 'El email es requerido';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Email inválido';
    return '';
  };

  const validatePassword = (value: string): string => {
    if (!editingUser) {
      if (!value) return 'La contraseña es requerida';
      if (value.length < 8) return 'Mínimo 8 caracteres';
      if (value.length > 120) return 'Máximo 120 caracteres';
    }
    return '';
  };

  const validateRoles = (roles: string[]): string => {
    if (!roles || roles.length === 0) return 'Debe seleccionar al menos un rol';
    return '';
  };

  // Update form field with validation
  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });

    // Validate on change
    let error = '';
    switch (field) {
      case 'username':
        error = validateUsername(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'roles':
        error = validateRoles(value);
        break;
    }
    setValidationErrors({ ...validationErrors, [field]: error });
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load empresas for Super Admin
      if (esSuperAdmin) {
        const empresasData = await empresaService.getActive();
        setEmpresas(empresasData);
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
    setFormData({
      username: '',
      email: '',
      nombre: '',
      apellido: '',
      password: '',
      rolEmpresa: 'USUARIO_SUCURSAL',
      empresaId: currentEmpresaId || (empresas.length > 0 ? empresas[0].id : 0),
      sucursalId: undefined,
      sucursalDefectoId: undefined,
      observaciones: '',
    });
    setSelectedRolOption(getRolEmpresaOption('USUARIO_SUCURSAL') || null);

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
        const systemRole = mapRolEmpresaToSystemRole(formData.rolEmpresa);
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

  // Get role label and color
  const getRoleInfo = (role: TipoRol) => {
    return availableRoles.find(r => r.value === role) || { label: role, color: '#757575' };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <PersonIcon />
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Agregar Usuario
        </Button>
      </Box>

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

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Usuarios Registrados ({users.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Roles del Sistema</TableCell>
                  <TableCell>Roles en Empresas</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell>Último Acceso</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={4}>
                        <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          No hay usuarios registrados
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {user.username}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
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
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {user.usuarioEmpresas && user.usuarioEmpresas.length > 0 ? (
                            user.usuarioEmpresas.map((ue) => {
                              const rolOption = getRolEmpresaOption(ue.rol);
                              return (
                                <Tooltip
                                  key={ue.id}
                                  title={`Empresa ID: ${ue.empresaId}${ue.sucursalId ? ` - Sucursal ID: ${ue.sucursalId}` : ''}`}
                                >
                                  <Chip
                                    label={rolOption?.label || ue.rol}
                                    size="small"
                                    sx={{
                                      bgcolor: rolOption?.color || '#757575',
                                      color: 'white',
                                      fontWeight: 600,
                                    }}
                                  />
                                </Tooltip>
                              );
                            })
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Sin asignación
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={user.enabled ? 'Activo' : 'Inactivo'}
                          color={user.enabled ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Nunca'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleEdit(user)} size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteClick(user.id)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon />
            {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
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

            <TextField
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />

            <Box display="flex" gap={2}>
              <TextField
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                fullWidth
              />
              <TextField
                label="Apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                fullWidth
              />
            </Box>

            <TextField
              label={editingUser ? "Nueva Contraseña (opcional)" : "Contraseña *"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              fullWidth
              required={!editingUser}
              helperText={editingUser ? "Dejar en blanco para mantener la contraseña actual" : "Mínimo 8 caracteres"}
            />

            {/* Show empresa assignment fields for both create and edit */}
            {(
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  Asignación de Empresa y Rol
                </Typography>

                {/* Empresa Selection (only for Super Admin when creating) */}
                {esSuperAdmin && !editingUser && (
                  <FormControl fullWidth>
                    <InputLabel>Empresa *</InputLabel>
                    <Select
                      value={formData.empresaId}
                      onChange={async (e) => {
                        const empresaId = e.target.value as number;
                        setFormData({ ...formData, empresaId, sucursalId: undefined, sucursalDefectoId: undefined });
                        await loadSucursales(empresaId);
                      }}
                      label="Empresa *"
                    >
                      {empresas.map(empresa => (
                        <MenuItem key={empresa.id} value={empresa.id}>
                          {empresa.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {/* Show empresa info when editing */}
                {editingUser && (
                  <Alert severity="info">
                    La empresa asignada no se puede cambiar desde aquí. Solo puede modificar el rol y sucursal.
                  </Alert>
                )}

                {/* If ADMIN_EMPRESA, show info */}
                {!esSuperAdmin && (
                  <Alert severity="info">
                    El usuario será asignado a su empresa actual
                  </Alert>
                )}

                {/* Role Selection */}
                <FormControl fullWidth>
                  <InputLabel>Rol en Empresa *</InputLabel>
                  <Select
                    value={formData.rolEmpresa}
                    onChange={(e) => {
                      const rol = e.target.value as RolEmpresa;
                      const option = getRolEmpresaOption(rol);
                      setFormData({ ...formData, rolEmpresa: rol, sucursalId: undefined });
                      setSelectedRolOption(option || null);
                    }}
                    label="Rol en Empresa *"
                  >
                    {getAvailableRolesForUser(esSuperAdmin).map(role => (
                      <MenuItem key={role.value} value={role.value}>
                        <Box display="flex" flexDirection="column" width="100%">
                          <Typography variant="body1">{role.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {role.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {selectedRolOption && (
                    <Box mt={1}>
                      <Chip
                        label={selectedRolOption.label}
                        sx={{ bgcolor: selectedRolOption.color, color: 'white' }}
                        size="small"
                      />
                    </Box>
                  )}
                </FormControl>

                {/* Sucursal Selection (conditional based on role) */}
                {selectedRolOption?.requiresSucursal && (
                  <FormControl fullWidth>
                    <InputLabel>Sucursal Asignada *</InputLabel>
                    <Select
                      value={formData.sucursalId || ''}
                      onChange={(e) => setFormData({ ...formData, sucursalId: e.target.value as number })}
                      label="Sucursal Asignada *"
                    >
                      {sucursales.map(sucursal => (
                        <MenuItem key={sucursal.id} value={sucursal.id}>
                          {sucursal.nombre} {sucursal.esPrincipal && '(Principal)'}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Este rol requiere asignación a una sucursal específica
                    </FormHelperText>
                  </FormControl>
                )}

                {/* Default Sucursal (optional, for roles that can switch) */}
                {!selectedRolOption?.requiresSucursal && sucursales.length > 0 && (
                  <FormControl fullWidth>
                    <InputLabel>Sucursal por Defecto</InputLabel>
                    <Select
                      value={formData.sucursalDefectoId || ''}
                      onChange={(e) => setFormData({ ...formData, sucursalDefectoId: (e.target.value as number) || undefined })}
                      label="Sucursal por Defecto"
                    >
                      <MenuItem value="">
                        <em>Sin sucursal por defecto</em>
                      </MenuItem>
                      {sucursales.map(sucursal => (
                        <MenuItem key={sucursal.id} value={sucursal.id}>
                          {sucursal.nombre} {sucursal.esPrincipal && '(Principal)'}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Sucursal que se seleccionará automáticamente al iniciar sesión
                    </FormHelperText>
                  </FormControl>
                )}

                {/* Observations */}
                <TextField
                  label="Observaciones"
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Notas adicionales sobre el usuario..."
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingUser ? 'Actualizar' : 'Crear Usuario'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* General Save Confirmation Dialog */}
      <Dialog
        open={confirmSaveDialogOpen}
        onClose={handleCancelSave}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2' }}>
          <CheckCircleIcon color="primary" />
          {editingUser ? '¿Actualizar Usuario?' : '¿Crear Usuario?'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Por favor, revise los datos antes de continuar.
          </Alert>
          <Box>
            <Typography variant="body1" paragraph>
              {editingUser ? 'Está a punto de actualizar el usuario:' : 'Está a punto de crear el usuario:'}
            </Typography>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Usuario:</strong> {formData.username}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Email:</strong> {formData.email}
              </Typography>
              {formData.nombre && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Nombre:</strong> {formData.nombre} {formData.apellido}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Rol:</strong>{' '}
                <Chip
                  label={getRolEmpresaOption(formData.rolEmpresa)?.label || formData.rolEmpresa}
                  size="small"
                  sx={{
                    bgcolor: getRolEmpresaOption(formData.rolEmpresa)?.color || '#757575',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Typography>
              {formData.sucursalId && (
                <Typography variant="body2">
                  <strong>Sucursal ID:</strong> {formData.sucursalId}
                </Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              ¿Confirma que los datos son correctos?
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSave} color="inherit" disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmSave}
            variant="contained"
            color="primary"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
          >
            {saving ? (editingUser ? 'Actualizando...' : 'Creando...') : (editingUser ? 'Sí, Actualizar' : 'Sí, Crear Usuario')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Super Admin Confirmation Dialog */}
      <Dialog
        open={confirmSuperAdminDialogOpen}
        onClose={handleCancelSuperAdmin}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
          <SecurityIcon color="error" />
          ¿Crear Super Administrador?
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>¡Advertencia!</strong> Está a punto de crear un Super Administrador.
          </Alert>
          <Typography variant="body1" paragraph>
            El usuario <strong>{formData.username}</strong> tendrá:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <li>
              <Typography variant="body2">Acceso completo a <strong>todas las empresas</strong> del sistema</Typography>
            </li>
            <li>
              <Typography variant="body2">Permisos para crear, modificar y eliminar cualquier dato</Typography>
            </li>
            <li>
              <Typography variant="body2">Capacidad de crear otros Super Administradores</Typography>
            </li>
            <li>
              <Typography variant="body2">Control total sobre usuarios y configuraciones</Typography>
            </li>
          </Box>
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            ¿Está seguro de que desea continuar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSuperAdmin} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleConfirmSuperAdmin} variant="contained" color="error" autoFocus>
            Sí, Crear Super Administrador
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
          <WarningIcon color="error" />
          ¿Eliminar Usuario?
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>¡Atención!</strong> Esta acción no se puede deshacer.
          </Alert>
          {userToDelete && (
            <Box>
              <Typography variant="body1" paragraph>
                Está a punto de eliminar el usuario:
              </Typography>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  {userToDelete.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userToDelete.email}
                </Typography>
              </Box>

              {/* Show empresa roles if any */}
              {userToDelete.usuarioEmpresas && userToDelete.usuarioEmpresas.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Este usuario tiene asignaciones a empresas:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
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
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Todas estas asignaciones también serán eliminadas.
                  </Typography>
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary">
                ¿Está seguro de que desea continuar?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit" disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? 'Eliminando...' : 'Sí, Eliminar Usuario'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#388e3c' }}>
          <PersonIcon color="success" />
          {createdUserInfo?.isEdit ? '¡Usuario Actualizado Exitosamente!' : '¡Usuario Creado Exitosamente!'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            {createdUserInfo?.isEdit
              ? 'Los cambios han sido guardados correctamente.'
              : 'El usuario ha sido creado y asignado correctamente.'
            }
          </Alert>
          {createdUserInfo && (
            <Box>
              <Typography variant="body1" paragraph>
                <strong>Nombre de usuario:</strong> {createdUserInfo.username}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Rol asignado:</strong>{' '}
                <Chip
                  label={createdUserInfo.role}
                  size="small"
                  sx={{
                    bgcolor: getRolEmpresaOption(formData.rolEmpresa)?.color || '#757575',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Typography>
              {!createdUserInfo.isEdit && (
                <Typography variant="body2" color="text.secondary">
                  El usuario puede iniciar sesión inmediatamente con las credenciales proporcionadas.
                </Typography>
              )}
              {createdUserInfo.isEdit && (
                <Typography variant="body2" color="text.secondary">
                  Los cambios están disponibles de inmediato.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessDialogOpen(false)} variant="contained" color="success">
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
