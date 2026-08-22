import { Dialog, useMediaQuery, useTheme } from '@mui/material';
import type { DialogProps } from '@mui/material';

export interface ResponsiveDialogProps extends Omit<DialogProps, 'fullScreen'> {
  /**
   * Bloquea el cierre por backdrop/Escape (submit en curso o form con
   * cambios sin guardar). El botón Cancelar del caller sigue funcionando.
   */
  disableDismiss?: boolean;
}

/**
 * Drop-in de <Dialog>: fullScreen automático en < sm (teclado virtual no
 * tapa campos) y guard opcional contra el mistap en el backdrop que
 * descartaba lo tipeado. Desktop no cambia.
 */
export default function ResponsiveDialog({
  disableDismiss = false,
  onClose,
  ...props
}: ResponsiveDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      {...props}
      fullScreen={fullScreen}
      onClose={(event, reason) => {
        if (disableDismiss && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
        onClose?.(event, reason);
      }}
    />
  );
}
