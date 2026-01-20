import React, { useState, useEffect, useMemo } from 'react';
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
  Rating,
  TablePagination,
  useMediaQuery,
  useTheme,
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
import { useTenant } from '../../context/TenantContext';

const ClientesPage: React.FC = () => {
  const navigate = useNavigate();
  const { sucursalFiltro } = useTenant();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoCliente | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoCliente | ''>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  useEffect(() => {
    loadClientes();
  }, [sucursalFiltro]); // Agregar dependencia sucursalFiltro

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clienteApi.getAll({
        sucursalId: sucursalFiltro
      });
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
      const results = await clienteApi.getAll({
        sucursalId: sucursalFiltro,
        term: searchTerm
      });
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
    setPage(0);
    loadClientes();
  };

  const filteredClientes = clientes.filter((cliente) => {
    const matchesTipo = !tipoFilter || cliente.tipo === tipoFilter;
    const matchesEstado = !estadoFilter || cliente.estado === estadoFilter;
    return matchesTipo && matchesEstado;
  });

  // Ordenar alfabéticamente por nombre
  const sortedClientes = useMemo(() => {
    return [...filteredClientes].sort((a, b) => {
      const nombreA = a.nombre?.toLowerCase() || '';
      const nombreB = b.nombre?.toLowerCase() || '';
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
    <Box
      sx={{
        px: { sm: 2, md: 3, lg: 4 },
        py: { sm: 2, md: 3 },
        maxWidth: '1600px',
        mx: 'auto',
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Gestión de Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/clientes/nuevo')}
          fullWidth={isMobile}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {sucursalFiltro && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Mostrando clientes filtrados por sucursal seleccionada
        </Alert>
      )}

      {/* Buscador y Filtros */}
      {/* Buscador y Filtros – versión compacta y más linda */}
<Paper
  sx={{
    p: { sm: 2, md: 2.5 },
    mb: 3,
    borderRadius: 3,
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
  }}
>
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 1.5,
    }}
  >
    {/* Buscar */}
    <TextField
      size="small"
      variant="outlined"
      placeholder="Buscar clientes"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      sx={{
        minWidth: { xs: '100%', sm: 360, md: 420 },
        flex: { xs: '1 1 100%', sm: '0 0 auto' },
        '& .MuiOutlinedInput-root': {
          borderRadius: 999,
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start" sx={{ ml: 0.5 }}>
            <SearchIcon fontSize="small" color="action" />
          </InputAdornment>
        ),
      }}
    />

    {/* Separador sutil */}
    <Box
      sx={{
        width: 1,
        display: { xs: 'block', sm: 'none' },
        my: 0.5,
        opacity: 0.5,
      }}
    />

    {/* Tipo */}
    <TextField
      select
      size="small"
      label="Tipo"
      value={tipoFilter}
      onChange={(e) => setTipoFilter(e.target.value as TipoCliente | '')}
      sx={{
        minWidth: { xs: '48%', sm: 160 },
        flex: { xs: '1 1 48%', sm: '0 0 auto' },
        '& .MuiOutlinedInput-root': { borderRadius: 999 },
      }}
    >
      <MenuItem value="">Todos</MenuItem>
      <MenuItem value="PERSONA_FISICA">Persona Física</MenuItem>
      <MenuItem value="PERSONA_JURIDICA">Persona Jurídica</MenuItem>
    </TextField>

    {/* Estado */}
    <TextField
      select
      size="small"
      label="Estado"
      value={estadoFilter}
      onChange={(e) => setEstadoFilter(e.target.value as EstadoCliente | '')}
      sx={{
        minWidth: { xs: '48%', sm: 160 },
        flex: { xs: '1 1 48%', sm: '0 0 auto' },
        '& .MuiOutlinedInput-root': { borderRadius: 999 },
      }}
    >
      <MenuItem value="">Todos</MenuItem>
      <MenuItem value="ACTIVO">Activo</MenuItem>
      <MenuItem value="INACTIVO">Inactivo</MenuItem>
      <MenuItem value="SUSPENDIDO">Suspendido</MenuItem>
      <MenuItem value="MOROSO">Moroso</MenuItem>
    </TextField>

    {/* Botones */}
    <Box sx={{ ml: { xs: 0, sm: 'auto' }, display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' }, mt: { xs: 1, sm: 0 } }}>
      <Button
        variant="contained"
        size="small"
        startIcon={<SearchIcon />}
        onClick={handleSearch}
        disabled={loading}
        fullWidth={isMobile}
        sx={{
          borderRadius: 999,
          px: 2.2,
          textTransform: 'none',
          fontWeight: 600,
          flex: { xs: 1, sm: 'none' },
        }}
      >
        Buscar
      </Button>

      <Button
        size="small"
        variant="text"
        startIcon={<ClearIcon />}
        onClick={clearFilters}
        sx={{
          borderRadius: 999,
          textTransform: 'none',
          color: 'text.secondary',
          '&:hover': { backgroundColor: 'action.hover' },
          flex: { xs: 1, sm: 'none' },
        }}
      >
        Limpiar
      </Button>
    </Box>
  </Box>
</Paper>


      {/* Resumen */}
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Cargando...' : `${sortedClientes.length} cliente(s) encontrado(s)`}
        </Typography>
      </Box>

      {/* Grid de Cards */}
      <Grid container spacing={2}>
        {paginatedClientes.map((cliente) => (
          <Grid key={cliente.id} item xs={12} sm={6} md={4} lg={3}>
            <Card>
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
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate('/clientes/cuenta-corriente', { state: { clienteId: cliente.id } })
                      }
                    >
                      <AccountBalanceWalletIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Paginación */}
      {sortedClientes.length > 0 && (
        <Box display="flex" justifyContent="center" mt={3}>
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
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron clientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || tipoFilter || estadoFilter
              ? 'Intenta con diferentes criterios de búsqueda'
              : 'Comienza agregando tu primer cliente'}
          </Typography>
        </Box>
      )}

      {/* Dialog Detalle */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Detalles del Cliente</DialogTitle>
        <DialogContent>
          {selectedCliente && (
            <Box>
              <Box display="flex" flexWrap="wrap" gap={{ xs: 2, sm: 4 }} mb={3}>
                <Box flex="1" minWidth={{ xs: '100%', sm: 250 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Información General
                  </Typography>
                  <Typography><strong>Nombre:</strong> {selectedCliente.nombre}</Typography>
                  <Typography><strong>Tipo:</strong> {selectedCliente.tipo}</Typography>
                  <Typography><strong>CUIT:</strong> {selectedCliente.cuit || 'N/A'}</Typography>
                  <Typography><strong>Estado:</strong> {selectedCliente.estado}</Typography>
                </Box>
                <Box flex="1" minWidth={{ xs: '100%', sm: 250 }}>
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

