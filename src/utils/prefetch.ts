// Route prefetch helpers.
//
// Usage pattern:
//
//   import { prefetch } from '../utils/prefetch';
//
//   <ListItemButton
//     onMouseEnter={prefetch(() => import('../pages/ventas/VentasDashboard'))}
//     onClick={() => navigate('/ventas/dashboard')}
//   >
//
// The lazy() loader in App.tsx and this prefetch call resolve to the same
// Vite module — once either fires, the chunk is cached and the other call
// is instant. No registry to maintain: the import path is colocated with
// the component that triggers navigation.
//
// Prefer onMouseEnter (desktop) or onFocus (keyboard) over onTouchStart on
// mobile: touch fires right before the click anyway, so prefetching there
// just duplicates the request.

/**
 * Returns an event handler that fires `loader()` once. Errors are swallowed
 * because a failed prefetch should never break hover UX — the real error
 * surfaces when the user actually navigates.
 */
export const prefetch = (loader: () => Promise<unknown>) => {
  return () => {
    loader().catch(() => { /* noop — real error surfaces at navigation time */ });
  };
};

/**
 * `lazyWithPreload` — drop-in replacement for React.lazy that exposes a
 * `.preload()` method. Use when you want to trigger a prefetch without
 * holding the import() closure at the call site.
 *
 *   const VentasDashboard = lazyWithPreload(() => import('./VentasDashboard'));
 *   <Link onMouseEnter={VentasDashboard.preload}>...</Link>
 *   // App.tsx: <Route element={<VentasDashboard />} />  (still works)
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export type PreloadableLazy<T extends ComponentType<any>> =
  LazyExoticComponent<T> & { preload: () => Promise<unknown> };

export function lazyWithPreload<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
): PreloadableLazy<T> {
  const Component = lazy(loader) as PreloadableLazy<T>;
  Component.preload = loader;
  return Component;
}
