import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Paper,
  Snackbar,
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
import { Add as AddIcon, OpenInNew as OpenInNewIcon, Undo as UndoIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { liquidacionesTarjetaApi } from '../../../api/services/liquidacionesTarjetaApi';
import type { LiquidacionTarjeta } from '../../../types/liquidacionTarjeta.types';
import { formatPrice } from '../../../utils/priceCalculations';
import NuevaLiquidacionDialog from './dialogs/NuevaLiquidacionDialog';

const LiquidacionesTarjetaListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmar, setConfirmar] = useState<LiquidacionTarjeta | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const liquidacionesQuery = useQuery({
    queryKey: ['liquidaciones-tarjeta', page, size],
    queryFn: () => liquidacionesTarjetaApi.search({ page, size, sort: 'fechaLiquidacion,desc' }),
  });
  const items = liquidacionesQuery.data?.content ?? [];
  const total = liquidacionesQuery.data?.totalElements ?? 0;
  const loading = liquidacionesQuery.isPending;
  const loadError = liquidacionesQuery.error
    ? ((liquidacionesQuery.error as any)?.response?.data?.message ?? 'Error al cargar liquidaciones')
    : null;
  const load = () => queryClient.invalidateQueries({ queryKey: ['liquidaciones-tarjeta', page, size] });

  const revertirMutation = useMutation({
    mutationFn: (id: number) => liquidacionesTarjetaApi.revertir(id),
    onSuccess: (reversion, id) => {
      setToast(`Liquidación #${id} revertida — nueva fila #${reversion.id}`);
      setConfirmar(null);
      load();
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? err?.message ?? 'Error al revertir'),
  });
  const revirtiendo = revertirMutation.isPending;

  const handleRevertir = () => {
    if (!confirmar) return;
    setError(null);
    revertirMutation.mutate(confirmar.id);
  };

  const renderEstado = (it: LiquidacionTarjeta) => {
    if (it.esReversion) {
      return <Chip size="small" color="warning" label={`Reversión de #${it.reversionDeId}`} />;
    }
    if (it.revertidaPorId != null) {
      return <Chip size="small" color="default" label={`Revertida por #${it.revertidaPorId}`} />;
    }
    return <Chip size="small" color="success" label="Activa" />;
  };

  const puedeRevertir = (it: LiquidacionTarjeta) =>
    !it.esReversion && it.revertidaPorId == null;

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Liquidaciones de Tarjeta</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Nueva liquidación
        </Button>
      </Box>

      {(error || loadError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || loadError}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Caja origen</TableCell>
              <TableCell>Caja destino</TableCell>
              <TableCell align="right">Bruto</TableCell>
              <TableCell align="right">Comisión</TableCell>
              <TableCell align="right">Neto</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Observaciones</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <CircularProgress size={20} />
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Sin liquidaciones registradas en el período.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {items.map((it) => (
              <TableRow key={it.id} hover>
                <TableCell>{it.id}</TableCell>
                <TableCell>{dayjs(it.fechaLiquidacion).format('DD/MM/YYYY')}</TableCell>
                <TableCell>{it.cajaOrigenNombre}</TableCell>
                <TableCell>{it.cajaDestinoNombre}</TableCell>
                <TableCell align="right">{formatPrice(it.montoBruto)}</TableCell>
                <TableCell align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                    {formatPrice(it.comision)}
                    {it.movimientoComisionId != null && (
                      <Tooltip title={`Ver gasto extra #${it.movimientoComisionId}`}>
                        <Chip
                          size="small"
                          icon={<OpenInNewIcon sx={{ fontSize: '0.75rem !important' }} />}
                          label={`G#${it.movimientoComisionId}`}
                          variant="outlined"
                          color="default"
                          sx={{ height: 20, fontSize: '0.65rem', cursor: 'default' }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <strong>{formatPrice(it.montoNeto)}</strong>
                </TableCell>
                <TableCell>{renderEstado(it)}</TableCell>
                <TableCell>{it.observaciones ?? ''}</TableCell>
                <TableCell align="center">
                  {puedeRevertir(it) && (
                    <Button
                      size="small"
                      color="warning"
                      startIcon={<UndoIcon />}
                      onClick={() => setConfirmar(it)}
                    >
                      Revertir
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={size}
          onRowsPerPageChange={(e) => {
            setSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </TableContainer>

      <NuevaLiquidacionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          load();
        }}
      />

      <Dialog
        open={!!confirmar}
        onClose={() => !revirtiendo && setConfirmar(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Revertir liquidación #{confirmar?.id}</DialogTitle>
        <DialogContent>
          {confirmar && (
            <DialogContentText component="div">
              <Typography gutterBottom>Se crearán contramovimientos por:</Typography>
              <Typography variant="body2">
                • <strong>+{formatPrice(confirmar.montoBruto)}</strong> de vuelta a{' '}
                <strong>{confirmar.cajaOrigenNombre}</strong>
              </Typography>
              <Typography variant="body2">
                • <strong>−{formatPrice(confirmar.montoNeto)}</strong> sacado de{' '}
                <strong>{confirmar.cajaDestinoNombre}</strong>
              </Typography>
              {confirmar.comision > 0 && (
                <Typography variant="body2">
                  • <strong>+{formatPrice(confirmar.comision)}</strong> de reversión de comisión
                </Typography>
              )}
              <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                La liquidación original queda marcada como revertida. La operación crea una
                nueva fila (la reversión) — el ledger de caja es inmutable.
              </Typography>
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmar(null)} disabled={revirtiendo}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRevertir}
            disabled={revirtiendo}
          >
            {revirtiendo ? <CircularProgress size={20} /> : 'Confirmar reversión'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        message={toast}
      />
    </Box>
  );
};

export default LiquidacionesTarjetaListPage;
