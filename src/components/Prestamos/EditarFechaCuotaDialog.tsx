import { useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControlLabel, Checkbox, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Chip, Box,
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
  cuota: CuotaPrestamoDTO;
  cuotas: CuotaPrestamoDTO[];
  onClose: () => void;
  onSaved: (msg: string) => void;
  onConflict?: () => void;
}

export const EditarFechaCuotaDialog: React.FC<Props> = ({
  open, prestamo, cuota, cuotas, onClose, onSaved, onConflict,
}) => {
  const fechaActual = dayjs(cuota.fechaVencimiento);
  const [nuevaFecha, setNuevaFecha] = useState<Dayjs | null>(fechaActual);
  const [motivo, setMotivo] = useState('');
  const [propagar, setPropagar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deltaDias = useMemo(() => {
    if (!nuevaFecha) return 0;
    return nuevaFecha.startOf('day').diff(fechaActual.startOf('day'), 'day');
  }, [nuevaFecha, fechaActual]);

  const motivoValido = motivo.trim().length >= 5;
  const fechaValida = !!nuevaFecha && nuevaFecha.isValid();
  const cambioReal = fechaValida && deltaDias !== 0;

  const cuotasSiguientesPendientes = useMemo(
    () => cuotas
      .filter(c => c.numeroCuota > cuota.numeroCuota && c.estado === 'PENDIENTE')
      .sort((a, b) => a.numeroCuota - b.numeroCuota),
    [cuotas, cuota.numeroCuota],
  );

  const submitDisabled = !fechaValida || !motivoValido || !cambioReal || submitting;

  const handleSubmit = async () => {
    if (!nuevaFecha) return;
    setSubmitting(true);
    setError(null);
    try {
      await prestamoPersonalApi.actualizarFechaVencimientoCuota(
        prestamo.id, cuota.id,
        {
          nuevaFecha: nuevaFecha.format('YYYY-MM-DD'),
          motivo: motivo.trim(),
          propagarSiguientes: propagar,
          prestamoVersion: prestamo.version ?? 0,
        },
      );
      onSaved(`Fecha de cuota #${cuota.numeroCuota} actualizada correctamente.`);
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status === 409) {
        if (onConflict) onConflict();
        setError('Otro usuario modificó este préstamo. Recargue la página e intente nuevamente.');
      } else {
        setError(err.response?.data?.message || 'Error al actualizar la fecha de la cuota.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Editar fecha de vencimiento — Cuota #{cuota.numeroCuota}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Vencimiento actual: <strong>{fechaActual.format('DD/MM/YYYY')}</strong> &middot;{' '}
            Estado: {ESTADO_CUOTA_LABELS[cuota.estado]}
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Nueva fecha de vencimiento"
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

          <FormControlLabel
            control={
              <Checkbox
                checked={propagar}
                onChange={e => setPropagar(e.target.checked)}
              />
            }
            label="Aplicar el mismo desplazamiento a las cuotas siguientes pendientes"
          />

          {cambioReal && (
            <Alert severity="info">
              Desplazamiento: <strong>{deltaDias > 0 ? '+' : ''}{deltaDias} días</strong>.{' '}
              {propagar
                ? 'Se aplicará también a las cuotas siguientes pendientes (no a pagadas/parciales/refinanciadas).'
                : 'Sólo se modificará esta cuota.'}
            </Alert>
          )}

          {propagar && cambioReal && cuotasSiguientesPendientes.length > 0 && (
            <PreviewSiguientes cuotas={cuotasSiguientesPendientes} deltaDias={deltaDias} />
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

const PreviewSiguientes: React.FC<{ cuotas: CuotaPrestamoDTO[]; deltaDias: number }> = ({ cuotas, deltaDias }) => (
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
          const nueva = dayjs(c.fechaVencimiento).add(deltaDias, 'day').format('DD/MM/YYYY');
          return (
            <TableRow key={c.id}>
              <TableCell>{c.numeroCuota}</TableCell>
              <TableCell>
                <Chip
                  label={ESTADO_CUOTA_LABELS[c.estado]}
                  size="small"
                  sx={{ bgcolor: ESTADO_CUOTA_COLORS[c.estado], color: 'white' }}
                />
              </TableCell>
              <TableCell>{dayjs(c.fechaVencimiento).format('DD/MM/YYYY')}</TableCell>
              <TableCell><strong>{nueva}</strong></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);
