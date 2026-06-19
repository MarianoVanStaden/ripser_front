import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import dayjs from 'dayjs';
import {
  type TipoGarantia,
  tipoGarantiaLabel,
  tipoGarantiaDias,
} from '../../api/services/garantiaApi';

interface GarantiaVigenciaBarProps {
  tipo: TipoGarantia;
  fechaCompra?: string;
  fechaVencimiento?: string;
  estado: string;
  /** compact: barra fina con label al lado (para filas de tabla) */
  compact?: boolean;
}

/**
 * Barra horizontal de vigencia de una cobertura de garantía.
 * Muestra los días RESTANTES sobre el total (Fábrica ≈ 365, Eléctrico ≈ 182):
 * la barra se vacía a medida que se acerca el vencimiento ("restan X de Y días").
 */
const GarantiaVigenciaBar: React.FC<GarantiaVigenciaBarProps> = ({
  tipo,
  fechaCompra,
  fechaVencimiento,
  estado,
  compact = false,
}) => {
  if (!fechaVencimiento) return null;

  // Total real derivado de las fechas; si no hay fechaCompra, fallback por tipo.
  const diasDerivados = fechaCompra
    ? dayjs(fechaVencimiento).diff(dayjs(fechaCompra), 'day')
    : 0;
  const diasTotales = diasDerivados > 0 ? diasDerivados : tipoGarantiaDias[tipo];

  const vencida = estado === 'VENCIDA';
  const diasRestantes = vencida
    ? 0
    : Math.max(0, dayjs(fechaVencimiento).diff(dayjs(), 'day'));

  const diasConsumidos = diasTotales - diasRestantes;
  const porcentajeConsumido = Math.min(
    100,
    Math.max(0, (diasConsumidos / diasTotales) * 100)
  );

  const color =
    vencida || diasRestantes === 0
      ? 'error.main'
      : diasRestantes < 30
        ? 'warning.main'
        : 'success.main';

  const label = tipoGarantiaLabel[tipo] || tipo;
  const restanteTexto = `${diasRestantes} de ${diasTotales} días`;

  const barra = (
    <Box
      sx={{
        height: compact ? 8 : 12,
        bgcolor: 'grey.200',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: `${porcentajeConsumido}%`,
          bgcolor: color,
          transition: 'width 0.3s',
        }}
      />
    </Box>
  );

  if (compact) {
    return (
      <Box sx={{ minWidth: 130 }}>
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ display: 'block', lineHeight: 1.2 }}
        >
          {label.replace(/\s*\(.*\)$/, '')}
        </Typography>
        {barra}
        <Typography variant="caption" sx={{ color, fontWeight: 500 }}>
          {restanteTexto}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
      <Typography variant="subtitle2" fontWeight="600" mb={1}>
        {label}
      </Typography>
      <Stack spacing={1}>
        <Box>
          <Typography variant="caption" color="textSecondary">
            Fecha de Vencimiento
          </Typography>
          <Typography
            variant="body2"
            fontWeight="500"
            color={
              vencida ? 'error.main' : diasRestantes < 30 ? 'warning.main' : 'textPrimary'
            }
          >
            {dayjs(fechaVencimiento).format('DD/MM/YYYY')}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="textSecondary" mb={0.5} display="block">
            Vigencia restante
          </Typography>
          {barra}
          <Typography variant="caption" sx={{ color, fontWeight: 500 }}>
            Restan {restanteTexto}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default GarantiaVigenciaBar;
