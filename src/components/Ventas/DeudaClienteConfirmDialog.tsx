import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { DeudaClienteError } from '../../types';

interface Props {
  open: boolean;
  error: DeudaClienteError | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeudaClienteConfirmDialog: React.FC<Props> = ({ open, error, onConfirm, onCancel }) => {
  if (!error) return null;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="warning" />
        Cliente con deuda pendiente
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Se detectó deuda pendiente para este cliente:
          </Typography>
          {error.cuotasPendientes > 0 && (
            <Alert severity="warning">
              El cliente tiene <strong>{error.cuotasPendientes} cuota(s)</strong> de crédito personal vencida(s) o pendientes
              {error.montoCuotasPendientes != null && (
                <> por un monto total de{' '}
                  <strong>
                    ${Math.abs(error.montoCuotasPendientes).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </strong>
                </>
              )}.
            </Alert>
          )}
          {error.deudaCuentaCorriente != null && (
            <Alert severity="warning">
              El cliente tiene un saldo negativo en cuenta corriente de{' '}
              <strong>
                ${Math.abs(error.deudaCuentaCorriente).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </strong>.
            </Alert>
          )}
          <Typography variant="body2">
            ¿Desea continuar de todas formas?
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={onConfirm} color="warning" variant="contained">
          Continuar de todas formas
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeudaClienteConfirmDialog;
