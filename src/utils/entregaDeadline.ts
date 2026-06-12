/**
 * Shared utilities for calculating and displaying the "días hasta entrega estimada"
 * indicator. Used in TripsPage, RegistroVentasPage, and anywhere a factura is shown.
 */

import React from 'react';
import { Typography, Chip } from '@mui/material';

export interface EntregaInfo {
  /** Fecha estimada formateada (ej. "15/07/2026") */
  fecha: string;
  /** Días transcurridos desde la emisión de la factura */
  transcurridos: number;
  /** Días restantes hasta la fecha estimada; negativo = atrasada */
  restantes: number;
}

const DIA_MS = 86400000;

/**
 * Calcula los días restantes hasta la entrega estimada.
 * @param fechaEmision  ISO string de la fechaEmision de la factura
 * @param diasLimite    Parámetro configurable DIAS_ENTREGA_ESTIMADA (default 25)
 */
export function calcEntregaInfo(
  fechaEmision: string | null | undefined,
  diasLimite: number
): EntregaInfo | null {
  if (!fechaEmision) return null;
  const base = new Date(fechaEmision);
  if (isNaN(base.getTime())) return null;

  const hoy = new Date();
  const dBase = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate());
  const dHoy = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dEst = dBase + diasLimite * DIA_MS;

  return {
    fecha: new Date(dEst).toLocaleDateString('es-AR'),
    transcurridos: Math.max(0, Math.round((dHoy - dBase) / DIA_MS)),
    restantes: Math.round((dEst - dHoy) / DIA_MS),
  };
}

/**
 * Chip compacto de una línea que muestra días restantes.
 * Verde → >5 días, Amarillo → ≤5 días, Rojo → atrasada.
 */
export function EntregaDeadlineChip({
  info,
}: {
  info: EntregaInfo | null;
  diasLimite: number;
}): React.ReactElement | null {
  if (!info) return null;

  const color: 'error' | 'warning' | 'info' =
    info.restantes < 0 ? 'error' : info.restantes <= 5 ? 'warning' : 'info';

  const label =
    info.restantes >= 0
      ? `${info.restantes}d restantes`
      : `Atrasada ${Math.abs(info.restantes)}d`;

  return React.createElement(Chip, {
    label,
    color,
    size: 'small',
    variant: 'outlined',
    sx: { fontSize: '0.68rem', height: 20, ml: 0.5 },
  });
}

/**
 * Bloque de dos líneas para vistas de detalle (usado en TripsPage).
 */
export function EntregaDeadlineDetail({
  info,
  diasLimite,
}: {
  info: EntregaInfo | null;
  diasLimite: number;
}): React.ReactElement | null {
  if (!info) return null;
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      Typography,
      { variant: 'caption', color: 'info.main', display: 'block' },
      `Entrega estimada: ${info.fecha}`
    ),
    React.createElement(
      Typography,
      {
        variant: 'caption',
        color: info.restantes < 0 ? 'error.main' : 'text.secondary',
        display: 'block',
      },
      `Transcurridos ${info.transcurridos} de ${diasLimite} d · ${
        info.restantes >= 0 ? `faltan ${info.restantes} d` : `atrasada ${Math.abs(info.restantes)} d`
      }`
    )
  );
}
