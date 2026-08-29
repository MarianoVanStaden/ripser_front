/**
 * Único punto permitido para navegación con URL absoluta (hard redirects y
 * comparación de pathname). Fuera de este archivo, ESLint prohíbe
 * `window.location.href = '/...'` y `href="/..."` — usar appPath/hardRedirect
 * o `<Link to>` de react-router (el basename lo resuelve el router).
 *
 * BASE_URL sale de `base` en vite.config.ts: '/' hoy, '/ripser/' post-cutover.
 * Con base '/' el comportamiento es idéntico al histórico.
 */

// Vite garantiza barra final en BASE_URL; se normaliza igual por robustez
// (algunos runners exponen '' o base sin barra).
const RAW_BASE = import.meta.env.BASE_URL || '/';
const BASE = RAW_BASE.endsWith('/') ? RAW_BASE : `${RAW_BASE}/`;

/** '/login' → '/login' con base '/', '/ripser/login' con base '/ripser/'. */
export const appPath = (path: string): string =>
  BASE + (path.startsWith('/') ? path.slice(1) : path);

/**
 * Full reload hacia una ruta de la app (rehidrata AuthContext/TenantContext
 * desde storage, sin estados a medias).
 */
export const hardRedirect = (path: string): void => {
  window.location.href = appPath(path);
};

/** ¿El pathname actual es exactamente esta ruta de la app? (ignora barra final) */
export const isAtPath = (path: string): boolean => {
  const norm = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);
  return norm(window.location.pathname) === norm(appPath(path));
};
