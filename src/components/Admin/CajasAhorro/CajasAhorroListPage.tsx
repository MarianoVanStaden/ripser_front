import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid2 as Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SavingsIcon from '@mui/icons-material/Savings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { cajasAhorroApi } from '../../../api/services/cajasAhorroApi';
import type { CajaAhorroDolares } from '../../../types';
import { extractError, formatUSD } from './utils';
import CajaFormDialog from './dialogs/CajaFormDialog';
import DepositarDialog from './dialogs/DepositarDialog';
import ExtraerDialog from './dialogs/ExtraerDialog';
import ConvertirAmortizacionDialog from './dialogs/ConvertirAmortizacionDialog';

const CajasAhorroListPage: React.FC = () => {
  const navigate = useNavigate();
  const [cajas, setCajas] = useState<CajaAhorroDolares[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedCaja, setSelectedCaja] = useState<CajaAhorroDolares | null>(null);

  const [depositarOpen, setDepositarOpen] = useState(false);
  const [extraerOpen, setExtraerOpen] = useState(false);
  const [convertirOpen, setConvertirOpen] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const loadCajas = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const data = await cajasAhorroApi.getAll();
      setCajas(data);
    } catch (err) {
      setPageError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCajas();
  }, [loadCajas]);

  const handleOpenEdit = (caja: CajaAhorroDolares) => {
    setSelectedCaja(caja);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleOpenDepositar = (caja: CajaAhorroDolares) => {
    setSelectedCaja(caja);
    setDepositarOpen(true);
  };

  const handleOpenExtraer = (caja: CajaAhorroDolares) => {
    setSelectedCaja(caja);
    setExtraerOpen(true);
  };

  const handleOpenDeactivate = (caja: CajaAhorroDolares) => {
    setSelectedCaja(caja);
    setDeactivateError(null);
    setDeactivateOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedCaja) return;
    setDeactivating(true);
    setDeactivateError(null);
    try {
      await cajasAhorroApi.deactivate(selectedCaja.id);
      setDeactivateOpen(false);
      setSelectedCaja(null);
      loadCajas();
    } catch (err) {
      setDeactivateError(extractError(err));
    } finally {
      setDeactivating(false);
    }
  };

  const cajasActivas = cajas.filter((c) => c.estado === 'ACTIVA');

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <SavingsIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700}>
            Cajas de Ahorro USD
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<SwapHorizIcon />}
            onClick={() => setConvertirOpen(true)}
          >
            Convertir amortización → USD
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedCaja(null);
              setFormMode('create');
              setFormOpen(true);
            }}
          >
            Nueva caja
          </Button>
        </Stack>
      </Box>

      {/* Estados */}
      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {pageError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {pageError}
        </Alert>
      )}

      {!loading && !pageError && cajas.length === 0 && (
        <Alert severity="info">
          No hay cajas de ahorro registradas. Cree la primera con "+ Nueva caja".
        </Alert>
      )}

      {/* Grid de cards */}
      {!loading && cajas.length > 0 && (
        <Grid container spacing={2}>
          {cajas.map((caja) => {
            const activa = caja.estado === 'ACTIVA';
            return (
              <Grid key={caja.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    opacity: activa ? 1 : 0.55,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Nombre y estado */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ flex: 1, mr: 1, wordBreak: 'break-word' }}
                      >
                        {caja.nombre}
                      </Typography>
                      <Chip
                        label={activa ? 'Activa' : 'Inactiva'}
                        color={activa ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    {/* Descripción */}
                    {caja.descripcion && (
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {caja.descripcion}
                      </Typography>
                    )}

                    {/* Métodos aceptados (modelo N:M) */}
                    {caja.metodosAceptados && caja.metodosAceptados.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} mb={1}>
                        {caja.metodosAceptados.map((m) => (
                          <Chip
                            key={m.metodoPago}
                            size="small"
                            label={m.esDefault ? `⭐ ${m.metodoPago}` : m.metodoPago}
                            variant={m.esDefault ? 'filled' : 'outlined'}
                            color={m.esDefault ? 'primary' : 'default'}
                          />
                        ))}
                      </Stack>
                    )}

                    {/* Saldo */}
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color={caja.saldoActual < 0 ? 'error.main' : 'success.main'}
                      mt={1}
                      mb={2}
                    >
                      {formatUSD(caja.saldoActual)}
                    </Typography>

                    {/* Acciones — solo si activa */}
                    {activa && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ReceiptLongIcon />}
                          onClick={() => navigate(`/admin/cajas-ahorro/${caja.id}`)}
                        >
                          Movimientos
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => handleOpenDepositar(caja)}
                        >
                          Depositar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() => handleOpenExtraer(caja)}
                        >
                          Extraer
                        </Button>
                        <Box display="flex" gap={0.5}>
                          <IconButton size="small" onClick={() => handleOpenEdit(caja)} title="Editar">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeactivate(caja)}
                            title="Desactivar"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialogs */}
      <CajaFormDialog
        open={formOpen}
        mode={formMode}
        caja={selectedCaja}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          loadCajas();
        }}
      />

      <DepositarDialog
        open={depositarOpen}
        caja={selectedCaja}
        onClose={() => setDepositarOpen(false)}
        onSuccess={() => {
          setDepositarOpen(false);
          loadCajas();
        }}
      />

      <ExtraerDialog
        open={extraerOpen}
        caja={selectedCaja}
        onClose={() => setExtraerOpen(false)}
        onSuccess={() => {
          setExtraerOpen(false);
          loadCajas();
        }}
      />

      <ConvertirAmortizacionDialog
        open={convertirOpen}
        cajasActivas={cajasActivas}
        onClose={() => setConvertirOpen(false)}
        onSuccess={() => {
          setConvertirOpen(false);
          loadCajas();
        }}
      />

      {/* Dialog confirmación desactivar */}
      <Dialog open={deactivateOpen} onClose={() => !deactivating && setDeactivateOpen(false)}>
        <DialogTitle>Desactivar caja</DialogTitle>
        <DialogContent>
          {deactivateError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deactivateError}
            </Alert>
          )}
          <DialogContentText>
            ¿Estás seguro de que querés desactivar la caja{' '}
            <strong>{selectedCaja?.nombre}</strong>? No se eliminarán los movimientos, pero
            la caja no aceptará nuevas operaciones.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateOpen(false)} disabled={deactivating}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeactivate}
            disabled={deactivating}
          >
            {deactivating ? <CircularProgress size={20} /> : 'Desactivar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CajasAhorroListPage;
