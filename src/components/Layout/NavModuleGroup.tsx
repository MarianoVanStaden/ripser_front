import { memo } from 'react';
import {
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { NavItem } from '../../navigation/navConfig.types';
import { prefetch } from '../../utils/prefetch';

// Prefetch registry for high-traffic routes. Populate on measurement, not
// intuition: only routes that > ~30% of sessions visit belong here.
// Adding too many wastes bandwidth and can stampede the backend on hover.
const ROUTE_PREFETCH: Record<string, () => Promise<unknown>> = {
  '/': () => import('../Dashboard/Dashboard'),
  '/ventas/dashboard':   () => import('../../pages/ventas/VentasDashboard'),
  '/ventas/facturacion': () => import('../Ventas/FacturacionPage'),
  '/clientes/gestion':   () => import('../Clientes/ClientesPage'),
  '/prestamos/resumen':  () => import('../Prestamos/PrestamosResumenPage'),
  '/cobranzas/resumen':  () => import('../Prestamos/Cobranzas/CobranzasResumenPage'),
};

interface NavModuleGroupProps {
  title: string;
  items: NavItem[];
  /** Si el módulo está expandido. */
  open: boolean;
  /** Pinta un divisor arriba (todas las secciones salvo la primera). */
  showDivider: boolean;
  /** Ruta activa para resaltar el ítem actual. */
  activePath: string;
  onToggle: (title: string) => void;
  onNavigate: (path: string) => void;
}

/**
 * Un módulo del sidebar: cabecera clickeable (expande/colapsa) + lista de
 * ítems dentro de un Collapse. Memoizado: al alternar OTRO módulo, sus props
 * (title/items/open/activePath) no cambian y este grupo no se re-renderiza.
 * Los ítems sólo se montan cuando el módulo está abierto (unmountOnExit).
 */
function NavModuleGroupBase({
  title,
  items,
  open,
  showDivider,
  activePath,
  onToggle,
  onNavigate,
}: NavModuleGroupProps) {
  return (
    <>
      {showDivider && <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />}
      <ListSubheader
        disableSticky
        onClick={() => onToggle(title)}
        sx={{
          bgcolor: 'inherit',
          color: '#00B8A9',
          fontWeight: 700,
          fontSize: 13,
          pl: 2,
          pr: 1,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { background: 'rgba(0,184,169,0.08)' },
        }}
      >
        {title}
        {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </ListSubheader>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding>
          {items.map((item) => {
            const selected = activePath === item.path;
            const prefetcher = ROUTE_PREFETCH[item.path] ? prefetch(ROUTE_PREFETCH[item.path]) : undefined;
            return (
              <ListItem
                key={item.text}
                disablePadding
                sx={{
                  background: selected ? 'rgba(0,184,169,0.08)' : 'inherit',
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <ListItemButton
                  onClick={() => onNavigate(item.path)}
                  onMouseEnter={prefetcher}
                  onFocus={prefetcher}
                  selected={selected}
                  sx={{
                    color: selected ? '#00B8A9' : '#fff',
                    '&:hover': { background: 'rgba(0,184,169,0.15)' },
                    borderRadius: 1,
                    minHeight: 48, // Touch-friendly height for mobile
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </>
  );
}

export const NavModuleGroup = memo(NavModuleGroupBase);
