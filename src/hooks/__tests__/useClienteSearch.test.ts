import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useClienteSearch } from '../useClienteSearch';

vi.mock('../../api/services', () => ({
  clienteApi: {
    searchByQuery: vi.fn(),
  },
}));

import { clienteApi } from '../../api/services';
const mockedClienteApi = vi.mocked(clienteApi);

describe('useClienteSearch', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('starts with empty state', () => {
    const { result } = renderHook(() => useClienteSearch());

    expect(result.current.options).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.inputValue).toBe('');
  });

  it('does not search when input is less than 3 characters', async () => {
    const { result } = renderHook(() => useClienteSearch());

    act(() => {
      result.current.setInputValue('ab');
    });

    // Wait for debounce to settle (300ms + buffer)
    await new Promise((r) => setTimeout(r, 400));

    expect(mockedClienteApi.searchByQuery).not.toHaveBeenCalled();
    expect(result.current.options).toEqual([]);
  });

  it('searches after debounce with 3+ characters', async () => {
    const mockClientes = [{ id: 1, nombre: 'Juan' }];
    (mockedClienteApi.searchByQuery as any).mockResolvedValue({ content: mockClientes });

    const { result } = renderHook(() => useClienteSearch());

    act(() => {
      result.current.setInputValue('jua');
    });

    // Wait for debounce (300ms) + async resolution
    await waitFor(
      () => {
        expect(mockedClienteApi.searchByQuery).toHaveBeenCalledWith(
          'jua',
          10,
          expect.any(Object) // AbortSignal
        );
      },
      { timeout: 2000 }
    );
  });

  it('clears options when input is emptied', () => {
    const { result } = renderHook(() => useClienteSearch());

    act(() => {
      result.current.setInputValue('test');
    });

    act(() => {
      result.current.setInputValue('');
    });

    expect(result.current.options).toEqual([]);
  });

  it('clears options when input drops below 3 chars', async () => {
    const { result } = renderHook(() => useClienteSearch());

    act(() => {
      result.current.setInputValue('te');
    });

    await new Promise((r) => setTimeout(r, 400));

    expect(result.current.options).toEqual([]);
  });

  it('ignores canceled request errors', async () => {
    const cancelError = { name: 'CanceledError', code: 'ERR_CANCELED' };
    (mockedClienteApi.searchByQuery as any).mockRejectedValue(cancelError);

    const { result } = renderHook(() => useClienteSearch());

    act(() => {
      result.current.setInputValue('test');
    });

    // Wait for debounce + promise rejection
    await waitFor(
      () => {
        expect(mockedClienteApi.searchByQuery).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    // Should not log cancel errors specifically
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      'Error buscando clientes:',
      expect.objectContaining({ name: 'CanceledError' })
    );
  });
});
