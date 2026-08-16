import React, { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SavingsIcon from '@mui/icons-material/Savings';
import { useArqueoChecks } from '../../../hooks/useArqueoChecks';
import { cajasAhorroApi } from '../../../api/services/cajasAhorroApi';
import type { MovimientoCajaAhorro, TipoMovimientoCaja } from '../../../types';
import { usePagination } from '../../../hooks/usePagination';
import { extractError, formatFecha, formatPesos, formatUSD } from './utils';
import CajaFormDialog from './dialogs/CajaFormDialog';
import DepositarDialog from './dialogs/DepositarDialog';
import ExtraerDialog from './dialogs/ExtraerDialog';

const TIPO_LABEL: Record<TipoMovimientoCaja, string> = {
  DEPOSITO: 'Depósito',
  EXTRACCION: 'Extracción',
  AJUSTE: 'Ajuste',
  CONVERSION_AMORTIZACION: 'Conversión amort.',
  TRANSFERENCIA_EGRESO: 'Transf. salida',
  TRANSFERENCIA_INGRESO: 'Transf. entrada',
};

const TIPO_COLOR: Record<TipoMovimientoCaja, 'success' | 'error' | 'info'> = {
  DEPOSITO: 'success',
  EXTRACCION: 'error',
  AJUSTE: 'info',
  CONVERSION_AMORTIZACION: 'info',
  TRANSFERENCIA_EGRESO: 'error',
  TRANSFERENCIA_INGRESO: 'success',
};

// Tipos que restan saldo (se muestran en rojo con prefijo −).
const TIPOS_EGRESO: TipoMovimientoCaja[] = ['EXTRACCION', 'TRANSFERENCIA_EGRESO'];
// Tipos de transferencia interna USD→USD (sin tipo de cambio aplicable).
const TIPOS_TRANSFERENCIA: TipoMovimientoCaja[] = [
  'TRANSFERENCIA_EGRESO',
  'TRANSFERENCIA_INGRESO',
];

const CajaMovimientosPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const cajaId = Number(id);
  const navigate = useNavigate();

  // caja se deriva del query ['caja-ahorro-detalle', cajaId] (ver abajo).
  const [formOpen, setFormOpen] = useState(false);
  const [depositarOpen, setDepositarOpen] = useState(false);
  const [extraerOpen, setExtraerOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const cajaQuery = useQuery({
    queryKey: ['caja-ahorro-detalle', cajaId],
    queryFn: () => cajasAhorroApi.getById(cajaId),
    enabled: !!cajaId,
  });
  const caja = cajaQuery.data ?? null;
  const cajaLoading = cajaQuery.isPending && !!cajaId;
  const cajaError = cajaQuery.error ? extractError(cajaQuery.error) : null;
  const loadCaja = () => queryClient.invalidateQueries({ queryKey: ['caja-ahorro-detalle', cajaId] });

  const fetchMovimientos = useCallback(
    (page: number, size: number, sort: string, _filters: Record<string, unknown>) =>
      cajasAhorroApi.getMovimientos(cajaId, { page, size, sort }),
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
  } = usePagination<MovimientoCajaAhorro>({
    queryKey: 'caja-ahorro-movimientos',
    fetchFn: fetchMovimientos,
    defaultSort: 'fecha,desc',
    initialSize: 20,
  });

  const handleOperationSuccess = () => {
    loadCaja();
    refreshMovimientos();
  };

  const deactivateMutation = useMutation({
    mutationFn: () => cajasAhorroApi.deactivate(cajaId),
    onSuccess: () => { setDeactivateOpen(false); loadCaja(); },
    onError: (err) => setDeactivateError(extractError(err)),
  });
  const deactivating = deactivateMutation.isPending;
  const handleConfirmDeactivate = () => {
    setDeactivateError(null);
    deactivateMutation.mutate();
  };

  const activa = caja?.estado === 'ACTIVA';
  const { checkedIds, toggle, clear, isChecked } = useArqueoChecks(cajaId);

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/cajas-ahorro')}
        size="small"
        sx={{ mb: 2 }}
      >
        Cajas de Ahorro
      </Button>

      {/* Header */}
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
              <SavingsIcon color="primary" />
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
              {formatUSD(caja.saldoActual)}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            {checkedIds.size > 0 && (
              <Tooltip title="Limpiar arqueo">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClearAllIcon />}
                  onClick={clear}
                >
                  Limpiar arqueo ({checkedIds.size})
                </Button>
              </Tooltip>
            )}
            {activa && (
              <>
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
              </>
            )}
          </Stack>
        </Box>
      )}

      {/* Tabla de movimientos */}
      {movError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {movError}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40, p: 0.5 }} />
              <TableCell>Fecha</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Monto USD</TableCell>
              <TableCell align="right">Pesos origen</TableCell>
              <TableCell align="right">TC</TableCell>
              <TableCell>Descripción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movLoading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}
            {!movLoading && movimientos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Sin movimientos registrados
                </TableCell>
              </TableRow>
            )}
            {!movLoading &&
              movimientos.map((mov) => {
                const esEgreso = TIPOS_EGRESO.includes(mov.tipo);
                const esTransferencia = TIPOS_TRANSFERENCIA.includes(mov.tipo);
                const montoColor = esEgreso ? 'error.main' : 'success.main';
                const prefix = esEgreso ? '−' : '+';
                const desc = mov.descripcion ?? '';
                const checked = isChecked(mov.id);

                return (
                  <TableRow
                    key={mov.id}
                    hover
                    sx={checked ? { opacity: 0.4, textDecoration: 'line-through' } : undefined}
                  >
                    <TableCell sx={{ p: 0.5 }}>
                      <Checkbox
                        size="small"
                        checked={checked}
                        onChange={() => toggle(mov.id)}
                        sx={{ p: 0.5 }}
                      />
                    </TableCell>
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
                        {prefix} {formatUSD(mov.montoUsd)}
                      </Typography>
                      {mov.tipo === 'CONVERSION_AMORTIZACION' &&
                        mov.amortizacionMensualId != null && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Amort. #{mov.amortizacionMensualId}
                          </Typography>
                        )}
                    </TableCell>
                    <TableCell align="right">
                      {mov.montoPesosOriginal != null
                        ? formatPesos(mov.montoPesosOriginal)
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {esTransferencia ? '—' : formatPesos(mov.valorDolar)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: 360 }}>
                      {desc}
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

      {/* Dialogs */}
      {caja && (
        <>
          <CajaFormDialog
            open={formOpen}
            mode="edit"
            caja={caja}
            onClose={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false);
              loadCaja();
            }}
          />

          <DepositarDialog
            open={depositarOpen}
            caja={caja}
            onClose={() => setDepositarOpen(false)}
            onSuccess={() => {
              setDepositarOpen(false);
              handleOperationSuccess();
            }}
          />

          <ExtraerDialog
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

export default CajaMovimientosPage;
