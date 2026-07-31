import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { Loyalty as LoyaltyIcon } from '@mui/icons-material';
import type { Cliente } from '../../types';

interface NivelFidelizacionChipProps {
  cliente: Pick<Cliente, 'nivelFidelizacion' | 'nivelFidelizacionNombre' | 'descuentoSugerido' | 'cantidadComprasValidas'>;
  /** Chip compacto para filas densas (autocomplete). */
  dense?: boolean;
}

/**
 * Chip "Nivel N" del cliente con el % de descuento sugerido en tooltip.
 * No renderiza nada si el cliente no alcanza ningún nivel (0 compras o
 * empresa sin configuración de niveles).
 */
const NivelFidelizacionChip: React.FC<NivelFidelizacionChipProps> = ({ cliente, dense = false }) => {
  if (cliente.nivelFidelizacion == null) return null;

  const label = cliente.nivelFidelizacionNombre
    ? `Nivel ${cliente.nivelFidelizacion} · ${cliente.nivelFidelizacionNombre}`
    : `Nivel ${cliente.nivelFidelizacion}`;

  const tooltip = [
    `${cliente.cantidadComprasValidas ?? 0} compra(s)`,
    cliente.descuentoSugerido != null ? `Descuento sugerido: ${cliente.descuentoSugerido}%` : null,
  ].filter(Boolean).join(' · ');

  return (
    <Tooltip title={tooltip}>
      <Chip
        label={label}
        size="small"
        color="secondary"
        variant="outlined"
        icon={dense ? undefined : <LoyaltyIcon />}
        sx={dense ? { height: 18, fontSize: '0.65rem' } : undefined}
      />
    </Tooltip>
  );
};

export default NivelFidelizacionChip;
