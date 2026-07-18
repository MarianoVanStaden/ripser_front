// Definir/corregir el color de las líneas EQUIPO de una nota de pedido o factura
// cuando el cliente lo informa después de crear el documento. Solo cambia el color
// solicitado del detalle (documentoApi.actualizarColorDetalle); no toca montos ni
// re-resuelve equipos. El backend rechaza con 400 si el equipo asignado ya tiene
// color aplicado (esa corrección va por taller).
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
} from '@mui/material';
import { documentoApi } from '../../../../api/services';
import { colorApi, type Color } from '../../../../api/services/colorApi';
import type { DocumentoComercial } from '../../../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  documento: DocumentoComercial | null;
}

interface LineaColorState {
  detalleId: number;
  label: string;
  colorActual: string | null;
  colorIdOriginal: number | '';
  colorId: number | '';
}

const EditarColorDetalleDialog: React.FC<Props> = ({ open, onClose, onSaved, documento }) => {
  const [lineas, setLineas] = useState<LineaColorState[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && documento) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dets = ((documento as any).detalles || []) as any[];
      setLineas(
        dets
          .filter((d) => d.tipoItem === 'EQUIPO')
          .map((d) => ({
            detalleId: d.id,
            label: d.recetaNombre || d.descripcionEquipo || 'Equipo',
            colorActual: d.color?.nombre ?? null,
            colorIdOriginal: d.color?.id ?? '',
            colorId: d.color?.id ?? '',
          }))
      );
      setMotivo('');
      setError(null);
      colorApi
        .list(true)
        .then(setColores)
        .catch(() => setError('No se pudo cargar el catálogo de colores'));
    }
  }, [open, documento]);

  const updateLinea = (detalleId: number, colorId: number | '') => {
    setLineas((prev) => prev.map((l) => (l.detalleId === detalleId ? { ...l, colorId } : l)));
  };

  const cambios = lineas.filter((l) => l.colorId !== '' && l.colorId !== l.colorIdOriginal);

  const handleSave = async () => {
    if (!documento || cambios.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      for (const l of cambios) {
        await documentoApi.actualizarColorDetalle(documento.id, l.detalleId, {
          colorId: l.colorId as number,
          motivo: motivo.trim() || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (e as any)?.response?.data?.message || 'No se pudo actualizar el color.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar color — {documento?.numeroDocumento}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">
            Define el color solicitado de las líneas de equipo. No cambia montos. Si el equipo
            asignado ya fue pintado, la corrección debe hacerse por taller.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}

          {lineas.length === 0 ? (
            <Alert severity="warning">Este documento no tiene líneas de equipo.</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Equipo</TableCell>
                  <TableCell sx={{ width: 130 }}>Color actual</TableCell>
                  <TableCell sx={{ width: 200 }}>Nuevo color</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineas.map((l) => (
                  <TableRow key={l.detalleId}>
                    <TableCell>{l.label}</TableCell>
                    <TableCell>{l.colorActual || 'Sin definir'}</TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Color</InputLabel>
                        <Select
                          label="Color"
                          value={l.colorId}
                          onChange={(e) => updateLinea(l.detalleId, e.target.value as number | '')}
                        >
                          {colores.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <TextField
            size="small"
            label="Motivo (queda registrado)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || cambios.length === 0}>
          {saving ? 'Guardando…' : 'Guardar color'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditarColorDetalleDialog;
