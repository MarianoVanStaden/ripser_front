import '@testing-library/jest-dom';

// --- jsdom shims que MUI necesita (DataGrid, date-pickers, useMediaQuery) ---
// jsdom no implementa estas APIs; sin ellas los componentes MUI tiran en runtime
// y los tests fallan sólo en jsdom/CI. Son la causa #1 de flakes con MUI.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},      // deprecado, algunos libs viejos lo usan
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList,
  });
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
class IntersectionObserverMock {
  root = null;
  rootMargin = '';
  thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverMock as unknown as typeof ResizeObserver);
globalThis.IntersectionObserver = globalThis.IntersectionObserver ?? (IntersectionObserverMock as unknown as typeof IntersectionObserver);

// jsdom no implementa scrollTo; MUI Menu/Dialog lo llaman al abrir.
if (!window.scrollTo) {
  window.scrollTo = (() => {}) as typeof window.scrollTo;
}

// Mock localStorage and sessionStorage for tests
const createStorageMock = (): Storage => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
};

Object.defineProperty(window, 'localStorage', { value: createStorageMock() });
Object.defineProperty(window, 'sessionStorage', { value: createStorageMock() });
