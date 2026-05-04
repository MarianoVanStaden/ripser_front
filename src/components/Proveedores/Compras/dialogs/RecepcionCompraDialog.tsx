// FRONT-003: extracted from ComprasPedidosPage.tsx — confirmar recepción
// de productos de una compra.  El stock entra automáticamente al depósito
// principal de la empresa.
import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { OrdenCompra, ProveedorDTO } from '../../../../types';
import type { RecepcionItem } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  onClearError: () => void;
  successMessage: string | null;
  orden: OrdenCompra | null;
  proveedores: ProveedorDTO[];
  items: RecepcionItem[];
  setItems: (items: RecepcionItem[]) => void;
  observaciones: string;
  setObservaciones: (value: string) => void;
}

const RecepcionCompraDialog: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  loading,
  error,
  onClearError,
  successMessage,
  orden,
  proveedores,
  items,
  setItems,
  observaciones,
  setObservaciones,
}) => {
  const proveedor =
    orden?.proveedor?.razonSocial ||
    proveedores.find((p) => p.id.toString() === orden?.supplierId)?.razonSocial ||
    '-';

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="success" />
          <Typography variant="h6">Recibir Compra {orden?.numero}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={onClearError}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }} icon={<InventoryIcon />}>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Asignación Automática de Stock
          </Typography>
          <Typography variant="body2">
            El stock de esta compra ingresará automáticamente al{' '}
            <strong>depósito principal</strong> de la empresa. Desde allí podrás realizar
            transferencias a otros depósitos según sea necesario.
          </Typography>
        </Alert>

        {orden && (
          <Box sx={{ pt: 1 }}>
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Información de la Compra
              </Typography>
              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Proveedor
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {proveedor}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fecha Compra
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(orden.fechaCreacion).format('DD/MM/YYYY')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ${orden.total?.toLocaleString() || '0'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Productos a Recibir
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>Producto</TableCell>
                    <TableCell align="center">Cant. Comprada</TableCell>
                    <TableCell align="center" sx={{ minWidth: 120 }}>
                      Cant. Recibida *
                    </TableCell>
                    <TableCell>Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.productoNombre}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={item.cantidadCompra} size="small" />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          fullWidth
                          size="small"
                          value={item.cantidadRecibida}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[index].cantidadRecibida = parseInt(e.target.value) || 0;
                            setItems(updated);
                          }}
                          inputProps={{ min: 0, max: item.cantidadCompra }}
                          error={item.cantidadRecibida <= 0}
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={item.observaciones}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[index].observaciones = e.target.value;
                            setItems(updated);
                          }}
                          placeholder="Opcional"
                          disabled={loading}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Observaciones Generales"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={loading}
              sx={{ mt: 1 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={onSubmit}
          disabled={loading || items.some((i) => i.cantidadRecibida <= 0)}
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />
          }
        >
          {loading ? 'Procesando...' : 'Confirmar Recepción'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecepcionCompraDialog;
