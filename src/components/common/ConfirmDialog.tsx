import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';

export type ConfirmDialogSeverity = 'error' | 'warning' | 'info' | 'success' | 'question';

export interface ConfirmDialogProps {
  open: boolean;
  /** Disparado al cancelar (botón Cancelar o backdrop). */
  onClose: () => void;
  /** Disparado al confirmar. El dialog NO se cierra solo — el caller debe llamar a onClose tras el await. */
  onConfirm: () => void | Promise<void>;
  title: string;
  /** Texto principal del cuerpo del diálogo. */
  description?: React.ReactNode;
  /**
   * Texto destacado dentro de un <Alert/> en la parte superior del cuerpo.
   * Útil para avisos del tipo "esta acción no se puede deshacer".
   */
  warning?: React.ReactNode;
  /**
   * Bloque highlighted con los datos del ítem afectado (nombre, código, etc).
   * Se renderiza dentro de un recuadro gris claro.
   */
  itemDetails?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Color del botón de confirmación. */
  severity?: ConfirmDialogSeverity;
  loading?: boolean;
  /** Si se pasa, reemplaza al icono por defecto de la severidad. */
  icon?: React.ReactNode;
  /** Texto a mostrar mientras loading=true. Si no se pasa, usa `${confirmLabel}…`. */
  loadingLabel?: string;
}

const ICON_BY_SEVERITY: Record<ConfirmDialogSeverity, React.ReactNode> = {
  error: <WarningIcon color="error" />,
  warning: <WarningIcon color="warning" />,
  info: <InfoIcon color="info" />,
  success: <CheckCircleIcon color="success" />,
  question: <HelpOutlineIcon color="primary" />,
};

const TITLE_COLOR_BY_SEVERITY: Record<ConfirmDialogSeverity, string> = {
  error: 'error.main',
  warning: 'warning.main',
  info: 'info.main',
  success: 'success.main',
  question: 'text.primary',
};

const BUTTON_COLOR_BY_SEVERITY: Record<
  ConfirmDialogSeverity,
  'error' | 'warning' | 'info' | 'success' | 'primary'
> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
  success: 'success',
  question: 'primary',
};

const CONFIRM_ICON_BY_SEVERITY: Record<ConfirmDialogSeverity, React.ReactNode | undefined> = {
  error: <DeleteIcon />,
  warning: undefined,
  info: undefined,
  success: <CheckCircleIcon />,
  question: undefined,
};

/**
 * Modal de confirmación reutilizable. Sustituye a `window.confirm`.
 * Mantiene la UX de las páginas (Proveedores, Suppliers, etc): título con
 * icono, alerta destacada opcional, recuadro de detalle del ítem y botones
 * Cancelar / Confirmar. El caller controla el ciclo del estado (open/close)
 * y maneja la promesa de la acción.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  warning,
  itemDetails,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  severity = 'question',
  loading = false,
  icon,
  loadingLabel,
}) => {
  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: TITLE_COLOR_BY_SEVERITY[severity],
        }}
      >
        {icon ?? ICON_BY_SEVERITY[severity]}
        {title}
      </DialogTitle>
      <DialogContent>
        {warning && (
          <Alert severity={severity === 'question' ? 'warning' : severity} sx={{ mb: 2 }}>
            {warning}
          </Alert>
        )}
        {description && (
          <Typography variant="body1" gutterBottom>
            {description}
          </Typography>
        )}
        {itemDetails && (
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mt: 1 }}>
            {itemDetails}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={BUTTON_COLOR_BY_SEVERITY[severity]}
          onClick={() => onConfirm()}
          disabled={loading}
          startIcon={CONFIRM_ICON_BY_SEVERITY[severity]}
        >
          {loading ? (loadingLabel ?? `${confirmLabel}…`) : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
