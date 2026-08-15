import { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography,
} from '@mui/material';
import { documentoApi } from '../../../../api/services/documentoApi';
import type { DetalleForm } from '../types';

interface RevestimientoDialogProps {
  open: boolean;
  onClose: () => void;
  /** Cantidad de equipos detectada en los detalles del documento (default del campo). */
  cantidadInicial: number;
  onConfirm: (detalle: DetalleForm) => void;
}

/**
 * Agrega una línea REVESTIMIENTO al presupuesto (Etapa 6.4: extraído de
 * PresupuestosPage). El precio se toma del parámetro de sistema al abrir,
 * con fallback fijo si el endpoint falla; ambos campos son editables.
 */
export default function RevestimientoDialog({ open, onClose, cantidadInicial, onConfirm }: RevestimientoDialogProps) {
  const [precio, setPrecio] = useState(0);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    if (!open) return;
    setCantidad(cantidadInicial > 0 ? cantidadInicial : 1);
    documentoApi.getPrecioRevestimiento()
      .then(setPrecio)
      .catch(() => setPrecio(280000));
  }, [open, cantidadInicial]);

  const handleConfirm = () => {
    const cant = Math.max(1, cantidad);
    onConfirm({
      tipoItem: 'REVESTIMIENTO',
      descripcion: 'Revestimiento de acero',
      cantidad: cant,
      precioUnitario: precio,
      subtotal: precio * cant,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Agregar revestimiento de acero</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          label="Precio por unidad"
          type="number"
          value={precio}
          onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
          size="small"
          fullWidth
          InputProps={{ startAdornment: <span style={{ marginRight: 4 }}>$</span> }}
          helperText="Tomado del parámetro de sistema. Puede ajustarlo."
        />
        <TextField
          label="Cantidad de equipos"
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
          size="small"
          fullWidth
          inputProps={{ min: 1 }}
          helperText="Auto-detectado desde los equipos del documento. No puede superar la cantidad de equipos."
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
          <Typography variant="body1" fontWeight={600}>
            ${(precio * cantidad).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={precio <= 0 || cantidad <= 0}>
          Agregar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
