// FRONT-003: extracted from ComprasPedidosPage.tsx — confirmar eliminación
// de orden de compra.  El dialog también muestra un error message cuando
// el backend rechaza la eliminación (no se puede borrar si está RECIBIDA).
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
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import type { OrdenCompra } from '../../../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  orden: OrdenCompra | null;
  errorMessage: string;
}

const DeleteOrdenDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  loading,
  orden,
  errorMessage,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <DeleteIcon color={errorMessage ? 'disabled' : 'error'} />
          <Typography variant="h6">
            {orden ? 'Confirmar Eliminación' : 'No se puede eliminar'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {errorMessage ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            {errorMessage}
          </Alert>
        ) : orden ? (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body1" gutterBottom>
              ¿Está seguro de que desea eliminar la orden de compra{' '}
              <strong>#{orden.numero}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Esta acción no se puede deshacer.
            </Typography>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {errorMessage ? 'Cerrar' : 'Cancelar'}
        </Button>
        {orden && !errorMessage && (
          <Button
            onClick={onConfirm}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeleteOrdenDialog;
