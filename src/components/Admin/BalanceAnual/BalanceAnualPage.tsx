import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import BalanceIcon from '@mui/icons-material/AccountBalance';
import { balanceAnualApi } from '../../../api/services/balanceAnualApi';
import type { BalanceAnualResponseDTO } from '../../../types';
import TablaBalanceAnual from './components/TablaBalanceAnual';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function BalanceAnualPage() {
  const [anio, setAnio] = useState(CURRENT_YEAR);
  const [data, setData] = useState<BalanceAnualResponseDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moneda, setMoneda] = useState<'pesos' | 'dolares'>('pesos');

  // Cerrar mes dialog
  const [cerrarDialog, setCerrarDialog] = useState<{ open: boolean; mes: number }>({ open: false, mes: 0 });
  const [cerrando, setCerrando] = useState(false);
  const [cerrarError, setCerrarError] = useState<string | null>(null);

  const loadData = useCallback(async (year: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await balanceAnualApi.getAnual(year);
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al cargar el balance anual');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(anio);
  }, [anio, loadData]);

  const handleCerrar = async () => {
    setCerrando(true);
    setCerrarError(null);
    try {
      await balanceAnualApi.cerrar(anio, cerrarDialog.mes);
      setCerrarDialog({ open: false, mes: 0 });
      loadData(anio);
    } catch (err: any) {
      setCerrarError(err?.response?.data?.message ?? 'Error al cerrar el mes');
    } finally {
      setCerrando(false);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <BalanceIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Balance Anual</Typography>
      </Box>

      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Año</InputLabel>
          <Select
            label="Año"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {!loading && data && (
        <TablaBalanceAnual
          data={data}
          anio={anio}
          moneda={moneda}
          onMonedaChange={setMoneda}
          onCalcular={(mes) => {/* navigate to mes page */}}
          onCerrar={(mes) => setCerrarDialog({ open: true, mes })}
        />
      )}

      <Dialog open={cerrarDialog.open} onClose={() => !cerrando && setCerrarDialog({ open: false, mes: 0 })}>
        <DialogTitle>Cerrar mes</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Cerrar el mes {cerrarDialog.mes}/{anio}? Una vez cerrado no podrá editarse.
          </Typography>
          {cerrarError && (
            <Alert severity="error" sx={{ mt: 2 }}>{cerrarError}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCerrarDialog({ open: false, mes: 0 })} disabled={cerrando}>
            Cancelar
          </Button>
          <Button variant="contained" color="warning" onClick={handleCerrar} disabled={cerrando}>
            {cerrando ? 'Cerrando...' : 'Cerrar mes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
