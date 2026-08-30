import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { RIPSER_LOGO_ASPECT, RIPSER_LOGO_DATA_URL } from '../services/ripserLogo';

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
      {/* El logo corporativo es azul/negro sobre blanco: la tarjeta blanca lo
          hace verse deliberado también en modo oscuro. */}
      <Box
        sx={{
          // eslint-disable-next-line ripser/no-literal-colors -- el logo es azul/negro sobre blanco: la tarjeta es blanca en ambos themes a propósito
          bgcolor: '#ffffff',
          borderRadius: 2,
          px: 3,
          py: 2,
          mb: 1,
          boxShadow: 1,
        }}
      >
        <Box
          component="img"
          src={RIPSER_LOGO_DATA_URL}
          alt="Ripser"
          sx={{ width: 180, height: 180 / RIPSER_LOGO_ASPECT, display: 'block' }}
        />
      </Box>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
        Error 404
      </Typography>
      <Typography variant="h4">Página no encontrada</Typography>
      <Typography variant="body1" color="text.secondary">
        La ruta <code>{location.pathname}</code> no existe en el sistema.
        Puede ser un enlace viejo o mal escrito.
      </Typography>
      {/* `/` cae en DashboardEntry, que manda a cada rol a SU pantalla de
          inicio (RRHH, cobranzas, transporte, etc.) — no siempre al Dashboard. */}
      <Button variant="contained" component={RouterLink} to="/">
        Volver al inicio
      </Button>
      <Typography variant="caption" color="text.disabled" sx={{ mt: 2 }}>
        RipserApp · YSY Software
      </Typography>
    </Box>
  );
};

export default NotFoundPage;
