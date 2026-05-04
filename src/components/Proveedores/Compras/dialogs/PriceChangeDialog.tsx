// FRONT-003: extracted from ComprasPedidosPage.tsx — confirma cambios de
// precio detectados al guardar la orden.  El operador puede actualizar
// algunos productos y dejar otros como están.
import React from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { AttachMoney as MoneyIcon } from '@mui/icons-material';
import type { PriceChange } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaveWithoutUpdates: () => void;
  onSaveWithUpdates: (updates: Array<{ productoId: number; precioNuevo: number }>) => void;
  priceChanges: PriceChange[];
  setPriceChanges: (changes: PriceChange[]) => void;
}

const PriceChangeDialog: React.FC<Props> = ({
  open,
  onClose,
  onSaveWithoutUpdates,
  onSaveWithUpdates,
  priceChanges,
  setPriceChanges,
}) => {
  const allChecked = priceChanges.every((c) => c.shouldUpdate);
  const someChecked = priceChanges.some((c) => c.shouldUpdate);
  const selectedCount = priceChanges.filter((c) => c.shouldUpdate).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <MoneyIcon color="warning" />
          <Typography variant="h6">Cambios de Precio Detectados</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Se detectaron cambios en los precios de compra. Seleccione los productos cuyos precios
          desea actualizar en el sistema.
        </Alert>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Actualizar</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell align="right">Costo Anterior</TableCell>
                <TableCell align="center">→</TableCell>
                <TableCell align="right">Costo Nuevo</TableCell>
                <TableCell align="right">Variación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {priceChanges.map((change, index) => {
                // Proteger contra división por cero — si no había costo previo, marcar como 100% nuevo.
                const variation =
                  change.precioAnterior > 0
                    ? ((change.precioNuevo - change.precioAnterior) / change.precioAnterior) * 100
                    : change.precioNuevo > 0
                    ? 100
                    : 0;
                const isIncrease = variation > 0;

                return (
                  <TableRow key={change.productoId}>
                    <TableCell>
                      <Checkbox
                        checked={change.shouldUpdate}
                        onChange={(e) => {
                          const updated = [...priceChanges];
                          updated[index].shouldUpdate = e.target.checked;
                          setPriceChanges(updated);
                        }}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {change.nombreProducto}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        ${change.precioAnterior.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography color={isIncrease ? 'error' : 'success'}>→</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={isIncrease ? 'error.main' : 'success.main'}
                      >
                        ${change.precioNuevo.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${isIncrease ? '+' : ''}${variation.toFixed(1)}%`}
                        color={isIncrease ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={allChecked}
                indeterminate={someChecked && !allChecked}
                onChange={(e) => {
                  const allChecked = e.target.checked;
                  setPriceChanges(
                    priceChanges.map((c) => ({ ...c, shouldUpdate: allChecked }))
                  );
                }}
              />
            }
            label="Seleccionar todos"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSaveWithoutUpdates} color="inherit">
          Guardar sin Actualizar Precios
        </Button>
        <Button
          onClick={() => {
            const updates = priceChanges
              .filter((c) => c.shouldUpdate)
              .map((c) => ({ productoId: c.productoId, precioNuevo: c.precioNuevo }));
            onSaveWithUpdates(updates);
          }}
          variant="contained"
          color="primary"
          disabled={!someChecked}
        >
          Actualizar {selectedCount} Precio(s)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PriceChangeDialog;
