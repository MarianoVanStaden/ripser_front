import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { SystemParameter } from '../../types';

// Mock data for development
const mockParameters: SystemParameter[] = [
  {
    id: 1,
    key: 'company.name',
    value: 'Ripser S.A.',
    description: 'Nombre de la empresa',
    category: 'company',
    dataType: 'STRING',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    key: 'company.address',
    value: 'Av. Principal 123, Buenos Aires',
    description: 'Dirección de la empresa',
    category: 'company',
    dataType: 'STRING',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    key: 'company.phone',
    value: '+54 11 1234-5678',
    description: 'Teléfono de contacto',
    category: 'company',
    dataType: 'STRING',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 4,
    key: 'company.email',
    value: 'info@ripser.com',
    description: 'Email de contacto',
    category: 'company',
    dataType: 'STRING',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 5,
    key: 'sales.tax_rate',
    value: '21',
    description: 'Tasa de IVA predeterminada (%)',
    category: 'sales',
    dataType: 'NUMBER',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 6,
    key: 'sales.quote_validity_days',
    value: '30',
    description: 'Días de validez para presupuestos',
    category: 'sales',
    dataType: 'NUMBER',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 7,
    key: 'system.enable_notifications',
    value: 'true',
    description: 'Habilitar notificaciones del sistema',
    category: 'system',
    dataType: 'BOOLEAN',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 8,
    key: 'inventory.low_stock_threshold',
    value: '10',
    description: 'Umbral mínimo de stock',
    category: 'inventory',
    dataType: 'NUMBER',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 9,
    key: 'security.password_expiry_days',
    value: '90',
    description: 'Días para caducidad de contraseñas',
    category: 'security',
    dataType: 'NUMBER',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 10,
    key: 'security.max_login_attempts',
    value: '5',
    description: 'Máximo intentos de login fallidos',
    category: 'security',
    dataType: 'NUMBER',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const categoryNames = {
  company: 'Información de la Empresa',
  sales: 'Configuración de Ventas',
  system: 'Sistema',
  inventory: 'Inventario',
  security: 'Seguridad',
};

const SettingsPage: React.FC = () => {
  const [parameters, setParameters] = useState<SystemParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<SystemParameter | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    category: '',
    dataType: 'STRING' as 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON',
  });
  const [unsavedChanges, setUnsavedChanges] = useState<Record<number, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setParameters(mockParameters);
      setError(null);
    } catch (err) {
      setError('Error al cargar los parámetros');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingParameter(null);
    setFormData({
      key: '',
      value: '',
      description: '',
      category: '',
      dataType: 'STRING',
    });
    setDialogOpen(true);
  };

  const handleEdit = (parameter: SystemParameter) => {
    setEditingParameter(parameter);
    setFormData({
      key: parameter.key,
      value: parameter.value,
      description: parameter.description,
      category: parameter.category,
      dataType: parameter.dataType,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      console.log('Saving parameter:', formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingParameter) {
        setParameters(parameters.map(param => 
          param.id === editingParameter.id 
            ? { 
                ...param, 
                ...formData, 
                updatedAt: new Date().toISOString() 
              }
            : param
        ));
      } else {
        const newParameter: SystemParameter = {
          id: Math.max(...parameters.map(p => p.id)) + 1,
          ...formData,
          updatedAt: new Date().toISOString(),
        };
        setParameters([...parameters, newParameter]);
      }
      
      setDialogOpen(false);
    } catch (err) {
      setError('Error al guardar el parámetro');
      console.error('Error saving parameter:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este parámetro?')) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setParameters(parameters.filter(param => param.id !== id));
      } catch (err) {
        setError('Error al eliminar el parámetro');
        console.error('Error deleting parameter:', err);
      }
    }
  };

  const handleValueChange = (id: number, newValue: string) => {
    setUnsavedChanges({ ...unsavedChanges, [id]: newValue });
  };

  const saveParameter = async (id: number) => {
    try {
      const newValue = unsavedChanges[id];
      console.log('Saving parameter value:', { id, newValue });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setParameters(parameters.map(param => 
        param.id === id 
          ? { ...param, value: newValue, updatedAt: new Date().toISOString() }
          : param
      ));
      
      const newUnsavedChanges = { ...unsavedChanges };
      delete newUnsavedChanges[id];
      setUnsavedChanges(newUnsavedChanges);
    } catch (err) {
      setError('Error al guardar el parámetro');
      console.error('Error saving parameter:', err);
    }
  };

  const renderValueInput = (parameter: SystemParameter) => {
    const currentValue = unsavedChanges[parameter.id] ?? parameter.value;
    const hasChanges = unsavedChanges[parameter.id] !== undefined;

    switch (parameter.dataType) {
      case 'BOOLEAN':
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Switch
              checked={currentValue === 'true'}
              onChange={(e) => handleValueChange(parameter.id, e.target.checked ? 'true' : 'false')}
            />
            {hasChanges && (
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => saveParameter(parameter.id)}
              >
                <SaveIcon />
              </IconButton>
            )}
          </Box>
        );
      case 'NUMBER':
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              type="number"
              value={currentValue}
              onChange={(e) => handleValueChange(parameter.id, e.target.value)}
              size="small"
              sx={{ width: 120 }}
            />
            {hasChanges && (
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => saveParameter(parameter.id)}
              >
                <SaveIcon />
              </IconButton>
            )}
          </Box>
        );
      default:
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              value={currentValue}
              onChange={(e) => handleValueChange(parameter.id, e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            {hasChanges && (
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => saveParameter(parameter.id)}
              >
                <SaveIcon />
              </IconButton>
            )}
          </Box>
        );
    }
  };

  const groupedParameters = parameters.reduce((acc, parameter) => {
    if (!acc[parameter.category]) {
      acc[parameter.category] = [];
    }
    acc[parameter.category].push(parameter);
    return acc;
  }, {} as Record<string, SystemParameter[]>);

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
          <SettingsIcon />
          Parámetros del Sistema
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Agregar Parámetro
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {Object.keys(unsavedChanges).length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Hay cambios sin guardar. Haga clic en el ícono de guardar junto a cada parámetro modificado.
        </Alert>
      )}

      {Object.entries(groupedParameters).map(([category, categoryParameters]) => (
        <Accordion key={category} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              {categoryNames[category as keyof typeof categoryNames] || category}
            </Typography>
            <Box ml={2}>
              <Chip
                label={`${categoryParameters.length} parámetros`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Clave</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Última Actualización</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoryParameters.map((parameter) => (
                    <TableRow key={parameter.id}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {parameter.key}
                        </Typography>
                      </TableCell>
                      <TableCell>{parameter.description}</TableCell>
                      <TableCell>{renderValueInput(parameter)}</TableCell>
                      <TableCell>
                        <Chip
                          label={parameter.dataType}
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(parameter.updatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleEdit(parameter)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(parameter.id)} size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Parameter Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SettingsIcon />
            {editingParameter ? 'Editar Parámetro' : 'Agregar Parámetro'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Clave"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              fullWidth
              required
              helperText="Usar formato: categoria.nombre (ej: company.name)"
            />
            
            <TextField
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              required
            />
            
            <FormControl fullWidth required>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {Object.entries(categoryNames).map(([key, name]) => (
                  <MenuItem key={key} value={key}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth required>
              <InputLabel>Tipo de Dato</InputLabel>
              <Select
                value={formData.dataType}
                onChange={(e) => setFormData({ ...formData, dataType: e.target.value as any })}
              >
                <MenuItem value="STRING">Texto</MenuItem>
                <MenuItem value="NUMBER">Número</MenuItem>
                <MenuItem value="BOOLEAN">Booleano</MenuItem>
                <MenuItem value="JSON">JSON</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Valor"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              fullWidth
              required
              multiline={formData.dataType === 'JSON'}
              rows={formData.dataType === 'JSON' ? 3 : 1}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingParameter ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
