import { describe, it, expect, vi, afterEach } from 'vitest';

// navigation.ts captura BASE_URL al cargar el módulo: cada caso stubea el env
// y re-importa para probar ambas bases ('/' actual y '/ripser/' post-cutover).
const loadWithBase = async (base: string) => {
  vi.resetModules();
  vi.stubEnv('BASE_URL', base);
  return await import('../navigation');
};

const stubPathname = (pathname: string) => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { href: '', pathname },
  });
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('navigation con base "/" (comportamiento actual, Deploy A)', () => {
  it('appPath es identidad', async () => {
    const { appPath } = await loadWithBase('/');
    expect(appPath('/login')).toBe('/login');
    expect(appPath('/')).toBe('/');
    expect(appPath('/platform/ops')).toBe('/platform/ops');
  });

  it('hardRedirect asigna window.location.href sin prefijo', async () => {
    const { hardRedirect } = await loadWithBase('/');
    stubPathname('/dashboard');
    hardRedirect('/login');
    expect(window.location.href).toBe('/login');
  });

  it('isAtPath compara contra el pathname pelado', async () => {
    const { isAtPath } = await loadWithBase('/');
    stubPathname('/login');
    expect(isAtPath('/login')).toBe(true);
    stubPathname('/dashboard');
    expect(isAtPath('/login')).toBe(false);
  });
});

describe('navigation con base "/ripser/" (post-cutover, Deploy B)', () => {
  it('appPath prefija con /ripser', async () => {
    const { appPath } = await loadWithBase('/ripser/');
    expect(appPath('/login')).toBe('/ripser/login');
    expect(appPath('/')).toBe('/ripser/');
  });

  it('isAtPath matchea el pathname prefijado (fix del loop de 401 en login)', async () => {
    const { isAtPath } = await loadWithBase('/ripser/');
    stubPathname('/ripser/login');
    expect(isAtPath('/login')).toBe(true);
    stubPathname('/login'); // pathname legacy sin prefijo: NO es la vista login de la app
    expect(isAtPath('/login')).toBe(false);
  });

  it('hardRedirect prefija el destino', async () => {
    const { hardRedirect } = await loadWithBase('/ripser/');
    stubPathname('/ripser/dashboard');
    hardRedirect('/login');
    expect(window.location.href).toBe('/ripser/login');
  });

  it('tolera base sin barra final', async () => {
    const { appPath } = await loadWithBase('/ripser');
    expect(appPath('/login')).toBe('/ripser/login');
  });
});
