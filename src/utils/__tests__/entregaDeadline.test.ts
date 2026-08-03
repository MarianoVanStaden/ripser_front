import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { defaultFechaEntregaISO, calcEntregaInfo } from '../entregaDeadline';

// TZ fijada en vite.config (America/Argentina/Buenos_Aires, UTC-3) + reloj
// congelado → estos tests de fecha son 100% deterministas en dev y CI.
const NOW = new Date('2026-07-20T12:00:00'); // hora local, no UTC

describe('entregaDeadline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('defaultFechaEntregaISO', () => {
    it('devuelve hoy + díasEntrega en formato ISO yyyy-mm-dd', () => {
      expect(defaultFechaEntregaISO(25)).toBe('2026-08-14');
    });

    it('con 0 días devuelve hoy', () => {
      expect(defaultFechaEntregaISO(0)).toBe('2026-07-20');
    });
  });

  describe('calcEntregaInfo', () => {
    it('devuelve null sin fecha de emisión', () => {
      expect(calcEntregaInfo(null, 25)).toBeNull();
      expect(calcEntregaInfo(undefined, 25)).toBeNull();
    });

    it('devuelve null si la fecha es inválida', () => {
      expect(calcEntregaInfo('no-es-fecha', 25)).toBeNull();
    });

    it('calcula transcurridos y restantes (emisión con hora, sin corrimiento)', () => {
      // Emisión hace 5 días, límite 25 → 20 días restantes.
      const info = calcEntregaInfo('2026-07-15T12:00:00', 25)!;
      expect(info.transcurridos).toBe(5);
      expect(info.restantes).toBe(20);
      // Entrega estimada = 15/07 + 25 días = 09/08/2026 (sin corrimiento de TZ).
      expect(info.fecha).toBe('9/8/2026');
    });

    it('marca restantes negativo cuando la entrega ya venció', () => {
      const info = calcEntregaInfo('2026-06-01T12:00:00', 25)!;
      expect(info.restantes).toBeLessThan(0);
    });

    // REGRESIÓN del fix de TZ: antes, una fecha date-only 'yyyy-mm-dd' se
    // parseaba como UTC-midnight y en UTC-3 retrocedía un día → transcurridos
    // daba 6 en vez de 5. Ahora date-only y con-hora deben coincidir.
    it('no corre el día con fecha date-only (fix off-by-one por TZ)', () => {
      const conHora = calcEntregaInfo('2026-07-15T12:00:00', 25)!;
      const dateOnly = calcEntregaInfo('2026-07-15', 25)!;
      expect(dateOnly.transcurridos).toBe(conHora.transcurridos);
      expect(dateOnly.transcurridos).toBe(5);
      expect(dateOnly.fecha).toBe(conHora.fecha);
      expect(dateOnly.fecha).toBe('9/8/2026');
    });
  });
});
