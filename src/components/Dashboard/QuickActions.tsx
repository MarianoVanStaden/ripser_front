import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  label: string;
  icon: React.ReactElement;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  path: string;
  description?: string;
}

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      label: 'Nueva Venta',
      icon: <TrendingUpIcon />,
      color: 'primary',
      path: '/ventas/registro',
      description: 'Registrar venta',
    },
    {
      label: 'Nuevo Cliente',
      icon: <PeopleIcon />,
      color: 'info',
      path: '/clientes/gestion',
      description: 'Agregar cliente',
    },
    {
      label: 'Presupuesto',
      icon: <DescriptionIcon />,
      color: 'secondary',
      path: '/ventas/presupuestos',
      description: 'Crear presupuesto',
    },
    {
      label: 'Stock',
      icon: <InventoryIcon />,
      color: 'success',
      path: '/logistica/stock',
      description: 'Gestionar stock',
    },
    {
      label: 'Orden Compra',
      icon: <ShoppingCartIcon />,
      color: 'warning',
      path: '/proveedores/compras-pedidos',
      description: 'Nueva orden',
    },
    {
      label: 'Fabricación',
      icon: <BuildIcon />,
      color: 'info',
      path: '/fabricacion/ordenes',
      description: 'Nueva orden',
    },
    {
      label: 'Informes',
      icon: <AssessmentIcon />,
      color: 'primary',
      path: '/ventas/informes',
      description: 'Ver reportes',
    },
    {
      label: 'Cuenta Corriente',
      icon: <AccountBalanceIcon />,
      color: 'success',
      path: '/clientes/cuenta-corriente',
      description: 'Ver cuentas',
    },
  ];

  return (
    <Grid container spacing={1.5}>
      {actions.map((action, index) => (
        <Grid item xs={6} key={index}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                borderColor: `${action.color}.main`,
                bgcolor: `${action.color}.lighter`,
              },
            }}
            onClick={() => navigate(action.path)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  p: 0.75,
                  borderRadius: 1,
                  bgcolor: `${action.color}.main`,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {React.cloneElement(action.icon as React.ReactElement<any>, { fontSize: 'small' })}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" fontWeight="600" sx={{ display: 'block' }}>
                  {action.label}
                </Typography>
                {action.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {action.description}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default QuickActions;
