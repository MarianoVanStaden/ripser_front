/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
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
import ConfirmDialog from '../common/ConfirmDialog';
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
  const [tareaToDelete, setTareaToDelete] = useState<TareaPuestoDTO | null>(null);
  const [tareaDeleteLoading, setTareaDeleteLoading] = useState(false);
  const [subtareaToDelete, setSubtareaToDelete] = useState<
    { tareaId: number; subtarea: SubtareaPuestoDTO } | null
  >(null);
  const [subtareaDeleteLoading, setSubtareaDeleteLoading] = useState(false);

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
    // Lazy-load versiones cuando se abre la pestaña (ahora index 2)
    if (newValue === 2 && versiones.length === 0) {
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

  const handleDeleteTarea = (tareaId: number) => {
    const tarea = puesto?.tareas?.find((t) => t.id === tareaId);
    if (tarea) setTareaToDelete(tarea);
  };

  const handleConfirmDeleteTarea = async () => {
    if (!tareaToDelete) return;
    setTareaDeleteLoading(true);
    try {
      await puestoApi.deleteTarea(puestoId, tareaToDelete.id);
      await loadData();
      setSnackbar({ open: true, message: 'Tarea eliminada', severity: 'success' });
      setTareaToDelete(null);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Error al eliminar la tarea', severity: 'error' });
    } finally {
      setTareaDeleteLoading(false);
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

  const handleDeleteSubtarea = (tareaId: number, subtareaId: number) => {
    const tarea = puesto?.tareas?.find((t) => t.id === tareaId);
    const subtarea = tarea?.subtareas?.find((s) => s.id === subtareaId);
    if (subtarea) setSubtareaToDelete({ tareaId, subtarea });
  };

  const handleConfirmDeleteSubtarea = async () => {
    if (!subtareaToDelete) return;
    setSubtareaDeleteLoading(true);
    try {
      await puestoApi.deleteSubtarea(puestoId, subtareaToDelete.tareaId, subtareaToDelete.subtarea.id);
      await loadData();
      setSnackbar({ open: true, message: 'Subtarea eliminada', severity: 'success' });
      setSubtareaToDelete(null);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Error al eliminar la subtarea', severity: 'error' });
    } finally {
      setSubtareaDeleteLoading(false);
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
              <Typography variant="caption" color="textSecondary">Área</Typography>
              <Typography variant="body1" fontWeight="600">
                {puesto.areaNombre || puesto.departamento || 'Sin asignar'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="textSecondary">Departamento</Typography>
              <Typography variant="body1" fontWeight="600">
                {puesto.departamentoNombre || puesto.departamento || 'Sin asignar'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="textSecondary">Sector</Typography>
              <Typography variant="body1" fontWeight="600">{puesto.sectorNombre || '—'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="textSecondary">Banda / Nivel</Typography>
              <Typography variant="body1" fontWeight="600">
                {puesto.bandaJerarquicaCodigo ? `${puesto.bandaJerarquicaCodigo} · ` : ''}
                {puesto.nivelJerarquicoNombre || '—'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="textSecondary">Reporta a</Typography>
              <Typography variant="body1" fontWeight="600">
                {puesto.reportaAPuestoNombre || '—'}
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
              <Typography variant="caption" color="textSecondary">Volumen dotación / CIUO</Typography>
              <Typography variant="body1" fontWeight="600">
                {puesto.volumenDotacion ?? '—'}
                {puesto.ciuo ? ` · CIUO ${puesto.ciuo}` : ''}
              </Typography>
            </Grid>
            {puesto.mision && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="textSecondary">Misión</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 0.5, fontStyle: 'italic' }}>
                  {puesto.mision}
                </Typography>
              </Grid>
            )}
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
          <Tab icon={<WorkIcon />} iconPosition="start" label="Manual" />
          <Tab icon={<AssignmentIcon />} iconPosition="start" label={`Tareas (${puesto.tareas?.length || 0})`} />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Versiones" />
        </Tabs>

        {/* Tab 0: Manual de Puestos — secciones del Excel */}
        <TabPanel value={tabValue} index={0}>
          <Box px={2} pb={2}>
            {(!puesto.objetivos?.length
              && !puesto.responsabilidades?.length
              && !puesto.habilidades?.length
              && !puesto.conocimientos?.length
              && !puesto.contactos?.length
              && !puesto.competencias?.length
              && !puesto.riesgos?.length
              && !puesto.epps?.length
              && !puesto.reemplaza?.length
              && !puesto.nivelEducacionNombre
              && !puesto.tipoFormacionNombre
              && !puesto.nivelExperienciaNombre
              && !puesto.observacionesRequisitos
              && !puesto.fechaRevision
            ) && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Aún no se cargaron las secciones del Manual. Editá el puesto para completarlas.
              </Alert>
            )}

            {/* Objetivos específicos */}
            {!!puesto.objetivos?.length && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Objetivos específicos ({puesto.objetivos.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <ol style={{ marginTop: 0 }}>
                    {puesto.objetivos.map((o) => (
                      <li key={o.id ?? Math.random()}>
                        <Typography variant="body2">{o.descripcion}</Typography>
                      </li>
                    ))}
                  </ol>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Responsabilidad y Autoridad */}
            {!!puesto.responsabilidades?.length && (
              <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Responsabilidad y Autoridad ({puesto.responsabilidades.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {['RESPONSABILIDAD', 'AUTORIDAD'].map((t) => {
                    const items = puesto.responsabilidades!.filter((r) => r.tipo === t);
                    if (!items.length) return null;
                    return (
                      <Box key={t} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t === 'RESPONSABILIDAD' ? 'Responsabilidades' : 'Autoridades'}
                        </Typography>
                        <ul>
                          {items.map((r) => (
                            <li key={r.id ?? Math.random()}>
                              <Typography variant="body2">{r.descripcion}</Typography>
                            </li>
                          ))}
                        </ul>
                      </Box>
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Competencias */}
            {!!puesto.competencias?.length && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Competencias ({puesto.competencias.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Competencia</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell align="center">Nivel requerido</TableCell>
                          <TableCell>Observaciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {puesto.competencias.map((c) => (
                          <TableRow key={c.id ?? c.competenciaId}>
                            <TableCell>{c.competenciaNombre}</TableCell>
                            <TableCell><Chip size="small" label={c.competenciaTipo} /></TableCell>
                            <TableCell align="center">
                              <Chip size="small" color="primary" label={`Nivel ${c.nivelRequerido ?? '—'}`} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {c.observaciones ?? '—'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Habilidades y Conocimientos */}
            {(!!puesto.habilidades?.length || !!puesto.conocimientos?.length) && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>
                    Habilidades ({puesto.habilidades?.length ?? 0}) y Conocimientos ({puesto.conocimientos?.length ?? 0})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Habilidades</Typography>
                      {puesto.habilidades?.length ? (
                        <ul>
                          {puesto.habilidades.map((h) => (
                            <li key={h.id ?? Math.random()}>
                              <Typography variant="body2">{h.descripcion}</Typography>
                            </li>
                          ))}
                        </ul>
                      ) : <Typography variant="body2" color="text.secondary">—</Typography>}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Conocimientos</Typography>
                      {puesto.conocimientos?.length ? (
                        <ul>
                          {puesto.conocimientos.map((c) => (
                            <li key={c.id ?? Math.random()}>
                              <Typography variant="body2">{c.descripcion}</Typography>
                            </li>
                          ))}
                        </ul>
                      ) : <Typography variant="body2" color="text.secondary">—</Typography>}
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Interacción Social */}
            {!!puesto.contactos?.length && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Interacción Social ({puesto.contactos.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {['INTERNO', 'EXTERNO'].map((t) => {
                    const items = puesto.contactos!.filter((c) => c.tipo === t);
                    if (!items.length) return null;
                    return (
                      <Box key={t} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t === 'INTERNO' ? 'Contactos internos' : 'Contactos externos'}
                        </Typography>
                        <ul>
                          {items.map((c) => (
                            <li key={c.id ?? Math.random()}>
                              <Typography variant="body2">{c.descripcion}</Typography>
                            </li>
                          ))}
                        </ul>
                      </Box>
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Riesgos y EPP */}
            {(!!puesto.riesgos?.length || !!puesto.epps?.length) && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>
                    Riesgos ({puesto.riesgos?.length ?? 0}) y EPP ({puesto.epps?.length ?? 0})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Riesgos</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        {puesto.riesgos?.map((r) => (
                          <Chip
                            key={r.id ?? r.riesgoId}
                            label={`${r.riesgoNombre}${r.nivelSeveridad ? ` · ${r.nivelSeveridad}` : ''}`}
                            color={
                              r.nivelSeveridad === 'CRITICO' ? 'error'
                              : r.nivelSeveridad === 'ALTO' ? 'warning'
                              : 'default'
                            }
                            size="small"
                          />
                        ))}
                        {!puesto.riesgos?.length && <Typography variant="body2" color="text.secondary">—</Typography>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">EPP</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        {puesto.epps?.map((e) => (
                          <Chip
                            key={e.id ?? e.eppId}
                            label={`${e.eppNombre}${e.obligatorio ? ' (obligatorio)' : ''}`}
                            variant={e.obligatorio ? 'filled' : 'outlined'}
                            size="small"
                          />
                        ))}
                        {!puesto.epps?.length && <Typography variant="body2" color="text.secondary">—</Typography>}
                      </Stack>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Requerimientos */}
            {(puesto.nivelEducacionNombre
              || puesto.tipoFormacionNombre
              || puesto.nivelExperienciaNombre
              || puesto.observacionesRequisitos
            ) && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Requerimientos</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="textSecondary">Nivel de Educación</Typography>
                      <Typography variant="body2">{puesto.nivelEducacionNombre ?? '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="textSecondary">Tipo de Formación</Typography>
                      <Typography variant="body2">{puesto.tipoFormacionNombre ?? '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="textSecondary">Nivel de Experiencia</Typography>
                      <Typography variant="body2">{puesto.nivelExperienciaNombre ?? '—'}</Typography>
                    </Grid>
                    {puesto.observacionesRequisitos && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">Observaciones</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          {puesto.observacionesRequisitos}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Reemplazos */}
            {(!!puesto.reemplaza?.length || !!puesto.reemplazadoPor?.length) && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>
                    Reemplazos · reemplaza a {puesto.reemplaza?.length ?? 0} · reemplazado por {puesto.reemplazadoPor?.length ?? 0}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Reemplaza a</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        {puesto.reemplaza?.map((r) => (
                          <Chip key={r.id ?? r.puestoRelacionadoId} label={r.puestoRelacionadoNombre} size="small" />
                        ))}
                        {!puesto.reemplaza?.length && <Typography variant="body2" color="text.secondary">—</Typography>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Reemplazado por</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        {puesto.reemplazadoPor?.map((r) => (
                          <Chip key={r.id ?? r.puestoRelacionadoId} label={r.puestoRelacionadoNombre} size="small" />
                        ))}
                        {!puesto.reemplazadoPor?.length && <Typography variant="body2" color="text.secondary">—</Typography>}
                      </Stack>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Revisión */}
            {puesto.fechaRevision && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="textSecondary">Última revisión: </Typography>
                <Typography component="span" variant="body2">
                  {dayjs(puesto.fechaRevision).format('DD/MM/YYYY')}
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Tab 1: Tareas */}
        <TabPanel value={tabValue} index={1}>
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

        {/* Tab 2: Versiones */}
        <TabPanel value={tabValue} index={2}>
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

      <ConfirmDialog
        open={!!tareaToDelete}
        onClose={() => setTareaToDelete(null)}
        onConfirm={handleConfirmDeleteTarea}
        title="¿Eliminar tarea?"
        severity="error"
        warning="Se eliminarán también las subtareas asociadas. Esta acción no se puede deshacer."
        description="Está a punto de eliminar la siguiente tarea del puesto:"
        itemDetails={
          tareaToDelete && (
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {tareaToDelete.nombre}
            </Typography>
          )
        }
        confirmLabel="Eliminar"
        loadingLabel="Eliminando…"
        loading={tareaDeleteLoading}
      />

      <ConfirmDialog
        open={!!subtareaToDelete}
        onClose={() => setSubtareaToDelete(null)}
        onConfirm={handleConfirmDeleteSubtarea}
        title="¿Eliminar subtarea?"
        severity="error"
        warning="Esta acción no se puede deshacer."
        description="Está a punto de eliminar la siguiente subtarea:"
        itemDetails={
          subtareaToDelete && (
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {subtareaToDelete.subtarea.nombre}
            </Typography>
          )
        }
        confirmLabel="Eliminar"
        loadingLabel="Eliminando…"
        loading={subtareaDeleteLoading}
      />

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
