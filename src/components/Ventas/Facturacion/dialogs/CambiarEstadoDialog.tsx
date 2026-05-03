import { useEffect, useState } from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import type { DocumentoComercial } from '../../../../types';
import { documentoApi } from '../../../../api/services/documentoApi';
import { ESTADO_OPTIONS } from '../constants';

type Estado = DocumentoComercial['estado'];

interface Props {
  documento: DocumentoComercial | null;
  onClose: () => void;
  onUpdated: () => void;
  onError: (message: string) => void;
}

const CambiarEstadoDialog: React.FC<Props> = ({ documento, onClose, onUpdated, onError }) => {
  const [estado, setEstado] = useState<Estado>('PENDIENTE');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (documento) setEstado(documento.estado);
  }, [documento]);

  const handleUpdate = async () => {
    if (!documento || !estado) return;
    setSaving(true);
    try {
      await documentoApi.changeEstado(documento.id, estado);
      onUpdated();
      onClose();
    } catch (err) {
      const e = err as { message?: string };
      onError(`Error al actualizar el estado: ${e?.message || 'Error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(documento)} onClose={onClose}>
      <DialogTitle>Cambiar Estado del Documento</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Nuevo Estado</InputLabel>
          <Select value={estado} onChange={(e) => setEstado(e.target.value as Estado)} label="Nuevo Estado">
            {Object.entries(ESTADO_OPTIONS).map(([value, config]) => (
              <MenuItem key={value} value={value}>
                <Chip label={config.label} color={config.color} size="small" sx={{ mr: 1 }} />
                {config.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleUpdate} disabled={saving}>
          Actualizar Estado
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CambiarEstadoDialog;
