import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionState } from '../useSessionState';

describe('useSessionState', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('usa el valor inicial cuando no hay nada en storage', () => {
    const { result } = renderHook(() => useSessionState('k:search', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('rehidrata desde sessionStorage si ya hay un valor guardado', () => {
    sessionStorage.setItem('k:search', JSON.stringify('Sosa'));
    const { result } = renderHook(() => useSessionState('k:search', ''));
    expect(result.current[0]).toBe('Sosa');
  });

  it('persiste en sessionStorage al actualizar', () => {
    const { result } = renderHook(() => useSessionState('k:tipo', ''));
    act(() => { result.current[1]('MAYORISTA'); });
    expect(result.current[0]).toBe('MAYORISTA');
    expect(JSON.parse(sessionStorage.getItem('k:tipo')!)).toBe('MAYORISTA');
  });

  it('un montaje nuevo recupera lo que dejó el anterior (simula volver a la lista)', () => {
    const first = renderHook(() => useSessionState('k:estados', [] as string[]));
    act(() => { first.result.current[1](['NUEVO', 'CONTACTADO']); });
    first.unmount();

    const second = renderHook(() => useSessionState('k:estados', [] as string[]));
    expect(second.result.current[0]).toEqual(['NUEVO', 'CONTACTADO']);
  });

  it('soporta booleanos y objetos', () => {
    const { result } = renderHook(() => useSessionState('k:solo', false));
    act(() => { result.current[1](true); });
    expect(JSON.parse(sessionStorage.getItem('k:solo')!)).toBe(true);
  });

  it('cae al valor inicial si el JSON guardado es inválido', () => {
    sessionStorage.setItem('k:x', '{no-json');
    const { result } = renderHook(() => useSessionState('k:x', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });
});
