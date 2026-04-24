import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { cajasApi } from '../../api/services/cajasApi';
import {
  metodoPagoRequiereCaja,
  normalizeMetodoPago,
  type CajaRef,
  type CajaUnificada,
} from '../../types/caja.types';
import { formatPrice } from '../../utils/priceCalculations';

interface Props {
  /** Acepta la enum canónica o valores legacy ('TRANSFERENCIA', 'FINANCIAMIENTO'). */
  metodoPago: string;
  value: CajaRef | null;
  onChange: (ref: CajaRef | null) => void;
  sucursalId?: number;
  disabled?: boolean;
  /** Texto para el tipo de operación — "ingresará" para cobros, "saldrá" para pagos */
  direccion?: 'ingreso' | 'egreso';
}

const refKey = (r: CajaRef) => `${r.tipo}:${r.id}`;
const refEquals = (a: CajaRef | null, b: CajaRef | null) =>
  !!a && !!b && a.id === b.id && a.tipo === b.tipo;

export const CajaSelector: React.FC<Props> = ({
  metodoPago,
  value,
  onChange,
  sucursalId,
  disabled,
  direccion = 'ingreso',
}) => {
  const [cajas, setCajas] = useState<CajaUnificada[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canon = normalizeMetodoPago(metodoPago);
  const aplica = metodoPagoRequiereCaja(metodoPago);

  useEffect(() => {
    if (!aplica || !canon) {
      setCajas([]);
      onChange(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    cajasApi
      .getByMetodoPago(canon, sucursalId)
      .then((data) => {
        if (cancelled) return;
        setCajas(data);
        // Auto-resolución: si hay default, la seleccionamos. Si hay 1 sola, esa.
        const current = value;
        const stillValid = current
          ? data.some((c) => c.id === current.id && c.tipo === current.tipo)
          : false;
        if (!stillValid) {
          const def = data.find((c) => c.esDefault) ?? (data.length === 1 ? data[0] : null);
          onChange(def ? { id: def.id, tipo: def.tipo } : null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message ?? 'No se pudieron cargar las cajas');
        setCajas([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metodoPago, sucursalId, aplica]);

  if (!aplica) return null;

  if (loading && cajas === null) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Cargando cajas disponibles...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!cajas || cajas.length === 0) {
    return (
      <Alert severity="warning">
        No hay cajas activas configuradas para este método de pago. Creá una desde{' '}
        <strong>Admin → Cajas</strong> antes de registrar el {direccion === 'ingreso' ? 'cobro' : 'pago'}.
      </Alert>
    );
  }

  const selected = cajas.find((c) => value && c.id === value.id && c.tipo === value.tipo) ?? null;
  const verbo = direccion === 'ingreso' ? 'Ingresará en' : 'Saldrá de';

  if (cajas.length === 1) {
    const unica = cajas[0];
    return (
      <Alert severity="info" icon={false} sx={{ py: 0.5 }}>
        <Typography variant="body2">
          {verbo}: <strong>{unica.nombre}</strong> ({unica.moneda}
          {unica.saldoActual !== undefined ? ` · saldo ${formatPrice(unica.saldoActual)}` : ''})
        </Typography>
      </Alert>
    );
  }

  // 2+ cajas: Select agrupado por moneda si aplica
  const hasAmbas = cajas.some((c) => c.moneda === 'ARS') && cajas.some((c) => c.moneda === 'USD');

  const items: React.ReactNode[] = [];
  if (hasAmbas) {
    const ars = cajas.filter((c) => c.moneda === 'ARS');
    const usd = cajas.filter((c) => c.moneda === 'USD');
    if (ars.length) {
      items.push(<ListSubheader key="h-ars">Pesos (ARS)</ListSubheader>);
      ars.forEach((c) =>
        items.push(
          <MenuItem key={refKey({ id: c.id, tipo: c.tipo })} value={refKey({ id: c.id, tipo: c.tipo })}>
            {c.nombre}
            {c.esDefault ? ' · default' : ''}
          </MenuItem>
        )
      );
    }
    if (usd.length) {
      items.push(<ListSubheader key="h-usd">Dólares (USD)</ListSubheader>);
      usd.forEach((c) =>
        items.push(
          <MenuItem key={refKey({ id: c.id, tipo: c.tipo })} value={refKey({ id: c.id, tipo: c.tipo })}>
            {c.nombre}
            {c.esDefault ? ' · default' : ''}
          </MenuItem>
        )
      );
    }
  } else {
    cajas.forEach((c) =>
      items.push(
        <MenuItem key={refKey({ id: c.id, tipo: c.tipo })} value={refKey({ id: c.id, tipo: c.tipo })}>
          {c.nombre} ({c.moneda}){c.esDefault ? ' · default' : ''}
        </MenuItem>
      )
    );
  }

  return (
    <FormControl fullWidth required disabled={disabled}>
      <InputLabel>Caja ({verbo.toLowerCase()})</InputLabel>
      <Select
        label={`Caja (${verbo.toLowerCase()})`}
        value={selected ? refKey({ id: selected.id, tipo: selected.tipo }) : ''}
        onChange={(e) => {
          const [tipo, idStr] = String(e.target.value).split(':');
          const ref: CajaRef = { id: Number(idStr), tipo: tipo as CajaRef['tipo'] };
          if (!refEquals(ref, value)) onChange(ref);
        }}
      >
        {items}
      </Select>
    </FormControl>
  );
};
