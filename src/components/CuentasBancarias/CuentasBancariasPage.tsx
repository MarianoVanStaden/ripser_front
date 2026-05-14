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
import { cuentaBancariaApi } from '../../api/services/cuentaBancariaApi';
import { usePermisos } from '../../hooks/usePermisos';
import type { CuentaBancaria } from '../../types';
import CuentaBancariaFormDialog from './CuentaBancariaFormDialog';
import ConfirmDialog from '../common/ConfirmDialog';

const CuentasBancariasPage: React.FC = () => {
  const { tienePermiso } = usePermisos();

  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaBancaria | null>(null);
  const [cuentaToDelete, setCuentaToDelete] = useState<CuentaBancaria | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (tienePermiso('ADMINISTRACION')) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await cuentaBancariaApi.getAll();
      setCuentas(Array.isArray(data) ? data : []);
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

  const filteredCuentas = useMemo(() => {
    return cuentas.filter((cuenta) => {
      const term = searchTerm.toLowerCase();
      return (
        cuenta.bancoNombre?.toLowerCase().includes(term) ||
        cuenta.cbu?.toLowerCase().includes(term) ||
        cuenta.alias?.toLowerCase().includes(term) ||
        cuenta.numeroCuenta?.toLowerCase().includes(term)
      );
    });
  }, [cuentas, searchTerm]);

  const stats = useMemo(() => {
    const total = cuentas.length;
    const activas = cuentas.filter((c) => c.activo).length;
    const inactivas = cuentas.filter((c) => !c.activo).length;
    return { total, activas, inactivas };
  }, [cuentas]);

  const handleOpenForm = (cuenta?: CuentaBancaria) => {
    setSelectedCuenta(cuenta || null);
    setFormDialogOpen(true);
  };

  const handleCloseForm = () => {
    setFormDialogOpen(false);
    setSelectedCuenta(null);
  };

  const handleSave = async () => {
    await loadData();
    handleCloseForm();
    setSuccess('Cuenta bancaria guardada correctamente');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDelete = (cuenta: CuentaBancaria) => {
    setCuentaToDelete(cuenta);
  };

  const handleConfirmDelete = async () => {
    if (!cuentaToDelete) return;
    setDeleteLoading(true);
    try {
      await cuentaBancariaApi.delete(cuentaToDelete.id);
      await loadData();
      setSuccess('Cuenta bancaria eliminada correctamente');
      setTimeout(() => setSuccess(null), 3000);
      setCuentaToDelete(null);
    } catch (err: any) {
      console.error('Error deleting cuenta:', err);
      setError(err.response?.data?.message || 'Error al eliminar la cuenta bancaria');
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeleteLoading(false);
    }
  };

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
            Cuentas Bancarias
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
          Nueva Cuenta
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
                Total Cuentas
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Activas
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.activas}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Inactivas
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.inactivas}
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
            placeholder="Banco, CBU, alias, N. cuenta..."
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
                <TableCell>Banco</TableCell>
                <TableCell>CBU</TableCell>
                <TableCell>N. Cuenta</TableCell>
                <TableCell>Tipo Cuenta</TableCell>
                <TableCell>Alias</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCuentas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                      No se encontraron cuentas bancarias
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCuentas.map((cuenta) => (
                  <TableRow key={cuenta.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {cuenta.bancoNombre}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {cuenta.cbu || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{cuenta.numeroCuenta || '-'}</TableCell>
                    <TableCell>{cuenta.tipoCuenta || '-'}</TableCell>
                    <TableCell>{cuenta.alias || '-'}</TableCell>
                    <TableCell align="center">
                      {cuenta.activo ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Activa"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<CancelIcon />}
                          label="Inactiva"
                          color="error"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpenForm(cuenta)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(cuenta)}
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
      <CuentaBancariaFormDialog
        open={formDialogOpen}
        cuenta={selectedCuenta}
        onClose={handleCloseForm}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!cuentaToDelete}
        onClose={() => setCuentaToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar cuenta bancaria?"
        severity="error"
        warning="Esta acción no se puede deshacer."
        description="Está a punto de eliminar la siguiente cuenta bancaria:"
        itemDetails={
          cuentaToDelete && (
            <>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {cuentaToDelete.alias || cuentaToDelete.numeroCuenta || `Cuenta #${cuentaToDelete.id}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {cuentaToDelete.bancoNombre}
                {cuentaToDelete.tipoCuenta ? ` · ${cuentaToDelete.tipoCuenta}` : ''}
              </Typography>
            </>
          )
        }
        confirmLabel="Eliminar"
        loadingLabel="Eliminando…"
        loading={deleteLoading}
      />
    </Box>
  );
};

export default CuentasBancariasPage;
