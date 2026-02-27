import React from 'react';
import { Chip } from '@mui/material';
import type { AccionSugerida } from '../../../../types';
import { ACCION_SUGERIDA_LABELS } from '../../../../types';

interface EvaluacionBadgeProps {
  accionSugerida: AccionSugerida;
}

export const EvaluacionBadge: React.FC<EvaluacionBadgeProps> = ({ accionSugerida }) => {
  if (accionSugerida === 'FABRICAR') {
    return (
      <Chip
        label={ACCION_SUGERIDA_LABELS[accionSugerida]}
        color="error"
        size="small"
      />
    );
  }

  if (accionSugerida === 'TERMINAR_BASE') {
    return (
      <Chip
        label={ACCION_SUGERIDA_LABELS[accionSugerida]}
        size="small"
        sx={{
          backgroundColor: '#e65100',
          color: '#fff',
          fontWeight: 500,
        }}
      />
    );
  }

  return (
    <Chip
      label={ACCION_SUGERIDA_LABELS[accionSugerida]}
      color="success"
      size="small"
    />
  );
};
