import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config', () => {
  const mockApi = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { default: mockApi };
});

import api from '../../config';
import { clienteApi } from '../clienteApi';

const mockedApi = vi.mocked(api, true);

const mockCliente = {
  id: 1,
  nombre: 'Test Client',
  email: 'test@test.com',
};

const mockPageResponse = {
  content: [mockCliente],
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
  numberOfElements: 1,
  empty: false,
};

describe('clienteApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('sends GET to /api/clientes with pagination params', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPageResponse });

      const result = await clienteApi.getAll({ page: 0, size: 20 });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/clientes', {
        params: { page: 0, size: 20 },
      });
      expect(result.content).toEqual([mockCliente]);
    });

    it('sends filter params merged with pagination', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPageResponse });

      await clienteApi.getAll(
        { page: 0, size: 10 },
        { estado: 'ACTIVO' as any, term: 'test' }
      );

      expect(mockedApi.get).toHaveBeenCalledWith('/api/clientes', {
        params: { estado: 'ACTIVO', term: 'test', page: 0, size: 10 },
      });
    });

    it('works with empty pagination', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPageResponse });

      await clienteApi.getAll();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/clientes', {
        params: {},
      });
    });
  });

  describe('getById', () => {
    it('sends GET to /api/clientes/:id', async () => {
      mockedApi.get.mockResolvedValue({ data: mockCliente });

      const result = await clienteApi.getById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/clientes/1');
      expect(result.id).toBe(1);
    });
  });

  describe('create', () => {
    it('sends POST to /api/clientes', async () => {
      mockedApi.post.mockResolvedValue({ data: mockCliente });

      const result = await clienteApi.create({ nombre: 'New Client' });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/clientes', { nombre: 'New Client' });
      expect(result.nombre).toBe('Test Client');
    });
  });

  describe('update', () => {
    it('sends PUT to /api/clientes/:id', async () => {
      mockedApi.put.mockResolvedValue({ data: { ...mockCliente, nombre: 'Updated' } });

      const result = await clienteApi.update(1, { nombre: 'Updated' });

      expect(mockedApi.put).toHaveBeenCalledWith('/api/clientes/1', { nombre: 'Updated' });
      expect(result.nombre).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('sends DELETE to /api/clientes/:id', async () => {
      mockedApi.delete.mockResolvedValue({});

      await clienteApi.delete(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/clientes/1');
    });
  });

  describe('search', () => {
    it('hits /api/clientes/search with q and merges pagination + extra filters', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPageResponse });

      await clienteApi.search('test', { page: 0 }, { sucursalId: 7 });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/clientes/search', {
        params: { q: 'test', sucursalId: 7, page: 0 },
      });
    });
  });

  describe('searchByQuery', () => {
    it('sends GET to /api/clientes/search with query params', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPageResponse });

      await clienteApi.searchByQuery('juan', 5);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/clientes/search', {
        params: { q: 'juan', page: 0, size: 5 },
        signal: undefined,
      });
    });

    it('passes AbortSignal when provided', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPageResponse });
      const controller = new AbortController();

      await clienteApi.searchByQuery('test', 10, controller.signal);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/clientes/search', {
        params: { q: 'test', page: 0, size: 10 },
        signal: controller.signal,
      });
    });
  });
});
