import { useEffect, useMemo, useState } from 'react';
import type {
  Viaje,
  Vehiculo,
  Empleado,
  EntregaViaje,
  EstadoViaje,
  EstadoEntrega,
  DocumentoComercial,
  Cliente,
  OrdenServicio,
} from '../../../types';
import { viajeApi } from '../../../api/services/viajeApi';
import { vehiculoApi } from '../../../api/services/vehiculoApi';
import { employeeApi } from '../../../api/services/employeeApi';
import { entregaViajeApi } from '../../../api/services/entregaViajeApi';
import { documentoApi } from '../../../api/services/documentoApi';
import { clienteApi } from '../../../api/services/clienteApi';
import { ordenServicioApi } from '../../../api/services/ordenServicioApi';
import { buildDireccionFromCliente, tipoParadaLabel } from './tripWizardShared';

// ── Tipos públicos ────────────────────────────────────────────────────────────
export type TripWizardFormData = {
  fechaViaje: string;
  destino: string;
  conductorId: string;
  acompananteId: string;
  vehiculoId: string;
  facturaId: string;
  estado: EstadoViaje;
  observaciones: string;
};

// Estado de una entrega dentro del formulario del viaje (nueva o ya persistida).
export type DeliveryFormState = Partial<EntregaViaje> & {
  fechaProgramada?: string;
  facturaId?: number;
  factura?: DocumentoComercial;
};

export type NewDeliveryState = {
  tipoEntrega: 'FACTURA' | 'ORDEN_SERVICIO' | 'PARADA_LIBRE';
  direccionEntrega: string;
  fechaProgramada: string;
  observaciones: string;
  facturaId: string;
  ordenServicioId: string;
  tipoParada: 'GARANTIA' | 'RETIRO_MATERIA_PRIMA' | 'OTRO';
};

export type VehiculoEstadoDialogState = {
  open: boolean;
  vehiculo: Vehiculo | null;
  severity: 'info' | 'error';
};

// Precarga de entregas para el tablero de armado (viaje nuevo con entregas ya elegidas).
export type DeliveryPrefill = {
  tipoEntrega: 'FACTURA' | 'ORDEN_SERVICIO';
  facturaId?: number;
  ordenServicioId?: number;
  direccionEntrega: string;
  observaciones?: string;
  fechaProgramada?: string;
};

// Catálogos que el consumidor puede inyectar (ya cargados) para evitar refetch.
// Cualquier catálogo ausente lo carga el hook con las mismas APIs que TripsPage.
export interface TripWizardCatalogos {
  vehiculos?: Vehiculo[];
  drivers?: Empleado[]; // lista completa de empleados; el hook deriva conductores/acompañantes
  facturas?: DocumentoComercial[];
  ordenes?: OrdenServicio[];
  clientes?: Cliente[];
  deliveries?: EntregaViaje[]; // entregas ya persistidas (para facturasDisponibles y filtro de órdenes)
  trips?: Viaje[]; // viajes existentes (para detectar vehículo en uso)
}

export interface UseTripWizardOptions {
  /** Viaje en edición inicial. Normalmente se maneja con startEdit(); sirve como semilla. */
  editingTrip?: Viaje | null;
  /** Entregas a precargar al crear un viaje nuevo (tablero de armado). */
  initialDeliveries?: DeliveryPrefill[];
  /** Se llama al guardar con éxito. entregaErrors: fallos al crear entregas individuales. */
  onSaved: (viaje: Viaje, entregaErrors: string[]) => void;
  /** Reporta errores de validación/guardado (equivalente al setError de TripsPage). */
  onError?: (message: string) => void;
  /**
   * Permite quitar entregas YA persistidas desde el wizard en modo edición
   * (ADMIN / COORDINADORA_LOGISTICA). Las nuevas siempre se pueden quitar.
   */
  canEditPersisted?: boolean;
  catalogos?: TripWizardCatalogos;
}

const EMPTY_FORM_DATA: TripWizardFormData = {
  fechaViaje: '',
  destino: '',
  conductorId: '',
  acompananteId: '',
  vehiculoId: '',
  facturaId: '',
  estado: 'PLANIFICADO',
  observaciones: '',
};

const EMPTY_NEW_DELIVERY: NewDeliveryState = {
  tipoEntrega: 'FACTURA',
  direccionEntrega: '',
  fechaProgramada: '',
  observaciones: '',
  facturaId: '',
  ordenServicioId: '',
  tipoParada: 'GARANTIA',
};

export function useTripWizard(opts: UseTripWizardOptions) {
  const { onSaved } = opts;
  const cat = opts.catalogos;
  const onError = opts.onError ?? (() => {});

  // ── Estado del formulario ──────────────────────────────────────────────────
  const [editingTrip, setEditingTrip] = useState<Viaje | null>(opts.editingTrip ?? null);
  const [formData, setFormData] = useState<TripWizardFormData>({ ...EMPTY_FORM_DATA });
  const [tripDeliveries, setTripDeliveries] = useState<DeliveryFormState[]>([]);
  // Entregas persistidas quitadas en el form: se borran del server recién al guardar
  // (Cancelar no llama al backend).
  const [removedPersistedIds, setRemovedPersistedIds] = useState<number[]>([]);
  // true cuando el usuario reordenó las paradas (drag / flechas): al guardar se
  // persiste el nuevo orden vía viajeApi.reordenarEntregas.
  const [orderDirty, setOrderDirty] = useState(false);
  const [newDelivery, setNewDelivery] = useState<NewDeliveryState>({ ...EMPTY_NEW_DELIVERY });
  const [selectedDeliveryFactura, setSelectedDeliveryFactura] = useState<DocumentoComercial | null>(null);
  const [selectedDeliveryOrden, setSelectedDeliveryOrden] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Modal de aviso al seleccionar vehículo no DISPONIBLE
  const [vehiculoEstadoDialog, setVehiculoEstadoDialog] = useState<VehiculoEstadoDialogState>({
    open: false,
    vehiculo: null,
    severity: 'info',
  });
  // Modal "vehículo ya en uso por otro viaje"
  const [vehicleInUseDialogOpen, setVehicleInUseDialogOpen] = useState(false);

  // ── Catálogos (inyectados o cargados por el hook) ──────────────────────────
  const [loadedVehiculos, setLoadedVehiculos] = useState<Vehiculo[]>([]);
  const [loadedDrivers, setLoadedDrivers] = useState<Empleado[]>([]);
  const [loadedFacturas, setLoadedFacturas] = useState<DocumentoComercial[]>([]);
  const [loadedOrdenes, setLoadedOrdenes] = useState<OrdenServicio[]>([]);
  const [loadedClientes, setLoadedClientes] = useState<Cliente[]>([]);
  const [loadedDeliveries, setLoadedDeliveries] = useState<EntregaViaje[]>([]);
  const [loadedTrips, setLoadedTrips] = useState<Viaje[]>([]);
  // Clientes traídos on-demand (cache al elegir factura) sin tocar la lista del consumidor.
  const [clientesExtra, setClientesExtra] = useState<Cliente[]>([]);

  const vehicles = cat?.vehiculos ?? loadedVehiculos;
  const drivers = cat?.drivers ?? loadedDrivers;
  const facturas = cat?.facturas ?? loadedFacturas;
  const ordenes = cat?.ordenes ?? loadedOrdenes;
  const deliveries = cat?.deliveries ?? loadedDeliveries;
  const trips = cat?.trips ?? loadedTrips;
  const clientesBase = cat?.clientes ?? loadedClientes;
  const clientes = useMemo(
    () =>
      clientesExtra.length === 0
        ? clientesBase
        : [...clientesBase, ...clientesExtra.filter(c => !clientesBase.some(b => b.id === c.id))],
    [clientesBase, clientesExtra],
  );

  // Carga los catálogos que NO fueron inyectados (caso tablero: sin catálogos).
  // Cuando el consumidor los provee (TripsPage), este efecto no dispara ningún fetch.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!cat?.vehiculos) {
        try {
          const r = await vehiculoApi.getAll({ page: 0, size: 1000 });
          const data = Array.isArray(r) ? r : ((r as any).content || []);
          if (!cancelled) setLoadedVehiculos(Array.isArray(data) ? data : []);
        } catch { /* noop */ }
      }
      if (!cat?.drivers) {
        try {
          const data = await employeeApi.getAllList();
          if (!cancelled) setLoadedDrivers(Array.isArray(data) ? data : []);
        } catch { /* noop */ }
      }
      if (!cat?.facturas) {
        try {
          let data = await documentoApi.getByTipo('FACTURA');
          data = data.filter(f => f.numeroDocumento?.startsWith('FAC-'));
          if (!cancelled) setLoadedFacturas(Array.isArray(data) ? data : []);
        } catch { /* noop */ }
      }
      if (!cat?.ordenes) {
        try {
          const data = await ordenServicioApi.getByEstado('FINALIZADA');
          if (!cancelled) setLoadedOrdenes(Array.isArray(data) ? data : []);
        } catch { /* noop */ }
      }
      if (!cat?.clientes) {
        try {
          const r = await clienteApi.getAll({ page: 0, size: 1000 });
          const data = Array.isArray(r) ? r : ((r as any).content || []);
          if (!cancelled) setLoadedClientes(Array.isArray(data) ? data : []);
        } catch { /* noop */ }
      }
      if (!cat?.deliveries) {
        try {
          const data = await entregaViajeApi.getAll();
          if (!cancelled) setLoadedDeliveries(Array.isArray(data) ? data : []);
        } catch { /* noop */ }
      }
      if (!cat?.trips) {
        try {
          const r = await viajeApi.getAll({ page: 0, size: 1000, sort: 'id,desc' });
          if (!cancelled) setLoadedTrips(r.content || []);
        } catch { /* noop */ }
      }
    };
    void load();
    return () => { cancelled = true; };
    // Carga única al montar; los catálogos inyectados se leen en vivo arriba.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derivados ──────────────────────────────────────────────────────────────
  // Listas filtradas por rol de transporte. `drivers` mantiene TODOS los
  // empleados (para resolver nombres en la grilla); los selectores de viaje
  // muestran sólo los habilitados como conductor / acompañante.
  const conductores = useMemo(() => drivers.filter(d => d.esConductor), [drivers]);
  const acompanantes = useMemo(() => drivers.filter(d => d.esAcompanante), [drivers]);

  // Un empleado no puede ser conductor y acompañante del mismo viaje: cada
  // selector excluye al ya elegido en el otro.
  const conductoresDisponibles = useMemo(
    () => conductores.filter(d => d.id.toString() !== formData.acompananteId),
    [conductores, formData.acompananteId],
  );
  const acompanantesDisponibles = useMemo(
    () => acompanantes.filter(d => d.id.toString() !== formData.conductorId),
    [acompanantes, formData.conductorId],
  );

  // Facturas ya asignadas a alguna entrega (excluir las del viaje en edición)
  const facturasAsignadasIds = new Set(
    deliveries
      .filter(d => !editingTrip || d.viajeId !== editingTrip.id)
      .map(d => (d as any).documentoComercialId ?? (d as any).documentoComercial?.id ?? (d as any).ventaId)
      .filter((id): id is number => id != null)
  );
  // También excluir las ya agregadas en el form actual
  const facturasEnFormIds = new Set(
    tripDeliveries.map(d => d.facturaId).filter((id): id is number => id != null)
  );
  const facturasDisponibles = facturas.filter(
    f => !facturasAsignadasIds.has(f.id) && !facturasEnFormIds.has(f.id)
  );

  // ── Helpers de catálogo ────────────────────────────────────────────────────
  const isVehicleInUse = (vehicleId: string): boolean => {
    return trips.some(trip =>
      trip.vehiculoId?.toString() === vehicleId &&
      trip.estado === 'EN_CURSO'
    );
  };

  const getTripUsingVehicle = (vehicleId: string): Viaje | undefined => {
    return trips.find(trip =>
      trip.vehiculoId?.toString() === vehicleId &&
      trip.estado === 'EN_CURSO'
    );
  };

  const getSelectedVehicle = (vehicleId: string): Vehiculo | undefined =>
    vehicles.find(v => v.id.toString() === vehicleId);

  const getDriverName = (driverId: number | null | undefined) => {
    if (driverId == null) return 'Sin asignar';
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.nombre} ${driver.apellido}` : 'N/A';
  };

  const getAcompananteName = (id: number | null | undefined) => {
    if (id == null) return null;
    const emp = drivers.find(d => d.id === id);
    return emp ? `${emp.nombre} ${emp.apellido}` : null;
  };

  const getVehicleInfo = (vehicleId: number | null | undefined) => {
    if (vehicleId == null) return 'Sin asignar';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.patente})` : 'N/A';
  };

  // ── Selección de factura para una entrega ──────────────────────────────────
  // Autocompleta dirección (direccion + ciudad del cliente). Si el cliente no
  // está en el cache local, lo trae por API. El campo queda editable.
  const handleSelectFacturaForDelivery = async (factura: DocumentoComercial | null) => {
    setSelectedDeliveryFactura(factura);

    if (!factura) {
      setNewDelivery(prev => ({ ...prev, facturaId: '', direccionEntrega: '', tipoEntrega: 'FACTURA', ordenServicioId: '' }));
      return;
    }

    const facturaIdStr = factura.id.toString();
    let cliente = factura.clienteId
      ? clientes.find(c => c.id === factura.clienteId)
      : undefined;

    // Pre-fill con lo que tengamos en cache (puede ser "")
    setNewDelivery(prev => ({
      ...prev,
      facturaId: facturaIdStr,
      direccionEntrega: buildDireccionFromCliente(cliente),
    }));

    // Si no hay cliente en cache, traerlo por API y completar la dirección.
    if (!cliente && factura.clienteId) {
      try {
        const fetched = await clienteApi.getById(factura.clienteId);
        cliente = fetched;
        // Cachearlo para próximas selecciones
        setClientesExtra(prev => (prev.some(c => c.id === fetched.id) ? prev : [...prev, fetched]));
        // Solo sobrescribir si el usuario no editó manualmente todavía.
        setNewDelivery(prev =>
          prev.facturaId === facturaIdStr && !prev.direccionEntrega
            ? { ...prev, direccionEntrega: buildDireccionFromCliente(fetched) }
            : prev
        );
      } catch {
        // si falla, dejamos el campo vacío para que el usuario lo escriba.
      }
    }
  };

  // Selecciona un vehículo. Para PLANIFICADO se muestra un Alert info inline
  // bajo el selector; para EN_CURSO con vehículo no DISPONIBLE se mantiene el
  // dialog de error bloqueante.
  const handleSelectVehicle = (vehiculo: Vehiculo | null) => {
    setFormData(prev => ({ ...prev, vehiculoId: vehiculo?.id.toString() || '' }));
    if (vehiculo && vehiculo.estado !== 'DISPONIBLE' && formData.estado === 'EN_CURSO') {
      setVehiculoEstadoDialog({
        open: true,
        vehiculo,
        severity: 'error',
      });
    }
  };

  // ── Entregas del formulario ────────────────────────────────────────────────
  const handleAddDelivery = () => {
    if (!newDelivery.direccionEntrega) {
      onError('Debe ingresar una dirección de entrega');
      return;
    }

    if (newDelivery.tipoEntrega === 'FACTURA' && !newDelivery.facturaId) {
      onError('Debe seleccionar una factura');
      return;
    }

    if (newDelivery.tipoEntrega === 'ORDEN_SERVICIO' && !newDelivery.ordenServicioId) {
      onError('Debe seleccionar una orden de servicio');
      return;
    }

    if (newDelivery.tipoEntrega === 'PARADA_LIBRE' && !newDelivery.tipoParada) {
      onError('Debe seleccionar el motivo de la parada');
      return;
    }

    const delivery: any = {
      direccionEntrega: newDelivery.direccionEntrega,
      fechaProgramada: newDelivery.fechaProgramada || formData.fechaViaje,
      observaciones: newDelivery.observaciones,
      estado: 'PENDIENTE',
    };

    if (newDelivery.tipoEntrega === 'FACTURA') {
      delivery.facturaId = newDelivery.facturaId ? parseInt(newDelivery.facturaId) : undefined;
      delivery.factura = selectedDeliveryFactura || undefined;
    } else if (newDelivery.tipoEntrega === 'ORDEN_SERVICIO') {
      delivery.ordenServicioId = newDelivery.ordenServicioId ? parseInt(newDelivery.ordenServicioId) : undefined;
      delivery.ordenServicio = selectedDeliveryOrden || undefined;
    } else {
      // Parada libre: sin factura ni OS, sólo motivo
      delivery.tipoParada = newDelivery.tipoParada;
    }

    setTripDeliveries([...tripDeliveries, delivery]);

    setNewDelivery({ ...EMPTY_NEW_DELIVERY });
    setSelectedDeliveryFactura(null);
    setSelectedDeliveryOrden(null);
  };

  /**
   * ¿Se puede quitar esta entrega desde el form? Las no persistidas siempre;
   * las persistidas sólo con permiso, entrega PENDIENTE y viaje PLANIFICADO o
   * EN_CURSO (espejo de assertEntregaEditable del backend).
   */
  const canRemoveDelivery = (delivery: DeliveryFormState): boolean => {
    if (!delivery.id) return true;
    if (!opts.canEditPersisted) return false;
    const viajeEditable = !editingTrip
      || editingTrip.estado === 'PLANIFICADO'
      || editingTrip.estado === 'EN_CURSO';
    return viajeEditable && delivery.estado === 'PENDIENTE';
  };

  const handleRemoveDelivery = (index: number) => {
    const delivery = tripDeliveries[index];
    if (!delivery) return;
    if (!canRemoveDelivery(delivery)) {
      onError('Solo se pueden quitar entregas pendientes de un viaje planificado o en curso.');
      return;
    }
    if (delivery.id) {
      setRemovedPersistedIds(prev => [...prev, delivery.id as number]);
    }
    setTripDeliveries(tripDeliveries.filter((_, i) => i !== index));
  };

  // ── Reorden de paradas ─────────────────────────────────────────────────────
  /** Intercambia la parada con su vecina (flechas ↑/↓). */
  const moveDelivery = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    setTripDeliveries(prev => {
      if (index < 0 || index >= prev.length || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setOrderDirty(true);
  };

  /** Mueve la parada de `fromIndex` a `toIndex` (drag and drop). */
  const reorderDeliveries = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setTripDeliveries(prev => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setOrderDirty(true);
  };

  // ── Navegación del wizard ──────────────────────────────────────────────────
  const handleNext = () => {
    setActiveStep((prevStep) => Math.min(prevStep + 1, 2));
  };

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  const canProceedStep1 = () => {
    // PLANIFICADO puede crearse sin conductor/vehículo; sólo EN_CURSO los exige.
    const baseOk = formData.destino && formData.fechaViaje;
    if (formData.estado === 'EN_CURSO') {
      return baseOk && formData.conductorId && formData.vehiculoId;
    }
    return baseOk;
  };

  // ── Guardado ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    // Un viaje no puede guardarse vacío: debe tener al menos una entrega con
    // factura u orden de servicio (sea recién agregada o ya persistida al editar).
    const tieneEntrega = tripDeliveries.some(d =>
      d.facturaId != null ||
      (d as any).ordenServicioId != null ||
      (d as any).documentoComercialId != null ||
      (d as any).documentoComercial?.id != null ||
      (d as any).ordenServicio?.id != null ||
      (d as any).tipoParada != null
    );
    if (!tieneEntrega) {
      onError('El viaje debe tener al menos una entrega o parada asociada. Agregá una entrega o parada antes de guardar.');
      return;
    }

    try {
      const viajeData = {
        fechaViaje: new Date(formData.fechaViaje).toISOString(),
        destino: formData.destino,
        // Conductor/vehículo/acompañante son opcionales: en PLANIFICADO pueden
        // quedar sin asignar (null) y completarse cerca de la salida.
        conductorId: formData.conductorId ? parseInt(formData.conductorId) : null,
        acompananteId: formData.acompananteId ? parseInt(formData.acompananteId) : null,
        vehiculoId: formData.vehiculoId ? parseInt(formData.vehiculoId) : null,
        estado: formData.estado,
        observaciones: formData.observaciones,
      };

      let savedTrip: Viaje;
      if (editingTrip) {
        savedTrip = await viajeApi.update(editingTrip.id, viajeData);
      } else {
        savedTrip = await viajeApi.create(viajeData);
      }

      const entregaErrors: string[] = [];

      // 1. Quitar del server las entregas persistidas removidas en el form
      //    (borrado diferido: revierte equipos y devuelve la factura al pool).
      for (const removedId of removedPersistedIds) {
        try {
          await entregaViajeApi.quitarDelViaje(removedId);
        } catch (removeError: unknown) {
          const msg = (removeError as any)?.response?.data?.message || (removeError as any)?.response?.data || (removeError as any)?.message || 'Error desconocido';
          entregaErrors.push(`Quitar entrega: ${msg}`);
        }
      }

      // 2. Crear las nuevas entregas, recordando el id asignado (para el reorden).
      const createdIds = new Map<number, number>(); // índice en tripDeliveries → id creado
      for (let i = 0; i < tripDeliveries.length; i++) {
        const delivery = tripDeliveries[i];
        if (delivery.id) continue; // Skip already persisted deliveries

        try {
          const deliveryPayload: any = {
            viajeId: savedTrip.id,
            direccionEntrega: delivery.direccionEntrega || '',
            fechaEntrega: delivery.fechaProgramada ? new Date(delivery.fechaProgramada).toISOString() : new Date().toISOString(),
            observaciones: delivery.observaciones || '',
            estado: 'PENDIENTE' as EstadoEntrega,
          };

          // Handle FACTURA, ORDEN_SERVICIO y PARADA_LIBRE (sin documento)
          if (delivery.facturaId) {
            deliveryPayload.documentoComercialId = delivery.facturaId;
          } else if ((delivery as any).ordenServicioId) {
            deliveryPayload.ordenServicioId = (delivery as any).ordenServicioId;
          } else if ((delivery as any).tipoParada) {
            deliveryPayload.tipoParada = (delivery as any).tipoParada;
          } else {
            continue; // Skip if neither factura, orden ni parada libre
          }

          const creada = await entregaViajeApi.create(deliveryPayload);
          if (creada?.id != null) createdIds.set(i, creada.id);
        } catch (deliveryError: unknown) {
          const msg = (deliveryError as any)?.response?.data?.message || (deliveryError as any)?.message || 'Error desconocido';
          const label = delivery.factura?.numeroDocumento || ((delivery as any).tipoParada ? tipoParadaLabel((delivery as any).tipoParada) : `OS-${(delivery as any).ordenServicioId || 'sin-ref'}`);
          entregaErrors.push(`${label}: ${msg}`);
        }
      }

      // 3. Persistir el orden de paradas según la posición en la UI. Solo en
      //    edición: en un viaje nuevo el backend ya asigna el orden por posición.
      //    Las nuevas entregas (max+1) también requieren reorden si no quedaron últimas.
      if (editingTrip && (orderDirty || createdIds.size > 0)) {
        const finalIds = tripDeliveries
          .map((d, i) => d.id ?? createdIds.get(i))
          .filter((id): id is number => id != null);
        if (finalIds.length > 0) {
          try {
            await viajeApi.reordenarEntregas(editingTrip.id, finalIds);
          } catch {
            entregaErrors.push('Viaje guardado, pero no se pudo actualizar el orden de paradas. Recargá y reintentá el reorden.');
          }
        }
      }

      setTripDeliveries([]);
      setRemovedPersistedIds([]);
      setOrderDirty(false);
      onSaved(savedTrip, entregaErrors);
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      let errorMessage = error.response?.data?.message || error.message || 'Error al guardar el viaje';

      if (error.response?.status === 409 || errorMessage.toLowerCase().includes('ya está asignada') || errorMessage.toLowerCase().includes('already')) {
        errorMessage = `Una o más facturas ya están asignadas a otro viaje. ${errorMessage}`;
      } else if (errorMessage.includes('no está disponible')) {
        errorMessage = 'El vehículo seleccionado no está disponible. Por favor, selecciona otro vehículo.';
      } else if (error.response?.status === 403) {
        errorMessage = 'No tienes permisos para crear viajes. Contacta al administrador.';
      }

      onError(errorMessage);
    }
  };

  // ── Inicialización (crear / editar) ────────────────────────────────────────
  // Mapea la precarga de entregas del tablero al estado interno del formulario.
  const mapPrefill = (prefill: DeliveryPrefill[]): DeliveryFormState[] =>
    prefill.map(p => {
      const delivery: any = {
        direccionEntrega: p.direccionEntrega,
        fechaProgramada: p.fechaProgramada || '',
        observaciones: p.observaciones || '',
        estado: 'PENDIENTE',
      };
      if (p.tipoEntrega === 'FACTURA' && p.facturaId != null) {
        delivery.facturaId = p.facturaId;
        delivery.factura = facturas.find(f => f.id === p.facturaId);
      } else if (p.tipoEntrega === 'ORDEN_SERVICIO' && p.ordenServicioId != null) {
        delivery.ordenServicioId = p.ordenServicioId;
        delivery.ordenServicio = ordenes.find(o => o.id === p.ordenServicioId);
      }
      return delivery as DeliveryFormState;
    });

  const startCreate = (prefill: DeliveryPrefill[] = opts.initialDeliveries ?? []) => {
    setEditingTrip(null);
    setSelectedDeliveryFactura(null);
    setSelectedDeliveryOrden(null);
    setFormData({ ...EMPTY_FORM_DATA });
    setTripDeliveries(prefill.length ? mapPrefill(prefill) : []);
    setRemovedPersistedIds([]);
    setOrderDirty(false);
    setNewDelivery({ ...EMPTY_NEW_DELIVERY });
    setActiveStep(0);
  };

  const startEdit = async (trip: Viaje) => {
    setEditingTrip(trip);
    setSelectedDeliveryFactura(null);
    setSelectedDeliveryOrden(null);
    setFormData({
      fechaViaje: trip.fechaViaje.slice(0, 16),
      destino: trip.destino,
      // conductorId/vehiculoId vienen como null en viajes legacy (a pesar del
      // tipo). Sin el guard, el botón Editar crashea con
      // "Cannot read properties of null (reading 'toString')". Ver Sentry 3e4bac…
      conductorId: trip.conductorId?.toString() ?? '',
      acompananteId: trip.acompananteId?.toString() ?? '',
      vehiculoId: trip.vehiculoId?.toString() ?? '',
      facturaId: '',
      estado: trip.estado,
      observaciones: trip.observaciones || '',
    });

    try {
      // El backend ya devuelve las entregas ordenadas por parada (orden ASC).
      const existingDeliveries = await entregaViajeApi.getByViaje(trip.id);
      setTripDeliveries(existingDeliveries);
    } catch {
      setTripDeliveries([]);
    }
    setRemovedPersistedIds([]);
    setOrderDirty(false);
    setNewDelivery({ ...EMPTY_NEW_DELIVERY });
    setActiveStep(0);
  };

  return {
    // estado del formulario
    editingTrip,
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
    // modales de vehículo
    vehiculoEstadoDialog,
    setVehiculoEstadoDialog,
    vehicleInUseDialogOpen,
    setVehicleInUseDialogOpen,
    // catálogos resueltos
    vehicles,
    drivers,
    facturas,
    ordenes,
    clientes,
    deliveries,
    trips,
    conductores,
    acompanantes,
    conductoresDisponibles,
    acompanantesDisponibles,
    facturasDisponibles,
    // helpers de catálogo
    isVehicleInUse,
    getTripUsingVehicle,
    getSelectedVehicle,
    getDriverName,
    getAcompananteName,
    getVehicleInfo,
    // handlers
    handleNext,
    handleBack,
    canProceedStep1,
    handleAddDelivery,
    handleRemoveDelivery,
    canRemoveDelivery,
    moveDelivery,
    reorderDeliveries,
    handleSelectFacturaForDelivery,
    handleSelectVehicle,
    handleSave,
    // inicialización
    startCreate,
    startEdit,
  };
}

export type TripWizardController = ReturnType<typeof useTripWizard>;
