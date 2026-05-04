// FRONT-003: extracted from TransferenciasPage.tsx — confirmar envío de
// transferencia (descuenta stock del origen y la pasa a EN_TRANSITO).
import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material';
import { Send as SendIcon, Warning as WarningIcon } from '@mui/icons-material';
import type { TransferenciaDepositoDTO } from '../../../../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  transferencia: TransferenciaDepositoDTO | null;
}

const EnvioTransferenciaDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  loading,
  transferencia,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SendIcon color="primary" />
          <Typography variant="h6">Confirmar Envío de Transferencia</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          {transferencia && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Está a punto de confirmar el envío de la transferencia{' '}
                <strong>{transferencia.numero}</strong>.
              </Alert>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Detalles de la transferencia:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Origen:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {transferencia.depositoOrigenNombre}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Destino:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {transferencia.depositoDestinoNombre}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Items:
                    </Typography>
                    <Typography variant="body1">
                      {transferencia.items?.length || 0} producto(s)
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Alert severity="warning" icon={<WarningIcon />}>
                <strong>Importante:</strong> Esta acción descontará el stock del depósito de
                origen. Una vez enviada, solo podrá cancelarse o confirmar su recepción.
              </Alert>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
        >
          Confirmar Envío
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnvioTransferenciaDialog;
