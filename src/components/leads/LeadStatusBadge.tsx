import { Chip } from '@mui/material';
import { EstadoLeadEnum, ESTADO_COLORS, ESTADO_LABELS } from '../../types/lead.types';

interface LeadStatusBadgeProps {
  status: EstadoLeadEnum;
  size?: 'small' | 'medium';
}

export const LeadStatusBadge = ({ status, size = 'small' }: LeadStatusBadgeProps) => {
  return (
    <Chip
      label={ESTADO_LABELS[status]}
      size={size}
      sx={{
        backgroundColor: ESTADO_COLORS[status],
        color: 'white',
        fontWeight: 'bold',
        fontSize: size === 'small' ? '0.75rem' : '0.875rem'
      }}
    />
  );
};
