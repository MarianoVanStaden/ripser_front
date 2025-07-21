import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  MenuItem,
  Tooltip,
  CircularProgress,
  Rating, // Import the Rating component
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Clear as ClearIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Cliente, TipoCliente, EstadoCliente } from '../../types';
import { clienteApi } from '../../api/services/clienteApi';

const ClientesPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoCliente | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoCliente | ''>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clienteApi.getAll();
      setClientes(data);
    } catch (err) {
      setError('Error al cargar los clientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadClientes();
      return;
    }

    try {
      setLoading(true);
      const results = await clienteApi.search(searchTerm);
      setClientes(results);
    } catch (err) {
      setError('Error al buscar clientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTipoFilter('');
    setEstadoFilter('');
    loadClientes();
  };

  const filteredClientes = clientes.filter(cliente => {
    const matchesTipo = !tipoFilter || cliente.tipo === tipoFilter;
    const matchesEstado = !estadoFilter || cliente.estado === estadoFilter;
    return matchesTipo && matchesEstado;
  });

  const getEstadoColor = (estado: EstadoCliente) => {
    switch (estado) {
      case 'ACTIVO':
        return 'success';
      case 'INACTIVO':
        return 'default';
      case 'SUSPENDIDO':
        return 'warning';
      case 'MOROSO':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTipoIcon = (tipo: TipoCliente) => {
    switch (tipo) {
      case 'PERSONA_FISICA':
        return <PersonIcon />;
      case 'PERSONA_JURIDICA':
        return <BusinessIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const handleViewCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setOpenDialog(true);
  };

  if (loading && clientes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/clientes/nuevo')}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          <Box flex="1" minWidth="300px">
            <TextField
              fullWidth
              label="Buscar clientes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box minWidth="150px">
            <TextField
              fullWidth
              select
              label="Tipo"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as TipoCliente | '')}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="PERSONA_FISICA">Persona Física</MenuItem>
              <MenuItem value="PERSONA_JURIDICA">Persona Jurídica</MenuItem>
            </TextField>
          </Box>
          <Box minWidth="150px">
            <TextField
              fullWidth
              select
              label="Estado"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as EstadoCliente | '')}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ACTIVO">Activo</MenuItem>
              <MenuItem value="INACTIVO">Inactivo</MenuItem>
              <MenuItem value="SUSPENDIDO">Suspendido</MenuItem>
              <MenuItem value="MOROSO">Moroso</MenuItem>
            </TextField>
          </Box>
          <Box>
            <Button
              variant="outlined"
              onClick={handleSearch}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Buscar
            </Button>
            <Button
              variant="text"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
            >
              Limpiar
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Results Summary */}
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Cargando...' : `${filteredClientes.length} cliente(s) encontrado(s)`}
        </Typography>
      </Box>

      {/* Clients Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
        {filteredClientes.map((cliente) => (
          <Card key={cliente.id}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getTipoIcon(cliente.tipo)}
                    <Typography variant="h6" component="div">
                      {cliente.nombre}
                    </Typography>
                  </Box>
                  <Chip
                    label={cliente.estado}
                    color={getEstadoColor(cliente.estado)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {cliente.tipo === 'PERSONA_FISICA' ? 'DNI' : 'CUIT'}: {cliente.cuit || 'N/A'}
                </Typography>

                {cliente.email && (
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{cliente.email}</Typography>
                  </Box>
                )}

                {cliente.telefono && (
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">{cliente.telefono}</Typography>
                  </Box>
                )}

                <Typography variant="body2" color="text.secondary" mb={2}>
                  Crédito: ${cliente.limiteCredito?.toLocaleString() || 'N/A'}
                </Typography>

                <Box display="flex" alignItems="center" mt={1} mb={2}>
                  <Typography variant="body2" color="text.secondary" mr={1}>
                    Calificación:
                  </Typography>
                  <Rating
                    name={`rating-${cliente.id}`}
                    value={cliente.calificacion ?? 0}
                    precision={0.5}
                    readOnly
                    size="small"
                  />
                </Box>

                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <Tooltip title="Ver detalles">
                    <IconButton size="small" onClick={() => handleViewCliente(cliente)}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => navigate(`/clientes/editar/${cliente.id}`)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cuenta Corriente">
                    <IconButton size="small" onClick={() => navigate(`/clientes/cuenta-corriente/${cliente.id}`)}>
                      <AccountBalanceWalletIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
        ))}
      </Box>

      {filteredClientes.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron clientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || tipoFilter || estadoFilter
              ? 'Intenta con diferentes criterios de búsqueda'
              : 'Comienza agregando tu primer cliente'
            }
          </Typography>
        </Box>
      )}

      {/* Cliente Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles del Cliente
        </DialogTitle>
        <DialogContent>
          {selectedCliente && (
            <Box>
              <Box display="flex" flexWrap="wrap" gap={4} mb={3}>
                <Box flex="1" minWidth="250px">
                  <Typography variant="subtitle2" gutterBottom>
                    Información General
                  </Typography>
                  <Typography><strong>Nombre:</strong> {selectedCliente.nombre}</Typography>
                  <Typography><strong>Tipo:</strong> {selectedCliente.tipo}</Typography>
                  <Typography><strong>CUIT:</strong> {selectedCliente.cuit || 'N/A'}</Typography>
                  <Typography><strong>Estado:</strong> {selectedCliente.estado}</Typography>
                </Box>
                <Box flex="1" minWidth="250px">
                  <Typography variant="subtitle2" gutterBottom>
                    Contacto
                  </Typography>
                  <Typography><strong>Email:</strong> {selectedCliente.email || 'N/A'}</Typography>
                  <Typography><strong>Teléfono:</strong> {selectedCliente.telefono || 'N/A'}</Typography>
                  <Typography><strong>Dirección:</strong> {selectedCliente.direccion || 'N/A'}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Información Comercial
                </Typography>
                <Typography><strong>Límite de Crédito:</strong> ${selectedCliente.limiteCredito?.toLocaleString() || 'N/A'}</Typography>
                <Typography><strong>Saldo Actual:</strong> ${selectedCliente.saldoActual?.toLocaleString() || '0'}</Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <Typography variant="body2" color="text.secondary" mr={1}>
                    Calificación:
                  </Typography>
                  <Rating
                    name={`rating-detail-${selectedCliente.id}`}
                    value={selectedCliente.calificacion ?? 0}
                    precision={0.5}
                    readOnly
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
          <Button variant="contained" onClick={() => navigate(`/clientes/detalle/${selectedCliente?.id}`)}>
            Ver Completo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientesPage;
