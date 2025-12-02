import { Chip } from '@mui/material';
import { CanalEnum, CANAL_LABELS, CANAL_ICONS } from '../../types/lead.types';

interface CanalBadgeProps {
  canal: CanalEnum;
  size?: 'small' | 'medium';
}

export const CanalBadge = ({ canal, size = 'small' }: CanalBadgeProps) => {
  return (
    <Chip
      label={`${CANAL_ICONS[canal]} ${CANAL_LABELS[canal]}`}
      size={size}
      variant="outlined"
      sx={{
        fontSize: size === 'small' ? '0.75rem' : '0.875rem'
      }}
    />
  );
};
