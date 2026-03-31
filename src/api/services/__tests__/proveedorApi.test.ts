import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { default: mockApi };
});

import api from '../../config';
import { proveedorApi } from '../proveedorApi';

const mockedApi = vi.mocked(api, true);

const mockProveedor = {
  id: 1,
  nombre: 'Proveedor Test',
  cuit: '20-12345678-9',
  email: 'prov@test.com',
};

const mockPageResponse = {
  content: [mockProveedor],
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
  numberOfElements: 1,
  empty: false,
};

describe('proveedorApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('sends GET to /api/proveedores with pagination', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPageResponse });

      const result = await proveedorApi.getAll({ page: 0, size: 20 });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/proveedores', {
        params: { page: 0, size: 20 },
      });
      expect(result.content).toEqual([mockProveedor]);
    });

    it('works with default pagination', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPageResponse });

      await proveedorApi.getAll();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/proveedores', {
        params: {},
      });
    });
  });

  describe('getById', () => {
    it('sends GET to /api/proveedores/:id', async () => {
      mockedApi.get.mockResolvedValue({ data: mockProveedor });

      const result = await proveedorApi.getById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/proveedores/1');
      expect(result.nombre).toBe('Proveedor Test');
    });
  });

  describe('create', () => {
    it('sends POST to /api/proveedores', async () => {
      mockedApi.post.mockResolvedValue({ data: mockProveedor });

      const result = await proveedorApi.create({ nombre: 'New Proveedor' });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/proveedores', { nombre: 'New Proveedor' });
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('sends PUT to /api/proveedores/:id', async () => {
      const updated = { ...mockProveedor, nombre: 'Updated' };
      mockedApi.put.mockResolvedValue({ data: updated });

      const result = await proveedorApi.update(1, { nombre: 'Updated' });

      expect(mockedApi.put).toHaveBeenCalledWith('/api/proveedores/1', { nombre: 'Updated' });
      expect(result.nombre).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('sends DELETE to /api/proveedores/:id', async () => {
      mockedApi.delete.mockResolvedValue({});

      await proveedorApi.delete(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/proveedores/1');
    });
  });
});
