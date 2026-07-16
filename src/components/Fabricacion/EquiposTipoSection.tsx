import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, MenuItem, Chip, Typography, Stack,
  Accordion, AccordionSummary, AccordionDetails, Checkbox,
  FormControl, InputLabel, Select, OutlinedInput, ListItemText, InputAdornment,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { ExpandMore, Search, Clear } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridColumnVisibilityModel, GridPaginationModel } from '@mui/x-data-grid';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import type { Color } from '../../api/services/colorApi';
import type { Medida } from '../../api/services/medidaApi';
import type {
  TipoEquipo, EstadoFabricacion, EstadoAsignacionEquipo, EquipoFabricadoListDTO,
} from '../../types';
import { DataGridDragScroll } from '../common/DataGridDragScroll';

const TIPO_LABEL: Record<TipoEquipo, string> = {
  HELADERA: 'Heladeras',
  COOLBOX: 'Coolbox',
  EXHIBIDOR: 'Exhibidores',
  OTRO: 'Otros',
};

const TIPO_COLOR: Record<TipoEquipo, 'primary' | 'secondary' | 'success' | 'warning'> = {
  HELADERA: 'primary',
  COOLBOX: 'secondary',
  EXHIBIDOR: 'success',
  OTRO: 'warning',
};

const ESTADOS_FAB_OPTIONS: [EstadoFabricacion, string][] = [
  ['PENDIENTE', 'Pendiente'],
  ['EN_PROCESO', 'En Proceso'],
  ['PENDIENTE_CONTROL_CALIDAD', 'Control de Calidad'],
  ['FABRICADO_SIN_TERMINACION', 'Sin Terminación'],
  ['COMPLETADO', 'Completado'],
  ['CANCELADO', 'Cancelado'],
];

const ESTADOS_ASIG_OPTIONS: [EstadoAsignacionEquipo, string][] = [
  ['DISPONIBLE', 'Disponible'],
  ['RESERVADO', 'Reservado'],
  ['PENDIENTE_TERMINACION', 'Pendiente Terminación'],
  ['FACTURADO', 'Facturado'],
  ['EN_TRANSITO', 'En Tránsito'],
  ['ENTREGADO', 'Entregado'],
  ['EN_SERVICE', 'En Service'],
];

interface EquiposTipoSectionProps {
  tipo: TipoEquipo;
  columns: GridColDef[];
  columnVisibilityModel: GridColumnVisibilityModel;
  isMobile: boolean;
  colores: Color[];
  medidasOptions: Medida[];
  /** Al cambiar, la sección re-consulta (usado tras mutaciones en el padre). */
  refreshKey: number;
  defaultExpanded?: boolean;
}

/**
 * Sección plegable (accordion) para un tipo de equipo fijo. Autocontenida:
 * es dueña de su propia barra de filtros + grid paginado server-side scopeado
 * a su `tipo`. Se instancia una vez por tipo en {@link EquiposList}.
 */
const EquiposTipoSection: React.FC<EquiposTipoSectionProps> = ({
  tipo, columns, columnVisibilityModel, isMobile, colores, medidasOptions, refreshKey, defaultExpanded,
}) => {
  const [equipos, setEquipos] = useState<EquipoFabricadoListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });

  // Filtros propios de la sección
  const [estadosFilter, setEstadosFilter] = useState<EstadoFabricacion[]>([]);
  const [estadosAsignacionFilter, setEstadosAsignacionFilter] = useState<EstadoAsignacionEquipo[]>([]);
  const [colorFilter, setColorFilter] = useState<number | ''>('');
  const [medidaFilter, setMedidaFilter] = useState<number | ''>('');
  const [modeloInput, setModeloInput] = useState('');
  const [modeloFilter, setModeloFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Debounce de los campos de texto (modelo y búsqueda).
  useEffect(() => {
    const t = setTimeout(() => {
      setModeloFilter(modeloInput.trim());
      setSearchFilter(searchInput.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [modeloInput, searchInput]);

  // Al cambiar cualquier filtro, volver a la página 0.
  useEffect(() => {
    setPaginationModel((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
  }, [estadosFilter, estadosAsignacionFilter, colorFilter, medidaFilter, modeloFilter, searchFilter]);

  // Cargar cuando cambian filtros/paginación o refreshKey (tras mutación en el padre).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        setLoading(true);
        const response = await equipoFabricadoApi.findAll({
          tipo,
          page: paginationModel.page,
          size: paginationModel.pageSize,
          sort: 'fechaCreacion,desc',
          modelo: modeloFilter || undefined,
          estados: estadosFilter.length ? estadosFilter : undefined,
          estadosAsignacion: estadosAsignacionFilter.length ? estadosAsignacionFilter : undefined,
          colorId: colorFilter === '' ? undefined : colorFilter,
          medidaId: medidaFilter === '' ? undefined : medidaFilter,
          search: searchFilter || undefined,
        });
        if (cancelado) return;
        setEquipos(response.content || []);
        setRowCount(response.totalElements ?? 0);
      } catch (error) {
        if (!cancelado) {
          console.error(`Error loading equipos (${tipo}):`, error);
          setEquipos([]);
          setRowCount(0);
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, [
    tipo, paginationModel.page, paginationModel.pageSize,
    estadosFilter, estadosAsignacionFilter, colorFilter, medidaFilter,
    modeloFilter, searchFilter, refreshKey,
  ]);

  const hayFiltrosActivos =
    estadosFilter.length > 0 || estadosAsignacionFilter.length > 0 ||
    colorFilter !== '' || medidaFilter !== '' || !!modeloInput || !!searchInput;

  const limpiarFiltros = () => {
    setEstadosFilter([]);
    setEstadosAsignacionFilter([]);
    setColorFilter('');
    setMedidaFilter('');
    setModeloInput('');
    setSearchInput('');
    setModeloFilter('');
    setSearchFilter('');
  };

  return (
    <Accordion defaultExpanded={defaultExpanded} sx={{ mb: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          bgcolor: `${TIPO_COLOR[tipo]}.lighter`,
          '&:hover': { bgcolor: `${TIPO_COLOR[tipo]}.light` },
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Chip label={TIPO_LABEL[tipo]} color={TIPO_COLOR[tipo]} size="medium" />
          <Typography variant="body2" color="text.secondary">
            {rowCount} equipo{rowCount !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Barra de filtros propia de la sección */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2} flexWrap="wrap" useFlexGap>
          <TextField
            label="Buscar (N°, modelo, color)"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ minWidth: 240, flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Modelo"
            size="small"
            value={modeloInput}
            onChange={(e) => setModeloInput(e.target.value)}
            sx={{ minWidth: 160 }}
          />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id={`estados-fab-label-${tipo}`}>Estado Fabricación</InputLabel>
            <Select
              labelId={`estados-fab-label-${tipo}`}
              multiple
              value={estadosFilter}
              onChange={(e: SelectChangeEvent<EstadoFabricacion[]>) =>
                setEstadosFilter(e.target.value as EstadoFabricacion[])}
              input={<OutlinedInput label="Estado Fabricación" />}
              renderValue={(selected) => `${(selected as EstadoFabricacion[]).length} seleccionados`}
            >
              {ESTADOS_FAB_OPTIONS.map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  <Checkbox checked={estadosFilter.indexOf(value) > -1} size="small" />
                  <ListItemText primary={label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id={`estados-asig-label-${tipo}`}>Estado Asignación</InputLabel>
            <Select
              labelId={`estados-asig-label-${tipo}`}
              multiple
              value={estadosAsignacionFilter}
              onChange={(e: SelectChangeEvent<EstadoAsignacionEquipo[]>) =>
                setEstadosAsignacionFilter(e.target.value as EstadoAsignacionEquipo[])}
              input={<OutlinedInput label="Estado Asignación" />}
              renderValue={(selected) => `${(selected as EstadoAsignacionEquipo[]).length} seleccionados`}
            >
              {ESTADOS_ASIG_OPTIONS.map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  <Checkbox checked={estadosAsignacionFilter.indexOf(value) > -1} size="small" />
                  <ListItemText primary={label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Color"
            select
            size="small"
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {colores.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.nombre.replace(/_/g, ' ')}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Medida"
            select
            size="small"
            value={medidaFilter}
            onChange={(e) => setMedidaFilter(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {medidasOptions.map((m) => (
              <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
            ))}
          </TextField>
          {hayFiltrosActivos && (
            <Button
              variant="text"
              color="inherit"
              startIcon={<Clear />}
              onClick={limpiarFiltros}
              sx={{ alignSelf: 'center' }}
            >
              Limpiar
            </Button>
          )}
        </Stack>

        <DataGridDragScroll sx={{ width: '100%', overflowX: 'auto' }}>
          <DataGrid
            rows={equipos}
            columns={columns}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[25, 50, 100]}
            getRowId={(row) => row.id ?? `temp-${row.numeroHeladera}`}
            columnVisibilityModel={columnVisibilityModel}
            localeText={{
              noRowsLabel: 'No hay equipos que coincidan con los filtros',
            }}
            sx={{
              border: 'none',
              minWidth: isMobile ? 480 : undefined,
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: 'grey.50',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid',
                borderColor: 'divider',
                '& .MuiIconButton-root': {
                  color: 'primary.main',
                },
                '& .MuiTablePagination-actions button': {
                  color: 'text.primary',
                },
              },
            }}
          />
        </DataGridDragScroll>
      </AccordionDetails>
    </Accordion>
  );
};

export default EquiposTipoSection;
