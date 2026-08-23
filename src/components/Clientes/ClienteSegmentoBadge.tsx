import { Chip } from '@mui/material';
import {
  Diamond as VIPIcon,
  Star as PremiumIcon,
  Circle as StandardIcon,
  CircleOutlined as BasicoIcon
} from '@mui/icons-material';
import type { SegmentoCliente } from '../../types';
import { statusSx, type StatusRole } from '../../theme/statusRoles';

interface ClienteSegmentoBadgeProps {
  segmento: SegmentoCliente;
  size?: 'small' | 'medium';
  showIcon?: boolean;
}

// Rol visual por segmento (antes hexes fijos: púrpura/naranja/azul/gris).
const SEGMENTO_ROLES: Record<SegmentoCliente, StatusRole> = {
  VIP: 'process', // Púrpura
  PREMIUM: 'warning', // Naranja
  STANDARD: 'info', // Azul
  BASICO: 'neutral' // Gris
};

const SEGMENTO_LABELS: Record<SegmentoCliente, string> = {
  VIP: 'VIP',
  PREMIUM: 'Premium',
  STANDARD: 'Standard',
  BASICO: 'Básico'
};

const SEGMENTO_ICONS: Record<SegmentoCliente, React.ReactElement> = {
  VIP: <VIPIcon sx={{ fontSize: 16 }} />,
  PREMIUM: <PremiumIcon sx={{ fontSize: 16 }} />,
  STANDARD: <StandardIcon sx={{ fontSize: 16 }} />,
  BASICO: <BasicoIcon sx={{ fontSize: 16 }} />
};

export const ClienteSegmentoBadge = ({ segmento, size = 'small', showIcon = true }: ClienteSegmentoBadgeProps) => {
  return (
    <Chip
      label={SEGMENTO_LABELS[segmento]}
      icon={showIcon ? SEGMENTO_ICONS[segmento] : undefined}
      size={size}
      sx={{
        ...statusSx(SEGMENTO_ROLES[segmento]),
        fontWeight: 'bold',
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        minWidth: size === 'small' ? 70 : 90,
        '& .MuiChip-icon': {
          color: `status.${SEGMENTO_ROLES[segmento]}.fg`
        }
      }}
    />
  );
};
