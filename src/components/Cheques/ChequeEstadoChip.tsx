import React from 'react';
import { Chip } from '@mui/material';
import type { EstadoChequeType } from '../../types';

interface Props {
  estado: EstadoChequeType;
}

const ChequeEstadoChip: React.FC<Props> = ({ estado }) => {
  const config = {
    RECIBIDO: { label: 'Recibido', color: 'secondary' as const },
    EN_CARTERA: { label: 'En Cartera', color: 'primary' as const },
    DEPOSITADO: { label: 'Depositado', color: 'info' as const },
    COBRADO: { label: 'Cobrado', color: 'success' as const },
    RECHAZADO: { label: 'Rechazado', color: 'error' as const },
    ANULADO: { label: 'Anulado', color: 'warning' as const },
  };

  const { label, color } = config[estado] || config.EN_CARTERA;

  return <Chip label={label} color={color} size="small" />;
};

export default ChequeEstadoChip;
