import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  };
  return { default: mockApi };
});

import api from '../../config';
import { employeeApi } from '../employeeApi';

const mockedApi = vi.mocked(api, true);

const mockEmpleado = {
  id: 1,
  nombre: 'Carlos',
  apellido: 'García',
  dni: '12345678',
  estado: 'ACTIVO',
};

const mockPageResponse = {
  content: [mockEmpleado],
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
  numberOfElements: 1,
  empty: false,
};

describe('employeeApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('sends GET to /api/empleados with pagination', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPageResponse });

      const result = await employeeApi.getAll({ page: 0, size: 20 });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/empleados', {
        params: { page: 0, size: 20 },
      });
      expect(result.content).toEqual([mockEmpleado]);
    });
  });

  describe('getAllList', () => {
    it('returns content array from paginated response', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [mockEmpleado] } });

      const result = await employeeApi.getAllList();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/empleados', {
        params: { page: 0, size: 10000 },
      });
      expect(result).toEqual([mockEmpleado]);
    });

    it('returns array directly if response is already an array', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockEmpleado] });

      const result = await employeeApi.getAllList();

      expect(result).toEqual([mockEmpleado]);
    });

    it('throws when API returns HTML string', async () => {
      mockedApi.get.mockResolvedValue({ data: '<html>Error</html>' });

      await expect(employeeApi.getAllList()).rejects.toThrow(
        'API returned HTML instead of JSON'
      );
    });

    it('throws on unexpected response format', async () => {
      mockedApi.get.mockResolvedValue({ data: { unexpectedField: true } });

      await expect(employeeApi.getAllList()).rejects.toThrow(
        'Unexpected response format'
      );
    });
  });

  describe('getById', () => {
    it('sends GET to /api/empleados/:id', async () => {
      mockedApi.get.mockResolvedValue({ data: mockEmpleado });

      const result = await employeeApi.getById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/empleados/1');
      expect(result.nombre).toBe('Carlos');
    });
  });

  describe('create', () => {
    it('sends POST to /api/empleados', async () => {
      mockedApi.post.mockResolvedValue({ data: mockEmpleado });

      const result = await employeeApi.create({ nombre: 'Carlos' } as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/api/empleados', { nombre: 'Carlos' });
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('sends PUT to /api/empleados/:id', async () => {
      const updated = { ...mockEmpleado, nombre: 'Updated' };
      mockedApi.put.mockResolvedValue({ data: updated });

      const result = await employeeApi.update(1, { nombre: 'Updated' } as any);

      expect(mockedApi.put).toHaveBeenCalledWith('/api/empleados/1', { nombre: 'Updated' });
      expect(result.nombre).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('sends DELETE to /api/empleados/:id', async () => {
      mockedApi.delete.mockResolvedValue({});

      await employeeApi.delete(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/empleados/1');
    });
  });

  describe('getByDni', () => {
    it('sends GET to /api/empleados/dni/:dni', async () => {
      mockedApi.get.mockResolvedValue({ data: mockEmpleado });

      const result = await employeeApi.getByDni('12345678');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/empleados/dni/12345678');
      expect(result.dni).toBe('12345678');
    });
  });

  describe('getByEstado', () => {
    it('sends GET to /api/empleados/estado/:estado', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockEmpleado] });

      const result = await employeeApi.getByEstado('ACTIVO');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/empleados/estado/ACTIVO');
      expect(result).toEqual([mockEmpleado]);
    });
  });

  describe('changeEstado', () => {
    it('sends PATCH to /api/empleados/:id/estado', async () => {
      const updated = { ...mockEmpleado, estado: 'INACTIVO' };
      mockedApi.patch.mockResolvedValue({ data: updated });

      const result = await employeeApi.changeEstado(1, 'INACTIVO');

      expect(mockedApi.patch).toHaveBeenCalledWith('/api/empleados/1/estado', null, {
        params: { estado: 'INACTIVO' },
      });
      expect(result.estado).toBe('INACTIVO');
    });
  });
});
