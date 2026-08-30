import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import Ripser404Illustration from '../components/common/Ripser404Illustration';

/**
 * Catch-all interno de la app (Route path="*"): URL sin match (bookmark
 * inválido, link viejo, typo). Ilustración de la heladera Ripser perdida
 * (handoff de diseño hi-fi) + mensaje.
 */
const NotFoundPage: React.FC = () => {
  const location = useLocation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
        gap: 1.5,
        px: 2,
        py: 4,
        textAlign: 'center',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 560 }}>
        <Ripser404Illustration />
      </Box>
      <Typography variant="h4" component="h1">
        ¡Ups! No encontramos esta página.
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Parece que se perdió por el camino.
      </Typography>
      <Typography variant="caption" color="text.disabled">
        La ruta <code>{location.pathname}</code> no existe en el sistema.
      </Typography>
      {/* `/` cae en DashboardEntry, que manda a cada rol a SU pantalla de
          inicio (RRHH, cobranzas, transporte, etc.) — no siempre al Dashboard. */}
      <Button variant="contained" size="large" component={RouterLink} to="/" sx={{ mt: 1 }}>
        Volver al inicio
      </Button>
    </Box>
  );
};

export default NotFoundPage;
