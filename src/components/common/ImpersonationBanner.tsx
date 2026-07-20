import { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { exitImpersonation, getImpersonationInfo } from '../../utils/impersonation';

/**
 * Banner rojo fijo, montado siempre en el árbol: se autooculta si no hay
 * impersonación activa. Muestra a quién se está impersonando, cuánto falta
 * para que expire el token corto, y el botón de salida. Al expirar, restaura
 * la sesión del owner automáticamente.
 */
export default function ImpersonationBanner() {
  const [info] = useState(getImpersonationInfo);
  const [restante, setRestante] = useState('');

  useEffect(() => {
    if (!info) return;
    const tick = () => {
      const ms = new Date(info.expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        exitImpersonation();
        return;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRestante(`${m}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [info]);

  if (!info) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.modal + 1,
        bgcolor: 'error.main',
        color: 'error.contrastText',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 2,
        py: 0.75,
        boxShadow: 3,
      }}
    >
      <WarningAmberIcon fontSize="small" />
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        ESTÁS OPERANDO COMO {info.nombre.toUpperCase()} ({info.username})
        {info.empresa ? ` — ${info.empresa}` : ''} — expira en {restante}
      </Typography>
      <Button
        size="small"
        variant="outlined"
        onClick={exitImpersonation}
        sx={{
          color: 'error.contrastText',
          borderColor: 'error.contrastText',
          '&:hover': { borderColor: 'error.contrastText', bgcolor: 'rgba(255,255,255,0.15)' },
        }}
      >
        Salir
      </Button>
    </Box>
  );
}
