// FRONT-003: extracted from DeliveriesPage.tsx — par mobile (BottomSheet)
// + desktop (SwipeableDrawer) para confirmar una entrega.  El padre maneja
// la mutación + el upload de fotos/archivos (recibido como callback).
import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography,
} from '@mui/material';
import {
  Article as ArticleIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import BottomSheet from '../components/BottomSheet';
import { useResponsive } from '../useResponsive';
import type { ReceptorData } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  receptor: ReceptorData;
  setReceptor: (data: ReceptorData) => void;
  fotos: File[];
  fotoPreviews: (string | null)[];
  uploading: boolean;
  onPickFile: () => void;
  onRemoveFile: (index: number) => void;
}

interface FotosGridProps {
  fotos: File[];
  fotoPreviews: (string | null)[];
  onRemoveFile: (index: number) => void;
}

const FotosGrid: React.FC<FotosGridProps> = ({ fotos, fotoPreviews, onRemoveFile }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75, mt: 1 }}>
    {fotos.map((file, i) => (
      <Box
        key={i}
        sx={{
          position: 'relative',
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {fotoPreviews[i] ? (
          <img
            src={fotoPreviews[i]!}
            alt={file.name}
            style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box
            sx={{
              height: 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
            }}
          >
            <ArticleIcon color="action" fontSize="small" />
          </Box>
        )}
        <IconButton
          size="small"
          onClick={() => onRemoveFile(i)}
          sx={{
            position: 'absolute',
            top: 2,
            right: 2,
            bgcolor: 'rgba(0,0,0,0.55)',
            color: 'white',
            p: '2px',
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
    ))}
  </Box>
);

const UploadingIndicator: React.FC = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <CircularProgress size={16} />
    <Typography variant="caption">Subiendo archivos...</Typography>
  </Box>
);

const ConfirmDeliveryDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  receptor,
  setReceptor,
  fotos,
  fotoPreviews,
  uploading,
  onPickFile,
  onRemoveFile,
}) => {
  const { isMobile } = useResponsive();
  const fileButtonLabel =
    fotos.length > 0
      ? `${fotos.length} archivo(s) — Agregar más`
      : 'Sacar foto / Adjuntar archivo';

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Confirmar Entrega"
        actions={
          <Stack direction="row" spacing={1.5}>
            <Button onClick={onClose} sx={{ flex: 1, minHeight: 48 }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={onConfirm}
              disabled={!receptor.nombre.trim()}
              sx={{ flex: 1, minHeight: 48 }}
            >
              Confirmar
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Alert severity="info">
            Los equipos cambiaran a estado <strong>ENTREGADO</strong>.
          </Alert>

          <TextField
            label="Nombre del Receptor *"
            value={receptor.nombre}
            onChange={(e) => setReceptor({ ...receptor, nombre: e.target.value })}
            fullWidth
            required
            placeholder="Ej: Juan Perez"
            InputProps={{ sx: { minHeight: 56 } }}
          />

          <TextField
            label="DNI del Receptor"
            value={receptor.dni}
            onChange={(e) => setReceptor({ ...receptor, dni: e.target.value })}
            fullWidth
            placeholder="Ej: 12345678"
            inputMode="numeric"
            InputProps={{ sx: { minHeight: 56 } }}
          />

          <TextField
            label="Observaciones"
            value={receptor.observaciones}
            onChange={(e) => setReceptor({ ...receptor, observaciones: e.target.value })}
            fullWidth
            multiline
            rows={2}
            placeholder="Notas adicionales..."
          />

          <Box>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PhotoCameraIcon />}
              onClick={onPickFile}
              sx={{
                minHeight: 52,
                borderStyle: 'dashed',
                borderColor: 'divider',
                color: 'text.secondary',
              }}
            >
              {fileButtonLabel}
            </Button>
            {fotos.length > 0 && (
              <FotosGrid fotos={fotos} fotoPreviews={fotoPreviews} onRemoveFile={onRemoveFile} />
            )}
          </Box>

          {uploading && <UploadingIndicator />}
        </Stack>
      </BottomSheet>
    );
  }

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      PaperProps={{ sx: { width: 400 } }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <CheckIcon color="success" />
          <Typography variant="h6">Confirmar Entrega</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Los equipos cambiaran a estado <strong>ENTREGADO</strong>.
        </Alert>

        <Stack spacing={2}>
          <TextField
            label="Nombre del Receptor *"
            value={receptor.nombre}
            onChange={(e) => setReceptor({ ...receptor, nombre: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="DNI del Receptor"
            value={receptor.dni}
            onChange={(e) => setReceptor({ ...receptor, dni: e.target.value })}
            fullWidth
          />
          <TextField
            label="Observaciones"
            value={receptor.observaciones}
            onChange={(e) => setReceptor({ ...receptor, observaciones: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />

          <Box>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PhotoCameraIcon />}
              onClick={onPickFile}
              sx={{ borderStyle: 'dashed', borderColor: 'divider', color: 'text.secondary' }}
            >
              {fileButtonLabel}
            </Button>
            {fotos.length > 0 && (
              <FotosGrid fotos={fotos} fotoPreviews={fotoPreviews} onRemoveFile={onRemoveFile} />
            )}
          </Box>

          {uploading && <UploadingIndicator />}

          <Box display="flex" gap={2} mt={2}>
            <Button onClick={onClose} sx={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={onConfirm}
              disabled={!receptor.nombre.trim()}
              sx={{ flex: 1 }}
            >
              Confirmar
            </Button>
          </Box>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );
};

export default ConfirmDeliveryDialog;
