// Modal "calculadora" que se abre al Exportar a PDF un presupuesto.
// Muestra el precio contado efectivo y permite elegir qué formas de
// financiación incluir en el PDF (evita la "sábana" de todas las opciones).
// La selección es efímera: solo determina qué se exporta, no persiste.
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { DocumentoComercial, OpcionFinanciamientoDTO } from '../../../../types';
import type { OpcionFinanciamientoTemplateDTO } from '../../../../api/services/opcionFinanciamientoTemplateApi';
import opcionFinanciamientoTemplateApi from '../../../../api/services/opcionFinanciamientoTemplateApi';
import {
  calcularFinanciamientoPropio,
  calculateCostoEnvio,
  formatCurrencyARS,
  getMetodoPagoLabel,
} from '../../../../utils/financiamiento';

interface Props {
  open: boolean;
  onClose: () => void;
  presupuesto: DocumentoComercial | null;
  onExport: (opciones: OpcionFinanciamientoDTO[]) => void;
}

const esContadoTemplate = (t: OpcionFinanciamientoTemplateDTO): boolean =>
  t.metodoPago === 'EFECTIVO' && t.cantidadCuotas <= 1;

/** Determina si una plantilla debe venir pre-tildada por defecto. */
const esDefaultSeleccionada = (t: OpcionFinanciamientoTemplateDTO): boolean => {
  const nombre = (t.nombre || '').toLowerCase();
  if (esContadoTemplate(t)) return true; // contado efectivo
  if (t.metodoPago === 'CHEQUE' && t.cantidadCuotas === 3) return true; // 3 cheques 30/60/90
  if (nombre.includes('semanal') && (t.cantidadCuotas === 12 || t.cantidadCuotas === 24)) return true;
  if (nombre.includes('mensual') && t.cantidadCuotas === 3) return true;
  return false;
};

const chequeVencimientos = (cuotas: number): string =>
  Array.from({ length: cuotas }, (_, i) => `${(i + 1) * 30}`).join('/') + ' días';

const CalculadoraPDFDialog: React.FC<Props> = ({ open, onClose, presupuesto, onExport }) => {
  const [templates, setTemplates] = useState<OpcionFinanciamientoTemplateDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // % de entrega inicial global (default 40%).
  const [entregaPctInput, setEntregaPctInput] = useState('40');

  const costoEnvio = useMemo(
    () => (presupuesto ? calculateCostoEnvio(presupuesto.detalles ?? []) : 0),
    [presupuesto]
  );
  const base = useMemo(
    () => (presupuesto ? Math.max(0, Number(presupuesto.total ?? 0) - costoEnvio) : 0),
    [presupuesto, costoEnvio]
  );
  const contadoTotal = base + costoEnvio;

  const entregaPct = useMemo(() => {
    const n = Number(entregaPctInput);
    if (!Number.isFinite(n)) return 0.4;
    return Math.min(100, Math.max(0, n)) / 100;
  }, [entregaPctInput]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setEntregaPctInput('40');
    opcionFinanciamientoTemplateApi
      .obtenerActivas()
      .then((data) => {
        if (cancelled) return;
        const ordenadas = [...data].sort(
          (a, b) => (a.ordenPresentacion ?? 999) - (b.ordenPresentacion ?? 999)
        );
        setTemplates(ordenadas);
        setSelectedIds(
          new Set(ordenadas.filter((t) => t.id != null && esDefaultSeleccionada(t)).map((t) => t.id as number))
        );
      })
      .catch((e) => {
        console.error('Error cargando plantillas de financiamiento:', e);
        if (!cancelled) setError('No se pudieron cargar las formas de financiación.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const toggle = (id?: number) => {
    if (id == null) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildOpciones = (): OpcionFinanciamientoDTO[] =>
    templates
      .filter((t) => t.id != null && selectedIds.has(t.id))
      .map((t) => {
        if (esContadoTemplate(t)) {
          return {
            id: t.id,
            nombre: t.nombre,
            metodoPago: t.metodoPago,
            cantidadCuotas: t.cantidadCuotas,
            tasaInteres: t.tasaInteres,
            descripcion: t.descripcion,
            ordenPresentacion: t.ordenPresentacion,
            montoTotal: contadoTotal,
            montoCuota: 0,
            montoEntregaInicial: null,
            porcentajeEntregaInicial: null,
          } as OpcionFinanciamientoDTO;
        }
        const calc = calcularFinanciamientoPropio(base, t.tasaInteres, t.cantidadCuotas, entregaPct, costoEnvio);
        const esCheque = t.metodoPago === 'CHEQUE';
        const descripcion = esCheque
          ? [t.descripcion, `Cheques a ${chequeVencimientos(t.cantidadCuotas)}`].filter(Boolean).join(' — ')
          : t.descripcion;
        return {
          id: t.id,
          nombre: t.nombre,
          metodoPago: t.metodoPago,
          cantidadCuotas: t.cantidadCuotas,
          tasaInteres: t.tasaInteres,
          descripcion,
          ordenPresentacion: t.ordenPresentacion,
          montoTotal: calc.totalEstimado,
          montoCuota: calc.cuotaEstimada,
          montoEntregaInicial: calc.entrega,
          porcentajeEntregaInicial: Math.round(entregaPct * 100),
        } as OpcionFinanciamientoDTO;
      });

  const handleExport = () => {
    onExport(buildOpciones());
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{ '& .MuiDialog-paper': { maxHeight: { xs: '100%', sm: '90vh' }, m: { xs: 0, sm: 2 } } }}
    >
      <DialogTitle>
        Calculadora de financiación
        <Typography variant="body2" color="text.secondary">
          Elegí qué formas de pago incluir en el PDF
        </Typography>
      </DialogTitle>
      <DialogContent>
        {/* Precio contado efectivo destacado */}
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 1,
            bgcolor: 'success.light',
            color: 'success.contrastText',
          }}
        >
          <Typography variant="overline" sx={{ display: 'block', lineHeight: 1.2 }}>
            Precio total contado efectivo
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {formatCurrencyARS(contadoTotal, 2)}
          </Typography>
          {costoEnvio > 0 && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              Incluye envío {formatCurrencyARS(costoEnvio, 2)} · Base equipos {formatCurrencyARS(base, 2)}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            label="Entrega inicial"
            size="small"
            type="number"
            value={entregaPctInput}
            onChange={(e) => setEntregaPctInput(e.target.value)}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            sx={{ width: 160 }}
            helperText="Se recibe al entregar el producto"
          />
          <Typography variant="caption" color="text.secondary">
            La entrega se calcula como {Math.round(entregaPct * 100)}% de los equipos + el envío
            completo. El saldo restante se financia según cada opción.
          </Typography>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && !loading && <Alert severity="error">{error}</Alert>}
        {!loading && !error && templates.length === 0 && (
          <Alert severity="info">No hay formas de financiación activas configuradas.</Alert>
        )}

        {!loading &&
          !error &&
          templates.map((t) => {
            const isSelected = t.id != null && selectedIds.has(t.id);
            const contado = esContadoTemplate(t);
            const calc = contado
              ? null
              : calcularFinanciamientoPropio(base, t.tasaInteres, t.cantidadCuotas, entregaPct, costoEnvio);
            const esCheque = t.metodoPago === 'CHEQUE';
            return (
              <Box
                key={t.id}
                onClick={() => toggle(t.id)}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  mb: 1.5,
                  cursor: 'pointer',
                  bgcolor: isSelected ? 'action.selected' : 'background.paper',
                  '&:hover': { borderColor: 'primary.light' },
                }}
              >
                <FormControlLabel
                  control={<Checkbox checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={() => toggle(t.id)} />}
                  sx={{ width: '100%', alignItems: 'flex-start', m: 0, '& .MuiFormControlLabel-label': { width: '100%' } }}
                  label={
                    <Box sx={{ width: '100%' }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="subtitle1" fontWeight={600}>
                          {t.nombre}
                        </Typography>
                        <Chip size="small" variant="outlined" label={getMetodoPagoLabel(t.metodoPago)} />
                        {t.tasaInteres > 0 && (
                          <Chip size="small" color="warning" variant="outlined" label={`${t.tasaInteres}% interés`} />
                        )}
                        {esCheque && (
                          <Chip size="small" color="info" variant="outlined" label={chequeVencimientos(t.cantidadCuotas)} />
                        )}
                      </Stack>
                      {contado ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Total: {formatCurrencyARS(contadoTotal, 2)}
                        </Typography>
                      ) : (
                        calc && (
                          <Box
                            sx={{
                              mt: 1,
                              display: 'grid',
                              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                              gap: 1,
                            }}
                          >
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Entrega inicial ({Math.round(entregaPct * 100)}%)
                              </Typography>
                              <Typography variant="body2">{formatCurrencyARS(calc.entrega, 2)}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Saldo a financiar
                              </Typography>
                              <Typography variant="body2">{formatCurrencyARS(calc.saldo, 2)}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {t.cantidadCuotas} cuotas de
                              </Typography>
                              <Typography variant="body2" fontWeight={700} color="primary.main">
                                {formatCurrencyARS(calc.cuotaEstimada, 2)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Total estimado
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {formatCurrencyARS(calc.totalEstimado, 2)}
                              </Typography>
                            </Box>
                          </Box>
                        )
                      )}
                    </Box>
                  }
                />
              </Box>
            );
          })}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleExport} variant="contained" disabled={loading || selectedIds.size === 0}>
          Exportar PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalculadoraPDFDialog;
