import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import HistoryIcon from '@mui/icons-material/History';
import type { FlatNavItem } from '../../navigation/useNavItemsFlat';

interface SidebarQuickAccessProps {
  onOpenPalette: () => void;
  favItems: FlatNavItem[];
  recItems: FlatNavItem[];
  activePath: string;
  onNavigate: (path: string) => void;
}

const subheaderSx = {
  bgcolor: 'inherit',
  color: '#00B8A9',
  fontWeight: 700,
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  pl: 2,
  py: 0.5,
} as const;

/**
 * Accesos rápidos en la cabecera del menú: botón del buscador (Ctrl/Cmd+K) +
 * secciones de Favoritos y Recientes (sólo si tienen contenido). Las filas son
 * enlaces directos; el alta/baja de favoritos se hace desde el Command Palette.
 */
export function SidebarQuickAccess({
  onOpenPalette,
  favItems,
  recItems,
  activePath,
  onNavigate,
}: SidebarQuickAccessProps) {
  const renderRows = (rows: FlatNavItem[]) =>
    rows.map((item) => {
      const selected = activePath === item.path;
      return (
        <ListItem key={`${item.path}-${item.moduleTitle}`} disablePadding sx={{ mb: 0.25 }}>
          <ListItemButton
            selected={selected}
            onClick={() => onNavigate(item.path)}
            sx={{
              color: selected ? '#00B8A9' : '#fff',
              borderRadius: 1,
              py: 0.5,
              '&:hover': { background: 'rgba(0,184,169,0.15)' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} primaryTypographyProps={{ noWrap: true, fontSize: 13 }} />
          </ListItemButton>
        </ListItem>
      );
    });

  const hasQuickLists = favItems.length > 0 || recItems.length > 0;

  return (
    <Box>
      <Box sx={{ px: 2, py: 1 }}>
        <Button
          fullWidth
          onClick={onOpenPalette}
          startIcon={<SearchIcon />}
          size="small"
          sx={{
            justifyContent: 'flex-start',
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'none',
            bgcolor: 'rgba(255,255,255,0.06)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
          }}
        >
          Buscar…  (Ctrl K)
        </Button>
      </Box>

      {favItems.length > 0 && (
        <List dense disablePadding>
          <ListSubheader disableSticky sx={subheaderSx}>
            <StarIcon sx={{ fontSize: 14, mr: 0.5 }} /> FAVORITOS
          </ListSubheader>
          {renderRows(favItems)}
        </List>
      )}

      {recItems.length > 0 && (
        <List dense disablePadding>
          <ListSubheader disableSticky sx={subheaderSx}>
            <HistoryIcon sx={{ fontSize: 14, mr: 0.5 }} /> RECIENTES
          </ListSubheader>
          {renderRows(recItems)}
        </List>
      )}

      {hasQuickLists && <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />}
    </Box>
  );
}
