import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import { CheckCircle, Warning } from '@mui/icons-material';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import type { DetalleDocumento, EquipoFabricadoDTO } from '../../types';

interface AsignarEquiposDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (asignaciones: { [detalleId: number]: number[] }) => void;
  detallesEquipo: DetalleDocumento[];
}

interface DetalleAsignacion {
  detalleId: number;
  recetaId: number;
  recetaNombre: string;
  recetaModelo?: string;
  recetaTipo?: string;
  cantidadRequerida: number;
  equiposSeleccionados: number[];
  equiposDisponibles: EquipoFabricadoDTO[];
  loading: boolean;
}

const AsignarEquiposDialog: React.FC<AsignarEquiposDialogProps> = ({
  open,
  onClose,
  onConfirm,
  detallesEquipo,
}) => {
  const [asignaciones, setAsignaciones] = useState<DetalleAsignacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && detallesEquipo.length > 0) {
      initializeAsignaciones();
    }
  }, [open, detallesEquipo]);

  const initializeAsignaciones = async () => {
    setLoading(true);
    setError(null);

    const newAsignaciones: DetalleAsignacion[] = [];

    for (const detalle of detallesEquipo) {
      if (detalle.tipoItem === 'EQUIPO' && detalle.recetaId) {
        const asignacion: DetalleAsignacion = {
          detalleId: detalle.id,
          recetaId: detalle.recetaId,
          recetaNombre: detalle.recetaNombre || '',
          recetaModelo: detalle.recetaModelo,
          recetaTipo: detalle.recetaTipo,
          cantidadRequerida: detalle.cantidad,
          equiposSeleccionados: [],
          equiposDisponibles: [],
          loading: true,
        };

        newAsignaciones.push(asignacion);
      }
    }

    setAsignaciones(newAsignaciones);

    // Fetch available equipos for each receta
    for (let i = 0; i < newAsignaciones.length; i++) {
      const asignacion = newAsignaciones[i];
      try {
        const equipos = await equipoFabricadoApi.findDisponiblesParaVentaByReceta(asignacion.recetaId);
        setAsignaciones((prev) =>
          prev.map((a, index) =>
            index === i
              ? { ...a, equiposDisponibles: equipos, loading: false }
              : a
          )
        );
      } catch (err) {
        console.error(`Error fetching equipos for receta ${asignacion.recetaId}:`, err);
        setAsignaciones((prev) =>
          prev.map((a, index) =>
            index === i ? { ...a, loading: false } : a
          )
        );
        setError(`Error al cargar equipos disponibles para ${asignacion.recetaNombre}`);
      }
    }

    setLoading(false);
  };

  const handleEquipoToggle = (asignacionIndex: number, equipoId: number) => {
    setAsignaciones((prev) =>
      prev.map((asignacion, index) => {
        if (index !== asignacionIndex) return asignacion;

        const isSelected = asignacion.equiposSeleccionados.includes(equipoId);
        const newSeleccionados = isSelected
          ? asignacion.equiposSeleccionados.filter((id) => id !== equipoId)
          : [...asignacion.equiposSeleccionados, equipoId];

        return { ...asignacion, equiposSeleccionados: newSeleccionados };
      })
    );
  };

  const handleConfirm = () => {
    // Validate that all detalles have the correct number of equipos assigned
    for (const asignacion of asignaciones) {
      if (asignacion.equiposSeleccionados.length !== asignacion.cantidadRequerida) {
        setError(
          `Debe asignar exactamente ${asignacion.cantidadRequerida} equipo(s) para "${asignacion.recetaNombre}". ` +
          `Actualmente tiene ${asignacion.equiposSeleccionados.length} seleccionado(s).`
        );
        return;
      }
    }

    // Build the asignaciones map
    const asignacionesMap: { [detalleId: number]: number[] } = {};
    asignaciones.forEach((asignacion) => {
      asignacionesMap[asignacion.detalleId] = asignacion.equiposSeleccionados;
    });

    onConfirm(asignacionesMap);
  };

  const isValid = asignaciones.every(
    (a) => a.equiposSeleccionados.length === a.cantidadRequerida
  );

  const allLoaded = asignaciones.every((a) => !a.loading);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h6">Asignar Equipos a Factura</Typography>
        <Typography variant="body2" color="text.secondary">
          Seleccione los equipos específicos para cada ítem de equipo en la factura
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {!loading && detallesEquipo.length === 0 && (
          <Alert severity="info">
            No hay equipos en este documento que requieran asignación.
          </Alert>
        )}

        {!loading && asignaciones.length > 0 && (
          <Stack spacing={2}>
            {asignaciones.map((asignacion, index) => (
              <Card key={asignacion.detalleId} variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="600">
                        {asignacion.recetaNombre}
                        {asignacion.recetaModelo && ` - ${asignacion.recetaModelo}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tipo: {asignacion.recetaTipo} | Cantidad requerida: {asignacion.cantidadRequerida}
                      </Typography>
                    </Box>
                    {asignacion.equiposSeleccionados.length === asignacion.cantidadRequerida ? (
                      <Chip
                        icon={<CheckCircle />}
                        label="Completo"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<Warning />}
                        label={`${asignacion.equiposSeleccionados.length}/${asignacion.cantidadRequerida}`}
                        color="warning"
                        size="small"
                      />
                    )}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {asignacion.loading ? (
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : asignacion.equiposDisponibles.length === 0 ? (
                    <Alert severity="warning">
                      No hay equipos disponibles de este tipo. Verifique que haya equipos COMPLETADOS y no asignados.
                    </Alert>
                  ) : (
                    <>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Seleccionar Equipos</InputLabel>
                        <Select
                          multiple
                          value={asignacion.equiposSeleccionados}
                          label="Seleccionar Equipos"
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((equipoId) => {
                                const equipo = asignacion.equiposDisponibles.find(
                                  (e) => e.id === equipoId
                                );
                                return (
                                  <Chip
                                    key={equipoId}
                                    label={equipo?.numeroHeladera || `ID: ${equipoId}`}
                                    size="small"
                                  />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {asignacion.equiposDisponibles.map((equipo) => (
                            <MenuItem
                              key={equipo.id}
                              value={equipo.id}
                              onClick={() => handleEquipoToggle(index, equipo.id)}
                            >
                              <Box display="flex" justifyContent="space-between" width="100%">
                                <Typography>
                                  {equipo.numeroHeladera}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {equipo.estado}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Typography variant="caption" color="text.secondary">
                        Equipos disponibles: {asignacion.equiposDisponibles.length}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!isValid || !allLoaded || asignaciones.length === 0}
        >
          Confirmar Asignación
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AsignarEquiposDialog;
