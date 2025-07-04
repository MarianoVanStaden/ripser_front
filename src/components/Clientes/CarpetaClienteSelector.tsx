import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { clienteApiWithFallback as clienteApi } from '../../api/services/apiWithFallback';
import type { Cliente } from '../../types';

const CarpetaClienteSelector: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clienteApi.getAll();
      setClientes(data);
    } catch (err) {
      setError('Error al cargar los clientes');
      console.error('Error loading clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCliente = (clienteId: number) => {
    navigate(`/clientes/carpeta/${clienteId}`);
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (cliente.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" display="flex" alignItems="center">
          <FolderIcon sx={{ mr: 2 }} />
          Carpeta de Cliente
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/clientes/gestion')}
        >
          Volver a Gestión de Clientes
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Buscar cliente"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          placeholder="Buscar por nombre, apellido, razón social o email..."
        />
      </Paper>

      {/* Client Selection */}
      <Typography variant="h6" gutterBottom>
        Seleccione un cliente para ver su carpeta:
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
        {filteredClientes.map((cliente) => (
          <Card key={cliente.id} elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {cliente.tipo === 'PERSONA_JURIDICA' ? <BusinessIcon /> : <PersonIcon />}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" component="h3">
                    {cliente.nombre} {cliente.apellido}
                  </Typography>
                  {cliente.razonSocial && (
                    <Typography variant="body2" color="text.secondary">
                      {cliente.razonSocial}
                    </Typography>
                  )}
                  {cliente.email && (
                    <Typography variant="body2" color="text.secondary">
                      {cliente.email}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={cliente.estado}
                  color={cliente.estado === 'ACTIVO' ? 'success' : 'default'}
                  size="small"
                />
                <Chip
                  label={cliente.tipo === 'PERSONA_JURIDICA' ? 'Empresa' : 'Particular'}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {cliente.telefono && (
                <Typography variant="body2" color="text.secondary">
                  Tel: {cliente.telefono}
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                fullWidth
                startIcon={<FolderIcon />}
                onClick={() => handleSelectCliente(cliente.id)}
              >
                Ver Carpeta
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      {filteredClientes.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'No hay clientes registrados'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CarpetaClienteSelector;
