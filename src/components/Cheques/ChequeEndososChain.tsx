import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import type { CadenaEndososDTO } from '../../types';

dayjs.locale('es');

interface Props {
  chequeId: number;
  cadenaEndosos?: CadenaEndososDTO;
  loading?: boolean;
}

const ChequeEndososChain: React.FC<Props> = ({ chequeId, cadenaEndosos, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Show empty state only if there's no data at all or endosos array is empty
  if (!cadenaEndosos || !cadenaEndosos.endosos || cadenaEndosos.endosos.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        Este cheque no tiene endosos registrados.
      </Alert>
    );
  }

  const getColorByLevel = (nivel: number): string => {
    switch (nivel) {
      case 1:
        return '#4caf50'; // Green
      case 2:
        return '#ff9800'; // Orange
      case 3:
        return '#f44336'; // Red
      default:
        return '#9c27b0'; // Purple for 4+
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Origin Node - Client */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          borderLeft: '4px solid #1976d2',
          bgcolor: '#e3f2fd',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            Origen
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Cliente: <strong>{cadenaEndosos.clienteOrigenNombre || 'Cliente'}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cheque Nº: <strong>{cadenaEndosos.chequeNumero}</strong>
        </Typography>
        {cadenaEndosos.chequeMonto !== undefined && (
          <Typography variant="body2" color="text.secondary">
            Monto: <strong>${cadenaEndosos.chequeMonto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </Typography>
        )}
      </Paper>

      {/* Arrow indicating flow */}
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
        <ArrowDownwardIcon color="action" />
      </Box>

      {/* Endorsement Nodes */}
      {cadenaEndosos.endosos && cadenaEndosos.endosos.length > 0 && cadenaEndosos.endosos.map((endoso, index) => (
        <React.Fragment key={endoso.id}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              mb: 2,
              borderLeft: `4px solid ${getColorByLevel(endoso.nivel)}`,
              bgcolor: '#fafafa',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon sx={{ color: getColorByLevel(endoso.nivel) }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Endoso {endoso.nivel}
                </Typography>
              </Box>
              <Chip
                label={`Nivel ${endoso.nivel}`}
                size="small"
                sx={{
                  bgcolor: getColorByLevel(endoso.nivel),
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Fecha: <strong>{dayjs(endoso.fechaEndoso).format('DD/MM/YYYY HH:mm')}</strong>
            </Typography>

            {endoso.proveedorOrigenNombre && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Desde: <strong>{endoso.proveedorOrigenNombre}</strong>
              </Typography>
            )}

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Hacia: <strong>{endoso.proveedorDestinoNombre}</strong>
            </Typography>

            {endoso.observaciones && (
              <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Observaciones:
                </Typography>
                <Typography variant="body2">{endoso.observaciones}</Typography>
              </Box>
            )}

            {endoso.usuarioNombre && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Registrado por: {endoso.usuarioNombre}
              </Typography>
            )}
          </Paper>

          {/* Arrow between endorsements */}
          {index < cadenaEndosos.endosos.length - 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
              <ArrowDownwardIcon color="action" />
            </Box>
          )}
        </React.Fragment>
      ))}

      {/* Summary */}
      <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Total de endosos en cadena: <strong>{cadenaEndosos.totalEndosos}</strong>
        </Typography>
      </Box>
    </Box>
  );
};

export default ChequeEndososChain;
