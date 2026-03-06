import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, FormControl, InputLabel, Select,
  Stack, Alert, CircularProgress, Autocomplete,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { gestionCobranzaApi } from '../../../api/services/gestionCobranzaApi';
import { prestamoPersonalApi } from '../../../api/services/prestamoPersonalApi';
import {
  PrioridadCobranza,
  PRIORIDAD_COBRANZA_LABELS,
} from '../../../types/cobranza.types';
import type { PrioridadCobranza as PrioridadType } from '../../../types/cobranza.types';
import type { PrestamoPersonalDTO } from '../../../types/prestamo.types';
import { formatPrice } from '../../../utils/priceCalculations';

interface NuevaGestionDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const getTodayStr = () => new Date().toISOString().split('T')[0];

export const NuevaGestionDialog: React.FC<NuevaGestionDialogProps> = ({ open, onClose, onSaved }) => {
  const [prestamos, setPrestamos] = useState<PrestamoPersonalDTO[]>([]);
  const [loadingPrestamos, setLoadingPrestamos] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<PrestamoPersonalDTO | null>(null);
  const [form, setForm] = useState({
    prioridad: '' as PrioridadType | '',
    montoPendiente: '' as number | '',
    fechaProximaGestion: getTodayStr(),
    observaciones: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingPrestamos(true);
    prestamoPersonalApi.getAll({ page: 0, size: 500, sort: 'diasVencido,desc' })
      .then((res) => setPrestamos(res.content.filter((p) => p.estado === 'EN_MORA' || p.estado === 'EN_LEGAL')))
      .catch(() => setPrestamos([]))
      .finally(() => setLoadingPrestamos(false));
  }, [open]);

  // Pre-fill montoPendiente when prestamo changes
  useEffect(() => {
    if (selectedPrestamo) {
      setForm((f) => ({ ...f, montoPendiente: selectedPrestamo.saldoPendiente }));
    }
  }, [selectedPrestamo]);

  const handleClose = () => {
    setSelectedPrestamo(null);
    setForm({
      prioridad: '',
      montoPendiente: '',
      fechaProximaGestion: getTodayStr(),
      observaciones: '',
    });
    setFormError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedPrestamo?.id) {
      setFormError('Seleccione un préstamo.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await gestionCobranzaApi.create({
        prestamoId: selectedPrestamo.id,
        prioridad: (form.prioridad || undefined) as PrioridadType | undefined,
        montoPendiente: form.montoPendiente !== '' ? Number(form.montoPendiente) : undefined,
        fechaProximaGestion: form.fechaProximaGestion || undefined,
        observaciones: form.observaciones || undefined,
      });
      onSaved();
      handleClose();
    } catch {
      setFormError('Error al crear la gestión. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPrestamoLabel = (p: PrestamoPersonalDTO) =>
    `${p.clienteNombre} — ${formatPrice(p.saldoPendiente)} pendiente (${p.diasVencido}d)`;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva Gestión de Cobranza</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Autocomplete
            options={prestamos}
            loading={loadingPrestamos}
            value={selectedPrestamo}
            onChange={(_, value) => setSelectedPrestamo(value)}
            getOptionLabel={getPrestamoLabel}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Préstamo *"
                size="small"
                placeholder="Buscar por cliente..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingPrestamos && <CircularProgress size={16} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <TextField
            label="Monto Pendiente"
            type="number"
            fullWidth size="small"
            value={form.montoPendiente}
            onChange={(e) =>
              setForm((f) => ({ ...f, montoPendiente: e.target.value === '' ? '' : Number(e.target.value) }))
            }
            inputProps={{ min: 0 }}
          />

          <FormControl fullWidth size="small">
            <InputLabel>Prioridad</InputLabel>
            <Select
              value={form.prioridad}
              label="Prioridad"
              onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value as PrioridadType | '' }))}
            >
              <MenuItem value=""><em>Automática</em></MenuItem>
              {(Object.keys(PrioridadCobranza) as (keyof typeof PrioridadCobranza)[]).map((k) => (
                <MenuItem key={k} value={PrioridadCobranza[k]}>
                  {PRIORIDAD_COBRANZA_LABELS[PrioridadCobranza[k]]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Próxima gestión (fecha)"
            type="date"
            fullWidth size="small"
            value={form.fechaProximaGestion}
            onChange={(e) => setForm((f) => ({ ...f, fechaProximaGestion: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Observaciones"
            multiline rows={2}
            fullWidth size="small"
            value={form.observaciones}
            onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !selectedPrestamo}
          startIcon={submitting ? <CircularProgress size={16} /> : <AddIcon />}
        >
          Crear Gestión
        </Button>
      </DialogActions>
    </Dialog>
  );
};
