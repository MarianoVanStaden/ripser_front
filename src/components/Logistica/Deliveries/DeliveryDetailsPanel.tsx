import React, { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, IconButton,
  List, ListItem, ListItemText, Stack, SwipeableDrawer, Tab, Tabs, Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Map as MapIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Inventory as EquipmentIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import BottomSheet from './components/BottomSheet';
import EntregaDocumentosCard from './EntregaDocumentosCard';
import { openWhatsAppWeb } from '../../../utils/whatsapp';
import { getEstadoAsignacionColor, getEstadoAsignacionLabel } from './utils';
import type { EntregaViaje } from '../../../types';

interface DeliveryDetailsPanelProps {
  detailsDialogOpen: boolean;
  onClose: () => void;
  selectedDelivery: EntregaViaje | null;
  selectedDeliveryDetails: any;
  isMobile: boolean;
  isTablet: boolean;
  getClientName: (d: EntregaViaje) => string;
  getVentaNumero: (d: EntregaViaje) => React.ReactNode;
  getTripNumber: (viajeId: EntregaViaje['viajeId']) => React.ReactNode;
  getMontoACobrar: (d: EntregaViaje) => number | null | undefined;
  getStatusChip: (estado: EntregaViaje['estado']) => React.ReactNode;
  getClientPhone: (d: EntregaViaje) => string | null | undefined;
  getClientFantasia: (d: EntregaViaje) => string | null;
  openConfirmDialog: (id: number) => void;
  openRejectDialog: (id: number) => void;
  openCobroStandalone: (id: number) => void;
  entregaDocumentos: any[];
  loadingDocumentos: boolean;
  addingDocumentos: boolean;
  docThumbnails: Record<number, string>;
  addDocInputRef: React.RefObject<HTMLInputElement | null>;
  handleViewImage: (doc: any) => void;
  handleDeleteDocumento: (doc: any) => void;
  handleDownloadDocumento: (doc: any) => void;
}

/**
 * Panel de detalles de una entrega (Etapa 6.4: extraído de DeliveriesPage).
 * BottomSheet con tabs en mobile; drawer lateral en desktop. El contenido
 * (info, dirección, equipos, documentos) se renderiza según la rama.
 */
export default function DeliveryDetailsPanel({
  detailsDialogOpen,
  onClose,
  selectedDelivery,
  selectedDeliveryDetails,
  isMobile,
  isTablet,
  getClientName,
  getVentaNumero,
  getTripNumber,
  getMontoACobrar,
  getStatusChip,
  getClientPhone,
  getClientFantasia,
  openConfirmDialog,
  openRejectDialog,
  openCobroStandalone,
  entregaDocumentos,
  loadingDocumentos,
  addingDocumentos,
  docThumbnails,
  addDocInputRef,
  handleViewImage,
  handleDeleteDocumento,
  handleDownloadDocumento,
}: DeliveryDetailsPanelProps) {
  // Tab activa del detalle (Info / Equipos) — solo aplica a la rama mobile.
  // Vuelve a Info cada vez que se abre (comportamiento de la página original).
  const [detailsTab, setDetailsTab] = useState(0);
  useEffect(() => {
    if (detailsDialogOpen) setDetailsTab(0);
  }, [detailsDialogOpen]);

  return (
    <>
      {isMobile ? (
        <BottomSheet
          open={detailsDialogOpen}
          onClose={() => { onClose(); }}
          title="Detalles de Entrega"
          actions={
            selectedDelivery?.estado === 'PENDIENTE' ? (
              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => openConfirmDialog(selectedDelivery.id)}
                  fullWidth
                  sx={{ minHeight: 48 }}
                >
                  Confirmar Entrega
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => openRejectDialog(selectedDelivery.id)}
                  fullWidth
                  sx={{ minHeight: 48 }}
                >
                  No Entregada
                </Button>
              </Stack>
            ) : selectedDelivery?.estado === 'ENTREGADA' ? (
              <Stack spacing={1.5}>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => { onClose(); openCobroStandalone(selectedDelivery.id); }}
                  fullWidth
                  sx={{ minHeight: 48 }}
                >
                  {selectedDelivery.estadoCobro && selectedDelivery.estadoCobro !== 'PENDIENTE'
                    ? 'Corregir cobro'
                    : 'Registrar cobro'}
                </Button>
                <Button
                  onClick={() => { onClose(); }}
                  fullWidth
                  sx={{ minHeight: 48 }}
                >
                  Cerrar
                </Button>
              </Stack>
            ) : (
              <Button
                variant="contained"
                onClick={() => { onClose(); }}
                fullWidth
                sx={{ minHeight: 48 }}
              >
                Cerrar
              </Button>
            )
          }
        >
          {selectedDelivery && (
            <Box>
              <Tabs
                value={detailsTab}
                onChange={(_, v) => setDetailsTab(v)}
                variant="fullWidth"
                sx={{ mb: 2 }}
              >
                <Tab label="Info" />
                <Tab label={`Equipos (${selectedDeliveryDetails?.equipos?.length || 0})`} />
              </Tabs>

              {detailsTab === 0 && (
                <Stack spacing={2}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Cliente</Typography>
                          <Typography variant="body2" fontWeight="medium">{getClientName(selectedDelivery)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Factura</Typography>
                          <Typography variant="body2">{getVentaNumero(selectedDelivery)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Viaje</Typography>
                          <Typography variant="body2">{getTripNumber(selectedDelivery.viajeId)}</Typography>
                        </Box>
                        {/* Monto a cobrar en esta entrega */}
                        {(() => {
                          const monto = getMontoACobrar(selectedDelivery);
                          if (monto == null) return null;
                          return (
                            <Box
                              sx={{
                                bgcolor: 'success.50',
                                border: '1px solid',
                                borderColor: 'success.main',
                                borderRadius: 1,
                                px: 1.5,
                                py: 1,
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">A cobrar en esta entrega</Typography>
                              <Typography variant="h6" fontWeight={700} color="success.dark">
                                ${monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Typography>
                            </Box>
                          );
                        })()}
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" color="text.secondary">Estado:</Typography>
                          {getStatusChip(selectedDelivery.estado)}
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Fecha</Typography>
                          <Typography variant="body2">{new Date(selectedDelivery.fechaEntrega).toLocaleString()}</Typography>
                        </Box>
                        {selectedDelivery.receptorNombre && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">Receptor</Typography>
                            <Typography variant="body2">{selectedDelivery.receptorNombre}</Typography>
                          </Box>
                        )}
                        {selectedDelivery.observaciones && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {selectedDelivery.observaciones}
                            </Typography>
                          </Box>
                        )}
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<WhatsAppIcon />}
                          onClick={() => openWhatsAppWeb(getClientPhone(selectedDelivery))}
                          disabled={!getClientPhone(selectedDelivery)}
                          // eslint-disable-next-line ripser/no-literal-colors -- verde WhatsApp, identidad fija
                          sx={{ alignSelf: 'flex-start', minHeight: 44, color: '#25D366', borderColor: '#25D366' }}
                        >
                          {getClientPhone(selectedDelivery) ? 'WhatsApp al cliente' : 'Sin teléfono'}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" mb={1}>
                        <strong>Nombre de local:</strong> {getClientFantasia(selectedDelivery) || '-'}
                      </Typography>
                      <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
                        <LocationIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2">{selectedDelivery.direccionEntrega}</Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        startIcon={<MapIcon />}
                        onClick={() => window.open(`https://maps.google.com?q=${encodeURIComponent(selectedDelivery.direccionEntrega)}`, '_blank')}
                        fullWidth
                        sx={{ minHeight: 44 }}
                      >
                        Ver en Maps
                      </Button>
                    </CardContent>
                  </Card>

                  {selectedDelivery.observaciones && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                        <Typography variant="body2">{selectedDelivery.observaciones}</Typography>
                      </CardContent>
                    </Card>
                  )}

                  {/* Imágenes / Documentos — disponible para todos los estados */}
                  <EntregaDocumentosCard
                    compact
                    documentos={entregaDocumentos}
                    loading={loadingDocumentos}
                    adding={addingDocumentos}
                    thumbnails={docThumbnails}
                    onAddClick={() => addDocInputRef.current?.click()}
                    onViewImage={handleViewImage}
                    onDownload={handleDownloadDocumento}
                    onDelete={handleDeleteDocumento}
                  />
                </Stack>
              )}

              {detailsTab === 1 && (
                <Stack spacing={1.5}>
                  {selectedDeliveryDetails?.equipos?.map((equipo: any) => {
                    let estadoAsignacion = equipo.estadoAsignacion;
                    if (!estadoAsignacion) {
                      estadoAsignacion = selectedDelivery.estado === 'ENTREGADA' ? 'ENTREGADO' : 'EN_TRANSITO';
                    }

                    return (
                      <Card key={equipo.id} variant="outlined">
                        <CardContent sx={{ py: 1.5 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                #{equipo.codigoVenta ?? equipo.numeroHeladera ?? equipo.id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {equipo.modelo || 'N/A'} - {equipo.tipo || 'N/A'}
                              </Typography>
                              {equipo.color && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Color: {typeof equipo.color === 'string' ? equipo.color : equipo.color?.nombre}
                                </Typography>
                              )}
                            </Box>
                            <Chip
                              label={getEstadoAsignacionLabel(estadoAsignacion)}
                              size="small"
                              color={getEstadoAsignacionColor(estadoAsignacion)}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {(!selectedDeliveryDetails?.equipos || selectedDeliveryDetails.equipos.length === 0) && (
                    <Box textAlign="center" py={4}>
                      <EquipmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">Sin equipos asignados</Typography>
                      <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                        La factura no tiene unidades individuales registradas
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          )}
        </BottomSheet>
      ) : (
        <SwipeableDrawer
          anchor="right"
          open={detailsDialogOpen}
          onClose={() => { onClose(); }}
          onOpen={() => {}}
          PaperProps={{ sx: { width: isTablet ? '90%' : 550 } }}
        >
          {selectedDelivery && (
            <Box sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ViewIcon color="primary" />
                  <Typography variant="h6">Detalles de Entrega</Typography>
                  {getStatusChip(selectedDelivery.estado)}
                </Box>
                <IconButton onClick={() => { onClose(); }}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Informacion</Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2"><strong>Cliente:</strong> {getClientName(selectedDelivery)}</Typography>
                        <Typography variant="body2"><strong>Factura:</strong> {getVentaNumero(selectedDelivery)}</Typography>
                        <Typography variant="body2"><strong>Viaje:</strong> {getTripNumber(selectedDelivery.viajeId)}</Typography>
                        {(() => {
                          const monto = getMontoACobrar(selectedDelivery);
                          if (monto == null) return null;
                          return (
                            <Box
                              sx={{
                                bgcolor: 'success.50',
                                border: '1px solid',
                                borderColor: 'success.main',
                                borderRadius: 1,
                                px: 1.5,
                                py: 1,
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">A cobrar en esta entrega</Typography>
                              <Typography variant="h6" fontWeight={700} color="success.dark">
                                ${monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Typography>
                            </Box>
                          );
                        })()}
                        <Typography variant="body2"><strong>Fecha:</strong> {new Date(selectedDelivery.fechaEntrega).toLocaleString()}</Typography>
                        {selectedDelivery.receptorNombre && (
                          <Typography variant="body2"><strong>Receptor:</strong> {selectedDelivery.receptorNombre}</Typography>
                        )}
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<WhatsAppIcon />}
                          onClick={() => openWhatsAppWeb(getClientPhone(selectedDelivery))}
                          disabled={!getClientPhone(selectedDelivery)}
                          // eslint-disable-next-line ripser/no-literal-colors -- verde WhatsApp, identidad fija
                          sx={{ alignSelf: 'flex-start', color: '#25D366', borderColor: '#25D366' }}
                        >
                          {getClientPhone(selectedDelivery) ? 'WhatsApp al cliente' : 'Sin teléfono'}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Direccion</Typography>
                      <Typography variant="body2" mb={1}>
                        <strong>Nombre de local:</strong> {getClientFantasia(selectedDelivery) || '-'}
                      </Typography>
                      <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
                        <LocationIcon sx={{ fontSize: 18, mt: 0.3, color: 'text.secondary' }} />
                        <Typography variant="body2">{selectedDelivery.direccionEntrega}</Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<MapIcon />}
                        onClick={() => window.open(`https://maps.google.com?q=${encodeURIComponent(selectedDelivery.direccionEntrega)}`, '_blank')}
                        fullWidth
                      >
                        Ver en Maps
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Equipos ({selectedDeliveryDetails?.equipos?.length || 0})
                      </Typography>
                      {selectedDeliveryDetails?.equipos?.length > 0 ? (
                        <List dense>
                          {selectedDeliveryDetails.equipos.map((equipo: any) => {
                            let estadoAsignacion = equipo.estadoAsignacion;
                            if (!estadoAsignacion) {
                              estadoAsignacion = selectedDelivery.estado === 'ENTREGADA' ? 'ENTREGADO' : 'EN_TRANSITO';
                            }
                            const codigoDisplay = equipo.codigoVenta ?? equipo.numeroHeladera ?? equipo.id;
                            return (
                              <ListItem key={equipo.id} divider>
                                <ListItemText
                                  primary={`#${codigoDisplay} - ${equipo.modelo || 'N/A'}`}
                                  secondary={(() => {
                                    const colorLabel = typeof equipo.color === 'string'
                                      ? equipo.color
                                      : equipo.color?.nombre;
                                    return `${equipo.tipo || ''} ${colorLabel ? `| ${colorLabel}` : ''}`;
                                  })()}
                                />
                                <Chip
                                  label={getEstadoAsignacionLabel(estadoAsignacion)}
                                  size="small"
                                  color={getEstadoAsignacionColor(estadoAsignacion)}
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                          La factura no tiene unidades individuales registradas
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {selectedDelivery.observaciones && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Observaciones</Typography>
                        <Typography variant="body2">{selectedDelivery.observaciones}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Imágenes / Documentos — disponible para todos los estados */}
                <Grid item xs={12}>
                  <EntregaDocumentosCard
                    documentos={entregaDocumentos}
                    loading={loadingDocumentos}
                    adding={addingDocumentos}
                    thumbnails={docThumbnails}
                    onAddClick={() => addDocInputRef.current?.click()}
                    onViewImage={handleViewImage}
                    onDownload={handleDownloadDocumento}
                    onDelete={handleDeleteDocumento}
                  />
                </Grid>
              </Grid>

              {selectedDelivery.estado === 'PENDIENTE' && (
                <Box display="flex" gap={2} mt={3}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => openConfirmDialog(selectedDelivery.id)}
                    fullWidth
                  >
                    Confirmar Entrega
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => openRejectDialog(selectedDelivery.id)}
                    fullWidth
                  >
                    No Entregada
                  </Button>
                </Box>
              )}

              <Box mt={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => { onClose(); }}
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
