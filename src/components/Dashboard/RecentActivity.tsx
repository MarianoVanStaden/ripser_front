import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, Avatar, Typography, CircularProgress, Tooltip, Box, Chip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BuildIcon from '@mui/icons-material/Build';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WarningIcon from '@mui/icons-material/Warning';
import { clientApi, productApi, saleApi } from '../../api/services';

import dayjs from 'dayjs';
import 'dayjs/locale/es';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Cliente, Product, Sale } from '../../types';

dayjs.extend(relativeTime);
dayjs.locale('es');

type ActivityType = 'client' | 'product' | 'sale' | 'purchase' | 'equipment' | 'payment' | 'alert';

interface ActivityItem {
  id: number;
  type: ActivityType;
  title: string;
  subtitle: string;
  date: string;
  details?: string;
  avatarText?: string;
  avatarColor?: string;
  link?: string;
  icon?: React.ReactElement;
  priority?: 'low' | 'medium' | 'high';
}

const avatarColors = {
  client: '#1976d2',
  product: '#388e3c',
  sale: '#7b1fa2',
  purchase: '#f57c00',
  equipment: '#0288d1',
  payment: '#388e3c',
  alert: '#d32f2f',
};

const getTypeLabel = (type: ActivityType): string => {
  const labels: Record<ActivityType, string> = {
    client: 'Cliente',
    product: 'Producto',
    sale: 'Venta',
    purchase: 'Compra',
    equipment: 'Equipo',
    payment: 'Pago',
    alert: 'Alerta',
  };
  return labels[type] || type;
};

export const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoading(true);
      try {
        // Fetch latest clients, products, and sales
        const [clients, products, sales] = await Promise.all([
          clientApi.getAll(),
          productApi.getAll(),
          saleApi.getAll(),
        ]);

        // Recent clients (last 3)
        const recentClients = clients
          .slice(-3)
          .reverse()
          .map((c: any) => ({
            id: c.id,
            type: 'client' as ActivityType,
            title: `${c.nombre || ''} ${c.apellido || ''}`.trim() || 'Cliente',
            subtitle: 'Cliente registrado',
            date: c.fechaAlta || c.createdAt || new Date().toISOString(),
            details: c.email || c.telefono ? `${c.email || ''} ${c.telefono || ''}`.trim() : undefined,
            avatarText: (c.nombre?.[0] || 'C').toUpperCase(),
            avatarColor: avatarColors.client,
            icon: <PeopleIcon fontSize="small" />,
          }));

        // Recent products (last 3)
        const recentProducts = products
          .slice(-3)
          .reverse()
          .map((p: any) => ({
            id: p.id,
            type: 'product' as ActivityType,
            title: p.nombre || 'Producto',
            subtitle: 'Producto agregado',
            date: p.fechaAlta || p.createdAt || new Date().toISOString(),
            details: `Stock: ${p.stockActual || 0} | $${(p.precio || 0).toLocaleString()}`,
            avatarText: (p.nombre?.[0] || 'P').toUpperCase(),
            avatarColor: avatarColors.product,
            icon: <InventoryIcon fontSize="small" />,
          }));

        // Recent sales (last 5)
        const recentSales = sales
          .slice(-5)
          .reverse()
          .map((s: any) => ({
            id: s.id,
            type: 'sale' as ActivityType,
            title: `Venta ${s.numeroDocumento || s.id}`,
            subtitle: `Cliente: ${s.clienteNombre || 'N/A'}`,
            date: s.fechaEmision || s.fechaVenta || new Date().toISOString(),
            details: `Total: $${(s.total || 0).toLocaleString()} | ${s.estado || 'Completado'}`,
            avatarText: '$',
            avatarColor: avatarColors.sale,
            icon: <TrendingUpIcon fontSize="small" />,
          }));

        // Low stock alerts
        const lowStockAlerts = products
          .filter((p: any) => p.stockActual <= (p.stockMinimo || 5) && p.stockActual > 0)
          .slice(0, 3)
          .map((p: any) => ({
            id: p.id,
            type: 'alert' as ActivityType,
            title: `Stock bajo: ${p.nombre}`,
            subtitle: 'Alerta de inventario',
            date: new Date().toISOString(),
            details: `Stock actual: ${p.stockActual} | Mínimo: ${p.stockMinimo || 5}`,
            avatarText: '!',
            avatarColor: avatarColors.alert,
            icon: <WarningIcon fontSize="small" />,
            priority: 'high' as const,
          }));

        // Combine and sort by date desc, prioritizing alerts
        const all = [...lowStockAlerts, ...recentSales, ...recentClients, ...recentProducts]
          .filter(a => a.date)
          .sort((a, b) => {
            // Alerts always first
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });

        setActivities(all.slice(0, 10));
      } catch (err) {
        console.error('Error fetching activities:', err);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  if (loading) return <CircularProgress size={24} sx={{ mt: 2 }} />;
  if (!activities.length) return <Typography variant="body2" color="text.secondary">No recent activity</Typography>;

  return (
    <List dense>
      {activities.map((a, index) => (
        <ListItem
          key={`${a.type}-${a.id}-${index}`}
          alignItems="flex-start"
          sx={{
            gap: 1.5,
            py: 1.5,
            px: 2,
            borderRadius: 1,
            mb: 0.5,
            '&:hover': {
              bgcolor: 'action.hover',
            },
            bgcolor: a.priority === 'high' ? 'error.lighter' : 'transparent',
          }}
        >
          <Avatar
            sx={{
              bgcolor: a.avatarColor,
              width: 36,
              height: 36,
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            {a.avatarText}
          </Avatar>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" fontWeight="600" sx={{ flex: 1 }}>
                  {a.title}
                </Typography>
                <Chip
                  label={getTypeLabel(a.type)}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: a.avatarColor,
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
              </Box>
            }
            secondary={
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {a.subtitle}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  {a.icon}
                  {dayjs(a.date).fromNow()}
                </Typography>
                {a.details && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}>
                    {a.details}
                  </Typography>
                )}
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default RecentActivity;
