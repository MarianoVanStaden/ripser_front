import React, { useState } from 'react';
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
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Inventory as InventoryIcon,
  AddShoppingCart as AddShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { requerimientoStockApi } from '../../api/services/requerimientoStockApi';

export interface ProductoInsuficiente {
  nombre: string;
  codigo?: string;
  necesario: number;
  disponible: number;
  faltante: number;
  // Opcionales: presentes cuando vienen estructurados del endpoint validar-stock
  productoId?: number;
  proveedorSugeridoId?: number | null;
  proveedorSugeridoNombre?: string | null;
}

export interface StockErrorDialogProps {
  open: boolean;
  onClose: () => void;
  productosInsuficientes: ProductoInsuficiente[];
  cantidadEquipos?: number;
  /** Receta que se intentaba fabricar (contexto del requerimiento). */
  recetaId?: number | null;
  /** Callback opcional tras crear el requerimiento (ej. mostrar snackbar en el padre). */
  onRequerimientoCreado?: (mensaje: string) => void;
}

const StockErrorDialog: React.FC<StockErrorDialogProps> = ({
  open,
  onClose,
  productosInsuficientes,
  cantidadEquipos = 1,
  recetaId,
  onRequerimientoCreado,
}) => {
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: 'success' | 'error'; msg: string } | null>(null);

  // Solo podemos persistir un requerimiento si tenemos los IDs de producto.
  const puedeGenerar = productosInsuficientes.some((p) => p.productoId != null);

  const handleClose = () => {
    setResultado(null);
    onClose();
  };

  const handleGenerarRequerimiento = async () => {
    const detalles = productosInsuficientes
      .filter((p) => p.productoId != null)
      .map((p) => ({
        productoId: p.productoId as number,
        cantidadRequerida: p.faltante,
        proveedorSugeridoId: p.proveedorSugeridoId ?? null,
      }));

    if (detalles.length === 0) return;

    setGenerando(true);
    setResultado(null);
    try {
      const req = await requerimientoStockApi.crear({
        origen: 'FABRICACION',
        recetaId: recetaId ?? null,
        cantidadEquipos,
        observaciones: `Generado desde fabricación (${cantidadEquipos} equipo${cantidadEquipos > 1 ? 's' : ''})`,
        detalles,
      });
      const msg = `Requerimiento de stock #${req.id} creado con ${detalles.length} producto(s).`;
      setResultado({ tipo: 'success', msg });
      onRequerimientoCreado?.(msg);
    } catch (err) {
      const axiosLike = err as { response?: { data?: { message?: string } } };
      const backendMsg = axiosLike?.response?.data?.message;
      setResultado({
        tipo: 'error',
        msg: backendMsg ?? (err instanceof Error ? err.message : 'Error al generar el requerimiento'),
      });
    } finally {
      setGenerando(false);
    }
  };

  const yaGenerado = resultado?.tipo === 'success';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24,
        },
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
              },
            }}
          />
          <Box>
            <Typography variant="h5" fontWeight="600" color="error.main">
              Stock Insuficiente
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No se puede fabricar {cantidadEquipos > 1 ? `los ${cantidadEquipos} equipos` : 'el equipo'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="500">
            Faltan los siguientes productos de la receta:
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
                <Box display="flex" alignItems="flex-start" gap={1} width="100%">
                  <InventoryIcon sx={{ color: 'error.main', fontSize: 20, mt: 0.3 }} />
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
                    {producto.proveedorSugeridoNombre && (
                      <Chip
                        icon={<LocalShippingIcon />}
                        size="small"
                        variant="outlined"
                        color="primary"
                        label={`Proveedor sugerido: ${producto.proveedorSugeridoNombre}`}
                        sx={{ mt: 0.75, height: 22, '& .MuiChip-label': { fontSize: 11 } }}
                      />
                    )}
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>

        {resultado && (
          <Alert severity={resultado.tipo} sx={{ mt: 2 }}>
            {resultado.msg}
          </Alert>
        )}

        {!resultado && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              💡 <strong>Sugerencia:</strong> generá un requerimiento de stock para registrar el faltante y
              gestionar la compra al proveedor, o reabastecé los productos antes de fabricar.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          Cerrar
        </Button>
        {puedeGenerar && (
          <Button
            onClick={handleGenerarRequerimiento}
            variant="contained"
            color="primary"
            disabled={generando || yaGenerado}
            startIcon={
              generando ? <CircularProgress size={16} color="inherit" /> : <AddShoppingCartIcon />
            }
          >
            {generando
              ? 'Generando…'
              : yaGenerado
                ? 'Requerimiento generado'
                : 'Generar requerimiento de stock'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default StockErrorDialog;
