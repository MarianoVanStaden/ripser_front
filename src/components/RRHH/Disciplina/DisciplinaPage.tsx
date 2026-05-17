import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  Dashboard as DashboardIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  FilterAlt as FilterAltIcon,
  Gavel as GavelIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { sancionApi } from '../../../api/services/sancionApi';
import { employeeApi } from '../../../api/services/employeeApi';
import {
  ESTADO_SANCION_COLOR,
  ESTADO_SANCION_LABEL,
  TIPO_SANCION_COLOR,
  TIPO_SANCION_LABEL,
  type EstadoSancion,
  type SancionDTO,
  type TipoSancion,
} from '../../../types/sancion.types';
import type { Empleado } from '../../../types';
import SancionFormDialog from './SancionFormDialog';
import SancionDetailDrawer from './SancionDetailDrawer';
import DisciplinaDashboard from './DisciplinaDashboard';
import ConfirmDialog from '../../common/ConfirmDialog';

type SortKey = 'fecha' | 'empleado' | 'tipo' | 'sector' | 'departamento' | 'dias';

const DisciplinaPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [tab, setTab] = useState<'lista' | 'dashboard'>('lista');
  const [sanciones, setSanciones] = useState<SancionDTO[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoSancion | 'TODOS'>('TODOS');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoSancion | 'TODOS'>('TODOS');
  const [sectorFiltro, setSectorFiltro] = useState<string>('TODOS');
  const [departamentoFiltro, setDepartamentoFiltro] = useState<string>('TODOS');
  const [desde, setDesde] = useState<string>('');
  const [hasta, setHasta] = useState<string>('');

  // Tabla
  const [orderBy, setOrderBy] = useState<SortKey>('fecha');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SancionDTO | null>(null);
  const [detail, setDetail] = useState<SancionDTO | null>(null);
  const [toDelete, setToDelete] = useState<SancionDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, emps] = await Promise.all([
        sancionApi.getAll(),
        employeeApi.getAllList(),
      ]);
      setSanciones(s);
      setEmpleados(emps);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Opciones de filtros derivadas
  const sectores = useMemo(() => {
    const s = new Set<string>();
    sanciones.forEach(x => { if (x.sector) s.add(x.sector); });
    return Array.from(s).sort();
  }, [sanciones]);

  const departamentos = useMemo(() => {
    const s = new Set<string>();
    sanciones.forEach(x => { if (x.departamento) s.add(x.departamento); });
    return Array.from(s).sort();
  }, [sanciones]);

  const motivosAcumSugeridos = useMemo(() => {
    const s = new Set<string>();
    sanciones.forEach(x => { if (x.motivoAcumulado) s.add(x.motivoAcumulado); });
    return Array.from(s).sort();
  }, [sanciones]);

  // Filtrar + ordenar
  const filtered = useMemo(() => {
    let rows = [...sanciones];

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(s =>
        `${s.empleadoNombre} ${s.empleadoApellido}`.toLowerCase().includes(q) ||
        s.empleadoDni?.toLowerCase().includes(q) ||
        s.motivo.toLowerCase().includes(q) ||
        s.motivoAcumulado?.toLowerCase().includes(q) ||
        s.pedidaPor?.toLowerCase().includes(q));
    }
    if (tipoFiltro !== 'TODOS') rows = rows.filter(r => r.tipo === tipoFiltro);
    if (estadoFiltro !== 'TODOS') rows = rows.filter(r => r.estado === estadoFiltro);
    if (sectorFiltro !== 'TODOS') rows = rows.filter(r => r.sector === sectorFiltro);
    if (departamentoFiltro !== 'TODOS') rows = rows.filter(r => r.departamento === departamentoFiltro);
    if (desde) rows = rows.filter(r => r.fecha >= desde);
    if (hasta) rows = rows.filter(r => r.fecha <= hasta);

    rows.sort((a, b) => {
      const mult = orderDir === 'asc' ? 1 : -1;
      switch (orderBy) {
        case 'fecha': return (a.fecha.localeCompare(b.fecha)) * mult;
        case 'empleado':
          return (`${a.empleadoApellido} ${a.empleadoNombre}`)
            .localeCompare(`${b.empleadoApellido} ${b.empleadoNombre}`) * mult;
        case 'tipo': return (a.tipo.localeCompare(b.tipo)) * mult;
        case 'sector': return ((a.sector ?? '').localeCompare(b.sector ?? '')) * mult;
        case 'departamento': return ((a.departamento ?? '').localeCompare(b.departamento ?? '')) * mult;
        case 'dias': return ((a.dias - b.dias)) * mult;
        default: return 0;
      }
    });
    return rows;
  }, [sanciones, search, tipoFiltro, estadoFiltro, sectorFiltro, departamentoFiltro, desde, hasta, orderBy, orderDir]);

  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filtered, page, rowsPerPage],
  );

  const handleSort = (k: SortKey) => {
    if (orderBy === k) setOrderDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setOrderBy(k); setOrderDir('asc'); }
  };

  const handleSubmitForm = async (dto: any) => {
    if (editing) {
      await sancionApi.update(editing.id, dto);
      setSuccess('Sanción actualizada');
    } else {
      await sancionApi.create(dto);
      setSuccess('Sanción creada');
    }
    await load();
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    setDeleteLoading(true);
    try {
      await sancionApi.delete(toDelete.id);
      setSuccess('Sanción eliminada');
      setToDelete(null);
      setDetail(null);
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo eliminar');
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'ID', 'Fecha', 'Apellido', 'Nombre', 'DNI', 'Departamento', 'Sector', 'Puesto',
      'Tipo', 'Días', 'Motivo', 'Motivo Acumulado', 'Pedida por', 'Estado', 'Observaciones',
    ];
    const escape = (v: any) => {
      const s = v == null ? '' : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = filtered.map(s => [
      s.id, s.fecha, s.empleadoApellido, s.empleadoNombre, s.empleadoDni,
      s.departamento ?? '', s.sector ?? '', s.puesto ?? '',
      TIPO_SANCION_LABEL[s.tipo], s.dias, s.motivo, s.motivoAcumulado ?? '',
      s.pedidaPor ?? '', ESTADO_SANCION_LABEL[s.estado], s.observaciones ?? '',
    ].map(escape).join(';'));
    const csv = '﻿' + [headers.join(';'), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disciplina_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const activeFiltersCount = [
    tipoFiltro !== 'TODOS', estadoFiltro !== 'TODOS',
    sectorFiltro !== 'TODOS', departamentoFiltro !== 'TODOS',
    !!desde, !!hasta,
  ].filter(Boolean).length;

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        mb={3}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <GavelIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', sm: '2rem' } }} fontWeight={700}>
              Gestión Disciplinaria
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sanciones, reincidencias y métricas del clima disciplinario
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          <Tooltip title="Recargar">
            <IconButton onClick={load} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined" startIcon={<DownloadIcon />}
            onClick={exportCSV} disabled={filtered.length === 0}
          >
            Exportar
          </Button>
          <Button
            variant="contained" startIcon={<AddIcon />}
            onClick={() => { setEditing(null); setFormOpen(true); }}
          >
            Nueva sanción
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ px: 2 }}
        >
          <Tab value="lista" icon={<GavelIcon />} iconPosition="start" label={`Sanciones (${sanciones.length})`} />
          <Tab value="dashboard" icon={<DashboardIcon />} iconPosition="start" label="Dashboard" />
        </Tabs>
      </Paper>

      {tab === 'dashboard' && (
        <DisciplinaDashboard
          onSelectEmpleado={(r) => {
            navigate('/rrhh/empleados');
            // El detalle del empleado lo abre el usuario; no podemos auto-abrir
            // porque EmpleadosPage no expone una API imperativa.
            setSuccess(`Buscá a ${r.empleadoApellido}, ${r.empleadoNombre} en la lista de empleados.`);
          }}
        />
      )}

      {tab === 'lista' && (
        <Card>
          <CardContent>
            {/* Filtros */}
            <Box mb={2}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <FilterAltIcon color="action" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                  FILTROS
                </Typography>
                {activeFiltersCount > 0 && (
                  <Badge badgeContent={activeFiltersCount} color="primary" sx={{ ml: 1 }} />
                )}
              </Stack>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth size="small"
                    placeholder="Buscar nombre, DNI, motivo, etiqueta…"
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth select size="small" label="Tipo"
                    value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value as any)}
                  >
                    <MenuItem value="TODOS">Todos los tipos</MenuItem>
                    {(Object.keys(TIPO_SANCION_LABEL) as TipoSancion[]).map(t => (
                      <MenuItem key={t} value={t}>{TIPO_SANCION_LABEL[t]}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth select size="small" label="Estado"
                    value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value as any)}
                  >
                    <MenuItem value="TODOS">Todos los estados</MenuItem>
                    {(Object.keys(ESTADO_SANCION_LABEL) as EstadoSancion[]).map(s => (
                      <MenuItem key={s} value={s}>{ESTADO_SANCION_LABEL[s]}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth select size="small" label="Sector"
                    value={sectorFiltro} onChange={(e) => setSectorFiltro(e.target.value)}
                  >
                    <MenuItem value="TODOS">Todos</MenuItem>
                    {sectores.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth select size="small" label="Departamento"
                    value={departamentoFiltro} onChange={(e) => setDepartamentoFiltro(e.target.value)}
                  >
                    <MenuItem value="TODOS">Todos</MenuItem>
                    {departamentos.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth size="small" label="Desde" type="date"
                    InputLabelProps={{ shrink: true }}
                    value={desde} onChange={(e) => setDesde(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth size="small" label="Hasta" type="date"
                    InputLabelProps={{ shrink: true }}
                    value={hasta} onChange={(e) => setHasta(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Tabla */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small" sx={{ minWidth: { xs: 900, md: 'auto' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel
                        active={orderBy === 'fecha'} direction={orderDir}
                        onClick={() => handleSort('fecha')}
                      >Fecha</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel
                        active={orderBy === 'empleado'} direction={orderDir}
                        onClick={() => handleSort('empleado')}
                      >Empleado</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel
                        active={orderBy === 'departamento'} direction={orderDir}
                        onClick={() => handleSort('departamento')}
                      >Departamento</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel
                        active={orderBy === 'sector'} direction={orderDir}
                        onClick={() => handleSort('sector')}
                      >Sector</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel
                        active={orderBy === 'tipo'} direction={orderDir}
                        onClick={() => handleSort('tipo')}
                      >Tipo</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      <TableSortLabel
                        active={orderBy === 'dias'} direction={orderDir}
                        onClick={() => handleSort('dias')}
                      >Días</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Motivo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Etiqueta acum.</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Pedida por</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Adj.</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                        Cargando…
                      </TableCell>
                    </TableRow>
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          {sanciones.length === 0
                            ? 'Aún no hay sanciones registradas.'
                            : 'No hay sanciones que coincidan con los filtros.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginated.map((s) => (
                    <TableRow
                      key={s.id} hover
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(25,118,210,0.04)' } }}
                      onClick={() => setDetail(s)}
                    >
                      <TableCell>{dayjs(s.fecha).format('DD/MM/YYYY')}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: 'primary.light' }}>
                            {s.empleadoNombre[0]}{s.empleadoApellido[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {s.empleadoApellido}, {s.empleadoNombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              DNI {s.empleadoDni}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{s.departamento ?? '—'}</TableCell>
                      <TableCell>{s.sector ?? '—'}</TableCell>
                      <TableCell>
                        <Chip size="small" color={TIPO_SANCION_COLOR[s.tipo]} label={TIPO_SANCION_LABEL[s.tipo]} />
                      </TableCell>
                      <TableCell align="center">
                        {s.dias > 0 ? (
                          <Chip size="small" variant="outlined" label={s.dias} />
                        ) : '—'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography variant="body2" noWrap title={s.motivo}>
                          {s.motivo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {s.motivoAcumulado
                          ? <Chip size="small" variant="outlined" label={s.motivoAcumulado} />
                          : '—'}
                      </TableCell>
                      <TableCell>{s.pedidaPor ?? '—'}</TableCell>
                      <TableCell>
                        <Chip size="small" color={ESTADO_SANCION_COLOR[s.estado]} label={ESTADO_SANCION_LABEL[s.estado]} />
                      </TableCell>
                      <TableCell align="center">
                        {(s.cantidadDocumentos ?? 0) > 0 ? (
                          <Badge badgeContent={s.cantidadDocumentos} color="primary">
                            <AttachFileIcon fontSize="small" color="action" />
                          </Badge>
                        ) : (
                          <AttachFileIcon fontSize="small" sx={{ color: 'action.disabled' }} />
                        )}
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" onClick={() => setDetail(s)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton size="small" color="primary"
                              onClick={() => { setEditing(s); setFormOpen(true); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" color="error" onClick={() => setToDelete(s)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage={isMobile ? 'Filas:' : 'Filas por página:'}
            />
          </CardContent>
        </Card>
      )}

      <SancionFormDialog
        open={formOpen}
        empleados={empleados}
        initial={editing}
        motivosAcumuladosSugeridos={motivosAcumSugeridos}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
      />

      <SancionDetailDrawer
        open={!!detail}
        sancion={detail}
        onClose={() => setDetail(null)}
        onEdit={(s) => { setEditing(s); setDetail(null); setFormOpen(true); }}
        onDelete={(s) => setToDelete(s)}
        onNavigateToEmpleado={() => navigate('/rrhh/empleados')}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar sanción?"
        severity="error"
        warning="Esta acción no se puede deshacer."
        description={toDelete ? `Sanción del ${dayjs(toDelete.fecha).format('DD/MM/YYYY')} a ${toDelete.empleadoApellido}, ${toDelete.empleadoNombre}.` : ''}
        confirmLabel="Eliminar"
        loadingLabel="Eliminando…"
        loading={deleteLoading}
      />
    </Box>
  );
};

export default DisciplinaPage;
