// FRONT-003: extracted from DeliveriesPage.tsx — par mobile (BottomSheet)
// + desktop (SwipeableDrawer) para marcar una entrega como NO_ENTREGADA.
// El padre maneja la mutación; este componente es controlled view.
import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography,
} from '@mui/material';
import { Cancel as CancelIcon } from '@mui/icons-material';
import BottomSheet from '../components/BottomSheet';
import { REJECTION_REASONS } from '../constants';
import { useResponsive } from '../useResponsive';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  motivo: string;
  setMotivo: (value: string) => void;
}

const RejectDeliveryDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  motivo,
  setMotivo,
}) => {
  const { isMobile } = useResponsive();

  const reasonChips = (
    <Box display="flex" flexWrap="wrap" gap={1}>
      {REJECTION_REASONS.map((reason) => (
        <Chip
          key={reason}
          label={reason}
          onClick={() => setMotivo(reason)}
          color={motivo === reason ? 'primary' : 'default'}
          variant={motivo === reason ? 'filled' : 'outlined'}
          sx={isMobile ? { minHeight: 36 } : undefined}
        />
      ))}
    </Box>
  );

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Marcar como No Entregada"
        actions={
          <Stack direction="row" spacing={1.5}>
            <Button onClick={onClose} sx={{ flex: 1, minHeight: 48 }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={onConfirm}
              disabled={!motivo.trim()}
              sx={{ flex: 1, minHeight: 48 }}
            >
              Rechazar
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Alert severity="warning">Indique el motivo por el cual no se pudo entregar.</Alert>

          <Typography variant="subtitle2">Motivos rapidos:</Typography>
          {reasonChips}

          <TextField
            label="Motivo del Rechazo *"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            fullWidth
            multiline
            rows={3}
            required
            placeholder="Describa el motivo..."
          />
        </Stack>
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
          <CancelIcon color="error" />
          <Typography variant="h6">Marcar como No Entregada</Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 2 }}>
          Indique el motivo por el cual no se pudo entregar.
        </Alert>

        <Stack spacing={2}>
          <Typography variant="subtitle2">Motivos rapidos:</Typography>
          {reasonChips}

          <TextField
            label="Motivo del Rechazo *"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            fullWidth
            multiline
            rows={4}
            required
          />

          <Box display="flex" gap={2} mt={2}>
            <Button onClick={onClose} sx={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={onConfirm}
              disabled={!motivo.trim()}
              sx={{ flex: 1 }}
            >
              Rechazar
            </Button>
          </Box>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );
};

export default RejectDeliveryDialog;
