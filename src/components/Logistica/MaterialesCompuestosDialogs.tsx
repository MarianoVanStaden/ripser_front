import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  IconButton,
  Autocomplete,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { productoCompuestoApi } from '../../api/services/productoCompuestoApi';
import type { ComponenteProductoDTO } from '../../types';

export interface ProductoPicker {
  id: number;
  nombre: string;
  codigo?: string | null;
}

const apiError = (err: unknown, fallback: string) => {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message ?? fallback;
};

// ── Editor de composición (BOM del compuesto) ───────────────────────────────
interface FilaComp {
  producto: ProductoPicker | null;
  cantidad: number | '';
}

export const ComposicionDialog: React.FC<{
  open: boolean;
  producto: ProductoPicker | null;
  productos: ProductoPicker[];
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, producto, productos, canEdit, onClose, onSaved }) => {
  const [filas, setFilas] = useState<FilaComp[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && producto) {
      setError(null);
      setCargando(true);
      productoCompuestoApi
        .getComponentes(producto.id)
        .then((comps) =>
          setFilas(
            comps.map((c: ComponenteProductoDTO) => ({
              producto: {
                id: c.productoComponenteId,
                nombre: c.productoComponenteNombre ?? `#${c.productoComponenteId}`,
                codigo: c.productoComponenteCodigo,
              },
              cantidad: c.cantidad,
            })),
          ),
        )
        .catch((err) => setError(apiError(err, 'No se pudo cargar la composición')))
        .finally(() => setCargando(false));
    }
  }, [open, producto]);

  const setFila = (i: number, patch: Partial<FilaComp>) =>
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const handleGuardar = async () => {
    if (!producto) return;
    const validas = filas.filter((f) => f.producto && Number(f.cantidad) > 0);
    setGuardando(true);
    setError(null);
    try {
      await productoCompuestoApi.setComponentes(producto.id, {
        componentes: validas.map((f) => ({
          productoComponenteId: f.producto!.id,
          cantidad: Number(f.cantidad),
        })),
      });
      onSaved();
    } catch (err) {
      setError(apiError(err, 'No se pudo guardar la composición'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Composición — {producto?.nombre}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Materia prima necesaria por <strong>una unidad</strong> de este compuesto.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {cargando ? (
          <CircularProgress size={26} />
        ) : (
          <Stack spacing={1.5}>
            {filas.map((f, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="center">
                <Autocomplete
                  sx={{ flex: 1 }}
                  size="small"
                  disabled={!canEdit}
                  options={productos.filter((p) => p.id !== producto?.id)}
                  value={f.producto}
                  getOptionLabel={(p) => (p.codigo ? `${p.nombre} (${p.codigo})` : p.nombre)}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  onChange={(_, value) => setFila(i, { producto: value })}
                  renderInput={(params) => <TextField {...params} label="Componente" />}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Cantidad"
                  disabled={!canEdit}
                  value={f.cantidad}
                  onChange={(e) =>
                    setFila(i, { cantidad: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                  sx={{ width: 130 }}
                  inputProps={{ min: 0, step: '0.0001' }}
                />
                {canEdit && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setFilas((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            ))}
            {filas.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Sin composición definida.
              </Typography>
            )}
            {canEdit && (
              <Button
                startIcon={<AddIcon />}
                size="small"
                onClick={() => setFilas((prev) => [...prev, { producto: null, cantidad: 1 }])}
              >
                Agregar componente
              </Button>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        {canEdit && (
          <Button variant="contained" disabled={guardando || cargando} onClick={handleGuardar}>
            {guardando ? <CircularProgress size={20} /> : 'Guardar composición'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ── Ajuste manual de stock ──────────────────────────────────────────────────
export const AjusteStockDialog: React.FC<{
  open: boolean;
  producto: (ProductoPicker & { stockActual?: number }) | null;
  onClose: () => void;
  onAdjusted: () => void;
}> = ({ open, producto, onClose, onAdjusted }) => {
  const [nuevoStock, setNuevoStock] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && producto) {
      setNuevoStock(producto.stockActual ?? 0);
      setMotivo('');
      setError(null);
    }
  }, [open, producto]);

  const handleGuardar = async () => {
    if (!producto || nuevoStock === '') return;
    setGuardando(true);
    setError(null);
    try {
      await productoCompuestoApi.ajustarStock(producto.id, {
        nuevoStock: Number(nuevoStock),
        motivo: motivo || null,
      });
      onAdjusted();
    } catch (err) {
      setError(apiError(err, 'No se pudo ajustar el stock'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Ajustar stock — {producto?.nombre}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            type="number"
            label="Nuevo stock"
            size="small"
            value={nuevoStock}
            onChange={(e) => setNuevoStock(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
            inputProps={{ min: 0 }}
          />
          <TextField
            label="Motivo"
            size="small"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={guardando || nuevoStock === ''} onClick={handleGuardar}>
          {guardando ? <CircularProgress size={20} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
