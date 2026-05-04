// FRONT-003: extracted from TransferenciasPage.tsx — vista read-only del
// detalle de la transferencia (origen/destino/fecha/estado + items).
import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import type { TransferenciaDepositoDTO } from '../../../../../types';
import { getEstadoChip } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  transferencia: TransferenciaDepositoDTO | null;
}

const ViewTransferenciaDialog: React.FC<Props> = ({ open, onClose, transferencia }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalle de Transferencia: {transferencia?.numero}</DialogTitle>
      <DialogContent>
        {transferencia && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Depósito Origen
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {transferencia.depositoOrigenNombre}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Depósito Destino
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {transferencia.depositoDestinoNombre}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Fecha de Transferencia
                </Typography>
                <Typography variant="body1">
                  {dayjs(transferencia.fechaTransferencia).format('DD/MM/YYYY HH:mm')}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Estado
                </Typography>
                <Box mt={0.5}>{getEstadoChip(transferencia.estado)}</Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Usuario Solicitud
                </Typography>
                <Typography variant="body1">{transferencia.usuarioSolicitudNombre}</Typography>
              </Grid>
              {transferencia.observaciones && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body1">{transferencia.observaciones}</Typography>
                </Grid>
              )}
            </Grid>

            <Typography variant="h6" mb={2}>
              Items
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="center">Cantidad Solicitada</TableCell>
                    <TableCell align="center">Cantidad Recibida</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transferencia.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Chip
                          label={item.productoId ? 'Producto' : 'Equipo'}
                          size="small"
                          color={item.productoId ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>
                        {item.productoId
                          ? `${item.productoNombre} (${item.productoCodigo})`
                          : `Equipo: ${item.equipoNumero}`}
                      </TableCell>
                      <TableCell align="center">{item.cantidadSolicitada || '-'}</TableCell>
                      <TableCell align="center">{item.cantidadRecibida || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewTransferenciaDialog;
