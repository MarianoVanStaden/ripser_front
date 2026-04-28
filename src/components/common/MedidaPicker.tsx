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
import { medidaApi, type Medida } from '../../api/services/medidaApi';
import { useMedidas } from '../../context/MedidasContext';

interface MedidaPickerProps {
  value?: number;
  onChange: (medidaId: number | undefined) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  allowCreate?: boolean;
}

/**
 * Measure picker that consumes the cached measures catalog from
 * {@link useMedidas}. Includes an inline "+" button to create a new measure
 * inline (refresh + select in one action).
 */
export default function MedidaPicker({
  value,
  onChange,
  label = 'Medida',
  disabled = false,
  size = 'small',
  fullWidth = true,
  allowCreate = true,
}: MedidaPickerProps) {
  const { medidas, refreshAndFind } = useMedidas();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...medidas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [medidas],
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
      const created: Medida = await medidaApi.create({ nombre: trimmed });
      const fresh = await refreshAndFind(created.id);
      onChange(fresh?.id ?? created.id);
      setCreateOpen(false);
      setNewName('');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setCreateError('Ya existe una medida con ese nombre');
      } else {
        setCreateError('No se pudo crear la medida');
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
          {sorted.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.nombre}
            </MenuItem>
          ))}
        </TextField>
        {allowCreate && !disabled && (
          <Tooltip title="Agregar nueva medida">
            <IconButton size="small" onClick={() => setCreateOpen(true)} aria-label="Agregar medida">
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nueva medida</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Nombre"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              error={Boolean(createError)}
              helperText={createError ?? 'Ej: "1.4m", "60x40cm".'}
              inputProps={{ maxLength: 20 }}
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
