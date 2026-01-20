import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  InputAdornment,
  Paper,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { parametroSistemaApi } from '../../api/services/parametroSistemaApi';
import type { ParametroSistema } from '../../types';

const ConfiguracionTallerPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [valorHora, setValorHora] = useState<string>('');
  const [parametroId, setParametroId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadParametro();
  }, []);

  const loadParametro = async () => {
    try {
      setLoading(true);
      setError(null);
      const parametro = await parametroSistemaApi.getByClave('VALOR_HORA_MANO_OBRA');
      setValorHora(parametro.valor);
      setParametroId(parametro.id);
    } catch (err: any) {
      // Si el parámetro no existe, se creará al guardar
      if (err.response?.status === 404) {
        setValorHora('5000'); // Valor por defecto
      } else {
        setError('Error al cargar la configuración');
        console.error('Error loading parametro:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validar que sea un número válido
      const valor = parseFloat(valorHora);
      if (isNaN(valor) || valor < 0) {
        setError('Por favor ingrese un valor numérico válido mayor o igual a 0');
        return;
      }

      const parametroData: ParametroSistema = {
        id: parametroId || 0,
        clave: 'VALOR_HORA_MANO_OBRA',
        valor: valorHora,
        descripcion: 'Valor por hora de mano de obra para el cálculo de costos en órdenes de servicio',
        tipoDato: 'DECIMAL',
        fechaActualizacion: new Date().toISOString()
      };

      if (parametroId) {
        // Actualizar parámetro existente
        await parametroSistemaApi.update(parametroId, parametroData);
      } else {
        // Crear nuevo parámetro
        const created = await parametroSistemaApi.create(parametroData);
        setParametroId(created.id);
      }

      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la configuración');
      console.error('Error saving parametro:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Box display="flex" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <SettingsIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'primary.main', mr: { xs: 1, sm: 2 } }} />
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
            Configuración del Taller
          </Typography>
          <Typography variant="body2" color="textSecondary" mt={0.5} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Configure los parámetros del módulo de taller
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Box display="flex" alignItems="center" mb={3}>
            <MoneyIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'primary.main', mr: 1.5 }} />
            <Typography variant="h5" fontWeight="600" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
              Cálculo de Mano de Obra
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'info.50', mb: 3, borderLeft: '4px solid', borderColor: 'info.main' }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <strong>¿Cómo funciona el cálculo?</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              El costo de mano de obra se calcula automáticamente multiplicando el <strong>valor por hora</strong> configurado aquí
              por la suma de las <strong>horas reales</strong> de todas las tareas de la orden de servicio.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              <strong>Fórmula:</strong> Costo Mano de Obra = Valor Hora × Total Horas Reales
            </Typography>
          </Paper>

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Valor por Hora de Mano de Obra"
              value={valorHora}
              onChange={(e) => setValorHora(e.target.value)}
              type="number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MoneyIcon />
                  </InputAdornment>
                ),
              }}
              helperText="Este valor se utilizará para calcular el costo de mano de obra en las órdenes de servicio"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1.2rem',
                  fontWeight: 500
                }
              }}
            />

            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600" display="block" mb={1}>
                EJEMPLO DE CÁLCULO
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Si una orden de servicio tiene 3 tareas con 2, 3 y 5 horas reales respectivamente:
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                • Total horas: 2 + 3 + 5 = <strong>10 horas</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Costo mano de obra: ${valorHora || '0'} × 10 = <strong>${(parseFloat(valorHora || '0') * 10).toLocaleString('es-AR')}</strong>
              </Typography>
            </Paper>

            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="flex-end" spacing={2} mt={2}>
              <Button
                variant="outlined"
                onClick={loadParametro}
                disabled={saving}
                fullWidth={isMobile}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                size="large"
                fullWidth={isMobile}
              >
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mt: 3, bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main' }}>
        <Typography variant="body2" fontWeight="600" gutterBottom>
          ⚠️ Nota Importante
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Los cambios en el valor por hora afectarán el cálculo de costos de todas las órdenes de servicio.
          El sistema recalcula automáticamente los costos cuando se agregan o modifican tareas.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ConfiguracionTallerPage;
