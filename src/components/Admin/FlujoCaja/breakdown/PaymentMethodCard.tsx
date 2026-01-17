import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import type { PaymentMethodAggregation } from '../../../../types';
import {
  getPaymentMethodLabel,
  getPaymentMethodIcon,
  getPaymentMethodColor,
  formatCurrency,
  formatPercentage,
} from '../../../../utils/flujoCajaUtils';

interface PaymentMethodCardProps {
  data: PaymentMethodAggregation;
  totalGeneral: number;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ data, totalGeneral }) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const Icon = getPaymentMethodIcon(data.metodoPago);
  const color = getPaymentMethodColor(data.metodoPago);
  const label = getPaymentMethodLabel(data.metodoPago);

  const porcentajeIngresos = totalGeneral > 0 ? (data.totalIngresos / totalGeneral) * 100 : 0;
  const porcentajeEgresos = totalGeneral > 0 ? (data.totalEgresos / totalGeneral) * 100 : 0;

  return (
    <Card
      sx={{
        height: '100%',
        border: `2px solid ${color}20`,
        '&:hover': {
          boxShadow: 4,
          borderColor: `${color}60`,
        },
        transition: 'all 0.3s ease',
      }}
    >
      <CardHeader
        avatar={
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ color, fontSize: 28 }} />
          </Box>
        }
        action={
          <IconButton
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        }
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" component="span">
              {label}
            </Typography>
            <Chip
              label={data.cantidadMovimientos}
              size="small"
              sx={{ bgcolor: `${color}20`, color, fontWeight: 'bold' }}
            />
          </Box>
        }
        subheader={`${formatPercentage(data.porcentajeDelTotal)} del total`}
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ pt: 0 }}>
        {/* Ingresos */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="body2" color="text.secondary">
                Ingresos
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold" color="success.main">
              {formatCurrency(data.totalIngresos)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={porcentajeIngresos}
            sx={{
              height: 6,
              borderRadius: 1,
              bgcolor: 'success.lighter',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'success.main',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {formatPercentage(porcentajeIngresos)} del total
          </Typography>
        </Box>

        {/* Egresos */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
              <Typography variant="body2" color="text.secondary">
                Egresos
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold" color="error.main">
              {formatCurrency(data.totalEgresos)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={porcentajeEgresos}
            sx={{
              height: 6,
              borderRadius: 1,
              bgcolor: 'error.lighter',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'error.main',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {formatPercentage(porcentajeEgresos)} del total
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Saldo / Flujo Neto - Destacado */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: data.flujoNeto >= 0 ? 'success.lighter' : 'error.lighter',
            border: `1px solid ${data.flujoNeto >= 0 ? 'success.light' : 'error.light'}`,
          }}
        >
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={0.5}>
            Saldo Disponible
          </Typography>
          <Typography
            variant="h5"
            fontWeight="bold"
            color={data.flujoNeto >= 0 ? 'success.main' : 'error.main'}
            textAlign="center"
          >
            {data.flujoNeto >= 0 ? '+' : ''}
            {formatCurrency(data.flujoNeto)}
          </Typography>
        </Box>
      </CardContent>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0, bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Detalles adicionales
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Total movimientos:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {data.cantidadMovimientos}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Ticket promedio:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(
                  (data.totalIngresos + data.totalEgresos) / data.cantidadMovimientos
                )}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Participación:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatPercentage(data.porcentajeDelTotal)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default React.memo(PaymentMethodCard);
