import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Fade,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import WorkIcon from '@mui/icons-material/Work';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import GroupIcon from '@mui/icons-material/Group';
import ReceiptIcon from '@mui/icons-material/Receipt';
import StoreIcon from '@mui/icons-material/Store';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PersonIcon from '@mui/icons-material/Person';

interface CommandOption {
  label: string;
  icon: React.ReactNode;
  path: string;
  category: string;
}

const COMMANDS: CommandOption[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/', category: 'Navegación' },
  { label: 'Gestión Clientes', icon: <PeopleIcon />, path: '/clientes/gestion', category: 'Clientes' },
  { label: 'Carpeta Cliente', icon: <AssignmentIcon />, path: '/clientes/carpeta', category: 'Clientes' },
  { label: 'Agenda Visitas', icon: <EventIcon />, path: '/clientes/agenda', category: 'Clientes' },
  { label: 'Registro Ventas', icon: <ShoppingCartIcon />, path: '/ventas/registro', category: 'Ventas' },
  { label: 'Compras y Pedidos', icon: <StoreIcon />, path: '/proveedores/compras', category: 'Proveedores' },
  { label: 'Inventario', icon: <InventoryIcon />, path: '/logistica/inventario', category: 'Logística' },
  { label: 'Stock de Equipos', icon: <InventoryIcon />, path: '/logistica/stock-equipos', category: 'Logística' },
  { label: 'Tareas de Recuento', icon: <AssignmentIcon />, path: '/logistica/recuentos', category: 'Logística' },
  { label: 'Órdenes de Servicio', icon: <WorkIcon />, path: '/taller/ordenes', category: 'Taller' },
  { label: 'Entregas y Viajes', icon: <LocalShippingIcon />, path: '/logistica/trips', category: 'Logística' },
  { label: 'Empleados', icon: <GroupIcon />, path: '/rrhh/empleados', category: 'RRHH' },
  { label: 'Facturación', icon: <ReceiptIcon />, path: '/ventas/facturacion', category: 'Ventas' },
  { label: 'Evaluación Proveedores', icon: <AssignmentTurnedInIcon />, path: '/proveedores/evaluacion', category: 'Proveedores' },
  { label: 'Capacitaciones', icon: <PersonIcon />, path: '/rrhh/capacitaciones', category: 'RRHH' },
  { label: 'Ajustes', icon: <SettingsIcon />, path: '/admin/settings', category: 'Configuración' },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [open]);

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (cmd: CommandOption) => {
    navigate(cmd.path);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 8,
          bgcolor: 'background.paper',
          p: 0,
        },
        'aria-label': 'Paleta de Comandos',
      }}
      TransitionComponent={Fade}
    >
      <DialogContent sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <SearchIcon color="primary" />
          <TextField
            inputRef={inputRef}
            fullWidth
            placeholder="Buscar comando o página…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            size="small"
            variant="outlined"
            InputProps={{
              sx: { bgcolor: 'background.default', borderRadius: 2 },
              'aria-label': 'Buscar comando',
            }}
            autoFocus
          />
          <IconButton onClick={onClose} aria-label="Cerrar">
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {filtered.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
              No se encontraron comandos.
            </Typography>
          )}
          {filtered.map(cmd => (
            <ListItem key={cmd.label} disablePadding>
              <ListItemButton onClick={() => handleSelect(cmd)} tabIndex={0}>
                <ListItemIcon>{cmd.icon}</ListItemIcon>
                <ListItemText
                  primary={cmd.label}
                  secondary={cmd.category}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;

