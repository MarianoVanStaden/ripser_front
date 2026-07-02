import React from 'react';
import { Chip } from '@mui/material';
import type { EstadoChequeType } from '../../types';

interface Props {
  estado: EstadoChequeType;
}

const ChequeEstadoChip: React.FC<Props> = ({ estado }) => {
  const config: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' }> = {
    RECIBIDO: { label: 'Recibido', color: 'secondary' },
    EN_CARTERA: { label: 'En Cartera', color: 'primary' },
    ENDOSADO: { label: 'Endosado', color: 'secondary' },
    DEPOSITADO: { label: 'Depositado', color: 'info' },
    COBRADO: { label: 'Cobrado', color: 'success' },
    RECHAZADO: { label: 'Rechazado', color: 'error' },
    ANULADO: { label: 'Anulado', color: 'warning' },
  };

  const { label, color } = config[estado] ?? { label: estado, color: 'default' };

  return <Chip label={label} color={color} size="small" />;
};

export default ChequeEstadoChip;
