import React from 'react';
import { Button, Stack } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Stack spacing={2} direction="column">
      <Button
        variant="contained"
        color="primary"
        startIcon={<PeopleIcon />}
        onClick={() => navigate('/clientes/gestion')}
        fullWidth
      >
        Nuevo Cliente
      </Button>
      <Button
        variant="contained"
        color="success"
        startIcon={<InventoryIcon />}
        onClick={() => navigate('/logistica/stock')}
        fullWidth
      >
        Nuevo Producto
      </Button>
      <Button
        variant="contained"
        color="secondary"
        startIcon={<TrendingUpIcon />}
        onClick={() => navigate('/ventas/registro')}
        fullWidth
      >
        Nueva Venta
      </Button>
    </Stack>
  );
};

export default QuickActions;
