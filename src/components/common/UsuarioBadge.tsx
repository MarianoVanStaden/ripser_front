import React from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  nombre: string | null;
  label?: string;
}

const UsuarioBadge: React.FC<Props> = ({ nombre, label }) => {
  if (!nombre) {
    return (
      <Typography variant="caption" color="text.disabled" fontStyle="italic">
        —
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {label && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {label}
        </Typography>
      )}
      <Typography variant="caption" fontWeight={500}>
        {nombre}
      </Typography>
    </Box>
  );
};

export default UsuarioBadge;
