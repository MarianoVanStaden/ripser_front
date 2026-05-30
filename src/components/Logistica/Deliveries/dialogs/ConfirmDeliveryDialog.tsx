// FRONT-003: extracted from DeliveriesPage.tsx — par mobile (BottomSheet)
// + desktop (SwipeableDrawer) para confirmar una entrega.  El padre maneja
// la mutación + el upload de fotos/archivos (recibido como callback).
import React, { useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography,
} from '@mui/material';
import {
  Article as ArticleIcon,
  AttachMoney as AttachMoneyIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import BottomSheet from '../components/BottomSheet';
import { useResponsive } from '../useResponsive';
import type { CobroData, ReceptorData } from '../types';

const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA_BANCARIA', label: 'Transferencia bancaria' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de débito' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de crédito' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  receptor: ReceptorData;
  setReceptor: (data: ReceptorData) => void;
  cobro: CobroData;
  setCobro: (data: CobroData) => void;
  /** Monto esperado a cobrar (de la opción de financiamiento o total del doc). */
  montoEsperado?: number | null;
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

const fmt = (n?: number | null) =>
  n != null
    ? `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;

interface CobroSectionProps {
  cobro: CobroData;
  setCobro: (d: CobroData) => void;
  montoEsperado?: number | null;
}

const CobroSection: React.FC<CobroSectionProps> = ({ cobro, setCobro, montoEsperado }) => {
  const diff = useMemo(() => {
    const val = parseFloat(cobro.montoCobrado);
    if (!cobro.montoCobrado || isNaN(val)) return null;
    if (montoEsperado == null) return null;
    return val - montoEsperado;
  }, [cobro.montoCobrado, montoEsperado]);

  const diffLabel = diff == null ? null : diff === 0
    ? { label: 'Cobro exacto ✓', color: 'success' as const }
    : diff > 0
    ? { label: `+${fmt(diff)} de más`, color: 'warning' as const }
    : { label: `${fmt(diff)} de menos`, color: 'error' as const };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <AttachMoneyIcon fontSize="small" color="action" />
        <Typography variant="subtitle2" fontWeight={600}>
          Cobro al cliente
        </Typography>
        {montoEsperado != null && (
          <Typography variant="caption" color="text.secondary">
            (esperado: {fmt(montoEsperado)})
          </Typography>
        )}
      </Box>

      <Stack spacing={1.5}>
        <TextField
          label="Monto cobrado"
          value={cobro.montoCobrado}
          onChange={(e) => setCobro({ ...cobro, montoCobrado: e.target.value })}
          fullWidth
          type="number"
          inputMode="decimal"
          placeholder={montoEsperado != null ? String(montoEsperado) : '0.00'}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
            sx: { minHeight: 52 },
          }}
        />

        {diffLabel && (
          <Chip
            label={diffLabel.label}
            color={diffLabel.color}
            size="small"
            sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
          />
        )}

        <FormControl fullWidth size="small">
          <InputLabel>Método de pago</InputLabel>
          <Select
            value={cobro.metodoPago}
            label="Método de pago"
            onChange={(e) => setCobro({ ...cobro, metodoPago: e.target.value })}
          >
            {METODOS_PAGO.map((mp) => (
              <MenuItem key={mp.value} value={mp.value}>
                {mp.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="N.º de comprobante / transferencia (opcional)"
          value={cobro.comprobante}
          onChange={(e) => setCobro({ ...cobro, comprobante: e.target.value })}
          fullWidth
          size="small"
          placeholder="Ej: CVU / número de recibo"
        />
      </Stack>
    </Box>
  );
};

const ConfirmDeliveryDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  receptor,
  setReceptor,
  cobro,
  setCobro,
  montoEsperado,
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
            Los equipos cambiarán a estado <strong>ENTREGADO</strong>.
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

          <Divider />

          <CobroSection cobro={cobro} setCobro={setCobro} montoEsperado={montoEsperado} />

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
      PaperProps={{ sx: { width: 420 } }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <CheckIcon color="success" />
          <Typography variant="h6">Confirmar Entrega</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Los equipos cambiarán a estado <strong>ENTREGADO</strong>.
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

          <Divider />

          <CobroSection cobro={cobro} setCobro={setCobro} montoEsperado={montoEsperado} />

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
