import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  Grid,
  Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import type {
  FlujoCajaMovimientoEnhanced,
  CreateMovimientoExtraDTO,
  CategoriaGastoExtra,
  CategoriaCobroExtra,
  MetodoPago,
} from '../../../../types';
import { movimientoExtraApi } from '../../../../api/services/movimientoExtraApi';
import {
  getCategoriaGastoLabel,
  getCategoriaCobroLabel,
  getPaymentMethodLabel,
} from '../../../../utils/flujoCajaUtils';

interface MovimientoExtraDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMovimiento?: FlujoCajaMovimientoEnhanced | null;
  tipoInicial?: 'INGRESO' | 'EGRESO';
}

const CATEGORIAS_GASTO: CategoriaGastoExtra[] = [
  'VIATICOS',
  'REPARACION_VEHICULO',
  'SERVICE_MANTENIMIENTO',
  'GASTOS_OPERATIVOS',
  'SUELDOS_SALARIOS',
  'SERVICIOS_PUBLICOS',
  'ALQUILER',
  'IMPUESTOS',
  'HONORARIOS_PROFESIONALES',
  'SEGUROS',
  'PUBLICIDAD_MARKETING',
  'GASTOS_BANCARIOS',
  'OTROS',
];

const CATEGORIAS_COBRO: CategoriaCobroExtra[] = [
  'COBRO_MANUAL',
  'AJUSTE_POSITIVO',
  'INGRESO_EXTRAORDINARIO',
  'VENTA_ACTIVO',
  'REEMBOLSO',
  'INTERESES_GANADOS',
  'SUBSIDIO',
  'DONACION',
  'OTROS',
];

const METODOS_PAGO: MetodoPago[] = [
  'EFECTIVO',
  'TRANSFERENCIA',
  'CHEQUE',
  'TARJETA_CREDITO',
  'TARJETA_DEBITO',
  'FINANCIACION_PROPIA',
  'FINANCIAMIENTO',
  'CUENTA_CORRIENTE',
];

const MovimientoExtraDialog: React.FC<MovimientoExtraDialogProps> = ({
  open,
  onClose,
  onSuccess,
  editingMovimiento,
  tipoInicial = 'EGRESO',
}) => {
  // State
  const [tipo, setTipo] = useState<'INGRESO' | 'EGRESO'>(tipoInicial);
  const [categoria, setCategoria] = useState('');
  const [fecha, setFecha] = useState<Dayjs>(dayjs());
  const [concepto, setConcepto] = useState('');
  const [importe, setImporte] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [responsableNombre, setResponsableNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Categorías dinámicas según tipo
  const categoriasDisponibles = useMemo(() => {
    return tipo === 'EGRESO' ? CATEGORIAS_GASTO : CATEGORIAS_COBRO;
  }, [tipo]);

  // Reset categoría cuando cambia tipo (solo si no estamos editando)
  useEffect(() => {
    if (!editingMovimiento) {
      setCategoria('');
    }
  }, [tipo, editingMovimiento]);

  // Cargar datos si es edición
  useEffect(() => {
    if (editingMovimiento && open) {
      setTipo(editingMovimiento.tipo);
      setCategoria(editingMovimiento.categoriaGasto || editingMovimiento.categoriaCobro || '');
      setFecha(dayjs(editingMovimiento.fecha));
      setConcepto(editingMovimiento.concepto);
      setImporte(editingMovimiento.importe.toString());
      setMetodoPago(editingMovimiento.metodoPago || 'EFECTIVO');
      setNumeroComprobante(editingMovimiento.numeroComprobante || '');
      setObservaciones(editingMovimiento.observaciones || '');
      setResponsableNombre(editingMovimiento.responsableNombre || '');
    } else if (open && !editingMovimiento) {
      // Reset form for new movement
      setTipo(tipoInicial);
      setCategoria('');
      setFecha(dayjs());
      setConcepto('');
      setImporte('');
      setMetodoPago('EFECTIVO');
      setNumeroComprobante('');
      setObservaciones('');
      setResponsableNombre('');
      setError('');
    }
  }, [editingMovimiento, open, tipoInicial]);

  const handleSubmit = async () => {
    // Validaciones
    if (!categoria) {
      setError('Por favor seleccioná una categoría');
      return;
    }
    if (!concepto.trim()) {
      setError('Por favor ingresá un concepto');
      return;
    }
    if (!importe || parseFloat(importe) <= 0) {
      setError('Por favor ingresá un importe válido mayor a 0');
      return;
    }
    if (!fecha.isValid()) {
      setError('Por favor ingresá una fecha válida');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convertir tipo de frontend (INGRESO/EGRESO) a backend (CREDITO/DEBITO)
      // CREDITO = Ingreso/Cobro Extra, DEBITO = Egreso/Gasto Extra
      const tipoBackend: 'CREDITO' | 'DEBITO' = tipo === 'INGRESO' ? 'CREDITO' : 'DEBITO';

      const dto: CreateMovimientoExtraDTO = {
        fecha: fecha.format('YYYY-MM-DD'),
        tipo: tipoBackend,
        ...(tipo === 'EGRESO'
          ? { categoriaGasto: categoria as CategoriaGastoExtra }
          : { categoriaCobro: categoria as CategoriaCobroExtra }),
        descripcion: concepto.trim(),
        monto: parseFloat(importe), // Backend espera 'monto', no 'importe'
        metodoPago,
        numeroComprobante: numeroComprobante.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      };

      if (editingMovimiento?.movimientoExtraId) {
        await movimientoExtraApi.actualizar(editingMovimiento.movimientoExtraId, {
          ...dto,
          id: editingMovimiento.movimientoExtraId,
        });
      } else {
        await movimientoExtraApi.crear(dto);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error al guardar movimiento extra:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Error al guardar el movimiento. Por favor intentá de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleTipoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoTipo = event.target.value as 'INGRESO' | 'EGRESO';
    setTipo(nuevoTipo);
    // Resetear categoría cuando cambia el tipo
    setCategoria('');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingMovimiento ? 'Editar Movimiento Extra' : 'Nuevo Movimiento Extra'}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {/* Tipo de movimiento */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel>Tipo de Movimiento</FormLabel>
                <RadioGroup
                  row
                  value={tipo}
                  onChange={handleTipoChange}
                >
                  <FormControlLabel value="EGRESO" control={<Radio />} label="Gasto Extra" disabled={loading} />
                  <FormControlLabel value="INGRESO" control={<Radio />} label="Cobro Extra" disabled={loading} />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Categoría */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={categoriasDisponibles.includes(categoria as any) ? categoria : ''}
                  onChange={(e) => setCategoria(e.target.value)}
                  label="Categoría"
                  disabled={loading}
                >
                  {categoriasDisponibles.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {tipo === 'EGRESO'
                        ? getCategoriaGastoLabel(cat as CategoriaGastoExtra)
                        : getCategoriaCobroLabel(cat as CategoriaCobroExtra)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Fecha */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha *"
                value={fecha}
                onChange={(newValue) => newValue && setFecha(newValue as Dayjs)}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>

            {/* Concepto */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Concepto"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                multiline
                rows={2}
                disabled={loading}
                placeholder="Describí brevemente el movimiento"
              />
            </Grid>

            {/* Importe */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Importe"
                type="number"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                disabled={loading}
                inputProps={{ min: 0, step: 0.01 }}
                placeholder="0.00"
              />
            </Grid>

            {/* Método de pago */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                  label="Método de Pago"
                  disabled={loading}
                >
                  {METODOS_PAGO.map((metodo) => (
                    <MenuItem key={metodo} value={metodo}>
                      {getPaymentMethodLabel(metodo)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Número de comprobante */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Comprobante"
                value={numeroComprobante}
                onChange={(e) => setNumeroComprobante(e.target.value)}
                disabled={loading}
                placeholder="Opcional"
              />
            </Grid>

            {/* Responsable */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Responsable"
                value={responsableNombre}
                onChange={(e) => setResponsableNombre(e.target.value)}
                disabled={loading}
                placeholder="Nombre del responsable (opcional)"
              />
            </Grid>

            {/* Observaciones */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                multiline
                rows={3}
                disabled={loading}
                placeholder="Información adicional (opcional)"
              />
            </Grid>

            {/* Error message */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MovimientoExtraDialog;
