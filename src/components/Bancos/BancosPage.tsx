import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Grid,
  InputAdornment,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { bancoApi } from '../../api/services/bancoApi';
import { usePermisos } from '../../hooks/usePermisos';
import type { Banco } from '../../types';
import BancoFormDialog from './BancoFormDialog';

const BancosPage: React.FC = () => {
  // Permisos y contexto
  const { tienePermiso } = usePermisos();

  // Estados
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados de dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedBanco, setSelectedBanco] = useState<Banco | null>(null);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar datos
  useEffect(() => {
    if (tienePermiso('ADMINISTRACION')) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const bancosData = await bancoApi.getAll();
      setBancos(Array.isArray(bancosData) ? bancosData : []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading data:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError('No tiene permisos para acceder a esta información');
      } else {
        setError('Error al cargar los datos');
      }
    } finally {
      setLoading(false);
    }
  };

  // Bancos filtrados
  const filteredBancos = useMemo(() => {
    return bancos.filter((banco) => {
      const matchesSearch =
        banco.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banco.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banco.nombreCorto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banco.cbu?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [bancos, searchTerm]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = bancos.length;
    const activos = bancos.filter((b) => b.activo).length;
    const inactivos = bancos.filter((b) => !b.activo).length;

    return { total, activos, inactivos };
  }, [bancos]);

  // Handlers
  const handleOpenForm = (banco?: Banco) => {
    setSelectedBanco(banco || null);
    setFormDialogOpen(true);
  };

  const handleCloseForm = () => {
    setFormDialogOpen(false);
    setSelectedBanco(null);
  };

  const handleSave = async () => {
    await loadData();
    handleCloseForm();
    setSuccess('Banco guardado correctamente');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDelete = async (banco: Banco) => {
    if (!window.confirm(`¿Está seguro de eliminar el banco "${banco.nombre}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await bancoApi.delete(banco.id);
      await loadData();
      setSuccess('Banco eliminado correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting banco:', err);
      setError(err.response?.data?.message || 'Error al eliminar el banco');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Verificar permisos
  if (!tienePermiso('ADMINISTRACION')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para acceder a este módulo</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestión de Bancos
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
          Nuevo Banco
        </Button>
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

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Bancos
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Activos
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.activos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Inactivos
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.inactivos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nombre, código, CBU..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Nombre Corto</TableCell>
                <TableCell>CBU</TableCell>
                <TableCell>Alias</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBancos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                      No se encontraron bancos
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBancos.map((banco) => (
                  <TableRow key={banco.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {banco.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>{banco.nombre}</TableCell>
                    <TableCell>{banco.nombreCorto || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {banco.cbu || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{banco.alias || '-'}</TableCell>
                    <TableCell align="center">
                      {banco.activo ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Activo"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<CancelIcon />}
                          label="Inactivo"
                          color="error"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpenForm(banco)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(banco)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog */}
      <BancoFormDialog
        open={formDialogOpen}
        banco={selectedBanco}
        onClose={handleCloseForm}
        onSave={handleSave}
      />
    </Box>
  );
};

export default BancosPage;
