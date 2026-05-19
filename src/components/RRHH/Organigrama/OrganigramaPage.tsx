import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Chip, CircularProgress, Alert,
  TextField, MenuItem, InputAdornment, IconButton, Tooltip, Paper, Button,
  ToggleButtonGroup, ToggleButton, AlertTitle, Divider,
} from '@mui/material';
import {
  AccountTree as AccountTreeIcon, Search as SearchIcon, Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon, ChevronRight as ChevronRightIcon,
  Group as GroupIcon, Apartment as ApartmentIcon, SupervisorAccount as SupervisorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employeeApi } from '../../../api/services/employeeApi';
import type { Empleado } from '../../../types';
import EmpleadoFotoAvatar from '../EmpleadoFotoAvatar';

type Vista = 'jerarquica' | 'area';

interface NodeData {
  empleado: Empleado;
  hijos: NodeData[];
}

/**
 * Convierte la lista plana de empleados en un bosque jerárquico basado en
 * supervisor_directo_id. Raíces = empleados sin supervisor (o cuyo supervisor
 * no está en la lista — empleados huérfanos por filtros).
 */
function buildForest(empleados: Empleado[]): NodeData[] {
  const byId = new Map<number, NodeData>();
  empleados.forEach(e => byId.set(e.id, { empleado: e, hijos: [] }));

  const raices: NodeData[] = [];
  empleados.forEach(e => {
    const node = byId.get(e.id)!;
    const supId = e.supervisorDirectoId ?? null;
    if (supId && byId.has(supId)) {
      byId.get(supId)!.hijos.push(node);
    } else {
      raices.push(node);
    }
  });

  const sorter = (a: NodeData, b: NodeData) =>
    (a.empleado.apellido || '').localeCompare(b.empleado.apellido || '') ||
    (a.empleado.nombre || '').localeCompare(b.empleado.nombre || '');
  const sort = (n: NodeData) => { n.hijos.sort(sorter); n.hijos.forEach(sort); };
  raices.sort(sorter);
  raices.forEach(sort);

  return raices;
}

const SIN_AREA = 'Sin área asignada';

/**
 * Agrupa empleados por `areaNombre`. Cuando un empleado no tiene area, va
 * al grupo SIN_AREA. Los grupos se ordenan alfabéticamente; SIN_AREA queda
 * último para no robarle protagonismo al resto.
 */
function buildByArea(empleados: Empleado[]): Array<{ area: string; empleados: Empleado[] }> {
  const map = new Map<string, Empleado[]>();
  empleados.forEach(e => {
    const area = (e.areaNombre && e.areaNombre.trim()) || SIN_AREA;
    if (!map.has(area)) map.set(area, []);
    map.get(area)!.push(e);
  });
  const result = Array.from(map.entries())
    .map(([area, empleados]) => ({
      area,
      empleados: empleados.sort((a, b) =>
        (a.apellido || '').localeCompare(b.apellido || '') ||
        (a.nombre || '').localeCompare(b.nombre || '')
      ),
    }))
    .sort((a, b) => {
      if (a.area === SIN_AREA) return 1;
      if (b.area === SIN_AREA) return -1;
      return a.area.localeCompare(b.area);
    });
  return result;
}

interface NodoProps {
  node: NodeData;
  depth: number;
  expandedIds: Set<number>;
  toggleExpand: (id: number) => void;
}

const NodoEmpleado: React.FC<NodoProps> = ({ node, depth, expandedIds, toggleExpand }) => {
  const e = node.empleado;
  const isExpanded = expandedIds.has(e.id);
  const tieneHijos = node.hijos.length > 0;

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 1,
          ml: depth * 4,
          bgcolor: depth === 0 ? 'primary.50' : 'background.paper',
          borderLeft: depth > 0 ? '3px solid' : undefined,
          borderLeftColor: 'primary.light',
        }}
      >
        <IconButton size="small" onClick={() => toggleExpand(e.id)}
          sx={{ visibility: tieneHijos ? 'visible' : 'hidden' }}>
          {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
        </IconButton>
        <EmpleadoFotoAvatar empleadoId={e.id} nombre={e.nombre} apellido={e.apellido} size={40} />
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {e.apellido}, {e.nombre}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={0.5}>
            <Typography variant="caption" color="text.secondary">
              {e.puesto?.nombre || e.puestoNombre || '— sin puesto —'}
            </Typography>
            {e.numeroLegajo && (
              <Chip size="small" variant="outlined" label={e.numeroLegajo} sx={{ height: 18, fontSize: '0.65rem' }} />
            )}
            {e.areaNombre && (
              <Chip size="small" label={e.areaNombre} color="primary" variant="outlined"
                sx={{ height: 18, fontSize: '0.65rem' }} />
            )}
            <Chip size="small" label={e.estado}
              color={e.estado === 'ACTIVO' ? 'success' : e.estado === 'LICENCIA' ? 'warning' : 'error'}
              sx={{ height: 18, fontSize: '0.65rem' }} />
          </Stack>
        </Box>
        {tieneHijos && (
          <Tooltip title={`${node.hijos.length} subordinado(s) directo(s)`}>
            <Chip size="small" label={node.hijos.length} color="primary" />
          </Tooltip>
        )}
      </Paper>
      {isExpanded && tieneHijos && (
        <Box>
          {node.hijos.map(h => (
            <NodoEmpleado key={h.empleado.id} node={h} depth={depth + 1}
              expandedIds={expandedIds} toggleExpand={toggleExpand} />
          ))}
        </Box>
      )}
    </Box>
  );
};

interface EmpleadoCardProps { e: Empleado; }
const EmpleadoCard: React.FC<EmpleadoCardProps> = ({ e }) => (
  <Paper
    variant="outlined"
    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, mb: 0.75 }}
  >
    <EmpleadoFotoAvatar empleadoId={e.id} nombre={e.nombre} apellido={e.apellido} size={36} />
    <Box flex={1} minWidth={0}>
      <Typography variant="body2" fontWeight={700} noWrap>
        {e.apellido}, {e.nombre}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={0.5}>
        <Typography variant="caption" color="text.secondary">
          {e.puesto?.nombre || e.puestoNombre || '— sin puesto —'}
        </Typography>
        {e.numeroLegajo && (
          <Chip size="small" variant="outlined" label={e.numeroLegajo} sx={{ height: 18, fontSize: '0.65rem' }} />
        )}
        <Chip size="small" label={e.estado}
          color={e.estado === 'ACTIVO' ? 'success' : e.estado === 'LICENCIA' ? 'warning' : 'error'}
          sx={{ height: 18, fontSize: '0.65rem' }} />
      </Stack>
    </Box>
  </Paper>
);

const OrganigramaPage: React.FC = () => {
  const navigate = useNavigate();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO' | 'LICENCIA'>('ACTIVO');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [vista, setVista] = useState<Vista>('jerarquica');
  // Si la jerarquía está vacía al cargar, switcheamos automáticamente a "Por área"
  // — así la página muestra contenido útil aunque nadie tenga supervisor asignado.
  const [autoSwitched, setAutoSwitched] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeeApi.getAllList();
      setEmpleados(data);
      setAutoSwitched(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error cargando empleados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const empleadosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    return empleados.filter(e =>
      (estadoFilter === 'TODOS' || e.estado === estadoFilter) &&
      (!term ||
        e.nombre.toLowerCase().includes(term) ||
        e.apellido.toLowerCase().includes(term) ||
        (e.puestoNombre ?? e.puesto?.nombre ?? '').toLowerCase().includes(term) ||
        (e.areaNombre ?? '').toLowerCase().includes(term)
      )
    );
  }, [empleados, search, estadoFilter]);

  const forest = useMemo(() => buildForest(empleadosFiltrados), [empleadosFiltrados]);
  const grupos = useMemo(() => buildByArea(empleadosFiltrados), [empleadosFiltrados]);

  // Stats sobre el set filtrado vigente
  const stats = useMemo(() => {
    const total = empleadosFiltrados.length;
    const conSupervisor = empleadosFiltrados.filter(e => e.supervisorDirectoId).length;
    const sinSupervisor = total - conSupervisor;
    const idsSet = new Set(empleadosFiltrados.map(e => e.id));
    const lideres = new Set<number>();
    empleadosFiltrados.forEach(e => { if (e.supervisorDirectoId && idsSet.has(e.supervisorDirectoId)) lideres.add(e.supervisorDirectoId); });
    const areas = new Set(empleadosFiltrados.map(e => (e.areaNombre && e.areaNombre.trim()) || SIN_AREA));
    return {
      total,
      conSupervisor,
      sinSupervisor,
      lideres: lideres.size,
      areas: areas.size,
      jerarquiaVacia: total > 0 && conSupervisor === 0,
    };
  }, [empleadosFiltrados]);

  // Cuando termina de cargar y detectamos que no hay jerarquía, switch a 'area'
  // (sólo la primera vez para no pisar al usuario si decide volver a "Jerárquica").
  useEffect(() => {
    if (!loading && !autoSwitched && stats.jerarquiaVacia) {
      setVista('area');
      setAutoSwitched(true);
    }
  }, [loading, autoSwitched, stats.jerarquiaVacia]);

  const expandAll = () => {
    const ids = new Set<number>();
    const walk = (n: NodeData) => { ids.add(n.empleado.id); n.hijos.forEach(walk); };
    forest.forEach(walk);
    setExpandedIds(ids);
  };
  const collapseAll = () => setExpandedIds(new Set());
  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <AccountTreeIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Organigrama</Typography>
            <Typography variant="body2" color="text.secondary">
              Estructura organizacional de la empresa. La vista <strong>Jerárquica</strong> dibuja el árbol a partir
              del supervisor directo de cada empleado; la vista <strong>Por área</strong> agrupa al personal por
              su área asignada.
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Recargar">
            <IconButton onClick={load}><RefreshIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField size="small" placeholder="Buscar nombre, puesto, área…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
              sx={{ flex: 1 }} />
            <TextField size="small" select label="Estado" value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as any)} sx={{ minWidth: 140 }}>
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="ACTIVO">Activo</MenuItem>
              <MenuItem value="LICENCIA">Licencia</MenuItem>
              <MenuItem value="INACTIVO">Baja</MenuItem>
            </TextField>
            <ToggleButtonGroup
              value={vista}
              exclusive
              size="small"
              onChange={(_, v) => v && setVista(v as Vista)}
              aria-label="Vista del organigrama"
            >
              <ToggleButton value="jerarquica" aria-label="Jerárquica">
                <AccountTreeIcon fontSize="small" sx={{ mr: 0.5 }} /> Jerárquica
              </ToggleButton>
              <ToggleButton value="area" aria-label="Por área">
                <ApartmentIcon fontSize="small" sx={{ mr: 0.5 }} /> Por área
              </ToggleButton>
            </ToggleButtonGroup>
            {vista === 'jerarquica' && (
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Expandir todo">
                  <IconButton onClick={expandAll} size="small"><ExpandMoreIcon /></IconButton>
                </Tooltip>
                <Tooltip title="Colapsar todo">
                  <IconButton onClick={collapseAll} size="small"><ChevronRightIcon /></IconButton>
                </Tooltip>
              </Stack>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
            <Chip icon={<GroupIcon />} label={`Total: ${stats.total}`} size="small" />
            <Chip icon={<SupervisorIcon />} label={`Líderes con equipo: ${stats.lideres}`} size="small" color="primary" variant="outlined" />
            <Chip
              label={`Con supervisor: ${stats.conSupervisor}`}
              size="small"
              color={stats.conSupervisor > 0 ? 'success' : 'default'}
              variant="outlined"
            />
            <Chip
              label={`Sin supervisor: ${stats.sinSupervisor}`}
              size="small"
              color={stats.sinSupervisor > 0 && stats.conSupervisor === 0 ? 'warning' : 'default'}
              variant="outlined"
            />
            <Chip icon={<ApartmentIcon />} label={`Áreas: ${stats.areas}`} size="small" variant="outlined" />
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {stats.jerarquiaVacia && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Aún no se cargó la jerarquía</AlertTitle>
          Ningún empleado tiene un supervisor directo asignado, así que el árbol jerárquico no tiene forma todavía.
          Mientras tanto te mostramos la vista <strong>Por área</strong>. Para que la vista jerárquica funcione,
          asigná el <em>supervisor directo</em> a cada empleado desde su legajo.
          <Box mt={1.5}>
            <Button size="small" variant="outlined" onClick={() => navigate('/rrhh/legajos')}>
              Ir a Legajos
            </Button>
          </Box>
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : empleadosFiltrados.length === 0 ? (
        <Alert severity="info">
          No hay empleados para mostrar con los filtros aplicados.
          {estadoFilter !== 'TODOS' && ' Probá cambiando el filtro de estado.'}
        </Alert>
      ) : vista === 'jerarquica' ? (
        <Box>
          {forest.map(n => (
            <NodoEmpleado key={n.empleado.id} node={n} depth={0}
              expandedIds={expandedIds} toggleExpand={toggleExpand} />
          ))}
        </Box>
      ) : (
        <Stack spacing={2}>
          {grupos.map(({ area, empleados }) => (
            <Card key={area} variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <ApartmentIcon color={area === SIN_AREA ? 'disabled' : 'primary'} />
                  <Typography variant="h6" sx={{ fontSize: '1.05rem' }}>
                    {area}
                  </Typography>
                  <Chip size="small" label={`${empleados.length} ${empleados.length === 1 ? 'persona' : 'personas'}`} />
                </Box>
                {empleados.map(e => <EmpleadoCard key={e.id} e={e} />)}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default OrganigramaPage;
