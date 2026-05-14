import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import type { Role, Permission } from '../../types';
import LoadingOverlay from '../common/LoadingOverlay';
import ConfirmDialog from '../common/ConfirmDialog';

// Mock data for development
const mockPermissions: Permission[] = [
  // Admin permissions
  { id: 1, name: 'users.read', description: 'Ver usuarios', module: 'Admin', action: 'read' },
  { id: 2, name: 'users.write', description: 'Crear/editar usuarios', module: 'Admin', action: 'write' },
  { id: 3, name: 'users.delete', description: 'Eliminar usuarios', module: 'Admin', action: 'delete' },
  { id: 4, name: 'roles.read', description: 'Ver roles', module: 'Admin', action: 'read' },
  { id: 5, name: 'roles.write', description: 'Crear/editar roles', module: 'Admin', action: 'write' },
  
  // Sales permissions
  { id: 6, name: 'sales.read', description: 'Ver ventas', module: 'Ventas', action: 'read' },
  { id: 7, name: 'sales.write', description: 'Crear/editar ventas', module: 'Ventas', action: 'write' },
  { id: 8, name: 'quotes.read', description: 'Ver presupuestos', module: 'Ventas', action: 'read' },
  { id: 9, name: 'quotes.write', description: 'Crear/editar presupuestos', module: 'Ventas', action: 'write' },
  
  // Clients permissions
  { id: 10, name: 'clients.read', description: 'Ver clientes', module: 'Clientes', action: 'read' },
  { id: 11, name: 'clients.write', description: 'Crear/editar clientes', module: 'Clientes', action: 'write' },
  { id: 12, name: 'clients.delete', description: 'Eliminar clientes', module: 'Clientes', action: 'delete' },
  
  // Inventory permissions
  { id: 13, name: 'inventory.read', description: 'Ver inventario', module: 'Logística', action: 'read' },
  { id: 14, name: 'inventory.write', description: 'Gestionar inventario', module: 'Logística', action: 'write' },
  
  // HR permissions
  { id: 15, name: 'employees.read', description: 'Ver empleados', module: 'RRHH', action: 'read' },
  { id: 16, name: 'employees.write', description: 'Gestionar empleados', module: 'RRHH', action: 'write' },
  { id: 17, name: 'payroll.read', description: 'Ver nóminas', module: 'RRHH', action: 'read' },
  { id: 18, name: 'payroll.write', description: 'Gestionar nóminas', module: 'RRHH', action: 'write' },
];

const mockRoles: Role[] = [
  {
    id: 1,
    name: 'Admin',
    description: 'Administrador del sistema con acceso completo',
    permissions: mockPermissions,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Vendedor',
    description: 'Personal de ventas',
    permissions: mockPermissions.filter(p => 
      p.module === 'Ventas' || p.module === 'Clientes'
    ),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Gerente',
    description: 'Gerente de área',
    permissions: mockPermissions.filter(p => 
      p.module !== 'Admin' || p.action === 'read'
    ),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const RolesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionIds: [] as number[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRoles(mockRoles);
      setPermissions(mockPermissions);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissionIds: [],
    });
    setDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissionIds: role.permissions.map(p => p.id),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      console.log('Saving role:', formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const selectedPermissions = permissions.filter(p => 
        formData.permissionIds.includes(p.id)
      );
      
      if (editingRole) {
        setRoles(roles.map(role => 
          role.id === editingRole.id 
            ? { 
                ...role, 
                ...formData, 
                permissions: selectedPermissions,
                updatedAt: new Date().toISOString() 
              }
            : role
        ));
      } else {
        const newRole: Role = {
          id: Math.max(...roles.map(r => r.id)) + 1,
          ...formData,
          permissions: selectedPermissions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setRoles([...roles, newRole]);
      }
      
      setDialogOpen(false);
    } catch (err) {
      setError('Error al guardar el rol');
      console.error('Error saving role:', err);
    }
  };

  const handleDelete = (id: number) => {
    const role = roles.find((r) => r.id === id);
    if (role) setRoleToDelete(role);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    setDeleteLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setRoles(roles.filter(role => role.id !== roleToDelete.id));
      setRoleToDelete(null);
    } catch (err) {
      setError('Error al eliminar el rol');
      console.error('Error deleting role:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Cargando roles..." />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1} sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          <ShieldIcon sx={{ fontSize: { xs: 24, sm: 35 } }} />
          Roles y Permisos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          fullWidth={isMobile}
        >
          Agregar Rol
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 120 }}>Rol</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>Descripción</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Permisos</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Fecha Creación</TableCell>
                  <TableCell align="center" sx={{ minWidth: 100 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {role.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <Chip
                            key={permission.id}
                            label={permission.module}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                        {role.permissions.length > 3 && (
                          <Chip
                            label={`+${role.permissions.length - 3} más`}
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(role.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleEdit(role)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(role.id)} size="small">
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

      {/* Role Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon />
            {editingRole ? 'Editar Rol' : 'Agregar Rol'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nombre del Rol"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              required
            />
            
            <Typography variant="h6" mt={2}>
              Permisos
            </Typography>
            
            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
              <Accordion key={module}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {module}
                  </Typography>
                  <Box ml={2}>
                    <Chip
                      label={`${modulePermissions.filter(p => formData.permissionIds.includes(p.id)).length}/${modulePermissions.length}`}
                      size="small"
                      color={modulePermissions.every(p => formData.permissionIds.includes(p.id)) ? 'success' : 'default'}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    {modulePermissions.map((permission) => (
                      <FormControlLabel
                        key={permission.id}
                        control={
                          <Checkbox
                            checked={formData.permissionIds.includes(permission.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  permissionIds: [...formData.permissionIds, permission.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  permissionIds: formData.permissionIds.filter(id => id !== permission.id)
                                });
                              }
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {permission.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {permission.description}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingRole ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar rol?"
        severity="error"
        warning="Esta acción no se puede deshacer."
        description="Está a punto de eliminar el siguiente rol del sistema:"
        itemDetails={
          roleToDelete && (
            <>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {roleToDelete.name}
              </Typography>
              {roleToDelete.description && (
                <Typography variant="body2" color="text.secondary">
                  {roleToDelete.description}
                </Typography>
              )}
            </>
          )
        }
        confirmLabel="Eliminar"
        loadingLabel="Eliminando…"
        loading={deleteLoading}
      />
    </Box>
  );
};

export default RolesPage;
