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
  ESTADO_CUOTA_LABELS, ESTADO_CUOTA_COLORS, TipoFinanciacion,
} from '../../types/prestamo.types';
import type { CuotaPrestamoDTO, PrestamoPersonalDTO } from '../../types/prestamo.types';

/** Mismo cálculo que el backend (calcularFechaVencimiento). cuota n -> base + n períodos. */
const anclarFecha = (base: Dayjs, tipo: TipoFinanciacion | undefined, numeroCuota: number): Dayjs => {
  switch (tipo) {
    case TipoFinanciacion.SEMANAL:
      return base.add(numeroCuota, 'week');
    case TipoFinanciacion.QUINCENAL:
      return base.add(numeroCuota * 2, 'week');
    case TipoFinanciacion.MENSUAL:
    case TipoFinanciacion.PLAN_PP:
    case TipoFinanciacion.CONTADO:
    case TipoFinanciacion.CHEQUES:
    default:
      return base.add(numeroCuota, 'month');
  }
};

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
  // Cuando no había fechaEntrega previa, el checkbox "shift" se interpreta como "anclar"
  // (recalcular cuotas desde cero usando la nueva fecha + n períodos).
  const esAnclajeInicial = !fechaActual && fechaValida;

  const submitDisabled = !fechaValida || !motivoValido || submitting;

  const handleSubmit = async () => {
    if (!nuevaFecha) return;
    setSubmitting(true);
    setError(null);
    try {
      await prestamoPersonalApi.actualizarFechaEntrega(prestamo.id, {
        nuevaFecha: nuevaFecha.format('YYYY-MM-DD'),
        motivo: motivo.trim(),
        aplicarDesplazamientoCuotas: aplicarShift,
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

          <FormControlLabel
            control={
              <Checkbox
                checked={aplicarShift}
                onChange={e => setAplicarShift(e.target.checked)}
              />
            }
            label={esAnclajeInicial
              ? 'Anclar el cronograma de cuotas a esta fecha de entrega'
              : 'Desplazar cuotas pendientes en consecuencia'}
          />

          {esAnclajeInicial && aplicarShift && (
            <Alert severity="info">
              El cronograma de cuotas estaba pendiente de anclaje. Las cuotas PENDIENTE se
              programarán a partir de esta fecha (cuota n = fecha entrega + n períodos según
              el tipo de financiación).
            </Alert>
          )}

          {!esAnclajeInicial && cambioReal && aplicarShift && (
            <Alert severity="info">
              Se aplicará un desplazamiento de <strong>{deltaDias > 0 ? '+' : ''}{deltaDias} días</strong> a las
              cuotas pendientes. Las cuotas pagadas, parciales y vencidas no se moverán.
            </Alert>
          )}

          {aplicarShift && esAnclajeInicial && nuevaFecha && (
            <PreviewAnclaje cuotas={cuotas} fechaEntrega={nuevaFecha} tipo={prestamo.tipoFinanciacion} />
          )}

          {aplicarShift && !esAnclajeInicial && cambioReal && (
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
          const seMueve = c.estado === 'PENDIENTE' && !!c.fechaVencimiento;
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
              <TableCell>
                {c.fechaVencimiento ? dayjs(c.fechaVencimiento).format('DD/MM/YYYY') : <em>—</em>}
              </TableCell>
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

const PreviewAnclaje: React.FC<{
  cuotas: CuotaPrestamoDTO[];
  fechaEntrega: Dayjs;
  tipo: TipoFinanciacion | undefined;
}> = ({ cuotas, fechaEntrega, tipo }) => (
  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell>N.</TableCell>
          <TableCell>Estado</TableCell>
          <TableCell>Fecha calculada</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {cuotas.map(c => {
          const seAncla = c.estado === 'PENDIENTE';
          const nueva = seAncla ? anclarFecha(fechaEntrega, tipo, c.numeroCuota).format('DD/MM/YYYY') : null;
          return (
            <TableRow key={c.id} sx={!seAncla ? { opacity: 0.5 } : {}}>
              <TableCell>{c.numeroCuota}</TableCell>
              <TableCell>
                <Chip
                  label={ESTADO_CUOTA_LABELS[c.estado]}
                  size="small"
                  sx={{ bgcolor: ESTADO_CUOTA_COLORS[c.estado], color: 'white' }}
                />
              </TableCell>
              <TableCell>
                {seAncla ? <strong>{nueva}</strong> : <em>no se modifica</em>}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);
