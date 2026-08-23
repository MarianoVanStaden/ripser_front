import { Box, Typography, Alert, Chip } from '@mui/material';
import {
  FolderOpen, Warning, Handshake, Cancel, CheckCircle,
  AttachMoney, TrendingUp, Gavel, Lock, WarningAmber,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { EventoCobranzaDTO } from '../../../types/cobranza.types';
import { TIPO_EVENTO_LABELS, TipoEventoCobranza } from '../../../types/cobranza.types';
import { formatPrice } from '../../../utils/priceCalculations';
import LoadingOverlay from '../../common/LoadingOverlay';
import type { StatusRole } from '../../../theme/statusRoles';

interface TimelineCobranzaProps {
  eventos: EventoCobranzaDTO[];
  loading?: boolean;
  error?: string | null;
}

interface EventoConfig {
  icon: React.ReactElement;
  role: StatusRole;
}

const EVENTO_CONFIG: Record<TipoEventoCobranza, EventoConfig> = {
  GESTION_ABIERTA:            { icon: <FolderOpen />,      role: 'info' },
  CUOTA_VENCIDA:              { icon: <Warning />,         role: 'danger' },
  CUOTAS_EN_MORA_ACTUALIZADO: { icon: <WarningAmber />,    role: 'warning' },
  PROMESA_REGISTRADA:         { icon: <Handshake />,       role: 'process' },
  PROMESA_INCUMPLIDA:         { icon: <Cancel />,          role: 'danger' },
  PROMESA_CUMPLIDA:           { icon: <CheckCircle />,     role: 'success' },
  PROMESA_CANCELADA:          { icon: <Cancel />,          role: 'neutral' },
  PAGO_PARCIAL_REGISTRADO:    { icon: <AttachMoney />,     role: 'warning' },
  PAGO_TOTAL_REGISTRADO:      { icon: <CheckCircle />,     role: 'success' },
  PRIORIDAD_ESCALADA:         { icon: <TrendingUp />,      role: 'danger' },
  AGENTE_ASIGNADO:            { icon: <FolderOpen />,      role: 'info' },
  ACUERDO_CUOTAS_CREADO:      { icon: <Handshake />,       role: 'info' },
  DERIVADO_LEGAL:             { icon: <Gavel />,           role: 'danger' },
  GESTION_CERRADA:            { icon: <Lock />,            role: 'neutral' },
};

export const TimelineCobranza: React.FC<TimelineCobranzaProps> = ({
  eventos,
  loading,
  error,
}) => {
  if (error) {
    return (
      <>
        <LoadingOverlay open={!!loading} message="Cargando eventos..." />
        <Alert severity="error">{error}</Alert>
      </>
    );
  }

  if (eventos.length === 0) {
    return (
      <>
        <LoadingOverlay open={!!loading} message="Cargando eventos..." />
        <Typography color="text.secondary" py={3} textAlign="center">
          No hay eventos registrados aún.
        </Typography>
      </>
    );
  }

  return (
    <Box sx={{ position: 'relative', pl: 3 }}>
      <LoadingOverlay open={!!loading} message="Cargando eventos..." />
      {/* Línea vertical */}
      <Box
        sx={{
          position: 'absolute',
          left: 19,
          top: 0,
          bottom: 0,
          width: 2,
          bgcolor: 'divider',
        }}
      />

      {eventos.map((evento, idx) => {
        const cfg = EVENTO_CONFIG[evento.tipo] ?? {
          icon: <FolderOpen />,
          role: 'neutral' as StatusRole,
        };
        const fgVar = `var(--mui-palette-status-${cfg.role}-fg)`;

        return (
          <Box
            key={evento.id}
            sx={{
              display: 'flex',
              gap: 2,
              mb: idx < eventos.length - 1 ? 3 : 0,
              position: 'relative',
            }}
          >
            {/* Icono */}
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: `status.${cfg.role}.bg`,
                border: `2px solid ${fgVar}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                zIndex: 1,
                '& svg': { fontSize: 18, color: `status.${cfg.role}.fg` },
              }}
            >
              {cfg.icon}
            </Box>

            {/* Contenido */}
            <Box sx={{ flex: 1, pt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={TIPO_EVENTO_LABELS[evento.tipo]}
                  size="small"
                  sx={{
                    bgcolor: `status.${cfg.role}.bg`,
                    color: `status.${cfg.role}.fg`,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    border: `1px solid color-mix(in srgb, ${fgVar} 25%, transparent)`,
                  }}
                />
                {evento.monto != null && (
                  <Chip
                    label={formatPrice(evento.monto)}
                    size="small"
                    variant="outlined"
                    color="default"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
                <Typography variant="caption" color="text.disabled">
                  {dayjs(evento.fechaEvento).format('DD/MM/YY HH:mm')}
                  {evento.usuarioId == null && ' · Sistema'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {evento.descripcion}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
