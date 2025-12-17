import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

const VendedorDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Debug log
  console.log('🎨 VendedorDashboard rendered - redirecting to VentasDashboard');

  useEffect(() => {
    // Redirect to the new comprehensive sales dashboard
    navigate('/ventas/dashboard', { replace: true });
  }, [navigate]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, flexDirection: 'column', gap: 2 }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Redirigiendo al Dashboard de Ventas...
      </Typography>
    </Box>
  );
};

export default VendedorDashboard;
