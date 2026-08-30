import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import ysyLogo from '../assets/ysy-logo.png';

/**
 * Catch-all interno de la app (Route path="*"): URL sin match (bookmark
 * inválido, link viejo, typo). Antes renderizaba el Layout con el outlet
 * vacío + warning "No routes matched" en consola.
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
        minHeight: '60vh',
        gap: 2,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Box
        component="img"
        src={ysyLogo}
        alt="YSY Software"
        sx={{ width: 96, height: 96, mb: 1 }}
      />
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
        Error 404
      </Typography>
      <Typography variant="h4">Página no encontrada</Typography>
      <Typography variant="body1" color="text.secondary">
        La ruta <code>{location.pathname}</code> no existe en el sistema.
        Puede ser un enlace viejo o mal escrito.
      </Typography>
      <Button variant="contained" component={RouterLink} to="/">
        Volver al Dashboard
      </Button>
      <Typography variant="caption" color="text.disabled" sx={{ mt: 2 }}>
        RipserApp · YSY Software
      </Typography>
    </Box>
  );
};

export default NotFoundPage;
