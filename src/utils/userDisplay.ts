interface UserLike {
  nombre?: string | null;
  username?: string | null;
}

interface EmpleadoNameLike {
  nombre: string;
  nombre2?: string | null;
  apellido: string;
  apellido2?: string | null;
}

/** Devuelve el nombre completo del empleado incluyendo segundo nombre y segundo apellido cuando existen. */
export const getNombreCompleto = (e: EmpleadoNameLike): string =>
  [e.nombre, e.nombre2, e.apellido, e.apellido2].filter(Boolean).join(' ');

/**
 * Devuelve el primer nombre del usuario con la primera letra en mayúscula
 * y el resto en minúscula. Si no hay `nombre`, hace fallback al `username`.
 * Si tampoco hay username, devuelve cadena vacía.
 *
 * Ejemplos:
 *   { nombre: "MARIA LOPEZ" }     → "Maria"
 *   { nombre: "juan carlos" }     → "Juan"
 *   { nombre: "", username: "mvs" } → "Mvs"
 */
export const getFirstName = (user?: UserLike | null): string => {
  const raw = (user?.nombre || user?.username || '').trim();
  if (!raw) return '';
  const firstWord = raw.split(/\s+/)[0];
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
};
