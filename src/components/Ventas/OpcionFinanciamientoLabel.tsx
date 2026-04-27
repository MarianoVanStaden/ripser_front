import React from 'react';
import { Box, Chip, Stack, Typography, Divider, useTheme } from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import type { MetodoPago, OpcionFinanciamientoDTO } from '../../types';
import {
  calcularFinanciamientoPropio,
  debeDesglosarFinanciamientoPropio,
  formatCurrencyARS,
  getMetodoPagoLabel,
  isFinanciamientoPropio,
} from '../../utils/financiamiento';

const getMetodoPagoIcon = (metodoPago?: MetodoPago | string | null) => {
  switch (metodoPago) {
    case 'EFECTIVO':
      return <MoneyIcon fontSize="small" />;
    case 'TARJETA_CREDITO':
    case 'TARJETA_DEBITO':
      return <CreditCardIcon fontSize="small" />;
    case 'TRANSFERENCIA':
    case 'TRANSFERENCIA_BANCARIA':
    case 'CUENTA_CORRIENTE':
      return <BankIcon fontSize="small" />;
    case 'FINANCIAMIENTO':
    case 'FINANCIACION_PROPIA':
      return <ReceiptIcon fontSize="small" />;
    default:
      return <MoneyIcon fontSize="small" />;
  }
};

interface DataPointProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const DataPoint: React.FC<DataPointProps> = ({ label, value, highlight }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={highlight ? 700 : 500}
      color={highlight ? 'primary.main' : 'text.primary'}
    >
      {value}
    </Typography>
  </Box>
);

interface OpcionFinanciamientoLabelProps {
  opcion: OpcionFinanciamientoDTO;
  /** Importe base del documento (subtotal). Necesario para calcular entrega 40% en financiamiento propio. */
  baseImporte: number;
}

/**
 * Renderiza el contenido visual de una opción de financiamiento.
 * Para financiamiento propio con más de una cuota muestra el desglose:
 * entrega 40% + saldo financiado + interés sobre saldo + cuota estimada.
 *
 * Pensado para usarse dentro de un FormControlLabel (con Radio externo) o
 * en cualquier lista. No incluye el control de selección — eso queda fuera.
 */
const OpcionFinanciamientoLabel: React.FC<OpcionFinanciamientoLabelProps> = ({ opcion, baseImporte }) => {
  const theme = useTheme();
  const propio = debeDesglosarFinanciamientoPropio(opcion);
  const calc = propio
    ? calcularFinanciamientoPropio(baseImporte, opcion.tasaInteres, opcion.cantidadCuotas)
    : null;

  const tasaPositiva = opcion.tasaInteres > 0;
  const tasaNegativa = opcion.tasaInteres < 0;

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Header: nombre + chips */}
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
        <Box sx={{ display: 'inline-flex', color: theme.palette.primary.main }}>
          {getMetodoPagoIcon(opcion.metodoPago)}
        </Box>
        <Typography variant="subtitle1" fontWeight={600}>
          {opcion.nombre}
        </Typography>
        {tasaNegativa && (
          <Chip size="small" color="success" label={`${Math.abs(opcion.tasaInteres)}% OFF`} />
        )}
        {tasaPositiva && (
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            label={`${opcion.tasaInteres}% interés`}
          />
        )}
        {isFinanciamientoPropio(opcion.metodoPago) && (
          <Chip size="small" color="info" variant="outlined" label="Financiación propia" />
        )}
      </Stack>

      {/* Datos principales */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: 1.5,
          rowGap: 1,
        }}
      >
        <DataPoint label="Método" value={getMetodoPagoLabel(opcion.metodoPago)} />
        <DataPoint
          label="Cuotas"
          value={opcion.cantidadCuotas <= 1 ? 'Pago único' : String(opcion.cantidadCuotas)}
        />
        <DataPoint
          label={propio ? 'Cuota estimada' : opcion.cantidadCuotas > 1 ? 'Cuota' : 'Importe'}
          value={formatCurrencyARS(propio ? calc!.cuotaEstimada : opcion.montoCuota, 2)}
          highlight
        />
        <DataPoint
          label={propio ? 'Total estimado' : 'Total'}
          value={formatCurrencyARS(propio ? calc!.totalEstimado : opcion.montoTotal, 2)}
          highlight
        />
      </Box>

      {/* Desglose de financiamiento propio */}
      {propio && calc && (
        <Box
          sx={{
            mt: 0.5,
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'action.hover',
            border: `1px dashed ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ display: 'block', lineHeight: 1.2, mb: 0.5, fontWeight: 700 }}
          >
            Plan de financiación propia
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            divider={<Divider orientation="vertical" flexItem />}
            sx={{ flexWrap: 'wrap' }}
          >
            <DataPoint
              label={`Entrega inicial (${Math.round(calc.porcentajeEntrega * 100)}%)`}
              value={formatCurrencyARS(calc.entrega, 2)}
            />
            <DataPoint label="Saldo a financiar (60%)" value={formatCurrencyARS(calc.saldo, 2)} />
            <DataPoint
              label={`Interés ${calc.tasaInteres}% sobre saldo`}
              value={formatCurrencyARS(calc.saldoConInteres, 2)}
            />
            <DataPoint
              label={`${calc.cuotas} cuotas de`}
              value={formatCurrencyARS(calc.cuotaEstimada, 2)}
              highlight
            />
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}
          >
            * Importes estimativos. La entrega inicial se realiza al recibir el producto y el
            interés se aplica sobre el saldo restante.
          </Typography>
        </Box>
      )}

      {/* Descripción libre */}
      {opcion.descripcion && (
        <Typography variant="caption" color="text.secondary">
          {opcion.descripcion}
        </Typography>
      )}
    </Box>
  );
};

export default OpcionFinanciamientoLabel;
