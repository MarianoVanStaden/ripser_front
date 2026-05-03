import {
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import type { MetodoPago } from '../../../types';

export const getMetodoPagoIcon = (metodoPago: MetodoPago | string) => {
  switch (metodoPago) {
    case 'EFECTIVO':
      return <MoneyIcon fontSize="small" />;
    case 'TARJETA_CREDITO':
      return <CreditCardIcon fontSize="small" />;
    case 'TRANSFERENCIA':
    case 'FINANCIAMIENTO':
    case 'FINANCIACION_PROPIA':
      return <BankIcon fontSize="small" />;
    default:
      return <MoneyIcon fontSize="small" />;
  }
};

export const getMetodoPagoLabel = (metodoPago: MetodoPago | string) => {
  switch (metodoPago) {
    case 'EFECTIVO': return 'Efectivo';
    case 'TARJETA_CREDITO': return 'Tarjeta de Crédito';
    case 'TARJETA_DEBITO': return 'Tarjeta de Débito';
    case 'TRANSFERENCIA': return 'Transferencia bancaria';
    case 'FINANCIAMIENTO': return 'Financiación propia';
    case 'FINANCIACION_PROPIA': return 'Financiación Propia';
    case 'CHEQUE': return 'Cheque';
    default: return String(metodoPago);
  }
};
