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
  Switch,
  FormControlLabel,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import usuarioAdminApi, { type UsuarioDTO, type TipoRol } from '../../api/services/usuarioAdminApi';

// Available roles with labels and colors
const availableRoles = [
  { value: 'ADMIN' as TipoRol, label: 'Administrador', color: '#d32f2f' },
  { value: 'VENDEDOR' as TipoRol, label: 'Vendedor', color: '#1976d2' },
  { value: 'TALLER' as TipoRol, label: 'Taller', color: '#388e3c' },
  { value: 'OFICINA' as TipoRol, label: 'Oficina', color: '#f57c00' },
  { value: 'USUARIO' as TipoRol, label: 'Usuario', color: '#7b1fa2' },
];

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UsuarioDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioDTO | null>(null);
  const [userToDelete, setUserToDelete] = useState<UsuarioDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nombre: '',
    apellido: '',
    enabled: true,
    roles: [] as string[],
    password: '',
  });

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
      const response = await usuarioAdminApi.getAll(0, 100);
      setUsers(response.content);
      setError(null);
    } catch (err: any) {
      setError('Error al cargar los usuarios');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      nombre: '',
      apellido: '',
      enabled: true,
      roles: [],
      password: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (user: UsuarioDTO) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      nombre: '',
      apellido: '',
      enabled: user.enabled,
      roles: user.roles,
      password: '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      // Validation
      if (!formData.username || formData.username.length < 3) {
        setError('El nombre de usuario debe tener al menos 3 caracteres');
        return;
      }
      if (!formData.email) {
        setError('El email es requerido');
        return;
      }
      if (!editingUser && (!formData.password || formData.password.length < 8)) {
        setError('La contraseña debe tener al menos 8 caracteres');
        return;
      }
      if (!formData.roles || formData.roles.length === 0) {
        setError('Debe seleccionar al menos un rol');
        return;
      }

      if (editingUser) {
        // Update existing user
        await usuarioAdminApi.update(editingUser.id, {
          email: formData.email,
          nombre: formData.nombre || undefined,
          apellido: formData.apellido || undefined,
          enabled: formData.enabled,
          roles: formData.roles,
        });
        setSuccess('Usuario actualizado correctamente');
      } else {
        // Create new user
        await usuarioAdminApi.create({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          nombre: formData.nombre || undefined,
          apellido: formData.apellido || undefined,
          roles: formData.roles,
        });
        setSuccess('Usuario creado correctamente');
      }

      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el usuario');
      console.error('Error saving user:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        setError(null);
        setSuccess(null);
        await usuarioAdminApi.delete(id);
        setSuccess('Usuario eliminado correctamente');
        loadData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al eliminar el usuario');
        console.error('Error deleting user:', err);
      }
    }
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
                  <TableCell>Roles</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Bloqueado</TableCell>
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
                      <TableCell align="center">
                        <Chip
                          label={user.enabled ? 'Activo' : 'Inactivo'}
                          color={user.enabled ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={user.accountNonLocked ? 'Desbloqueado' : 'Bloqueado'}
                          color={user.accountNonLocked ? 'success' : 'error'}
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
                        <IconButton onClick={() => handleDelete(user.id)} size="small" color="error">
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
              helperText={editingUser ? 'El username no se puede cambiar' : 'Mínimo 3 caracteres'}
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

            {!editingUser && (
              <TextField
                label="Contraseña *"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                fullWidth
                required
                helperText="Mínimo 8 caracteres"
              />
            )}

            <FormControl fullWidth>
              <InputLabel>Roles *</InputLabel>
              <Select
                multiple
                value={formData.roles}
                onChange={(e) => setFormData({ ...formData, roles: e.target.value as string[] })}
                input={<OutlinedInput label="Roles *" />}
                renderValue={(selected) => (
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {selected.map((value) => {
                      const roleInfo = getRoleInfo(value as TipoRol);
                      return (
                        <Chip
                          key={value}
                          label={roleInfo.label}
                          size="small"
                          sx={{ bgcolor: roleInfo.color, color: 'white' }}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {availableRoles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    <Checkbox checked={formData.roles.indexOf(role.value) > -1} />
                    <ListItemText primary={role.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {editingUser && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    color="success"
                  />
                }
                label={formData.enabled ? 'Usuario Activo' : 'Usuario Inactivo'}
              />
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
    </Box>
  );
};

export default UsersPage;
