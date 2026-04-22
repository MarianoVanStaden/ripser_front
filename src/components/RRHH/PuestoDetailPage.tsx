// @ts-nocheck - Temporary: MUI v7 Grid compatibility issue
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  Chip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
  ExpandMore as ExpandMoreIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { puestoApi } from '../../api/services/puestoApi';
import { usePermisos } from '../../hooks/usePermisos';
import type { PuestoResponseDTO, TareaPuestoDTO, SubtareaPuestoDTO, PuestoVersionDTO } from '../../types';
import { formatPrice } from '../../utils/priceCalculations';
import PuestoFormDialog from './PuestoFormDialog';
import TareaFormDialog from './TareaFormDialog';
import SubtareaFormDialog from './SubtareaFormDialog';
import LoadingOverlay from '../common/LoadingOverlay';
import dayjs from 'dayjs';

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

const PuestoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tieneRol } = usePermisos();
  const canWrite = tieneRol('ADMIN', 'ADMIN_EMPRESA');

  const [puesto, setPuesto] = useState<PuestoResponseDTO | null>(null);
  const [versiones, setVersiones] = useState<PuestoVersionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Dialogs
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [tareaFormOpen, setTareaFormOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState<TareaPuestoDTO | null>(null);
  const [subtareaFormOpen, setSubtareaFormOpen] = useState(false);
  const [editingSubtarea, setEditingSubtarea] = useState<SubtareaPuestoDTO | null>(null);
  const [subtareaParentTareaId, setSubtareaParentTareaId] = useState<number>(0);
  const [versionSnapshotOpen, setVersionSnapshotOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');

  const puestoId = Number(id);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await puestoApi.getById(puestoId);
      setPuesto(data);
    } catch (err) {
      console.error('Error loading puesto:', err);
      setError('Error al cargar el puesto');
    } finally {
      setLoading(false);
    }
  };

  const loadVersiones = async () => {
    try {
      const data = await puestoApi.getVersiones(puestoId);
      setVersiones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading versiones:', err);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1 && versiones.length === 0) {
      loadVersiones();
    }
  };

  // PDF download
  const handleDownloadPdf = async () => {
    try {
      const blob = await puestoApi.downloadPdf(puestoId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `puesto_${puesto?.nombre || puestoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSnackbar({ open: true, message: 'Error al descargar el PDF', severity: 'error' });
    }
  };

  // Edit puesto
  const handlePuestoSaved = async () => {
    await loadData();
    setEditFormOpen(false);
    setSnackbar({ open: true, message: 'Puesto actualizado', severity: 'success' });
  };

  // Tarea CRUD
  const handleOpenTareaForm = (tarea?: TareaPuestoDTO) => {
    setEditingTarea(tarea || null);
    setTareaFormOpen(true);
  };

  const handleTareaSaved = async () => {
    await loadData();
    setTareaFormOpen(false);
    setEditingTarea(null);
    setSnackbar({ open: true, message: 'Tarea guardada', severity: 'success' });
  };

  const handleDeleteTarea = async (tareaId: number) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await puestoApi.deleteTarea(puestoId, tareaId);
      await loadData();
      setSnackbar({ open: true, message: 'Tarea eliminada', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Error al eliminar la tarea', severity: 'error' });
    }
  };

  // Subtarea CRUD
  const handleOpenSubtareaForm = (tareaId: number, subtarea?: SubtareaPuestoDTO) => {
    setSubtareaParentTareaId(tareaId);
    setEditingSubtarea(subtarea || null);
    setSubtareaFormOpen(true);
  };

  const handleSubtareaSaved = async () => {
    await loadData();
    setSubtareaFormOpen(false);
    setEditingSubtarea(null);
    setSnackbar({ open: true, message: 'Subtarea guardada', severity: 'success' });
  };

  const handleDeleteSubtarea = async (tareaId: number, subtareaId: number) => {
    if (!window.confirm('¿Eliminar esta subtarea?')) return;
    try {
      await puestoApi.deleteSubtarea(puestoId, tareaId, subtareaId);
      await loadData();
      setSnackbar({ open: true, message: 'Subtarea eliminada', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Error al eliminar la subtarea', severity: 'error' });
    }
  };

  // Version snapshot
  const handleViewSnapshot = (snapshot: string) => {
    setSelectedSnapshot(snapshot);
    setVersionSnapshotOpen(true);
  };

  if (loading) {
    return <LoadingOverlay open={true} message="Cargando puesto..." />;
  }

  if (error || !puesto) {
    return (
      <Box p={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/rrhh/puestos')} sx={{ mb: 2 }}>
          Volver
        </Button>
        <Alert severity="error">{error || 'Puesto no encontrado'}</Alert>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/rrhh/puestos')}>
            <ArrowBackIcon />
          </IconButton>
          <WorkIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">{puesto.nombre}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`v${puesto.version}`} size="small" variant="outlined" />
              {puesto.activo ? (
                <Chip icon={<CheckCircleIcon />} label="Activo" color="success" size="small" />
              ) : (
                <Chip icon={<CancelIcon />} label="Inactivo" color="error" size="small" />
              )}
            </Stack>
          </Box>
        </Box>
        {canWrite && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleDownloadPdf}>
              PDF
            </Button>
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditFormOpen(true)}>
              Editar
            </Button>
          </Stack>
        )}
      </Box>

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="textSecondary">Departamento</Typography>
              <Typography variant="body1" fontWeight="600">
                {puesto.departamento || 'Sin asignar'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="textSecondary">Salario Base</Typography>
              <Typography variant="body1" fontWeight="600" color="success.main">
                {formatPrice(puesto.salarioBase || 0)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="textSecondary">Empleados</Typography>
              <Typography variant="body1" fontWeight="600">{puesto.cantidadEmpleados}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="textSecondary">Tareas</Typography>
              <Typography variant="body1" fontWeight="600">{puesto.tareas?.length || 0}</Typography>
            </Grid>
            {puesto.descripcion && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="textSecondary">Descripción</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 0.5 }}>
                  {puesto.descripcion}
                </Typography>
              </Grid>
            )}
            {puesto.objetivoGeneral && (
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="textSecondary">Objetivo General</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 0.5 }}>
                  {puesto.objetivoGeneral}
                </Typography>
              </Grid>
            )}
            {puesto.requisitos && (
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="textSecondary">Requisitos</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 0.5 }}>
                  {puesto.requisitos}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab icon={<AssignmentIcon />} iconPosition="start" label={`Tareas (${puesto.tareas?.length || 0})`} />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Versiones" />
        </Tabs>

        {/* Tab 0: Tareas */}
        <TabPanel value={tabValue} index={0}>
          <Box px={2} pb={2}>
            {canWrite && (
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenTareaForm()}>
                  Nueva Tarea
                </Button>
              </Box>
            )}

            {!puesto.tareas || puesto.tareas.length === 0 ? (
              <Alert severity="info">No hay tareas definidas para este puesto.</Alert>
            ) : (
              puesto.tareas
                .sort((a, b) => a.orden - b.orden)
                .map((tarea) => (
                  <Accordion key={tarea.id} defaultExpanded={false} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" gap={1} flex={1} mr={1}>
                        <Typography fontWeight="600" flex={1}>
                          {tarea.orden}. {tarea.nombre}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          {tarea.obligatoria && (
                            <Chip label="Obligatoria" size="small" color="warning" />
                          )}
                          {!tarea.activo && (
                            <Chip label="Inactiva" size="small" color="error" />
                          )}
                          <Chip
                            label={`${tarea.subtareas?.length || 0} subtareas`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {tarea.descripcion && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          {tarea.descripcion}
                        </Typography>
                      )}

                      {/* Actions for tarea */}
                      {canWrite && (
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenTareaForm(tarea)}>
                            Editar
                          </Button>
                          <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteTarea(tarea.id)}>
                            Eliminar
                          </Button>
                          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenSubtareaForm(tarea.id)}>
                            Subtarea
                          </Button>
                        </Stack>
                      )}

                      {/* Subtareas list */}
                      {tarea.subtareas && tarea.subtareas.length > 0 && (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell align="center">Obligatoria</TableCell>
                                <TableCell align="center">Estado</TableCell>
                                {canWrite && <TableCell align="center">Acciones</TableCell>}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {tarea.subtareas
                                .sort((a, b) => a.orden - b.orden)
                                .map((sub) => (
                                  <TableRow key={sub.id} hover>
                                    <TableCell>{sub.orden}</TableCell>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight="500">{sub.nombre}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="textSecondary">
                                        {sub.descripcion || '-'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      {sub.obligatoria ? (
                                        <Chip label="Sí" size="small" color="warning" />
                                      ) : (
                                        <Chip label="No" size="small" variant="outlined" />
                                      )}
                                    </TableCell>
                                    <TableCell align="center">
                                      {sub.activo ? (
                                        <Chip label="Activa" size="small" color="success" />
                                      ) : (
                                        <Chip label="Inactiva" size="small" color="error" />
                                      )}
                                    </TableCell>
                                    {canWrite && (
                                      <TableCell align="center">
                                        <Tooltip title="Editar">
                                          <IconButton size="small" onClick={() => handleOpenSubtareaForm(tarea.id, sub)}>
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                          <IconButton size="small" color="error" onClick={() => handleDeleteSubtarea(tarea.id, sub.id)}>
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))
            )}
          </Box>
        </TabPanel>

        {/* Tab 1: Versiones */}
        <TabPanel value={tabValue} index={1}>
          <Box px={2} pb={2}>
            {versiones.length === 0 ? (
              <Alert severity="info">No hay versiones registradas.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Versión</TableCell>
                      <TableCell>Motivo del Cambio</TableCell>
                      <TableCell>Creado Por</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {versiones.map((ver) => (
                      <TableRow key={ver.id} hover>
                        <TableCell>
                          <Chip label={`v${ver.version}`} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{ver.motivoCambio || '-'}</TableCell>
                        <TableCell>{ver.creadoPor || '-'}</TableCell>
                        <TableCell>
                          {ver.fechaCreacion ? dayjs(ver.fechaCreacion).format('DD/MM/YYYY HH:mm') : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            onClick={() => handleViewSnapshot(ver.snapshot)}
                          >
                            Ver Snapshot
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </TabPanel>
      </Card>

      {/* Edit Puesto Dialog */}
      <PuestoFormDialog
        open={editFormOpen}
        puestoId={puestoId}
        onClose={() => setEditFormOpen(false)}
        onSave={handlePuestoSaved}
      />

      {/* Tarea Form Dialog */}
      <TareaFormDialog
        open={tareaFormOpen}
        puestoId={puestoId}
        tarea={editingTarea}
        onClose={() => { setTareaFormOpen(false); setEditingTarea(null); }}
        onSave={handleTareaSaved}
      />

      {/* Subtarea Form Dialog */}
      <SubtareaFormDialog
        open={subtareaFormOpen}
        puestoId={puestoId}
        tareaId={subtareaParentTareaId}
        subtarea={editingSubtarea}
        onClose={() => { setSubtareaFormOpen(false); setEditingSubtarea(null); }}
        onSave={handleSubtareaSaved}
      />

      {/* Version Snapshot Dialog */}
      <Dialog open={versionSnapshotOpen} onClose={() => setVersionSnapshotOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Snapshot de Versión</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              maxHeight: '60vh',
              overflow: 'auto',
            }}
          >
            {(() => {
              try {
                return JSON.stringify(JSON.parse(selectedSnapshot), null, 2);
              } catch {
                return selectedSnapshot;
              }
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionSnapshotOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PuestoDetailPage;
