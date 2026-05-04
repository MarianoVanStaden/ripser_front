// FRONT-003: extracted from PresupuestosPage.tsx — confirmación de cierre
// (descartar cambios) o de creación (mostrar resumen antes de persistir).
// Componente bivalente: el modo lo determina `action`.
import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { Cliente, Lead } from '../../../../types';
import type { FormData } from '../types';

interface Props {
  open: boolean;
  action: 'close' | 'create' | null;
  onCancel: () => void;
  onConfirmClose: () => void;
  onConfirmCreate: () => void;
  /** Resumen del presupuesto a crear (solo se usa cuando action === 'create'). */
  total: number;
  subtotal: number;
  ivaAmount: number;
  descuentoAmount: number;
  selectedCliente: Cliente | null;
  leads: Lead[];
  formData: FormData;
  detallesCount: number;
}

const ConfirmPresupuestoDialog: React.FC<Props> = ({
  open,
  action,
  onCancel,
  onConfirmClose,
  onConfirmCreate,
  total,
  subtotal,
  ivaAmount,
  descuentoAmount,
  selectedCliente,
  leads,
  formData,
  detallesCount,
}) => {
  const isClose = action === 'close';

  const destinatarioLabel = selectedCliente
    ? selectedCliente.razonSocial ||
      `${selectedCliente.nombre} ${selectedCliente.apellido || ''}`.trim()
    : leads.find((l) => l.id != null && l.id.toString() === formData.leadId)?.nombre || '—';

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{isClose ? 'Confirmar cierre' : 'Confirmar creación'}</DialogTitle>
      <DialogContent>
        <Typography>
          {isClose
            ? '¿Está seguro que desea cerrar? Se perderán todos los cambios no guardados.'
            : `¿Está seguro que desea crear este presupuesto con un total de ${total.toLocaleString(
                'es-AR',
                { minimumFractionDigits: 2 }
              )}?`}
        </Typography>
        {action === 'create' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Cliente: {destinatarioLabel}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cantidad de items: {detallesCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Subtotal: ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
            {formData.descuentoTipo !== 'NONE' && descuentoAmount > 0 && (
              <Typography variant="body2" color="error.main">
                Descuento{' '}
                {formData.descuentoTipo === 'PORCENTAJE'
                  ? `(${formData.descuentoValor}%)`
                  : '(monto fijo)'}
                : -${descuentoAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              IVA (
              {formData.tipoIva === 'IVA_21'
                ? '21%'
                : formData.tipoIva === 'IVA_10_5'
                ? '10.5%'
                : '0%'}
              ): ${ivaAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button
          onClick={isClose ? onConfirmClose : onConfirmCreate}
          variant="contained"
          color={isClose ? 'error' : 'primary'}
        >
          {isClose ? 'Cerrar sin guardar' : 'Confirmar y crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmPresupuestoDialog;
