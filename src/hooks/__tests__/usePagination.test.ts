import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePagination } from '../usePagination';
import type { PageResponse } from '../../types/pagination.types';

const makePage = <T>(content: T[], total = content.length): PageResponse<T> => ({
  content,
  totalElements: total,
  totalPages: Math.ceil(total / 20),
  size: 20,
  number: 0,
  first: true,
  last: true,
  numberOfElements: content.length,
  empty: content.length === 0,
});

describe('usePagination', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    // Suppress expected console.error from error-handling tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(makePage(['item1', 'item2'], 2));
  });

  it('fetches data on mount by default', async () => {
    renderHook(() => usePagination({ fetchFn: mockFetch }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    expect(mockFetch).toHaveBeenCalledWith(0, 20, '', {});
  });

  it('does not fetch on mount when fetchOnMount is false', async () => {
    renderHook(() => usePagination({ fetchFn: mockFetch, fetchOnMount: false }));

    // Give it a tick
    await new Promise(r => setTimeout(r, 50));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('populates data from response', async () => {
    const { result } = renderHook(() => usePagination({ fetchFn: mockFetch }));

    await waitFor(() => {
      expect(result.current.data).toEqual(['item1', 'item2']);
    });
    expect(result.current.totalElements).toBe(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('uses custom initial size', async () => {
    renderHook(() => usePagination({ fetchFn: mockFetch, initialSize: 50 }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(0, 50, '', {});
    });
  });

  it('uses custom default sort', async () => {
    renderHook(() => usePagination({ fetchFn: mockFetch, defaultSort: 'nombre,asc' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(0, 20, 'nombre,asc', {});
    });
  });

  it('re-fetches when page changes', async () => {
    const { result } = renderHook(() => usePagination({ fetchFn: mockFetch }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    act(() => { result.current.setPage(1); });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(1, 20, '', {});
    });
  });

  it('resets page to 0 when size changes', async () => {
    const { result } = renderHook(() => usePagination({ fetchFn: mockFetch }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    act(() => { result.current.setPage(2); });
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => { result.current.setSize(50); });
    await waitFor(() => {
      expect(result.current.page).toBe(0);
    });
  });

  it('resets page to 0 when filters change', async () => {
    const { result } = renderHook(() => usePagination({ fetchFn: mockFetch }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    act(() => { result.current.setPage(3); });
    await waitFor(() => expect(result.current.page).toBe(3));

    act(() => { result.current.setFilters({ search: 'test' }); });
    await waitFor(() => {
      expect(result.current.page).toBe(0);
    });
  });

  it('resets page to 0 when sort changes', async () => {
    const { result } = renderHook(() => usePagination({ fetchFn: mockFetch }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    act(() => { result.current.setPage(2); });
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => { result.current.setSort('precio,desc'); });
    await waitFor(() => {
      expect(result.current.page).toBe(0);
    });
  });

  it('handles fetch errors gracefully', async () => {
    const failFetch = vi.fn().mockRejectedValue({
      response: { data: { message: 'Server error' } },
    });

    const { result } = renderHook(() => usePagination({ fetchFn: failFetch }));

    await waitFor(() => {
      expect(result.current.error).toBe('Server error');
    });
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('handles errors without response.data.message', async () => {
    const failFetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePagination({ fetchFn: failFetch }));

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });

  it('refresh re-fetches data', async () => {
    const { result } = renderHook(() => usePagination({ fetchFn: mockFetch }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    await act(async () => { result.current.refresh(); });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('handleChangePage updates page', async () => {
    const { result } = renderHook(() => usePagination({ fetchFn: mockFetch }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    act(() => { result.current.handleChangePage(null, 5); });

    await waitFor(() => {
      expect(result.current.page).toBe(5);
    });
  });

  it('handleChangeRowsPerPage updates size and resets page', async () => {
    const { result } = renderHook(() => usePagination({ fetchFn: mockFetch }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.handleChangeRowsPerPage({
        target: { value: '50' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await waitFor(() => {
      expect(result.current.size).toBe(50);
      expect(result.current.page).toBe(0);
    });
  });
});
