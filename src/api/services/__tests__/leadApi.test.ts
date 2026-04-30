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
import { leadApi } from '../leadApi';

const mockedApi = vi.mocked(api, true);

const mockLead = {
  id: 1,
  nombre: 'Juan',
  telefono: '123456',
  canal: 'WEB',
  estadoLead: 'PRIMER_CONTACTO',
};

const mockPageResponse = {
  content: [mockLead],
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
  numberOfElements: 1,
  empty: false,
};

describe('leadApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('sends GET to /api/leads with pagination and filters', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPageResponse });

      const result = await leadApi.getAll({ page: 0, size: 20 }, { busqueda: 'test' });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/leads', {
        params: { busqueda: 'test', page: 0, size: 20 },
      });
      expect(result.content).toEqual([mockLead]);
    });

    it('works with default pagination', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPageResponse });

      await leadApi.getAll();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/leads', {
        params: {},
      });
    });
  });

  describe('getById', () => {
    it('sends GET to /api/leads/:id', async () => {
      mockedApi.get.mockResolvedValue({ data: mockLead });

      const result = await leadApi.getById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/leads/1');
      expect(result.nombre).toBe('Juan');
    });
  });

  describe('getByEstado (deprecated)', () => {
    it('throws deprecation error', async () => {
      await expect(leadApi.getByEstado('PRIMER_CONTACTO' as any)).rejects.toThrow(
        'Use leadApi.getAll with filters instead'
      );
    });
  });

  describe('getByPrioridad (deprecated)', () => {
    it('throws deprecation error', async () => {
      await expect(leadApi.getByPrioridad('HOT' as any)).rejects.toThrow(
        'Use leadApi.getAll with filters instead'
      );
    });
  });

  describe('getProximosSeguimiento', () => {
    it('sends GET to /api/leads/proximos-seguimiento', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPageResponse });

      const result = await leadApi.getProximosSeguimiento({ page: 0, size: 10 });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/leads/proximos-seguimiento', {
        params: { page: 0, size: 10 },
      });
      expect(result.content).toEqual([mockLead]);
    });
  });

  describe('create', () => {
    it('sends POST to /api/leads', async () => {
      const newLead = { nombre: 'New', telefono: '999', canal: 'EMAIL', estadoLead: 'PRIMER_CONTACTO' };
      mockedApi.post.mockResolvedValue({ data: { id: 5, ...newLead } });

      const result = await leadApi.create(newLead as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/api/leads', newLead);
      expect(result.id).toBe(5);
    });

    it('rechaza con el body 409 cuando el teléfono ya existe (TELEFONO_DUPLICADO)', async () => {
      const conflictError = {
        response: {
          status: 409,
          data: {
            tipo: 'TELEFONO_DUPLICADO',
            existingId: 42,
            existingType: 'LEAD',
            existingNombre: 'Juan Pérez',
            telefono: '1112345678',
          },
        },
      };
      mockedApi.post.mockRejectedValue(conflictError);

      await expect(
        leadApi.create({ nombre: 'Test', telefono: '1112345678' } as any)
      ).rejects.toMatchObject({
        response: {
          status: 409,
          data: { tipo: 'TELEFONO_DUPLICADO', existingId: 42 },
        },
      });
    });
  });

  describe('update', () => {
    it('sends PUT to /api/leads/:id', async () => {
      const update = { nombre: 'Updated' };
      mockedApi.put.mockResolvedValue({ data: { id: 1, ...update } });

      const result = await leadApi.update(1, update);

      expect(mockedApi.put).toHaveBeenCalledWith('/api/leads/1', update);
      expect(result.nombre).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('sends DELETE to /api/leads/:id', async () => {
      mockedApi.delete.mockResolvedValue({});

      await leadApi.delete(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/leads/1');
    });
  });

  describe('convertir', () => {
    it('sends POST to /api/leads/:id/convertir', async () => {
      const conversionData = { emailCliente: 'test@test.com' };
      mockedApi.post.mockResolvedValue({ data: { leadId: 1, clienteId: 10 } });

      const result = await leadApi.convertir(1, conversionData as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/api/leads/1/convertir', conversionData);
      expect(result.clienteId).toBe(10);
    });
  });

  describe('interacciones', () => {
    it('getInteracciones sends GET', async () => {
      const interactions = [{ id: 1, tipo: 'LLAMADA' }];
      mockedApi.get.mockResolvedValue({ data: interactions });

      const result = await leadApi.getInteracciones(5);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/leads/5/interacciones');
      expect(result).toEqual(interactions);
    });

    it('createInteraccion sends POST', async () => {
      const interaccion = { tipo: 'EMAIL', descripcion: 'Sent email' };
      mockedApi.post.mockResolvedValue({ data: { id: 1, ...interaccion } });

      const result = await leadApi.createInteraccion(5, interaccion as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/api/leads/5/interacciones', interaccion);
      expect(result.id).toBe(1);
    });

    it('updateInteraccion sends PUT', async () => {
      mockedApi.put.mockResolvedValue({ data: { id: 1, descripcion: 'Updated' } });

      await leadApi.updateInteraccion(5, 1, { descripcion: 'Updated' } as any);

      expect(mockedApi.put).toHaveBeenCalledWith('/api/leads/5/interacciones/1', { descripcion: 'Updated' });
    });

    it('deleteInteraccion sends DELETE', async () => {
      mockedApi.delete.mockResolvedValue({});

      await leadApi.deleteInteraccion(5, 1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/leads/5/interacciones/1');
    });
  });

  describe('recordatorios', () => {
    it('getRecordatorios sends GET', async () => {
      const recs = [{ id: 1, tipo: 'LLAMADA' }];
      mockedApi.get.mockResolvedValue({ data: recs });

      const result = await leadApi.getRecordatorios(5);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/leads/5/recordatorios');
      expect(result).toEqual(recs);
    });

    it('createRecordatorio sends POST', async () => {
      const rec = { fechaRecordatorio: '2024-03-01', tipo: 'TAREA', mensaje: 'Test' };
      mockedApi.post.mockResolvedValue({ data: { id: 1, ...rec } });

      await leadApi.createRecordatorio(5, rec as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/api/leads/5/recordatorios', rec);
    });

    it('updateRecordatorio sends PUT', async () => {
      mockedApi.put.mockResolvedValue({ data: { id: 1, mensaje: 'Updated' } });

      await leadApi.updateRecordatorio(5, 1, { mensaje: 'Updated' } as any);

      expect(mockedApi.put).toHaveBeenCalledWith('/api/leads/5/recordatorios/1', { mensaje: 'Updated' });
    });

    it('deleteRecordatorio sends DELETE', async () => {
      mockedApi.delete.mockResolvedValue({});

      await leadApi.deleteRecordatorio(5, 1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/leads/5/recordatorios/1');
    });

    it('marcarRecordatorioEnviado sends PATCH', async () => {
      mockedApi.patch.mockResolvedValue({ data: { id: 1, enviado: true } });

      const result = await leadApi.marcarRecordatorioEnviado(5, 1);

      expect(mockedApi.patch).toHaveBeenCalledWith('/api/leads/5/recordatorios/1/marcar-enviado');
      expect(result.enviado).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('sends GET to /api/dashboard/leads/statistics', async () => {
      mockedApi.get.mockResolvedValue({ data: { totalLeads: 100 } });

      const result = await leadApi.getStatistics();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/dashboard/leads/statistics');
      expect(result.totalLeads).toBe(100);
    });
  });
});
