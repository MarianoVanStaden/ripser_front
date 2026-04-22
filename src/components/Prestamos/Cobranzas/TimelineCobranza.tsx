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

interface TimelineCobranzaProps {
  eventos: EventoCobranzaDTO[];
  loading?: boolean;
  error?: string | null;
}

interface EventoConfig {
  icon: React.ReactElement;
  color: string;
  bgColor: string;
}

const EVENTO_CONFIG: Record<TipoEventoCobranza, EventoConfig> = {
  GESTION_ABIERTA:            { icon: <FolderOpen />,     color: '#1976D2', bgColor: '#E3F2FD' },
  CUOTA_VENCIDA:              { icon: <Warning />,         color: '#F44336', bgColor: '#FFEBEE' },
  CUOTAS_EN_MORA_ACTUALIZADO: { icon: <WarningAmber />,    color: '#FF9800', bgColor: '#FFF3E0' },
  PROMESA_REGISTRADA:         { icon: <Handshake />,       color: '#9C27B0', bgColor: '#F3E5F5' },
  PROMESA_INCUMPLIDA:         { icon: <Cancel />,          color: '#F44336', bgColor: '#FFEBEE' },
  PROMESA_CUMPLIDA:           { icon: <CheckCircle />,     color: '#4CAF50', bgColor: '#E8F5E9' },
  PROMESA_CANCELADA:          { icon: <Cancel />,          color: '#9E9E9E', bgColor: '#F5F5F5' },
  PAGO_PARCIAL_REGISTRADO:    { icon: <AttachMoney />,     color: '#FF9800', bgColor: '#FFF3E0' },
  PAGO_TOTAL_REGISTRADO:      { icon: <CheckCircle />,     color: '#4CAF50', bgColor: '#E8F5E9' },
  PRIORIDAD_ESCALADA:         { icon: <TrendingUp />,      color: '#F44336', bgColor: '#FFEBEE' },
  AGENTE_ASIGNADO:            { icon: <FolderOpen />,      color: '#1976D2', bgColor: '#E3F2FD' },
  ACUERDO_CUOTAS_CREADO:      { icon: <Handshake />,       color: '#00BCD4', bgColor: '#E0F7FA' },
  DERIVADO_LEGAL:             { icon: <Gavel />,           color: '#F44336', bgColor: '#FFEBEE' },
  GESTION_CERRADA:            { icon: <Lock />,            color: '#9E9E9E', bgColor: '#F5F5F5' },
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
          color: '#9E9E9E',
          bgColor: '#F5F5F5',
        };

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
                bgcolor: cfg.bgColor,
                border: `2px solid ${cfg.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                zIndex: 1,
                '& svg': { fontSize: 18, color: cfg.color },
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
                    bgcolor: cfg.bgColor,
                    color: cfg.color,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    border: `1px solid ${cfg.color}40`,
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
