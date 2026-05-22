import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Stack, Autocomplete, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem,
  Box, Typography, FormControlLabel, Checkbox, Divider
} from '@mui/material';
import dayjs from 'dayjs';
import { garantiaApi, type GarantiaCreateDTO } from '../../api/services/garantiaApi';

interface GarantiaFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  equipos: any[];
  ventas: any[];
}

const GarantiaFormDialog: React.FC<GarantiaFormDialogProps> = ({
  open,
  onClose,
  onSave,
  equipos,
  ventas
}) => {
  const [form, setForm] = useState<GarantiaCreateDTO>({
    equipoFabricadoId: 0,
    ventaId: 0,
    numeroSerie: '',
    fechaCompra: dayjs().format('YYYY-MM-DD'),
    fechaVencimientoFabrica: dayjs().add(1, 'year').format('YYYY-MM-DD'),
    fechaVencimientoElectrico: dayjs().add(6, 'months').format('YYYY-MM-DD'),
    estado: 'VIGENTE',
    observaciones: '',
  });

  const [selectedEquipo, setSelectedEquipo] = useState<any>(null);
  const [selectedVenta, setSelectedVenta] = useState<any>(null);
  const [incluyeFabrica, setIncluyeFabrica] = useState(true);
  const [incluyeElectrico, setIncluyeElectrico] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm({
        equipoFabricadoId: 0,
        ventaId: 0,
        numeroSerie: '',
        fechaCompra: dayjs().format('YYYY-MM-DD'),
        fechaVencimientoFabrica: dayjs().add(1, 'year').format('YYYY-MM-DD'),
        fechaVencimientoElectrico: dayjs().add(6, 'months').format('YYYY-MM-DD'),
        estado: 'VIGENTE',
        observaciones: '',
      });
      setSelectedEquipo(null);
      setSelectedVenta(null);
      setIncluyeFabrica(true);
      setIncluyeElectrico(true);
      setError(null);
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    // Validation
    if (!selectedEquipo) {
      setError('Debe seleccionar un equipo fabricado');
      return;
    }
    if (!selectedVenta) {
      setError('Debe seleccionar una venta');
      return;
    }
    if (!form.numeroSerie.trim()) {
      setError('Debe ingresar un número de serie');
      return;
    }
    if (!form.fechaCompra) {
      setError('Debe ingresar la fecha de compra');
      return;
    }
    if (!incluyeFabrica && !incluyeElectrico) {
      setError('Debe seleccionar al menos un tipo de garantía (Fábrica o Eléctrico)');
      return;
    }
    if (incluyeFabrica && !form.fechaVencimientoFabrica) {
      setError('Debe ingresar la fecha de vencimiento para Desperfecto de Fábrica');
      return;
    }
    if (incluyeElectrico && !form.fechaVencimientoElectrico) {
      setError('Debe ingresar la fecha de vencimiento para Desperfecto Eléctrico');
      return;
    }
    if (!form.estado) {
      setError('Debe seleccionar un estado');
      return;
    }

    if (incluyeFabrica && dayjs(form.fechaVencimientoFabrica).isBefore(dayjs(form.fechaCompra))) {
      setError('La fecha de vencimiento de Fábrica debe ser posterior a la fecha de compra');
      return;
    }
    if (incluyeElectrico && dayjs(form.fechaVencimientoElectrico).isBefore(dayjs(form.fechaCompra))) {
      setError('La fecha de vencimiento Eléctrico debe ser posterior a la fecha de compra');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dataToSend: GarantiaCreateDTO = {
        equipoFabricadoId: selectedEquipo.id,
        ventaId: selectedVenta.id,
        numeroSerie: form.numeroSerie,
        fechaCompra: form.fechaCompra,
        fechaVencimientoFabrica: incluyeFabrica ? form.fechaVencimientoFabrica : undefined,
        fechaVencimientoElectrico: incluyeElectrico ? form.fechaVencimientoElectrico : undefined,
        estado: form.estado,
        observaciones: form.observaciones,
      };

      await garantiaApi.create(dataToSend);
      onSave();
    } catch (err: any) {
      console.error('Error saving garantia:', err);
      setError(err.response?.data?.message || 'Error al guardar la garantía');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva Garantía</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2} mt={1}>
          <Autocomplete
            options={Array.isArray(equipos) ? equipos : []}
            getOptionLabel={(option) => {
              if (!option) return '';
              return `${option.modelo} - ${option.numeroHeladera}${option.tipo ? ` (${option.tipo})` : ''}`;
            }}
            value={selectedEquipo}
            onChange={(_, newValue) => {
              setSelectedEquipo(newValue);
              if (newValue && newValue.numeroHeladera) {
                setForm(prev => ({
                  ...prev,
                  numeroSerie: newValue.numeroHeladera
                }));
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Equipo Fabricado *" required />
            )}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
          />

          <Autocomplete
            options={Array.isArray(ventas) ? ventas : []}
            getOptionLabel={(option) => {
              if (!option) return '';
              const numero = option.numeroComprobante || `#${option.id}`;
              const fecha = option.fechaEmision ? dayjs(option.fechaEmision).format('DD/MM/YYYY') : '';
              const cliente = option.cliente?.nombre || '';
              return fecha ? `${numero} - ${fecha}${cliente ? ` - ${cliente}` : ''}` : numero;
            }}
            value={selectedVenta}
            onChange={(_, newValue) => {
              setSelectedVenta(newValue);
              if (newValue) {
                const fecha = newValue.fechaEmision || newValue.fecha;
                if (fecha) {
                  setForm(prev => ({
                    ...prev,
                    fechaCompra: dayjs(fecha).format('YYYY-MM-DD'),
                    fechaVencimientoFabrica: dayjs(fecha).add(1, 'year').format('YYYY-MM-DD'),
                    fechaVencimientoElectrico: dayjs(fecha).add(6, 'months').format('YYYY-MM-DD'),
                  }));
                }
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Factura *" required />
            )}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
          />

          <TextField
            label="Número de Serie *"
            name="numeroSerie"
            value={form.numeroSerie}
            onChange={handleChange}
            fullWidth
            required
            placeholder="Ej: SN-2024-001"
          />

          <TextField
            label="Fecha de Compra *"
            name="fechaCompra"
            type="date"
            value={form.fechaCompra}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
          />

          <Divider sx={{ my: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Tipos de Garantía</Typography>
          </Divider>

          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={incluyeFabrica} onChange={(e) => setIncluyeFabrica(e.target.checked)} />}
              label="Desperfecto de Fábrica (1 año)"
            />
            {incluyeFabrica && (
              <TextField
                label="Fecha de Vencimiento - Fábrica"
                name="fechaVencimientoFabrica"
                type="date"
                value={form.fechaVencimientoFabrica}
                onChange={(e) => setForm({ ...form, fechaVencimientoFabrica: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={incluyeElectrico} onChange={(e) => setIncluyeElectrico(e.target.checked)} />}
              label="Desperfecto Eléctrico (6 meses)"
            />
            {incluyeElectrico && (
              <TextField
                label="Fecha de Vencimiento - Eléctrico"
                name="fechaVencimientoElectrico"
                type="date"
                value={form.fechaVencimientoElectrico}
                onChange={(e) => setForm({ ...form, fechaVencimientoElectrico: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          <FormControl fullWidth required>
            <InputLabel>Estado *</InputLabel>
            <Select
              name="estado"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as 'VIGENTE' | 'VENCIDA' | 'ANULADA' })}
              label="Estado *"
            >
              <MenuItem value="VIGENTE">Vigente</MenuItem>
              <MenuItem value="VENCIDA">Vencida</MenuItem>
              <MenuItem value="ANULADA">Anulada</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Observaciones"
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            placeholder="Ingrese observaciones adicionales..."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GarantiaFormDialog;
