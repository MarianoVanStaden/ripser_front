import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, Alert, CircularProgress, Autocomplete, InputAdornment
} from '@mui/material';
import {
  reclamoGarantiaApi,
  type ReclamoGarantiaDTO,
  type ReclamoGarantiaCreateDTO,
  type ReclamoGarantiaUpdateDTO
} from '../../api/services/reclamoGarantiaApi';
import { employeeApi } from '../../api/services/employeeApi';
import { garantiaApi, type GarantiaDTO } from '../../api/services/garantiaApi';

interface ReclamoFormDialogProps {
  open: boolean;
  garantiaId?: number;
  reclamo: ReclamoGarantiaDTO | null;
  onClose: () => void;
  onSave: () => void;
  garantias?: GarantiaDTO[];
}

const ReclamoFormDialog: React.FC<ReclamoFormDialogProps> = ({
  open,
  garantiaId,
  reclamo,
  onClose,
  onSave,
  garantias = []
}) => {
  const [form, setForm] = useState({
    descripcionProblema: '',
    tipoSolucion: '' as 'REPARACION_LOCAL' | 'REPARACION_REMOTA' | 'REEMPLAZO' | '',
    estado: 'PENDIENTE' as 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO',
    solucionAplicada: '',
    costoSolucion: '',
    tecnicoId: 0,
  });

  const [empleados, setEmpleados] = useState<any[]>([]);
  const [selectedTecnico, setSelectedTecnico] = useState<any>(null);
  const [selectedGarantia, setSelectedGarantia] = useState<GarantiaDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadEmpleados();

      if (reclamo) {
        setForm({
          descripcionProblema: reclamo.descripcionProblema,
          tipoSolucion: reclamo.tipoSolucion || '',
          estado: reclamo.estado,
          solucionAplicada: reclamo.solucionAplicada || '',
          costoSolucion: reclamo.costoSolucion?.toString() || '',
          tecnicoId: reclamo.tecnico?.id || 0,
        });
        setSelectedTecnico(reclamo.tecnico || null);
        // Set selected garantia from the reclamo
        const garantia = garantias.find(g => g.id === reclamo.garantia.id);
        setSelectedGarantia(garantia || null);
      } else {
        resetForm();
        // If garantiaId is provided, find and select that garantia
        if (garantiaId) {
          const garantia = garantias.find(g => g.id === garantiaId);
          setSelectedGarantia(garantia || null);
        }
      }
    }
  }, [open, reclamo, garantiaId, garantias]);

  const loadEmpleados = async () => {
    try {
      const data = await employeeApi.getAllList();
      setEmpleados(data);
    } catch (err) {
      console.error('Error loading empleados:', err);
    }
  };

  const resetForm = () => {
    setForm({
      descripcionProblema: '',
      tipoSolucion: '',
      estado: 'PENDIENTE',
      solucionAplicada: '',
      costoSolucion: '',
      tecnicoId: 0,
    });
    setSelectedTecnico(null);
    setSelectedGarantia(null);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    // Validation
    if (!form.descripcionProblema.trim()) {
      setError('Debe ingresar la descripción del problema');
      return;
    }

    if (!reclamo && !selectedGarantia) {
      setError('Debe seleccionar una garantía');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (reclamo) {
        // Update existing reclamo
        const updateData: ReclamoGarantiaUpdateDTO = {
          descripcionProblema: form.descripcionProblema,
          tipoSolucion: form.tipoSolucion || undefined,
          estado: form.estado,
          solucionAplicada: form.solucionAplicada || undefined,
          costoSolucion: form.costoSolucion ? parseFloat(form.costoSolucion) : undefined,
          tecnicoId: selectedTecnico?.id || undefined,
        };

        await reclamoGarantiaApi.update(reclamo.id, updateData);
      } else {
        // Create new reclamo
        const createData: ReclamoGarantiaCreateDTO = {
          garantiaId: selectedGarantia!.id,
          descripcionProblema: form.descripcionProblema,
          tipoSolucion: form.tipoSolucion || undefined,
        };

        await reclamoGarantiaApi.create(createData);
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving reclamo:', err);
      setError(err.response?.data?.message || 'Error al guardar el reclamo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {reclamo ? 'Editar Reclamo' : 'Nuevo Reclamo de Garantía'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Stack spacing={2} mt={1}>
          {!reclamo && (
            <Autocomplete
              options={garantias}
              getOptionLabel={(option) =>
                `${option.numeroSerie} - ${option.equipoFabricadoModelo || 'Sin modelo'}`
              }
              value={selectedGarantia}
              onChange={(_, newValue) => setSelectedGarantia(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Garantía *" required />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          )}

          <TextField
            label="Descripción del Problema *"
            name="descripcionProblema"
            value={form.descripcionProblema}
            onChange={handleChange}
            fullWidth
            required
            multiline
            rows={3}
            placeholder="Describa detalladamente el problema..."
          />
          
          <TextField
            select
            label="Tipo de Solución"
            name="tipoSolucion"
            value={form.tipoSolucion}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="">Sin definir</MenuItem>
            <MenuItem value="REPARACION_LOCAL">Reparación Local</MenuItem>
            <MenuItem value="REPARACION_REMOTA">Reparación Remota</MenuItem>
            <MenuItem value="REEMPLAZO">Reemplazo</MenuItem>
          </TextField>
          
          {reclamo && (
            <>
              <TextField
                select
                label="Estado *"
                name="estado"
                value={form.estado}
                onChange={handleChange}
                fullWidth
                required
              >
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="EN_PROCESO">En Proceso</MenuItem>
                <MenuItem value="RESUELTO">Resuelto</MenuItem>
                <MenuItem value="RECHAZADO">Rechazado</MenuItem>
              </TextField>
              
              <TextField
                label="Solución Aplicada"
                name="solucionAplicada"
                value={form.solucionAplicada}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                placeholder="Describa la solución aplicada..."
              />
              
              <TextField
                label="Costo de Solución"
                name="costoSolucion"
                type="number"
                value={form.costoSolucion}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                placeholder="0.00"
              />
              
              <Autocomplete
                options={empleados}
                getOptionLabel={(option) => `${option.nombre} ${option.apellido}`}
                value={selectedTecnico}
                onChange={(_, newValue) => setSelectedTecnico(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Técnico Asignado" />
                )}
              />
            </>
          )}
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

export default ReclamoFormDialog;
