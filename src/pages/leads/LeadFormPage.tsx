import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { leadApi } from '../../api/services/leadApi';
import {
  EstadoLeadEnum,
  CanalEnum,
  ProvinciaEnum,
  ESTADO_LABELS,
  CANAL_LABELS,
  PROVINCIA_LABELS
} from '../../types/lead.types';
import type { LeadDTO, ValidationErrors } from '../../types/lead.types';

export const LeadFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [formData, setFormData] = useState<Partial<LeadDTO>>({
    nombre: '',
    telefono: '',
    provincia: undefined,
    canal: CanalEnum.WHATSAPP,
    estadoLead: EstadoLeadEnum.PRIMER_CONTACTO,
    fechaPrimerContacto: new Date().toISOString().split('T')[0],
    equipoInteresadoId: undefined,
    recordatorio1Fecha: '',
    recordatorio1Enviado: false,
    recordatorio2Fecha: '',
    recordatorio2Enviado: false
  });

  // Cargar datos del lead si estamos en modo edición
  useEffect(() => {
    if (isEditMode && id) {
      loadLead(parseInt(id));
    }
  }, [id, isEditMode]);

  const loadLead = async (leadId: number) => {
    try {
      setLoading(true);
      const data = await leadApi.getById(leadId);
      setFormData(data);
    } catch (err) {
      console.error('Error al cargar lead:', err);
      setError('Error al cargar el lead');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.nombre || formData.nombre.trim() === '') {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.telefono || formData.telefono.trim() === '') {
      newErrors.telefono = 'El teléfono es obligatorio';
    }

    if (!formData.canal) {
      newErrors.canal = 'El canal es obligatorio';
    }

    if (!formData.estadoLead) {
      newErrors.estadoLead = 'El estado es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isEditMode && id) {
        await leadApi.update(parseInt(id), formData as LeadDTO);
      } else {
        await leadApi.create(formData as Omit<LeadDTO, 'id' | 'dias' | 'fechaConversion'>);
      }

      navigate('/leads');
    } catch (err) {
      console.error('Error al guardar lead:', err);
      setError('Error al guardar el lead. Por favor, intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof LeadDTO) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });

    // Limpiar error del campo
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/leads')}
          sx={{ mb: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Editar Lead' : 'Nuevo Lead'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Información Básica */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Información de Contacto
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Nombre"
                  value={formData.nombre}
                  onChange={handleChange('nombre')}
                  error={Boolean(errors.nombre)}
                  helperText={errors.nombre}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={handleChange('telefono')}
                  error={Boolean(errors.telefono)}
                  helperText={errors.telefono}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Provincia</InputLabel>
                  <Select
                    value={formData.provincia || ''}
                    onChange={handleChange('provincia')}
                    label="Provincia"
                  >
                    <MenuItem value="">
                      <em>Ninguna</em>
                    </MenuItem>
                    {Object.values(ProvinciaEnum).map((provincia) => (
                      <MenuItem key={provincia} value={provincia}>
                        {PROVINCIA_LABELS[provincia]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Canal y Estado */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Datos del Lead
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={Boolean(errors.canal)}>
                  <InputLabel>Canal</InputLabel>
                  <Select
                    value={formData.canal || ''}
                    onChange={handleChange('canal')}
                    label="Canal"
                  >
                    {Object.values(CanalEnum).map((canal) => (
                      <MenuItem key={canal} value={canal}>
                        {CANAL_LABELS[canal]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={Boolean(errors.estadoLead)}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.estadoLead || ''}
                    onChange={handleChange('estadoLead')}
                    label="Estado"
                  >
                    {Object.values(EstadoLeadEnum).map((estado) => (
                      <MenuItem key={estado} value={estado}>
                        {ESTADO_LABELS[estado]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha Primer Contacto"
                  value={formData.fechaPrimerContacto}
                  onChange={handleChange('fechaPrimerContacto')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="ID Equipo Interesado"
                  value={formData.equipoInteresadoId || ''}
                  onChange={handleChange('equipoInteresadoId')}
                  helperText="Opcional: ID del producto en el que está interesado"
                />
              </Grid>

              {/* Recordatorios */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Recordatorios
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Recordatorio 1"
                  value={formData.recordatorio1Fecha || ''}
                  onChange={handleChange('recordatorio1Fecha')}
                  InputLabelProps={{ shrink: true }}
                  helperText="Fecha para el primer recordatorio"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Recordatorio 2"
                  value={formData.recordatorio2Fecha || ''}
                  onChange={handleChange('recordatorio2Fecha')}
                  InputLabelProps={{ shrink: true }}
                  helperText="Fecha para el segundo recordatorio"
                />
              </Grid>

              {/* Botones */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/leads')}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
