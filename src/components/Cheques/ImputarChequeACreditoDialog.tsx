import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Alert, CircularProgress, Grid,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { cuotaPrestamoApi } from '../../api/services/cuotaPrestamoApi';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import type { Cheque } from '../../types';
import type { PrestamoPersonalDTO } from '../../types/prestamo.types';

// Un crédito con deuda pendiente es imputable; los finalizados/cancelados no.
const ESTADOS_IMPUTABLES = new Set(['ACTIVO', 'EN_MORA', 'EN_LEGAL']);

interface ImputarChequeACreditoDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  cheque: Cheque | null;
}

/**
 * Desde la página de cheques: imputa un cheque en cartera (o endosado) a un
 * crédito personal del mismo cliente, sin crear cheque nuevo ni tocar caja.
 */
const ImputarChequeACreditoDialog: React.FC<ImputarChequeACreditoDialogProps> = ({
  open, onClose, onSaved, cheque,
}) => {
  const [prestamos, setPrestamos] = useState<PrestamoPersonalDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [prestamoId, setPrestamoId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && cheque?.clienteId) {
      setPrestamoId('');
      setError(null);
      setLoading(true);
      prestamoPersonalApi.getByCliente(cheque.clienteId)
        .then(list => setPrestamos(list.filter(p => ESTADOS_IMPUTABLES.has(p.estado))))
        .catch(() => setError('No se pudieron cargar los créditos del cliente'))
        .finally(() => setLoading(false));
    }
  }, [open, cheque?.clienteId]);

  const handleSave = async () => {
    if (!cheque || !prestamoId) { setError('Seleccioná un crédito para imputar.'); return; }
    try {
      setSaving(true);
      setError(null);
      await cuotaPrestamoApi.imputarCheque({ prestamoId: prestamoId as number, chequeId: cheque.id });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error
        || 'Error al imputar el cheque');
    } finally {
      setSaving(false);
    }
  };

  if (!cheque) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Imputar cheque a crédito — Nº {cheque.numeroCheque}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Aplica este cheque ({cheque.estado}) a las cuotas de un crédito del cliente
            {cheque.clienteNombre ? ` ${cheque.clienteNombre}` : ''}. No crea un cheque
            nuevo ni impacta caja; el excedente pasa a las cuotas siguientes.
          </Alert>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {!cheque.clienteId ? (
            <Alert severity="warning">
              El cheque no tiene cliente asociado, no se puede imputar a un crédito.
            </Alert>
          ) : loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">Cargando créditos…</Typography>
            </Box>
          ) : prestamos.length === 0 ? (
            <Alert severity="warning">
              El cliente no tiene créditos personales con deuda pendiente.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Crédito destino</InputLabel>
                  <Select
                    value={prestamoId}
                    label="Crédito destino"
                    onChange={(e) => setPrestamoId(e.target.value as number)}
                  >
                    {prestamos.map(p => (
                      <MenuItem key={p.id} value={p.id}>
                        #{p.id}{p.numeroComprobante ? ` — ${p.numeroComprobante}` : ''}
                        {' — '}{p.cuotasPagadas}/{p.cantidadCuotas} cuotas
                        {' — saldo '}{p.saldoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || loading || !prestamoId}
          startIcon={saving ? <CircularProgress size={20} /> : <LinkIcon />}
        >
          Imputar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImputarChequeACreditoDialog;
