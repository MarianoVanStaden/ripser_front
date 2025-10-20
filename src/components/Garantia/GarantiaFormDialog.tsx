import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, 
  MenuItem, Stack, Autocomplete, Alert, CircularProgress, FormControl, InputLabel, Select 
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
    fechaVencimiento: dayjs().add(1, 'year').format('YYYY-MM-DD'),
    estado: 'VIGENTE',
    observaciones: '',
  });

  const [selectedEquipo, setSelectedEquipo] = useState<any>(null);
  const [selectedVenta, setSelectedVenta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setForm({
        equipoFabricadoId: 0,
        ventaId: 0,
        numeroSerie: '',
        fechaCompra: dayjs().format('YYYY-MM-DD'),
        fechaVencimiento: dayjs().add(1, 'year').format('YYYY-MM-DD'),
        estado: 'VIGENTE',
        observaciones: '',
      });
      setSelectedEquipo(null);
      setSelectedVenta(null);
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
    if (!form.fechaVencimiento) {
      setError('Debe ingresar la fecha de vencimiento');
      return;
    }
    if (!form.estado) {
      setError('Debe seleccionar un estado');
      return;
    }

    if (dayjs(form.fechaVencimiento).isBefore(dayjs(form.fechaCompra))) {
      setError('La fecha de vencimiento debe ser posterior a la fecha de compra');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dataToSend: GarantiaCreateDTO = {
        ...form,
        equipoFabricadoId: selectedEquipo.id,
        ventaId: selectedVenta.id,
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
              // Auto-fill numero de serie with numeroHeladera
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
              // Para DocumentoComercial (Factura)
              const numero = option.numeroComprobante || `#${option.id}`;
              const fecha = option.fechaEmision ? dayjs(option.fechaEmision).format('DD/MM/YYYY') : '';
              const cliente = option.cliente?.nombre || '';
              return fecha ? `${numero} - ${fecha}${cliente ? ` - ${cliente}` : ''}` : numero;
            }}
            value={selectedVenta}
            onChange={(_, newValue) => {
              setSelectedVenta(newValue);
              if (newValue) {
                // Usar fechaEmision para DocumentoComercial
                const fecha = newValue.fechaEmision || newValue.fecha;
                if (fecha) {
                  setForm(prev => ({
                    ...prev,
                    fechaCompra: dayjs(fecha).format('YYYY-MM-DD'),
                    fechaVencimiento: dayjs(fecha).add(1, 'year').format('YYYY-MM-DD'),
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
          
          <TextField
            label="Fecha de Vencimiento *"
            name="fechaVencimiento"
            type="date"
            value={form.fechaVencimiento}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
          />
          
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
