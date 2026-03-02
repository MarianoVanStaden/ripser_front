import { useState } from 'react';
import {
  TableRow,
  TableCell,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Typography,
  Chip,
} from '@mui/material';
import { amortizacionApi } from '../../../../api/services/amortizacionApi';
import type { ActivoAmortizableDTO, AmortizacionMensualDTO } from '../../../../types';

interface Props {
  activo: ActivoAmortizableDTO;
  amortizacion: AmortizacionMensualDTO | null;
  anio: number;
  mes: number;
  onRegistered: () => void;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function AmortizacionMesRow({ activo, amortizacion, anio, mes, onRegistered }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [valorDolar, setValorDolar] = useState('');
  const [kmRecorridos, setKmRecorridos] = useState('');
  const [comprasPesos, setComprasPesos] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    if (amortizacion) {
      setValorDolar(String(amortizacion.valorDolar));
      setKmRecorridos(amortizacion.kmRecorridos != null ? String(amortizacion.kmRecorridos) : '');
      setComprasPesos(String(amortizacion.comprasPesos ?? 0));
    } else {
      setValorDolar('');
      setKmRecorridos('');
      setComprasPesos('0');
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const vd = parseFloat(valorDolar);
    if (!valorDolar || isNaN(vd) || vd <= 0) {
      setError('El valor del dólar es obligatorio');
      return;
    }
    if (activo.metodo === 'POR_KILOMETROS') {
      const km = parseFloat(kmRecorridos);
      if (!kmRecorridos || isNaN(km) || km < 0) {
        setError('Ingresá los kilómetros recorridos');
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      await amortizacionApi.registrarAmortizacion(anio, mes, activo.id, {
        valorDolar: vd,
        kmRecorridos: activo.metodo === 'POR_KILOMETROS' ? parseFloat(kmRecorridos) : undefined,
        comprasPesos: comprasPesos ? parseFloat(comprasPesos) : 0,
      });
      setDialogOpen(false);
      onRegistered();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al registrar la amortización');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TableRow hover>
        <TableCell>
          {activo.nombre}
          {activo.vehiculoPatente && (
            <Typography variant="caption" color="text.secondary" display="block">
              {activo.vehiculoPatente}
            </Typography>
          )}
        </TableCell>
        <TableCell>{activo.tipo}</TableCell>
        <TableCell>{activo.metodo.replace(/_/g, ' ')}</TableCell>
        <TableCell align="right">
          {amortizacion ? `$${fmt(amortizacion.montoAmortizadoPesos)}` : '—'}
        </TableCell>
        <TableCell align="right">
          {amortizacion ? `$${fmt(amortizacion.fondoAcumuladoPesos)}` : '—'}
        </TableCell>
        <TableCell>
          {amortizacion ? (
            <Chip label="Registrado" color="success" size="small" />
          ) : (
            <Chip label="Pendiente" size="small" />
          )}
        </TableCell>
        <TableCell>
          <Button size="small" variant={amortizacion ? 'outlined' : 'contained'} onClick={handleOpen}>
            {amortizacion ? 'Editar' : 'Registrar'}
          </Button>
        </TableCell>
      </TableRow>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {amortizacion ? 'Editar' : 'Registrar'} amortización — {activo.nombre}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Valor dólar *"
            type="number"
            fullWidth
            size="small"
            value={valorDolar}
            onChange={(e) => { setValorDolar(e.target.value); setError(null); }}
            inputProps={{ step: '0.01', min: '0' }}
            sx={{ mt: 1 }}
            disabled={saving}
          />

          {activo.metodo === 'POR_KILOMETROS' && (
            <TextField
              label="Kilómetros recorridos *"
              type="number"
              fullWidth
              size="small"
              value={kmRecorridos}
              onChange={(e) => { setKmRecorridos(e.target.value); setError(null); }}
              inputProps={{ step: '1', min: '0' }}
              sx={{ mt: 2 }}
              disabled={saving}
            />
          )}

          <TextField
            label="Compras/mantenimiento del mes ($)"
            type="number"
            fullWidth
            size="small"
            value={comprasPesos}
            onChange={(e) => setComprasPesos(e.target.value)}
            inputProps={{ step: '0.01', min: '0' }}
            sx={{ mt: 2 }}
            disabled={saving}
          />

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
