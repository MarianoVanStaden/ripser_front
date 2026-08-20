import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert, Typography, Box, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import dayjs from 'dayjs';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import { ESTADO_CUOTA_LABELS, ESTADO_CUOTA_COLORS } from '../../types/prestamo.types';
import type { CuotaPrestamoDTO, PrestamoPersonalDTO } from '../../types/prestamo.types';

interface Props {
  open: boolean;
  prestamo: PrestamoPersonalDTO;
  cuotas: CuotaPrestamoDTO[];
  onClose: () => void;
  onSaved: (msg: string) => void;
  onConflict?: () => void;
}

/**
 * Corrección ADMIN+: revierte una fecha de entrega cargada por error. Deja el préstamo
 * "sin anclar" — fecha de entrega vacía y cuotas no pagadas sin vencimiento (PENDIENTE).
 * Espeja el guard del backend: solo se tocan cuotas PENDIENTE/VENCIDA sin pago y no
 * refinanciadas; las pagadas/parciales/refinanciadas quedan intactas.
 */
export const DesanclarCronogramaDialog: React.FC<Props> = ({
  open, prestamo, cuotas, onClose, onSaved, onConflict,
}) => {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fechaActual = prestamo.fechaEntrega ? dayjs(prestamo.fechaEntrega) : null;

  // Espeja el guard del backend (estado + sin pago). El backend además excluye las
  // refinanciadas — flag que el DTO de cuota no expone —, así que este preview puede
  // sobreestimar en el caso raro de una cuota refinanciada aún en PENDIENTE/VENCIDA.
  const afectadas = useMemo(
    () => cuotas.filter(
      c => (c.estado === 'PENDIENTE' || c.estado === 'VENCIDA') && c.montoPagado === 0,
    ),
    [cuotas],
  );

  const desanclarMutation = useMutation({
    mutationFn: () => prestamoPersonalApi.desanclarCronograma(prestamo.id, {
      motivo: motivo.trim(),
      version: prestamo.version ?? 0,
    }),
    onSuccess: () => {
      onSaved('Cronograma desanclado. La fecha de entrega y los vencimientos quedaron pendientes.');
      onClose();
    },
    onError: (e: unknown) => {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status === 409) {
        if (onConflict) onConflict();
        setError('Otro usuario modificó este préstamo. Recargue la página e intente nuevamente.');
      } else {
        setError(err.response?.data?.message || 'Error al desanclar el cronograma.');
      }
    },
  });

  const submitting = desanclarMutation.isPending;
  const motivoValido = motivo.trim().length > 0;

  const handleSubmit = () => {
    if (!motivoValido) return;
    setError(null);
    desanclarMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Desanclar cronograma (corregir entrega)</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Fecha de entrega actual:{' '}
            <strong>{fechaActual ? fechaActual.format('DD/MM/YYYY') : 'Pendiente de entrega'}</strong>
          </Typography>

          <Alert severity="warning">
            Se revierte la fecha de entrega a <strong>pendiente</strong> y las cuotas no pagadas
            vuelven a quedar <strong>sin vencimiento</strong> (estado Pendiente). Usalo cuando la
            fecha de entrega se cargó por error. Cuando se confirme la entrega real, el cronograma
            se reancla solo. Las cuotas con pago o refinanciadas no se tocan.
          </Alert>

          {afectadas.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 280 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>N.</TableCell>
                    <TableCell>Estado actual</TableCell>
                    <TableCell>Vencimiento actual</TableCell>
                    <TableCell>Queda</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {afectadas.map(c => (
                    <TableRow key={c.id}>
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
                      <TableCell><em>sin vencimiento · Pendiente</em></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No hay cuotas para desanclar (todas están pagadas, parciales o refinanciadas).
              Igualmente se limpiará la fecha de entrega del préstamo.
            </Alert>
          )}

          <TextField
            label="Motivo de la corrección"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            required
            error={!motivoValido && motivo.length > 0}
            helperText="Obligatorio. Quedará registrado en el historial del préstamo."
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleSubmit}
          disabled={!motivoValido || submitting}
        >
          {submitting ? 'Desanclando...' : 'Desanclar cronograma'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
