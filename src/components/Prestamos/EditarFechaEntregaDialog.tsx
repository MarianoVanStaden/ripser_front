import { useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControlLabel, Checkbox, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Chip, Box, Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import {
  ESTADO_CUOTA_LABELS, ESTADO_CUOTA_COLORS,
} from '../../types/prestamo.types';
import type { CuotaPrestamoDTO, PrestamoPersonalDTO } from '../../types/prestamo.types';

interface Props {
  open: boolean;
  prestamo: PrestamoPersonalDTO;
  cuotas: CuotaPrestamoDTO[];
  onClose: () => void;
  onSaved: (msg: string) => void;
  onConflict?: () => void;
}

export const EditarFechaEntregaDialog: React.FC<Props> = ({
  open, prestamo, cuotas, onClose, onSaved, onConflict,
}) => {
  const fechaActual = prestamo.fechaEntrega ? dayjs(prestamo.fechaEntrega) : null;

  const [nuevaFecha, setNuevaFecha] = useState<Dayjs | null>(fechaActual);
  const [motivo, setMotivo] = useState('');
  const [aplicarShift, setAplicarShift] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deltaDias = useMemo(() => {
    if (!nuevaFecha || !fechaActual) return 0;
    return nuevaFecha.startOf('day').diff(fechaActual.startOf('day'), 'day');
  }, [nuevaFecha, fechaActual]);

  const motivoValido = motivo.trim().length >= 5;
  const fechaValida = !!nuevaFecha && nuevaFecha.isValid();
  const cambioReal = fechaValida && !!fechaActual && deltaDias !== 0;
  const puedeShift = !!fechaActual; // sólo si ya había fechaEntrega previa

  const submitDisabled = !fechaValida || !motivoValido || submitting
    || (aplicarShift && !puedeShift);

  const handleSubmit = async () => {
    if (!nuevaFecha) return;
    setSubmitting(true);
    setError(null);
    try {
      await prestamoPersonalApi.actualizarFechaEntrega(prestamo.id, {
        nuevaFecha: nuevaFecha.format('YYYY-MM-DD'),
        motivo: motivo.trim(),
        aplicarDesplazamientoCuotas: aplicarShift && puedeShift,
        version: prestamo.version ?? 0,
      });
      onSaved('Fecha de entrega actualizada correctamente.');
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status === 409) {
        if (onConflict) onConflict();
        setError('Otro usuario modificó este préstamo. Recargue la página e intente nuevamente.');
      } else {
        setError(err.response?.data?.message || 'Error al actualizar la fecha de entrega.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Editar fecha de entrega</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Fecha de entrega actual:{' '}
            <strong>{fechaActual ? fechaActual.format('DD/MM/YYYY') : 'Pendiente de entrega'}</strong>
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Nueva fecha de entrega"
              value={nuevaFecha}
              onChange={setNuevaFecha}
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </LocalizationProvider>

          <TextField
            label="Motivo del cambio"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            required
            error={motivo.length > 0 && !motivoValido}
            helperText={
              motivo.length > 0 && !motivoValido
                ? 'Debe tener al menos 5 caracteres'
                : 'Quedará registrado en el historial del préstamo'
            }
          />

          <Tooltip
            title={
              !puedeShift
                ? 'Sólo disponible cuando ya existe una fecha de entrega previa'
                : ''
            }
            placement="top-start"
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={aplicarShift && puedeShift}
                  disabled={!puedeShift}
                  onChange={e => setAplicarShift(e.target.checked)}
                />
              }
              label="Desplazar cuotas pendientes en consecuencia"
            />
          </Tooltip>

          {cambioReal && aplicarShift && puedeShift && (
            <Alert severity="info">
              Se aplicará un desplazamiento de <strong>{deltaDias > 0 ? '+' : ''}{deltaDias} días</strong> a las
              cuotas pendientes. Las cuotas pagadas, parciales y vencidas no se moverán.
            </Alert>
          )}

          {aplicarShift && puedeShift && cambioReal && (
            <PreviewCuotas cuotas={cuotas} deltaDias={deltaDias} />
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitDisabled}
        >
          {submitting ? 'Guardando...' : 'Confirmar cambio'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PreviewCuotas: React.FC<{ cuotas: CuotaPrestamoDTO[]; deltaDias: number }> = ({ cuotas, deltaDias }) => (
  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell>N.</TableCell>
          <TableCell>Estado</TableCell>
          <TableCell>Vencimiento actual</TableCell>
          <TableCell>Vencimiento nuevo</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {cuotas.map(c => {
          const seMueve = c.estado === 'PENDIENTE';
          const nueva = seMueve
            ? dayjs(c.fechaVencimiento).add(deltaDias, 'day').format('DD/MM/YYYY')
            : null;
          return (
            <TableRow key={c.id} sx={!seMueve ? { opacity: 0.5 } : {}}>
              <TableCell>{c.numeroCuota}</TableCell>
              <TableCell>
                <Chip
                  label={ESTADO_CUOTA_LABELS[c.estado]}
                  size="small"
                  sx={{ bgcolor: ESTADO_CUOTA_COLORS[c.estado], color: 'white' }}
                />
              </TableCell>
              <TableCell>{dayjs(c.fechaVencimiento).format('DD/MM/YYYY')}</TableCell>
              <TableCell>
                {seMueve ? <strong>{nueva}</strong> : <em>no se modifica</em>}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);
