import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Grid,
  InputAdornment,
  Button,
  Alert,
  FormLabel,
  Rating,
  Divider,
  useMediaQuery,
  useTheme,
  Stack,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import type { TipoCliente, EstadoCliente, ProvinciaEnum } from '../../types';
import { PROVINCIA_LABELS } from '../../types/shared.enums';
import { RUBRO_OPTIONS, type RubroEnum } from '../../types/rubro.types';
import { clienteApiWithFallback as clienteApi } from '../../api/services/apiWithFallback';
import LoadingOverlay from '../common/LoadingOverlay';

const ClienteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    razonSocial: '',
    cuit: '',
    email: '',
    telefono: '',
    telefonoAlternativo: '',
    rubro: undefined as RubroEnum | undefined,
    rubroDetalle: '',
    direccion: '',
    ciudad: '',
    provincia: undefined as ProvinciaEnum | undefined,
    codigoPostal: '',
    tipo: 'PERSONA_FISICA' as TipoCliente,
    estado: 'ACTIVO' as EstadoCliente,
    limiteCredito: 0,
    calificacion: 0,
  });

  useEffect(() => {
    if (isEdit && id) {
      loadCliente(Number(id));
    }
  }, [isEdit, id]);

  const loadCliente = async (clienteId: number) => {
    try {
      setLoading(true);
      const cliente = await clienteApi.getById(clienteId);
      setFormData({
        nombre: cliente.nombre,
        apellido: cliente.apellido || '',
        razonSocial: cliente.razonSocial || '',
        cuit: cliente.cuit || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        telefonoAlternativo: cliente.telefonoAlternativo || '',
        rubro: cliente.rubro,
        rubroDetalle: cliente.rubroDetalle || '',
        direccion: cliente.direccion || '',
        ciudad: cliente.ciudad || '',
        provincia: cliente.provincia,
        codigoPostal: cliente.codigoPostal || '',
        tipo: cliente.tipo,
        estado: cliente.estado,
        limiteCredito: cliente.limiteCredito ?? 0,
        calificacion: cliente.calificacion ?? 0,
      });
    } catch {
      setError('Error al cargar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleRatingChange = (_: React.SyntheticEvent, newValue: number | null) => {
    setFormData((prev) => ({ ...prev, calificacion: newValue ?? 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (formData.tipo === 'PERSONA_FISICA' && !formData.apellido.trim()) {
      setError('El apellido es obligatorio para personas físicas');
      return;
    }
    if (formData.tipo === 'PERSONA_JURIDICA' && !formData.razonSocial.trim()) {
      setError('La razón social es obligatoria para personas jurídicas');
      return;
    }
    if (!formData.email.trim()) {
      setError('El email es obligatorio');
      return;
    }
    if (formData.rubro === 'OTRO' && !formData.rubroDetalle.trim()) {
      setError('Especificá el rubro en "Detalle del rubro"');
      return;
    }

    try {
      setLoading(true);

      // Prepare data for submission
      const submitData = { ...formData };

      // For PERSONA_JURIDICA, ensure apellido is empty or set a default if needed
      if (submitData.tipo === 'PERSONA_JURIDICA' && !submitData.apellido) {
        submitData.apellido = '';
      }

      if (isEdit && id) {
        await clienteApi.update(Number(id), submitData);
        setSuccess('Cliente actualizado exitosamente');
      } else {
        await clienteApi.create(submitData);
        setSuccess('Cliente creado exitosamente');
        setFormData({
          nombre: '',
          apellido: '',
          razonSocial: '',
          cuit: '',
          email: '',
          telefono: '',
          telefonoAlternativo: '',
          rubro: undefined as RubroEnum | undefined,
          rubroDetalle: '',
          direccion: '',
          ciudad: '',
          provincia: undefined as ProvinciaEnum | undefined,
          codigoPostal: '',
          tipo: 'PERSONA_FISICA',
          estado: 'ACTIVO',
          limiteCredito: 0,
          calificacion: 0,
        });
      }
    } catch (err: any) {
      // Display backend validation errors if available
      if (err?.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).join(', ');
          setError(errorMessages || 'Error al guardar el cliente');
        } else {
          setError(errorData || 'Error al guardar el cliente');
        }
      } else {
        setError('Error al guardar el cliente');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/clientes/gestion');

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', p: { xs: 2, md: 3 } }}>
      <LoadingOverlay open={loading && isEdit} message="Cargando cliente..." />
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleCancel} size={isMobile ? 'small' : 'medium'}>
          {isMobile ? '' : 'Volver'}
        </Button>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {/* Tipo */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Tipo de Cliente"
                value={formData.tipo}
                onChange={handleFormChange}
                name="tipo"
              >
                <MenuItem value="PERSONA_FISICA">Persona Física</MenuItem>
                <MenuItem value="PERSONA_JURIDICA">Persona Jurídica</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Estado"
                value={formData.estado}
                onChange={handleFormChange}
                name="estado"
              >
                <MenuItem value="ACTIVO">Activo</MenuItem>
                <MenuItem value="INACTIVO">Inactivo</MenuItem>
                <MenuItem value="SUSPENDIDO">Suspendido</MenuItem>
                <MenuItem value="MOROSO">Moroso</MenuItem>
              </TextField>
            </Grid>

            <Divider flexItem sx={{ my: 2, width: '100%' }} />

            {/* Datos básicos */}
            {formData.tipo === 'PERSONA_FISICA' ? (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nombre"
                    value={formData.nombre}
                    onChange={handleFormChange}
                    name="nombre"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Apellido"
                    value={formData.apellido}
                    onChange={handleFormChange}
                    name="apellido"
                    required
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Razón Social"
                    value={formData.razonSocial}
                    onChange={handleFormChange}
                    name="razonSocial"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nombre Fantasía"
                    value={formData.nombre}
                    onChange={handleFormChange}
                    name="nombre"
                    required
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label={formData.tipo === 'PERSONA_FISICA' ? 'DNI/CUIL' : 'CUIT'}
                value={formData.cuit}
                onChange={handleFormChange}
                name="cuit"
              />
            </Grid>

            <Divider flexItem sx={{ my: 2, width: '100%' }} />

            {/* Contacto */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                name="email"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Teléfono"
                value={formData.telefono}
                onChange={handleFormChange}
                name="telefono"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Teléfono alternativo"
                placeholder="opcional"
                value={formData.telefonoAlternativo}
                onChange={handleFormChange}
                name="telefonoAlternativo"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                size="small"
                label="Rubro"
                value={formData.rubro || ''}
                onChange={handleFormChange}
                name="rubro"
              >
                <MenuItem value="">
                  <em>Sin especificar</em>
                </MenuItem>
                {RUBRO_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label={formData.rubro === 'OTRO' ? 'Detalle del rubro (especificar)' : 'Detalle del rubro'}
                placeholder={formData.rubro === 'OTRO' ? 'ej: heladerías, carnicería' : 'opcional'}
                value={formData.rubroDetalle}
                onChange={handleFormChange}
                name="rubroDetalle"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Dirección"
                value={formData.direccion}
                onChange={handleFormChange}
                name="direccion"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Ciudad"
                value={formData.ciudad}
                onChange={handleFormChange}
                name="ciudad"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                size="small"
                label="Provincia"
                value={formData.provincia || ''}
                onChange={handleFormChange}
                name="provincia"
              >
                <MenuItem value="">
                  <em>Ninguna</em>
                </MenuItem>
                {Object.entries(PROVINCIA_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Código Postal"
                value={formData.codigoPostal}
                onChange={handleFormChange}
                name="codigoPostal"
              />
            </Grid>

            <Divider flexItem sx={{ my: 2, width: '100%' }} />

            {/* Comercial */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Límite de Crédito"
                name="limiteCredito"
                value={formData.limiteCredito}
                onChange={handleFormChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormLabel>Calificación</FormLabel>
              <Rating
                name="calificacion"
                value={formData.calificacion}
                onChange={handleRatingChange}
                precision={0.5}
              />
            </Grid>
          </Grid>

          {/* Botones */}
          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="flex-end" spacing={2} mt={3}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              startIcon={<CancelIcon />}
              disabled={loading}
              fullWidth={isMobile}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              type="submit"
              startIcon={<SaveIcon />}
              disabled={loading}
              fullWidth={isMobile}
            >
              {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Cliente'}
            </Button>
          </Stack>
        </Paper>
      </form>
    </Box>
  );
};

export default ClienteFormPage;


