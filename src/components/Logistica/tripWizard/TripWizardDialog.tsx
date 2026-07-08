import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  IconButton,
  TextField,
  Chip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Stepper,
  Step,
  StepLabel,
  SwipeableDrawer,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  LocalShipping as TruckIcon,
  Person as DriverIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  KeyboardArrowLeft as BackIcon,
  KeyboardArrowRight as NextIcon,
  ErrorOutline as ErrorOutlineIcon,
  InfoOutlined as InfoOutlinedIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import type { EstadoViaje } from '../../../types';
import { useParametroSistema, parseIntOr } from '../../../hooks/useParametroSistema';
import {
  useResponsive,
  tipoParadaLabel,
  renderVehiculoEstadoChip,
  VEHICULO_ESTADO_LABEL,
  entregaEstimadaInfo as entregaEstimadaInfoBase,
  renderEntregaEstimada as renderEntregaEstimadaBase,
} from './tripWizardShared';
import { BottomSheet } from './TripBottomSheet';
import type { TripWizardController } from './useTripWizard';

// Wizard steps for mobile trip creation
const wizardSteps = ['Información', 'Entregas', 'Confirmar'];

export interface TripWizardDialogProps {
  open: boolean;
  onClose: () => void;
  wizard: TripWizardController;
}

const TripWizardDialog: React.FC<TripWizardDialogProps> = ({ open, onClose, wizard }) => {
  const { isMobile, isTablet } = useResponsive();

  // Días estimados de entrega (parámetro global editable en /admin/settings).
  const { value: diasEntregaEstimada } = useParametroSistema('DIAS_ENTREGA_ESTIMADA', 25, parseIntOr(25));
  const entregaEstimadaInfo = (fechaEmision?: string | null) => entregaEstimadaInfoBase(fechaEmision, diasEntregaEstimada);
  const renderEntregaEstimada = (info: ReturnType<typeof entregaEstimadaInfo>) => renderEntregaEstimadaBase(info, diasEntregaEstimada);

  const {
    formData,
    setFormData,
    tripDeliveries,
    newDelivery,
    setNewDelivery,
    selectedDeliveryFactura,
    setSelectedDeliveryFactura,
    selectedDeliveryOrden,
    setSelectedDeliveryOrden,
    activeStep,
    editingTrip,
    vehicles,
    conductores,
    acompanantes,
    conductoresDisponibles,
    acompanantesDisponibles,
    facturas,
    ordenes,
    deliveries,
    facturasDisponibles,
    isVehicleInUse,
    getTripUsingVehicle,
    getSelectedVehicle,
    getDriverName,
    getAcompananteName,
    getVehicleInfo,
    handleNext,
    handleBack,
    canProceedStep1,
    handleAddDelivery,
    handleRemoveDelivery,
    handleSelectFacturaForDelivery,
    handleSelectVehicle,
    handleSave,
    vehiculoEstadoDialog,
    setVehiculoEstadoDialog,
    vehicleInUseDialogOpen,
    setVehicleInUseDialogOpen,
  } = wizard;

  // Render wizard step content (mobile)
  const renderWizardStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Stack spacing={2.5}>
            <TextField
              label="Destino"
              value={formData.destino}
              onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
              fullWidth
              required
              size="medium"
              placeholder="Ej: Buenos Aires"
              InputProps={{ sx: { minHeight: 56 } }}
            />

            <Autocomplete
              options={conductoresDisponibles}
              getOptionLabel={(driver) => `${driver.nombre} ${driver.apellido}`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={conductoresDisponibles.find(d => d.id.toString() === formData.conductorId) || null}
              onChange={(_, value) => setFormData({ ...formData, conductorId: value?.id.toString() || '' })}
              renderOption={({ key: _key, ...props }, option) => (
                <li key={option.id} {...props}>
                  {`${option.nombre} ${option.apellido}`}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Conductor"
                  size="medium"
                  helperText={conductores.length === 0 ? 'No hay empleados marcados como conductor' : `${conductores.length} conductores`}
                  InputProps={{ ...params.InputProps, sx: { minHeight: 56 } }}
                />
              )}
              noOptionsText="No hay conductores habilitados"
            />

            <Autocomplete
              options={acompanantesDisponibles}
              getOptionLabel={(emp) => `${emp.nombre} ${emp.apellido}`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={acompanantesDisponibles.find(d => d.id.toString() === formData.acompananteId) || null}
              onChange={(_, value) => setFormData({ ...formData, acompananteId: value?.id.toString() || '' })}
              renderOption={({ key: _key, ...props }, option) => (
                <li key={option.id} {...props}>
                  {`${option.nombre} ${option.apellido}`}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Acompañante (opcional)"
                  size="medium"
                  helperText={acompanantes.length === 0 ? 'No hay empleados marcados como acompañante' : `${acompanantes.length} acompañantes`}
                  InputProps={{ ...params.InputProps, sx: { minHeight: 56 } }}
                />
              )}
              noOptionsText="No hay acompañantes habilitados"
            />

            <Autocomplete
              options={vehicles}
              getOptionLabel={(vehicle) => `${vehicle.marca} ${vehicle.modelo} (${vehicle.patente})`}
              value={vehicles.find(v => v.id.toString() === formData.vehiculoId) || null}
              onChange={(_, value) => handleSelectVehicle(value)}
              renderOption={({ key: _key, ...props }, option) => (
                <li key={option.id} {...props}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                    <span>{`${option.marca} ${option.modelo} (${option.patente})`}</span>
                    {renderVehiculoEstadoChip(option.estado)}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Vehículo"
                  size="medium"
                  helperText={vehicles.length === 0 ? 'No hay vehículos cargados' : `${vehicles.length} totales`}
                  InputProps={{ ...params.InputProps, sx: { minHeight: 56 } }}
                />
              )}
              noOptionsText="No hay vehículos"
            />

            {formData.vehiculoId && isVehicleInUse(formData.vehiculoId) && (
              <Box>
                <Button
                  size="small"
                  variant="text"
                  color="warning"
                  onClick={() => setVehicleInUseDialogOpen(true)}
                >
                  Este vehículo está en uso por el Viaje #{getTripUsingVehicle(formData.vehiculoId)?.id}. Ver detalle
                </Button>
              </Box>
            )}

            {formData.vehiculoId &&
              formData.estado === 'PLANIFICADO' &&
              getSelectedVehicle(formData.vehiculoId) &&
              getSelectedVehicle(formData.vehiculoId)!.estado !== 'DISPONIBLE' && (
                <Alert severity="info">
                  Este vehículo está actualmente en uso. Podrás iniciarlo cuando esté disponible.
                </Alert>
              )}

            <TextField
              label="Fecha y Hora"
              type="datetime-local"
              value={formData.fechaViaje}
              onChange={(e) => setFormData({ ...formData, fechaViaje: e.target.value })}
              fullWidth
              required
              size="medium"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { minHeight: 56 } }}
            />

            <TextField
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              fullWidth
              multiline
              rows={3}
              size="medium"
              placeholder="Notas adicionales..."
            />
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Entregas agregadas: {tripDeliveries.length}
            </Typography>

            {tripDeliveries.length > 0 && (
              <Stack spacing={1}>
                {tripDeliveries.map((delivery, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {delivery.direccionEntrega}
                          </Typography>
                          {delivery.factura && (
                            <Chip
                              label={delivery.factura.numeroDocumento}
                              size="small"
                              color="primary"
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
                          {delivery.observaciones && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              📝 {delivery.observaciones}
                            </Typography>
                          )}
                        </Box>
                        {!delivery.id && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveDelivery(index)}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            <Divider />

            <Typography variant="subtitle2">Agregar nueva entrega</Typography>

            <ToggleButtonGroup
              value={newDelivery.tipoEntrega}
              exclusive
              onChange={(_, value) => {
                if (value) {
                  setNewDelivery({
                    ...newDelivery,
                    tipoEntrega: value,
                    facturaId: '',
                    ordenServicioId: '',
                  });
                  setSelectedDeliveryFactura(null);
                  setSelectedDeliveryOrden(null);
                }
              }}
              fullWidth
            >
              <ToggleButton value="FACTURA" sx={{ flex: 1 }}>
                Factura
              </ToggleButton>
              <ToggleButton value="ORDEN_SERVICIO" sx={{ flex: 1 }}>
                Orden de Servicio
              </ToggleButton>
              <ToggleButton value="PARADA_LIBRE" sx={{ flex: 1 }}>
                Otra parada
              </ToggleButton>
            </ToggleButtonGroup>

            {newDelivery.tipoEntrega === 'PARADA_LIBRE' ? (
              <TextField
                select
                label="Motivo de la parada"
                value={newDelivery.tipoParada}
                onChange={(e) => setNewDelivery({ ...newDelivery, tipoParada: e.target.value as typeof newDelivery.tipoParada })}
                fullWidth
                size="medium"
                helperText="Parada sin factura ni orden de servicio (ej. garantía, retiro de materia prima)."
                InputProps={{ sx: { minHeight: 56 } }}
              >
                <MenuItem value="GARANTIA">Garantía</MenuItem>
                <MenuItem value="RETIRO_MATERIA_PRIMA">Retiro de materia prima</MenuItem>
                <MenuItem value="OTRO">Otra parada</MenuItem>
              </TextField>
            ) : newDelivery.tipoEntrega === 'FACTURA' ? (
              <>
                <Autocomplete
                  options={facturasDisponibles}
                  getOptionLabel={(factura) => `${factura.numeroDocumento} - ${factura.clienteNombre}`}
                  value={facturas.find(f => f.id.toString() === newDelivery.facturaId) || null}
                  onChange={(_, value) => { void handleSelectFacturaForDelivery(value); }}
                  renderOption={({ key, ...props }, factura) => {
                    const info = entregaEstimadaInfo(factura.fechaEmision ?? (factura as any).fecha);
                    return (
                      <li key={key} {...props}>
                        <Box sx={{ py: 0.5 }}>
                          <Typography variant="body2" fontWeight="600">
                            {factura.numeroDocumento} — {factura.clienteNombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(factura as any).clienteCiudad ? `📍 ${(factura as any).clienteCiudad}  ·  ` : ''}
                            ${factura.total.toLocaleString()}
                            {info && (
                              <Box component="span" sx={{ ml: 1, color: info.restantes < 0 ? 'error.main' : info.restantes <= 5 ? 'warning.main' : 'info.main', fontWeight: 600 }}>
                                {info.restantes >= 0 ? `⏱ ${info.restantes}d` : `⚠ ${Math.abs(info.restantes)}d atraso`}
                              </Box>
                            )}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Factura"
                      size="medium"
                      placeholder="Buscar factura..."
                      InputProps={{ ...params.InputProps, sx: { minHeight: 56 } }}
                    />
                  )}
                  noOptionsText="No hay facturas"
                />

                {selectedDeliveryFactura && (
                  <Alert severity="info" sx={{ py: 1 }}>
                    <Typography variant="caption" fontWeight="bold">
                      {selectedDeliveryFactura.clienteNombre}
                      {(selectedDeliveryFactura as any).clienteCiudad && (
                        <Box component="span" sx={{ ml: 1, fontWeight: 400, color: 'text.secondary' }}>
                          📍 {(selectedDeliveryFactura as any).clienteCiudad}
                        </Box>
                      )}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Total: ${selectedDeliveryFactura.total.toLocaleString()} | {selectedDeliveryFactura.detalles.length} items
                    </Typography>
                    {renderEntregaEstimada(entregaEstimadaInfo(selectedDeliveryFactura.fechaEmision ?? (selectedDeliveryFactura as any).fecha))}
                  </Alert>
                )}
              </>
            ) : (
              <>
                <Autocomplete
                  options={ordenes.filter(o => !deliveries.some(d => (d as any).ordenServicioId === o.id))}
                  getOptionLabel={(orden) => `${orden.numeroOrden} - ${orden.clienteNombre || 'Sin cliente'}`}
                  value={ordenes.find(o => o.id.toString() === newDelivery.ordenServicioId) || null}
                  onChange={(_, value) => {
                    if (value) {
                      setNewDelivery({
                        ...newDelivery,
                        ordenServicioId: value.id.toString(),
                      });
                      setSelectedDeliveryOrden(value);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Orden de Servicio"
                      size="medium"
                      placeholder="Buscar orden..."
                      InputProps={{ ...params.InputProps, sx: { minHeight: 56 } }}
                    />
                  )}
                  noOptionsText="No hay órdenes FINALIZADA disponibles"
                />

                {selectedDeliveryOrden && (
                  <Alert severity="info" sx={{ py: 1 }}>
                    <Typography variant="caption" fontWeight="bold">
                      {selectedDeliveryOrden.clienteNombre}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {selectedDeliveryOrden.numeroOrden}
                    </Typography>
                  </Alert>
                )}
              </>
            )}

            <TextField
              label="Dirección de Entrega"
              value={newDelivery.direccionEntrega}
              onChange={(e) => setNewDelivery({ ...newDelivery, direccionEntrega: e.target.value })}
              fullWidth
              size="medium"
              placeholder="Calle 123, Ciudad"
              helperText="Se autocompleta con la dirección del cliente al elegir la factura. Editable."
              InputProps={{ sx: { minHeight: 56 } }}
            />

            <TextField
              label="Observaciones de entrega (opcional)"
              value={newDelivery.observaciones}
              onChange={(e) => setNewDelivery({ ...newDelivery, observaciones: e.target.value })}
              fullWidth
              size="medium"
              multiline
              rows={2}
              placeholder="Notas para esta entrega..."
            />

            <TextField
              label="Fecha Programada"
              type="datetime-local"
              value={newDelivery.fechaProgramada}
              onChange={(e) => setNewDelivery({ ...newDelivery, fechaProgramada: e.target.value })}
              fullWidth
              size="medium"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { minHeight: 56 } }}
            />

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddDelivery}
              fullWidth
              sx={{ minHeight: 48 }}
            >
              Agregar Entrega
            </Button>
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={2}>
            <Typography variant="h6">Resumen del Viaje</Typography>

            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Destino:</strong> {formData.destino}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <DriverIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Conductor:</strong> {getDriverName(formData.conductorId ? parseInt(formData.conductorId) : null)}
                    </Typography>
                  </Box>

                  {formData.acompananteId && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <DriverIcon color="action" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Acompañante:</strong> {getAcompananteName(parseInt(formData.acompananteId))}
                      </Typography>
                    </Box>
                  )}

                  <Box display="flex" alignItems="center" gap={1}>
                    <TruckIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Vehículo:</strong> {getVehicleInfo(formData.vehiculoId ? parseInt(formData.vehiculoId) : null)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <ScheduleIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Fecha:</strong> {formData.fechaViaje ? new Date(formData.fechaViaje).toLocaleString() : 'No definida'}
                    </Typography>
                  </Box>

                  <Divider />

                  <Typography variant="body2">
                    <strong>Entregas:</strong> {tripDeliveries.length}
                  </Typography>

                  {tripDeliveries.map((delivery, idx) => (
                    <Typography key={idx} variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                      • {delivery.direccionEntrega}
                      {delivery.factura && ` (${delivery.factura.numeroDocumento})`}
                    </Typography>
                  ))}

                  {formData.observaciones && (
                    <>
                      <Divider />
                      <Typography variant="body2">
                        <strong>Notas:</strong> {formData.observaciones}
                      </Typography>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile Bottom Sheet for Create/Edit */}
      {isMobile && (
        <BottomSheet
          open={open}
          onClose={onClose}
          title={editingTrip ? 'Editar Viaje' : 'Nuevo Viaje'}
          actions={
            <Stack spacing={1.5}>
              {/* Stepper */}
              <Stepper activeStep={activeStep} alternativeLabel>
                {wizardSteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Navigation buttons */}
              <Box display="flex" gap={1}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  startIcon={<BackIcon />}
                  sx={{ flex: 1, minHeight: 48 }}
                >
                  Atrás
                </Button>

                {activeStep < wizardSteps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<NextIcon />}
                    disabled={activeStep === 0 && !canProceedStep1()}
                    sx={{ flex: 1, minHeight: 48 }}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSave}
                    sx={{ flex: 1, minHeight: 48 }}
                  >
                    {editingTrip ? 'Actualizar' : 'Crear Viaje'}
                  </Button>
                )}
              </Box>
            </Stack>
          }
        >
          {renderWizardStep()}
        </BottomSheet>
      )}

      {/* Desktop Dialog for Create/Edit */}
      {!isMobile && (
        <SwipeableDrawer
          anchor="right"
          open={open}
          onClose={onClose}
          onOpen={() => {}}
          PaperProps={{
            sx: { width: isTablet ? '80%' : 500 }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                {editingTrip ? 'Editar Viaje' : 'Nuevo Viaje'}
              </Typography>
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack spacing={2.5}>
              <TextField
                label="Destino"
                value={formData.destino}
                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                fullWidth
                required
              />

              <Autocomplete
                options={conductoresDisponibles}
                getOptionLabel={(driver) => `${driver.nombre} ${driver.apellido}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                value={conductoresDisponibles.find(d => d.id.toString() === formData.conductorId) || null}
                onChange={(_, value) => setFormData({ ...formData, conductorId: value?.id.toString() || '' })}
                renderOption={({ key: _key, ...props }, option) => (
                  <li key={option.id} {...props}>
                    {`${option.nombre} ${option.apellido}`}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Conductor"
                    helperText={conductores.length === 0 ? 'No hay empleados marcados como conductor' : undefined} />
                )}
                noOptionsText="No hay conductores habilitados"
              />

              <Autocomplete
                options={acompanantesDisponibles}
                getOptionLabel={(emp) => `${emp.nombre} ${emp.apellido}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                value={acompanantesDisponibles.find(d => d.id.toString() === formData.acompananteId) || null}
                onChange={(_, value) => setFormData({ ...formData, acompananteId: value?.id.toString() || '' })}
                renderOption={({ key: _key, ...props }, option) => (
                  <li key={option.id} {...props}>
                    {`${option.nombre} ${option.apellido}`}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Acompañante (opcional)"
                    helperText={acompanantes.length === 0 ? 'No hay empleados marcados como acompañante' : undefined} />
                )}
                noOptionsText="No hay acompañantes habilitados"
              />

              <Autocomplete
                options={vehicles}
                getOptionLabel={(vehicle) => `${vehicle.marca} ${vehicle.modelo} (${vehicle.patente})`}
                value={vehicles.find(v => v.id.toString() === formData.vehiculoId) || null}
                onChange={(_, value) => handleSelectVehicle(value)}
                renderOption={({ key: _key, ...props }, option) => (
                  <li key={option.id} {...props}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                      <span>{`${option.marca} ${option.modelo} (${option.patente})`}</span>
                      {renderVehiculoEstadoChip(option.estado)}
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Vehículo" />
                )}
              />

              {formData.vehiculoId &&
                formData.estado === 'PLANIFICADO' &&
                getSelectedVehicle(formData.vehiculoId) &&
                getSelectedVehicle(formData.vehiculoId)!.estado !== 'DISPONIBLE' && (
                  <Alert severity="info">
                    Este vehículo está actualmente en uso. Podrás iniciarlo cuando esté disponible.
                  </Alert>
                )}

              <TextField
                label="Fecha y Hora"
                type="datetime-local"
                value={formData.fechaViaje}
                onChange={(e) => setFormData({ ...formData, fechaViaje: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />

              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  label="Estado"
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoViaje })}
                >
                  <MenuItem value="PLANIFICADO">Planificado</MenuItem>
                  <MenuItem value="EN_CURSO">En Ruta</MenuItem>
                  <MenuItem value="COMPLETADO">Completado</MenuItem>
                  <MenuItem value="CANCELADO">Cancelado</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />

              <Divider />

              {/* Deliveries section */}
              <Typography variant="subtitle1" fontWeight="bold">
                Entregas ({tripDeliveries.length})
              </Typography>

              {tripDeliveries.map((delivery, index) => (
                <Card key={index} variant="outlined">
                  <CardContent sx={{ py: 1, px: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="body2">{delivery.direccionEntrega}</Typography>
                        {delivery.factura && (
                          <Chip
                            label={delivery.factura.numeroDocumento}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                        {(delivery as any).ordenServicio && (
                          <Chip
                            label={(delivery as any).ordenServicio.numeroOrden}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                        {delivery.observaciones && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            📝 {delivery.observaciones}
                          </Typography>
                        )}
                      </Box>
                      {!delivery.id && (
                        <IconButton size="small" onClick={() => handleRemoveDelivery(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}

              <ToggleButtonGroup
                value={newDelivery.tipoEntrega}
                exclusive
                onChange={(_, value) => {
                  if (value) {
                    setNewDelivery({
                      ...newDelivery,
                      tipoEntrega: value,
                      facturaId: '',
                      ordenServicioId: '',
                    });
                  }
                }}
                fullWidth
                size="small"
              >
                <ToggleButton value="FACTURA" sx={{ flex: 1 }}>
                  Factura
                </ToggleButton>
                <ToggleButton value="ORDEN_SERVICIO" sx={{ flex: 1 }}>
                  Orden de Servicio
                </ToggleButton>
                <ToggleButton value="PARADA_LIBRE" sx={{ flex: 1 }}>
                  Otra parada
                </ToggleButton>
              </ToggleButtonGroup>

              {newDelivery.tipoEntrega === 'PARADA_LIBRE' ? (
                <TextField
                  select
                  label="Motivo de la parada"
                  value={newDelivery.tipoParada}
                  onChange={(e) => setNewDelivery({ ...newDelivery, tipoParada: e.target.value as typeof newDelivery.tipoParada })}
                  fullWidth
                  size="small"
                  helperText="Parada sin factura ni orden de servicio (garantía, retiro de MP)."
                >
                  <MenuItem value="GARANTIA">Garantía</MenuItem>
                  <MenuItem value="RETIRO_MATERIA_PRIMA">Retiro de materia prima</MenuItem>
                  <MenuItem value="OTRO">Otra parada</MenuItem>
                </TextField>
              ) : newDelivery.tipoEntrega === 'FACTURA' ? (
                <Autocomplete
                  options={facturasDisponibles}
                  getOptionLabel={(factura) => `${factura.numeroDocumento} - ${factura.clienteNombre}`}
                  value={facturas.find(f => f.id.toString() === newDelivery.facturaId) || null}
                  onChange={(_, value) => { void handleSelectFacturaForDelivery(value); }}
                  renderOption={({ key, ...props }, factura) => {
                    const info = entregaEstimadaInfo(factura.fechaEmision ?? (factura as any).fecha);
                    return (
                      <li key={key} {...props}>
                        <Box sx={{ py: 0.25 }}>
                          <Typography variant="body2" fontWeight="600">
                            {factura.numeroDocumento} — {factura.clienteNombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(factura as any).clienteCiudad ? `📍 ${(factura as any).clienteCiudad}  ·  ` : ''}
                            ${factura.total.toLocaleString()}
                            {info && (
                              <Box component="span" sx={{ ml: 1, color: info.restantes < 0 ? 'error.main' : info.restantes <= 5 ? 'warning.main' : 'info.main', fontWeight: 600 }}>
                                {info.restantes >= 0 ? `⏱ ${info.restantes}d` : `⚠ ${Math.abs(info.restantes)}d atraso`}
                              </Box>
                            )}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Factura" size="small" />
                  )}
                />
              ) : (
                <Autocomplete
                  options={ordenes.filter(o => !deliveries.some(d => (d as any).ordenServicioId === o.id) && !tripDeliveries.some(d => (d as any).ordenServicioId === o.id))}
                  getOptionLabel={(orden) => `${orden.numeroOrden} - ${orden.clienteNombre || 'Sin cliente'}`}
                  value={ordenes.find(o => o.id.toString() === newDelivery.ordenServicioId) || null}
                  onChange={(_, value) => {
                    if (value) {
                      setNewDelivery({
                        ...newDelivery,
                        ordenServicioId: value.id.toString(),
                      });
                      setSelectedDeliveryOrden(value);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Orden de Servicio"
                      size="small"
                      placeholder="Buscar orden..."
                    />
                  )}
                  noOptionsText="No hay órdenes FINALIZADA disponibles"
                />
              )}

              <TextField
                label="Dirección de Entrega"
                value={newDelivery.direccionEntrega}
                onChange={(e) => setNewDelivery({ ...newDelivery, direccionEntrega: e.target.value })}
                fullWidth
                size="small"
                placeholder="Calle 123, Ciudad"
                helperText="Se autocompleta con la dirección del cliente al elegir la factura. Editable."
              />

              <TextField
                label="Observaciones de entrega (opcional)"
                value={newDelivery.observaciones}
                onChange={(e) => setNewDelivery({ ...newDelivery, observaciones: e.target.value })}
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="Notas para esta entrega..."
              />

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddDelivery}
              >
                Agregar Entrega
              </Button>

              <Divider />

              <Box display="flex" gap={2}>
                <Button
                  onClick={onClose}
                  sx={{ flex: 1 }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  sx={{ flex: 1 }}
                >
                  {editingTrip ? 'Actualizar' : 'Crear'}
                </Button>
              </Box>
            </Stack>
          </Box>
        </SwipeableDrawer>
      )}

      {/* Modal: vehículo seleccionado no está DISPONIBLE */}
      <Dialog
        open={vehiculoEstadoDialog.open}
        onClose={() => setVehiculoEstadoDialog(prev => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {vehiculoEstadoDialog.severity === 'error'
              ? <ErrorOutlineIcon sx={{ fontSize: 40, color: 'error.main' }} />
              : <InfoOutlinedIcon sx={{ fontSize: 40, color: 'info.main' }} />}
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {vehiculoEstadoDialog.severity === 'error'
                  ? 'Vehículo no disponible'
                  : 'Vehículo en uso'}
              </Typography>
              {vehiculoEstadoDialog.vehiculo && (
                <Typography variant="caption" color="text.secondary">
                  {vehiculoEstadoDialog.vehiculo.marca} {vehiculoEstadoDialog.vehiculo.modelo} ({vehiculoEstadoDialog.vehiculo.patente})
                </Typography>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {vehiculoEstadoDialog.severity === 'error'
              ? `El vehículo está ${VEHICULO_ESTADO_LABEL[vehiculoEstadoDialog.vehiculo?.estado || ''] || vehiculoEstadoDialog.vehiculo?.estado}. No se puede iniciar un viaje con un vehículo que no esté DISPONIBLE.`
              : 'Este vehículo está en uso actualmente. Podés planificar el viaje, y podrá salir cuando esté libre.'}
          </Typography>
          {vehiculoEstadoDialog.vehiculo?.estado && (
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">Estado actual: </Typography>
              {renderVehiculoEstadoChip(vehiculoEstadoDialog.vehiculo.estado)}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            color={vehiculoEstadoDialog.severity === 'error' ? 'error' : 'primary'}
            fullWidth
            onClick={() => setVehiculoEstadoDialog(prev => ({ ...prev, open: false }))}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: vehículo en uso por otro viaje */}
      <Dialog
        open={vehicleInUseDialogOpen}
        onClose={() => setVehicleInUseDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <WarningAmberIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            <Typography variant="h6" fontWeight={600}>Vehículo ya asignado</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {(() => {
            const tripUsing = getTripUsingVehicle(formData.vehiculoId);
            return (
              <Typography variant="body2">
                Este vehículo está actualmente asignado al
                {' '}<strong>Viaje #{tripUsing?.id}</strong>
                {tripUsing?.destino ? ` (destino: ${tripUsing.destino})` : ''}.
                {' '}Podés planificar este viaje y saldrá cuando el vehículo quede libre.
              </Typography>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setVehicleInUseDialogOpen(false)}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TripWizardDialog;
