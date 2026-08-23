import { Box, Typography, Chip, Button, Paper, Stack } from '@mui/material';
import { Handshake, Cancel, Warning } from '@mui/icons-material';
import dayjs from 'dayjs';
import type { PromesaPagoDTO } from '../../../types/cobranza.types';
import {
  ESTADO_PROMESA_LABELS,
  EstadoPromesaPago,
} from '../../../types/cobranza.types';
import { formatPrice } from '../../../utils/priceCalculations';
import { statusSx, type StatusRole } from '../../../theme/statusRoles';

// Rol visual por estado de promesa (el mapa de colores literales vive en cobranza.types).
const PROMESA_ROLE: Record<EstadoPromesaPago, StatusRole> = {
  [EstadoPromesaPago.VIGENTE]: 'info',
  [EstadoPromesaPago.CUMPLIDA]: 'success',
  [EstadoPromesaPago.INCUMPLIDA]: 'danger',
  [EstadoPromesaPago.CANCELADA]: 'neutral',
};

interface PromesaVigenteCardProps {
  promesa: PromesaPagoDTO | null;
  gestionActiva: boolean;
  onRegistrarPromesa: () => void;
  onCancelarPromesa: (promesaId: number) => void;
}

export const PromesaVigenteCard: React.FC<PromesaVigenteCardProps> = ({
  promesa,
  gestionActiva,
  onRegistrarPromesa,
  onCancelarPromesa,
}) => {
  const estaVencida =
    promesa?.estado === EstadoPromesaPago.VIGENTE &&
    dayjs(promesa.fechaPromesa).isBefore(dayjs(), 'day');

  if (!promesa) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 2, borderStyle: 'dashed', borderColor: 'divider' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Sin promesa de pago activa
          </Typography>
          {gestionActiva && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Handshake />}
              onClick={onRegistrarPromesa}
            >
              Registrar Promesa
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  const role = PROMESA_ROLE[promesa.estado];

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: estaVencida ? 'error.main' : `status.${role}.fg`,
        borderWidth: 2,
        bgcolor: estaVencida ? 'error.50' : `status.${role}.bg`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
            {estaVencida ? (
              <Warning color="error" fontSize="small" />
            ) : (
              <Handshake fontSize="small" sx={{ color: `status.${role}.fg` }} />
            )}
            <Typography variant="subtitle2" fontWeight={700}>
              {estaVencida ? 'Promesa VENCIDA' : 'Promesa de Pago Vigente'}
            </Typography>
            <Chip
              label={ESTADO_PROMESA_LABELS[promesa.estado]}
              size="small"
              sx={{ ...statusSx(role), fontWeight: 700 }}
            />
          </Stack>
          <Typography variant="body2">
            <strong>Fecha:</strong>{' '}
            <span style={{ color: estaVencida ? 'var(--mui-palette-status-danger-fg)' : 'inherit' }}>
              {dayjs(promesa.fechaPromesa).format('DD/MM/YYYY')}
            </span>
            {estaVencida && ' (venció hace ' + dayjs().diff(dayjs(promesa.fechaPromesa), 'day') + ' días)'}
          </Typography>
          <Typography variant="body2">
            <strong>Monto comprometido:</strong>{' '}
            {formatPrice(promesa.montoPrometido)}
          </Typography>
          {promesa.cuotaIds.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              Cubre {promesa.cuotaIds.length} cuota(s) · IDs: {promesa.cuotaIds.join(', ')}
            </Typography>
          )}
        </Box>
        {gestionActiva && promesa.estado === EstadoPromesaPago.VIGENTE && (
          <Stack spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Handshake />}
              onClick={onRegistrarPromesa}
            >
              Nueva Promesa
            </Button>
            <Button
              size="small"
              variant="text"
              color="error"
              startIcon={<Cancel />}
              onClick={() => onCancelarPromesa(promesa.id)}
            >
              Cancelar
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
