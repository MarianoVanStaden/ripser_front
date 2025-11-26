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
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { parametroSistemaApi } from '../../api/services';
import type { ParametroSistema } from '../../types';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const [parameters, setParameters] = useState<ParametroSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<ParametroSistema | null>(null);
  const [formData, setFormData] = useState({
    clave: '',
    valor: '',
    descripcion: '',
    tipo: 'STRING' as 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN',
  });
  const [unsavedChanges, setUnsavedChanges] = useState<Record<number, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await parametroSistemaApi.getAll();
      setParameters(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los parámetros del sistema');
      console.error('Error loading parameters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingParameter(null);
    setFormData({
      clave: '',
      valor: '',
      descripcion: '',
      tipo: 'STRING',
    });
    setDialogOpen(true);
  };

  const handleEdit = (parameter: ParametroSistema) => {
    setEditingParameter(parameter);
    setFormData({
      clave: parameter.clave,
      valor: parameter.valor,
      descripcion: parameter.descripcion || '',
      tipo: parameter.tipo as 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.clave || !formData.valor) {
        setError('La clave y el valor son obligatorios');
        return;
      }

      if (editingParameter) {
        // Update existing
        await parametroSistemaApi.update(editingParameter.id, {
          ...editingParameter,
          ...formData,
        } as ParametroSistema);
        setSuccess('Parámetro actualizado exitosamente');
      } else {
        // Create new
        await parametroSistemaApi.create({
          id: 0, // Backend will assign
          ...formData,
          fechaActualizacion: new Date().toISOString(),
        } as ParametroSistema);
        setSuccess('Parámetro creado exitosamente');
      }

      setDialogOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el parámetro');
      console.error('Error saving parameter:', err);
    }
  };

  const handleInlineChange = (id: number, newValue: string) => {
    setUnsavedChanges({ ...unsavedChanges, [id]: newValue });
  };

  const handleInlineSave = async (parameter: ParametroSistema) => {
    try {
      const newValue = unsavedChanges[parameter.id];
      if (newValue === undefined) return;

      await parametroSistemaApi.update(parameter.id, {
        ...parameter,
        valor: newValue,
      });

      setSuccess('Parámetro actualizado');
      setUnsavedChanges((prev) => {
        const { [parameter.id]: _, ...rest } = prev;
        return rest;
      });

      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
      console.error('Error saving parameter:', err);
    }
  };

  // Categorizar parámetros por prefijo
  const categorizedParameters = parameters.reduce((acc, param) => {
    const category = param.clave.split('_')[0] || 'GENERAL';
    if (!acc[category]) acc[category] = [];
    acc[category].push(param);
    return acc;
  }, {} as Record<string, ParametroSistema[]>);

  const categoryLabels: Record<string, string> = {
    META: 'Metas y Objetivos',
    DIAS: 'Configuración de Tiempos',
    IVA: 'Impuestos',
    NOMBRE: 'Información de Empresa',
    TELEFONO: 'Contacto',
    EMAIL: 'Contacto',
    GENERAL: 'General',
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        sx={{
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SettingsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="600">
              Parámetros del Sistema
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configuración general del sistema
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Nuevo Parámetro
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

      {/* Parámetros agrupados por categoría */}
      <Box>
        {Object.entries(categorizedParameters).map(([category, categoryParameters]) => (
          <Accordion
            key={category}
            defaultExpanded={category === 'META' || category === 'GENERAL'}
            sx={{
              mb: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              '&:before': { display: 'none' },
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <Typography variant="h6" fontWeight="600">
                  {categoryLabels[category] || category}
                </Typography>
                <Chip
                  label={`${categoryParameters.length} parámetros`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, width: '25%' }}>Clave</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '25%' }}>Valor</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '35%' }}>Descripción</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '10%' }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '5%' }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryParameters.map((param) => {
                      const hasUnsavedChanges = unsavedChanges[param.id] !== undefined;
                      const displayValue = hasUnsavedChanges
                        ? unsavedChanges[param.id]
                        : param.valor;

                      return (
                        <TableRow key={param.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600" fontFamily="monospace">
                              {param.clave}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={displayValue}
                              onChange={(e) => handleInlineChange(param.id, e.target.value)}
                              InputProps={{
                                endAdornment: hasUnsavedChanges && (
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleInlineSave(param)}
                                  >
                                    <SaveIcon fontSize="small" />
                                  </IconButton>
                                ),
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {param.descripcion || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={param.tipo}
                              size="small"
                              variant="outlined"
                              color={
                                param.tipo === 'INTEGER' || param.tipo === 'DECIMAL'
                                  ? 'primary'
                                  : param.tipo === 'BOOLEAN'
                                  ? 'success'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(param)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Dialog para Crear/Editar */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle>
          {editingParameter ? 'Editar Parámetro' : 'Nuevo Parámetro'}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Clave"
              fullWidth
              value={formData.clave}
              onChange={(e) => setFormData({ ...formData, clave: e.target.value.toUpperCase() })}
              disabled={!!editingParameter}
              helperText="Identificador único del parámetro (ej: META_VENTAS_MENSUALES)"
              required
            />

            <TextField
              label="Valor"
              fullWidth
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              required
            />

            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={2}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Dato</InputLabel>
              <Select
                value={formData.tipo}
                label="Tipo de Dato"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipo: e.target.value as 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN',
                  })
                }
              >
                <MenuItem value="STRING">Texto (STRING)</MenuItem>
                <MenuItem value="INTEGER">Número Entero (INTEGER)</MenuItem>
                <MenuItem value="DECIMAL">Número Decimal (DECIMAL)</MenuItem>
                <MenuItem value="BOOLEAN">Booleano (BOOLEAN)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
