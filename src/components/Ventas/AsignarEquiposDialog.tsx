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
import { CheckCircle, Warning, HourglassEmpty, Build, ColorLens } from '@mui/icons-material';
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
    EN_SERVICE: 'warning',
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
    EN_SERVICE: 'En Service',
  };
  return labelMap[estado] || estado;
};

type EstadoEquipoChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

const ESTADO_FABRICACION_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En Proceso',
  FABRICADO_SIN_TERMINACION: 'Sin Terminación',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

const ESTADO_FABRICACION_COLOR: Record<string, EstadoEquipoChipColor> = {
  PENDIENTE: 'default',
  EN_PROCESO: 'primary',
  FABRICADO_SIN_TERMINACION: 'warning',
  COMPLETADO: 'success',
  CANCELADO: 'error',
};

const ESTADO_FABRICACION_ICON: Record<string, React.ReactElement> = {
  PENDIENTE: <HourglassEmpty fontSize="small" />,
  EN_PROCESO: <Build fontSize="small" />,
  FABRICADO_SIN_TERMINACION: <ColorLens fontSize="small" />,
  COMPLETADO: <CheckCircle fontSize="small" />,
};

interface AsignarEquiposDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (asignaciones: { [detalleId: number]: number[] }) => void;
  detallesEquipo: DetalleDocumento[];
  /** clienteId of the nota de pedido — allows selecting equipos already reserved for this client */
  clienteId?: number;
  /** notaPedidoId — when set, uses the seleccionables-para-factura endpoint so RESERVADO equipos for this nota appear */
  notaPedidoId?: number;
}

interface DetalleAsignacion {
  detalleId: number;
  recetaId: number;
  recetaNombre: string;
  recetaModelo?: string;
  recetaTipo?: string;
  /** Cached color id and display name (the line item carries the FK only). */
  colorId?: number;
  colorNombre?: string;
  /** Cached medida id and display name. */
  medidaId?: number;
  medidaNombre?: string;
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
  clienteId,
  notaPedidoId,
}) => {
  const [asignaciones, setAsignaciones] = useState<DetalleAsignacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmIncompletosOpen, setConfirmIncompletosOpen] = useState(false);

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
          colorId: detalle.color?.id,
          colorNombre: detalle.color?.nombre,
          medidaId: detalle.medida?.id,
          medidaNombre: detalle.medida?.nombre,
          cantidadRequerida: detalle.cantidad,
          equiposSeleccionados: [],
          equiposDisponibles: [],
          loading: true,
        };

        newAsignaciones.push(asignacion);
      }
    }

    setAsignaciones(newAsignaciones);

    // Pre-fetch equipos already reserved for this client (once for all recetas)
    let clienteReservados: EquipoFabricadoDTO[] = [];
    if (clienteId) {
      try {
        const clienteEquiposRaw = await equipoFabricadoApi.findByCliente(clienteId);
        const reservadosRaw = clienteEquiposRaw.filter(
          (e) =>
            (e.estado === 'COMPLETADO' || e.estado === 'FABRICADO_SIN_TERMINACION') &&
            (e.estadoAsignacion === 'RESERVADO' || e.estadoAsignacion === 'DISPONIBLE')
        );
        // Resolve full DTOs (list DTO may have null id; full DTO always has it)
        const resolved = await Promise.all(
          reservadosRaw.map(async (e: any) => {
            if (e.id) {
              const full = await equipoFabricadoApi.findByNumeroHeladera(e.numeroHeladera).catch(() => null);
              return full ?? null;
            }
            if (!e.numeroHeladera) return null;
            try {
              return await equipoFabricadoApi.findByNumeroHeladera(e.numeroHeladera);
            } catch {
              return null;
            }
          })
        );
        clienteReservados = resolved.filter((e): e is EquipoFabricadoDTO => Boolean(e?.id));
      } catch {
        // Non-fatal — fall back to only DISPONIBLE equipos
      }
    }

    // Fetch available equipos for each receta
    for (let i = 0; i < newAsignaciones.length; i++) {
      const asignacion = newAsignaciones[i];
      try {
        // Fetch tres fuentes:
        //  1) COMPLETADO+DISPONIBLE (o seleccionables si hay notaPedidoId)
        //  2) FABRICADO_SIN_TERMINACION (base sin terminación)
        //  3) Todos los equipos de la receta — usado para incorporar los estados
        //     PENDIENTE y EN_PROCESO, ahora permitidos por backend al facturar.
        const [equiposCompletos, equiposSinTerminacionRaw, equiposTodosReceta] = await Promise.all([
          notaPedidoId
            ? equipoFabricadoApi.findSeleccionablesParaFactura(asignacion.recetaId, notaPedidoId)
            : equipoFabricadoApi.findDisponiblesParaVentaByReceta(asignacion.recetaId),
          equipoFabricadoApi.findSinTerminacionByReceta(asignacion.recetaId).catch(() => [] as any[]),
          equipoFabricadoApi.findByReceta(asignacion.recetaId).catch(() => [] as any[]),
        ]);

        // De la lista completa, quedarnos solo con PENDIENTE / EN_PROCESO (los demás
        // ya vienen por las otras fuentes). Resolver IDs reales cuando el list DTO
        // los devuelve nulos (workaround conocido del backend).
        const equiposEnFabricacionRaw = equiposTodosReceta.filter(
          (e: any) => e.estado === 'PENDIENTE' || e.estado === 'EN_PROCESO'
        );
        const equiposEnFabricacionResolved = await Promise.all(
          equiposEnFabricacionRaw.map(async (e: any) => {
            if (e.id) return e as EquipoFabricadoDTO;
            if (!e.numeroHeladera) return null;
            try {
              const full = await equipoFabricadoApi.findByNumeroHeladera(e.numeroHeladera);
              return { ...e, id: full.id } as EquipoFabricadoDTO;
            } catch {
              return null;
            }
          })
        );
        const equiposEnFabricacion = equiposEnFabricacionResolved.filter(
          (e): e is EquipoFabricadoDTO => Boolean(e?.id)
        );

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

        // Client's RESERVADO equipos matching this receta's modelo + medida
        const reservadosParaReceta = clienteReservados.filter(
          (e) =>
            e.modelo === asignacion.recetaModelo &&
            (!asignacion.medidaId || e.medida?.id === asignacion.medidaId)
        );

        // Combine lists deduplicating by ID
        const combinados: EquipoFabricadoDTO[] = [
          ...equiposCompletos,
          ...equiposSinTerminacion.filter((e) => !equiposCompletos.some((c) => c.id === e.id)),
          ...reservadosParaReceta.filter(
            (e) => !equiposCompletos.some((c) => c.id === e.id) &&
                   !equiposSinTerminacion.some((c) => c.id === e.id)
          ),
          ...equiposEnFabricacion.filter(
            (e) => !equiposCompletos.some((c) => c.id === e.id) &&
                   !equiposSinTerminacion.some((c) => c.id === e.id) &&
                   !reservadosParaReceta.some((c) => c.id === e.id)
          ),
        ];

        // IDs returned by the nota-specific endpoint — only these RESERVADO equipos are selectable
        const seleccionablesIds = notaPedidoId != null
          ? new Set(equiposCompletos.map((e) => e.id))
          : null;

        // Filter by color, medida, and estadoAsignacion
        const equiposFiltrados = combinados.filter((equipo) => {
          // CANCELADO siempre excluido (backend lo rechaza).
          if (equipo.estado === 'CANCELADO') return false;

          const matchColor = !asignacion.colorId || equipo.color?.id === asignacion.colorId;
          const matchMedida = !asignacion.medidaId || equipo.medida?.id === asignacion.medidaId;

          // Infer estadoAsignacion if not provided
          let estadoAsignacion = equipo.estadoAsignacion;
          if (!estadoAsignacion) {
            if (equipo.estado === 'COMPLETADO') {
              estadoAsignacion = equipo.asignado ? 'ENTREGADO' : 'DISPONIBLE';
            } else if (equipo.estado === 'FABRICADO_SIN_TERMINACION') {
              estadoAsignacion = equipo.asignado ? 'PENDIENTE_TERMINACION' : 'DISPONIBLE';
            }
          }

          // Equipos en cola de fabricación (PENDIENTE / EN_PROCESO) son seleccionables
          // si no están ya asignados a otra venta.
          const enFabricacionSeleccionable =
            (equipo.estado === 'PENDIENTE' || equipo.estado === 'EN_PROCESO') && !equipo.asignado;

          // Accept DISPONIBLE and PENDIENTE_TERMINACION (standard pool).
          // Accept RESERVADO only if it was explicitly returned by the nota-specific endpoint
          // (seleccionablesIds), or belongs to this client when using the old path.
          const isSelectable =
            estadoAsignacion === 'DISPONIBLE' ||
            estadoAsignacion === 'PENDIENTE_TERMINACION' ||
            (!equipo.asignado && equipo.estado === 'FABRICADO_SIN_TERMINACION') ||
            enFabricacionSeleccionable ||
            (estadoAsignacion === 'RESERVADO' && (
              (seleccionablesIds != null && seleccionablesIds.has(equipo.id)) ||
              (seleccionablesIds == null && clienteId != null && equipo.clienteId === clienteId)
            ));

          return matchColor && matchMedida && isSelectable;
        });

        console.log(`🔍 Filtrado de equipos para ${asignacion.recetaNombre}:`);
        console.log(`  - Completados+disponibles: ${equiposCompletos.length}`);
        console.log(`  - Sin terminación: ${equiposSinTerminacion.length}`);
        console.log(`  - Color requerido: "${asignacion.colorNombre || 'Sin especificar'}"`);
        console.log(`  - Medida requerida: "${asignacion.medidaNombre || 'Sin especificar'}"`);
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

    // Si hay equipos no COMPLETADO seleccionados, pedimos confirmación explícita
    // (no bloqueante: el usuario puede continuar).
    if (hayEquiposIncompletos) {
      setConfirmIncompletosOpen(true);
      return;
    }

    submitAsignaciones();
  };

  const submitAsignaciones = () => {
    const asignacionesMap: { [detalleId: number]: number[] } = {};
    asignaciones.forEach((asignacion) => {
      asignacionesMap[asignacion.detalleId] = asignacion.equiposSeleccionados;
    });
    console.log('📦 AsignarEquiposDialog - Mapa final:', asignacionesMap);
    setConfirmIncompletosOpen(false);
    onConfirm(asignacionesMap);
  };

  const isValid = asignaciones.every(
    (a) => a.equiposSeleccionados.length === a.cantidadRequerida
  );

  const allLoaded = asignaciones.every((a) => !a.loading);

  // Equipos seleccionados que aún no están COMPLETADO (incluye PENDIENTE,
  // EN_PROCESO y FABRICADO_SIN_TERMINACION). Se usan para mostrar un aviso
  // no-bloqueante: la factura se puede emitir, pero el viaje no podrá iniciarse
  // hasta que todos esos equipos estén COMPLETADO.
  const equiposIncompletosSeleccionados = asignaciones.flatMap((a) =>
    a.equiposSeleccionados
      .map((id) => a.equiposDisponibles.find((e) => e.id === id))
      .filter((e): e is EquipoFabricadoDTO => Boolean(e) && e!.estado !== 'COMPLETADO')
  );
  const hayEquiposIncompletos = equiposIncompletosSeleccionados.length > 0;

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

        {!loading && hayEquiposIncompletos && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Uno o más equipos aún están en producción. El viaje no podrá iniciarse hasta que estén completados.
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
                      {(asignacion.colorNombre || asignacion.medidaNombre) && (
                        <Box display="flex" gap={1} mt={0.5}>
                          {asignacion.colorNombre && (
                            <Chip
                              label={`Color: ${asignacion.colorNombre}`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          )}
                          {asignacion.medidaNombre && (
                            <Chip
                              label={`Medida: ${asignacion.medidaNombre}`}
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
                      No hay equipos disponibles de este tipo. Verifique que haya equipos no asignados
                      (en cualquier estado salvo CANCELADO).
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
                                      {equipo.color && equipo.color.nombre}
                                      {equipo.color && equipo.medida && ' - '}
                                      {equipo.medida?.nombre}
                                    </Typography>
                                  )}
                                </Box>
                                <Box display="flex" gap={1} alignItems="center">
                                  <Chip
                                    icon={ESTADO_FABRICACION_ICON[equipo.estado]}
                                    label={ESTADO_FABRICACION_LABEL[equipo.estado] || equipo.estado}
                                    size="small"
                                    color={ESTADO_FABRICACION_COLOR[equipo.estado] || 'default'}
                                    variant="outlined"
                                  />
                                  {equipo.estadoAsignacion && (
                                    <Chip
                                      label={
                                        equipo.estadoAsignacion === 'RESERVADO' && notaPedidoId != null
                                          ? 'Reservado para esta nota'
                                          : getEstadoAsignacionLabel(equipo.estadoAsignacion)
                                      }
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

      {/* Modal de confirmación: equipos seleccionados todavía no COMPLETADOS */}
      <Dialog
        open={confirmIncompletosOpen}
        onClose={() => setConfirmIncompletosOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Warning sx={{ fontSize: 40, color: 'warning.main' }} />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Equipos aún en producción
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Confirmá que querés asignarlos igualmente
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Los siguientes equipos seleccionados todavía no están <strong>COMPLETADOS</strong>.
            Podés asignarlos a la factura ahora, pero <strong>el viaje no podrá iniciarse</strong>{' '}
            hasta que la producción de todos los equipos finalice.
          </Typography>
          <Stack spacing={1}>
            {equiposIncompletosSeleccionados.map((equipo) => (
              <Box
                key={equipo.id}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Typography variant="body2" fontWeight={500}>
                  {equipo.numeroHeladera}
                </Typography>
                <Chip
                  size="small"
                  label={ESTADO_FABRICACION_LABEL[equipo.estado] || equipo.estado}
                  color={ESTADO_FABRICACION_COLOR[equipo.estado] || 'default'}
                />
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmIncompletosOpen(false)}>Revisar selección</Button>
          <Button variant="contained" color="warning" onClick={submitAsignaciones}>
            Asignar igualmente
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default AsignarEquiposDialog;
