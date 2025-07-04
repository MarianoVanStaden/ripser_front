import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import type { CreateClienteRequest } from '../../types';
import { clienteApiWithFallback as clienteApi } from '../../api/services/apiWithFallback';

const ClienteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateClienteRequest>({
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
        limiteCredito: cliente.limiteCredito,
      });
    } catch (err) {
      setError('Error al cargar el cliente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateClienteRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'limiteCredito' ? Number(event.target.value) : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones básicas
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (formData.tipo === 'PERSONA_JURIDICA' && !formData.razonSocial?.trim()) {
      setError('La razón social es obligatoria para personas jurídicas');
      return;
    }

    if (formData.limiteCredito < 0) {
      setError('El límite de crédito no puede ser negativo');
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
        // Reset form for new client
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
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el cliente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/clientes/gestion');
  };

  if (loading && isEdit) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1">
          {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Form */}
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={3}>
            
            {/* Tipo de Cliente */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Tipo de Cliente
              </Typography>
              <TextField
                select
                fullWidth
                label="Tipo"
                value={formData.tipo}
                onChange={handleInputChange('tipo')}
                required
              >
                <MenuItem value="PERSONA_FISICA">Persona Física</MenuItem>
                <MenuItem value="PERSONA_JURIDICA">Persona Jurídica</MenuItem>
              </TextField>
            </Box>

            <Divider />

            {/* Información Básica */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Información Básica
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {formData.tipo === 'PERSONA_FISICA' ? (
                  <>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Box flex="1" minWidth="200px">
                        <TextField
                          fullWidth
                          label="Nombre"
                          value={formData.nombre}
                          onChange={handleInputChange('nombre')}
                          required
                        />
                      </Box>
                      <Box flex="1" minWidth="200px">
                        <TextField
                          fullWidth
                          label="Apellido"
                          value={formData.apellido}
                          onChange={handleInputChange('apellido')}
                        />
                      </Box>
                    </Box>
                  </>
                ) : (
                  <>
                    <TextField
                      fullWidth
                      label="Razón Social"
                      value={formData.razonSocial}
                      onChange={handleInputChange('razonSocial')}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Nombre de Fantasía"
                      value={formData.nombre}
                      onChange={handleInputChange('nombre')}
                      required
                    />
                  </>
                )}
                
                <TextField
                  fullWidth
                  label={formData.tipo === 'PERSONA_FISICA' ? 'DNI/CUIL' : 'CUIT'}
                  value={formData.cuit}
                  onChange={handleInputChange('cuit')}
                />
              </Box>
            </Box>

            <Divider />

            {/* Información de Contacto */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Información de Contacto
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Box flex="1" minWidth="200px">
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                    />
                  </Box>
                  <Box flex="1" minWidth="200px">
                    <TextField
                      fullWidth
                      label="Teléfono"
                      value={formData.telefono}
                      onChange={handleInputChange('telefono')}
                    />
                  </Box>
                </Box>
                
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.direccion}
                  onChange={handleInputChange('direccion')}
                />
                
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Box flex="1" minWidth="200px">
                    <TextField
                      fullWidth
                      label="Ciudad"
                      value={formData.ciudad}
                      onChange={handleInputChange('ciudad')}
                    />
                  </Box>
                  <Box flex="1" minWidth="200px">
                    <TextField
                      fullWidth
                      label="Provincia"
                      value={formData.provincia}
                      onChange={handleInputChange('provincia')}
                    />
                  </Box>
                  <Box flex="1" minWidth="150px">
                    <TextField
                      fullWidth
                      label="Código Postal"
                      value={formData.codigoPostal}
                      onChange={handleInputChange('codigoPostal')}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Información Comercial */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Información Comercial
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box flex="1" minWidth="200px">
                  <TextField
                    select
                    fullWidth
                    label="Estado"
                    value={formData.estado}
                    onChange={handleInputChange('estado')}
                    required
                  >
                    <MenuItem value="ACTIVO">Activo</MenuItem>
                    <MenuItem value="INACTIVO">Inactivo</MenuItem>
                    <MenuItem value="SUSPENDIDO">Suspendido</MenuItem>
                    <MenuItem value="MOROSO">Moroso</MenuItem>
                  </TextField>
                </Box>
                <Box flex="1" minWidth="200px">
                  <TextField
                    fullWidth
                    label="Límite de Crédito"
                    type="number"
                    value={formData.limiteCredito}
                    onChange={handleInputChange('limiteCredito')}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Actions */}
            <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
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
                {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear Cliente')}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ClienteFormPage;
