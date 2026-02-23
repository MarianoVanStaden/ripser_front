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
import type { DetalleDocumento, EquipoFabricadoDTO, EstadoAsignacionEquipo } from '../../types';

// Helper function to get color for estadoAsignacion
const getEstadoAsignacionColor = (estado: EstadoAsignacionEquipo | null | undefined): 'default' | 'warning' | 'info' | 'secondary' | 'success' => {
  if (!estado) return 'default';
  const colorMap: Record<EstadoAsignacionEquipo, 'default' | 'warning' | 'info' | 'secondary' | 'success'> = {
    DISPONIBLE: 'default',
    RESERVADO: 'warning',
    FACTURADO: 'info',
    EN_TRANSITO: 'secondary',
    ENTREGADO: 'success',
    PENDIENTE_TERMINACION: 'warning',
  };
  return colorMap[estado] || 'default';
};

const getEstadoAsignacionLabel = (estado: EstadoAsignacionEquipo | null | undefined): string => {
  if (!estado) return 'No especificado';
  const labelMap: Record<EstadoAsignacionEquipo, string> = {
    DISPONIBLE: 'Disponible',
    RESERVADO: 'Reservado',
    FACTURADO: 'Facturado',
    EN_TRANSITO: 'En Tránsito',
    ENTREGADO: 'Entregado',
    PENDIENTE_TERMINACION: 'Pendiente Terminación',
  };
  return labelMap[estado] || estado;
};

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
  color?: string;
  medida?: string;
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
          color: detalle.color,
          medida: detalle.medida,
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
        // Fetch both COMPLETADO+DISPONIBLE and FABRICADO_SIN_TERMINACION equipos
        const [equiposCompletos, equiposSinTerminacionRaw] = await Promise.all([
          equipoFabricadoApi.findDisponiblesParaVentaByReceta(asignacion.recetaId),
          equipoFabricadoApi.findSinTerminacionByReceta(asignacion.recetaId).catch(() => [] as any[]),
        ]);

        // Backend limitation: list DTOs may return id: null for some equipos.
        // Resolve real IDs via findByNumeroHeladera for those that need it.
        const equiposSinTerminacionResolved = await Promise.all(
          equiposSinTerminacionRaw.map(async (e: any) => {
            if (e.id) return e as EquipoFabricadoDTO; // already has a valid ID
            if (!e.numeroHeladera) return null;        // can't resolve, skip
            try {
              const full = await equipoFabricadoApi.findByNumeroHeladera(e.numeroHeladera);
              return { ...e, id: full.id } as EquipoFabricadoDTO;
            } catch {
              return null; // resolution failed, skip this equipo
            }
          })
        );
        const equiposSinTerminacion = equiposSinTerminacionResolved.filter(
          (e): e is EquipoFabricadoDTO => Boolean(e?.id)
        );

        // Combine lists deduplicating by ID
        const combinados: EquipoFabricadoDTO[] = [
          ...equiposCompletos,
          ...equiposSinTerminacion.filter((e) => !equiposCompletos.some((c) => c.id === e.id)),
        ];

        // Filter by color, medida, and estadoAsignacion
        const equiposFiltrados = combinados.filter((equipo) => {
          const matchColor = !asignacion.color || equipo.color === asignacion.color;
          const matchMedida = !asignacion.medida || equipo.medida === asignacion.medida;

          // Infer estadoAsignacion if not provided
          let estadoAsignacion = equipo.estadoAsignacion;
          if (!estadoAsignacion) {
            if (equipo.estado === 'COMPLETADO') {
              estadoAsignacion = equipo.asignado ? 'ENTREGADO' : 'DISPONIBLE';
            } else if (equipo.estado === 'FABRICADO_SIN_TERMINACION') {
              estadoAsignacion = equipo.asignado ? 'PENDIENTE_TERMINACION' : 'DISPONIBLE';
            }
          }

          // Accept DISPONIBLE (both COMPLETADO and FABRICADO_SIN_TERMINACION)
          // and PENDIENTE_TERMINACION (reserved base that still needs finishing)
          const isSelectable =
            estadoAsignacion === 'DISPONIBLE' ||
            estadoAsignacion === 'PENDIENTE_TERMINACION' ||
            (!equipo.asignado && equipo.estado === 'FABRICADO_SIN_TERMINACION');

          return matchColor && matchMedida && isSelectable;
        });

        console.log(`🔍 Filtrado de equipos para ${asignacion.recetaNombre}:`);
        console.log(`  - Completados+disponibles: ${equiposCompletos.length}`);
        console.log(`  - Sin terminación: ${equiposSinTerminacion.length}`);
        console.log(`  - Color requerido: "${asignacion.color || 'Sin especificar'}"`);
        console.log(`  - Medida requerida: "${asignacion.medida || 'Sin especificar'}"`);
        console.log(`  - Equipos seleccionables: ${equiposFiltrados.length}`);

        setAsignaciones((prev) =>
          prev.map((a, index) =>
            index === i
              ? { ...a, equiposDisponibles: equiposFiltrados, loading: false }
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

    console.log('🔍 AsignarEquiposDialog - Asignaciones a enviar:');
    asignaciones.forEach((asignacion) => {
      console.log(`  - Detalle ID ${asignacion.detalleId} (${asignacion.recetaNombre}):`);
      console.log(`    Cantidad requerida: ${asignacion.cantidadRequerida}`);
      console.log(`    Equipos seleccionados (${asignacion.equiposSeleccionados.length}):`, asignacion.equiposSeleccionados);
    });
    console.log('📦 Mapa final:', asignacionesMap);

    onConfirm(asignacionesMap);
  };

  const isValid = asignaciones.every(
    (a) => a.equiposSeleccionados.length === a.cantidadRequerida
  );

  const allLoaded = asignaciones.every((a) => !a.loading);

  // Check if any selected equipo is not COMPLETADO (sin terminación or in process)
  const haySinTerminacion = asignaciones.some((a) =>
    a.equiposSeleccionados.some((id) => {
      const equipo = a.equiposDisponibles.find((e) => e.id === id);
      return equipo && equipo.estado !== 'COMPLETADO';
    })
  );

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

        {haySinTerminacion && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Atención:</strong> Uno o más equipos seleccionados aún no tienen terminación (estado <em>Sin Terminación</em>).
            Se asignarán a la factura y podrán completar su terminación antes de la entrega.
            El equipo quedará reservado exclusivamente para esta venta.
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
                      {(asignacion.color || asignacion.medida) && (
                        <Box display="flex" gap={1} mt={0.5}>
                          {asignacion.color && (
                            <Chip
                              label={`Color: ${asignacion.color.replace(/_/g, ' ')}`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          )}
                          {asignacion.medida && (
                            <Chip
                              label={`Medida: ${asignacion.medida}`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          )}
                        </Box>
                      )}
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
                              <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                                <Box>
                                  <Typography>
                                    {equipo.numeroHeladera}
                                  </Typography>
                                  {(equipo.color || equipo.medida) && (
                                    <Typography variant="caption" color="text.secondary">
                                      {equipo.color && equipo.color.replace(/_/g, ' ')}
                                      {equipo.color && equipo.medida && ' - '}
                                      {equipo.medida}
                                    </Typography>
                                  )}
                                </Box>
                                <Box display="flex" gap={1} alignItems="center">
                                  <Chip
                                    label={
                                      equipo.estado === 'COMPLETADO' ? 'Completado' :
                                      equipo.estado === 'FABRICADO_SIN_TERMINACION' ? 'Sin Terminación' :
                                      equipo.estado === 'EN_PROCESO' ? 'En Proceso' :
                                      equipo.estado
                                    }
                                    size="small"
                                    color={
                                      equipo.estado === 'COMPLETADO' ? 'success' :
                                      equipo.estado === 'FABRICADO_SIN_TERMINACION' ? 'warning' :
                                      'default'
                                    }
                                    variant="outlined"
                                  />
                                  {equipo.estadoAsignacion && (
                                    <Chip
                                      label={getEstadoAsignacionLabel(equipo.estadoAsignacion)}
                                      size="small"
                                      color={getEstadoAsignacionColor(equipo.estadoAsignacion)}
                                    />
                                  )}
                                </Box>
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
