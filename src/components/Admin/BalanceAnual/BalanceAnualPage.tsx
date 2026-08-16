import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
import TablaBalanceAnual from './components/TablaBalanceAnual';

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function BalanceAnualPage() {
  const navigate = useNavigate();
  const [anio, setAnio] = useState(CURRENT_YEAR);
  const [moneda, setMoneda] = useState<'pesos' | 'dolares'>('pesos');

  // Cerrar mes dialog
  const [cerrarDialog, setCerrarDialog] = useState<{ open: boolean; mes: number }>({ open: false, mes: 0 });
  const [cerrarError, setCerrarError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const balanceQuery = useQuery({
    queryKey: ['balance-anual', anio],
    queryFn: () => balanceAnualApi.getAnual(anio),
  });
  const data = balanceQuery.data ?? null;
  const loading = balanceQuery.isPending;
  const error = balanceQuery.error
    ? ((balanceQuery.error as any)?.response?.data?.message ?? 'Error al cargar el balance anual')
    : null;
  const loadData = () => queryClient.invalidateQueries({ queryKey: ['balance-anual', anio] });

  const cerrarMutation = useMutation({
    mutationFn: () => balanceAnualApi.cerrar(anio, cerrarDialog.mes),
    onSuccess: () => { setCerrarDialog({ open: false, mes: 0 }); loadData(); },
    onError: (err: any) => setCerrarError(err?.response?.data?.message ?? 'Error al cerrar el mes'),
  });
  const cerrando = cerrarMutation.isPending;

  const handleCerrar = () => {
    setCerrarError(null);
    cerrarMutation.mutate();
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
        <Alert severity="error" sx={{ mb: 2 }}>
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
          onCalcular={(mes) => navigate(`/admin/balance/${anio}/${mes}`)}
          onCerrar={(mes) => setCerrarDialog({ open: true, mes })}
        />
      )}

      <Dialog open={cerrarDialog.open} onClose={() => !cerrando && setCerrarDialog({ open: false, mes: 0 })}>
        <DialogTitle>Cerrar mes</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Cerrar {MESES[cerrarDialog.mes]} {anio}? Una vez cerrado no podrá editarse.
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
