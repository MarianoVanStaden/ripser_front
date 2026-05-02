import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { PersonSearch as PersonSearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { DuplicatePhoneError } from '../../types/lead.types';

interface Props {
  open: boolean;
  error: DuplicatePhoneError | null;
  onClose: () => void;
  // En modo edición ofrecer "Ir al lead existente" rompería el flujo del usuario
  // (perdería los cambios sin guardar), así que mostramos solo el aviso.
  warnOnly?: boolean;
}

export const DuplicatePhoneDialog: React.FC<Props> = ({ open, error, onClose, warnOnly = false }) => {
  const navigate = useNavigate();

  if (!error) return null;

  const isLead = error.existingType === 'LEAD';
  const destino = isLead ? `/leads/${error.existingId}` : `/clientes/${error.existingId}`;

  const handleNavigate = () => {
    onClose();
    navigate(destino);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonSearchIcon color="warning" />
        Teléfono ya registrado
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          El número <strong>{error.telefono}</strong> ya está registrado como{' '}
          <strong>{isLead ? 'lead' : 'cliente'}</strong>:{' '}
          <strong>{error.existingNombre}</strong>.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          {warnOnly
            ? `Otro ${isLead ? 'lead' : 'cliente'} ya tiene este número cargado. Revisá si es un duplicado antes de guardar.`
            : `En lugar de duplicar el registro, podés agregar una nueva interacción directamente en el ${isLead ? 'lead' : 'cliente'} existente.`}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{warnOnly ? 'Entendido' : 'Cancelar'}</Button>
        {!warnOnly && (
          <Button variant="contained" color="warning" onClick={handleNavigate}>
            Ir al {isLead ? 'lead' : 'cliente'} existente
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
