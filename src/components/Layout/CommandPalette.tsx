import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import {
  Dialog,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import type { FlatNavItem } from '../../navigation/useNavItemsFlat';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  /** Todas las pantallas permitidas (para la búsqueda). */
  items: FlatNavItem[];
  /** Favoritos resueltos (sugerencias cuando la búsqueda está vacía). */
  favItems: FlatNavItem[];
  /** Recientes resueltos (sugerencias cuando la búsqueda está vacía). */
  recItems: FlatNavItem[];
  isFavorito: (path: string) => boolean;
  toggleFavorito: (path: string) => void;
  onNavigate: (path: string) => void;
}

/**
 * Buscador rápido de pantallas (Ctrl/Cmd+K). Trabaja sobre el árbol ya
 * filtrado por permisos, así que nunca ofrece pantallas fuera del rol.
 * Con la búsqueda vacía sugiere Favoritos + Recientes.
 */
export function CommandPalette({
  open,
  onClose,
  items,
  favItems,
  recItems,
  isFavorito,
  toggleFavorito,
  onNavigate,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  // Reset al abrir.
  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlight(0);
    }
  }, [open]);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) {
      const seen = new Set<string>();
      const merged: FlatNavItem[] = [];
      for (const it of [...favItems, ...recItems]) {
        if (!seen.has(it.path)) {
          seen.add(it.path);
          merged.push(it);
        }
      }
      return merged;
    }
    return items
      .filter((i) => i.text.toLowerCase().includes(q) || i.moduleTitle.toLowerCase().includes(q))
      .sort((a, b) => {
        // Los que empiezan con el término van primero.
        const aw = a.text.toLowerCase().startsWith(q) ? 0 : 1;
        const bw = b.text.toLowerCase().startsWith(q) ? 0 : 1;
        return aw - bw;
      });
  }, [q, items, favItems, recItems]);

  useEffect(() => {
    setHighlight(0);
  }, [q]);

  const go = (path?: string) => {
    const target = path ?? results[highlight]?.path;
    if (!target) return;
    onNavigate(target);
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const emptyLabel = q ? 'Sin resultados' : 'Buscá una pantalla por nombre o módulo';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-start' } }}
      PaperProps={{ sx: { mt: '10vh', borderRadius: 2 } }}
    >
      <Box sx={{ p: 1.5 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Buscar pantalla…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <List dense sx={{ maxHeight: '50vh', overflowY: 'auto', pt: 0 }}>
        {results.length === 0 && (
          <Typography sx={{ px: 3, py: 2 }} variant="body2" color="text.secondary">
            {emptyLabel}
          </Typography>
        )}
        {results.map((item, idx) => {
          const fav = isFavorito(item.path);
          return (
            <ListItem
              key={`${item.path}-${item.moduleTitle}`}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  size="small"
                  aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorito(item.path);
                  }}
                  sx={{ color: fav ? '#F4B400' : 'action.disabled' }}
                >
                  {fav ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                </IconButton>
              }
            >
              <ListItemButton
                selected={idx === highlight}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => go(item.path)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} secondary={item.moduleTitle} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          ↑↓ navegar · ↵ ir · esc cerrar
        </Typography>
      </Box>
    </Dialog>
  );
}
