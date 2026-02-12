import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert,
  InputAdornment,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { chequeApi } from '../../api/services/chequeApi';
import { clienteApi } from '../../api/services/clienteApi';
import { proveedorApi } from '../../api/services/proveedorApi';
import { bancoApi } from '../../api/services/bancoApi';
import type { Cheque, Cliente, Proveedor, Banco, ChequeCreateDTO, ChequeUpdateDTO, TipoChequeType, EstadoChequeType } from '../../types';

interface Props {
  open: boolean;
  cheque: Cheque | null;
  onClose: () => void;
  onSave: () => void;
}

// Form data interface
interface ChequeFormData {
  numeroCheque: string;
  tipo: TipoChequeType;
  bancoId: number | null;
  titular: string;
  cuitTitular?: string;
  monto: number;
  fechaEmision: string;
  fechaCobro: string;
  estado: EstadoChequeType;
  clienteId?: number;
  proveedorId?: number;
  observaciones?: string;
  numeroCuenta?: string;
  cbu?: string;
  endosado?: boolean;
  endosadoA?: string;
  esEcheq?: boolean;
}

// Schema de validación Yup
const validationSchema = yup.object({
  numeroCheque: yup.string().required('El número del cheque es requerido').max(50),
  tipo: yup.string().oneOf(['PROPIO', 'TERCEROS']).required('El tipo es requerido'),
  bancoId: yup.number().required('El banco es requerido').min(1, 'Debe seleccionar un banco'),
  titular: yup.string().required('El titular es requerido').max(200),
  cuitTitular: yup.string().matches(/^(\d{11}|\d{2}-\d{8}-\d{1})?$/, 'CUIT inválido').nullable(),
  monto: yup
    .number()
    .typeError('El monto debe ser un número válido')
    .min(0.01, 'El monto debe ser mayor a 0')
    .required('El monto es requerido'),
  fechaEmision: yup.string().required('La fecha de emisión es requerida'),
  fechaCobro: yup.string().required('La fecha de cobro es requerida'),
  estado: yup.string().oneOf(['EN_CARTERA', 'DEPOSITADO', 'COBRADO', 'RECHAZADO', 'ANULADO']).required('El estado es requerido'),
  clienteId: yup.number().when('tipo', {
    is: 'TERCEROS',
    then: (schema) => schema.required('El cliente es requerido para cheques de terceros').min(1),
    otherwise: (schema) => schema.nullable(),
  }),
  proveedorId: yup.number().when('tipo', {
    is: 'PROPIO',
    then: (schema) => schema.required('El proveedor es requerido para cheques propios').min(1),
    otherwise: (schema) => schema.nullable(),
  }),
  observaciones: yup.string().max(5000).nullable(),
  numeroCuenta: yup.string().max(50).nullable(),
  cbu: yup.string().matches(/^(\d{22})?$/, 'El CBU debe tener 22 dígitos').nullable(),
  endosado: yup.boolean().nullable(),
  endosadoA: yup.string().max(200).nullable(),
  esEcheq: yup.boolean().nullable(),
});

const ChequeFormDialog: React.FC<Props> = ({ open, cheque, onClose, onSave }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ChequeFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      numeroCheque: '',
      tipo: 'TERCEROS',
      bancoId: null,
      titular: '',
      cuitTitular: '',
      monto: 0,
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaCobro: new Date().toISOString().split('T')[0],
      estado: 'EN_CARTERA',
      clienteId: undefined,
      proveedorId: undefined,
      observaciones: '',
      numeroCuenta: '',
      cbu: '',
      endosado: false,
      endosadoA: '',
      esEcheq: false,
    },
  });

  const tipo = watch('tipo');
  const endosado = watch('endosado');

  // Cargar clientes y proveedores al abrir el dialog
  useEffect(() => {
    if (open) {
      loadOptions();
    }
  }, [open]);

  // Reset form cuando cambia el cheque
  useEffect(() => {
    if (cheque) {
      reset({
        numeroCheque: cheque.numeroCheque,
        tipo: cheque.tipo,
        bancoId: cheque.bancoId,
        titular: cheque.titular,
        cuitTitular: cheque.cuitTitular || '',
        monto: cheque.monto,
        fechaEmision: cheque.fechaEmision,
        fechaCobro: cheque.fechaCobro,
        estado: cheque.estado,
        clienteId: cheque.clienteId,
        proveedorId: cheque.proveedorId,
        observaciones: cheque.observaciones || '',
        numeroCuenta: cheque.numeroCuenta || '',
        cbu: cheque.cbu || '',
        endosado: cheque.endosado || false,
        endosadoA: cheque.endosadoA || '',
        esEcheq: cheque.esEcheq || false,
      });
    } else {
      reset({
        numeroCheque: '',
        tipo: 'TERCEROS',
        bancoId: null,
        titular: '',
        cuitTitular: '',
        monto: 0,
        fechaEmision: new Date().toISOString().split('T')[0],
        fechaCobro: new Date().toISOString().split('T')[0],
        estado: 'EN_CARTERA',
        clienteId: undefined,
        proveedorId: undefined,
        observaciones: '',
        numeroCuenta: '',
        cbu: '',
        endosado: false,
        endosadoA: '',
        esEcheq: false,
      });
    }
  }, [cheque, reset]);

  const loadOptions = async () => {
    try {
      const [clientesData, proveedoresData, bancosData] = await Promise.all([
        clienteApi.getAll(),
        proveedorApi.getAll(),
        bancoApi.getActivos(),  // Solo cargar bancos activos
      ]);
      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setProveedores(Array.isArray(proveedoresData) ? proveedoresData : []);
      setBancos(Array.isArray(bancosData) ? bancosData : []);
    } catch (err) {
      console.error('Error loading options:', err);
    }
  };

  const onSubmit = async (data: ChequeFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (cheque) {
        // Actualizar cheque existente
        const updateData: ChequeUpdateDTO = {
          numeroCheque: data.numeroCheque,
          bancoId: data.bancoId!,
          titular: data.titular,
          cuitTitular: data.cuitTitular || undefined,
          monto: data.monto,
          fechaEmision: data.fechaEmision,
          fechaCobro: data.fechaCobro,
          clienteId: data.clienteId,
          proveedorId: data.proveedorId,
          observaciones: data.observaciones || undefined,
          numeroCuenta: data.numeroCuenta || undefined,
          cbu: data.cbu || undefined,
          endosado: data.endosado,
          endosadoA: data.endosadoA || undefined,
          esEcheq: data.esEcheq,
        };
        await chequeApi.update(cheque.id, updateData);
      } else {
        // Crear nuevo cheque
        const createData: ChequeCreateDTO = {
          numeroCheque: data.numeroCheque,
          tipo: data.tipo,
          bancoId: data.bancoId!,
          titular: data.titular,
          cuitTitular: data.cuitTitular || undefined,
          monto: data.monto,
          fechaEmision: data.fechaEmision,
          fechaCobro: data.fechaCobro,
          estado: data.estado,
          clienteId: data.clienteId,
          proveedorId: data.proveedorId,
          observaciones: data.observaciones || undefined,
          numeroCuenta: data.numeroCuenta || undefined,
          cbu: data.cbu || undefined,
          endosado: data.endosado,
          endosadoA: data.endosadoA || undefined,
          esEcheq: data.esEcheq,
        };
        await chequeApi.create(createData);
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving cheque:', err);
      setError(err.response?.data?.message || 'Error al guardar el cheque');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{cheque ? 'Editar Cheque' : 'Nuevo Cheque'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Tipo */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.tipo} disabled={!!cheque}>
                <InputLabel>Tipo de Cheque</InputLabel>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Tipo de Cheque">
                      <MenuItem value="TERCEROS">Terceros (de cliente)</MenuItem>
                      <MenuItem value="PROPIO">Propio (a proveedor)</MenuItem>
                    </Select>
                  )}
                />
                {errors.tipo && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {errors.tipo.message}
                  </Alert>
                )}
              </FormControl>
            </Grid>

            {/* Estado (solo para creación) */}
            {!cheque && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!errors.estado}>
                  <InputLabel>Estado</InputLabel>
                  <Controller
                    name="estado"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Estado">
                        <MenuItem value="EN_CARTERA">En Cartera</MenuItem>
                        <MenuItem value="DEPOSITADO">Depositado</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            )}

            {/* Número de Cheque */}
            <Grid item xs={12} sm={cheque ? 6 : 12}>
              <Controller
                name="numeroCheque"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Número de Cheque"
                    error={!!errors.numeroCheque}
                    helperText={errors.numeroCheque?.message}
                    required
                  />
                )}
              />
            </Grid>

            {/* Banco */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="bancoId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={bancos}
                    getOptionLabel={(option) => typeof option === 'object' ? `${option.nombre} ${option.nombreCorto ? `(${option.nombreCorto})` : ''}` : ''}
                    value={bancos.find((b) => b.id === field.value) || null}
                    onChange={(_, newValue) => field.onChange(newValue?.id || null)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Banco"
                        error={!!errors.bancoId}
                        helperText={errors.bancoId?.message}
                        required
                      />
                    )}
                    noOptionsText="No hay bancos disponibles"
                  />
                )}
              />
            </Grid>

            {/* Monto */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="monto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Monto"
                    type="number"
                    error={!!errors.monto}
                    helperText={errors.monto?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                    required
                  />
                )}
              />
            </Grid>

            {/* Titular */}
            <Grid item xs={12} sm={8}>
              <Controller
                name="titular"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Titular del Cheque"
                    error={!!errors.titular}
                    helperText={errors.titular?.message}
                    required
                  />
                )}
              />
            </Grid>

            {/* CUIT Titular */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="cuitTitular"
                control={control}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    fullWidth 
                    label="CUIT Titular"
                    error={!!errors.cuitTitular}
                    helperText={errors.cuitTitular?.message || "Formato: XX-XXXXXXXX-X"}
                  />
                )}
              />
            </Grid>

            {/* Fecha Emisión */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="fechaEmision"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Fecha de Emisión"
                    type="date"
                    error={!!errors.fechaEmision}
                    helperText={errors.fechaEmision?.message}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                )}
              />
            </Grid>

            {/* Fecha Cobro */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="fechaCobro"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Fecha de Cobro"
                    type="date"
                    error={!!errors.fechaCobro}
                    helperText={errors.fechaCobro?.message}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                )}
              />
            </Grid>

            {/* Cliente (solo si tipo = TERCEROS) */}
            {tipo === 'TERCEROS' && (
              <Grid item xs={12}>
                <Controller
                  name="clienteId"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      options={clientes}
                      getOptionLabel={(option) =>
                        `${option.nombre} ${option.apellido || ''} ${
                          option.razonSocial ? `- ${option.razonSocial}` : ''
                        }`
                      }
                      value={clientes.find((c) => c.id === value) || null}
                      onChange={(_, newValue) => onChange(newValue?.id || undefined)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Cliente"
                          required
                          error={!!errors.clienteId}
                          helperText={errors.clienteId?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Proveedor (solo si tipo = PROPIO) */}
            {tipo === 'PROPIO' && (
              <Grid item xs={12}>
                <Controller
                  name="proveedorId"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      options={proveedores}
                      getOptionLabel={(option) =>
                        `${option.nombre || option.razonSocial || ''} ${
                          option.cuit ? `- CUIT: ${option.cuit}` : ''
                        }`
                      }
                      value={proveedores.find((p) => p.id === value) || null}
                      onChange={(_, newValue) => onChange(newValue?.id || undefined)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Proveedor"
                          required
                          error={!!errors.proveedorId}
                          helperText={errors.proveedorId?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Número de Cuenta */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="numeroCuenta"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Número de Cuenta"
                    error={!!errors.numeroCuenta}
                    helperText={errors.numeroCuenta?.message}
                  />
                )}
              />
            </Grid>

            {/* CBU */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="cbu"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CBU"
                    error={!!errors.cbu}
                    helperText={errors.cbu?.message || "22 dígitos"}
                  />
                )}
              />
            </Grid>

            {/* E-Cheq */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="esEcheq"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="E-Cheq"
                  />
                )}
              />
            </Grid>

            {/* Endosado */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="endosado"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Cheque Endosado"
                  />
                )}
              />
            </Grid>

            {/* Endosado A */}
            {endosado && (
              <Grid item xs={12} sm={8}>
                <Controller
                  name="endosadoA"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Endosado a"
                      error={!!errors.endosadoA}
                      helperText={errors.endosadoA?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Observaciones */}
            <Grid item xs={12}>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Observaciones" multiline rows={3} />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {cheque ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChequeFormDialog;
