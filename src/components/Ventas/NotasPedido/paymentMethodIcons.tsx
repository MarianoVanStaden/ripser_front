// FRONT-003: extracted from NotasPedidoPage.tsx.
//
// NB: Facturacion has a sibling [paymentMethodIcons.tsx](../Facturacion/paymentMethodIcons.tsx)
// with subtly different labels (`"Financiación propia"` vs `"Financiamiento"`)
// and a narrower icon switch (no `TARJETA_DEBITO`/`CUENTA_CORRIENTE`/
// `TRANSFERENCIA_BANCARIA` cases). They are intentionally NOT consolidated
// here — picking one over the other would change user-visible strings on the
// other page. A future task can unify if the team decides on a canonical
// label set.
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
    case 'TARJETA_DEBITO':
      return <CreditCardIcon fontSize="small" />;
    case 'TRANSFERENCIA':
    case 'TRANSFERENCIA_BANCARIA':
    case 'FINANCIAMIENTO':
    case 'FINANCIACION_PROPIA':
    case 'CUENTA_CORRIENTE':
      return <BankIcon fontSize="small" />;
    default:
      return <MoneyIcon fontSize="small" />;
  }
};

export const getMetodoPagoLabel = (metodo: MetodoPago | string): string => {
  const labels: Record<string, string> = {
    EFECTIVO: 'Efectivo',
    TARJETA_CREDITO: 'Tarjeta de Crédito',
    TARJETA_DEBITO: 'Tarjeta de Débito',
    TRANSFERENCIA: 'Transferencia Bancaria',
    TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
    CHEQUE: 'Cheque',
    FINANCIAMIENTO: 'Financiamiento',
    FINANCIACION_PROPIA: 'Financiamiento',
    CUENTA_CORRIENTE: 'Cuenta Corriente',
    MERCADO_PAGO: 'Mercado Pago',
  };
  return labels[metodo] || String(metodo);
};
