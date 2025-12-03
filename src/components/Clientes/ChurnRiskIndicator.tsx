import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface ChurnRiskIndicatorProps {
  enRiesgo: boolean;
  diasDesdeUltimaCompra?: number;
  frecuenciaCompraDias?: number;
  size?: 'small' | 'medium';
  variant?: 'chip' | 'icon' | 'full';
}

export const ChurnRiskIndicator = ({
  enRiesgo,
  diasDesdeUltimaCompra,
  frecuenciaCompraDias,
  size = 'small',
  variant = 'chip'
}: ChurnRiskIndicatorProps) => {
  if (!enRiesgo) {
    return null;
  }

  const getMotivoRiesgo = () => {
    if (diasDesdeUltimaCompra && diasDesdeUltimaCompra > 400) {
      return `Hace ${diasDesdeUltimaCompra} días sin comprar`;
    }
    if (frecuenciaCompraDias && diasDesdeUltimaCompra && diasDesdeUltimaCompra > frecuenciaCompraDias * 2) {
      return `Superó el doble de su frecuencia normal (${frecuenciaCompraDias} días)`;
    }
    return 'Cliente en riesgo de pérdida';
  };

  // Variant: solo icono
  if (variant === 'icon') {
    return (
      <Tooltip title={getMotivoRiesgo()}>
        <WarningIcon
          sx={{
            color: '#EF4444',
            fontSize: size === 'small' ? 18 : 24,
            cursor: 'pointer'
          }}
        />
      </Tooltip>
    );
  }

  // Variant: chip
  if (variant === 'chip') {
    return (
      <Tooltip title={getMotivoRiesgo()}>
        <Chip
          icon={<WarningIcon />}
          label="Riesgo Churn"
          size={size}
          sx={{
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            fontWeight: 'bold',
            fontSize: size === 'small' ? '0.7rem' : '0.8rem',
            '& .MuiChip-icon': {
              color: '#EF4444'
            }
          }}
        />
      </Tooltip>
    );
  }

  // Variant: full (con detalles)
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.5,
        backgroundColor: '#FEE2E2',
        borderRadius: 1,
        border: '1px solid #FCA5A5'
      }}
    >
      <WarningIcon sx={{ color: '#EF4444', fontSize: 20 }} />
      <Box>
        <Typography variant="body2" fontWeight="bold" color="#991B1B">
          Cliente en Riesgo de Churn
        </Typography>
        <Typography variant="caption" color="#7F1D1D">
          {getMotivoRiesgo()}
        </Typography>
      </Box>
    </Box>
  );
};
