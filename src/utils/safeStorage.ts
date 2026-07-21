/**
 * Wrappers seguros sobre Web Storage (localStorage / sessionStorage).
 *
 * Algunos navegadores lanzan `SecurityError` con solo ACCEDER a
 * `window.sessionStorage` / `window.localStorage`: webviews embebidos / in-app
 * browsers (ej. al abrir el QR de la ficha pública desde Instagram/Facebook),
 * modo privado con almacenamiento bloqueado, o iframes con sandbox.
 *
 * Un `getItem` sin proteger dentro de un inicializador de `useState` tira abajo
 * toda la app (pantalla en blanco) antes de renderizar — incluso en rutas
 * públicas sin login. Estos helpers degradan a `null` / no-op en vez de romper.
 */

type StorageKind = 'localStorage' | 'sessionStorage';

function getItem(kind: StorageKind, key: string): string | null {
  try {
    return window[kind].getItem(key);
  } catch {
    return null;
  }
}

function setItem(kind: StorageKind, key: string, value: string): void {
  try {
    window[kind].setItem(key, value);
  } catch {
    /* almacenamiento bloqueado: no-op */
  }
}

function removeItem(kind: StorageKind, key: string): void {
  try {
    window[kind].removeItem(key);
  } catch {
    /* almacenamiento bloqueado: no-op */
  }
}

export const safeSession = {
  getItem: (key: string) => getItem('sessionStorage', key),
  setItem: (key: string, value: string) => setItem('sessionStorage', key, value),
  removeItem: (key: string) => removeItem('sessionStorage', key),
};

export const safeLocal = {
  getItem: (key: string) => getItem('localStorage', key),
  setItem: (key: string, value: string) => setItem('localStorage', key, value),
  removeItem: (key: string) => removeItem('localStorage', key),
};
