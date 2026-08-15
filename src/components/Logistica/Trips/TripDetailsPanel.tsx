import React, { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, Divider,
  IconButton, List, ListItem, ListItemText, Stack, SwipeableDrawer, Tab, Tabs,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Map as MapIcon,
  LocalShipping as TruckIcon,
  Person as DriverIcon,
  Schedule as ScheduleIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
  SwapHoriz as SwapHorizIcon,
  OpenInNew as OpenInNewIcon,
  Block as BlockIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { BottomSheet } from '../tripWizard/TripBottomSheet';
import { tipoParadaLabel } from '../tripWizard/tripWizardShared';
import { ResumenCobrosMobile, ResumenCobrosDesktop } from './ResumenCobros';
import type { Viaje, EntregaViaje, DocumentoComercial, ResumenFinancieroViaje } from '../../../types';

interface TripDetailsPanelProps {
  detailsDialogOpen: boolean;
  onClose: () => void;
  selectedTrip: Viaje | null;
  isMobile: boolean;
  isTablet: boolean;
  getDriverName: (conductorId: any) => React.ReactNode;
  getAcompananteName: (acompananteId: any) => React.ReactNode;
  getVehicleInfo: (vehiculoId: any) => React.ReactNode;
  getStatusChip: (estado: Viaje['estado']) => React.ReactNode;
  getTripDeliveries: (viajeId: number) => EntregaViaje[];
  getFacturasByTrip: (viajeId: number) => DocumentoComercial[];
  resumenFinancieroMap: Record<number, ResumenFinancieroViaje | null | undefined>;
  puedeRendirViaje: (t: Viaje) => boolean;
  esLogistico: boolean;
  esAsignadoAlViaje: (t: Viaje) => boolean;
  entregaEstimadaInfo: (...args: any[]) => any;
  renderEntregaEstimada: (...args: any[]) => React.ReactNode;
  navigate: (to: any, opts?: any) => void;
  setConfirmQuitar: (v: any) => void;
  setConfirmRechazar: (v: any) => void;
  setReasignarEntrega: (v: any) => void;
  setRechazoMotivo: (v: string) => void;
  setRendicionDialogViaje: (v: any) => void;
  deliveryDetailsMap: Record<number, any>;
  infoEntregaDeDelivery: (d: any) => any;
  entregaEsEditable: (trip: any, d: any) => boolean;
  diasEntregaEstimada: number;
}

/**
 * Panel de detalles de un viaje (Etapa 6.4: extraído de TripsPage).
 * BottomSheet con tabs en mobile; drawer lateral en desktop.
 */
export default function TripDetailsPanel({
  detailsDialogOpen,
  onClose,
  selectedTrip,
  isMobile,
  isTablet,
  getDriverName,
  getAcompananteName,
  getVehicleInfo,
  getStatusChip,
  getTripDeliveries,
  getFacturasByTrip,
  resumenFinancieroMap,
  puedeRendirViaje,
  esLogistico,
  esAsignadoAlViaje,
  entregaEstimadaInfo,
  renderEntregaEstimada,
  navigate,
  setConfirmQuitar,
  setConfirmRechazar,
  setReasignarEntrega,
  setRechazoMotivo,
  setRendicionDialogViaje,
  deliveryDetailsMap,
  infoEntregaDeDelivery,
  entregaEsEditable,
  diasEntregaEstimada,
}: TripDetailsPanelProps) {
  // Tab activa del detalle — vuelve a la primera al abrir (como hacía la página).
  const [detailsTab, setDetailsTab] = useState(0);
  useEffect(() => {
    if (detailsDialogOpen) setDetailsTab(0);
  }, [detailsDialogOpen]);

  return (
    <>
      {isMobile ? (
        <BottomSheet
          open={detailsDialogOpen}
          onClose={() => onClose()}
          title={`Viaje #${selectedTrip?.id}`}
          actions={
            <Stack spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => selectedTrip && navigate(`/logistica/distribucion/entregas-productos?viaje=${selectedTrip.id}`)}
                sx={{ minHeight: 48 }}
              >
                Ver en Control de Entregas
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => onClose()}
                sx={{ minHeight: 48 }}
              >
                Cerrar
              </Button>
            </Stack>
          }
        >
          {selectedTrip && (
            <Box>
              <Tabs
                value={detailsTab}
                onChange={(_, v) => setDetailsTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
              >
                <Tab label="Info" />
                <Tab label={`Entregas (${getTripDeliveries(selectedTrip.id).length})`} />
                <Tab label={`Facturas (${getFacturasByTrip(selectedTrip.id).length})`} />
                {(!esLogistico || esAsignadoAlViaje(selectedTrip)) && (
                  <Tab
                    label="Cobros"
                    icon={<AttachMoneyIcon sx={{ fontSize: 16 }} />}
                    iconPosition="start"
                    sx={{ minHeight: 48 }}
                  />
                )}
              </Tabs>

              {detailsTab === 0 && (
                <Stack spacing={2}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <DriverIcon color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Conductor</Typography>
                            <Typography variant="body2">{getDriverName(selectedTrip.conductorId)}</Typography>
                            {getAcompananteName(selectedTrip.acompananteId) && (
                              <>
                                <Typography variant="caption" color="text.secondary">Acompañante</Typography>
                                <Typography variant="body2">{getAcompananteName(selectedTrip.acompananteId)}</Typography>
                              </>
                            )}
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TruckIcon color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Vehículo</Typography>
                            <Typography variant="body2">{getVehicleInfo(selectedTrip.vehiculoId)}</Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Destino</Typography>
                            <Typography variant="body2">{selectedTrip.destino}</Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ScheduleIcon color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Fecha</Typography>
                            <Typography variant="body2">{new Date(selectedTrip.fechaViaje).toLocaleString()}</Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" color="text.secondary">Estado:</Typography>
                          {getStatusChip(selectedTrip.estado)}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  {selectedTrip.observaciones && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                        <Typography variant="body2">{selectedTrip.observaciones}</Typography>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              )}

              {detailsTab === 1 && (
                <Stack spacing={1.5}>
                  {getTripDeliveries(selectedTrip.id).map((delivery, index) => {
                    const detalles = deliveryDetailsMap[delivery.id];
                    return (
                      <Card key={delivery.id} variant="outlined">
                        <CardContent sx={{ py: 1.5 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Typography variant="subtitle2">Parada N°{index + 1}</Typography>
                            <Chip
                              label={delivery.estado}
                              size="small"
                              color={delivery.estado === 'ENTREGADA' ? 'success' : 'warning'}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {delivery.direccionEntrega}
                          </Typography>
                          {delivery.clienteDestinoNombre && (
                            <Chip
                              icon={<SwapHorizIcon />}
                              label={`Reasignado a: ${delivery.clienteDestinoNombre}`}
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                          {(delivery as any).tipoParada && (
                            <Chip
                              label={tipoParadaLabel((delivery as any).tipoParada)}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary" display="block">
                            {new Date(delivery.fechaEntrega).toLocaleString()}
                          </Typography>
                          {renderEntregaEstimada(infoEntregaDeDelivery(delivery))}
                          {delivery.observaciones && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              📝 {delivery.observaciones}
                            </Typography>
                          )}
                          {detalles?.equipos?.length > 0 ? (
                            <Box mt={1}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Equipos ({detalles.equipos.length}):
                              </Typography>
                              <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                                {detalles.equipos.map((eq: any) => (
                                  <Chip
                                    key={eq.id}
                                    label={eq.codigoVenta ?? eq.numeroHeladera}
                                    size="small"
                                    variant="outlined"
                                    title={`${eq.modelo ?? ''} | ${eq.tipo ?? ''}`}
                                  />
                                ))}
                              </Stack>
                            </Box>
                          ) : detalles && (
                            <Typography variant="caption" color="text.disabled" display="block" mt={1} sx={{ fontStyle: 'italic' }}>
                              Sin equipos registrados
                            </Typography>
                          )}
                          {entregaEsEditable(selectedTrip, delivery) && (
                            <>
                              <Divider sx={{ my: 1 }} />
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Button
                                  size="small"
                                  color="inherit"
                                  startIcon={<RemoveCircleOutlineIcon />}
                                  onClick={() => setConfirmQuitar(delivery)}
                                >
                                  Quitar del viaje
                                </Button>
                                <Button
                                  size="small"
                                  color="warning"
                                  startIcon={<BlockIcon />}
                                  onClick={() => { setRechazoMotivo(''); setConfirmRechazar(delivery); }}
                                >
                                  Rechazar
                                </Button>
                                <Button
                                  size="small"
                                  color="info"
                                  startIcon={<SwapHorizIcon />}
                                  onClick={() => setReasignarEntrega(delivery)}
                                >
                                  Reasignar
                                </Button>
                              </Stack>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {getTripDeliveries(selectedTrip.id).length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                      No hay entregas asignadas
                    </Typography>
                  )}
                </Stack>
              )}

              {detailsTab === 2 && (
                <Stack spacing={1.5}>
                  {getFacturasByTrip(selectedTrip.id).map((factura) => (
                    <Card key={factura.id} variant="outlined">
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="subtitle2" color="primary">
                          {factura.numeroDocumento}
                        </Typography>
                        <Typography variant="body2">{factura.clienteNombre}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${factura.total.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {factura.detalles.length} items
                        </Typography>
                        {renderEntregaEstimada(entregaEstimadaInfo(factura.fechaEmision ?? (factura as any).fecha))}
                      </CardContent>
                    </Card>
                  ))}
                  {getFacturasByTrip(selectedTrip.id).length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                      No hay facturas asociadas
                    </Typography>
                  )}
                </Stack>
              )}

              {detailsTab === 3 && (!esLogistico || esAsignadoAlViaje(selectedTrip)) && (
                <ResumenCobrosMobile
                  resumen={resumenFinancieroMap[selectedTrip.id]}
                  estadoViaje={selectedTrip.estado}
                  puedeRendir={puedeRendirViaje(selectedTrip)}
                  onRendir={() => setRendicionDialogViaje(selectedTrip)}
                />
              )}
            </Box>
          )}
        </BottomSheet>
      ) : (
        /* Desktop Details Dialog */
        <SwipeableDrawer
          anchor="right"
          open={detailsDialogOpen}
          onClose={() => onClose()}
          onOpen={() => {}}
          PaperProps={{
            sx: { width: isTablet ? '90%' : 600 }
          }}
        >
          {selectedTrip && (
            <Box sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <MapIcon color="primary" />
                  <Typography variant="h6">Viaje #{selectedTrip.id}</Typography>
                  {getStatusChip(selectedTrip.estado)}
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => navigate(`/logistica/distribucion/entregas-productos?viaje=${selectedTrip.id}`)}
                  >
                    Ver en Control de Entregas
                  </Button>
                  <IconButton onClick={() => onClose()}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Información General</Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2"><strong>Conductor:</strong> {getDriverName(selectedTrip.conductorId)}</Typography>
                        {getAcompananteName(selectedTrip.acompananteId) && (
                          <Typography variant="body2"><strong>Acompañante:</strong> {getAcompananteName(selectedTrip.acompananteId)}</Typography>
                        )}
                        <Typography variant="body2"><strong>Vehículo:</strong> {getVehicleInfo(selectedTrip.vehiculoId)}</Typography>
                        <Typography variant="body2"><strong>Destino:</strong> {selectedTrip.destino}</Typography>
                        <Typography variant="body2"><strong>Fecha:</strong> {new Date(selectedTrip.fechaViaje).toLocaleString()}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Entregas ({getTripDeliveries(selectedTrip.id).length})
                      </Typography>
                      <List dense>
                        {getTripDeliveries(selectedTrip.id).map((delivery, index) => {
                          const detalles = deliveryDetailsMap[delivery.id];
                          return (
                          <ListItem key={delivery.id} disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch', py: 0.5 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" width="100%">
                              <ListItemText
                                primary={`Parada N°${index + 1}`}
                                secondary={
                                  <>
                                    {(() => {
                                      const info = infoEntregaDeDelivery(delivery);
                                      if (!info) return delivery.direccionEntrega;
                                      const restTxt = info.restantes >= 0
                                        ? `faltan ${info.restantes} d`
                                        : `atrasada ${Math.abs(info.restantes)} d`;
                                      return `${delivery.direccionEntrega} · Estimada ${info.fecha} (transcurridos ${info.transcurridos}/${diasEntregaEstimada} d, ${restTxt})`;
                                    })()}
                                    {delivery.observaciones && (
                                      <Box component="span" display="block" sx={{ fontStyle: 'italic', mt: 0.25 }}>
                                        📝 {delivery.observaciones}
                                      </Box>
                                    )}
                                  </>
                                }
                              />
                              <Chip
                                label={delivery.estado}
                                size="small"
                                color={delivery.estado === 'ENTREGADA' ? 'success' : 'warning'}
                                sx={{ mt: 0.5, flexShrink: 0 }}
                              />
                            </Box>
                            {detalles?.equipos?.length > 0 ? (
                              <Box mt={0.5} mb={0.5}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  Equipos ({detalles.equipos.length}):
                                </Typography>
                                <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                                  {detalles.equipos.map((eq: any) => (
                                    <Chip
                                      key={eq.id}
                                      label={`${eq.codigoVenta ?? eq.numeroHeladera}${eq.color?.nombre ? ` · ${eq.color.nombre}` : ''}`}
                                      size="small"
                                      variant="outlined"
                                      title={`${eq.modelo ?? ''} | ${eq.tipo ?? ''}`}
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            ) : detalles && (
                              <Typography variant="caption" color="text.disabled" display="block" mt={0.5} mb={0.5} sx={{ fontStyle: 'italic' }}>
                                Sin equipos registrados
                              </Typography>
                            )}
                          </ListItem>
                          );
                        })}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {getFacturasByTrip(selectedTrip.id).length > 0 && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Facturas ({getFacturasByTrip(selectedTrip.id).length})
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {getFacturasByTrip(selectedTrip.id).map((factura) => (
                            <Chip
                              key={factura.id}
                              label={`${factura.numeroDocumento} - $${factura.total.toLocaleString()}`}
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {selectedTrip.observaciones && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Observaciones</Typography>
                        <Typography variant="body2">{selectedTrip.observaciones}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Resumen financiero — visible para roles con acceso financiero */}
                {(!esLogistico || esAsignadoAlViaje(selectedTrip)) && (
                  <Grid item xs={12}>
                    <ResumenCobrosDesktop
                      resumen={resumenFinancieroMap[selectedTrip.id]}
                      estadoViaje={selectedTrip.estado}
                      puedeRendir={puedeRendirViaje(selectedTrip)}
                      onRendir={() => { onClose(); setRendicionDialogViaje(selectedTrip); }}
                    />
                  </Grid>
                )}
              </Grid>

              <Box mt={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => onClose()}
                >
                  Cerrar
                </Button>
              </Box>
            </Box>
          )}
        </SwipeableDrawer>
      )}
    </>
  );
}
