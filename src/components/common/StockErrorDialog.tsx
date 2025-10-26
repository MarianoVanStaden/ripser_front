import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

export interface ProductoInsuficiente {
  nombre: string;
  codigo?: string;
  necesario: number;
  disponible: number;
  faltante: number;
}

export interface StockErrorDialogProps {
  open: boolean;
  onClose: () => void;
  productosInsuficientes: ProductoInsuficiente[];
  cantidadEquipos?: number;
}

const StockErrorDialog: React.FC<StockErrorDialogProps> = ({
  open,
  onClose,
  productosInsuficientes,
  cantidadEquipos = 1,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24,
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <ErrorIcon
            sx={{
              fontSize: 48,
              color: 'error.main',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.6 },
              }
            }}
          />
          <Box>
            <Typography variant="h5" fontWeight="600" color="error.main">
              Stock Insuficiente
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No se puede crear {cantidadEquipos > 1 ? `los ${cantidadEquipos} equipos` : 'el equipo'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="500">
            No hay stock suficiente para los siguientes productos:
          </Typography>
        </Alert>

        <Paper
          variant="outlined"
          sx={{
            bgcolor: 'error.lighter',
            borderColor: 'error.main',
            borderWidth: 1,
          }}
        >
          <List dense>
            {productosInsuficientes.map((producto, index) => (
              <ListItem
                key={index}
                sx={{
                  borderBottom: index < productosInsuficientes.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                  py: 1.5,
                }}
              >
                <Box display="flex" alignItems="center" gap={1} width="100%">
                  <InventoryIcon sx={{ color: 'error.main', fontSize: 20 }} />
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight="600" color="error.dark">
                      {producto.nombre}
                      {producto.codigo && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ ml: 1, color: 'text.secondary' }}
                        >
                          (Código: {producto.codigo})
                        </Typography>
                      )}
                    </Typography>
                    <Box display="flex" gap={3} mt={0.5}>
                      <Typography variant="caption">
                        <strong>Necesario:</strong> {producto.necesario}
                      </Typography>
                      <Typography variant="caption">
                        <strong>Disponible:</strong> {producto.disponible}
                      </Typography>
                      <Typography variant="caption" color="error.main" fontWeight="600">
                        <strong>Faltante:</strong> {producto.faltante}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            💡 <strong>Sugerencia:</strong> Ve a la sección de Stock para reabastecerte de los productos necesarios o reduce la cantidad de equipos a fabricar.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          fullWidth
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockErrorDialog;
