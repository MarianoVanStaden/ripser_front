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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import type { User, Role } from '../../types';

// Mock data for development - replace with actual API calls
const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@ripser.com',
    firstName: 'Admin',
    lastName: 'Sistema',
    isActive: true,
    roles: [{ id: 1, name: 'Admin', description: 'Administrador del sistema', permissions: [], createdAt: '', updatedAt: '' }],
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    username: 'vendedor1',
    email: 'vendedor1@ripser.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    isActive: true,
    roles: [{ id: 2, name: 'Vendedor', description: 'Personal de ventas', permissions: [], createdAt: '', updatedAt: '' }],
    lastLogin: '2024-01-15T09:15:00Z',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
  },
];

const mockRoles: Role[] = [
  { id: 1, name: 'Admin', description: 'Administrador del sistema', permissions: [], createdAt: '', updatedAt: '' },
  { id: 2, name: 'Vendedor', description: 'Personal de ventas', permissions: [], createdAt: '', updatedAt: '' },
  { id: 3, name: 'Gerente', description: 'Gerente de área', permissions: [], createdAt: '', updatedAt: '' },
];

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    isActive: true,
    roleIds: [] as number[],
    password: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsers(mockUsers);
      setRoles(mockRoles);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      isActive: true,
      roleIds: [],
      password: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roleIds: user.roles.map(role => role.id),
      password: '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // Replace with actual API call
      console.log('Saving user:', formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingUser) {
        // Update existing user
        setUsers(users.map(user => 
          user.id === editingUser.id 
            ? { 
                ...user, 
                ...formData, 
                roles: roles.filter(role => formData.roleIds.includes(role.id)),
                updatedAt: new Date().toISOString() 
              }
            : user
        ));
      } else {
        // Add new user
        const newUser: User = {
          id: Math.max(...users.map(u => u.id)) + 1,
          ...formData,
          roles: roles.filter(role => formData.roleIds.includes(role.id)),
          lastLogin: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUsers([...users, newUser]);
      }
      
      setDialogOpen(false);
    } catch (err) {
      setError('Error al guardar el usuario');
      console.error('Error saving user:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        // Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setUsers(users.filter(user => user.id !== id));
      } catch (err) {
        setError('Error al eliminar el usuario');
        console.error('Error deleting user:', err);
      }
    }
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Nombre Completo</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Último Acceso</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {user.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {user.roles.map((role) => (
                          <Chip
                            key={role.id}
                            label={role.name}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Activo' : 'Inactivo'}
                        color={user.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleEdit(user)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(user.id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon />
            {editingUser ? 'Editar Usuario' : 'Agregar Usuario'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nombre de Usuario"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            
            <Box display="flex" gap={2}>
              <TextField
                label="Nombre"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Apellido"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                fullWidth
                required
              />
            </Box>
            
            {!editingUser && (
              <TextField
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                fullWidth
                required
              />
            )}
            
            <FormControl fullWidth>
              <InputLabel>Roles</InputLabel>
              <Select
                multiple
                value={formData.roleIds}
                onChange={(e) => setFormData({ ...formData, roleIds: e.target.value as number[] })}
                renderValue={(selected) => (
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {selected.map((value) => {
                      const role = roles.find(r => r.id === value);
                      return role ? <Chip key={value} label={role.name} size="small" /> : null;
                    })}
                  </Box>
                )}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Usuario Activo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingUser ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
