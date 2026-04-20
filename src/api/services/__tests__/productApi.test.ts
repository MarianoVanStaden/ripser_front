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
import { productApi } from '../productApi';

const mockedApi = vi.mocked(api, true);

describe('productApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets all products with default pagination params', async () => {
    mockedApi.get.mockResolvedValue({ data: { content: [], totalElements: 0 } });

    const result = await productApi.getAll();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/productos', { params: {} });
    expect(result).toEqual({ content: [], totalElements: 0 });
  });

  it('gets all products with provided pagination params', async () => {
    mockedApi.get.mockResolvedValue({ data: { content: [], totalElements: 1 } });

    await productApi.getAll({ page: 2, size: 25 });

    expect(mockedApi.get).toHaveBeenCalledWith('/api/productos', {
      params: { page: 2, size: 25 },
    });
  });

  it('gets low stock products', async () => {
    mockedApi.get.mockResolvedValue({ data: [{ id: 1 }] });

    const result = await productApi.getLowStock();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/productos/bajo-stock');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('logs and rethrows low stock request errors', async () => {
    const error = {
      response: { status: 500, data: 'boom' },
      config: { url: '/api/productos/bajo-stock' },
    };
    mockedApi.get.mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(productApi.getLowStock()).rejects.toBe(error);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching low stock products:', {
      status: 500,
      message: 'boom',
      url: '/api/productos/bajo-stock',
    });

    consoleErrorSpy.mockRestore();
  });

  it('gets active products', async () => {
    mockedApi.get.mockResolvedValue({ data: [{ id: 2 }] });

    await productApi.getActivos();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/productos/activos');
  });

  it('gets product by id', async () => {
    mockedApi.get.mockResolvedValue({ data: { id: 42 } });

    await productApi.getById(42);

    expect(mockedApi.get).toHaveBeenCalledWith('/api/productos/42');
  });

  it('creates a product', async () => {
    const payload = { nombre: 'Taladro', precio: 1000 } as any;
    mockedApi.post.mockResolvedValue({ data: { id: 5 } });

    await productApi.create(payload);

    expect(mockedApi.post).toHaveBeenCalledWith('/api/productos', payload);
  });

  it('updates a product', async () => {
    const payload = { precio: 2200 } as any;
    mockedApi.put.mockResolvedValue({ data: { id: 8, ...payload } });

    await productApi.update(8, payload);

    expect(mockedApi.put).toHaveBeenCalledWith('/api/productos/8', payload);
  });

  it('deletes a product', async () => {
    mockedApi.delete.mockResolvedValue({});

    await productApi.delete(7);

    expect(mockedApi.delete).toHaveBeenCalledWith('/api/productos/7');
  });

  it('gets products by category', async () => {
    mockedApi.get.mockResolvedValue({ data: [{ id: 11 }] });

    await productApi.getByCategory(3);

    expect(mockedApi.get).toHaveBeenCalledWith('/api/productos/categoria/3');
  });
});
