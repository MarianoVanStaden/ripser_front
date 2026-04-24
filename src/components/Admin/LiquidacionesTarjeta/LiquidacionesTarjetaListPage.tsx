import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { liquidacionesTarjetaApi } from '../../../api/services/liquidacionesTarjetaApi';
import type { LiquidacionTarjeta } from '../../../types/liquidacionTarjeta.types';
import { formatPrice } from '../../../utils/priceCalculations';
import NuevaLiquidacionDialog from './dialogs/NuevaLiquidacionDialog';

const LiquidacionesTarjetaListPage: React.FC = () => {
  const [items, setItems] = useState<LiquidacionTarjeta[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await liquidacionesTarjetaApi.search({
        page,
        size,
        sort: 'fechaLiquidacion,desc',
      });
      setItems(res.content);
      setTotal(res.totalElements);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al cargar liquidaciones');
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    load();
  }, [load]);

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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Caja origen</TableCell>
              <TableCell>Caja destino</TableCell>
              <TableCell align="right">Bruto</TableCell>
              <TableCell align="right">Comisión</TableCell>
              <TableCell align="right">Neto</TableCell>
              <TableCell>Observaciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={20} />
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Sin liquidaciones registradas en el período.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {items.map((it) => (
              <TableRow key={it.id} hover>
                <TableCell>{dayjs(it.fechaLiquidacion).format('DD/MM/YYYY')}</TableCell>
                <TableCell>{it.cajaOrigenNombre}</TableCell>
                <TableCell>{it.cajaDestinoNombre}</TableCell>
                <TableCell align="right">{formatPrice(it.montoBruto)}</TableCell>
                <TableCell align="right">{formatPrice(it.comision)}</TableCell>
                <TableCell align="right">
                  <strong>{formatPrice(it.montoNeto)}</strong>
                </TableCell>
                <TableCell>{it.observaciones ?? ''}</TableCell>
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
    </Box>
  );
};

export default LiquidacionesTarjetaListPage;
