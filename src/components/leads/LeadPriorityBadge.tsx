import { Chip } from '@mui/material';
import { PrioridadLeadEnum, PRIORIDAD_COLORS, PRIORIDAD_LABELS } from '../../types/lead.types';

interface LeadPriorityBadgeProps {
  priority: PrioridadLeadEnum;
  size?: 'small' | 'medium';
}

export const LeadPriorityBadge = ({ priority, size = 'small' }: LeadPriorityBadgeProps) => {
  return (
    <Chip
      label={PRIORIDAD_LABELS[priority]}
      size={size}
      sx={{
        backgroundColor: PRIORIDAD_COLORS[priority],
        color: 'white',
        fontWeight: 'bold',
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        minWidth: size === 'small' ? 80 : 100
      }}
    />
  );
};
