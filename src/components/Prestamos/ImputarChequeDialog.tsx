import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Alert, CircularProgress, Grid,
  FormControl, InputLabel, Select, MenuItem, Chip,
} from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { cuotaPrestamoApi } from '../../api/services/cuotaPrestamoApi';
import { chequeApi } from '../../api/services/chequeApi';
import type { CuotaPrestamoDTO } from '../../types/prestamo.types';
import type { Cheque } from '../../types';
import { formatPrice } from '../../utils/priceCalculations';
import dayjs from 'dayjs';

interface ImputarChequeDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (changedCuotas: CuotaPrestamoDTO[]) => void;
  /** Cuota destino. Si es null, el backend imputa a la primera cuota impaga. */
  cuota: CuotaPrestamoDTO | null;
  clienteId: number;
  prestamoId: number;
  allCuotas: CuotaPrestamoDTO[];
}

/**
 * Imputa un cheque YA existente en cartera (recibido en la página de cheques o
 * en una rendición) a las cuotas del préstamo, sin crear un cheque nuevo ni
 * tocar caja. El excedente cascadea a las cuotas siguientes.
 */
export const ImputarChequeDialog: React.FC<ImputarChequeDialogProps> = ({
  open, onClose, onSaved, cuota, clienteId, prestamoId, allCuotas,
}) => {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(false);
  const [chequeId, setChequeId] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && clienteId) {
      setChequeId('');
      setError(null);
      setLoading(true);
      chequeApi.getImputables(clienteId)
        .then(setCheques)
        .catch(() => setError('No se pudieron cargar los cheques del cliente'))
        .finally(() => setLoading(false));
    }
  }, [open, clienteId]);

  const chequeSel = cheques.find(c => c.id === chequeId) || null;

  const imputarMutation = useMutation({
    mutationFn: async () => {
      await cuotaPrestamoApi.imputarCheque({
        prestamoId,
        cuotaId: cuota?.id,
        chequeId: chequeId as number,
      });
      const newCuotas = await cuotaPrestamoApi.getByPrestamo(prestamoId);
      return newCuotas.filter(c => {
        const prev = allCuotas.find(p => p.id === c.id);
        return prev && (prev.estado !== c.estado || prev.montoPagado !== c.montoPagado);
      });
    },
    onSuccess: (changed) => { onSaved(changed); onClose(); },
    onError: (err: any) => setError(err.response?.data?.message || err.response?.data?.error
      || 'Error al imputar el cheque'),
  });
  const saving = imputarMutation.isPending;

  const handleSave = () => {
    if (!chequeId) { setError('Seleccioná un cheque para imputar.'); return; }
    setError(null);
    imputarMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Imputar cheque en cartera
        {cuota ? ` — Cuota N.${cuota.numeroCuota}` : ''}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Aplica un cheque ya recibido (en cartera o endosado) a este crédito. No crea
            un cheque nuevo ni impacta caja — la caja se mueve cuando el cheque se cobre en
            el banco. {cuota ? '' : 'Se imputa a la primera cuota impaga; el excedente pasa a las siguientes.'}
          </Alert>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">Cargando cheques…</Typography>
            </Box>
          ) : cheques.length === 0 ? (
            <Alert severity="warning">
              El cliente no tiene cheques imputables (en cartera o endosados, sin imputar).
            </Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Cheque a imputar</InputLabel>
                  <Select
                    value={chequeId}
                    label="Cheque a imputar"
                    onChange={(e) => setChequeId(e.target.value as number)}
                  >
                    {cheques.map(ch => (
                      <MenuItem key={ch.id} value={ch.id}>
                        Nº {ch.numeroCheque} — {ch.bancoNombre ?? 'Banco'} — {formatPrice(ch.monto)}
                        {' — cobra '}{dayjs(ch.fechaCobro).format('DD/MM/YYYY')}
                        {ch.estado === 'ENDOSADO' ? ' (endosado)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {chequeSel && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Monto del cheque</Typography>
                        <Typography variant="body2" fontWeight="bold">{formatPrice(chequeSel.monto)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Estado</Typography>
                        <Box><Chip size="small" label={chequeSel.estado} /></Box>
                      </Grid>
                      {chequeSel.titular && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Titular</Typography>
                          <Typography variant="body2">{chequeSel.titular}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || loading || !chequeId}
          startIcon={saving ? <CircularProgress size={20} /> : <LinkIcon />}
        >
          Imputar cheque
        </Button>
      </DialogActions>
    </Dialog>
  );
};
