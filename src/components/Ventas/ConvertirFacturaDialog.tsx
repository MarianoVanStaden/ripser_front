import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { documentoApi } from '../../api/services';
import type { DocumentoComercial, MetodoPago } from '../../types';

interface ConvertirFacturaDialogProps {
  open: boolean;
  notaPedido: DocumentoComercial | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ConvertirFacturaDialog: React.FC<ConvertirFacturaDialogProps> = ({
  open,
  notaPedido,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');

  const handleConvert = async () => {
    if (!notaPedido) return;

    try {
      setLoading(true);
      setError(null);

      // Check if already converted
      const facturas = await documentoApi.getByTipo('FACTURA');
      const alreadyConverted = facturas.some(
        (f) => f.documentoOrigenId === notaPedido.id
      );

      if (alreadyConverted) {
        setError('Esta nota de pedido ya fue convertida a factura.');
        return;
      }

      // Prepare conversion DTO without equipment data
      const conversionDto = {
        notaPedidoId: notaPedido.id,
        metodoPago: metodoPago,
        // Don't include equipment assignments - they should stay with the nota de pedido
        mantenerEquipos: true, // This flag tells backend to keep equipment on nota de pedido
      };

      await documentoApi.convertToFactura(conversionDto);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error converting to factura:', err);
      setError(
        err.message || 
        err.response?.data?.message || 
        'Error al convertir a factura'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Convertir a Factura</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {notaPedido && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Nota de Pedido: {notaPedido.numeroDocumento}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cliente: {notaPedido.clienteNombre}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: ${notaPedido.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        )}

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Método de Pago</InputLabel>
          <Select
            value={metodoPago}
            label="Método de Pago"
            onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
            disabled={loading}
          >
            <MenuItem value="EFECTIVO">Efectivo</MenuItem>
            <MenuItem value="TARJETA_CREDITO">Tarjeta de Crédito</MenuItem>
            <MenuItem value="TARJETA_DEBITO">Tarjeta de Débito</MenuItem>
            <MenuItem value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</MenuItem>
            <MenuItem value="CHEQUE">Cheque</MenuItem>
            <MenuItem value="CUENTA_CORRIENTE">Cuenta Corriente</MenuItem>
          </Select>
        </FormControl>

        <Alert severity="info" sx={{ mt: 2 }}>
          Los equipos asignados permanecerán en la nota de pedido original.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConvert}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Convertir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConvertirFacturaDialog;
