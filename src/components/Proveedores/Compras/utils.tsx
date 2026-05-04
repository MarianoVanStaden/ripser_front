// FRONT-003: extracted from ComprasPedidosPage.tsx — pure helpers para
// chips/iconos de estado de orden de compra.
import React from 'react';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

/** Maps estado de orden de compra → MUI Chip color. */
export const getEstadoColor = (estado: string): ChipColor => {
  switch (estado) {
    case 'PENDIENTE':
      return 'warning';
    case 'CONFIRMADA':
      return 'info';
    case 'EN_TRANSITO':
      return 'primary';
    case 'RECIBIDA':
      return 'success';
    case 'CANCELADA':
      return 'error';
    default:
      return 'default';
  }
};

/** Icon component representing the estado.  Returned as JSX element. */
export const getEstadoIcon = (estado: string): React.ReactElement => {
  switch (estado) {
    case 'PENDIENTE':
      return <ScheduleIcon />;
    case 'CONFIRMADA':
      return <CheckIcon />;
    case 'EN_TRANSITO':
      return <ShippingIcon />;
    case 'RECIBIDA':
      return <CheckIcon />;
    case 'CANCELADA':
      return <CancelIcon />;
    default:
      return <ReceiptIcon />;
  }
};
