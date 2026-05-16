import {
  Box,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { ReactNode } from 'react';

export interface ListItemBase {
  id?: number;
  descripcion: string;
  orden?: number;
}

export interface ListaSimpleEditorProps<T extends ListItemBase> {
  titulo: string;
  items: T[];
  onChange: (items: T[]) => void;
  /** Si está presente, renderea un selector adicional (ej: tipo INTERNO/EXTERNO). */
  tipoOptions?: { value: string; label: string }[];
  /** Llave del item donde guardar el valor del selector tipo. */
  tipoKey?: keyof T;
  /** Texto del placeholder del input descripcion. */
  placeholder?: string;
  /** Factory para items nuevos (override del default {descripcion: ''}). */
  factoryItem?: () => T;
  emptyMessage?: ReactNode;
}

/**
 * Editor de listas planas reutilizable (objetivos, responsabilidades,
 * habilidades, conocimientos, contactos). Permite add / delete / reorder
 * y un selector opcional de "tipo" (RESPONSABILIDAD/AUTORIDAD,
 * INTERNO/EXTERNO).
 */
export default function ListaSimpleEditor<T extends ListItemBase>({
  titulo,
  items,
  onChange,
  tipoOptions,
  tipoKey,
  placeholder = 'Descripción',
  factoryItem,
  emptyMessage = 'Sin items. Agregá el primero con el botón ↑.',
}: ListaSimpleEditorProps<T>) {
  const handleAdd = () => {
    const nuevo = factoryItem
      ? factoryItem()
      : ({ descripcion: '', orden: items.length, activo: true } as unknown as T);
    onChange([...items, nuevo]);
  };

  const handleUpdate = (idx: number, patch: Partial<T>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  };

  const handleDelete = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleMove = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next.map((it, i) => ({ ...it, orden: i })));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">{titulo}</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={handleAdd}>
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
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Typography variant="body2" sx={{ minWidth: 24, pt: 1.5, color: 'text.secondary' }}>
                  {idx + 1}.
                </Typography>

                {tipoOptions && tipoKey && (
                  <TextField
                    select
                    size="small"
                    label="Tipo"
                    value={(item[tipoKey] as unknown as string) ?? tipoOptions[0].value}
                    onChange={(e) => handleUpdate(idx, { [tipoKey]: e.target.value } as Partial<T>)}
                    sx={{ minWidth: 160 }}
                  >
                    {tipoOptions.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </TextField>
                )}

                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={1}
                  maxRows={4}
                  placeholder={placeholder}
                  value={item.descripcion}
                  onChange={(e) => handleUpdate(idx, { descripcion: e.target.value } as Partial<T>)}
                />

                <Stack>
                  <Tooltip title="Subir">
                    <span>
                      <IconButton size="small" onClick={() => handleMove(idx, -1)} disabled={idx === 0}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Bajar">
                    <span>
                      <IconButton size="small" onClick={() => handleMove(idx, 1)} disabled={idx === items.length - 1}>
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>

                <Tooltip title="Eliminar">
                  <IconButton size="small" onClick={() => handleDelete(idx)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
