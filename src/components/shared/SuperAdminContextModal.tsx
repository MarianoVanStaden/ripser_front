import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';

interface SuperAdminContextModalProps {
  /** Si es true, el modal se abre automáticamente cuando no hay empresa seleccionada */
  autoOpen?: boolean;
  /** Mensaje personalizado para mostrar en el modal */
  customMessage?: string;
  /** Callback que se ejecuta cuando el usuario cierra el modal sin ir al selector */
  onClose?: () => void;
}

/**
 * Modal que informa al SuperAdmin que debe seleccionar un contexto de empresa
 * antes de realizar ciertas operaciones.
 * 
 * Este modal aparece cuando:
 * - El usuario es SuperAdmin
 * - No tiene un empresaId seleccionado en su JWT/contexto
 * 
 * Uso:
 * ```tsx
 * import { SuperAdminContextModal, useSuperAdminContextCheck } from '../components/shared/SuperAdminContextModal';
 * 
 * const MyPage = () => {
 *   const { showModal, closeModal } = useSuperAdminContextCheck();
 *   
 *   return (
 *     <>
 *       <SuperAdminContextModal autoOpen={showModal} onClose={closeModal} />
 *       // resto del contenido
 *     </>
 *   );
 * };
 * ```
 */
export const SuperAdminContextModal: React.FC<SuperAdminContextModalProps> = ({
  autoOpen = false,
  customMessage,
  onClose,
}) => {
  const navigate = useNavigate();
  const { empresaId } = useTenant();
  const { esSuperAdmin } = useAuth();
  
  // El modal solo debe mostrarse si:
  // 1. El usuario es SuperAdmin
  // 2. No tiene empresaId seleccionado
  // 3. autoOpen es true
  const shouldShow = autoOpen && esSuperAdmin && !empresaId;

  const handleGoToSelector = () => {
    navigate('/admin/tenant-selector');
    onClose?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  const defaultMessage = `Como Super Administrador, necesitas seleccionar un contexto de empresa 
    antes de realizar operaciones que requieren un empresaId. Esto asegura que los datos 
    se registren correctamente en la empresa seleccionada.`;

  return (
    <Dialog
      open={shouldShow}
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
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'warning.light',
          color: 'warning.contrastText',
        }}
      >
        <WarningIcon />
        <Typography variant="h6" component="span">
          Selección de Contexto Requerida
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            ¿Por qué aparece este mensaje?
          </Typography>
          <Typography variant="body2">
            Tu sesión de Super Administrador no tiene un contexto de empresa definido en el token JWT.
          </Typography>
        </Alert>

        <Box sx={{ my: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body1" color="text.secondary">
            {customMessage || defaultMessage}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 2,
            bgcolor: 'primary.light',
            borderRadius: 1,
            color: 'primary.contrastText',
          }}
        >
          <BusinessIcon />
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              Pasos a seguir:
            </Typography>
            <Typography variant="body2">
              1. Haz clic en "Ir al Selector de Contexto" <br />
              2. Selecciona la empresa en la que deseas trabajar <br />
              3. (Opcional) Selecciona una sucursal específica <br />
              4. Haz clic en "Aplicar Cambios"
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} color="inherit" variant="outlined">
          Cerrar
        </Button>
        <Button
          onClick={handleGoToSelector}
          variant="contained"
          color="primary"
          startIcon={<BusinessIcon />}
          autoFocus
        >
          Ir al Selector de Contexto
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Hook que facilita el uso del SuperAdminContextModal.
 * Retorna el estado necesario para mostrar/ocultar el modal.
 */
export const useSuperAdminContextCheck = () => {
  const { empresaId } = useTenant();
  const { esSuperAdmin } = useAuth();
  const [dismissed, setDismissed] = React.useState(false);

  // El modal debe mostrarse si es SuperAdmin sin empresaId y no ha sido cerrado manualmente
  const showModal = esSuperAdmin && !empresaId && !dismissed;

  const closeModal = () => {
    setDismissed(true);
  };

  // Resetear cuando cambie el empresaId
  React.useEffect(() => {
    if (empresaId) {
      setDismissed(false);
    }
  }, [empresaId]);

  return {
    showModal,
    closeModal,
    needsContext: esSuperAdmin && !empresaId,
  };
};

export default SuperAdminContextModal;
