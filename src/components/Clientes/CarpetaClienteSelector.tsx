import React, { useState, useEffect, useMemo } from 'react';
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
  Avatar,
  Chip,
  Grid,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { clienteApiWithFallback as clienteApi } from '../../api/services/apiWithFallback';
import LoadingOverlay from '../common/LoadingOverlay';
import type { Cliente } from '../../types';

const CarpetaClienteSelector: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = (await clienteApi.getAll({ page: 0, size: 500 })).content;
      setClientes(data);
    } catch (err) {
      setError('Error al cargar los clientes');
      console.error('Error loading clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      (c.nombre ?? '').toLowerCase().includes(q) ||
      (c.apellido ?? '').toLowerCase().includes(q) ||
      (c.razonSocial ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  }, [clientes, searchTerm]);

  // Ordenar alfabéticamente por nombre
  const sortedClientes = useMemo(() => {
    return [...filteredClientes].sort((a, b) => {
      const nombreA = `${a.nombre ?? ''} ${a.apellido ?? ''}`.toLowerCase();
      const nombreB = `${b.nombre ?? ''} ${b.apellido ?? ''}`.toLowerCase();
      return nombreA.localeCompare(nombreB);
    });
  }, [filteredClientes]);

  // Paginación
  const paginatedClientes = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return sortedClientes.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedClientes, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectCliente = (clienteId: number) => {
    navigate(`/clientes/carpeta/${clienteId}`);
  };

  return (
    <Box sx={{ px: { sm: 2, md: 3, lg: 4 }, py: { sm: 2, md: 3 }, maxWidth: '1600px', mx: 'auto' }}>
      <LoadingOverlay open={loading} message="Cargando clientes..." />
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" display="flex" alignItems="center" gap={1.5}>
          <FolderIcon />
          Carpeta de Cliente
        </Typography>
        <Button variant="contained" onClick={() => navigate('/clientes/gestion')}>
          Volver a Gestión de Clientes
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
        }}
      >
        <TextField
          fullWidth
          size="small"
          label="Buscar cliente"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, apellido, razón social o email..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ ml: 0.5 }}>
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: 999 },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
          {sortedClientes.length} resultado(s)
        </Typography>
      </Paper>

      {/* Client Selection */}
      <Typography variant="h6" gutterBottom>
        Seleccione un cliente para ver su carpeta
      </Typography>

      <Grid container spacing={2.5} alignItems="stretch">
        {paginatedClientes.map((cliente) => (
          <Grid key={cliente.id} item xs={12} sm={6} md={4} lg={3}>
            <Card elevation={1} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box display="flex" alignItems="center" mb={2} gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {cliente.tipo === 'PERSONA_JURIDICA' ? <BusinessIcon /> : <PersonIcon />}
                  </Avatar>
                  <Box minWidth={0}>
                    <Typography variant="h6" component="h3" noWrap title={`${cliente.nombre} ${cliente.apellido ?? ''}`}>
                      {cliente.nombre} {cliente.apellido}
                    </Typography>
                    {cliente.razonSocial && (
                      <Typography variant="body2" color="text.secondary" noWrap title={cliente.razonSocial}>
                        {cliente.razonSocial}
                      </Typography>
                    )}
                    {cliente.email && (
                      <Typography variant="body2" color="text.secondary" noWrap title={cliente.email}>
                        {cliente.email}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                  <Chip
                    label={cliente.estado}
                    color={cliente.estado === 'ACTIVO' ? 'success' : cliente.estado === 'MOROSO' ? 'error' : 'default'}
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

              <CardActions sx={{ p: 2, pt: 0 }}>
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
          </Grid>
        ))}
      </Grid>

      {/* Paginación */}
      {sortedClientes.length > 0 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <TablePagination
            component="div"
            count={sortedClientes.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[6, 12, 24, 48, 100]}
            labelRowsPerPage="Clientes por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Box>
      )}

      {filteredClientes.length === 0 && !loading && (
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'No se encontraron clientes que coincidan' : 'No hay clientes registrados'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Probá con otro término de búsqueda.' : 'Cargá tu primer cliente desde Gestión de Clientes.'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CarpetaClienteSelector;
