import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import { Add as AddIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';

export interface ItemPendienteFabricacion {
  recetaId: number;
  recetaNombre: string;
  cantidad: number;
  colorId?: number;
  medidaId?: number;
  medidaNombre?: string;
  stockDisponible: number;
}

interface Props {
  open: boolean;
  item: ItemPendienteFabricacion | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const FabricacionConfirmDialog: React.FC<Props> = ({ open, item, loading, onCancel, onConfirm }) => (
  <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
    <DialogTitle>
      <Box display="flex" alignItems="center" gap={1}>
        <ShoppingCartIcon color="warning" />
        <Typography variant="h6">Stock Insuficiente</Typography>
      </Box>
    </DialogTitle>
    <DialogContent>
      {item && (
        <Box>
          <Alert severity="warning" sx={{ mb: 2 }}>
            No hay suficiente stock disponible para completar este pedido
          </Alert>
          <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">Detalle del Equipo:</Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Row label="Equipo:" value={item.recetaNombre} />
              {item.colorId != null && <Row label="Color id:" value={String(item.colorId)} />}
              {item.medidaNombre && <Row label="Medida:" value={item.medidaNombre} />}
              <Divider sx={{ my: 1 }} />
              <Row label="Cantidad solicitada:" value={String(item.cantidad + item.stockDisponible)} valueColor="primary" />
              <Row label="Stock disponible:" value={String(item.stockDisponible)} valueColor="success.main" />
              <Row label="Faltante:" value={String(item.cantidad)} valueColor="error.main" />
            </Box>
          </Paper>
          <Typography variant="body2" paragraph>
            ¿Deseas generar un pedido de fabricación para crear los <strong>{item.cantidad}</strong> equipos faltantes?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              💡 Los equipos se crearán en estado <strong>EN_PROCESO</strong> y podrás verlos en el módulo
              {' '}<strong>Producción → Equipos Fabricados</strong>.
              <br /><br />
              Después de crear el pedido, la facturación continuará automáticamente.
            </Typography>
          </Alert>
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} color="inherit">Cancelar</Button>
      <Button
        variant="contained"
        onClick={onConfirm}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
      >
        Sí, Generar Pedido
      </Button>
    </DialogActions>
  </Dialog>
);

const Row: React.FC<{ label: string; value: string; valueColor?: string }> = ({ label, value, valueColor }) => (
  <Box display="flex" justifyContent="space-between">
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight="bold" color={valueColor}>{value}</Typography>
  </Box>
);

export default FabricacionConfirmDialog;
