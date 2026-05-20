import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { costoEnvioApi } from '../../api/services/costoEnvioApi';
import type { CostoEnvioDTO, Provincia } from '../../types/costoEnvio.types';

export default function CostosEnvioPage() {
  const [costos, setCostos] = useState<CostoEnvioDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProv, setEditingProv] = useState<Provincia | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Trigger seed so all provinces exist for this tenant
      await costoEnvioApi.seed().catch(() => {});
      const data = await costoEnvioApi.getAll();
      setCostos(data);
    } catch {
      setError('Error al cargar los costos de envío');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (editingProv && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingProv]);

  const startEdit = (costo: CostoEnvioDTO) => {
    setEditingProv(costo.provincia);
    setEditValue(String(costo.precio));
  };

  const cancelEdit = () => {
    setEditingProv(null);
    setEditValue('');
  };

  const saveEdit = async (provincia: Provincia) => {
    const parsed = parseFloat(editValue);
    if (isNaN(parsed) || parsed < 0) {
      setSnackbar({ open: true, message: 'Ingrese un precio válido', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const updated = await costoEnvioApi.update(provincia, parsed);
      setCostos((prev) => prev.map((c) => (c.provincia === provincia ? updated : c)));
      setEditingProv(null);
      setEditValue('');
      setSnackbar({ open: true, message: 'Precio actualizado', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Error al guardar el precio', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, provincia: Provincia) => {
    if (e.key === 'Enter') saveEdit(provincia);
    if (e.key === 'Escape') cancelEdit();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button onClick={load}>Reintentar</Button>}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, pt: 2, pb: 4 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Precios de envío por provincia. Haga clic en el ícono de edición para modificar un precio. Los costos de envío no están sujetos a descuentos en los documentos comerciales.
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: 50 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Provincia</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Precio</TableCell>
              <TableCell sx={{ width: 100 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {costos.map((costo, idx) => (
              <TableRow key={costo.provincia} hover>
                <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                <TableCell>{costo.provinciaNombre}</TableCell>
                <TableCell align="right">
                  {editingProv === costo.provincia ? (
                    <TextField
                      inputRef={inputRef}
                      size="small"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, costo.provincia)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{ width: 160 }}
                      disabled={saving}
                    />
                  ) : (
                    <Typography variant="body2">
                      ${costo.precio.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {editingProv === costo.provincia ? (
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="Guardar">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => saveEdit(costo.provincia)}
                            disabled={saving}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Cancelar">
                        <IconButton size="small" onClick={cancelEdit} disabled={saving}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Tooltip title="Editar precio">
                      <IconButton size="small" onClick={() => startEdit(costo)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
