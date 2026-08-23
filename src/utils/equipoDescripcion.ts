/**
 * Etiqueta "nombre - modelo" de una receta/equipo, agregando el modelo solo
 * cuando difiere del nombre: en casi todas las recetas son idénticos y
 * concatenarlos duplicaba el texto en detalles y PDFs (solo difieren en
 * Coolbox: nombre "Heladera Coolbox 1,50", modelo "Coolbox 1,50").
 * Espejo de DocumentoComposicionService.descripcionEquipoFromReceta (backend).
 */
export function nombreModeloEquipo(
  nombre?: string | null,
  modelo?: string | null,
): string {
  const n = (nombre ?? '').trim();
  const m = (modelo ?? '').trim();
  if (!m || m.toLowerCase() === n.toLowerCase()) return n;
  return n ? `${n} - ${m}` : m;
}
