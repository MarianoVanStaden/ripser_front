import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the config module (axios instance)
vi.mock('../config', () => {
  const mockApi = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { default: mockApi };
});

import api from '../config';
import { authApi } from '../authApi';

const mockedApi = vi.mocked(api);

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('sends POST to /api/auth/login with credentials', async () => {
      const mockResponse = {
        data: {
          accessToken: 'access123',
          refreshToken: 'refresh123',
          roles: ['ADMIN'],
          empresaId: 1,
        },
      };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await authApi.login({
        usernameOrEmail: 'admin',
        password: 'pass123',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/auth/login', {
        usernameOrEmail: 'admin',
        password: 'pass123',
      });
      expect(result.accessToken).toBe('access123');
      expect(result.roles).toEqual(['ADMIN']);
    });
  });

  describe('validateToken', () => {
    it('sends POST to /api/auth/validate', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await authApi.validateToken('my-token');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/auth/validate', {
        token: 'my-token',
      });
    });
  });

  describe('refresh', () => {
    it('sends POST to /api/auth/refresh with refresh token', async () => {
      mockedApi.post.mockResolvedValue({
        data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
      });

      const result = await authApi.refresh('old-refresh');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/auth/refresh', {
        refreshToken: 'old-refresh',
      });
      expect(result.accessToken).toBe('new-access');
    });
  });

  describe('selectTenant', () => {
    it('sends POST to /api/auth/select-tenant with empresa and sucursal', async () => {
      mockedApi.post.mockResolvedValue({
        data: { accessToken: 'tenant-token', empresaId: 5, sucursalId: 10 },
      });

      const result = await authApi.selectTenant({ empresaId: 5, sucursalId: 10 });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/auth/select-tenant', {
        empresaId: 5,
        sucursalId: 10,
      });
      expect(result.empresaId).toBe(5);
    });
  });
});
