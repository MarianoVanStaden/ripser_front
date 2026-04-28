import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { colorApi, type Color } from '../../api/services/colorApi';
import { useColores } from '../../context/ColoresContext';

interface ColorPickerProps {
  /** Selected color id, or undefined when none. */
  value?: number;
  onChange: (colorId: number | undefined) => void;
  label?: string;
  /** Disable the select (e.g. when the line is not an EQUIPO). */
  disabled?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  /**
   * If false, the inline "+" button to create a new color is hidden.
   * Useful for read-only-ish surfaces.
   */
  allowCreate?: boolean;
}

/**
 * Color picker that consumes the cached color catalog from
 * {@link useColores}. Includes an inline "+" button that opens a small
 * modal to create a new color, refreshes the catalog, and selects the
 * just-created color in one action.
 */
export default function ColorPicker({
  value,
  onChange,
  label = 'Color',
  disabled = false,
  size = 'small',
  fullWidth = true,
  allowCreate = true,
}: ColorPickerProps) {
  const { colores, refreshAndFind } = useColores();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...colores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [colores],
  );

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setCreateError('Ingresá un nombre');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created: Color = await colorApi.create({ nombre: trimmed });
      const fresh = await refreshAndFind(created.id);
      onChange(fresh?.id ?? created.id);
      setCreateOpen(false);
      setNewName('');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setCreateError('Ya existe un color con ese nombre');
      } else {
        setCreateError('No se pudo crear el color');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <TextField
          select
          size={size}
          fullWidth={fullWidth}
          label={label}
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? undefined : Number(v));
          }}
          disabled={disabled}
        >
          <MenuItem value="">
            <em>Sin especificar</em>
          </MenuItem>
          {sorted.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.nombre}
            </MenuItem>
          ))}
        </TextField>
        {allowCreate && !disabled && (
          <Tooltip title="Agregar nuevo color">
            <IconButton size="small" onClick={() => setCreateOpen(true)} aria-label="Agregar color">
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo color</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Nombre"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              error={Boolean(createError)}
              helperText={createError ?? 'Aparecerá en todos los selectores de color del sistema.'}
              inputProps={{ maxLength: 50 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={creating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating}>
            {creating ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
