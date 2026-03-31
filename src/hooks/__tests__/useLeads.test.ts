import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLeads, useLead } from '../useLeads';
import type { PageResponse } from '../../types/pagination.types';

vi.mock('../../api/services/leadApi', () => ({
  leadApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { leadApi } from '../../api/services/leadApi';
const mockedLeadApi = vi.mocked(leadApi);

const makeLead = (id: number) => ({
  id,
  nombre: `Lead ${id}`,
  telefono: '123456',
  canal: 'WEB',
  estadoLead: 'PRIMER_CONTACTO',
});

const makePageResponse = (items: any[], total?: number): PageResponse<any> => ({
  content: items,
  totalElements: total ?? items.length,
  totalPages: Math.ceil((total ?? items.length) / 20),
  size: 20,
  number: 0,
  first: true,
  last: true,
  numberOfElements: items.length,
  empty: items.length === 0,
});

describe('useLeads', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('starts with empty state', () => {
    const { result } = renderHook(() => useLeads());

    expect(result.current.leads).toEqual([]);
    expect(result.current.totalElements).toBe(0);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loads leads with default params', async () => {
    const leads = [makeLead(1), makeLead(2)];
    mockedLeadApi.getAll.mockResolvedValue(makePageResponse(leads, 50));

    const { result } = renderHook(() => useLeads());

    await act(async () => {
      await result.current.loadLeads();
    });

    expect(mockedLeadApi.getAll).toHaveBeenCalledWith({ page: 0, size: 20 }, {});
    expect(result.current.leads).toEqual(leads);
    expect(result.current.totalElements).toBe(50);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loads leads with custom filters and pagination', async () => {
    mockedLeadApi.getAll.mockResolvedValue(makePageResponse([]));

    const { result } = renderHook(() => useLeads());

    const filters = { busqueda: 'test', sucursalId: 5 };
    await act(async () => {
      await result.current.loadLeads(filters, 2, 50);
    });

    expect(mockedLeadApi.getAll).toHaveBeenCalledWith({ page: 2, size: 50 }, filters);
  });

  it('sets error on load failure', async () => {
    mockedLeadApi.getAll.mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() => useLeads());

    await act(async () => {
      await result.current.loadLeads();
    });

    expect(result.current.error).toBe('Error al cargar los leads');
    expect(result.current.loading).toBe(false);
  });

  it('creates a lead and prepends it to the list', async () => {
    const newLead = makeLead(10);
    mockedLeadApi.create.mockResolvedValue(newLead as any);

    const { result } = renderHook(() => useLeads());

    let created: any;
    await act(async () => {
      created = await result.current.createLead(newLead as any);
    });

    expect(created).toEqual(newLead);
    expect(result.current.leads[0]).toEqual(newLead);
  });

  it('throws on create failure', async () => {
    mockedLeadApi.create.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useLeads());

    await expect(
      act(async () => {
        await result.current.createLead({} as any);
      })
    ).rejects.toThrow('fail');
  });

  it('updates a lead in the list', async () => {
    const lead1 = makeLead(1);
    const lead2 = makeLead(2);
    mockedLeadApi.getAll.mockResolvedValue(makePageResponse([lead1, lead2]));

    const { result } = renderHook(() => useLeads());

    await act(async () => {
      await result.current.loadLeads();
    });

    const updated = { ...lead1, nombre: 'Updated' };
    mockedLeadApi.update.mockResolvedValue(updated as any);

    await act(async () => {
      await result.current.updateLead(1, updated as any);
    });

    expect(result.current.leads[0].nombre).toBe('Updated');
    expect(result.current.leads[1]).toEqual(lead2);
  });

  it('throws on update failure', async () => {
    mockedLeadApi.update.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useLeads());

    await expect(
      act(async () => {
        await result.current.updateLead(1, {} as any);
      })
    ).rejects.toThrow('fail');
  });

  it('deletes a lead from the list', async () => {
    const lead1 = makeLead(1);
    const lead2 = makeLead(2);
    mockedLeadApi.getAll.mockResolvedValue(makePageResponse([lead1, lead2]));

    const { result } = renderHook(() => useLeads());

    await act(async () => {
      await result.current.loadLeads();
    });

    mockedLeadApi.delete.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.deleteLead(1);
    });

    expect(result.current.leads).toEqual([lead2]);
  });

  it('throws on delete failure', async () => {
    mockedLeadApi.delete.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useLeads());

    await expect(
      act(async () => {
        await result.current.deleteLead(1);
      })
    ).rejects.toThrow('fail');
  });
});

describe('useLead', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('loads lead on mount when id is provided', async () => {
    const lead = makeLead(5);
    mockedLeadApi.getById.mockResolvedValue(lead as any);

    const { result } = renderHook(() => useLead(5));

    await waitFor(() => {
      expect(result.current.lead).toEqual(lead);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does not load when id is undefined', async () => {
    const { result } = renderHook(() => useLead(undefined));

    await new Promise((r) => setTimeout(r, 50));

    expect(mockedLeadApi.getById).not.toHaveBeenCalled();
    expect(result.current.lead).toBeNull();
  });

  it('sets error on load failure', async () => {
    mockedLeadApi.getById.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useLead(999));

    await waitFor(() => {
      expect(result.current.error).toBe('Error al cargar el lead');
    });

    expect(result.current.lead).toBeNull();
  });

  it('reloads when calling reload()', async () => {
    mockedLeadApi.getById.mockResolvedValue(makeLead(1) as any);

    const { result } = renderHook(() => useLead(1));

    await waitFor(() => {
      expect(result.current.lead).not.toBeNull();
    });

    mockedLeadApi.getById.mockResolvedValue({ ...makeLead(1), nombre: 'Reloaded' } as any);

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.lead?.nombre).toBe('Reloaded');
    expect(mockedLeadApi.getById).toHaveBeenCalledTimes(2);
  });
});
