import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecordatoriosLeads } from '../useRecordatoriosLeads';

vi.mock('../../api/services/recordatorioLeadApi', () => ({
  recordatorioLeadApi: {
    getAll: vi.fn(),
    getConteos: vi.fn(),
    marcarEnviado: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../api/services/leadApi', () => ({
  leadApi: {
    getAll: vi.fn(),
    getRecordatorios: vi.fn(),
    marcarRecordatorioEnviado: vi.fn(),
    updateRecordatorio: vi.fn(),
    createInteraccion: vi.fn(),
    createRecordatorio: vi.fn(),
  },
}));

import { recordatorioLeadApi } from '../../api/services/recordatorioLeadApi';
import { leadApi } from '../../api/services/leadApi';

const mockedRecApi = vi.mocked(recordatorioLeadApi);
const mockedLeadApi = vi.mocked(leadApi);

const makeRecordatorio = (id: number, fecha: string) => ({
  id,
  fechaRecordatorio: fecha,
  tipo: 'LLAMADA',
  mensaje: `Recordatorio ${id}`,
  enviado: false,
  lead: {
    id: 100,
    nombre: 'Lead Test',
    telefono: '123',
    estadoLead: 'PRIMER_CONTACTO',
    prioridad: 'WARM',
    score: 50,
  },
});

describe('useRecordatoriosLeads', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('starts with initial state', () => {
    const { result } = renderHook(() => useRecordatoriosLeads());

    expect(result.current.recordatorios).toEqual([]);
    expect(result.current.totalElements).toBe(0);
    expect(result.current.conteos).toEqual({ totalPendientes: 0, vencidos: 0, hoy: 0 });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.usingFallback).toBe(false);
  });

  it('loads recordatorios from global endpoint', async () => {
    const recs = [makeRecordatorio(1, '2024-01-15'), makeRecordatorio(2, '2024-01-10')];
    mockedRecApi.getAll.mockResolvedValue({
      content: recs,
      totalElements: 2,
      totalPages: 1,
      size: 500,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 2,
      empty: false,
    } as any);
    mockedRecApi.getConteos.mockResolvedValue({ totalPendientes: 5, vencidos: 2, hoy: 1 });

    const { result } = renderHook(() => useRecordatoriosLeads());

    await act(async () => {
      await result.current.loadRecordatorios();
    });

    expect(result.current.recordatorios).toHaveLength(2);
    // Sorted by date ascending
    expect(result.current.recordatorios[0].fechaRecordatorio).toBe('2024-01-10');
    expect(result.current.totalElements).toBe(2);
    expect(result.current.usingFallback).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('falls back to lead-based loading on 403', async () => {
    // Global endpoint returns 403
    mockedRecApi.getAll.mockRejectedValue({ response: { status: 403 } });
    mockedRecApi.getConteos.mockResolvedValue({ totalPendientes: 0, vencidos: 0, hoy: 0 });

    // Fallback: loadViaLeads
    mockedLeadApi.getAll.mockResolvedValue({
      content: [{ id: 1, nombre: 'Lead 1', prioridad: 'HOT' }],
      totalElements: 1,
      totalPages: 1,
      size: 500,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 1,
      empty: false,
    } as any);
    mockedLeadApi.getRecordatorios.mockResolvedValue([
      {
        id: 10,
        fechaRecordatorio: '2024-01-20',
        tipo: 'EMAIL',
        mensaje: 'test',
        enviado: false,
      },
    ] as any);

    const { result } = renderHook(() => useRecordatoriosLeads());

    await act(async () => {
      await result.current.loadRecordatorios();
    });

    expect(result.current.usingFallback).toBe(true);
    expect(result.current.recordatorios).toHaveLength(1);
  });

  it('falls back on 404 as well', async () => {
    mockedRecApi.getAll.mockRejectedValue({ response: { status: 404 } });
    mockedRecApi.getConteos.mockResolvedValue({ totalPendientes: 0, vencidos: 0, hoy: 0 });
    mockedLeadApi.getAll.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 500,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 0,
      empty: true,
    } as any);

    const { result } = renderHook(() => useRecordatoriosLeads());

    await act(async () => {
      await result.current.loadRecordatorios();
    });

    expect(result.current.usingFallback).toBe(true);
  });

  it('does NOT fallback on 500 - sets error instead', async () => {
    mockedRecApi.getAll.mockRejectedValue({ response: { status: 500 } });
    mockedRecApi.getConteos.mockResolvedValue({ totalPendientes: 0, vencidos: 0, hoy: 0 });

    const { result } = renderHook(() => useRecordatoriosLeads());

    await act(async () => {
      await result.current.loadRecordatorios();
    });

    expect(result.current.error).toBe('Error al cargar los recordatorios. Verifique la conexión con el servidor.');
    expect(result.current.usingFallback).toBe(false);
  });

  it('marcarCompletado removes recordatorio via global endpoint', async () => {
    // Setup loaded state via global endpoint
    const recs = [makeRecordatorio(1, '2024-01-15'), makeRecordatorio(2, '2024-01-10')];
    mockedRecApi.getAll.mockResolvedValue({
      content: recs,
      totalElements: 2,
      totalPages: 1,
      size: 500,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 2,
      empty: false,
    } as any);
    mockedRecApi.getConteos.mockResolvedValue({ totalPendientes: 5, vencidos: 0, hoy: 0 });
    mockedRecApi.marcarEnviado.mockResolvedValue({} as any);

    const { result } = renderHook(() => useRecordatoriosLeads());

    await act(async () => {
      await result.current.loadRecordatorios();
    });

    await act(async () => {
      await result.current.marcarCompletado(1, 100);
    });

    expect(mockedRecApi.marcarEnviado).toHaveBeenCalledWith(1);
    expect(result.current.recordatorios).toHaveLength(1);
    expect(result.current.totalElements).toBe(1);
  });

  it('marcarCompletado falls back to per-lead endpoint on error', async () => {
    // Setup loaded state via global
    const recs = [makeRecordatorio(1, '2024-01-15')];
    mockedRecApi.getAll.mockResolvedValue({
      content: recs,
      totalElements: 1,
      totalPages: 1,
      size: 500,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 1,
      empty: false,
    } as any);
    mockedRecApi.getConteos.mockResolvedValue({ totalPendientes: 1, vencidos: 0, hoy: 0 });

    // Global marcarEnviado fails
    mockedRecApi.marcarEnviado.mockRejectedValue(new Error('fail'));
    mockedLeadApi.marcarRecordatorioEnviado.mockResolvedValue({} as any);

    const { result } = renderHook(() => useRecordatoriosLeads());

    await act(async () => {
      await result.current.loadRecordatorios();
    });

    await act(async () => {
      await result.current.marcarCompletado(1, 100);
    });

    expect(mockedLeadApi.marcarRecordatorioEnviado).toHaveBeenCalledWith(100, 1);
    expect(result.current.recordatorios).toHaveLength(0);
  });

  it('crearInteraccion delegates to leadApi', async () => {
    const interaccion = { tipo: 'LLAMADA', descripcion: 'Test call' };
    mockedLeadApi.createInteraccion.mockResolvedValue({ id: 1, ...interaccion } as any);

    const { result } = renderHook(() => useRecordatoriosLeads());

    await act(async () => {
      await result.current.crearInteraccion(5, interaccion as any);
    });

    expect(mockedLeadApi.createInteraccion).toHaveBeenCalledWith(5, interaccion);
  });

  it('crearRecordatorio delegates to leadApi', async () => {
    const data = { fechaRecordatorio: '2024-03-01', tipo: 'TAREA', mensaje: 'Test' };
    mockedLeadApi.createRecordatorio.mockResolvedValue({ id: 1, ...data } as any);

    const { result } = renderHook(() => useRecordatoriosLeads());

    await act(async () => {
      await result.current.crearRecordatorio(5, data as any);
    });

    expect(mockedLeadApi.createRecordatorio).toHaveBeenCalledWith(5, data);
  });

  it('reprogramar updates recordatorio date via global endpoint', async () => {
    const recs = [makeRecordatorio(1, '2024-01-15')];
    mockedRecApi.getAll.mockResolvedValue({
      content: recs,
      totalElements: 1,
      totalPages: 1,
      size: 500,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 1,
      empty: false,
    } as any);
    mockedRecApi.getConteos.mockResolvedValue({ totalPendientes: 1, vencidos: 0, hoy: 0 });
    mockedRecApi.update.mockResolvedValue({
      id: 1,
      fechaRecordatorio: '2024-02-01',
      hora: '10:00',
    } as any);

    const { result } = renderHook(() => useRecordatoriosLeads());

    await act(async () => {
      await result.current.loadRecordatorios();
    });

    await act(async () => {
      await result.current.reprogramar(1, 100, '2024-02-01');
    });

    expect(mockedRecApi.update).toHaveBeenCalledWith(1, { fechaRecordatorio: '2024-02-01' });
    expect(result.current.recordatorios[0].fechaRecordatorio).toBe('2024-02-01');
  });
});
