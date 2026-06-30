// V4 — Corrección de precios finales de una Nota de Pedido (solo PENDIENTE).
// Self-contained: maneja su propio estado de líneas, llama a
// documentoApi.corregirLineas y avisa por onSaved para refrescar el listado.
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { documentoApi } from '../../../../api/services';
import type { DocumentoComercial } from '../../../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  nota: DocumentoComercial | null;
}

type TipoDescuento = 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO';

interface LineaState {
  detalleId: number;
  label: string;
  precioUnitario: string;
  cantidad: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const labelDeLinea = (d: any): string => {
  if (d.tipoItem === 'EQUIPO') return d.recetaNombre || d.descripcionEquipo || 'Equipo';
  if (d.tipoItem === 'ENVIO') return d.descripcion || 'Envío';
  return d.productoNombre || d.descripcion || 'Producto';
};

const fmt = (n: number) =>
  `$ ${(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CorregirPreciosDialog: React.FC<Props> = ({ open, onClose, onSaved, nota }) => {
  const [lineas, setLineas] = useState<LineaState[]>([]);
  const [descuentoTipo, setDescuentoTipo] = useState<TipoDescuento>('NONE');
  const [descuentoValor, setDescuentoValor] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializa el estado cuando se abre con una nota nueva.
  React.useEffect(() => {
    if (open && nota) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dets = ((nota as any).detalles || []) as any[];
      setLineas(
        dets.map((d) => ({
          detalleId: d.id,
          label: labelDeLinea(d),
          precioUnitario: String(d.precioUnitario ?? 0),
          cantidad: String(d.cantidad ?? 1),
        }))
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDescuentoTipo(((nota as any).descuentoTipo as TipoDescuento) || 'NONE');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDescuentoValor(String((nota as any).descuentoValor ?? ''));
      setMotivo('');
      setError(null);
    }
  }, [open, nota]);

  const updateLinea = (detalleId: number, changes: Partial<LineaState>) => {
    setLineas((prev) => prev.map((l) => (l.detalleId === detalleId ? { ...l, ...changes } : l)));
  };

  const subtotalBruto = useMemo(
    () =>
      lineas.reduce((acc, l) => {
        const p = parseFloat(l.precioUnitario);
        const c = parseInt(l.cantidad, 10);
        return acc + (isNaN(p) || isNaN(c) ? 0 : p * c);
      }, 0),
    [lineas]
  );

  const descuentoMonto = useMemo(() => {
    const v = parseFloat(descuentoValor) || 0;
    if (descuentoTipo === 'PORCENTAJE') return subtotalBruto * (Math.min(100, Math.max(0, v)) / 100);
    if (descuentoTipo === 'MONTO_FIJO') return Math.min(subtotalBruto, Math.max(0, v));
    return 0;
  }, [descuentoTipo, descuentoValor, subtotalBruto]);

  const subtotalNeto = Math.max(0, subtotalBruto - descuentoMonto);

  const handleSave = async () => {
    if (!nota) return;
    setSaving(true);
    setError(null);
    try {
      await documentoApi.corregirLineas(nota.id, {
        lineas: lineas.map((l) => ({
          detalleId: l.detalleId,
          precioUnitario: parseFloat(l.precioUnitario) || 0,
          cantidad: parseInt(l.cantidad, 10) || 1,
        })),
        descuentoTipo,
        descuentoValor: descuentoTipo === 'NONE' ? 0 : parseFloat(descuentoValor) || 0,
        motivo: motivo.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (e as any)?.response?.data?.message || 'No se pudo corregir la nota de pedido.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Corregir precios — Nota de Pedido {nota?.numeroDocumento}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">
            Solo disponible en notas PENDIENTE. Podés corregir precios de equipos, envío y cantidades.
            El total y las opciones de financiamiento se recalculan al guardar.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ítem</TableCell>
                <TableCell align="right" sx={{ width: 140 }}>Precio unitario</TableCell>
                <TableCell align="right" sx={{ width: 100 }}>Cantidad</TableCell>
                <TableCell align="right" sx={{ width: 140 }}>Subtotal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineas.map((l) => {
                const p = parseFloat(l.precioUnitario) || 0;
                const c = parseInt(l.cantidad, 10) || 0;
                return (
                  <TableRow key={l.detalleId}>
                    <TableCell>{l.label}</TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={l.precioUnitario}
                        onChange={(e) => updateLinea(l.detalleId, { precioUnitario: e.target.value })}
                        inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={l.cantidad}
                        onChange={(e) => updateLinea(l.detalleId, { cantidad: e.target.value })}
                        inputProps={{ min: 1, step: 1, style: { textAlign: 'right' } }}
                      />
                    </TableCell>
                    <TableCell align="right">{fmt(p * c)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Tipo de descuento</InputLabel>
              <Select
                label="Tipo de descuento"
                value={descuentoTipo}
                onChange={(e) => {
                  const next = e.target.value as TipoDescuento;
                  setDescuentoTipo(next);
                  if (next === 'NONE') setDescuentoValor('');
                }}
              >
                <MenuItem value="NONE">Sin descuento</MenuItem>
                <MenuItem value="PORCENTAJE">Porcentaje</MenuItem>
                <MenuItem value="MONTO_FIJO">Monto fijo</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="number"
              label={descuentoTipo === 'PORCENTAJE' ? 'Descuento (%)' : 'Descuento ($)'}
              value={descuentoTipo === 'NONE' ? '' : descuentoValor}
              onChange={(e) => setDescuentoValor(e.target.value)}
              disabled={descuentoTipo === 'NONE'}
            />
          </Box>

          <TextField
            size="small"
            label="Motivo de la corrección (queda registrado)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            fullWidth
          />

          <Divider />
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">{fmt(subtotalBruto)}</Typography>
            </Box>
            {descuentoMonto > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Descuento:</Typography>
                <Typography variant="body2" color="error.main">-{fmt(descuentoMonto)}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={600}>Subtotal neto:</Typography>
              <Typography variant="subtitle1" fontWeight={600}>{fmt(subtotalNeto)}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              El backend recalcula IVA, total y financiación exactos al guardar.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || lineas.length === 0}>
          {saving ? 'Guardando…' : 'Guardar corrección'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CorregirPreciosDialog;
