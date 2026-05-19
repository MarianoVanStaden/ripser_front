import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Chip, CircularProgress, Alert,
  TextField, MenuItem, InputAdornment, IconButton, Tooltip, Paper,
} from '@mui/material';
import {
  AccountTree as AccountTreeIcon, Search as SearchIcon, Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon, ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { employeeApi } from '../../../api/services/employeeApi';
import type { Empleado } from '../../../types';
import EmpleadoFotoAvatar from '../EmpleadoFotoAvatar';

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

  // Ordeno por apellido, nombre para una vista estable
  const sorter = (a: NodeData, b: NodeData) =>
    (a.empleado.apellido || '').localeCompare(b.empleado.apellido || '') ||
    (a.empleado.nombre || '').localeCompare(b.empleado.nombre || '');
  const sort = (n: NodeData) => { n.hijos.sort(sorter); n.hijos.forEach(sort); };
  raices.sort(sorter);
  raices.forEach(sort);

  return raices;
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

const OrganigramaPage: React.FC = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO' | 'LICENCIA'>('ACTIVO');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeeApi.getAllList();
      setEmpleados(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error cargando empleados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const forest = useMemo(() => {
    const filtrados = empleados.filter(e =>
      (estadoFilter === 'TODOS' || e.estado === estadoFilter) &&
      (!search ||
        e.nombre.toLowerCase().includes(search.toLowerCase()) ||
        e.apellido.toLowerCase().includes(search.toLowerCase()) ||
        (e.puestoNombre ?? e.puesto?.nombre ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (e.areaNombre ?? '').toLowerCase().includes(search.toLowerCase())
      )
    );
    return buildForest(filtrados);
  }, [empleados, search, estadoFilter]);

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

  const sinSupervisor = forest.length;
  const totalEmpleados = empleados.filter(e => estadoFilter === 'TODOS' || e.estado === estadoFilter).length;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <AccountTreeIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Organigrama</Typography>
            <Typography variant="body2" color="text.secondary">
              Jerarquía basada en supervisor directo de cada empleado
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Recargar"><IconButton onClick={load}><RefreshIcon /></IconButton></Tooltip>
        </Stack>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
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
            <IconButton onClick={expandAll} size="small" title="Expandir todo"><ExpandMoreIcon /></IconButton>
            <IconButton onClick={collapseAll} size="small" title="Colapsar todo"><ChevronRightIcon /></IconButton>
          </Stack>
          <Stack direction="row" spacing={2} mt={2}>
            <Chip label={`Total: ${totalEmpleados}`} size="small" />
            <Chip label={`Sin supervisor (raíz): ${sinSupervisor}`} size="small" color="primary" />
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : forest.length === 0 ? (
        <Alert severity="info">
          No hay empleados para mostrar con los filtros aplicados.
          {estadoFilter !== 'TODOS' && ' Probá cambiando el filtro de estado.'}
        </Alert>
      ) : (
        <Box>
          {forest.map(n => (
            <NodoEmpleado key={n.empleado.id} node={n} depth={0}
              expandedIds={expandedIds} toggleExpand={toggleExpand} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default OrganigramaPage;
