import { Chip } from '@mui/material';
import { EstadoLeadEnum, ESTADO_COLORS, ESTADO_LABELS } from '../../types/lead.types';

interface LeadStatusBadgeProps {
  status: EstadoLeadEnum;
  size?: 'small' | 'medium';
}

export const LeadStatusBadge = ({ status, size = 'small' }: LeadStatusBadgeProps) => {
  const isSmall = size === 'small';
  return (
    <Chip
      label={ESTADO_LABELS[status]}
      size={size}
      sx={{
        backgroundColor: ESTADO_COLORS[status],
        color: 'white',
        fontWeight: 'bold',
        fontSize: isSmall ? '0.7rem' : '0.85rem',
        // Permitir que etiquetas largas (p.ej. "Cliente Potencial Calificado",
        // "Rechazó por Precio Elevado") rompan a dos renglones en vez de
        // estirar la columna.
        height: 'auto',
        minHeight: isSmall ? 22 : 28,
        maxWidth: isSmall ? 130 : 170,
        borderRadius: isSmall ? '11px' : '14px',
        '& .MuiChip-label': {
          display: 'block',
          whiteSpace: 'normal',
          textAlign: 'center',
          lineHeight: 1.15,
          py: isSmall ? '2px' : '3px',
          px: isSmall ? '6px' : '8px',
          wordBreak: 'break-word',
        },
      }}
    />
  );
};
