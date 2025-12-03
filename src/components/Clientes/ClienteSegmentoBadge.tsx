import { Chip } from '@mui/material';
import {
  Diamond as VIPIcon,
  Star as PremiumIcon,
  Circle as StandardIcon,
  CircleOutlined as BasicoIcon
} from '@mui/icons-material';
import type { SegmentoCliente } from '../../types';

interface ClienteSegmentoBadgeProps {
  segmento: SegmentoCliente;
  size?: 'small' | 'medium';
  showIcon?: boolean;
}

const SEGMENTO_COLORS: Record<SegmentoCliente, string> = {
  VIP: '#9333EA', // Púrpura oscuro
  PREMIUM: '#EA580C', // Naranja
  STANDARD: '#0284C7', // Azul
  BASICO: '#64748B' // Gris
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
        backgroundColor: SEGMENTO_COLORS[segmento],
        color: 'white',
        fontWeight: 'bold',
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        minWidth: size === 'small' ? 70 : 90,
        '& .MuiChip-icon': {
          color: 'white'
        }
      }}
    />
  );
};
