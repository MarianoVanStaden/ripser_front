/**
 * KILL-SWITCH del Service Worker viejo (app en '/', pre-cutover a /ripser).
 *
 * Se despliega en /var/www/landing/current/ CON EL NOMBRE EXACTO del SW que
 * corría en producción (sw.js según el build actual — VERIFICAR con
 * `ls /var/www/frontend/current/` antes de copiar). Nginx lo sirve con
 * Cache-Control: no-store para que el browser lo re-chequee siempre.
 *
 * Qué hace: el browser detecta un byte-diff con el sw.js viejo → instala este
 * SW → skipWaiting lo activa sin esperar el prompt del viejo (registerType
 * 'prompt' solo gobierna el flujo de UI, no impide skipWaiting del entrante)
 * → borra TODOS los caches (workbox-precache incluido), se desregistra y
 * recarga cada client controlado. La recarga cae en '/', nginx responde 302
 * a /ripser/ y el usuario aterriza en la app nueva.
 *
 * Este archivo es de un solo uso: muere cuando muera la landing legacy.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        // Sin caches que borrar o storage bloqueado: seguir igual.
      }
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.all(
        clients.map((c) => c.navigate(c.url).catch(() => undefined)),
      );
      await self.registration.unregister();
    })(),
  );
});
