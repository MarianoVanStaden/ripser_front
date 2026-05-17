// FRONT-003: extracted from AsistenciasPage.tsx — pure helpers used by the
// page and its dialogs.
import dayjs from 'dayjs';
import type { Empleado, Licencia, RegistroAsistencia } from '../../../types';

/** "Nombre Apellido" for an empleado.  Used in autocompletes and tables. */
export const getEmpleadoNombre = (empleado: Empleado): string => {
  return `${empleado.nombre} ${empleado.apellido}`;
};

/** Fila sintética que representa un día de licencia para mostrar en tablas
 * de asistencia (Resumen Diario / Reportes). */
export interface LicenciaRow {
  id: string;
  licencia: Licencia;
  fecha: string; // YYYY-MM-DD
  empleado?: Empleado;
  empleadoId: number;
}

/**
 * Expande las licencias APROBADAS día por día dentro de [desde, hasta] y
 * descarta los días que ya tienen un RegistroAsistencia real (evita la fila
 * duplicada cuando el empleado igualmente fichó esa fecha — el chip "En
 * Licencia" sólo aparece donde NO hay registro).
 */
export const buildLicenciaRows = (
  licencias: Licencia[] | undefined,
  asistencias: RegistroAsistencia[],
  empleados: Empleado[],
  desde: string,
  hasta: string
): LicenciaRow[] => {
  if (!Array.isArray(licencias) || licencias.length === 0) return [];

  const empleadosById = new Map<number, Empleado>();
  empleados.forEach((e) => empleadosById.set(e.id, e));

  // (empleadoId|fechaYYYY-MM-DD) → ya hay registro real
  const asistenciaKeys = new Set<string>();
  asistencias.forEach((a) => {
    if (!a.empleado?.id) return;
    asistenciaKeys.add(`${a.empleado.id}|${dayjs(a.fecha).format('YYYY-MM-DD')}`);
  });

  const dDesde = dayjs(desde);
  const dHasta = dayjs(hasta);

  return licencias
    .filter((l) => l.estado === 'APROBADA')
    .flatMap<LicenciaRow>((l) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const empId: number | undefined = (l as any).empleadoId ?? l.empleado?.id;
      if (!empId) return [];
      const li = dayjs(l.fechaInicio).isAfter(dDesde) ? dayjs(l.fechaInicio) : dDesde;
      const lf = dayjs(l.fechaFin).isBefore(dHasta) ? dayjs(l.fechaFin) : dHasta;
      const rows: LicenciaRow[] = [];
      let cur = li;
      while (!cur.isAfter(lf)) {
        const fecha = cur.format('YYYY-MM-DD');
        const key = `${empId}|${fecha}`;
        if (!asistenciaKeys.has(key)) {
          rows.push({
            id: `lic-${l.id}-${fecha}`,
            licencia: l,
            fecha,
            empleadoId: empId,
            empleado: empleadosById.get(empId) ?? l.empleado,
          });
        }
        cur = cur.add(1, 'day');
      }
      return rows;
    });
};

/**
 * Computes hours worked between an HH:mm entrada and salida string.
 * Returns 0 when either is missing.  Result is rounded to 2 decimals
 * (matching the historical behavior consumed by the asistencia form).
 */
export const calcularHorasTrabajadas = (entrada: string, salida: string): number => {
  if (!entrada || !salida) return 0;

  const [horaEntrada, minEntrada] = entrada.split(':').map(Number);
  const [horaSalida, minSalida] = salida.split(':').map(Number);

  const minutosEntrada = horaEntrada * 60 + minEntrada;
  const minutosSalida = horaSalida * 60 + minSalida;

  const diferenciaMinutos = minutosSalida - minutosEntrada;
  return Math.max(0, Math.round((diferenciaMinutos / 60) * 100) / 100);
};
