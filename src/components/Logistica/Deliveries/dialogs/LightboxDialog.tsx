// FRONT-003: extracted from DeliveriesPage.tsx — lightbox para mostrar
// imágenes (fotos de contrato/remito) en tamaño completo.  El padre
// maneja `URL.revokeObjectURL` cuando cierra.
import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
} from '@mui/material';

interface Props {
  src: string | null;
  onClose: () => void;
}

const LightboxDialog: React.FC<Props> = ({ src, onClose }) => {
  return (
    <Dialog open={!!src} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 0, bgcolor: 'black' }}>
        {src && (
          <img
            src={src}
            alt="Vista previa"
            style={{
              width: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LightboxDialog;
