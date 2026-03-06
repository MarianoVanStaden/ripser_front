import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
  Stack,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { parametroSistemaApi } from '../../api/services';
import type { ParametroSistema } from '../../types';

const COSTEO_FIELDS: { clave: string; label: string }[] = [
  { clave: 'COSTEO_MANO_OBRA_PCT', label: 'Mano de obra' },
  { clave: 'COSTEO_VARIOS_PCT', label: 'Varios / materiales' },
  { clave: 'COSTEO_FIJOS_PCT', label: 'Costos fijos' },
  { clave: 'COSTEO_VENTA_PCT', label: 'Costo de venta' },
  { clave: 'COSTEO_TRASLADO_PCT', label: 'Traslado' },
  { clave: 'COSTEO_GANANCIA_PCT', label: 'Ganancia' },
];

const CosteoParametrosPage: React.FC = () => {
  const [parametros, setParametros] = useState<ParametroSistema[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadParametros();
  }, []);

  const loadParametros = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await parametroSistemaApi.getAll();
      const costeoParams = all.filter((p) =>
        COSTEO_FIELDS.some((f) => f.clave === p.clave)
      );
      setParametros(costeoParams);
      const initial: Record<string, string> = {};
      costeoParams.forEach((p) => {
        initial[p.clave] = (parseFloat(p.valor) * 100).toFixed(0);
      });
      setValues(initial);
    } catch {
      setError('No se pudieron cargar los parámetros de costeo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (clave: string, raw: string) => {
    setValues((prev) => ({ ...prev, [clave]: raw }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = parametros.map((p) => {
        const inputVal = parseFloat(values[p.clave] ?? '0');
        const decimalVal = (inputVal / 100).toFixed(4);
        return parametroSistemaApi.update(p.id, {
          ...p,
          valor: decimalVal,
        });
      });
      await Promise.all(updates);
      setSnackbar({ open: true, message: 'Parámetros guardados correctamente.', severity: 'success' });
      loadParametros();
    } catch {
      setSnackbar({ open: true, message: 'Error al guardar los parámetros.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth={500}>
      <Typography variant="h5" fontWeight={600} mb={1}>
        Porcentajes de Costeo
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Estos valores se usan para calcular el costo de fabricación y el precio sugerido de las recetas.
        Se aplican sobre el costo de materiales de cada receta.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          {COSTEO_FIELDS.map((field, idx) => (
            <React.Fragment key={field.clave}>
              <TextField
                label={field.label}
                type="number"
                value={values[field.clave] ?? ''}
                onChange={(e) => handleChange(field.clave, e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 1000, step: 1 },
                }}
                fullWidth
                size="small"
                helperText={
                  parametros.find((p) => p.clave === field.clave)?.descripcion
                }
              />
              {idx < COSTEO_FIELDS.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Stack>

        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || loading}
          >
            Guardar
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CosteoParametrosPage;
