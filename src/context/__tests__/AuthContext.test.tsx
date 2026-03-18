import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import type { ReactNode } from 'react';

// Mock authApi before importing AuthContext
vi.mock('../../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    validateToken: vi.fn(),
    refresh: vi.fn(),
    selectTenant: vi.fn(),
  },
}));

vi.mock('../../api/config', () => ({
  setAuthToken: vi.fn(),
  default: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}));

import { AuthProvider, useAuth } from '../AuthContext';
import { authApi } from '../../api/authApi';

const mockedAuthApi = vi.mocked(authApi);

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('useAuth hook', () => {
    it('throws when used outside AuthProvider', () => {
      // Suppress React error boundary noise
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      spy.mockRestore();
    });
  });

  describe('initial state', () => {
    it('finishes loading with no user when no stored token', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.esSuperAdmin).toBe(false);
    });
  });

  describe('token validation on mount', () => {
    it('restores user from storage when token is valid', async () => {
      // Create a non-expired JWT (exp far in future)
      const payload = btoa(JSON.stringify({ sub: 'user', exp: Math.floor(Date.now() / 1000) + 3600 }));
      const fakeToken = `header.${payload}.signature`;
      const fakeUser = { id: 1, username: 'admin', email: 'admin@test.com', roles: ['ADMIN'] };

      localStorage.setItem('auth_token', fakeToken);
      localStorage.setItem('auth_user', JSON.stringify(fakeUser));

      mockedAuthApi.validateToken.mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(fakeUser);
      expect(result.current.token).toBe(fakeToken);
    });

    it('restores esSuperAdmin from sessionStorage', async () => {
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
      const fakeToken = `h.${payload}.s`;
      const fakeUser = { id: 1, username: 'super' };

      localStorage.setItem('auth_token', fakeToken);
      localStorage.setItem('auth_user', JSON.stringify(fakeUser));
      sessionStorage.setItem('esSuperAdmin', 'true');

      mockedAuthApi.validateToken.mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.esSuperAdmin).toBe(true);
    });

    it('logs out when token is expired (client-side)', async () => {
      // Expired token
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
      const expiredToken = `h.${payload}.s`;

      localStorage.setItem('auth_token', expiredToken);
      localStorage.setItem('auth_user', JSON.stringify({ id: 1, username: 'u' }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('logs out when backend returns 401 for validation', async () => {
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
      const token = `h.${payload}.s`;

      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify({ id: 1, username: 'u' }));

      mockedAuthApi.validateToken.mockRejectedValue({ response: { status: 401 } });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });

    it('trusts client-side validation when backend returns non-401 error', async () => {
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
      const token = `h.${payload}.s`;
      const user = { id: 1, username: 'u' };

      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      // 403 or network error = endpoint issue, not token issue
      mockedAuthApi.validateToken.mockRejectedValue({ response: { status: 403 } });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still be authenticated
      expect(result.current.user).toEqual(user);
    });
  });

  describe('login', () => {
    it('stores user and token on successful login', async () => {
      mockedAuthApi.login.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        id: 5,
        username: 'testuser',
        email: 'test@test.com',
        roles: ['VENDEDOR'],
        esSuperAdmin: false,
        empresaId: 10,
        sucursalId: 3,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      expect(result.current.user).toEqual({
        id: 5,
        username: 'testuser',
        email: 'test@test.com',
        roles: ['VENDEDOR'],
        esSuperAdmin: false,
      });
      expect(result.current.token).toBe('new-access-token');
      expect(result.current.esSuperAdmin).toBe(false);

      // Verify storage
      expect(localStorage.getItem('auth_token')).toBe('new-access-token');
      expect(localStorage.getItem('auth_refresh_token')).toBe('new-refresh-token');
      expect(sessionStorage.getItem('empresaId')).toBe('10');
      expect(sessionStorage.getItem('sucursalId')).toBe('3');
    });

    it('sets esSuperAdmin on login', async () => {
      mockedAuthApi.login.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
        id: 1,
        username: 'superadmin',
        email: 'sa@test.com',
        roles: ['ADMIN'],
        esSuperAdmin: true,
        empresaId: 1,
        sucursalId: 1,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.login('superadmin', 'pass');
      });

      expect(result.current.esSuperAdmin).toBe(true);
      expect(sessionStorage.getItem('esSuperAdmin')).toBe('true');
    });

    it('preserves existing empresaId when login response has none', async () => {
      sessionStorage.setItem('empresaId', '99');

      mockedAuthApi.login.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
        id: 1,
        username: 'user',
        email: '',
        roles: [],
        // No empresaId in response
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.login('user', 'pass');
      });

      // Should preserve existing value
      expect(sessionStorage.getItem('empresaId')).toBe('99');
    });

    it('throws on login failure with server error message', async () => {
      mockedAuthApi.login.mockRejectedValue({
        response: { data: { error: 'Credenciales inválidas' } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.login('bad', 'creds');
        })
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('throws generic error when no server message', async () => {
      mockedAuthApi.login.mockRejectedValue(new Error('Network fail'));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.login('user', 'pass');
        })
      ).rejects.toThrow('Error de autenticación');
    });

    it('throws when response has no access token', async () => {
      mockedAuthApi.login.mockResolvedValue({
        tokenType: 'Bearer',
        expiresIn: 3600,
        id: 1,
        username: 'user',
        email: '',
        roles: [],
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      // The inner Error is caught by the catch block which wraps it
      await expect(
        act(async () => {
          await result.current.login('user', 'pass');
        })
      ).rejects.toThrow('Error de autenticación');
    });

    it('dispatches tenant-context-updated event on login', async () => {
      const eventSpy = vi.fn();
      window.addEventListener('tenant-context-updated', eventSpy);

      mockedAuthApi.login.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
        id: 1,
        username: 'user',
        email: '',
        roles: [],
        empresaId: 5,
        sucursalId: 2,
        esSuperAdmin: false,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.login('user', 'pass');
      });

      expect(eventSpy).toHaveBeenCalled();
      const detail = (eventSpy.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.empresaId).toBe(5);
      expect(detail.sucursalId).toBe(2);

      window.removeEventListener('tenant-context-updated', eventSpy);
    });
  });

  describe('logout', () => {
    it('clears all auth state and storage', async () => {
      // Setup logged-in state
      mockedAuthApi.login.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
        id: 1,
        username: 'user',
        email: '',
        roles: [],
        empresaId: 1,
        sucursalId: 1,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.login('user', 'pass');
      });

      expect(result.current.user).not.toBeNull();

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.esSuperAdmin).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('auth_user')).toBeNull();
      expect(localStorage.getItem('auth_refresh_token')).toBeNull();
      expect(sessionStorage.getItem('empresaId')).toBeNull();
      expect(sessionStorage.getItem('sucursalId')).toBeNull();
      expect(sessionStorage.getItem('esSuperAdmin')).toBeNull();
      expect(sessionStorage.getItem('sucursalFiltro')).toBeNull();
    });
  });

  describe('tenant-context-updated listener', () => {
    it('updates esSuperAdmin when receiving tenant event', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.esSuperAdmin).toBe(false);

      act(() => {
        window.dispatchEvent(new CustomEvent('tenant-context-updated', {
          detail: { esSuperAdmin: true },
        }));
      });

      expect(result.current.esSuperAdmin).toBe(true);
    });
  });
});
