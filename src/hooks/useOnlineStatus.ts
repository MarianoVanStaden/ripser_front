import { useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

/** true si el navegador reporta conexión (navigator.onLine). */
export const useOnlineStatus = (): boolean =>
  useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
