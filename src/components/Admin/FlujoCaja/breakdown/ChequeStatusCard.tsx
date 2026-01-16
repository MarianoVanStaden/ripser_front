import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Chip,
  Button,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Description as ChequeIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { ChequeStatusAggregation } from '../../../../types';
import {
  getChequeEstadoLabel,
  getChequeEstadoColor,
  formatCurrency,
} from '../../../../utils/flujoCajaUtils';

interface ChequeStatusCardProps {
  data: ChequeStatusAggregation[];
}

const ChequeStatusCard: React.FC<ChequeStatusCardProps> = ({ data }) => {
  const navigate = useNavigate();

  const handleViewCheques = () => {
    navigate('/admin/cheques');
  };

  const totalCheques = data.reduce((sum, item) => sum + item.cantidad, 0);
  const totalMonto = data.reduce((sum, item) => sum + item.montoTotal, 0);

  // Organizar cheques por pipeline
  const enCartera = data.find((d) => d.estado === 'EN_CARTERA');
  const depositado = data.find((d) => d.estado === 'DEPOSITADO');
  const cobrado = data.find((d) => d.estado === 'COBRADO');
  const rechazado = data.find((d) => d.estado === 'RECHAZADO');
  const anulado = data.find((d) => d.estado === 'ANULADO');

  if (data.length === 0) {
    return null; // No mostrar el card si no hay cheques
  }

  return (
    <Card
      sx={{
        height: '100%',
        border: '2px solid #FF980020',
        '&:hover': {
          boxShadow: 4,
          borderColor: '#FF980060',
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
              bgcolor: '#FF980020',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChequeIcon sx={{ color: '#FF9800', fontSize: 28 }} />
          </Box>
        }
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" component="span">
              Cheques
            </Typography>
            <Chip
              label={totalCheques}
              size="small"
              sx={{ bgcolor: '#FF980020', color: '#FF9800', fontWeight: 'bold' }}
            />
          </Box>
        }
        subheader={`Total: ${formatCurrency(totalMonto)}`}
      />

      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Pipeline de Cheques
        </Typography>

        {/* En Cartera → Depositado → Cobrado */}
        <Box my={3}>
          {/* En Cartera */}
          {enCartera && (
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: getChequeEstadoColor('EN_CARTERA'),
                    }}
                  />
                  <Typography variant="body2" fontWeight="medium">
                    {getChequeEstadoLabel('EN_CARTERA')}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body2" fontWeight="bold">
                    {enCartera.cantidad} ({formatCurrency(enCartera.montoTotal)})
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={totalCheques > 0 ? (enCartera.cantidad / totalCheques) * 100 : 0}
                sx={{
                  height: 6,
                  borderRadius: 1,
                  bgcolor: '#FFC10720',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getChequeEstadoColor('EN_CARTERA'),
                  },
                }}
              />
            </Box>
          )}

          {/* Arrow */}
          {enCartera && depositado && (
            <Box display="flex" justifyContent="center" my={1}>
              <ArrowForwardIcon sx={{ color: 'text.secondary', fontSize: 20, transform: 'rotate(90deg)' }} />
            </Box>
          )}

          {/* Depositado */}
          {depositado && (
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: getChequeEstadoColor('DEPOSITADO'),
                    }}
                  />
                  <Typography variant="body2" fontWeight="medium">
                    {getChequeEstadoLabel('DEPOSITADO')}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body2" fontWeight="bold">
                    {depositado.cantidad} ({formatCurrency(depositado.montoTotal)})
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={totalCheques > 0 ? (depositado.cantidad / totalCheques) * 100 : 0}
                sx={{
                  height: 6,
                  borderRadius: 1,
                  bgcolor: '#2196F320',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getChequeEstadoColor('DEPOSITADO'),
                  },
                }}
              />
            </Box>
          )}

          {/* Arrow */}
          {depositado && cobrado && (
            <Box display="flex" justifyContent="center" my={1}>
              <ArrowForwardIcon sx={{ color: 'text.secondary', fontSize: 20, transform: 'rotate(90deg)' }} />
            </Box>
          )}

          {/* Cobrado */}
          {cobrado && (
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="body2" fontWeight="medium" color="success.main">
                    {getChequeEstadoLabel('COBRADO')}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {cobrado.cantidad} ({formatCurrency(cobrado.montoTotal)})
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={totalCheques > 0 ? (cobrado.cantidad / totalCheques) * 100 : 0}
                sx={{
                  height: 6,
                  borderRadius: 1,
                  bgcolor: 'success.lighter',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'success.main',
                  },
                }}
              />
            </Box>
          )}
        </Box>

        {/* Cheques con problemas */}
        {(rechazado || anulado) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Cheques con Problemas
            </Typography>

            {rechazado && (
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  <Typography variant="body2" color="error.main">
                    {getChequeEstadoLabel('RECHAZADO')}
                  </Typography>
                </Box>
                <Chip
                  label={`${rechazado.cantidad} - ${formatCurrency(rechazado.montoTotal)}`}
                  size="small"
                  color="error"
                  variant="outlined"
                />
              </Box>
            )}

            {anulado && (
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <CancelIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {getChequeEstadoLabel('ANULADO')}
                  </Typography>
                </Box>
                <Chip
                  label={`${anulado.cantidad} - ${formatCurrency(anulado.montoTotal)}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            )}
          </>
        )}

        <Button
          fullWidth
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          onClick={handleViewCheques}
          sx={{ mt: 3 }}
        >
          Ver Gestión de Cheques
        </Button>
      </CardContent>
    </Card>
  );
};

export default React.memo(ChequeStatusCard);
