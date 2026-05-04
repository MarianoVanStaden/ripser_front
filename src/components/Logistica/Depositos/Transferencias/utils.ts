// FRONT-003: extracted from TransferenciasPage.tsx — pure helpers para
// chips/labels de estado de transferencia.
import React from 'react';
import { Chip } from '@mui/material';
import type { EstadoTransferencia } from '../../../../types';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

const ESTADO_CHIP_PROPS: Record<EstadoTransferencia, { label: string; color: ChipColor }> = {
  PENDIENTE: { label: 'Pendiente', color: 'warning' },
  EN_TRANSITO: { label: 'En Tránsito', color: 'info' },
  RECIBIDA: { label: 'Recibida', color: 'success' },
  CANCELADA: { label: 'Cancelada', color: 'error' },
};

/** Chip MUI listo para renderizar dado un estado de transferencia. */
export const getEstadoChip = (estado: EstadoTransferencia): React.ReactElement => {
  const props = ESTADO_CHIP_PROPS[estado];
  return React.createElement(Chip, { label: props.label, color: props.color, size: 'small' });
};
