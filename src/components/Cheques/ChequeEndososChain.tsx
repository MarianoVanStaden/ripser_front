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
import { statusSx, type StatusRole } from '../../theme/statusRoles';

dayjs.locale('es');

interface Props {
  cadenaEndosos?: CadenaEndososDTO;
  loading?: boolean;
}

const ChequeEndososChain: React.FC<Props> = ({ cadenaEndosos, loading }) => {
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

  const getRoleByLevel = (nivel: number): StatusRole => {
    switch (nivel) {
      case 1:
        return 'success';
      case 2:
        return 'warning';
      case 3:
        return 'danger';
      default:
        return 'process'; // 4+
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
          borderLeft: '4px solid var(--mui-palette-primary-main)',
          bgcolor: 'status.info.bg',
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
              borderLeft: `4px solid var(--mui-palette-status-${getRoleByLevel(endoso.nivel)}-fg)`,
              bgcolor: 'background.default',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon sx={{ color: `status.${getRoleByLevel(endoso.nivel)}.fg` }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Endoso {endoso.nivel}
                </Typography>
              </Box>
              <Chip
                label={`Nivel ${endoso.nivel}`}
                size="small"
                sx={{
                  ...statusSx(getRoleByLevel(endoso.nivel)),
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
              <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
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
      <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Total de endosos en cadena: <strong>{cadenaEndosos.totalEndosos}</strong>
        </Typography>
      </Box>
    </Box>
  );
};

export default ChequeEndososChain;
