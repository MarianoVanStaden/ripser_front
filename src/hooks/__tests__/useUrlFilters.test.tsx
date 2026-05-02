import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useUrlFilters } from '../useUrlFilters';
import type { FilterSchema } from '../useUrlFilters';

const schema = {
  estados: 'string[]',
  prioridades: 'string[]',
  size: 'number',
  ids: 'number[]',
  soloActivas: 'boolean',
  term: 'string',
} satisfies FilterSchema;

const wrapper =
  (initialUrl: string) =>
  ({ children }: { children: React.ReactNode }) =>
    (
      <MemoryRouter initialEntries={[initialUrl]}>
        <Routes>
          <Route path="*" element={<>{children}</>} />
        </Routes>
      </MemoryRouter>
    );

describe('useUrlFilters', () => {
  it('reads strings, numbers, booleans, and CSV arrays from the URL', () => {
    const { result } = renderHook(
      () => useUrlFilters(schema),
      { wrapper: wrapper('/?estados=NUEVA,EN_GESTION&size=25&soloActivas=true&term=ana&ids=1,2,3') }
    );

    expect(result.current.filters.estados).toEqual(['NUEVA', 'EN_GESTION']);
    expect(result.current.filters.size).toBe(25);
    expect(result.current.filters.soloActivas).toBe(true);
    expect(result.current.filters.term).toBe('ana');
    expect(result.current.filters.ids).toEqual([1, 2, 3]);
  });

  it('falls back to defaults when a key is absent from the URL', () => {
    const { result } = renderHook(
      () => useUrlFilters(schema, { soloActivas: true, size: 10 }),
      { wrapper: wrapper('/') }
    );

    expect(result.current.filters.soloActivas).toBe(true);
    expect(result.current.filters.size).toBe(10);
    expect(result.current.filters.estados).toEqual([]);
    expect(result.current.filters.term).toBeUndefined();
  });

  it('writes values back to the URL via setFilters', () => {
    let location = '';
    const Probe: React.FC = () => {
      const loc = useLocation();
      location = `${loc.pathname}${loc.search}`;
      return null;
    };

    const { result } = renderHook(() => useUrlFilters(schema), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="*" element={<>{children}<Probe /></>} />
          </Routes>
        </MemoryRouter>
      ),
    });

    act(() => {
      result.current.setFilters({ estados: ['NUEVA'], soloActivas: true });
    });

    expect(location).toContain('estados=NUEVA');
    expect(location).toContain('soloActivas=true');
  });

  it('removes the key from the URL when set to an empty value', () => {
    let location = '';
    const Probe: React.FC = () => {
      const loc = useLocation();
      location = loc.search;
      return null;
    };

    const { result } = renderHook(() => useUrlFilters(schema), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/?estados=NUEVA&term=ana']}>
          <Routes>
            <Route path="*" element={<>{children}<Probe /></>} />
          </Routes>
        </MemoryRouter>
      ),
    });

    act(() => {
      result.current.setFilters({ estados: [], term: '' });
    });

    expect(location).not.toContain('estados=');
    expect(location).not.toContain('term=');
  });

  it('resetFilters wipes all schema keys but preserves unrelated query params', () => {
    let location = '';
    const Probe: React.FC = () => {
      const loc = useLocation();
      location = loc.search;
      return null;
    };

    const { result } = renderHook(() => useUrlFilters(schema), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/?estados=NUEVA&otroParam=keep']}>
          <Routes>
            <Route path="*" element={<>{children}<Probe /></>} />
          </Routes>
        </MemoryRouter>
      ),
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(location).not.toContain('estados=');
    expect(location).toContain('otroParam=keep');
  });

  it('coerces malformed numbers to undefined', () => {
    const { result } = renderHook(
      () => useUrlFilters(schema),
      { wrapper: wrapper('/?size=notanumber') }
    );

    expect(result.current.filters.size).toBeUndefined();
  });
});
