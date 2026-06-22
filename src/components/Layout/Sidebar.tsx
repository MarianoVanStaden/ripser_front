import { useState, useEffect, useMemo, useCallback, type FC } from 'react';
import {
  Drawer,
  List,
  Toolbar,
  Divider,
  Box,
  Typography,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  AppBar,
} from '@mui/material';
import './Sidebar.css';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useSidebar } from '../../context/useSidebar';
import { useNavigation } from '../../navigation/useNavigation';
import { useNavItemsFlat, type FlatNavItem } from '../../navigation/useNavItemsFlat';
import { useFavoritos } from '../../hooks/useFavoritos';
import { useRecientes } from '../../hooks/useRecientes';
import SucursalSelector from '../Sucursal/SucursalSelector';
import { NavModuleGroup } from './NavModuleGroup';
import { SidebarQuickAccess } from './SidebarQuickAccess';
import { CommandPalette } from './CommandPalette';
import { SidebarMiniRail } from './SidebarMiniRail';
import { SIDEBAR_WIDTH_FULL, SIDEBAR_WIDTH_MINI } from './sidebarConstants';

interface SidebarProps {
  open?: boolean;
  onToggle?: () => void;
}

const Sidebar: FC<SidebarProps> = ({ open = false, onToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, esSuperAdmin, logout } = useAuth();
  const { sucursalFiltro, setSucursalFiltro, sucursales, canSelectSucursal, usuarioEmpresa, cambiarSucursal } = useTenant();
  const { isModuleOpen, toggleModule, openModule, multiOpen, setMultiOpen, mini, toggleMini } = useSidebar();
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // El modo mini sólo aplica en desktop; en mobile el drawer es temporal y full.
  const showMini = mini && !isMobile;
  const effectiveWidth = showMini ? SIDEBAR_WIDTH_MINI : SIDEBAR_WIDTH_FULL;

  // Secciones visibles para el usuario actual (filtrado por permisos + rol).
  // La lógica vive en useNavigation()/navAccess.ts; la config en navConfig.tsx.
  const seccionesFiltradas = useNavigation();
  const flatItems = useNavItemsFlat();
  const { favoritos, isFavorito, toggleFavorito } = useFavoritos();
  const { recientes, registrar } = useRecientes();

  // Índice path → ítem para resolver favoritos/recientes (guardados como paths).
  const itemsByPath = useMemo(() => {
    const map = new Map<string, FlatNavItem>();
    for (const it of flatItems) if (!map.has(it.path)) map.set(it.path, it);
    return map;
  }, [flatItems]);

  const favItems = useMemo(
    () => favoritos.map((p) => itemsByPath.get(p)).filter((x): x is FlatNavItem => Boolean(x)),
    [favoritos, itemsByPath],
  );
  const recItems = useMemo(
    () => recientes.map((p) => itemsByPath.get(p)).filter((x): x is FlatNavItem => Boolean(x)),
    [recientes, itemsByPath],
  );
  // En el sidebar no mostramos la pantalla actual dentro de "Recientes".
  const recItemsSidebar = useMemo(
    () => recItems.filter((i) => i.path !== location.pathname).slice(0, 5),
    [recItems, location.pathname],
  );

  // Ítem (módulo + path) que contiene la ruta activa: match exacto o por
  // prefijo más largo. Alimenta la auto-expansión y el registro de recientes.
  const activeMatch = useMemo(() => {
    let best: { title: string; path: string; len: number } | null = null;
    for (const section of seccionesFiltradas) {
      for (const item of section.items) {
        const match =
          location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
        if (match && (!best || item.path.length > best.len)) {
          best = { title: section.title, path: item.path, len: item.path.length };
        }
      }
    }
    return best;
  }, [seccionesFiltradas, location.pathname]);
  const activeModuleTitle = activeMatch?.title ?? null;
  const activeItemPath = activeMatch?.path ?? null;

  // Auto-expandir el módulo de la ruta activa. Depende sólo del título activo,
  // así los toggles manuales del usuario no se ven pisados al re-renderizar.
  useEffect(() => {
    if (activeModuleTitle) openModule(activeModuleTitle);
  }, [activeModuleTitle, openModule]);

  // Registrar la pantalla actual en "Recientes".
  useEffect(() => {
    if (activeItemPath) registrar(activeItemPath);
  }, [activeItemPath, registrar]);

  // Atajo global Ctrl/Cmd+K para abrir/cerrar el buscador.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogoutClick = () => {
    setOpenLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    setOpenLogoutDialog(false);
    logout();
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setOpenLogoutDialog(false);
  };

  // Estable para que NavModuleGroup (memoizado) no se re-renderice de más.
  const handleNavigation = useCallback(
    (path: string) => {
      navigate(path);
      // Close sidebar after navigation on mobile, keep open on desktop
      if (isMobile && onToggle) {
        onToggle();
      }
    },
    [navigate, isMobile, onToggle],
  );

  const drawerContent = (
    <>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap component="div" sx={{ color: '#fff' }}>
          Ripser App
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip
            title={multiOpen ? 'Un módulo abierto a la vez' : 'Permitir varios módulos abiertos'}
            placement="bottom"
            arrow
          >
            <IconButton onClick={() => setMultiOpen(!multiOpen)} sx={{ color: '#fff' }} size="small">
              {multiOpen ? <UnfoldLessIcon fontSize="small" /> : <UnfoldMoreIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          {!isMobile && (
            <Tooltip title="Colapsar a iconos" placement="bottom" arrow>
              <IconButton onClick={toggleMini} sx={{ color: '#fff' }} size="small">
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton onClick={onToggle} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

      {/* User Profile Section */}
      <Box sx={{ p: 2, bgcolor: 'rgba(0,184,169,0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: '#00B8A9',
              fontSize: '1rem',
            }}
          >
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.username || 'Usuario'}
            </Typography>
            {esSuperAdmin && (
              <Chip
                icon={<AdminPanelSettingsIcon sx={{ fontSize: '0.875rem' }} />}
                label="Super Admin"
                size="small"
                sx={{
                  mt: 0.5,
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: '#FF6B6B',
                  color: '#fff',
                  fontWeight: 700,
                  '& .MuiChip-icon': {
                    color: '#fff',
                    fontSize: '0.875rem',
                  },
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

      {/* Selector de Sucursal */}
      {(() => {
        const show = canSelectSucursal && sucursales.length > 0;
        if (!show) {
          console.log('🔍 Selector de sucursales NO mostrado:', { canSelectSucursal, sucursalesLength: sucursales.length });
        }
        return show ? (
          <>
            <Box sx={{ bgcolor: 'rgba(0,0,0,0.1)' }}>
              <SucursalSelector
                sucursales={sucursales}
                sucursalActual={sucursalFiltro}
                sucursalDefecto={usuarioEmpresa?.sucursalDefectoId ?? null}
                onChange={setSucursalFiltro}
                onChangeBackend={cambiarSucursal}
              />
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
          </>
        ) : null;
      })()}

      {/* Scrollable menu section */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <SidebarQuickAccess
          onOpenPalette={() => setPaletteOpen(true)}
          favItems={favItems}
          recItems={recItemsSidebar}
          activePath={location.pathname}
          onNavigate={handleNavigation}
        />
        <List>
          {seccionesFiltradas.map((section, idx) => (
            <NavModuleGroup
              key={section.title}
              title={section.title}
              items={section.items}
              open={isModuleOpen(section.title)}
              showDivider={idx > 0}
              activePath={location.pathname}
              onToggle={toggleModule}
              onNavigate={handleNavigation}
            />
          ))}
        </List>
      </Box>

      {/* Fixed bottom section with logout button */}
      <Box
        sx={{
          position: 'relative',
          height: 56,
          overflow: 'hidden',
          '&:hover .logout-button': {
            transform: 'translateY(0)',
            opacity: 1,
          },
        }}
      >
        <Tooltip title="Cerrar sesión" placement="top" arrow>
          <IconButton
            className="logout-button"
            onClick={handleLogoutClick}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '100%',
              borderRadius: 0,
              bgcolor: 'rgba(244, 67, 54, 0.08)',
              color: '#f44336',
              transform: isMobile ? 'translateY(0)' : 'translateY(100%)',
              opacity: isMobile ? 1 : 0,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: 'rgba(244, 67, 54, 0.15)',
              },
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Copyright */}
      <Box p={2} pt={1}>
        <Typography variant="caption" color="#aaa">
          © {new Date().getFullYear()} Ripser
        </Typography>
      </Box>
    </>
  );

  // Contenido compacto (modo mini): expandir + rail de iconos + logout.
  const miniContent = (
    <>
      <Toolbar sx={{ justifyContent: 'center', px: 0 }}>
        <Tooltip title="Expandir menú" placement="right" arrow>
          <IconButton onClick={toggleMini} sx={{ color: '#fff' }}>
            <ChevronRightIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <SidebarMiniRail
          secciones={seccionesFiltradas}
          activePath={location.pathname}
          onNavigate={handleNavigation}
          onOpenPalette={() => setPaletteOpen(true)}
        />
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <Tooltip title="Cerrar sesión" placement="right" arrow>
          <IconButton onClick={handleLogoutClick} sx={{ color: '#f44336' }}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );

  return (
    <>
      {/* AppBar with hamburger menu - visible on all devices */}
      <AppBar
        position="fixed"
        sx={{
          bgcolor: '#212A3E',
          boxShadow: 1,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menu"
            edge="start"
            onClick={onToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Ripser
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Collapsible Drawer - same behavior on all devices */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={open}
        onClose={onToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          width: open ? effectiveWidth : 0,
          flexShrink: 0,
          transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1)',
          '& .MuiDrawer-paper': {
            width: effectiveWidth,
            boxSizing: 'border-box',
            background: '#212A3E',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
            transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1)',
            top: { xs: 0, md: '64px' }, // Below AppBar on desktop
            height: { xs: '100%', md: 'calc(100% - 64px)' },
          },
        }}
      >
        {showMini ? miniContent : drawerContent}
      </Drawer>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={openLogoutDialog}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: isMobile ? 'auto' : 400,
            mx: 2,
          },
        }}
      >
        <DialogTitle id="logout-dialog-title" sx={{ pb: 1 }}>
          Confirmar cierre de sesión
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            ¿Está seguro que desea cerrar sesión?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleLogoutCancel}
            color="inherit"
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            color="error"
            variant="contained"
            autoFocus
          >
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>

      {/* Buscador rápido de pantallas (Ctrl/Cmd+K) */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={flatItems}
        favItems={favItems}
        recItems={recItems}
        isFavorito={isFavorito}
        toggleFavorito={toggleFavorito}
        onNavigate={handleNavigation}
      />
    </>
  );
};

export default Sidebar;
