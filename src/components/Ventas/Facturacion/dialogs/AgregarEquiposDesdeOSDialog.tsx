/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  TextField,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Stack,
  Typography,
  Paper,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import type { OrdenServicio, EquipoEnOrdenDTO } from '../../../types';
import type { CartItem } from '../types';

// @ts-ignore - ordenServicioApi will be loaded dynamically
let ordenServicioApi: any = null;

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: CartItem[]) => void;
  clienteId?: number;
}

const AgregarEquiposDesdeOSDialog: React.FC<Props> = ({ open, onClose, onConfirm, clienteId }) => {
  const [step, setStep] = useState(0);
  const [loadingOS, setLoadingOS] = useState(false);
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<OrdenServicio | null>(null);
  const [selectedEquipos, setSelectedEquipos] = useState<number[]>([]);
  const [preciosPorEquipo, setPreciosPorEquipo] = useState<{ [key: number]: number }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadOrdenes();
    }
  }, [open, clienteId]);

  const loadOrdenes = async () => {
    try {
      setLoadingOS(true);
      setError(null);

      // Load ordenServicioApi via new Function to avoid build-time resolution
      if (!ordenServicioApi) {
        try {
          const importFn = new Function('return import("../../../api/services/ordenServicioApi")');
          const module = await importFn();
          ordenServicioApi = module.ordenServicioApi;
        } catch (importErr) {
          console.warn('ordenServicioApi not available', importErr);
          setError('El servicio de órdenes no está disponible en esta configuración');
          setLoadingOS(false);
          return;
        }
      }

      let datos: OrdenServicio[];
      if (clienteId) {
        datos = await ordenServicioApi.getByClienteYEstado(clienteId, 'FINALIZADA');
      } else {
        datos = await ordenServicioApi.getByEstado('FINALIZADA');
      }

      setOrdenes(datos.filter(o => o.equipos && o.equipos.length > 0));
    } catch (err: any) {
      setError(err.message || 'Error al cargar órdenes de servicio');
    } finally {
      setLoadingOS(false);
    }
  };

  const handleSelectOrden = (orden: OrdenServicio | null) => {
    setSelectedOrden(orden);
    setSelectedEquipos([]);
    setPreciosPorEquipo({});
  };

  const handleToggleEquipo = (equipoId: number) => {
    setSelectedEquipos(prev =>
      prev.includes(equipoId) ? prev.filter(id => id !== equipoId) : [...prev, equipoId]
    );
  };

  const handlePrecioChange = (equipoId: number, precio: number) => {
    setPreciosPorEquipo(prev => ({
      ...prev,
      [equipoId]: precio,
    }));
  };

  const handleConfirm = () => {
    if (!selectedOrden || selectedEquipos.length === 0) {
      setError('Selecciona al menos un equipo');
      return;
    }

    const items: CartItem[] = selectedEquipos
      .map(equipoId => {
        const equipo = selectedOrden.equipos?.find(e => e.equipoFabricadoId === equipoId);
        if (!equipo) return null;

        return {
          tipoItem: 'EQUIPO' as const,
          recetaId: equipo.recetaId,
          recetaNombre: equipo.recetaNombre || `${equipo.modelo || 'Equipo'}`,
          recetaModelo: equipo.modelo,
          recetaTipo: equipo.tipo,
          cantidad: 1,
          precioUnitario: preciosPorEquipo[equipoId] || 0,
          descuento: 0,
          preAsignadoEquipoId: equipoId,
          ordenServicioNumero: selectedOrden.numeroOrden,
        };
      })
      .filter((item): item is CartItem => item !== null);

    onConfirm(items);
    handleClose();
  };

  const handleClose = () => {
    setStep(0);
    setSelectedOrden(null);
    setSelectedEquipos([]);
    setPreciosPorEquipo({});
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agregar Equipos desde Orden de Servicio</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={step} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Seleccionar OS</StepLabel>
          </Step>
          <Step>
            <StepLabel>Equipos</StepLabel>
          </Step>
        </Stepper>

        {/* Step 1: Seleccionar OS */}
        {step === 0 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="textSecondary">
              {clienteId ? 'Órdenes finalizadas del cliente' : 'Órdenes finalizadas'}
            </Typography>
            {loadingOS ? (
              <Stack alignItems="center" py={3}>
                <CircularProgress />
              </Stack>
            ) : (
              <Autocomplete
                options={ordenes}
                getOptionLabel={o =>
                  `${o.numeroOrden} - ${o.clienteNombre} (${dayjs(o.fechaFinalizacion).format('DD/MM/YYYY')})`
                }
                value={selectedOrden}
                onChange={(_, valor) => handleSelectOrden(valor)}
                loading={loadingOS}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Orden de Servicio"
                    placeholder="Buscar OS..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {loadingOS ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                noOptionsText={ordenes.length === 0 ? 'No hay órdenes finalizadas' : 'No encontrado'}
              />
            )}

            {selectedOrden && (
              <Card>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Orden:</strong> {selectedOrden.numeroOrden}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Cliente:</strong> {selectedOrden.clienteNombre}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total:</strong> ${selectedOrden.total.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Equipos disponibles:</strong> {selectedOrden.equipos?.length || 0}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        )}

        {/* Step 2: Seleccionar Equipos */}
        {step === 1 && selectedOrden && (
          <Stack spacing={2}>
            <Typography variant="body2" color="textSecondary">
              Selecciona los equipos a incluir en la factura
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell width={50} align="center">
                      {' '}
                    </TableCell>
                    <TableCell>Equipo</TableCell>
                    <TableCell>Modelo</TableCell>
                    <TableCell align="right">Precio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedOrden.equipos?.map(equipo => (
                    <TableRow key={equipo.equipoFabricadoId} hover>
                      <TableCell align="center">
                        <Checkbox
                          checked={selectedEquipos.includes(equipo.equipoFabricadoId)}
                          onChange={() => handleToggleEquipo(equipo.equipoFabricadoId)}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight="600">
                            {equipo.numeroHeladera}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {equipo.tipo}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{equipo.modelo}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={preciosPorEquipo[equipo.equipoFabricadoId] || ''}
                          onChange={e =>
                            handlePrecioChange(equipo.equipoFabricadoId, parseFloat(e.target.value) || 0)
                          }
                          size="small"
                          disabled={!selectedEquipos.includes(equipo.equipoFabricadoId)}
                          inputProps={{ step: 0.01, min: 0 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {selectedEquipos.length === 0 && (
              <Alert severity="info">Selecciona al menos un equipo para continuar</Alert>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancelar</Button>
        {step === 0 && (
          <Button
            variant="contained"
            onClick={() => {
              if (!selectedOrden) {
                setError('Selecciona una orden de servicio');
                return;
              }
              setStep(1);
            }}
            disabled={!selectedOrden}
          >
            Siguiente
          </Button>
        )}
        {step === 1 && (
          <>
            <Button onClick={() => setStep(0)}>Atrás</Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={selectedEquipos.length === 0}
            >
              Agregar ({selectedEquipos.length})
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AgregarEquiposDesdeOSDialog;
