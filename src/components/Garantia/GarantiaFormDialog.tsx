import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack } from '@mui/material';
import type { Garantia } from '../../types';

interface GarantiaFormDialogProps {
  open: boolean;
  garantia: Garantia | null;
  onClose: () => void;
  onSave: (garantia: Garantia) => void;
}

const estados = [
  { value: 'Vigente', label: 'Vigente' },
  { value: 'Vencida', label: 'Vencida' },
  { value: 'En Proceso', label: 'En Proceso' },
];

const GarantiaFormDialog: React.FC<GarantiaFormDialogProps> = ({ open, garantia, onClose, onSave }) => {
  const [form, setForm] = useState<Garantia>({
    id: '',
    clienteNombre: '',
    productoNombre: '',
    fechaVenta: '',
    estado: 'Vigente',
    observaciones: '',
  });

  useEffect(() => {
    if (garantia) setForm(garantia);
    else setForm({
      id: '',
      clienteNombre: '',
      productoNombre: '',
      fechaVenta: '',
      estado: 'Vigente',
      observaciones: '',
    });
  }, [garantia, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{form.id ? 'Editar Garantía' : 'Nueva Garantía'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Cliente"
            name="clienteNombre"
            value={form.clienteNombre}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Producto"
            name="productoNombre"
            value={form.productoNombre}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Fecha de Venta"
            name="fechaVenta"
            type="date"
            value={form.fechaVenta}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            select
            label="Estado"
            name="estado"
            value={form.estado}
            onChange={handleChange}
            fullWidth
          >
            {estados.map(option => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Observaciones"
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GarantiaFormDialog;
