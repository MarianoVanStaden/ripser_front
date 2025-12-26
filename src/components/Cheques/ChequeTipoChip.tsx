import React from 'react';
import { Chip } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import type { TipoChequeType } from '../../types';

interface Props {
  tipo: TipoChequeType;
}

const ChequeTipoChip: React.FC<Props> = ({ tipo }) => {
  if (tipo === 'PROPIO') {
    return (
      <Chip
        label="Propio"
        icon={<ArrowUpward />}
        color="warning"
        size="small"
      />
    );
  }

  return (
    <Chip
      label="Terceros"
      icon={<ArrowDownward />}
      color="success"
      size="small"
    />
  );
};

export default ChequeTipoChip;
