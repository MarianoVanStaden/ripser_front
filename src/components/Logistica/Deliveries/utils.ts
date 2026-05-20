// FRONT-003: extracted from DeliveriesPage.tsx — pure helpers para
// estados de asignación de equipos.
import type { EstadoAsignacionEquipo } from '../../../types';

type ChipColor = 'default' | 'warning' | 'info' | 'secondary' | 'success';

/** Maps EstadoAsignacionEquipo → MUI Chip color. */
export const getEstadoAsignacionColor = (
  estado: EstadoAsignacionEquipo | null | undefined
): ChipColor => {
  if (!estado) return 'default';
  const colorMap: Record<EstadoAsignacionEquipo, ChipColor> = {
    DISPONIBLE: 'default',
    RESERVADO: 'warning',
    FACTURADO: 'info',
    EN_TRANSITO: 'secondary',
    ENTREGADO: 'success',
    PENDIENTE_TERMINACION: 'warning',
    EN_SERVICE: 'warning',
  };
  return colorMap[estado] || 'default';
};

/** Human label for an EstadoAsignacionEquipo. */
export const getEstadoAsignacionLabel = (
  estado: EstadoAsignacionEquipo | null | undefined
): string => {
  if (!estado) return 'No especificado';
  const labelMap: Record<EstadoAsignacionEquipo, string> = {
    DISPONIBLE: 'Disponible',
    RESERVADO: 'Reservado',
    FACTURADO: 'Facturado',
    EN_TRANSITO: 'En Transito',
    ENTREGADO: 'Entregado',
    PENDIENTE_TERMINACION: 'Pendiente Terminación',
    EN_SERVICE: 'En Service',
  };
  return labelMap[estado] || estado;
};

/**
 * Comprime una imagen (JPEG) reescalándola para que el lado mayor no supere
 * `maxSide`. Reduce el peso de fotos de cámara (2–5 MB → ~300–500 KB) y
 * evita timeouts en el upload sobre redes móviles.
 * Si el archivo no es imagen o falla la compresión, devuelve el original.
 */
export const compressImageFile = async (
  file: File,
  maxSide = 1600,
  quality = 0.8
): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob) return file;
    const renamed = file.name.replace(/\.(heic|heif|png|webp|bmp|tiff?)$/i, '.jpg');
    return new File([blob], renamed.endsWith('.jpg') ? renamed : `${renamed}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
};
