import { useEffect, useRef, useState, type MouseEvent } from 'react';
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { NavModule } from '../../navigation/navConfig.types';

interface SidebarMiniRailProps {
  secciones: NavModule[];
  activePath: string;
  onNavigate: (path: string) => void;
  onOpenPalette: () => void;
}

/**
 * Rail compacto de iconos (modo mini). Cada módulo se representa con el icono
 * de su primer ítem; al pasar el mouse se despliega un flyout con la lista de
 * pantallas. El cierre tiene una pequeña gracia temporal para poder cruzar el
 * hueco entre el icono y el flyout sin que se cierre.
 */
export function SidebarMiniRail({ secciones, activePath, onNavigate, onOpenPalette }: SidebarMiniRailProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [active, setActive] = useState<NavModule | null>(null);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setAnchorEl(null);
      setActive(null);
    }, 150);
  };
  const openFor = (e: MouseEvent<HTMLElement>, section: NavModule) => {
    cancelClose();
    setAnchorEl(e.currentTarget);
    setActive(section);
  };
  const closeNow = () => {
    cancelClose();
    setAnchorEl(null);
    setActive(null);
  };

  useEffect(() => cancelClose, []);

  const isModuleActive = (s: NavModule) =>
    s.items.some((i) => activePath === i.path || activePath.startsWith(`${i.path}/`));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1, gap: 0.5 }}>
      <Tooltip title="Buscar (Ctrl+K)" placement="right" arrow>
        <IconButton onClick={onOpenPalette} sx={{ color: 'rgba(255,255,255,0.8)' }}>
          <SearchIcon />
        </IconButton>
      </Tooltip>
      <Divider flexItem sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 0.5, width: '60%', alignSelf: 'center' }} />

      {secciones.map((section) => {
        const activeMod = isModuleActive(section);
        return (
          <Tooltip key={section.title} title={section.title} placement="right" arrow>
            <IconButton
              onMouseEnter={(e) => openFor(e, section)}
              onMouseLeave={scheduleClose}
              onClick={(e) => openFor(e, section)}
              sx={{
                color: activeMod ? '#00B8A9' : '#fff',
                bgcolor: activeMod ? 'rgba(0,184,169,0.12)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(0,184,169,0.15)' },
              }}
            >
              {section.items[0]?.icon}
            </IconButton>
          </Tooltip>
        );
      })}

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closeNow}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        // pointerEvents:none deja que el rail siga siendo "hovereable" con el
        // flyout abierto; el Paper rehabilita los eventos para poder usarlo.
        sx={{ pointerEvents: 'none' }}
        slotProps={{
          paper: {
            onMouseEnter: cancelClose,
            onMouseLeave: scheduleClose,
            sx: {
              pointerEvents: 'auto',
              bgcolor: '#212A3E',
              color: '#fff',
              minWidth: 220,
              ml: 0.5,
            },
          },
        }}
        disableRestoreFocus
      >
        {active && (
          <Box>
            <Typography sx={{ px: 2, py: 1, color: '#00B8A9', fontWeight: 700, fontSize: 13 }}>
              {active.title}
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
            <List dense>
              {active.items.map((item) => {
                const selected = activePath === item.path;
                return (
                  <ListItemButton
                    key={item.text}
                    selected={selected}
                    onClick={() => {
                      onNavigate(item.path);
                      closeNow();
                    }}
                    sx={{
                      color: selected ? '#00B8A9' : '#fff',
                      '&:hover': { background: 'rgba(0,184,169,0.15)' },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 13 }} />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        )}
      </Popover>
    </Box>
  );
}
