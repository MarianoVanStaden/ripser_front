import { describe, it, expect } from 'vitest';
import { calcularHorasTrabajadas, buildLicenciaRows } from '../utils';
import type { Empleado, Licencia, RegistroAsistencia } from '../../../../types';

// Caracterización de los helpers de asistencia: horas trabajadas (insumo de
// sueldos/presentismo) y expansión de licencias día a día para las tablas.
// Fixtures mínimas con cast (mismo patrón que otros tests del repo) — sólo
// importan los campos que la lógica lee.

const emp = (id: number): Empleado => ({ id, nombre: `Emp ${id}` } as unknown as Empleado);
const lic = (over: Partial<Licencia> & { empleadoId?: number }): Licencia => ({
  id: 1,
  estado: 'APROBADA',
  fechaInicio: '2026-07-10',
  fechaFin: '2026-07-12',
  empleadoId: 5,
  ...over,
} as unknown as Licencia);
const asis = (empleadoId: number, fecha: string): RegistroAsistencia =>
  ({ empleado: { id: empleadoId }, fecha } as unknown as RegistroAsistencia);

describe('Asistencias/utils', () => {
  describe('calcularHorasTrabajadas', () => {
    it('calcula la diferencia HH:mm en horas', () => {
      expect(calcularHorasTrabajadas('09:00', '17:30')).toBe(8.5);
      expect(calcularHorasTrabajadas('08:00', '12:00')).toBe(4);
    });

    it('redondea a 2 decimales', () => {
      expect(calcularHorasTrabajadas('09:00', '09:20')).toBe(0.33); // 20min = 0.333...
      expect(calcularHorasTrabajadas('09:00', '09:10')).toBe(0.17); // 10min = 0.1667
    });

    it('clampa a 0 cuando la salida es anterior a la entrada', () => {
      expect(calcularHorasTrabajadas('17:00', '09:00')).toBe(0);
    });

    it('devuelve 0 si falta entrada o salida', () => {
      expect(calcularHorasTrabajadas('', '17:00')).toBe(0);
      expect(calcularHorasTrabajadas('09:00', '')).toBe(0);
    });
  });

  describe('buildLicenciaRows', () => {
    const empleados = [emp(5)];

    it('devuelve [] si no hay licencias', () => {
      expect(buildLicenciaRows(undefined, [], empleados, '2026-07-01', '2026-07-31')).toEqual([]);
      expect(buildLicenciaRows([], [], empleados, '2026-07-01', '2026-07-31')).toEqual([]);
    });

    it('expande una licencia APROBADA día por día dentro del rango', () => {
      const rows = buildLicenciaRows(
        [lic({ id: 9, fechaInicio: '2026-07-10', fechaFin: '2026-07-12', empleadoId: 5 })],
        [],
        empleados,
        '2026-07-01',
        '2026-07-31',
      );
      expect(rows.map((r) => r.fecha)).toEqual(['2026-07-10', '2026-07-11', '2026-07-12']);
      expect(rows.every((r) => r.empleadoId === 5)).toBe(true);
      expect(rows[0].empleado).toBe(empleados[0]);
    });

    it('saltea los días que ya tienen un registro de asistencia real', () => {
      const rows = buildLicenciaRows(
        [lic({ id: 9, fechaInicio: '2026-07-10', fechaFin: '2026-07-12', empleadoId: 5 })],
        [asis(5, '2026-07-11')], // fichó ese día → no debe aparecer la fila de licencia
        empleados,
        '2026-07-01',
        '2026-07-31',
      );
      expect(rows.map((r) => r.fecha)).toEqual(['2026-07-10', '2026-07-12']);
    });

    it('ignora licencias no APROBADAS', () => {
      const rows = buildLicenciaRows(
        [lic({ id: 9, estado: 'PENDIENTE' as Licencia['estado'], empleadoId: 5 })],
        [],
        empleados,
        '2026-07-01',
        '2026-07-31',
      );
      expect(rows).toEqual([]);
    });

    it('recorta la licencia al rango [desde, hasta] pedido', () => {
      const rows = buildLicenciaRows(
        [lic({ id: 9, fechaInicio: '2026-06-28', fechaFin: '2026-07-03', empleadoId: 5 })],
        [],
        empleados,
        '2026-07-01',
        '2026-07-31',
      );
      // Sólo los días dentro de julio (28-30 junio quedan fuera).
      expect(rows.map((r) => r.fecha)).toEqual(['2026-07-01', '2026-07-02', '2026-07-03']);
    });
  });
});
