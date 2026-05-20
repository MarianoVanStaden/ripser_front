import React, { useEffect, useState } from 'react';
import { Avatar, type SxProps, type Theme } from '@mui/material';
import { fetchFotoBlobUrl } from './empleadoFotoCache';

interface Props {
  empleadoId: number;
  nombre: string;
  apellido: string;
  size?: number;
  sx?: SxProps<Theme>;
}

/**
 * Avatar del empleado: muestra la foto si tiene categoría FOTO subida,
 * fallback a las iniciales si no. Cache global a nivel módulo para que la
 * lista no rebombardée el backend.
 */
const EmpleadoFotoAvatar: React.FC<Props> = ({ empleadoId, nombre, apellido, size = 40, sx }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFotoBlobUrl(empleadoId).then(u => {
      if (!cancelled) setUrl(u);
    });
    return () => { cancelled = true; };
  }, [empleadoId]);

  const initials = `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <Avatar
      src={url ?? undefined}
      alt={`${nombre} ${apellido}`}
      sx={{ width: size, height: size, bgcolor: 'primary.main', fontSize: size * 0.4, ...sx }}
    >
      {initials}
    </Avatar>
  );
};

export default EmpleadoFotoAvatar;
