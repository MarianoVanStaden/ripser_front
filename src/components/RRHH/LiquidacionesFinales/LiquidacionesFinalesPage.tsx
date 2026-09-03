// Listado de liquidaciones finales (finiquitos) de empleados dados de baja.
// Los montos se cargan a mano; el sistema aporta catálogo de conceptos,
// totales server-side, estados y el pago por cajas.

import React, { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Box, Button, Chip, CircularProgress, MenuItem, Paper, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  TextField, Typography,
} from '@mui/material';
import { Add as AddIcon, ReceiptLong as ReceiptLongIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import {
  liquidacionFinalApi,
  MOTIVOS_EGRESO,
  type EstadoLiquidacionFinal,
} from '../../../api/services/liquidacionFinalApi';
import LiquidacionFinalDialog from './LiquidacionFinalDialog';

const ESTADO_COLOR: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  BORRADOR: 'info',
  CONFIRMADA: 'warning',
  PAGADA: 'success',
  ANULADA: 'error',
};

const fmt = (n: number | undefined | null) =>
  `$${Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const motivoLabel = (value: string | null) =>
  value ? (MOTIVOS_EGRESO.find(m => m.value === value)?.label ?? value) : '—';

interface Props {
  /** true cuando se renderiza como tab dentro de SueldosPage (sin padding ni título propio). */
  embedded?: boolean;
}

const LiquidacionesFinalesPage: React.FC<Props> = ({ embedded = false }) => {
  const [estado, setEstado] = useState<EstadoLiquidacionFinal | ''>('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['liquidaciones-finales', { estado: estado || undefined, page, size }],
    queryFn: () => liquidacionFinalApi.getAll({
      estado: estado || undefined,
      page,
      size,
    }),
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];

  const openDetail = (id: number) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setSelectedId(null);
    setDialogOpen(true);
  };

  return (
    <Box p={embedded ? 0 : { xs: 1.5, md: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
        alignItems={{ sm: 'center' }} spacing={2} mb={2}>
        {embedded ? <Box /> : (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <ReceiptLongIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>Liquidaciones finales</Typography>
          </Stack>
        )}
        <Stack direction="row" spacing={2}>
          <TextField
            select size="small" label="Estado" sx={{ minWidth: 170 }}
            value={estado}
            onChange={(e) => { setEstado(e.target.value as EstadoLiquidacionFinal | ''); setPage(0); }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="BORRADOR">Borrador</MenuItem>
            <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
            <MenuItem value="PAGADA">Pagada</MenuItem>
            <MenuItem value="ANULADA">Anulada</MenuItem>
          </TextField>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nueva liquidación
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined">
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
        ) : isError ? (
          <Typography color="error" p={3}>Error al cargar las liquidaciones</Typography>
        ) : (
          <>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Fecha egreso</TableCell>
                    <TableCell>Motivo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Haberes</TableCell>
                    <TableCell align="right">Descuentos</TableCell>
                    <TableCell align="right">Neto</TableCell>
                    <TableCell>Fecha pago</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Typography variant="body2" color="textSecondary" align="center" py={3}>
                          No hay liquidaciones finales{estado ? ' con ese estado' : ''} — creá la primera con “Nueva liquidación”.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map(l => (
                    <TableRow
                      key={l.id} hover sx={{ cursor: 'pointer' }}
                      onClick={() => openDetail(l.id)}
                    >
                      <TableCell>{l.id}</TableCell>
                      <TableCell>{l.empleadoApellido}, {l.empleadoNombre}</TableCell>
                      <TableCell>{l.fechaEgreso ? dayjs(l.fechaEgreso).format('DD/MM/YYYY') : '—'}</TableCell>
                      <TableCell>{motivoLabel(l.motivoEgreso)}</TableCell>
                      <TableCell>
                        <Chip label={l.estado} size="small" color={ESTADO_COLOR[l.estado] ?? 'default'} />
                      </TableCell>
                      <TableCell align="right">{fmt(l.totalHaberes)}</TableCell>
                      <TableCell align="right">{fmt(l.totalDescuentos)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(l.totalNeto)}</TableCell>
                      <TableCell>{l.fechaPago ? dayjs(l.fechaPago).format('DD/MM/YYYY') : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={data?.totalElements ?? 0}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={size}
              onRowsPerPageChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage="Filas"
            />
          </>
        )}
      </Paper>

      <LiquidacionFinalDialog
        open={dialogOpen}
        liquidacionId={selectedId}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
};

export default LiquidacionesFinalesPage;
