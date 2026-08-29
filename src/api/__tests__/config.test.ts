import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// authApi se mockea para cortar la dependencia circular y controlar el refresh.
vi.mock('../authApi', () => ({
  authApi: { refresh: vi.fn() },
}));

import api, { setAuthToken } from '../config';
import { authApi } from '../authApi';
// appPath hace los asserts independientes del `base` de Vite ('/' hoy,
// '/ripser/' post-cutover): la suite queda verde en ambos deploys.
import { appPath } from '../../utils/navigation';

const mockedRefresh = vi.mocked(authApi.refresh);

// Handlers internos de axios (no hay API pública para invocarlos aislados).
const reqInterceptor = () =>
  (api.interceptors.request as any).handlers.find((h: any) => h?.fulfilled).fulfilled;
const resRejected = () =>
  (api.interceptors.response as any).handlers.find((h: any) => h?.rejected).rejected;

describe('api config', () => {
  const originalAdapter = api.defaults.adapter;
  const originalLocation = window.location;
  let adapterMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    setAuthToken(null);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Adapter falso: el retry (`api(originalRequest)`) no debe pegarle a la red.
    adapterMock = vi.fn(async (config: any) => ({
      data: { retried: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));
    api.defaults.adapter = adapterMock as never;

    // window.location stub: el interceptor asigna href y lee pathname.
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '', pathname: appPath('/dashboard') },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    api.defaults.adapter = originalAdapter;
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  describe('request interceptor', () => {
    it('adjunta Authorization desde el token en memoria', () => {
      setAuthToken('my-token');
      const config = reqInterceptor()({ headers: {}, url: '/api/clientes' });
      expect(config.headers.Authorization).toBe('Bearer my-token');
    });

    it('cae al token de localStorage cuando no hay token en memoria', () => {
      localStorage.setItem('auth_token', 'stored-token');
      const config = reqInterceptor()({ headers: {}, url: '/api/clientes' });
      expect(config.headers.Authorization).toBe('Bearer stored-token');
    });

    it('adjunta X-Empresa-Id cuando hay empresa seleccionada', () => {
      setAuthToken('t');
      sessionStorage.setItem('empresaId', '42');
      const config = reqInterceptor()({ headers: {}, url: '/api/clientes' });
      expect(config.headers['X-Empresa-Id']).toBe('42');
    });

    it('no exige tenant para endpoints de auth (no rompe el login)', () => {
      setAuthToken('t'); // sin empresaId en sesión
      const config = reqInterceptor()({ headers: {}, url: '/api/auth/login' });
      expect(config.headers['X-Empresa-Id']).toBeUndefined();
    });
  });

  describe('response interceptor — 401 token_expired', () => {
    const tokenExpiredError = (url = '/api/data') => ({
      config: { url, headers: {} as Record<string, string> },
      response: { status: 401, data: { error: 'token_expired' } },
    });

    it('refresca el token y reintenta el request original con el nuevo token', async () => {
      localStorage.setItem('auth_token', 'old');
      localStorage.setItem('auth_refresh_token', 'stored-refresh');
      mockedRefresh.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      } as never);
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      const res = await resRejected()(tokenExpiredError());

      expect(mockedRefresh).toHaveBeenCalledWith('stored-refresh');
      expect(localStorage.getItem('auth_token')).toBe('new-access');
      expect(localStorage.getItem('auth_refresh_token')).toBe('new-refresh');
      // El request se reintentó, con el token nuevo en el header.
      expect(adapterMock).toHaveBeenCalledOnce();
      expect(adapterMock.mock.calls[0][0].headers.Authorization).toBe('Bearer new-access');
      expect(res.data.retried).toBe(true);
      // Notifica a AuthContext para que hooks (SSE) no queden con el token viejo.
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth-token-refreshed' }),
      );
    });

    it('sin refresh token: limpia sesión y redirige a /login (no reintenta)', async () => {
      localStorage.setItem('auth_token', 'old');
      await expect(resRejected()(tokenExpiredError())).rejects.toBeDefined();

      expect(mockedRefresh).not.toHaveBeenCalled();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('auth_refresh_token')).toBeNull();
      expect(window.location.href).toBe(appPath('/login'));
      expect(adapterMock).not.toHaveBeenCalled();
    });

    it('si el refresh falla: limpia sesión y redirige a /login', async () => {
      localStorage.setItem('auth_token', 'old');
      localStorage.setItem('auth_refresh_token', 'stored-refresh');
      mockedRefresh.mockRejectedValue(new Error('refresh 500'));

      await expect(resRejected()(tokenExpiredError())).rejects.toBeTruthy();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe(appPath('/login'));
    });

    it('preserva empresaId/sucursalId al fallar el refresh (contexto de SuperAdmin)', async () => {
      sessionStorage.setItem('empresaId', '10');
      sessionStorage.setItem('sucursalId', '3');
      localStorage.setItem('auth_refresh_token', 'stored-refresh');
      mockedRefresh.mockRejectedValue(new Error('boom'));

      await expect(resRejected()(tokenExpiredError())).rejects.toBeTruthy();

      expect(sessionStorage.getItem('empresaId')).toBe('10');
      expect(sessionStorage.getItem('sucursalId')).toBe('3');
    });

    it('NO intenta refrescar si el 401 vino del propio endpoint /auth/refresh (anti-loop)', async () => {
      localStorage.setItem('auth_refresh_token', 'stored-refresh');
      await expect(
        resRejected()(tokenExpiredError('/api/auth/refresh')),
      ).rejects.toBeDefined();

      expect(mockedRefresh).not.toHaveBeenCalled();
      expect(window.location.href).toBe(''); // no redirige
    });
  });

  describe('response interceptor — otros errores', () => {
    it('401 no-token_expired: limpia sesión y redirige a /login', async () => {
      localStorage.setItem('auth_token', 'old');
      const error = { config: { url: '/api/x' }, response: { status: 401, data: {} } };

      await expect(resRejected()(error)).rejects.toBe(error);

      expect(mockedRefresh).not.toHaveBeenCalled();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe(appPath('/login'));
    });

    it('no redirige si ya está en /login (evita el loop de login)', async () => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { href: '', pathname: appPath('/login') },
      });
      const error = { config: { url: '/api/x' }, response: { status: 401, data: {} } };

      await expect(resRejected()(error)).rejects.toBe(error);
      expect(window.location.href).toBe(''); // no se tocó
    });

    it('propaga errores no-401 sin tocar la sesión', async () => {
      localStorage.setItem('auth_token', 'keep');
      const error = { config: { url: '/api/x' }, response: { status: 500, data: {} } };

      await expect(resRejected()(error)).rejects.toBe(error);
      expect(localStorage.getItem('auth_token')).toBe('keep');
      expect(window.location.href).toBe('');
    });
  });
});
