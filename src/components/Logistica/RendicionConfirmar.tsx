// Paso 2 de la rendición: toma los cobros ya cargados por entrega (Paso 1),
// arma automáticamente el desglose por método y deja que el admin solo asigne
// cada método a su caja. Los cheques se registran en cartera (un Cheque formal
// por cada cheque, con banco/número/fecha).
import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AccountBalanceWallet as WalletIcon, ReceiptLong as ChequeIcon } from '@mui/icons-material';
import type { MetodoPago } from '../../types/prestamo.types';
import type { Banco, DetalleRendicion, RendicionViajeDTO } from '../../types';
import { METODO_PAGO_LABELS } from '../../types/venta.types';
import { cajaEsDefaultPara, type CajaUnificada } from '../../types/caja.types';
import { cajasApi } from '../../api/services/cajasApi';
import { bancoApi } from '../../api/services/bancoApi';
import { viajeApi } from '../../api/services/viajeApi';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface RendicionConfirmarPayload {
  detalles: DetalleRendicion[];
  totalArs: number;
  totalUsd: number;
  valid: boolean;
  loading: boolean;
}

// Un cheque individual a registrar en cartera (expandido de las líneas CHEQUE).
interface ChequeForm {
  id: string;
  monto: number;
  numero: string;
  bancoId: number | '';
  titular: string;
  cuit: string;
  fechaEmision: string;
  fechaCobro: string;
}

const chequeValido = (c: ChequeForm) =>
  c.numero.trim() !== '' && c.bancoId !== '' && c.titular.trim() !== '' &&
  c.fechaEmision !== '' && c.fechaCobro !== '';

interface Props {
  viajeId: number;
  onChange: (payload: RendicionConfirmarPayload) => void;
  onTotalDeclarado?: (ars: number, usd: number) => void;
}

const RendicionConfirmar: React.FC<Props> = ({ viajeId, onChange, onTotalDeclarado }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Desglose agregado (derivado del resumen).
  const [arsGrupos, setArsGrupos] = useState<{ metodo: MetodoPago; total: number }[]>([]);
  const [usdTotal, setUsdTotal] = useState(0);
  const [cheques, setCheques] = useState<ChequeForm[]>([]);

  // Caja elegida por método (incluye 'DOLARES'); cache de cajas por método.
  const [cajaSel, setCajaSel] = useState<Record<string, number | ''>>({});
  const [cajasPorMetodo, setCajasPorMetodo] = useState<Record<string, CajaUnificada[]>>({});
  const [bancos, setBancos] = useState<Banco[]>([]);

  // ── Cargar resumen y armar el desglose ──
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError(null);
    viajeApi.getResumenCobros(viajeId)
      .then((data: RendicionViajeDTO) => {
        if (cancel) return;
        const arsMap = new Map<string, number>();
        let usd = 0;
        const chequesBase: ChequeForm[] = [];
        let chequeSeq = 0;

        (data.entregas ?? []).forEach((e) => {
          (e.detallesCobro ?? []).forEach((d) => {
            const monto = Number(d.monto) || 0;
            if (d.metodoPago === 'CHEQUE') {
              const cant = d.cantidadCheques && d.cantidadCheques > 0 ? d.cantidadCheques : 1;
              for (let i = 0; i < cant; i++) {
                chequesBase.push({
                  id: `chq-${chequeSeq++}`,
                  monto,
                  numero: '', bancoId: '', titular: e.clienteNombre ?? '',
                  cuit: '', fechaEmision: '', fechaCobro: '',
                });
              }
            } else if (d.metodoPago === 'DOLARES') {
              usd += monto;
            } else {
              arsMap.set(d.metodoPago, (arsMap.get(d.metodoPago) ?? 0) + monto);
            }
          });
        });

        const grupos = Array.from(arsMap.entries()).map(([metodo, total]) => ({
          metodo: metodo as MetodoPago,
          total,
        }));
        setArsGrupos(grupos);
        setUsdTotal(usd);
        setCheques(chequesBase);
        onTotalDeclarado?.(
          grupos.reduce((s, g) => s + g.total, 0) + chequesBase.reduce((s, c) => s + c.monto, 0),
          usd
        );
      })
      .catch(() => { if (!cancel) setError('No se pudo cargar el desglose de cobros'); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viajeId]);

  // ── Cargar cajas para cada método (ARS + DOLARES) y bancos ──
  useEffect(() => {
    const metodos: MetodoPago[] = [...arsGrupos.map((g) => g.metodo)];
    if (usdTotal > 0) metodos.push('DOLARES');
    metodos.forEach((m) => {
      if (cajasPorMetodo[m] !== undefined) return;
      cajasApi.getByMetodoPago(m)
        .then((lista) => setCajasPorMetodo((prev) => ({ ...prev, [m]: lista })))
        .catch(() => setCajasPorMetodo((prev) => ({ ...prev, [m]: [] })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arsGrupos, usdTotal]);

  useEffect(() => {
    if (cheques.length > 0 && bancos.length === 0) {
      bancoApi.getActivos().then(setBancos).catch(() => setBancos([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cheques.length]);

  // ── Auto-seleccionar caja default cuando llegan las cajas ──
  useEffect(() => {
    setCajaSel((prev) => {
      const next = { ...prev };
      Object.entries(cajasPorMetodo).forEach(([metodo, lista]) => {
        if (next[metodo] !== undefined && next[metodo] !== '') return;
        if (!lista || lista.length === 0) return;
        const def = lista.find((c) => cajaEsDefaultPara(c, metodo as MetodoPago)) ?? lista[0];
        next[metodo] = def.id;
      });
      return next;
    });
  }, [cajasPorMetodo]);

  const cajasDe = (m: string): CajaUnificada[] => cajasPorMetodo[m] ?? [];

  const updateCheque = (id: string, changes: Partial<ChequeForm>) =>
    setCheques((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));

  // ── Derivar payload y reportar ──
  const payload = useMemo<RendicionConfirmarPayload>(() => {
    const detalles: DetalleRendicion[] = [];

    for (const g of arsGrupos) {
      const caja = cajasDe(g.metodo).find((c) => c.id === cajaSel[g.metodo]);
      detalles.push({
        metodoPago: g.metodo,
        monto: g.total,
        cajaPesosId: caja?.tipo === 'PESOS' ? caja.id : null,
        cajaAhorroId: caja?.tipo === 'AHORRO' ? caja.id : null,
      });
    }
    if (usdTotal > 0) {
      const caja = cajasDe('DOLARES').find((c) => c.id === cajaSel['DOLARES']);
      detalles.push({
        metodoPago: 'DOLARES',
        monto: usdTotal,
        cajaAhorroId: caja?.id ?? null,
      });
    }
    for (const c of cheques) {
      detalles.push({
        metodoPago: 'CHEQUE',
        monto: c.monto,
        cheque: {
          numeroCheque: c.numero.trim(),
          bancoId: c.bancoId === '' ? null : Number(c.bancoId),
          titular: c.titular.trim(),
          cuitTitular: c.cuit.trim() || undefined,
          fechaEmision: c.fechaEmision,
          fechaCobro: c.fechaCobro,
        },
      });
    }

    const totalArs = arsGrupos.reduce((s, g) => s + g.total, 0) + cheques.reduce((s, c) => s + c.monto, 0);
    const cajasOk = arsGrupos.every((g) => cajaSel[g.metodo]) && (usdTotal <= 0 || !!cajaSel['DOLARES']);
    const chequesOk = cheques.every(chequeValido);
    const valid = !loading && detalles.length > 0 && cajasOk && chequesOk;

    return { detalles, totalArs, totalUsd: usdTotal, valid, loading };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arsGrupos, usdTotal, cheques, cajaSel, cajasPorMetodo, loading]);

  useEffect(() => {
    onChange(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
    );
  }
  if (error) {
    return <Typography variant="body2" color="error">{error}</Typography>;
  }
  if (arsGrupos.length === 0 && usdTotal === 0 && cheques.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
        No hay cobros cargados. Volvé al paso anterior y registrá las formas de pago por entrega.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WalletIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight={600}>Imputación a cajas</Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">
        El desglose se arma solo con lo que cargaste por entrega. Elegí a qué caja va cada forma de pago.
      </Typography>

      {/* Cajas por método ARS */}
      {arsGrupos.map((g) => {
        const cajas = cajasDe(g.metodo);
        return (
          <Card key={g.metodo} variant="outlined">
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2">{METODO_PAGO_LABELS[g.metodo] ?? g.metodo}</Typography>
                <Typography variant="h6" fontWeight={700}>{fmt(g.total)}</Typography>
              </Box>
              <FormControl fullWidth size="small" disabled={cajas.length === 0}>
                <InputLabel>Caja destino</InputLabel>
                <Select
                  value={cajaSel[g.metodo] ?? ''}
                  label="Caja destino"
                  onChange={(e) => setCajaSel((prev) => ({ ...prev, [g.metodo]: Number(e.target.value) }))}
                >
                  {cajas.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.nombre}
                      {cajaEsDefaultPara(c, g.metodo) && (
                        <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
                          (default)
                        </Typography>
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        );
      })}

      {/* Caja USD */}
      {usdTotal > 0 && (
        <Card variant="outlined">
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" sx={{ color: 'success.dark' }}>Dólares (USD)</Typography>
              <Typography variant="h6" fontWeight={700} color="success.dark">
                U$D {usdTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <FormControl fullWidth size="small" disabled={cajasDe('DOLARES').length === 0}>
              <InputLabel>Caja destino USD</InputLabel>
              <Select
                value={cajaSel['DOLARES'] ?? ''}
                label="Caja destino USD"
                onChange={(e) => setCajaSel((prev) => ({ ...prev, DOLARES: Number(e.target.value) }))}
              >
                {cajasDe('DOLARES').map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {/* Cheques → cartera */}
      {cheques.length > 0 && (
        <Card variant="outlined">
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ChequeIcon fontSize="small" color="action" />
              <Typography variant="subtitle2">Cheques a registrar en cartera ({cheques.length})</Typography>
            </Box>
            <Stack spacing={1.5}>
              {cheques.map((c, i) => (
                <Stack key={c.id} spacing={1} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" fontWeight={600}>Cheque #{i + 1}</Typography>
                    <Typography variant="body2" fontWeight={600}>{fmt(c.monto)}</Typography>
                  </Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      label="N° cheque" required size="small" fullWidth
                      value={c.numero}
                      onChange={(e) => updateCheque(c.id, { numero: e.target.value })}
                    />
                    <Autocomplete
                      fullWidth
                      size="small"
                      options={bancos}
                      getOptionLabel={(b) => b.nombreCorto ?? b.nombre}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                      value={bancos.find((b) => b.id === c.bancoId) ?? null}
                      onChange={(_, val) => updateCheque(c.id, { bancoId: val ? val.id : '' })}
                      renderInput={(params) => (
                        <TextField {...params} label="Banco" required placeholder="Buscar banco…" />
                      )}
                    />

                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      label="Titular" required size="small" fullWidth
                      value={c.titular}
                      onChange={(e) => updateCheque(c.id, { titular: e.target.value })}
                    />
                    <TextField
                      label="CUIT (opcional)" size="small" fullWidth
                      value={c.cuit}
                      onChange={(e) => updateCheque(c.id, { cuit: e.target.value })}
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      label="Fecha emisión" type="date" required size="small" fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={c.fechaEmision}
                      onChange={(e) => updateCheque(c.id, { fechaEmision: e.target.value })}
                    />
                    <TextField
                      label="Fecha cobro" type="date" required size="small" fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={c.fechaCobro}
                      onChange={(e) => updateCheque(c.id, { fechaCobro: e.target.value })}
                    />
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <TextField
        label="Total a rendir (ARS)"
        value={fmt(payload.totalArs)}
        size="small"
        InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start"><WalletIcon fontSize="small" /></InputAdornment> }}
        fullWidth
      />
    </Stack>
  );
};

export default RendicionConfirmar;
