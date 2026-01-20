import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Alert, CircularProgress,
  Chip, Stack, FormControl, InputLabel, Select, MenuItem, OutlinedInput,
  Checkbox, ListItemText, FormControlLabel, Switch, Tooltip, InputAdornment,
  IconButton as MuiIconButton, Pagination, useMediaQuery, useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  People as PeopleIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  VpnKey as VpnKeyIcon,
} from '@mui/icons-material';
import { usuarioAdminApi } from '../../api/services';
import type {
  UsuarioDTO,
  UsuarioCreateDTO,
  UsuarioUpdateDTO,
  ChangePasswordDTO,
  TipoRol,
} from '../../api/services/usuarioAdminApi';
import dayjs from 'dayjs';

const UsuariosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // State
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioDTO | null>(null);

  // Form data
  const [createForm, setCreateForm] = useState<UsuarioCreateDTO>({
    username: '',
    password: '',
    email: '',
    nombre: '',
    apellido: '',
    roles: [],
  });

  const [updateForm, setUpdateForm] = useState<UsuarioUpdateDTO>({
    email: '',
    nombre: '',
    apellido: '',
    enabled: true,
    accountNonLocked: true,
    roles: [],
  });

  const [passwordForm, setPasswordForm] = useState<ChangePasswordDTO>({
    currentPassword: '',
    newPassword: '',
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Available roles
  const availableRoles: { value: TipoRol; label: string; color: string }[] = [
    { value: 'ADMIN', label: 'Administrador', color: '#f44336' },
    { value: 'VENDEDOR', label: 'Vendedor', color: '#2196f3' },
    { value: 'TALLER', label: 'Taller', color: '#ff9800' },
    { value: 'OFICINA', label: 'Oficina', color: '#4caf50' },
    { value: 'USUARIO', label: 'Usuario', color: '#9c27b0' },
  ];

  // Load users
  useEffect(() => {
    loadUsuarios();
  }, [page]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usuarioAdminApi.getAll(page, pageSize);
      setUsuarios(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.response?.data?.message || 'Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Create user
  const handleCreateUser = async () => {
    try {
      setError(null);

      // Validation
      if (!createForm.username || createForm.username.length < 3) {
        setError('El nombre de usuario debe tener al menos 3 caracteres');
        return;
      }
      if (!createForm.password || createForm.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        return;
      }
      if (!createForm.email || !createForm.email.includes('@')) {
        setError('Debe ingresar un email válido');
        return;
      }
      if (createForm.roles.length === 0) {
        setError('Debe seleccionar al menos un rol');
        return;
      }

      await usuarioAdminApi.create(createForm);
      setSuccess('Usuario creado correctamente');
      setCreateDialogOpen(false);
      resetCreateForm();
      loadUsuarios();
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.message || 'Error al crear el usuario');
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      await usuarioAdminApi.update(selectedUser.id, updateForm);
      setSuccess('Usuario actualizado correctamente');
      setEditDialogOpen(false);
      setSelectedUser(null);
      loadUsuarios();
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Error al actualizar el usuario');
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!selectedUser) return;

    try {
      setError(null);

      if (!passwordForm.currentPassword || !passwordForm.newPassword) {
        setError('Debe completar ambos campos');
        return;
      }
      if (passwordForm.newPassword.length < 8) {
        setError('La nueva contraseña debe tener al menos 8 caracteres');
        return;
      }

      await usuarioAdminApi.changePassword(selectedUser.id, passwordForm);
      setSuccess('Contraseña cambiada correctamente');
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      resetPasswordForm();
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || 'Error al cambiar la contraseña');
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      await usuarioAdminApi.delete(selectedUser.id);
      setSuccess('Usuario eliminado correctamente');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      loadUsuarios();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Error al eliminar el usuario');
    }
  };

  // Open edit dialog
  const openEditDialog = (user: UsuarioDTO) => {
    setSelectedUser(user);
    setUpdateForm({
      email: user.email,
      enabled: user.enabled,
      accountNonLocked: user.accountNonLocked,
      roles: user.roles,
    });
    setEditDialogOpen(true);
  };

  // Open password dialog
  const openPasswordDialog = (user: UsuarioDTO) => {
    setSelectedUser(user);
    resetPasswordForm();
    setPasswordDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (user: UsuarioDTO) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Reset forms
  const resetCreateForm = () => {
    setCreateForm({
      username: '',
      password: '',
      email: '',
      nombre: '',
      apellido: '',
      roles: [],
    });
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
    });
  };

  // Get role label and color
  const getRoleInfo = (role: TipoRol) => {
    return availableRoles.find(r => r.value === role) || { label: role, color: '#757575' };
  };

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1} sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          <PeopleIcon sx={{ fontSize: { xs: 24, sm: 35 } }} />
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          fullWidth={isMobile}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {/* Alerts */}
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

      {/* Users Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Usuarios Registrados ({totalElements})
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 120 }}>Username</TableCell>
                      <TableCell sx={{ minWidth: 180 }}>Email</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Roles</TableCell>
                      <TableCell align="center" sx={{ minWidth: 100 }}>Estado</TableCell>
                      <TableCell align="center" sx={{ minWidth: 120 }}>Bloqueado</TableCell>
                      <TableCell sx={{ minWidth: 130 }}>Creado</TableCell>
                      <TableCell align="center" sx={{ minWidth: 110 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usuarios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Box py={4}>
                            <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                              No hay usuarios registrados
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      usuarios.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {user.username}
                            </Typography>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
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
                                      mb: 0.5,
                                    }}
                                  />
                                );
                              })}
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={user.enabled ? <CheckIcon /> : <CloseIcon />}
                              label={user.enabled ? 'Activo' : 'Inactivo'}
                              color={user.enabled ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={user.accountNonLocked ? <LockOpenIcon /> : <LockIcon />}
                              label={user.accountNonLocked ? 'Desbloqueado' : 'Bloqueado'}
                              color={user.accountNonLocked ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {dayjs(user.createdAt).format('DD/MM/YYYY HH:mm')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => openEditDialog(user)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cambiar Contraseña">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => openPasswordDialog(user)}
                                >
                                  <VpnKeyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => openDeleteDialog(user)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={totalPages}
                    page={page + 1}
                    onChange={(_, newPage) => setPage(newPage - 1)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de Usuario *"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                helperText="Mínimo 3 caracteres"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={createForm.nombre}
                onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido"
                value={createForm.apellido}
                onChange={(e) => setCreateForm({ ...createForm, apellido: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contraseña *"
                type={showPassword ? 'text' : 'password'}
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                helperText="Mínimo 8 caracteres"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <MuiIconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </MuiIconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Roles *</InputLabel>
                <Select
                  multiple
                  value={createForm.roles}
                  onChange={(e) => setCreateForm({ ...createForm, roles: e.target.value as string[] })}
                  input={<OutlinedInput label="Roles *" />}
                  renderValue={(selected) => (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
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
                    </Stack>
                  )}
                >
                  {availableRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      <Checkbox checked={createForm.roles.indexOf(role.value) > -1} />
                      <ListItemText primary={role.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateUser}>
            Crear Usuario
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Editar Usuario: {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={updateForm.email}
                onChange={(e) => setUpdateForm({ ...updateForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Roles</InputLabel>
                <Select
                  multiple
                  value={updateForm.roles || []}
                  onChange={(e) => setUpdateForm({ ...updateForm, roles: e.target.value as string[] })}
                  input={<OutlinedInput label="Roles" />}
                  renderValue={(selected) => (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
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
                    </Stack>
                  )}
                >
                  {availableRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      <Checkbox checked={(updateForm.roles || []).indexOf(role.value) > -1} />
                      <ListItemText primary={role.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={updateForm.enabled}
                    onChange={(e) => setUpdateForm({ ...updateForm, enabled: e.target.checked })}
                    color="success"
                  />
                }
                label={updateForm.enabled ? 'Usuario Activo' : 'Usuario Inactivo'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={updateForm.accountNonLocked}
                    onChange={(e) => setUpdateForm({ ...updateForm, accountNonLocked: e.target.checked })}
                    color="success"
                  />
                }
                label={updateForm.accountNonLocked ? 'Desbloqueado' : 'Bloqueado'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdateUser}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Cambiar Contraseña: {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contraseña Actual *"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <MuiIconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </MuiIconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
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
                      <MuiIconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </MuiIconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="warning" onClick={handleChangePassword}>
            Cambiar Contraseña
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullScreen={isMobile}>
        <DialogTitle>Eliminar Usuario</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar el usuario <strong>{selectedUser?.username}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsuariosPage;
