import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, FormControl, InputLabel, Select,
  Stack, Alert, CircularProgress, Autocomplete,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { gestionCobranzaApi } from '../../../api/services/gestionCobranzaApi';
import { prestamoPersonalApi } from '../../../api/services/prestamoPersonalApi';
import {
  PrioridadCobranza,
  PRIORIDAD_COBRANZA_LABELS,
  TipoOrigenCobranza,
  TIPO_ORIGEN_COBRANZA_LABELS,
} from '../../../types/cobranza.types';
import type { PrioridadCobranza as PrioridadType, TipoOrigenCobranza as TipoOrigenType } from '../../../types/cobranza.types';
import type { PrestamoPersonalDTO } from '../../../types/prestamo.types';
import type { Cliente } from '../../../types';
import ClienteAutocomplete from '../../common/ClienteAutocomplete';
import { formatPrice } from '../../../utils/priceCalculations';

interface NuevaGestionDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const getTodayStr = () => new Date().toISOString().split('T')[0];

export const NuevaGestionDialog: React.FC<NuevaGestionDialogProps> = ({ open, onClose, onSaved }) => {
  const navigate = useNavigate();
  const [prestamos, setPrestamos] = useState<PrestamoPersonalDTO[]>([]);
  const [loadingPrestamos, setLoadingPrestamos] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<PrestamoPersonalDTO | null>(null);
  // Modo libre: gestión sin crédito (cheque rechazado, deuda libre, etc.)
  const [modo, setModo] = useState<'credito' | 'libre'>('credito');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [tipoOrigen, setTipoOrigen] = useState<TipoOrigenType>('DEUDA_LIBRE');
  const [descripcionOrigen, setDescripcionOrigen] = useState('');
  const [form, setForm] = useState({
    prioridad: '' as PrioridadType | '',
    montoPendiente: '' as number | '',
    fechaProximaGestion: getTodayStr(),
    observaciones: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Id de la gestión activa ya existente (409): habilita el botón "Ir a la gestión activa".
  const [gestionActivaId, setGestionActivaId] = useState<number | null>(null);

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
    setModo('credito');
    setSelectedCliente(null);
    setTipoOrigen('DEUDA_LIBRE');
    setDescripcionOrigen('');
    setForm({
      prioridad: '',
      montoPendiente: '',
      fechaProximaGestion: getTodayStr(),
      observaciones: '',
    });
    setFormError(null);
    setGestionActivaId(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (modo === 'libre') {
      if (!selectedCliente?.id) {
        setFormError('Seleccione un cliente.');
        return;
      }
      if (form.montoPendiente === '' || Number(form.montoPendiente) <= 0) {
        setFormError('Ingrese el monto a recuperar (mayor a 0).');
        return;
      }
    } else if (!selectedPrestamo?.id) {
      setFormError('Seleccione un crédito personal.');
      return;
    }
    const prestamoId = selectedPrestamo?.id;
    setSubmitting(true);
    setFormError(null);
    setGestionActivaId(null);
    try {
      await gestionCobranzaApi.create({
        ...(modo === 'libre'
          ? {
              clienteId: selectedCliente!.id,
              tipoOrigen,
              descripcionOrigen: descripcionOrigen || undefined,
            }
          : { prestamoId }),
        prioridad: (form.prioridad || undefined) as PrioridadType | undefined,
        montoPendiente: form.montoPendiente !== '' ? Number(form.montoPendiente) : undefined,
        fechaProximaGestion: form.fechaProximaGestion || undefined,
        observaciones: form.observaciones || undefined,
      });
      onSaved();
      handleClose();
    } catch (err: any) {
      // 409: ya existe una gestión activa para este crédito. Mostramos motivo claro y
      // resolvemos el id de esa gestión para ofrecer un atajo al detalle.
      if (err?.response?.status === 409 && prestamoId != null) {
        setFormError('Ya existe una gestión activa para este crédito.');
        try {
          const activa = await gestionCobranzaApi.getActivaByPrestamo(prestamoId);
          setGestionActivaId(activa.id);
        } catch {
          // Si no se pudo resolver la gestión, se muestra igual el mensaje sin botón.
        }
      } else {
        setFormError(err?.response?.data?.message || err?.response?.data?.error
          || 'Error al crear la gestión. Intente nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleIrAGestionActiva = () => {
    if (gestionActivaId == null) return;
    navigate(`/cobranzas/${gestionActivaId}`);
    handleClose();
  };

  const getPrestamoLabel = (p: PrestamoPersonalDTO) =>
    `${p.clienteNombre} — ${formatPrice(p.saldoPendiente)} pendiente (${p.diasVencido}d)`;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva Gestión de Cobranza</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          {formError && (
            <Alert
              severity="error"
              action={gestionActivaId != null ? (
                <Button color="inherit" size="small" onClick={handleIrAGestionActiva}>
                  Ir a la gestión activa
                </Button>
              ) : undefined}
            >
              {formError}
            </Alert>
          )}

          <ToggleButtonGroup
            exclusive
            size="small"
            fullWidth
            value={modo}
            onChange={(_, v) => { if (v) { setModo(v); setFormError(null); } }}
          >
            <ToggleButton value="credito">Vinculada a crédito</ToggleButton>
            <ToggleButton value="libre">Cobro libre</ToggleButton>
          </ToggleButtonGroup>

          {modo === 'libre' && (
            <>
              <ClienteAutocomplete
                value={selectedCliente}
                onChange={setSelectedCliente}
                label="Cliente *"
                size="small"
                fullWidth
              />
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de origen</InputLabel>
                <Select
                  value={tipoOrigen}
                  label="Tipo de origen"
                  onChange={(e) => setTipoOrigen(e.target.value as TipoOrigenType)}
                >
                  {(Object.keys(TipoOrigenCobranza) as (keyof typeof TipoOrigenCobranza)[])
                    .filter((k) => k !== 'CREDITO')
                    .map((k) => (
                      <MenuItem key={k} value={TipoOrigenCobranza[k]}>
                        {TIPO_ORIGEN_COBRANZA_LABELS[TipoOrigenCobranza[k]]}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <TextField
                label="Descripción del origen"
                placeholder='Ej: "Cheque #1234 rechazado el 05/07"'
                fullWidth size="small"
                value={descripcionOrigen}
                onChange={(e) => setDescripcionOrigen(e.target.value)}
              />
            </>
          )}

          {modo === 'credito' && (
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
                label="Crédito Personal *"
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
          )}

          <TextField
            label={modo === 'libre' ? 'Monto a recuperar *' : 'Monto Pendiente'}
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
          disabled={submitting || (modo === 'credito' ? !selectedPrestamo : !selectedCliente)}
          startIcon={submitting ? <CircularProgress size={16} /> : <AddIcon />}
        >
          Crear Gestión
        </Button>
      </DialogActions>
    </Dialog>
  );
};
