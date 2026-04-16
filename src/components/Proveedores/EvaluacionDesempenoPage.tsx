import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Rating,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Divider,
  Stack,
  CircularProgress,
  Grid,
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  StarRate as StarRateIcon,
  TrendingUp,
  TrendingDown,
  PictureAsPdf as PdfIcon,
  TableChart as TableChartIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { supplierApiWithFallback } from '../../api/services/apiWithFallback';
import evaluacionProveedorApi, { CriterioEvaluacion } from '../../api/services/evaluacionProveedorApi';
import type {
  EvaluacionProveedorDTO,
  EvaluacionCreateDTO,
  EstadisticasEvaluacionDTO,
} from '../../api/services/evaluacionProveedorApi';
import type { ProveedorDTO } from '../../types';
import { exportToPDF } from '../../utils/exportPDF';
import { exportToExcel } from '../../utils/exportExcel';


const EvaluacionDesempenoPage = () => {
  const [suppliers, setSuppliers] = useState<ProveedorDTO[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionProveedorDTO[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasEvaluacionDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<EvaluacionCreateDTO>({
    proveedorId: 0,
    calificacion: 0,
    comentario: '',
    criterio: CriterioEvaluacion.CALIDAD,
    evaluadoPor: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const exportMenuOpen = Boolean(exportAnchorEl);
  const [formErrors, setFormErrors] = useState<{ calificacion?: string; evaluadoPor?: string }>({});

  // Helper to get evaluations for the selected supplier (typed)
  const getSupplierEvaluations = (supplierId: number | ''): EvaluacionProveedorDTO[] => {
    if (!supplierId) return [];
    // Ensure evaluaciones is always an array
    if (!Array.isArray(evaluaciones)) {
      console.error('evaluaciones is not an array:', evaluaciones);
      return [];
    }
    return evaluaciones.filter((e) => e.proveedorId === Number(supplierId));
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (selectedSupplier) {
      loadEvaluaciones();
      loadEstadisticas();
    }
  }, [selectedSupplier]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierApiWithFallback.getAll();
      console.log('Proveedores cargados:', data);
      // API returns ProveedorDTO[]
      const suppliersArray = data as ProveedorDTO[];
      setSuppliers(suppliersArray);
      if (suppliersArray.length > 0) {
        setSelectedSupplier(suppliersArray[0].id || '');
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluaciones = async () => {
    if (!selectedSupplier) return;
    
    try {
      setLoading(true);
      const data = await evaluacionProveedorApi.obtenerPorProveedor(Number(selectedSupplier));
      console.log('Evaluaciones cargadas:', data);
      
      // Validate data is array and check for duplicates
      if (!Array.isArray(data)) {
        console.error('Expected array but got:', typeof data);
        setEvaluaciones([]);
        return;
      }

      // Check for duplicate IDs
      const ids = data.map(e => e.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      
      if (duplicates.length > 0) {
        console.warn('⚠️ Duplicate evaluation IDs found:', duplicates);
        // Remove duplicates, keeping the most recent
        const uniqueData = data.filter((item, index, self) =>
          index === self.findIndex(t => t.id === item.id)
        );
        setEvaluaciones(uniqueData);
      } else {
        setEvaluaciones(data);
      }
      
    } catch (error) {
      console.error('Error loading evaluaciones:', error);
      setEvaluaciones([]);
      setSnackbar({
        open: true,
        message: 'Error al cargar las evaluaciones',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEstadisticas = async () => {
    if (!selectedSupplier) return;
    
    try {
      const data = await evaluacionProveedorApi.obtenerEstadisticas(Number(selectedSupplier));
      setEstadisticas(data);
    } catch (error) {
      console.error('Error loading estadísticas:', error);
      // Si no hay evaluaciones, las estadísticas pueden fallar
      setEstadisticas(null);
    }
  };


  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNewEvaluation = () => {
    setFormData({
      proveedorId: Number(selectedSupplier),
      calificacion: 0,
      comentario: '',
      criterio: CriterioEvaluacion.CALIDAD,
      evaluadoPor: '',
    });
    setEditingId(null);
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSaveEvaluation = async () => {
    const errors: { calificacion?: string; evaluadoPor?: string } = {};

    if (formData.calificacion < 0 || formData.calificacion > 5) {
      errors.calificacion = 'La calificación debe estar entre 0 y 5.';
    }
    if (!formData.evaluadoPor.trim()) {
      errors.evaluadoPor = 'El nombre del evaluador es obligatorio.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    try {
      if (editingId) {
        // La API no tiene endpoint de actualización, así que eliminamos y creamos
        await evaluacionProveedorApi.eliminar(editingId);
      }

      await evaluacionProveedorApi.crear(formData);

      // Recargar evaluaciones y estadísticas
      await loadEvaluaciones();
      await loadEstadisticas();

      setDialogOpen(false);
      setFormData({
        proveedorId: Number(selectedSupplier),
        calificacion: 0,
        comentario: '',
        criterio: CriterioEvaluacion.CALIDAD,
        evaluadoPor: '',
      });
      setEditingId(null);
      setSnackbar({
        open: true,
        message: editingId ? 'Evaluación actualizada correctamente.' : 'Evaluación guardada correctamente.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving evaluation:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar la evaluación.',
        severity: 'error',
      });
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'error';
  };

  // Export handlers
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportPDF = () => {
    const supplierName = suppliers.find(s => s.id === selectedSupplier)?.razonSocial || 'Proveedor';
    const columns = ['Fecha', 'Criterio', 'Calificación', 'Comentario', 'Evaluado Por'];
    const rows = evaluaciones.map(evaluacion => [
      evaluacion.fechaEvaluacion ? new Date(evaluacion.fechaEvaluacion).toLocaleDateString('es-AR') : 'N/A',
      evaluacion.criterio || 'N/A',
      `${evaluacion.calificacion}/5`,
      evaluacion.comentario || '',
      evaluacion.evaluadoPor || 'N/A'
    ]);

    exportToPDF({
      title: 'Evaluación de Desempeño',
      subtitle: `Proveedor: ${supplierName}`,
      fileName: `evaluacion_${supplierName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
      tables: [{
        headers: columns,
        rows: rows,
        footerText: `Total de evaluaciones: ${evaluaciones.length} | Calificación general: ${estadisticas?.calificacionGeneral?.toFixed(2) || 'N/A'}`
      }]
    });
    handleExportClose();
  };

  const handleExportExcel = async () => {
    const supplierName = suppliers.find(s => s.id === selectedSupplier)?.razonSocial || 'Proveedor';
    const excelData = evaluaciones.map(evaluacion => ({
      'Fecha': evaluacion.fechaEvaluacion ? new Date(evaluacion.fechaEvaluacion).toLocaleDateString('es-AR') : 'N/A',
      'Criterio': evaluacion.criterio || 'N/A',
      'Calificación': evaluacion.calificacion,
      'Comentario': evaluacion.comentario || '',
      'Evaluado Por': evaluacion.evaluadoPor || 'N/A'
    }));

    await exportToExcel({
      fileName: `evaluacion_${supplierName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
      sheets: [{
        name: 'Evaluaciones',
        data: excelData
      }],
      metadata: {
        title: `Evaluación de Desempeño - ${supplierName}`
      }
    });
    handleExportClose();
  };


  const renderOverviewTab = () => {
    const supplierName = suppliers.find(s => s.id === selectedSupplier)?.razonSocial || 'este proveedor';
    
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (evaluaciones.length === 0) {
      return (
        <Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            No hay evaluaciones disponibles para <strong>{supplierName}</strong>.
            <Button onClick={handleNewEvaluation} sx={{ ml: 1 }}>
              Crear primera evaluación
            </Button>
          </Alert>
        </Box>
      );
    }

    return (
      <Box>
        <Grid container spacing={3}>
          {/* Calificación General */}
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <StarRateIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Calificación General</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h3" color="primary">
                    {estadisticas?.calificacionGeneral?.toFixed(2) || '0.00'}
                  </Typography>
                  <Rating value={estadisticas?.calificacionGeneral || 0} precision={0.1} readOnly max={5} />
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Basado en {estadisticas?.totalEvaluaciones || 0} evaluación{estadisticas?.totalEvaluaciones !== 1 ? 'es' : ''}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Calificaciones por Criterio */}
          <Grid item xs={12} md={6} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Métricas por Criterio</Typography>
                <Stack spacing={2}>
                  {estadisticas?.calificacionesPorCriterio && Object.entries(estadisticas.calificacionesPorCriterio).map(([criterio, calificacion]) => (
                    <Box key={criterio}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">{criterio}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {calificacion.toFixed(2)}/5.00
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(calificacion / 5) * 100} 
                        color={getRatingColor(calificacion)}
                      />
                    </Box>
                  ))}
                  {(!estadisticas?.calificacionesPorCriterio || Object.keys(estadisticas.calificacionesPorCriterio).length === 0) && (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No hay datos disponibles
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Rango de Calificaciones */}
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Rango de Calificaciones</Typography>
                <Stack spacing={2}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingUp color="success" />
                      <Typography variant="body2">Máxima</Typography>
                    </Box>
                    <Typography variant="h5" color="success.main">
                      {estadisticas?.calificacionMaxima?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingDown color="error" />
                      <Typography variant="body2">Mínima</Typography>
                    </Box>
                    <Typography variant="h5" color="error.main">
                      {estadisticas?.calificacionMinima?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box p={{ xs: 1.5, sm: 2, md: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 2 
        }}
      >
        <Typography 
          variant="h4"
          sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}
        >
          Evaluación de Desempeño Proveedor
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportClick}
          disabled={!selectedSupplier}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Exportar
        </Button>
        <Menu
          anchorEl={exportAnchorEl}
          open={exportMenuOpen}
          onClose={handleExportClose}
        >
          <MenuItem onClick={handleExportPDF}>
            <ListItemIcon>
              <PdfIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Exportar a PDF</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleExportExcel}>
            <ListItemIcon>
              <TableChartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Exportar a Excel</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="supplier-select-label">Seleccionar Proveedor</InputLabel>
        <Select
          labelId="supplier-select-label"
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value ? Number(e.target.value) : '')}
          disabled={loading}
        >
          {suppliers.map((supplier) => (
            <MenuItem key={supplier.id} value={supplier.id}>
              {supplier.razonSocial}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Resumen" />
        <Tab label="Detalles" />
      </Tabs>

      {tabValue === 0 && renderOverviewTab()}

      {/* Detalles Tab - Tabla de Evaluaciones */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detalles de Evaluaciones
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Proveedor</TableCell>
                      <TableCell>Criterio</TableCell>
                      <TableCell>Calificación</TableCell>
                      <TableCell>Comentario</TableCell>
                      <TableCell>Evaluado Por</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSupplierEvaluations(selectedSupplier).map((evaluacion) => (
                      <TableRow key={evaluacion.id}>
                        <TableCell>{suppliers.find(s => s.id === evaluacion.proveedorId)?.razonSocial || 'Proveedor no encontrado'}</TableCell>
                        <TableCell>{evaluacion.criterio}</TableCell>
                        <TableCell>
                          <Rating value={evaluacion.calificacion} precision={0.1} readOnly max={5} />
                        </TableCell>
                        <TableCell>{evaluacion.comentario}</TableCell>
                        <TableCell>{evaluacion.evaluadoPor}</TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => {
                              setEditingId(evaluacion.id);
                              setFormData({
                                proveedorId: evaluacion.proveedorId,
                                calificacion: evaluacion.calificacion,
                                comentario: evaluacion.comentario,
                                criterio: evaluacion.criterio,
                                evaluadoPor: evaluacion.evaluadoPor,
                              });
                              setFormErrors({});
                              setDialogOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogo para Nueva Evaluación */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingId ? 'Editar Evaluación' : 'Nueva Evaluación'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Proveedor"
              value={suppliers.find(s => s.id === selectedSupplier)?.razonSocial || ''}
              InputProps={{ readOnly: true }}
            />
            <FormControl fullWidth>
              <InputLabel id="criterio-select-label">Criterio</InputLabel>
              <Select
                labelId="criterio-select-label"
                value={formData.criterio}
                onChange={(e) => setFormData({ ...formData, criterio: e.target.value as CriterioEvaluacion })}
              >
                {Object.values(CriterioEvaluacion).map((criterio) => (
                  <MenuItem key={criterio} value={criterio}>
                    {criterio}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Calificación (0 – 5)"
              type="number"
              value={formData.calificacion}
              onChange={(e) => {
                setFormData({ ...formData, calificacion: Number(e.target.value) });
                if (formErrors.calificacion) setFormErrors(prev => ({ ...prev, calificacion: undefined }));
              }}
              inputProps={{ min: 0, max: 5, step: 0.1 }}
              error={!!formErrors.calificacion}
              helperText={formErrors.calificacion}
            />
            <TextField
              label="Comentario"
              value={formData.comentario}
              onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
              multiline
              rows={4}
            />
            <TextField
              label="Evaluado Por"
              value={formData.evaluadoPor}
              onChange={(e) => {
                setFormData({ ...formData, evaluadoPor: e.target.value });
                if (formErrors.evaluadoPor) setFormErrors(prev => ({ ...prev, evaluadoPor: undefined }));
              }}
              required
              error={!!formErrors.evaluadoPor}
              helperText={formErrors.evaluadoPor}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSaveEvaluation} color="primary">
            {editingId ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Snackbar at the end of the component */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EvaluacionDesempenoPage;

/*
Nota: El backend está generando un error al comparar fechas. Asegúrate de que los tipos de datos coincidan entre el frontend y el backend.

El error es el siguiente:
java.lang.ClassCastException: Cannot cast java.time.LocalDate to java.time.LocalDateTime
*/
