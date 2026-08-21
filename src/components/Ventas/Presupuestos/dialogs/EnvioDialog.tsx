import { useEffect, useState } from 'react';
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, MenuItem, TextField, Typography,
} from '@mui/material';
import { costoEnvioApi } from '../../../../api/services/costoEnvioApi';
import type { CostoEnvioDTO } from '../../../../types/costoEnvio.types';
import type { DetalleForm } from '../types';

interface EnvioDialogProps {
  open: boolean;
  onClose: () => void;
  /** Cantidad de equipos detectada en los detalles del documento (default del campo). */
  cantidadInicial: number;
  onConfirm: (detalle: DetalleForm) => void;
}

/**
 * Agrega una línea ENVIO al presupuesto (Etapa 6.4: extraído de
 * PresupuestosPage). La tabla de costos por provincia se carga (con seed)
 * la primera vez que se abre; el precio sugerido es editable o bonificable.
 */
export default function EnvioDialog({ open, onClose, cantidadInicial, onConfirm }: EnvioDialogProps) {
  const [costosEnvio, setCostosEnvio] = useState<CostoEnvioDTO[]>([]);
  const [provincia, setProvincia] = useState('');
  const [precio, setPrecio] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [bonificado, setBonificado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProvincia('');
    setPrecio(0);
    setCantidad(cantidadInicial > 0 ? cantidadInicial : 1);
    setBonificado(false);
    if (costosEnvio.length === 0) {
      costoEnvioApi.seed().catch(() => {})
        .then(() => costoEnvioApi.getAll())
        .then(setCostosEnvio)
        .catch(() => { /* silencioso: el usuario puede tipear el precio igual */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cantidadInicial]);

  const handleConfirm = () => {
    if (!provincia) return;
    const label = costosEnvio.find((c) => c.provincia === provincia)?.provinciaNombre ?? provincia;
    const precioUnit = bonificado ? 0 : precio;
    const cant = Math.max(1, cantidad);
    onConfirm({
      tipoItem: 'ENVIO',
      descripcion: bonificado ? `Envío a ${label} (Bonificado)` : `Envío a ${label}`,
      cantidad: cant,
      precioUnitario: precioUnit,
      subtotal: precioUnit * cant,
      especial: false,
      espPuertasFrontales: false,
      espLuzFria: false,
      espMedida: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Agregar costo de envío</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          select
          label="Provincia"
          value={provincia}
          onChange={(e) => {
            const prov = e.target.value;
            setProvincia(prov);
            const costo = costosEnvio.find((c) => c.provincia === prov);
            setPrecio(costo ? costo.precio : 0);
          }}
          size="small"
          fullWidth
        >
          <MenuItem value="">Seleccionar provincia</MenuItem>
          {costosEnvio.map((c) => (
            <MenuItem key={c.provincia} value={c.provincia}>
              {c.provinciaNombre}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Precio por equipo"
          type="number"
          value={precio}
          onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
          size="small"
          fullWidth
          disabled={bonificado}
          InputProps={{ startAdornment: <span style={{ marginRight: 4 }}>$</span> }}
          helperText="Tomado de la tabla de costos de envío. Puede ajustarlo."
        />
        <TextField
          label="Cantidad de equipos"
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
          size="small"
          fullWidth
          inputProps={{ min: 1 }}
          helperText="Auto-detectado desde los equipos del documento. Editable."
        />
        <FormControlLabel
          control={<Checkbox checked={bonificado} onChange={(e) => setBonificado(e.target.checked)} />}
          label="Bonificar envío (no cobrar)"
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
          <Typography variant="body1" fontWeight={600} color={bonificado ? 'success.main' : 'text.primary'}>
            {bonificado
              ? 'BONIFICADO ($0)'
              : `$${(precio * cantidad).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!provincia || (!bonificado && precio <= 0) || cantidad <= 0}
        >
          Agregar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
