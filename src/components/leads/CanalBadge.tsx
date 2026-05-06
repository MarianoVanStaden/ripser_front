import { Box, Chip, Tooltip } from '@mui/material';
import { CanalEnum, CANAL_LABELS, CANAL_ICONS } from '../../types/lead.types';

interface CanalBadgeProps {
  canal: CanalEnum;
  size?: 'small' | 'medium';
  iconOnly?: boolean;
}

export const CanalBadge = ({ canal, size = 'small', iconOnly = false }: CanalBadgeProps) => {
  if (iconOnly) {
    return (
      <Tooltip title={CANAL_LABELS[canal]} placement="top" arrow>
        <Box
          component="span"
          aria-label={CANAL_LABELS[canal]}
          sx={{
            fontSize: size === 'small' ? '1.05rem' : '1.25rem',
            lineHeight: 1,
            display: 'inline-block',
          }}
        >
          {CANAL_ICONS[canal]}
        </Box>
      </Tooltip>
    );
  }

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
