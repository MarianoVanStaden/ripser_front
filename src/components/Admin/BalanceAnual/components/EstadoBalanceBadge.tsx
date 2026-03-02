import { Chip } from '@mui/material';
import type { EstadoBalance } from '../../../../types';

interface EstadoBalanceBadgeProps {
  estado: EstadoBalance;
}

const LABEL: Record<EstadoBalance, string> = {
  BORRADOR: 'Borrador',
  CERRADO: 'Cerrado',
  AUDITADO: 'Auditado',
};

const COLOR: Record<EstadoBalance, 'default' | 'warning' | 'success'> = {
  BORRADOR: 'default',
  CERRADO: 'warning',
  AUDITADO: 'success',
};

export default function EstadoBalanceBadge({ estado }: EstadoBalanceBadgeProps) {
  return <Chip label={LABEL[estado]} color={COLOR[estado]} size="small" />;
}
