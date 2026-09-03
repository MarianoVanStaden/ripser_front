// Editor de ítems de una liquidación final: tabla + formulario de alta/edición.
// El concepto puede venir del catálogo (descripcion/signo autocompletados,
// editables) o ser un ítem libre (sin conceptoId). El monto va siempre
// positivo; el signo decide si suma o resta. Los totales los calcula el server.

import React, { useState } from 'react';
import {
  Box, Button, IconButton, MenuItem, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography, InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import type {
  ConceptoLiquidacion,
  LiquidacionFinalItem,
  LiquidacionFinalItemRequest,
  SignoConceptoLiquidacion,
} from '../../../api/services/liquidacionFinalApi';

export interface ItemDraft extends LiquidacionFinalItemRequest {
  /** id local o del server; undefined mientras se está creando */
  id?: number;
}

interface Props {
  items: Array<LiquidacionFinalItem | ItemDraft>;
  conceptos: ConceptoLiquidacion[];
  readOnly?: boolean;
  onAdd?: (item: LiquidacionFinalItemRequest) => void;
  onUpdate?: (itemId: number, item: LiquidacionFinalItemRequest) => void;
  onDelete?: (itemId: number) => void;
}

const ITEM_LIBRE = -1;

interface FormState {
  editingId: number | null;
  conceptoId: number;
  descripcion: string;
  signo: SignoConceptoLiquidacion;
  cantidad: string;
  monto: string;
  observacion: string;
}

const emptyForm: FormState = {
  editingId: null,
  conceptoId: ITEM_LIBRE,
  descripcion: '',
  signo: 'HABER',
  cantidad: '',
  monto: '',
  observacion: '',
};

const fmtMonto = (n: number | undefined | null) =>
  `$${Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const ItemsLiquidacionTable: React.FC<Props> = ({
  items, conceptos, readOnly = false, onAdd, onUpdate, onDelete,
}) => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const patch = (p: Partial<FormState>) => setForm(prev => ({ ...prev, ...p }));

  const onConceptoChange = (value: number) => {
    const concepto = conceptos.find(c => c.id === value);
    patch({
      conceptoId: value,
      descripcion: concepto ? concepto.nombre : form.descripcion,
      signo: concepto ? concepto.signo : form.signo,
    });
  };

  const submitForm = () => {
    setFormError(null);
    const monto = Number(form.monto);
    if (!Number.isFinite(monto) || monto < 0) {
      setFormError('El monto debe ser un número ≥ 0');
      return;
    }
    if (form.conceptoId === ITEM_LIBRE && !form.descripcion.trim()) {
      setFormError('Un ítem libre necesita descripción');
      return;
    }
    const payload: LiquidacionFinalItemRequest = {
      conceptoId: form.conceptoId === ITEM_LIBRE ? null : form.conceptoId,
      descripcion: form.descripcion.trim() || undefined,
      signo: form.signo,
      cantidad: form.cantidad === '' ? null : Number(form.cantidad),
      monto,
      observacion: form.observacion.trim() || undefined,
    };
    if (form.editingId != null && onUpdate) {
      onUpdate(form.editingId, payload);
    } else if (onAdd) {
      onAdd(payload);
    }
    setForm(emptyForm);
  };

  const startEdit = (item: LiquidacionFinalItem | ItemDraft, idx: number) => {
    setForm({
      editingId: item.id ?? idx,
      conceptoId: item.conceptoId ?? ITEM_LIBRE,
      descripcion: item.descripcion ?? '',
      signo: (item.signo ?? 'HABER') as SignoConceptoLiquidacion,
      cantidad: item.cantidad != null ? String(item.cantidad) : '',
      monto: String(item.monto ?? ''),
      observacion: item.observacion ?? '',
    });
  };

  return (
    <Box>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell>Concepto</TableCell>
              <TableCell align="right">Cant.</TableCell>
              <TableCell align="right">Haberes</TableCell>
              <TableCell align="right">Descuentos</TableCell>
              <TableCell>Observación</TableCell>
              {!readOnly && <TableCell align="right" />}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={readOnly ? 5 : 6}>
                  <Typography variant="body2" color="textSecondary" align="center" py={1}>
                    Sin ítems cargados
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {items.map((item, idx) => (
              <TableRow key={item.id ?? `draft-${idx}`}>
                <TableCell>{item.descripcion}</TableCell>
                <TableCell align="right">{item.cantidad ?? ''}</TableCell>
                <TableCell align="right">
                  {item.signo === 'HABER' ? fmtMonto(item.monto) : ''}
                </TableCell>
                <TableCell align="right">
                  {item.signo === 'DESCUENTO' ? fmtMonto(item.monto) : ''}
                </TableCell>
                <TableCell>{item.observacion ?? ''}</TableCell>
                {!readOnly && (
                  <TableCell align="right">
                    <Tooltip title="Editar ítem">
                      <IconButton size="small" onClick={() => startEdit(item, idx)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Quitar ítem">
                      <IconButton
                        size="small" color="error"
                        onClick={() => onDelete?.(item.id ?? idx)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {!readOnly && (
        <Box mt={2} p={1.5} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            {form.editingId != null ? 'Editar ítem' : 'Agregar ítem'}
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'flex-start' }}>
            <TextField
              select size="small" label="Concepto" sx={{ minWidth: 220 }}
              value={form.conceptoId}
              onChange={(e) => onConceptoChange(Number(e.target.value))}
            >
              <MenuItem value={ITEM_LIBRE}><em>Ítem libre (sin catálogo)</em></MenuItem>
              {conceptos.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre} {c.signo === 'DESCUENTO' ? '(desc.)' : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small" label="Descripción" sx={{ flex: 1, minWidth: 200 }}
              value={form.descripcion}
              onChange={(e) => patch({ descripcion: e.target.value })}
            />
            <TextField
              select size="small" label="Signo" sx={{ minWidth: 140 }}
              value={form.signo}
              onChange={(e) => patch({ signo: e.target.value as SignoConceptoLiquidacion })}
            >
              <MenuItem value="HABER">Haber (+)</MenuItem>
              <MenuItem value="DESCUENTO">Descuento (−)</MenuItem>
            </TextField>
            <TextField
              size="small" label="Cant." type="number" sx={{ width: 90 }}
              value={form.cantidad}
              onChange={(e) => patch({ cantidad: e.target.value })}
            />
            <TextField
              size="small" label="Monto" type="number" sx={{ width: 150 }}
              value={form.monto}
              onChange={(e) => patch({ monto: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
            <TextField
              size="small" label="Observación" sx={{ minWidth: 150 }}
              value={form.observacion}
              onChange={(e) => patch({ observacion: e.target.value })}
            />
            <Stack direction="row" spacing={0.5}>
              <Button
                variant="contained" size="small" startIcon={<AddIcon />}
                onClick={submitForm}
              >
                {form.editingId != null ? 'Guardar' : 'Agregar'}
              </Button>
              {form.editingId != null && (
                <Tooltip title="Cancelar edición">
                  <IconButton size="small" onClick={() => setForm(emptyForm)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
          {formError && (
            <Typography variant="caption" color="error" display="block" mt={0.5}>
              {formError}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ItemsLiquidacionTable;
