import React, { useState } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';

const VendedorDashboard: React.FC = () => {
  const [metrics] = useState({
    presupuestosPendientes: 12,
    ventasMes: 350000,
    comision: 15500,
    clientesNuevos: 5,
  });

  // Debug log
  console.log('🎨 VendedorDashboard rendered');

  return (
    <Box>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 3,
          color: 'primary.main',
          fontWeight: 'bold'
        }}
      >
        🎯 Mi Dashboard de Ventas
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AssignmentIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{metrics.presupuestosPendientes}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Presupuestos Pendientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AttachMoneyIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    ${(metrics.ventasMes / 1000).toFixed(0)}K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mis Ventas del Mes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUpIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    ${(metrics.comision / 1000).toFixed(1)}K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comisión Estimada
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PeopleIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{metrics.clientesNuevos}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clientes Nuevos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VendedorDashboard;
