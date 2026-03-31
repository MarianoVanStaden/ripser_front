import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Autocomplete,
  Alert,
  Typography,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { chequeApi } from '../../api/services/chequeApi';
import { proveedorApi } from '../../api/services/proveedorApi';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import type { Cheque, Proveedor, EndosoChequeCreateDTO } from '../../types';

dayjs.locale('es');

interface Props {
  open: boolean;
  cheque: Cheque | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Form data interface
interface EndosoFormData {
  proveedorDestinoId: number | undefined;
  observaciones: string;
}

// Validation schema
const validationSchema = yup.object({
  proveedorDestinoId: yup
    .number()
    .nullable()
    .required('Debe seleccionar un proveedor')
    .min(1, 'Debe seleccionar un proveedor'),
  observaciones: yup
    .string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
    .optional(),
});

const EndosarChequeDialog: React.FC<Props> = ({ open, cheque, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loadingProveedores, setLoadingProveedores] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EndosoFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      proveedorDestinoId: undefined,
      observaciones: '',
    },
  });

  const selectedProveedorId = watch('proveedorDestinoId');

  // Load proveedores
  useEffect(() => {
    if (open) {
      loadProveedores();
    }
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        proveedorDestinoId: undefined,
        observaciones: '',
      });
      setError(null);
    }
  }, [open, reset]);

  const loadProveedores = async () => {
    try {
      setLoadingProveedores(true);
      const data = await proveedorApi.getAll({ size: 1000 });
      const lista = Array.isArray(data) ? data : (data as any).content ?? [];

      // Filter only active proveedores and filter out current provider if check is already endorsed
      let filteredProveedores = lista.filter((p: any) => p.estado === 'ACTIVO' || !p.estado);
      if (cheque?.proveedorId) {
        filteredProveedores = filteredProveedores.filter((p: any) => p.id !== cheque.proveedorId);
      }

      setProveedores(filteredProveedores);
    } catch (err: any) {
      console.error('Error loading proveedores:', err);
      setError('Error al cargar proveedores');
    } finally {
      setLoadingProveedores(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!cheque || !data.proveedorDestinoId) {
      setError('Datos incompletos para realizar el endoso');
      return;
    }

    // Validate self-endorsement (double check)
    if (cheque.proveedorId && data.proveedorDestinoId === cheque.proveedorId) {
      setError('No puede endosar un cheque al mismo proveedor');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endosoData: EndosoChequeCreateDTO = {
        chequeId: cheque.id,
        proveedorDestinoId: data.proveedorDestinoId,
        observaciones: data.observaciones || undefined,
      };

      await chequeApi.endosar(cheque.id, endosoData);

      onSuccess();
    } catch (err: any) {
      console.error('Error endorsing cheque:', err);
      const errorMessage = err.response?.data?.message || err.response?.data || 'Error al endosar el cheque';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!cheque) return null;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Endosar Cheque</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Check Information Card */}
          <Card variant="outlined" sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Información del Cheque
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Número:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {cheque.numeroCheque}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Banco:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {cheque.bancoNombre}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Monto:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    ${cheque.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha Cobro:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {dayjs(cheque.fechaCobro).format('DD/MM/YYYY')}
                  </Typography>
                </Grid>
                {cheque.clienteNombre && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Cliente:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {cheque.clienteNombre}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Form Fields */}
          <Grid container spacing={2}>
            {/* Proveedor Destino */}
            <Grid item xs={12}>
              <Controller
                name="proveedorDestinoId"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    options={proveedores}
                    getOptionLabel={(option) => option.razonSocial || option.nombre || `Proveedor #${option.id}`}
                    loading={loadingProveedores}
                    value={proveedores.find(p => p.id === value) || null}
                    onChange={(_, newValue) => {
                      onChange(newValue?.id || null);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Proveedor Destino *"
                        error={!!errors.proveedorDestinoId}
                        helperText={errors.proveedorDestinoId?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingProveedores ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    disabled={loading}
                    noOptionsText="No hay proveedores disponibles"
                  />
                )}
              />
            </Grid>

            {/* Observaciones */}
            <Grid item xs={12}>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Observaciones"
                    multiline
                    rows={3}
                    fullWidth
                    error={!!errors.observaciones}
                    helperText={errors.observaciones?.message || `${field.value.length}/1000 caracteres`}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Warning Message */}
          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Atención:</strong> El endoso registrará automáticamente un movimiento de CRÉDITO en la cuenta corriente del proveedor seleccionado por el monto del cheque.
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !selectedProveedorId}
          >
            {loading ? 'Endosando...' : 'Endosar Cheque'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EndosarChequeDialog;
