import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BusinessIcon from '@mui/icons-material/Business';

const AdminDashboard: React.FC = () => {
  console.log('🎨 AdminDashboard rendered');
  
  const [metrics] = useState({
    totalUsuarios: 45,
    totalEmpresas: 3,
    ventasMes: 1250000,
    crecimiento: 15.5,
  });

  return (
    <Box>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 3,
          color: 'error.main', // Temporary: Make it red to be obvious
          fontWeight: 'bold'
        }}
      >
        📊 Dashboard Administrativo (ADMIN/GERENTE)
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{metrics.totalUsuarios}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Usuarios Activos
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
                <BusinessIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{metrics.totalEmpresas}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Empresas
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
                <AttachMoneyIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    ${(metrics.ventasMes / 1000).toFixed(0)}K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ventas del Mes
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
                <TrendingUpIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{metrics.crecimiento}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crecimiento
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

export default AdminDashboard;
