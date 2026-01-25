import React, { useState } from 'react';
import { Grid, Typography, Box, Card, CardContent } from '@mui/material';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

const ProduccionDashboard: React.FC = () => {
  const [metrics] = useState({
    ordenesActivas: 8,
    equiposPendientes: 15,
    equiposCompletados: 42,
    materialesBajos: 3,
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard de Producción
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PrecisionManufacturingIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{metrics.ordenesActivas}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Órdenes Activas
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
                <HourglassEmptyIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{metrics.equiposPendientes}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Equipos Pendientes
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
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{metrics.equiposCompletados}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completados (Mes)
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
                <WarningIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{metrics.materialesBajos}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Materiales Bajos
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

export default ProduccionDashboard;
