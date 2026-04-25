 
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
/* eslint-disable @typescript-eslint/no-explicit-any */
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
/* eslint-disable react-hooks/exhaustive-deps */
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
/* eslint-disable @typescript-eslint/no-explicit-any */
      const lista = Array.isArray(data) ? data : (data as any).content ?? [];
 

 
      // Filter only active proveedores and filter out current provider if check is already endorsed
/* eslint-disable @typescript-eslint/no-explicit-any */
      let filteredProveedores = lista.filter((p: any) => p.estado === 'ACTIVO' || !p.estado);
 
      if (cheque?.proveedorId) {
/* eslint-disable @typescript-eslint/no-explicit-any */
        filteredProveedores = filteredProveedores.filter((p: any) => p.id !== cheque.proveedorId);
 
      }
 

 
      setProveedores(filteredProveedores);
/* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
 
      console.error('Error loading proveedores:', err);
 
      setError('Error al cargar proveedores');
 
    } finally {
 
      setLoadingProveedores(false);
 
    }
 
  };
 

/* eslint-disable @typescript-eslint/no-explicit-any */
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
/* eslint-disable @typescript-eslint/no-explicit-any */
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
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <DialogTitle>Endosar Cheque</DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <form onSubmit={handleSubmit(onSubmit)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {error && (
 
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {error}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Alert>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {/* Check Information Card */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Card variant="outlined" sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Información del Cheque
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Divider sx={{ my: 1 }} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Grid container spacing={1}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    Número:
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body1" fontWeight="bold">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {cheque.numeroCheque}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    Banco:
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body1" fontWeight="bold">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {cheque.bancoNombre}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    Monto:
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body1" fontWeight="bold" color="primary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    ${cheque.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    Fecha Cobro:
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body1" fontWeight="bold">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {dayjs(cheque.fechaCobro).format('DD/MM/YYYY')}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {cheque.clienteNombre && (
 
                  <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Cliente:
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Typography variant="body1" fontWeight="bold">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {cheque.clienteNombre}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Grid>
 
                )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {/* Form Fields */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Grid container spacing={2}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {/* Proveedor Destino */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              {loadingProveedores ? <CircularProgress size={20} /> : null}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              {params.InputProps.endAdornment}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {/* Observaciones */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {/* Warning Message */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Alert severity="warning" sx={{ mt: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body2">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <strong>Atención:</strong> El endoso registrará automáticamente un movimiento de CRÉDITO en la cuenta corriente del proveedor seleccionado por el monto del cheque.
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Alert>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <DialogActions sx={{ px: 3, pb: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button onClick={onClose} disabled={loading}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Cancelar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button
 
            type="submit"
 
            variant="contained"
 
            color="primary"
 
            disabled={loading || !selectedProveedorId}
 
          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {loading ? 'Endosando...' : 'Endosar Cheque'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </form>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
    </Dialog>
 
  );
 
};
 

 
export default EndosarChequeDialog;
