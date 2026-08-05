import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, Alert, CircularProgress, Chip, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import { HealthAndSafety } from '@mui/icons-material';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import type { SaneoReservasResult } from '../../api/services/equipoFabricadoApi';

interface Props {
  open: boolean;
  onClose: () => void;
  onApplied?: (result: SaneoReservasResult) => void;
}

/**
 * Saneo de reservas huérfanas: libera a DISPONIBLE los equipos que quedaron con un
 * estado_asignacion comprometido (RESERVADO / FACTURADO / PENDIENTE_TERMINACION) pero
 * sin compromiso real (asignado=false, sin cliente, sin vínculo a documento). Ese estado
 * inflaba el "asignados"/total del Desglose por Modelo. Solo toca asignaciones — no afecta
 * facturación, cuenta corriente, caja ni el estado de fabricación.
 * Muestra primero una previsualización (dry-run) y recién aplica al confirmar.
 */
const SanearReservasHuerfanasDialog: React.FC<Props> = ({ open, onClose, onApplied }) => {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SaneoReservasResult | null>(null);
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
      const data = await equipoFabricadoApi.sanearReservasHuerfanas(true);
      setPreview(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al previsualizar el saneo');
    } finally {
      setLoading(false);
    }
  };

  const aplicar = async () => {
    setApplying(true);
    setError(null);
    try {
      const data = await equipoFabricadoApi.sanearReservasHuerfanas(false);
      setPreview(data);
      setApplied(true);
      onApplied?.(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al aplicar el saneo');
    } finally {
      setApplying(false);
    }
  };

  const busy = loading || applying;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <HealthAndSafety color="primary" />
          <span>Sanear reservas huérfanas</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Libera a DISPONIBLE los equipos que quedaron marcados como reservados/facturados/pendiente
          de terminación pero sin compromiso real (sin asignar, sin cliente y sin vínculo a un
          documento). Inflan el total del Desglose por Modelo. Solo mueve asignaciones — no toca
          facturación, cuenta corriente, caja ni el estado de fabricación.
        </Typography>

        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
        ) : preview ? (
          <>
            {applied && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Saneo aplicado: {preview.total} equipo(s) liberado(s) a DISPONIBLE.
              </Alert>
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Chip color={preview.total > 0 ? 'warning' : 'success'} label={`Huérfanos: ${preview.total}`} />
              <Chip
                variant="outlined"
                color={preview.dryRun ? 'info' : 'success'}
                label={preview.dryRun ? 'Previsualización' : 'Aplicado'}
              />
            </Stack>

            {preview.items.length === 0 ? (
              <Alert severity="info">No hay reservas huérfanas para sanear.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Heladera</TableCell>
                      <TableCell>Modelo</TableCell>
                      <TableCell>Estado previo</TableCell>
                      <TableCell>Nuevo estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.items.map((it) => (
                      <TableRow key={it.equipoId} hover>
                        <TableCell>{it.numeroHeladera}</TableCell>
                        <TableCell>{it.modelo}</TableCell>
                        <TableCell>
                          <Chip size="small" color="warning" label={it.estadoAsignacionPrevio ?? '—'} />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" color="success" label="DISPONIBLE" />
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
            startIcon={<HealthAndSafety />}
            onClick={aplicar}
            disabled={busy || !preview || preview.total === 0}
          >
            {applying ? 'Aplicando…' : `Liberar (${preview?.total ?? 0})`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SanearReservasHuerfanasDialog;
