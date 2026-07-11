import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ClienteAutocomplete from '../../../common/ClienteAutocomplete';
import { entregaViajeApi } from '../../../../api/services/entregaViajeApi';
import type { Cliente, EntregaViaje } from '../../../../types';
import { useResponsive } from '../../tripWizard/tripWizardShared';

interface ReasignarEntregaDialogProps {
  open: boolean;
  entrega: EntregaViaje | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Reasignación logística: redirige el equipo de una entrega a otro cliente y/o
 * dirección (típicamente cuando un cliente rechaza y el equipo se ofrece/vende a
 * otro). NO toca la facturación ni la cuenta corriente — comercial reconcilia aparte.
 */
const ReasignarEntregaDialog: React.FC<ReasignarEntregaDialogProps> = ({
  open,
  entrega,
  onClose,
  onSaved,
}) => {
  const { isMobile } = useResponsive();
  const [clienteDestino, setClienteDestino] = useState<Cliente | null>(null);
  const [direccion, setDireccion] = useState('');
  const [receptorNombre, setReceptorNombre] = useState('');
  const [receptorDni, setReceptorDni] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && entrega) {
      setClienteDestino(null);
      setDireccion(entrega.direccionEntrega ?? '');
      setReceptorNombre(entrega.receptorNombre ?? '');
      setReceptorDni(entrega.receptorDni ?? '');
      setObservaciones('');
      setError(null);
    }
  }, [open, entrega]);

  const handleSave = async () => {
    if (!entrega) return;
    if (!clienteDestino && !direccion.trim()) {
      setError('Elegí un cliente destino o ingresá una dirección nueva.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await entregaViajeApi.redirigir(entrega.id, {
        clienteDestinoId: clienteDestino?.id,
        direccionEntrega: direccion.trim() || undefined,
        receptorNombre: receptorNombre.trim() || undefined,
        receptorDni: receptorDni.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? 'Error al reasignar la entrega';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle>Reasignar entrega a otro cliente</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Redirige físicamente el equipo a otro cliente y/o dirección. La factura y la
            cuenta corriente no se modifican; comercial ajusta la facturación aparte.
          </Typography>

          <ClienteAutocomplete
            value={clienteDestino}
            onChange={(c) => {
              setClienteDestino(c);
              // Si el cliente tiene dirección y aún no se editó, sugerirla.
              if (c && !direccion.trim() && (c as any).direccion) {
                setDireccion((c as any).direccion);
              }
            }}
            label="Cliente destino"
            placeholder="Buscar cliente por nombre, CUIT, teléfono…"
            fullWidth
          />

          <TextField
            label="Dirección de entrega"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Receptor (nombre)"
              value={receptorNombre}
              onChange={(e) => setReceptorNombre(e.target.value)}
              fullWidth
            />
            <TextField
              label="Receptor (DNI)"
              value={receptorDni}
              onChange={(e) => setReceptorDni(e.target.value)}
              fullWidth
            />
          </Stack>

          <TextField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder="Motivo de la reasignación, referencia, etc."
          />

          <Alert severity="info" variant="outlined">
            Si la factura tiene varios equipos y solo uno se muda, el área comercial debe
            corregir la facturación (esta acción no la divide).
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Guardando…' : 'Reasignar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReasignarEntregaDialog;
