import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RefreshIcon from '@mui/icons-material/Refresh';
import { posicionPatrimonialApi } from '../../../api/services/posicionPatrimonialApi';
import type { PosicionPatrimonialDTO } from '../../../types';
import ResumenPatrimonial from './components/ResumenPatrimonial';
import DesgloseFijo from './components/DesgloseFijo';
import DesgloseStock from './components/DesgloseStock';

function formatPesos(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return `Calculado el ${d.toLocaleDateString('es-AR')} a las ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function PosicionPatrimonialPage() {
  const [data, setData] = useState<PosicionPatrimonialDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await posicionPatrimonialApi.getPosicion();
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al cargar la posición patrimonial');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <AccountBalanceIcon color="primary" />
          <Box>
            <Typography variant="h5" fontWeight={700}>Posición Patrimonial</Typography>
            {data && (
              <Typography variant="caption" color="text.secondary">
                {formatFecha(data.calculadoEn)}
              </Typography>
            )}
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
          disabled={loading}
          size="small"
        >
          {loading ? 'Calculando...' : 'Recalcular'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={loadData}>Reintentar</Button>
        }>
          {error}
        </Alert>
      )}

      {loading && !data && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {data && (
        <Stack spacing={3}>
          <ResumenPatrimonial data={data} formatPesos={formatPesos} />
          <DesgloseFijo data={data.desgloseFijo} formatPesos={formatPesos} />
          <DesgloseStock data={data.desgloseStock} formatPesos={formatPesos} />
        </Stack>
      )}
    </Box>
  );
}
