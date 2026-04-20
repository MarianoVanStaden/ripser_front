import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  };
  return { default: mockApi };
});

import api from '../../config';
import { parametroSistemaApi } from '../parametroSistemaApi';

const mockedApi = vi.mocked(api, true);

describe('parametroSistemaApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets all parametros', async () => {
    mockedApi.get.mockResolvedValue({ data: [{ id: 1 }] });

    const result = await parametroSistemaApi.getAll();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/admin/parametros');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('gets parametro by clave', async () => {
    mockedApi.get.mockResolvedValue({ data: { id: 2, clave: 'X' } });

    const result = await parametroSistemaApi.getByClave('X');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/admin/parametros/clave/X');
    expect(result).toEqual({ id: 2, clave: 'X' });
  });

  it('creates parametro', async () => {
    const payload = { clave: 'REDONDEO_PRECIO', valor: '100' } as any;
    mockedApi.post.mockResolvedValue({ data: { id: 3, ...payload } });

    await parametroSistemaApi.create(payload);

    expect(mockedApi.post).toHaveBeenCalledWith('/api/admin/parametros', payload);
  });

  it('updates parametro', async () => {
    const payload = { valor: '200' } as any;
    mockedApi.put.mockResolvedValue({ data: { id: 4, ...payload } });

    await parametroSistemaApi.update(4, payload);

    expect(mockedApi.put).toHaveBeenCalledWith('/api/admin/parametros/4', payload);
  });
});
