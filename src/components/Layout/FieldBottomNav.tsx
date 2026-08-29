import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  Home as HomeIcon,
  LocalShipping as DeliveryIcon,
  Map as TripsIcon,
  ReportProblem as IncidenciaIcon,
  VerifiedUser as GarantiaIcon,
  Build as ReclamoIcon,
  WhatsApp as ComunicacionIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TRANSPORTE_ROLES, useHasFieldNav } from './useHasFieldNav';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
}

const TRANSPORTE_ITEMS: NavItem[] = [
  { label: 'Inicio', path: '/dashboard', icon: <HomeIcon /> },
  { label: 'Entregas', path: '/logistica/distribucion/entregas-productos', icon: <DeliveryIcon /> },
  { label: 'Viajes', path: '/logistica/distribucion/viajes', icon: <TripsIcon /> },
  { label: 'Incidencias', path: '/logistica/vehiculos/incidencias', icon: <IncidenciaIcon /> },
];

const POSTVENTA_ITEMS: NavItem[] = [
  { label: 'Inicio', path: '/dashboard', icon: <HomeIcon /> },
  { label: 'Garantías', path: '/garantias/registro', icon: <GarantiaIcon /> },
  { label: 'Reclamos', path: '/garantias/reclamos', icon: <ReclamoIcon /> },
  { label: 'Comunic.', path: '/postventa/comunicaciones-iniciales', icon: <ComunicacionIcon /> },
];

const itemsForRoles = (roles: string[]): NavItem[] | null => {
  if (roles.some((r) => TRANSPORTE_ROLES.includes(r))) return TRANSPORTE_ITEMS;
  if (roles.includes('POST_VENTA')) return POSTVENTA_ITEMS;
  return null;
};

/**
 * Bottom navigation solo para roles de campo (transporte / post-venta) en
 * viewport mobile: las acciones primarias quedan en la thumb zone en vez de
 * depender del hamburguesa arriba a la izquierda. El resto de los roles
 * sigue navegando solo por el drawer.
 */
const FieldBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const show = useHasFieldNav();

  if (!show) return null;
  const items = itemsForRoles(user?.roles ?? []);
  if (!items) return null;

  // Match por prefijo: /garantias/registro?x=1 y subrutas siguen marcando el tab.
  const current = items.findIndex(
    (it) => location.pathname === it.path || location.pathname.startsWith(`${it.path}/`),
  );

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        showLabels
        value={current === -1 ? false : current}
        onChange={(_e, newValue: number) => navigate(items[newValue].path)}
      >
        {items.map((it) => (
          <BottomNavigationAction key={it.path} label={it.label} icon={it.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default FieldBottomNav;
