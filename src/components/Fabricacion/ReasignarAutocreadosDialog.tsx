import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, Alert, CircularProgress, Chip, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import { AutoFixHigh } from '@mui/icons-material';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import type { ReasignacionStockResult } from '../../api/services/equipoFabricadoApi';

interface Props {
  open: boolean;
  onClose: () => void;
  onApplied?: (result: ReasignacionStockResult) => void;
}

const RESULTADO_COLOR: Record<string, 'success' | 'warning' | 'default'> = {
  REASIGNADO_TERMINADO: 'success',
  REASIGNADO_BASE: 'success',
  SIN_STOCK: 'warning',
  SIN_VINCULO: 'default',
};

/**
 * Corrección de datos migrados: reasigna los equipos PENDIENTE auto-creados por notas de
 * pedido hacia stock existente (terminado disponible o base sin terminación).
 * Muestra primero una previsualización (dry-run) y recién aplica al confirmar.
 * Solo mueve asignaciones — no toca factura / cuenta corriente / caja.
 */
const ReasignarAutocreadosDialog: React.FC<Props> = ({ open, onClose, onApplied }) => {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReasignacionStockResult | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (open) {
      setPreview(null);
      setApplied(false);
      setError(null);
      correrDryRun();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const correrDryRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await equipoFabricadoApi.reasignarAutocreados(true);
      setPreview(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al previsualizar la reasignación');
    } finally {
      setLoading(false);
    }
  };

  const aplicar = async () => {
    setApplying(true);
    setError(null);
    try {
      const data = await equipoFabricadoApi.reasignarAutocreados(false);
      setPreview(data);
      setApplied(true);
      onApplied?.(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al aplicar la reasignación');
    } finally {
      setApplying(false);
    }
  };

  const busy = loading || applying;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AutoFixHigh color="primary" />
          <span>Reasignar equipos PENDIENTE a stock existente</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Busca stock disponible (terminado exacto o base sin terminación) para los equipos que se
          mandaron a fabricar de cero teniendo stock. Solo mueve asignaciones — no toca facturación,
          cuenta corriente ni caja.
        </Typography>

        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
        ) : preview ? (
          <>
            {applied && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Reasignación aplicada: {preview.reasignados} equipo(s) reasignado(s).
              </Alert>
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Chip label={`Pendientes: ${preview.totalPendientes}`} />
              <Chip color="success" label={`Reasignables: ${preview.reasignados}`} />
              <Chip color="warning" label={`Sin stock: ${preview.sinStock}`} />
              {preview.sinVinculo > 0 && <Chip label={`Sin vínculo: ${preview.sinVinculo}`} />}
              <Chip
                variant="outlined"
                color={preview.dryRun ? 'info' : 'success'}
                label={preview.dryRun ? 'Previsualización' : 'Aplicado'}
              />
            </Stack>

            {preview.items.length === 0 ? (
              <Alert severity="info">No hay equipos PENDIENTE auto-creados para reasignar.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pendiente</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Stock destino</TableCell>
                      <TableCell>Resultado</TableCell>
                      <TableCell>Detalle</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.items.map((it) => (
                      <TableRow key={it.pendienteId} hover>
                        <TableCell>{it.pendienteNumero}</TableCell>
                        <TableCell>{it.estadoAsignacionPendiente ?? '—'}</TableCell>
                        <TableCell>{it.stockNumero ?? '—'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={RESULTADO_COLOR[it.resultado] ?? 'default'}
                            label={it.resultado}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{it.mensaje}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cerrar</Button>
        {!applied && (
          <Button
            variant="contained"
            startIcon={<AutoFixHigh />}
            onClick={aplicar}
            disabled={busy || !preview || preview.reasignados === 0}
          >
            {applying ? 'Aplicando…' : `Aplicar (${preview?.reasignados ?? 0})`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReasignarAutocreadosDialog;
