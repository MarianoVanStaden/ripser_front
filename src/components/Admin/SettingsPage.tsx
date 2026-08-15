import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
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
  useMediaQuery,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { parametroSistemaApi } from '../../api/services';
import type { ParametroSistema } from '../../types';
import LoadingOverlay from '../common/LoadingOverlay';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  const parametersQuery = useQuery({
    queryKey: ['parametros-sistema'],
    queryFn: () => parametroSistemaApi.getAll(),
  });
  const parameters: ParametroSistema[] = parametersQuery.data ?? [];
  const loading = parametersQuery.isPending;
  const [actionError, setActionError] = useState<string | null>(null);
  const error = parametersQuery.error ? 'Error al cargar los parámetros del sistema' : actionError;
  const setError = setActionError;
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
  const [deleteTarget, setDeleteTarget] = useState<ParametroSistema | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['parametros-sistema'] });
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await parametroSistemaApi.delete(deleteTarget.id);
      setSuccess('Parámetro eliminado');
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el parámetro');
      console.error('Error deleting parameter:', err);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
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
    PORCENTAJE: 'Calculo de Precios',
    REDONDEO: 'Calculo de Precios',
    COSTEO: 'Costos de Fabricación',
    FABRICACION: 'Fabricación',
    COBRANZA: 'Cobranza',
    VALOR: 'Valores de Referencia',
    GENERAL: 'General',
  };

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Cargando parámetros..." />
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
        sx={{
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
          <Box
            sx={{
              p: { xs: 1, sm: 1.5 },
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SettingsIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="600" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
              Parámetros del Sistema
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Configuración general del sistema
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          fullWidth={isMobile}
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

      {/* Ayuda Rápida - Parámetros de Métricas */}
      {parameters.length === 0 || !parameters.find(p => p.clave === 'META_MENSUAL_LEADS') || !parameters.find(p => p.clave === 'META_PRESUPUESTO_MENSUAL') ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            📊 Configuración Inicial Recomendada
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Para usar el dashboard de métricas de leads, se recomienda crear los siguientes parámetros:
          </Typography>
          <Box sx={{ ml: 2, mb: 2 }}>
            <Typography variant="body2" fontWeight="600">• META_MENSUAL_LEADS</Typography>
            <Typography variant="caption" color="text.secondary">
              Meta de leads nuevos por mes (ej: 30 para empresa mediana)
            </Typography>
            <br/>
            <Typography variant="body2" fontWeight="600" sx={{ mt: 1 }}>• META_PRESUPUESTO_MENSUAL</Typography>
            <Typography variant="caption" color="text.secondary">
              Meta de facturación mensual en pesos (ej: 1000000 para $1,000,000/mes)
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {!parameters.find(p => p.clave === 'META_MENSUAL_LEADS') && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                fullWidth={isMobile}
                onClick={() => {
                  setEditingParameter(null);
                  setFormData({
                    clave: 'META_MENSUAL_LEADS',
                    valor: '30',
                    descripcion: 'Meta mensual de leads nuevos para la empresa. Usado en el cálculo de cumplimiento de objetivos en el dashboard de métricas.',
                    tipo: 'INTEGER',
                  });
                  setDialogOpen(true);
                }}
              >
                Crear META_MENSUAL_LEADS
              </Button>
            )}
            {!parameters.find(p => p.clave === 'META_PRESUPUESTO_MENSUAL') && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                fullWidth={isMobile}
                onClick={() => {
                  setEditingParameter(null);
                  setFormData({
                    clave: 'META_PRESUPUESTO_MENSUAL',
                    valor: '1000000',
                    descripcion: 'Meta mensual de facturación en pesos para el dashboard de métricas de leads. Define el objetivo de ventas mensual.',
                    tipo: 'DECIMAL',
                  });
                  setDialogOpen(true);
                }}
              >
                Crear META_PRESUPUESTO_MENSUAL
              </Button>
            )}
          </Stack>
        </Alert>
      ) : null}

      {/* Ayuda Rápida - Metas de unidades refrigeradas (Heladeras y Coolbox) */}
      {(() => {
        const metasRefrigerados: { clave: string; valor: string; tipo: 'STRING' | 'BOOLEAN' | 'INTEGER' | 'DECIMAL'; titulo: string; ayuda: string; descripcion: string }[] = [
          {
            clave: 'META_MENSUAL_UNIDADES_REFRIGERADAS_VENDEDOR',
            valor: '8',
            tipo: 'INTEGER',
            titulo: 'Meta base por vendedor',
            ayuda: 'Unidades netas (heladeras + coolbox) por vendedor/a por mes (ej: 8)',
            descripcion: 'Meta base mensual por vendedor de unidades netas de equipos refrigerados (heladeras + coolbox). Mismo valor para todos los vendedores.',
          },
          {
            clave: 'META_MENSUAL_UNIDADES_REFRIGERADAS_VENDEDOR_PRIMER_MES',
            valor: '5',
            tipo: 'INTEGER',
            titulo: 'Meta primer mes',
            ayuda: 'Meta reducida para vendedores en su primer mes de venta, por curva de aprendizaje (ej: 5)',
            descripcion: 'Meta mensual de unidades refrigeradas para vendedores en su primer mes de venta (curva de aprendizaje).',
          },
          {
            clave: 'META_MENSUAL_UNIDADES_REFRIGERADAS_VENDEDOR_SUPERADORA',
            valor: '20',
            tipo: 'INTEGER',
            titulo: 'Meta superadora',
            ayuda: 'Meta superadora individual por vendedor/a (ej: 20)',
            descripcion: 'Meta superadora mensual por vendedor de unidades netas de equipos refrigerados.',
          },
          {
            clave: 'META_MENSUAL_UNIDADES_REFRIGERADAS_TRAMOS',
            valor: '35-39,40-45,46-50,51-55,56-60',
            tipo: 'STRING',
            titulo: 'Metas grupales (tramos)',
            ayuda: 'Tramos de meta grupal como "min-max" separados por coma; cada tramo es Meta 1, Meta 2, ... (ej: 35-39,40-45,46-50,51-55,56-60)',
            descripcion: 'Tramos de meta grupal mensual de unidades refrigeradas, formato "min-max" separados por coma. Cada tramo es Meta 1, Meta 2, etc.',
          },
        ];
        const faltantes = metasRefrigerados.filter(m => !parameters.find(p => p.clave === m.clave));
        if (faltantes.length === 0) return null;
        return (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              🧊 Metas de Unidades Refrigeradas (Heladeras y Coolbox)
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Para ver el cumplimiento de metas individuales y grupales en "Unidades por Vendedor" (Registro de Ventas) y en el dashboard, cree los siguientes parámetros:
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              {faltantes.map(m => (
                <Box key={m.clave} sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="600">• {m.clave}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {m.titulo}: {m.ayuda}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {faltantes.map(m => (
                <Button
                  key={m.clave}
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  fullWidth={isMobile}
                  onClick={() => {
                    setEditingParameter(null);
                    setFormData({
                      clave: m.clave,
                      valor: m.valor,
                      descripcion: m.descripcion,
                      tipo: m.tipo,
                    });
                    setDialogOpen(true);
                  }}
                >
                  Crear {m.titulo}
                </Button>
              ))}
            </Stack>
          </Alert>
        );
      })()}

      {/* Ayuda Rápida - Parámetros de Cálculo de Precios */}
      {!parameters.find(p => p.clave === 'PORCENTAJE_GANANCIA') || !parameters.find(p => p.clave === 'REDONDEO_PRECIO') ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            💰 Configuración de Calculo de Precios
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Para calcular automaticamente el precio de venta a partir del costo, configure los siguientes parametros:
          </Typography>
          <Box sx={{ ml: 2, mb: 2 }}>
            <Typography variant="body2" fontWeight="600">• PORCENTAJE_GANANCIA</Typography>
            <Typography variant="caption" color="text.secondary">
              Porcentaje de ganancia para calcular precio de venta (ej: 27.671993 para ~27.67%)
            </Typography>
            <br/>
            <Typography variant="body2" fontWeight="600" sx={{ mt: 1 }}>• REDONDEO_PRECIO</Typography>
            <Typography variant="caption" color="text.secondary">
              Factor de redondeo para el precio calculado (ej: 100 para redondear a centenas)
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {!parameters.find(p => p.clave === 'PORCENTAJE_GANANCIA') && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                fullWidth={isMobile}
                onClick={() => {
                  setEditingParameter(null);
                  setFormData({
                    clave: 'PORCENTAJE_GANANCIA',
                    valor: '27.671993',
                    descripcion: 'Porcentaje de ganancia para calcular el precio de venta a partir del costo. Formula: precio = costo * (1 + porcentaje/100)',
                    tipo: 'DECIMAL',
                  });
                  setDialogOpen(true);
                }}
              >
                Crear PORCENTAJE_GANANCIA
              </Button>
            )}
            {!parameters.find(p => p.clave === 'REDONDEO_PRECIO') && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                fullWidth={isMobile}
                onClick={() => {
                  setEditingParameter(null);
                  setFormData({
                    clave: 'REDONDEO_PRECIO',
                    valor: '100',
                    descripcion: 'Factor de redondeo para el precio de venta calculado. Ej: 10 redondea a decenas, 100 a centenas, 1000 a miles.',
                    tipo: 'INTEGER',
                  });
                  setDialogOpen(true);
                }}
              >
                Crear REDONDEO_PRECIO
              </Button>
            )}
          </Stack>
        </Alert>
      ) : null}

      {/* Ayuda Rápida - Parámetro de Fabricación */}
      {!parameters.find(p => p.clave === 'FABRICACION_DURACION_ESTIMADA_DIAS') ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            🏭 Configuración de Fabricación
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Define la duración estimada de fabricación de un equipo para calcular el avance previsto
            (Excelente / Atrasado / Crítico) en el listado de equipos:
          </Typography>
          <Box sx={{ ml: 2, mb: 2 }}>
            <Typography variant="body2" fontWeight="600">• FABRICACION_DURACION_ESTIMADA_DIAS</Typography>
            <Typography variant="caption" color="text.secondary">
              Días estimados para completar la fabricación de un equipo (ej: 7).
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            fullWidth={isMobile}
            onClick={() => {
              setEditingParameter(null);
              setFormData({
                clave: 'FABRICACION_DURACION_ESTIMADA_DIAS',
                valor: '7',
                descripcion: 'Duración estimada (en días) de la fabricación de un equipo. Se utiliza para calcular el avance previsto en el listado de equipos fabricados.',
                tipo: 'INTEGER',
              });
              setDialogOpen(true);
            }}
          >
            Crear FABRICACION_DURACION_ESTIMADA_DIAS
          </Button>
        </Alert>
      ) : null}

      {/* Ayuda Rápida - Parámetros de Cobranza */}
      {!parameters.find(p => p.clave === 'COBRANZA_DIAS_MORA_AGENDA') || !parameters.find(p => p.clave === 'COBRANZA_DIAS_PREVENTIVO') ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            📞 Configuración de Cobranza
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Controlan la "Agenda de hoy" de Gestiones de Cobranza. Si no se crean, el sistema usa
            los valores por defecto (90 y 3).
          </Typography>
          <Box sx={{ ml: 2, mb: 2 }}>
            <Typography variant="body2" fontWeight="600">• COBRANZA_DIAS_MORA_AGENDA</Typography>
            <Typography variant="caption" color="text.secondary">
              Días de mora a partir de los cuales una gestión sale de la "Agenda de hoy" y pasa a
              "Mora prolongada" (ej: 90). Subilo si tu cartera está muy atrasada y querés ver más en la agenda diaria.
            </Typography>
            <br/>
            <Typography variant="body2" fontWeight="600" sx={{ mt: 1 }}>• COBRANZA_DIAS_PREVENTIVO</Typography>
            <Typography variant="caption" color="text.secondary">
              Días de anticipación con que se abre la gestión antes del vencimiento de cada cuota (ej: 3).
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {!parameters.find(p => p.clave === 'COBRANZA_DIAS_MORA_AGENDA') && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                fullWidth={isMobile}
                onClick={() => {
                  setEditingParameter(null);
                  setFormData({
                    clave: 'COBRANZA_DIAS_MORA_AGENDA',
                    valor: '90',
                    descripcion: 'Días de mora a partir de los cuales una gestión sale de la "Agenda de hoy" de cobranza y pasa al filtro "Mora prolongada". Configurable por empresa.',
                    tipo: 'INTEGER',
                  });
                  setDialogOpen(true);
                }}
              >
                Crear COBRANZA_DIAS_MORA_AGENDA
              </Button>
            )}
            {!parameters.find(p => p.clave === 'COBRANZA_DIAS_PREVENTIVO') && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                fullWidth={isMobile}
                onClick={() => {
                  setEditingParameter(null);
                  setFormData({
                    clave: 'COBRANZA_DIAS_PREVENTIVO',
                    valor: '3',
                    descripcion: 'Días de anticipación con que el motor abre la gestión de cobranza antes del vencimiento de cada cuota. Configurable por empresa.',
                    tipo: 'INTEGER',
                  });
                  setDialogOpen(true);
                }}
              >
                Crear COBRANZA_DIAS_PREVENTIVO
              </Button>
            )}
          </Stack>
        </Alert>
      ) : null}

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
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: { xs: 700, md: 'auto' } }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Clave</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Valor</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Descripción</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 80 }}>Acciones</TableCell>
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
                            <IconButton
                              size="small"
                              onClick={() => setDeleteTarget(param)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
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
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 3 },
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
              helperText="Identificador único del parámetro (ej: META_MENSUAL_LEADS)"
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

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar parámetro</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Eliminar el parámetro <strong>{deleteTarget?.clave}</strong>? Las pantallas que lo
            usan dejarán de mostrar su métrica/meta.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit" disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={deleting}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
