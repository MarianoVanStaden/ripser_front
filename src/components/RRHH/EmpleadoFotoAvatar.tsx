import React, { useEffect, useState } from 'react';
import { Avatar, type SxProps, type Theme } from '@mui/material';
import { documentoEmpleadoApi } from '../../api/services/documentoEmpleadoApi';

// Cache global por empleadoId → blob URL para no redescargar la foto al
// abrir/cerrar el detail o re-renderizar la lista. Se libera cuando el módulo
// se descarga (lo cual no pasa en la SPA, está bien). Si el upload cambia la
// foto, el flujo `setEmpleadoId(0)+setEmpleadoId(id)` no aplica acá — usar
// `clearEmpleadoFotoCache(id)` desde el form de upload.
const fotoUrlCache = new Map<number, string | null>();
const pending = new Map<number, Promise<string | null>>();

export const clearEmpleadoFotoCache = (empleadoId: number) => {
  const cached = fotoUrlCache.get(empleadoId);
  if (cached) URL.revokeObjectURL(cached);
  fotoUrlCache.delete(empleadoId);
  pending.delete(empleadoId);
};

async function fetchFotoBlobUrl(empleadoId: number): Promise<string | null> {
  if (fotoUrlCache.has(empleadoId)) return fotoUrlCache.get(empleadoId)!;
  if (pending.has(empleadoId)) return pending.get(empleadoId)!;

  const p = (async () => {
    try {
      const docs = await documentoEmpleadoApi.getByEmpleadoIdAndCategoria(empleadoId, 'FOTO');
      if (!docs || docs.length === 0) {
        fotoUrlCache.set(empleadoId, null);
        return null;
      }
      // Tomamos la más reciente. El endpoint download devuelve un blob.
      const doc = docs[0];
      const blob = await documentoEmpleadoApi.download(empleadoId, doc.id);
      const url = URL.createObjectURL(blob);
      fotoUrlCache.set(empleadoId, url);
      return url;
    } catch {
      fotoUrlCache.set(empleadoId, null);
      return null;
    } finally {
      pending.delete(empleadoId);
    }
  })();

  pending.set(empleadoId, p);
  return p;
}

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
