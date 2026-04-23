import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { cajasPesosApi } from '../../../api/services/cajasPesosApi';
import type {
  CajaPesos,
  MovimientoCajaPesos,
  TipoMovimientoCajaPesos,
} from '../../../types';
import { usePagination } from '../../../hooks/usePagination';
import { extractError, formatFecha, formatPesos } from '../CajasAhorro/utils';
import CajaPesosFormDialog from './dialogs/CajaPesosFormDialog';
import DepositarPesosDialog from './dialogs/DepositarPesosDialog';
import ExtraerPesosDialog from './dialogs/ExtraerPesosDialog';

const TIPO_LABEL: Record<TipoMovimientoCajaPesos, string> = {
  DEPOSITO: 'Depósito',
  EXTRACCION: 'Extracción',
  AJUSTE: 'Ajuste',
  CONVERSION_AMORTIZACION: 'Conversión → USD',
  TRANSFERENCIA_EGRESO: 'Transferencia (egreso)',
  TRANSFERENCIA_INGRESO: 'Transferencia (ingreso)',
};

const TIPO_COLOR: Record<TipoMovimientoCajaPesos, 'success' | 'error' | 'info' | 'default'> = {
  DEPOSITO: 'success',
  EXTRACCION: 'error',
  AJUSTE: 'default',
  CONVERSION_AMORTIZACION: 'info',
  TRANSFERENCIA_EGRESO: 'error',
  TRANSFERENCIA_INGRESO: 'success',
};

const isEgreso = (tipo: TipoMovimientoCajaPesos) =>
  tipo === 'EXTRACCION' ||
  tipo === 'CONVERSION_AMORTIZACION' ||
  tipo === 'TRANSFERENCIA_EGRESO';

const CajaPesosMovimientosPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const cajaId = Number(id);
  const navigate = useNavigate();

  const [caja, setCaja] = useState<CajaPesos | null>(null);
  const [cajaLoading, setCajaLoading] = useState(false);
  const [cajaError, setCajaError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [depositarOpen, setDepositarOpen] = useState(false);
  const [extraerOpen, setExtraerOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const loadCaja = useCallback(async () => {
    setCajaLoading(true);
    setCajaError(null);
    try {
      const data = await cajasPesosApi.getById(cajaId);
      setCaja(data);
    } catch (err) {
      setCajaError(extractError(err));
    } finally {
      setCajaLoading(false);
    }
  }, [cajaId]);

  useEffect(() => {
    loadCaja();
  }, [loadCaja]);

  const fetchMovimientos = useCallback(
    (page: number, size: number, sort: string, _filters: Record<string, unknown>) =>
      cajasPesosApi.getMovimientos(cajaId, { page, size, sort }),
    [cajaId]
  );

  const {
    data: movimientos,
    totalElements,
    loading: movLoading,
    error: movError,
    page,
    size,
    handleChangePage,
    handleChangeRowsPerPage,
    refresh: refreshMovimientos,
  } = usePagination<MovimientoCajaPesos>({
    fetchFn: fetchMovimientos,
    defaultSort: 'fecha,desc',
    initialSize: 20,
  });

  const handleOperationSuccess = () => {
    loadCaja();
    refreshMovimientos();
  };

  const handleConfirmDeactivate = async () => {
    setDeactivating(true);
    setDeactivateError(null);
    try {
      await cajasPesosApi.deactivate(cajaId);
      setDeactivateOpen(false);
      loadCaja();
    } catch (err) {
      setDeactivateError(extractError(err));
    } finally {
      setDeactivating(false);
    }
  };

  const activa = caja?.estado === 'ACTIVA';

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/cajas-pesos')}
        size="small"
        sx={{ mb: 2 }}
      >
        Cajas en Pesos
      </Button>

      {cajaLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {cajaError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {cajaError}
        </Alert>
      )}

      {caja && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={3}
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <AccountBalanceWalletIcon color="primary" />
              <Typography variant="h5" fontWeight={700}>
                {caja.nombre}
              </Typography>
              <Chip
                label={activa ? 'Activa' : 'Inactiva'}
                color={activa ? 'success' : 'default'}
                size="small"
              />
            </Box>
            {caja.descripcion && (
              <Typography variant="body2" color="text.secondary" mb={0.5}>
                {caja.descripcion}
              </Typography>
            )}
            <Typography
              variant="h4"
              fontWeight={700}
              color={caja.saldoActual < 0 ? 'error.main' : 'success.main'}
            >
              {formatPesos(caja.saldoActual)}
            </Typography>
          </Box>

          {activa && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button variant="outlined" color="success" onClick={() => setDepositarOpen(true)}>
                Depositar
              </Button>
              <Button variant="outlined" color="warning" onClick={() => setExtraerOpen(true)}>
                Extraer
              </Button>
              <IconButton onClick={() => setFormOpen(true)} title="Editar">
                <EditIcon />
              </IconButton>
              <IconButton
                color="error"
                onClick={() => {
                  setDeactivateError(null);
                  setDeactivateOpen(true);
                }}
                title="Desactivar"
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
          )}
        </Box>
      )}

      {movError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {movError}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Monto $</TableCell>
              <TableCell>Referencia</TableCell>
              <TableCell>Descripción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movLoading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}
            {!movLoading && movimientos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Sin movimientos registrados
                </TableCell>
              </TableRow>
            )}
            {!movLoading &&
              movimientos.map((mov) => {
                const egreso = isEgreso(mov.tipo);
                const montoColor = egreso ? 'error.main' : 'success.main';
                const prefix = egreso ? '−' : '+';
                const desc = mov.descripcion ?? '';
                const descTruncated = desc.length > 50 ? `${desc.slice(0, 47)}…` : desc;

                return (
                  <TableRow key={mov.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {formatFecha(mov.fecha)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={TIPO_LABEL[mov.tipo]}
                        color={TIPO_COLOR[mov.tipo]}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={montoColor}
                        component="span"
                      >
                        {prefix} {formatPesos(mov.monto)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {mov.amortizacionMensualId != null && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Amort. #{mov.amortizacionMensualId}
                        </Typography>
                      )}
                      {mov.conversionId != null && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Conv. #{mov.conversionId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {desc.length > 50 ? (
                        <Tooltip title={desc}>
                          <span>{descTruncated}</span>
                        </Tooltip>
                      ) : (
                        descTruncated
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalElements}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={size}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
      />

      {caja && (
        <>
          <CajaPesosFormDialog
            open={formOpen}
            mode="edit"
            caja={caja}
            onClose={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false);
              loadCaja();
            }}
          />

          <DepositarPesosDialog
            open={depositarOpen}
            caja={caja}
            onClose={() => setDepositarOpen(false)}
            onSuccess={() => {
              setDepositarOpen(false);
              handleOperationSuccess();
            }}
          />

          <ExtraerPesosDialog
            open={extraerOpen}
            caja={caja}
            onClose={() => setExtraerOpen(false)}
            onSuccess={() => {
              setExtraerOpen(false);
              handleOperationSuccess();
            }}
          />
        </>
      )}

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
            <strong>{caja?.nombre}</strong>? No se eliminarán los movimientos, pero la caja
            no aceptará nuevas operaciones.
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

export default CajaPesosMovimientosPage;
