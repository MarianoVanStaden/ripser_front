import React from 'react';
import { Box, Button, Stack, SwipeableDrawer, Typography } from '@mui/material';
import { AttachMoney as AttachMoneyIcon } from '@mui/icons-material';
import BottomSheet from '../components/BottomSheet';
import CobroSection from '../components/CobroSection';
import { hasMontoValido } from '../components/cobroHelpers';
import { useResponsive } from '../useResponsive';
import type { CobroData } from '../types';

const fmtMonto = (n?: number | null) =>
  n != null
    ? `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;

interface CobroStandaloneDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cobro: CobroData;
  setCobro: (d: CobroData) => void;
  montoEsperado?: number | null;
}

/**
 * Registrar/corregir el cobro de una entrega ya ENTREGADA (Etapa 6.4:
 * extraído de DeliveriesPage). BottomSheet en mobile, drawer en desktop.
 */
const CobroStandaloneDialog: React.FC<CobroStandaloneDialogProps> = ({
  open, onClose, onConfirm, cobro, setCobro, montoEsperado,
}) => {
  const { isMobile } = useResponsive();
  const canConfirm = hasMontoValido(cobro);

  const body = (
    <Stack spacing={2}>
      {montoEsperado != null && (
        <Box
          sx={{
            bgcolor: 'success.50',
            border: '1px solid',
            borderColor: 'success.main',
            borderRadius: 1,
            p: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="success.dark" fontWeight={500}>
            Monto esperado
          </Typography>
          <Typography variant="h6" color="success.dark" fontWeight={700}>
            {fmtMonto(montoEsperado)}
          </Typography>
        </Box>
      )}

      <CobroSection cobro={cobro} setCobro={setCobro} montoEsperado={montoEsperado} />
    </Stack>
  );

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Registrar Cobro"
        actions={
          <Stack direction="row" spacing={1.5}>
            <Button onClick={onClose} sx={{ flex: 1, minHeight: 48 }}>Cancelar</Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<AttachMoneyIcon />}
              onClick={onConfirm}
              disabled={!canConfirm}
              sx={{ flex: 1, minHeight: 48 }}
            >
              Guardar cobro
            </Button>
          </Stack>
        }
      >
        {body}
      </BottomSheet>
    );
  }

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      PaperProps={{ sx: { width: 400 } }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <AttachMoneyIcon color="success" />
          <Typography variant="h6">Registrar Cobro</Typography>
        </Box>
        {body}
        <Box display="flex" gap={2} mt={3}>
          <Button onClick={onClose} sx={{ flex: 1 }}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            onClick={onConfirm}
            disabled={!canConfirm}
            sx={{ flex: 1 }}
          >
            Guardar cobro
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

export default CobroStandaloneDialog;
