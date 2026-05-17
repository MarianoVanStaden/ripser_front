import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import {
  Category as CategoryIcon,
  Factory as FactoryIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material';
import CategoriasSalarialesTab from './CategoriasSalarialesTab';
import BonosUmbralTab from './BonosUmbralTab';

const ConfigSueldosPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Typography variant="h4" fontWeight={700} color="primary" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
        Configuración de Sueldos
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={3}>
        Categorías salariales y tablas de bonos por producción / ventas usadas por la calculadora de sueldos.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<CategoryIcon />} iconPosition="start" label="Categorías" />
          <Tab icon={<FactoryIcon />} iconPosition="start" label="Bonos Producción" />
          <Tab icon={<StorefrontIcon />} iconPosition="start" label="Bonos Ventas" />
        </Tabs>
      </Paper>

      {tab === 0 && <CategoriasSalarialesTab />}
      {tab === 1 && <BonosUmbralTab variant="PRODUCCION" />}
      {tab === 2 && <BonosUmbralTab variant="VENTAS" />}
    </Box>
  );
};

export default ConfigSueldosPage;
