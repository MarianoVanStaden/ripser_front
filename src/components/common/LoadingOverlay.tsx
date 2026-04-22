import React from 'react';
import { Backdrop, Box, CircularProgress, Typography } from '@mui/material';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  progress?: { current: number; total: number };
}

/**
 * Overlay de carga reutilizable. Se muestra por encima de cualquier contenido,
 * incluyendo Dialogs abiertos (z-index > modal).
 *
 * Uso básico:
 *   <LoadingOverlay open={loading} message="Procesando..." />
 *
 * Con progreso:
 *   <LoadingOverlay open={loading} message="Registrando equipos..." progress={{ current: 5, total: 221 }} />
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ open, message, progress }) => (
  <Backdrop
    open={open}
    sx={{
      color: '#fff',
      zIndex: (theme) => theme.zIndex.modal + 1,
      flexDirection: 'column',
      gap: 2,
      backdropFilter: 'blur(2px)',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    }}
  >
    <CircularProgress color="inherit" size={56} thickness={4} />
    {message && (
      <Typography
        variant="h6"
        sx={{ textAlign: 'center', px: 4, fontWeight: 500 }}
      >
        {message}
      </Typography>
    )}
    {progress && (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
          {progress.current} de {progress.total}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Por favor no cierre esta ventana
        </Typography>
      </Box>
    )}
  </Backdrop>
);

export default LoadingOverlay;
