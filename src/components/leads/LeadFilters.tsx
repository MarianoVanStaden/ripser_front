import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Grid,
  Button
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { FilterList as FilterListIcon, Clear as ClearIcon } from '@mui/icons-material';
import {
  EstadoLeadEnum,
  CanalEnum,
  ProvinciaEnum,
  ESTADO_LABELS,
  CANAL_LABELS,
  PROVINCIA_LABELS
} from '../../types/lead.types';
import type { LeadFilterState } from '../../types/lead.types';

interface LeadFiltersProps {
  filters: LeadFilterState;
  onFilterChange: (filters: LeadFilterState) => void;
}

export const LeadFilters = ({ filters, onFilterChange }: LeadFiltersProps) => {
  const handleEstadosChange = (event: SelectChangeEvent<EstadoLeadEnum[]>) => {
    const value = event.target.value;
    onFilterChange({
      ...filters,
      estados: typeof value === 'string' ? [] : value
    });
  };

  const handleCanalesChange = (event: SelectChangeEvent<CanalEnum[]>) => {
    const value = event.target.value;
    onFilterChange({
      ...filters,
      canales: typeof value === 'string' ? [] : value
    });
  };

  const handleProvinciasChange = (event: SelectChangeEvent<ProvinciaEnum[]>) => {
    const value = event.target.value;
    onFilterChange({
      ...filters,
      provincias: typeof value === 'string' ? [] : value
    });
  };

  const handleBusquedaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      busqueda: event.target.value
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      estados: [],
      canales: [],
      provincias: [],
      busqueda: ''
    });
  };

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterListIcon sx={{ mr: 1 }} />
        <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
          Filtros
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Estados</InputLabel>
            <Select
              multiple
              value={filters.estados || []}
              onChange={handleEstadosChange}
              label="Estados"
            >
              {Object.values(EstadoLeadEnum).map((estado) => (
                <MenuItem key={estado} value={estado}>
                  {ESTADO_LABELS[estado]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Canales</InputLabel>
            <Select
              multiple
              value={filters.canales || []}
              onChange={handleCanalesChange}
              label="Canales"
            >
              {Object.values(CanalEnum).map((canal) => (
                <MenuItem key={canal} value={canal}>
                  {CANAL_LABELS[canal]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Provincias</InputLabel>
            <Select
              multiple
              value={filters.provincias || []}
              onChange={handleProvinciasChange}
              label="Provincias"
            >
              {Object.values(ProvinciaEnum).map((provincia) => (
                <MenuItem key={provincia} value={provincia}>
                  {PROVINCIA_LABELS[provincia]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Buscar (nombre/teléfono)"
            value={filters.busqueda || ''}
            onChange={handleBusquedaChange}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            size="small"
          >
            Limpiar Filtros
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
