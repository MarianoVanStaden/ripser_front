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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { cajasPesosApi } from '../../../api/services/cajasPesosApi';
import type { CajaPesos } from '../../../types';
import { extractError, formatPesos } from '../CajasAhorro/utils';
import CajaPesosFormDialog from './dialogs/CajaPesosFormDialog';
import DepositarPesosDialog from './dialogs/DepositarPesosDialog';
import ExtraerPesosDialog from './dialogs/ExtraerPesosDialog';

const CajasPesosListPage: React.FC = () => {
  const navigate = useNavigate();
  const [cajas, setCajas] = useState<CajaPesos[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<CajaPesos | null>(null);

  const [depositarOpen, setDepositarOpen] = useState(false);
  const [extraerOpen, setExtraerOpen] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const data = await cajasPesosApi.getAll();
      setCajas(data);
    } catch (err) {
      setPageError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirmDeactivate = async () => {
    if (!selected) return;
    setDeactivating(true);
    setDeactivateError(null);
    try {
      await cajasPesosApi.deactivate(selected.id);
      setDeactivateOpen(false);
      setSelected(null);
      load();
    } catch (err) {
      setDeactivateError(extractError(err));
    } finally {
      setDeactivating(false);
    }
  };

  const saldoTotal = cajas
    .filter((c) => c.estado === 'ACTIVA')
    .reduce((acc, c) => acc + c.saldoActual, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700}>
            Cajas en Pesos (ARS)
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelected(null);
              setFormMode('create');
              setFormOpen(true);
            }}
          >
            Nueva caja
          </Button>
        </Stack>
      </Box>

      {!loading && cajas.length > 0 && (
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            Saldo total activo
          </Typography>
          <Typography variant="h5" fontWeight={700} color="success.main">
            {formatPesos(saldoTotal)}
          </Typography>
        </Box>
      )}

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
          No hay cajas en pesos todavía. Creá la primera con <strong>+ Nueva caja</strong>{' '}
          (ej: "Caja efectivo", "Mercado Pago", "Banco Galicia"). Después podés depositar el
          saldo inicial.
        </Alert>
      )}

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
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={1}
                    >
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

                    {caja.descripcion && (
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {caja.descripcion}
                      </Typography>
                    )}

                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="success.main"
                      mt={1}
                      mb={2}
                    >
                      {formatPesos(caja.saldoActual)}
                    </Typography>

                    {activa && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ReceiptLongIcon />}
                          onClick={() => navigate(`/admin/cajas-pesos/${caja.id}`)}
                        >
                          Movimientos
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => {
                            setSelected(caja);
                            setDepositarOpen(true);
                          }}
                        >
                          Depositar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() => {
                            setSelected(caja);
                            setExtraerOpen(true);
                          }}
                        >
                          Extraer
                        </Button>
                        <Box display="flex" gap={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelected(caja);
                              setFormMode('edit');
                              setFormOpen(true);
                            }}
                            title="Editar"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelected(caja);
                              setDeactivateError(null);
                              setDeactivateOpen(true);
                            }}
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

      <CajaPesosFormDialog
        open={formOpen}
        mode={formMode}
        caja={selected}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />

      <DepositarPesosDialog
        open={depositarOpen}
        caja={selected}
        onClose={() => setDepositarOpen(false)}
        onSuccess={() => {
          setDepositarOpen(false);
          load();
        }}
      />

      <ExtraerPesosDialog
        open={extraerOpen}
        caja={selected}
        onClose={() => setExtraerOpen(false)}
        onSuccess={() => {
          setExtraerOpen(false);
          load();
        }}
      />

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
            <strong>{selected?.nombre}</strong>? No se eliminarán los movimientos, pero
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

export default CajasPesosListPage;
