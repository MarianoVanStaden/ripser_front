import { documentoEmpleadoApi } from '../../api/services/documentoEmpleadoApi';

const fotoUrlCache = new Map<number, string | null>();
const pending = new Map<number, Promise<string | null>>();

export const clearEmpleadoFotoCache = (empleadoId: number) => {
  const cached = fotoUrlCache.get(empleadoId);
  if (cached) URL.revokeObjectURL(cached);
  fotoUrlCache.delete(empleadoId);
  pending.delete(empleadoId);
};

export async function fetchFotoBlobUrl(empleadoId: number): Promise<string | null> {
  if (fotoUrlCache.has(empleadoId)) return fotoUrlCache.get(empleadoId)!;
  if (pending.has(empleadoId)) return pending.get(empleadoId)!;

  const p = (async () => {
    try {
      const docs = await documentoEmpleadoApi.getByEmpleadoIdAndCategoria(empleadoId, 'FOTO');
      if (!docs || docs.length === 0) {
        fotoUrlCache.set(empleadoId, null);
        return null;
      }
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
