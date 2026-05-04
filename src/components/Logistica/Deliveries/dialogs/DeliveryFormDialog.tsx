// FRONT-003: extracted from DeliveriesPage.tsx — par mobile (BottomSheet)
// + desktop (SwipeableDrawer) para crear/editar una entrega.  El padre
// maneja persistencia y mantiene el form state.
import React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import BottomSheet from '../components/BottomSheet';
import { useResponsive } from '../useResponsive';
import type {
  Cliente,
  DocumentoComercial,
  EntregaViaje,
  EstadoEntrega,
  Viaje,
} from '../../../../types';
import type { DeliveryFormData } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editing: EntregaViaje | null;
  formData: DeliveryFormData;
  setFormData: (data: DeliveryFormData) => void;
  facturas: DocumentoComercial[];
  trips: Viaje[];
  /** Currently unused in the form but kept in the props bag for future
   *  features (the orchestrator already loads clients for other views). */
  clients?: Cliente[];
}

const DeliveryFormDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  editing,
  formData,
  setFormData,
  facturas,
  trips,
}) => {
  const { isMobile, isTablet } = useResponsive();
  const title = editing ? 'Editar Entrega' : 'Nueva Entrega';
  const submitLabel = editing ? 'Actualizar' : 'Crear';

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={title}
        actions={
          <Stack direction="row" spacing={1.5}>
            <Button onClick={onClose} sx={{ flex: 1, minHeight: 48 }}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={onSave} sx={{ flex: 1, minHeight: 48 }}>
              {submitLabel}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2.5}>
          <Autocomplete
            options={facturas}
            getOptionLabel={(f) =>
              `${f.numeroDocumento || `FAC-${f.id}`} - ${f.clienteNombre || 'Sin cliente'}`
            }
            value={facturas.find((f) => f.id.toString() === formData.ventaId) || null}
            onChange={(_, value) =>
              setFormData({ ...formData, ventaId: value?.id.toString() || '' })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Factura"
                size="medium"
                InputProps={{ ...params.InputProps, sx: { minHeight: 56 } }}
              />
            )}
          />

          <Autocomplete
            options={trips}
            getOptionLabel={(t) => `Viaje #${t.id} - ${t.destino}`}
            value={trips.find((t) => t.id.toString() === formData.viajeId) || null}
            onChange={(_, value) =>
              setFormData({ ...formData, viajeId: value?.id.toString() || '' })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Viaje"
                size="medium"
                InputProps={{ ...params.InputProps, sx: { minHeight: 56 } }}
              />
            )}
          />

          <TextField
            label="Direccion de Entrega"
            value={formData.direccionEntrega}
            onChange={(e) => setFormData({ ...formData, direccionEntrega: e.target.value })}
            fullWidth
            required
            multiline
            rows={2}
            InputProps={{ sx: { minHeight: 80 } }}
          />

          <TextField
            label="Fecha de Entrega"
            type="datetime-local"
            value={formData.fechaEntrega}
            onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: { minHeight: 56 } }}
          />

          <TextField
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />
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
      PaperProps={{ sx: { width: isTablet ? '80%' : 450 } }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={2.5}>
          <Autocomplete
            options={facturas}
            getOptionLabel={(f) =>
              `${f.numeroDocumento || `FAC-${f.id}`} - ${f.clienteNombre || 'Sin cliente'}`
            }
            value={facturas.find((f) => f.id.toString() === formData.ventaId) || null}
            onChange={(_, value) =>
              setFormData({ ...formData, ventaId: value?.id.toString() || '' })
            }
            renderInput={(params) => <TextField {...params} label="Factura" />}
          />

          <Autocomplete
            options={trips}
            getOptionLabel={(t) => `Viaje #${t.id} - ${t.destino}`}
            value={trips.find((t) => t.id.toString() === formData.viajeId) || null}
            onChange={(_, value) =>
              setFormData({ ...formData, viajeId: value?.id.toString() || '' })
            }
            renderInput={(params) => <TextField {...params} label="Viaje" />}
          />

          <TextField
            label="Direccion de Entrega"
            value={formData.direccionEntrega}
            onChange={(e) => setFormData({ ...formData, direccionEntrega: e.target.value })}
            fullWidth
            required
            multiline
            rows={2}
          />

          <TextField
            label="Fecha de Entrega"
            type="datetime-local"
            value={formData.fechaEntrega}
            onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              value={formData.estado}
              label="Estado"
              onChange={(e) =>
                setFormData({ ...formData, estado: e.target.value as EstadoEntrega })
              }
            >
              <MenuItem value="PENDIENTE">Pendiente</MenuItem>
              <MenuItem value="ENTREGADA">Entregada</MenuItem>
              <MenuItem value="NO_ENTREGADA">No Entregada</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />

          <Divider />

          <Box display="flex" gap={2}>
            <Button onClick={onClose} sx={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={onSave} sx={{ flex: 1 }}>
              {submitLabel}
            </Button>
          </Box>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );
};

export default DeliveryFormDialog;
