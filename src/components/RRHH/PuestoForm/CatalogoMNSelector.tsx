import { useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { ReactNode } from 'react';

export interface CatalogoOption {
  id: number;
  nombre: string;
  /** Etiqueta secundaria (ej: tipo de competencia, severidad de riesgo). */
  badge?: string;
}

export interface CatalogoMNSelectorProps<TItem> {
  titulo: string;
  /** Items actualmente asignados al puesto. */
  items: TItem[];
  /** Función para extraer el id del catálogo desde un item asignado. */
  getCatalogoId: (item: TItem) => number;
  /** Nombre cacheado del catálogo en el item (para chip label). */
  getCatalogoLabel: (item: TItem) => string;
  /** Opciones completas del catálogo (todas las del backend). */
  options: CatalogoOption[];
  /**
   * Crea un nuevo item asignado a partir del id de la opción seleccionada.
   * El componente llama a esto cuando el usuario elige una opción del autocomplete.
   */
  onAdd: (catalogoId: number, label: string, badge?: string) => TItem;
  /** Cambios bulk a la lista. */
  onChange: (next: TItem[]) => void;
  /** Slot para inputs adicionales por item (ej: slider de nivel, switch obligatorio). */
  renderItemExtras?: (item: TItem, update: (patch: Partial<TItem>) => void) => ReactNode;
  emptyMessage?: ReactNode;
}

/**
 * Selector M:N para asignar items de un catálogo a un Puesto: competencias,
 * riesgos, EPP. Cada item muestra el nombre del catálogo + (opcional) controles
 * para ajustar campos del JOIN (nivelRequerido, obligatorio, observaciones).
 */
export default function CatalogoMNSelector<TItem extends { id?: number }>({
  titulo,
  items,
  getCatalogoId,
  getCatalogoLabel,
  options,
  onAdd,
  onChange,
  renderItemExtras,
  emptyMessage = 'Sin items asignados.',
}: CatalogoMNSelectorProps<TItem>) {
  const [picker, setPicker] = useState<CatalogoOption | null>(null);

  const assignedIds = new Set(items.map(getCatalogoId));
  const availableOptions = options.filter((o) => !assignedIds.has(o.id));

  const handleAdd = () => {
    if (!picker) return;
    const nuevo = onAdd(picker.id, picker.nombre, picker.badge);
    onChange([...items, nuevo]);
    setPicker(null);
  };

  const handleUpdate = (idx: number, patch: Partial<TItem>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  };

  const handleDelete = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>{titulo}</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <Autocomplete
          options={availableOptions}
          getOptionLabel={(o) => o.nombre}
          renderOption={(props, opt) => (
            <li {...props} key={opt.id}>
              <Stack direction="row" spacing={1} alignItems="center">
                <span>{opt.nombre}</span>
                {opt.badge && <Chip size="small" label={opt.badge} />}
              </Stack>
            </li>
          )}
          value={picker}
          onChange={(_, v) => setPicker(v)}
          sx={{ flexGrow: 1 }}
          renderInput={(p) => <TextField {...p} size="small" label="Agregar..." />}
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={!picker}
        >
          Agregar
        </Button>
      </Stack>

      {items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
        </Paper>
      ) : (
        <Stack spacing={1}>
          {items.map((item, idx) => (
            <Paper variant="outlined" key={item.id ?? `new-${idx}`} sx={{ p: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ flexGrow: 1, fontWeight: 500 }}>{getCatalogoLabel(item)}</Typography>
                <Tooltip title="Quitar">
                  <IconButton size="small" onClick={() => handleDelete(idx)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              {renderItemExtras && (
                <Box sx={{ mt: 1, pl: 1 }}>
                  {renderItemExtras(item, (patch) => handleUpdate(idx, patch))}
                </Box>
              )}
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
