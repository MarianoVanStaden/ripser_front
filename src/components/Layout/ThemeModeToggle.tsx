import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

// Colores del browser chrome (meta theme-color) por esquema resuelto.
// Deben coincidir con el script inline anti-FOUC de index.html.
const THEME_COLOR = { light: '#1976d2', dark: '#1e1e1e' } as const;

const MODES = [
  { value: 'light', label: 'Claro', Icon: LightModeIcon },
  { value: 'dark', label: 'Oscuro', Icon: DarkModeIcon },
  { value: 'system', label: 'Sistema', Icon: SettingsBrightnessIcon },
] as const;

type Mode = (typeof MODES)[number]['value'];

/**
 * Three-state color scheme toggle (light / dark / system). MUI persists the
 * choice in localStorage ('mui-mode') and flips the data attribute on <html>
 * without re-rendering the tree (CSS variables mode).
 */
const ThemeModeToggle = () => {
  const { mode, setMode, systemMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const resolved = (mode === 'system' ? systemMode : mode) ?? 'light';

  // Sincroniza la barra del navegador / PWA con el esquema activo.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[resolved]);
  }, [resolved]);

  const open = (e: MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const close = () => setAnchorEl(null);
  const pick = (value: Mode) => {
    setMode(value);
    close();
  };

  const CurrentIcon = resolved === 'dark' ? DarkModeIcon : LightModeIcon;

  return (
    <>
      <Tooltip title="Tema">
        <IconButton color="inherit" onClick={open} aria-label="cambiar tema">
          <CurrentIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}>
        {MODES.map(({ value, label, Icon }) => (
          <MenuItem
            key={value}
            selected={mode === value}
            onClick={() => pick(value)}
          >
            <ListItemIcon>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ThemeModeToggle;
