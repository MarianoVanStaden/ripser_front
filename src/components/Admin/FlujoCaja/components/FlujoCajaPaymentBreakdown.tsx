import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import type { PaymentMethodAggregation, ChequeStatusAggregation } from '../../../../types';
import PaymentMethodCard from '../breakdown/PaymentMethodCard';
import ChequeStatusCard from '../breakdown/ChequeStatusCard';

interface FlujoCajaPaymentBreakdownProps {
  paymentMethodData: PaymentMethodAggregation[];
  chequeStatusData: ChequeStatusAggregation[];
  totalGeneral: number;
  loading?: boolean;
}

const FlujoCajaPaymentBreakdown: React.FC<FlujoCajaPaymentBreakdownProps> = ({
  paymentMethodData,
  chequeStatusData,
  totalGeneral,
  loading = false,
}) => {
  // Encontrar el método de pago CHEQUE para colocarlo junto al card de estados
  const chequeMethod = paymentMethodData.find((m) => m.metodoPago === 'CHEQUE');
  const otherMethods = paymentMethodData.filter((m) => m.metodoPago !== 'CHEQUE');

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Desglose por Método de Pago
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Box sx={{ height: 400, bgcolor: 'grey.100', borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (paymentMethodData.length === 0) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Desglose por Método de Pago
        </Typography>
        <Typography color="text.secondary" textAlign="center" py={4}>
          No hay datos de métodos de pago disponibles
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Desglose por Método de Pago
      </Typography>
      <Grid container spacing={3}>
        {/* Otros métodos de pago */}
        {otherMethods.map((method) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={method.metodoPago}>
            <PaymentMethodCard data={method} totalGeneral={totalGeneral} />
          </Grid>
        ))}

        {/* Card de Cheques (si existe) junto con el card de estados */}
        {chequeMethod && (
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <PaymentMethodCard data={chequeMethod} totalGeneral={totalGeneral} />
          </Grid>
        )}

        {/* Card de Estados de Cheques (si hay cheques) */}
        {chequeStatusData.length > 0 && (
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <ChequeStatusCard data={chequeStatusData} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default React.memo(FlujoCajaPaymentBreakdown);
