import {
  Chip,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import type { Cliente } from '../../../types';

// ── Responsive ────────────────────────────────────────────────────────────────
// Custom hook for responsive breakpoints
export const useResponsive = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-899px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // >= 900px
  return { isMobile, isTablet, isDesktop };
};

// ── Parada libre ────────────────────────────────────────────────────────────────
// Etiquetas legibles para el motivo de una parada libre (sin factura ni OS)
export const TIPO_PARADA_LABELS: Record<string, string> = {
  GARANTIA: 'Garantía',
  RETIRO_MATERIA_PRIMA: 'Retiro de materia prima',
  OTRO: 'Otra parada',
};
export const tipoParadaLabel = (tipo?: string | null): string =>
  (tipo && TIPO_PARADA_LABELS[tipo]) || 'Parada';

// ── Estado de vehículo ────────────────────────────────────────────────────────────
export const VEHICULO_ESTADO_LABEL: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  EN_USO: 'En uso',
  MANTENIMIENTO: 'En mantenimiento',
  FUERA_SERVICIO: 'Fuera de servicio',
};

export const VEHICULO_ESTADO_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  DISPONIBLE: 'success',
  EN_USO: 'warning',
  MANTENIMIENTO: 'warning',
  FUERA_SERVICIO: 'error',
};

export const renderVehiculoEstadoChip = (estado?: string) => {
  if (!estado) return null;
  return (
    <Chip
      size="small"
      label={VEHICULO_ESTADO_LABEL[estado] || estado}
      color={VEHICULO_ESTADO_COLOR[estado] || 'default'}
      variant="outlined"
    />
  );
};

// Arma "calle, ciudad" desde un Cliente (formato compatible con Google Maps).
export const buildDireccionFromCliente = (cliente: Cliente | null | undefined): string => {
  if (!cliente) return '';
  const partes: string[] = [];
  if (cliente.direccion) partes.push(cliente.direccion);
  if (cliente.ciudad) partes.push(cliente.ciudad);
  return partes.join(', ');
};

// ── Entrega estimada ────────────────────────────────────────────────────────────
export type EntregaEstimadaInfo = { fecha: string; transcurridos: number; restantes: number };

// Info de entrega estimada a partir de la fecha de emisión de la factura:
// fecha estimada (emisión + días del parámetro), días transcurridos desde la
// emisión y días restantes hasta la estimada (negativo = atrasada).
export const entregaEstimadaInfo = (
  fechaEmision: string | null | undefined,
  diasEntregaEstimada: number,
): EntregaEstimadaInfo | null => {
  if (!fechaEmision) return null;
  const base = new Date(fechaEmision);
  if (isNaN(base.getTime())) return null;
  const DIA_MS = 86400000;
  const hoy = new Date();
  // Contamos días calendario (normalizados a medianoche UTC).
  const dBase = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate());
  const dHoy = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dEst = dBase + diasEntregaEstimada * DIA_MS;
  const transcurridos = Math.max(0, Math.round((dHoy - dBase) / DIA_MS));
  const restantes = Math.round((dEst - dHoy) / DIA_MS);
  return { fecha: new Date(dEst).toLocaleDateString('es-AR'), transcurridos, restantes };
};

// Línea "Transcurridos X de N d · faltan/atrasada" reutilizable.
export const renderEntregaEstimada = (
  info: EntregaEstimadaInfo | null,
  diasEntregaEstimada: number,
) =>
  info ? (
    <>
      <Typography variant="caption" color="info.main" display="block">
        Entrega estimada: {info.fecha}
      </Typography>
      <Typography variant="caption" color={info.restantes < 0 ? 'error.main' : 'text.secondary'} display="block">
        Transcurridos {info.transcurridos} de {diasEntregaEstimada} d ·{' '}
        {info.restantes >= 0 ? `faltan ${info.restantes} d` : `atrasada ${Math.abs(info.restantes)} d`}
      </Typography>
    </>
  ) : null;
