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
  CircularProgress,
  Alert,
  FormLabel,
  Rating,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import type { TipoCliente, EstadoCliente } from '../../types';
import { clienteApiWithFallback as clienteApi } from '../../api/services/apiWithFallback';

const ClienteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

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
    direccion: '',
    ciudad: '',
    provincia: '',
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
        direccion: cliente.direccion || '',
        ciudad: cliente.ciudad || '',
        provincia: cliente.provincia || '',
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
    if (formData.tipo === 'PERSONA_JURIDICA' && !formData.razonSocial.trim()) {
      setError('La razón social es obligatoria para personas jurídicas');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await clienteApi.update(Number(id), formData);
        setSuccess('Cliente actualizado exitosamente');
      } else {
        await clienteApi.create(formData);
        setSuccess('Cliente creado exitosamente');
        setFormData({
          nombre: '',
          apellido: '',
          razonSocial: '',
          cuit: '',
          email: '',
          telefono: '',
          direccion: '',
          ciudad: '',
          provincia: '',
          codigoPostal: '',
          tipo: 'PERSONA_FISICA',
          estado: 'ACTIVO',
          limiteCredito: 0,
          calificacion: 0,
        });
      }
    } catch {
      setError('Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/clientes/gestion');

  if (loading && isEdit) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleCancel} sx={{ mr: 2 }}>
          Volver
        </Button>
        <Typography variant="h4">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</Typography>
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
                size="small"
                label="Provincia"
                value={formData.provincia}
                onChange={handleFormChange}
                name="provincia"
              />
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
          <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              startIcon={<CancelIcon />}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              type="submit"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Cliente'}
            </Button>
          </Box>
        </Paper>
      </form>
    </Box>
  );
};

export default ClienteFormPage;


