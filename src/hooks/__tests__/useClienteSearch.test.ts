import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClienteSearch } from '../useClienteSearch';

vi.mock('../../api/services', () => ({
  clienteApi: {
    searchByQuery: vi.fn(),
  },
}));

import { clienteApi } from '../../api/services';
const mockedClienteApi = vi.mocked(clienteApi);

// Avanza el debounce (300ms) y vacía las microtareas pendientes en un solo paso.
const flushDebounce = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
};

describe('useClienteSearch', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  it('arranca con estado vacío', () => {
    const { result } = renderHook(() => useClienteSearch());
    expect(result.current.options).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.inputValue).toBe('');
  });

  it('no busca con menos de 3 caracteres', async () => {
    const { result } = renderHook(() => useClienteSearch());
    act(() => result.current.setInputValue('ab'));
    await flushDebounce();
    expect(mockedClienteApi.searchByQuery).not.toHaveBeenCalled();
    expect(result.current.options).toEqual([]);
  });

  it('busca tras el debounce con 3+ caracteres, pasando un AbortSignal', async () => {
    mockedClienteApi.searchByQuery.mockResolvedValue({ content: [{ id: 1, nombre: 'Juan' }] } as never);
    const { result } = renderHook(() => useClienteSearch());

    act(() => result.current.setInputValue('jua'));
    await flushDebounce();

    expect(mockedClienteApi.searchByQuery).toHaveBeenCalledWith('jua', 10, expect.any(AbortSignal));
    expect(result.current.options).toEqual([{ id: 1, nombre: 'Juan' }]);
    expect(result.current.loading).toBe(false);
  });

  it('limpia las opciones cuando el input baja de 3 caracteres', async () => {
    mockedClienteApi.searchByQuery.mockResolvedValue({ content: [{ id: 1 }] } as never);
    const { result } = renderHook(() => useClienteSearch());

    act(() => result.current.setInputValue('jua'));
    await flushDebounce();
    expect(result.current.options).toHaveLength(1);

    act(() => result.current.setInputValue('ju'));
    await flushDebounce();
    expect(result.current.options).toEqual([]);
  });

  it('cancela el request anterior: una respuesta vieja NO pisa a la nueva (out-of-order)', async () => {
    // Mock estilo axios: aborta el request anterior rechazando con CanceledError
    // (nunca resuelve el .then viejo). Cada query queda pendiente hasta resolverla.
    const resolvers: Record<string, (content: unknown[]) => void> = {};
    mockedClienteApi.searchByQuery.mockImplementation(((
      q: string,
      _limit?: number,
      signal?: AbortSignal,
    ) =>
      new Promise((resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('canceled'), { name: 'CanceledError' }));
        });
        resolvers[q] = (content) => resolve({ content });
      })) as any);

    const { result } = renderHook(() => useClienteSearch());

    // 1ª query 'jua' queda en vuelo (respuesta lenta).
    act(() => result.current.setInputValue('jua'));
    await flushDebounce();

    // El usuario sigue tipeando → 'juan' aborta a 'jua' y arranca su propio request.
    act(() => result.current.setInputValue('juan'));
    await flushDebounce();

    // Resolvemos la NUEVA; la vieja ya fue abortada (rechazada), no puede pisar.
    await act(async () => {
      resolvers['juan']([{ id: 2, nombre: 'Juan Nuevo' }]);
    });
    expect(result.current.options).toEqual([{ id: 2, nombre: 'Juan Nuevo' }]);

    // Aun si la vieja "llegara" tarde, su promesa ya está resuelta como rechazo:
    resolvers['jua']?.([{ id: 1, nombre: 'Cliente Viejo' }]);
    await act(async () => { await Promise.resolve(); });
    expect(result.current.options).toEqual([{ id: 2, nombre: 'Juan Nuevo' }]);

    // El error de cancelación no debe loguearse como error real.
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
