import React from 'react';
import { Box, Typography } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import HandymanIcon from '@mui/icons-material/Handyman';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { AccionSugerida } from '../../../../types';
import { ACCION_SUGERIDA_LABELS } from '../../../../types';

interface AccionSugeridaIndicatorProps {
  accionSugerida: AccionSugerida;
}

const CONFIG: Record<AccionSugerida, { icon: React.ReactElement; color: string }> = {
  FABRICAR: {
    icon: <BuildIcon fontSize="small" />,
    color: 'error.main',
  },
  TERMINAR_BASE: {
    icon: <HandymanIcon fontSize="small" />,
    color: '#e65100',
  },
  OK: {
    icon: <CheckCircleIcon fontSize="small" />,
    color: 'success.main',
  },
};

export const AccionSugeridaIndicator: React.FC<AccionSugeridaIndicatorProps> = ({
  accionSugerida,
}) => {
  const { icon, color } = CONFIG[accionSugerida];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color }}>
      {icon}
      <Typography variant="body2" sx={{ color, fontWeight: 500 }}>
        {ACCION_SUGERIDA_LABELS[accionSugerida]}
      </Typography>
    </Box>
  );
};
