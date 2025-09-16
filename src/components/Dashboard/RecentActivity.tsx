import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, Avatar, Typography, CircularProgress, Tooltip, Box } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { clientApi, productApi, saleApi } from '../../api/services';


// Removed unused icons

import dayjs from 'dayjs';
import type { Cliente, Product, Sale } from '../../types';

type ActivityType = 'client' | 'product' | 'sale';

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
}



// iconMap is not used anymore

const avatarColors = {
  client: '#1976d2',
  product: '#388e3c',
  sale: '#7b1fa2',
};

export const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoading(true);
      try {
        // Fetch latest 3 clients, products, and sales
        const [clients, products, sales] = await Promise.all([
          clientApi.getAll(),
          productApi.getAll(),
          saleApi.getAll(),
        ]);
        const recentClients = clients.slice(-3).map((c: any) => ({
          id: c.id,
          type: 'client' as ActivityType,
          title: c.nombre || c.name || '',
          subtitle: 'Nuevo cliente',
          date: c.fechaAlta || c.createdAt || '',
          details: c.email ? `Email: ${c.email}` : c.phone ? `Tel: ${c.phone}` : c.telefono ? `Tel: ${c.telefono}` : '',
          avatarText: (c.nombre?.[0] || c.name?.[0] || 'C').toUpperCase(),
          avatarColor: avatarColors.client,
          icon: <PeopleIcon />,
        }));
        const recentProducts = products.slice(-3).map((p: any) => ({
          id: p.id,
          type: 'product' as ActivityType,
          title: p.nombre || p.name || '',
          subtitle: 'Nuevo producto',
          date: p.fechaAlta || p.createdAt || '',
          details: p.categoria?.nombre ? `Categoría: ${p.categoria.nombre}` : p.category?.name ? `Categoría: ${p.category.name}` : `Stock: ${p.stock}`,
          avatarText: (p.nombre?.[0] || p.name?.[0] || 'P').toUpperCase(),
          avatarColor: avatarColors.product,
          icon: <InventoryIcon />,
        }));
        const recentSales = sales.slice(-3).map((s: Sale) => ({
          id: s.id,
          type: 'sale' as ActivityType,
          title: s.saleNumber || 'Venta',
          subtitle: 'Nueva venta',
          date: s.saleDate,
          details: s.totalAmount ? `Total: $${s.totalAmount}` : s.total ? `Total: $${s.total}` : '',
          avatarText: '#',
          avatarColor: avatarColors.sale,
          icon: <TrendingUpIcon />,
        }));
        // Combine and sort by date desc
        const all = [...recentClients, ...recentProducts, ...recentSales].filter(a => a.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActivities(all.slice(0, 7));
      } catch (err) {
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
      {activities.map((a) => (
        <ListItem key={a.type + a.id} alignItems="flex-start" sx={{ gap: 1 }}>
          <Avatar sx={{ bgcolor: a.avatarColor, mr: 2, width: 40, height: 40, fontWeight: 'bold' }}>
            {a.avatarText}
          </Avatar>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={a.subtitle} arrow>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {a.title}
                  </Typography>
                </Tooltip>
                {a.icon}
              </Box>
            }
            secondary={
              <>
                <Typography variant="caption" color="text.secondary">
                  {a.subtitle} &mdash; {dayjs(a.date).format('DD/MM/YYYY HH:mm')}
                </Typography>
                {a.details && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
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
