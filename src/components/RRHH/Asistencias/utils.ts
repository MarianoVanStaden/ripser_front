// FRONT-003: extracted from AsistenciasPage.tsx — pure helpers used by the
// page and its dialogs.
import type { Empleado } from '../../../types';

/** "Nombre Apellido" for an empleado.  Used in autocompletes and tables. */
export const getEmpleadoNombre = (empleado: Empleado): string => {
  return `${empleado.nombre} ${empleado.apellido}`;
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
