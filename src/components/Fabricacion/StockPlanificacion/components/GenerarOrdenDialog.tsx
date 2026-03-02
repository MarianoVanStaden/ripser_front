import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Typography,
  Box,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { recetaFabricacionApi } from '../../../../api/services/recetaFabricacionApi';
import { depositoApi } from '../../../../api/services/depositoApi';
import type {
  EvaluacionStockDTO,
  GenerarOrdenDTO,
  RecetaFabricacionListDTO,
  Deposito,
} from '../../../../types';

const schema = yup.object({
  recetaId: yup.number().required('La receta es obligatoria').min(1, 'Seleccioná una receta'),
  depositoOrigenId: yup
    .number()
    .required('El depósito origen es obligatorio')
    .min(1, 'Seleccioná un depósito'),
  cantidadSolicitada: yup
    .number()
    .nullable()
    .optional()
    .transform((value, original) => (original === '' ? null : value))
    .min(1, 'Debe ser mayor a 0'),
  observaciones: yup.string().optional(),
});

type FormData = {
  recetaId: number;
  depositoOrigenId: number;
  cantidadSolicitada?: number | null;
  observaciones?: string;
};

interface GenerarOrdenDialogProps {
  open: boolean;
  target: EvaluacionStockDTO | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: (dto: GenerarOrdenDTO) => Promise<void>;
}

export const GenerarOrdenDialog: React.FC<GenerarOrdenDialogProps> = ({
  open,
  target,
  saving,
  onClose,
  onConfirm,
}) => {
  const [recetas, setRecetas] = useState<RecetaFabricacionListDTO[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      recetaId: 0,
      depositoOrigenId: 0,
      cantidadSolicitada: undefined,
      observaciones: '',
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      recetaId: 0,
      depositoOrigenId: 0,
      cantidadSolicitada: undefined,
      observaciones: '',
    });
    setApiError(null);

    const loadDeps = async () => {
      setLoadingDeps(true);
      try {
        const [recetasPage, depositosPage] = await Promise.all([
          recetaFabricacionApi.findAll({ page: 0, size: 200 }),
          depositoApi.getAll({ page: 0, size: 100 }),
        ]);
        setRecetas(recetasPage.content.filter((r) => r.activo));
        setDepositos(depositosPage.content.filter((d) => d.activo));
      } catch {
        setApiError('Error al cargar recetas y depósitos');
      } finally {
        setLoadingDeps(false);
      }
    };

    loadDeps();
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await onConfirm({
        recetaId: data.recetaId,
        depositoOrigenId: data.depositoOrigenId,
        cantidadSolicitada: data.cantidadSolicitada ?? null,
        observaciones: data.observaciones || undefined,
      });
    } catch (err) {
      // Extraer el mensaje del backend (Spring devuelve { error, message } en el body)
      const axiosLike = err as { response?: { data?: { message?: string } } };
      const backendMsg = axiosLike?.response?.data?.message;
      setApiError(backendMsg ?? (err instanceof Error ? err.message : 'Error al generar la orden'));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generar orden de fabricación preventiva</DialogTitle>

      {target && (
        <Box sx={{ px: 3, pb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Objetivo:{' '}
            <strong>
              {target.tipo} · {target.modelo} · {target.medida}
              {target.color ? ` · ${target.color.replace(/_/g, ' ')}` : ''}
            </strong>
          </Typography>
          <Typography variant="body2" color="error.main" fontWeight={500}>
            A fabricar: {target.cantidadAFabricar} unidades (neto, descontando producción en curso)
          </Typography>
        </Box>
      )}

      <Divider />

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {loadingDeps ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <Controller
                  name="recetaId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Receta de fabricación *"
                      fullWidth
                      error={!!errors.recetaId}
                      helperText={errors.recetaId?.message}
                    >
                      <MenuItem value={0} disabled>
                        <em>Seleccioná una receta</em>
                      </MenuItem>
                      {recetas.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.codigo} — {r.nombre}
                          {r.modelo ? ` (${r.modelo})` : ''}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="depositoOrigenId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Depósito origen de materiales *"
                      fullWidth
                      error={!!errors.depositoOrigenId}
                      helperText={errors.depositoOrigenId?.message}
                    >
                      <MenuItem value={0} disabled>
                        <em>Seleccioná un depósito</em>
                      </MenuItem>
                      {depositos.map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.nombre}
                          {d.esPrincipal ? ' (principal)' : ''}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="cantidadSolicitada"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Cantidad a fabricar"
                      type="number"
                      fullWidth
                      inputProps={{ min: 1 }}
                      error={!!errors.cantidadSolicitada}
                      helperText={
                        errors.cantidadSolicitada?.message ||
                        `Vacío = calcular automáticamente (${target?.cantidadAFabricar ?? '?'} sugeridas)`
                      }
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="observaciones"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Observaciones"
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Ej: Reposición preventiva semana 9"
                      error={!!errors.observaciones}
                      helperText={errors.observaciones?.message}
                    />
                  )}
                />
              </Grid>

              {apiError && (
                <Grid item xs={12}>
                  <Alert severity="error">{apiError}</Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="error"
            disabled={saving || loadingDeps}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving ? 'Generando…' : 'Generar orden'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
