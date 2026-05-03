/* eslint-disable */
// One-shot splitter for src/types/index.ts (FRONT-004).
// Reads the monolith from index.ts.backup, slices by line ranges per domain,
// writes new files. Idempotent — safe to re-run while iterating.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'src', 'types');
const SRC = path.join(DIR, 'index.ts');
const BACKUP = SRC + '.backup';

const sourcePath = fs.existsSync(BACKUP) ? BACKUP : SRC;
const lines = fs.readFileSync(sourcePath, 'utf8').split('\n');
console.log(`Reading source from ${path.basename(sourcePath)} (${lines.length} lines)`);

// Auto-extend each range forward until braces balance — original ranges
// often end on the last content line of an interface, missing the closing `}`.
const extend = (start, end) => {
  let open = 0;
  for (let i = start - 1; i < end; i++) {
    open += (lines[i].match(/[{(]/g) || []).length;
    open -= (lines[i].match(/[})]/g) || []).length;
  }
  let i = end;
  while (open > 0 && i < lines.length) {
    open += (lines[i].match(/[{(]/g) || []).length;
    open -= (lines[i].match(/[})]/g) || []).length;
    i += 1;
  }
  return [start, i];
};

const slice = (...ranges) =>
  ranges
    .map((r) => {
      const [s, e] = extend(r[0], r[1]);
      return lines.slice(s - 1, e).join('\n');
    })
    .join('\n');

// Each entry: { file, header, ranges }. Ranges are inclusive 1-based.
// Solapamientos eliminados: cada tipo vive en EXACTAMENTE un archivo.
const plan = [
  {
    file: 'garantia.types.ts',
    header: [
      "import type { Client } from './cliente.types';",
      "import type { Sale } from './venta.types';",
      "import type { Product } from './producto.types';",
      "import type { Employee } from './rrhh.types';",
      "// Garantías, reclamos y aliases en español.",
    ].join('\n'),
    ranges: [
      [285, 320],   // Warranty, WarrantyClaim
      [925, 954],   // WarrantyStatus, WarrantyType, ClaimStatus, ClaimSolution
      // Aliases that depend on Warranty/WarrantyClaim live here too.
      [25, 27],
    ],
  },
  {
    file: 'cliente.types.ts',
    header: [
      "import type { ProvinciaEnum } from './shared.enums';",
      "import type { ProductoSimple } from './producto.types';",
      "import type { MetodoPago, Venta } from './venta.types';",
      "import type { OpcionFinanciamientoDTO, DocumentoComercial } from './documentoComercial.types';",
      "import type { User } from './admin.types';",
      "// Cliente, contactos, cuenta corriente y KPIs de cliente.",
    ].join('\n'),
    ranges: [
      // Skip [25,27] (Garantía aliases → garantia.types) and ProductoSimple (→ producto)
      [30, 82],     // Cliente
      [89, 92],     // SegmentoCliente, CondicionPago, PreferenciaContacto
      // Skip [93,107] CreateMovimientoPayload (→ compra.types)
      // Skip [109,118] ContactoProveedorDTO (→ compra.types)
      [121, 196],   // ContactoCliente, CuentaCorriente, enums, Create*
      [199, 214],   // Client (legacy)
      [1462, 1472], // DocumentoCliente
      [2237, 2246], // KPIsClienteDTO
    ],
  },
  {
    file: 'producto.types.ts',
    header: [
      "import type { Empleado, Employee } from './rrhh.types';",
      "import type { Usuario } from './admin.types';",
      "// Productos, categorías, inventario y movimientos de stock.",
    ].join('\n'),
    ranges: [
      [83, 87],     // ProductoSimple
      [561, 600],   // Category, Supplier, Product
      [604, 690],   // TipoEntidadProducto, Producto, ProductoCreate/Update/DTO/ListDTO, CreateProductRequest (Spanish)
      [749, 763],   // StockMovement (canonical)
      [783, 797],   // InventoryAdjustment
      [867, 873],   // CategoriaProducto
      [984, 992],   // MovementType const enum
      [1068, 1075], // CreateProductRequest (English) — co-exists with Spanish (TS lets the second declaration win in same module; here we keep both names by suffix)
      [1125, 1136], // CreateCategoryRequest, CreateSupplierRequest
      [1139, 1148], // CreateStockMovementRequest
      [1204, 1215], // CreateInventoryAdjustmentRequest
      [1864, 1868], // Categoria (Spanish)
      [2071, 2122], // Inventario, InventarioMovimiento, InventarioAjuste, InventarioRecuento, InventarioReporte
      [2152, 2182], // MovimientoStock, MovimientoStockLegacy
    ],
  },
  {
    file: 'venta.types.ts',
    header: [
      "import type { Cliente, Client } from './cliente.types';",
      "import type { Empleado, Employee } from './rrhh.types';",
      "import type { Usuario } from './admin.types';",
      "import type { Producto, Product, Category } from './producto.types';",
      "import type { TipoItemDocumento } from './documentoComercial.types';",
      "// Ventas, presupuestos, facturas, métodos de pago, servicios y citas.",
    ].join('\n'),
    // Canonical METODO_PAGO_LABELS for the wide MetodoPago. prestamo.types lost
    // its narrow version; consumers via the barrel now get this.
    footer: [
      "",
      "export const METODO_PAGO_LABELS: Record<MetodoPago, string> = {",
      "  EFECTIVO: 'Efectivo',",
      "  TARJETA_CREDITO: 'Tarjeta de Crédito',",
      "  TARJETA_DEBITO: 'Tarjeta de Débito',",
      "  TRANSFERENCIA: 'Transferencia',",
      "  TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',",
      "  CHEQUE: 'Cheque',",
      "  MERCADO_PAGO: 'Mercado Pago',",
      "  FINANCIAMIENTO: 'Financiamiento',",
      "  FINANCIACION_PROPIA: 'Financiación Propia',",
      "  CUENTA_CORRIENTE: 'Cuenta Corriente',",
      "};",
    ].join('\n'),
    ranges: [
      [261, 282],   // Presupuesto, DetallePresupuesto (legacy)
      [695, 732],   // Sale, SaleItem
      [735, 746],   // Service
      [766, 780],   // ServiceAppointment
      [876, 913],   // OrderStatus, PaymentMethod, SaleStatus, AppointmentStatus
      [917, 923],   // PresupuestoStatus
      [1077, 1090], // CreateOrderRequest, CreateOrderItemRequest
      [1092, 1105], // CreateSaleRequest, CreateSaleItemRequest
      [1107, 1123], // CreateServiceRequest, CreateServiceAppointmentRequest
      [1218, 1242], // LegacyCreatePresupuestoRequest, LegacyCreateDetallePresupuestoRequest
      [1517, 1623], // DetalleVenta, Venta, MetodoPago, ColorEquipo, MedidaEquipo, CreateVentaDTO
      [1824, 1836], // tareaServicioApi (legacy)
      [1845, 1860], // Factura, FacturaItem
      [2143, 2150], // VentaItem
    ],
  },
  {
    file: 'compra.types.ts',
    header: [
      "import type { ProvinciaEnum } from './shared.enums';",
      "import type { Producto, Product, Supplier } from './producto.types';",
      "import type { TipoMovimiento } from './cliente.types';",
      "import type { MetodoPago } from './venta.types';",
      "import type { Employee } from './rrhh.types';",
      "// Compras, proveedores, órdenes de compra y cuenta corriente proveedor.",
    ].join('\n'),
    ranges: [
      [109, 118],   // ContactoProveedorDTO
      [93, 107],    // CreateMovimientoPayload (cliente o proveedor)
      [323, 353],   // Purchase, PurchaseItem
      [956, 964],   // PurchaseStatus
      [1870, 1952], // ProveedorDTO, CreateProveedor*, ProveedorProducto*, Proveedor, CuentaCorrienteProveedor, CreateMovimientoProveedorPayload
      [1978, 2069], // DetalleCompraDTO, OrdenCompra, CompraDTO, CreateCompraDTO, OrdenCompraItem
      [2124, 2142], // Compra, CompraItem
    ],
  },
  {
    file: 'rrhh.types.ts',
    header: [
      "// RRHH: empleados, puestos, asistencia, licencias, capacitaciones, sueldos, legajos.",
    ].join('\n'),
    ranges: [
      [356, 395],   // EmployeePayroll, Attendance, Training
      [545, 558],   // Employee
      [966, 982],   // AttendanceStatus, TrainingStatus
      [1057, 1066], // CreateEmployeeRequest
      [1244, 1461], // EstadoEmpleado, TipoLicencia, EstadoLicencia, Puesto*, Empleado, RegistroAsistencia, Licencia, Capacitacion, Sueldo, Legajo, DocumentoLegajo (sin DocumentoCliente)
      [1474, 1500], // DocumentoEmpleado, UploadDocumentoRequest, UploadResponse
      [1764, 1792], // EmpleadoCreateDTO, EmpleadoUpdateDTO
    ],
  },
  {
    file: 'logistica.types.ts',
    header: [
      "import type { Client } from './cliente.types';",
      "import type { Empleado, Employee } from './rrhh.types';",
      "import type { Venta } from './venta.types';",
      "import type { OrdenServicio } from './taller.types';",
      "import type { DocumentoComercial } from './documentoComercial.types';",
      "import type { EquipoFabricadoDTO, EstadoAsignacionEquipo } from './fabricacion.types';",
      "// Viajes, vehículos, entregas, incidencias, depósito (warehouse genérico).",
    ].join('\n'),
    ranges: [
      // StockMovement (lines 398-411) is the dup version, dropped — canonical lives in producto.types
      [413, 478],   // Warehouse, Trip, Vehicle, Delivery
      [994, 1014],  // TripStatus, DeliveryStatus
      [1151, 1168], // CreateWarehouseRequest, CreateVehicleRequest
      [1171, 1201], // CreateTripRequest, CreateDeliveryRequest
      [1625, 1762], // Vehiculo, Viaje, ViajeCreateDTO, VehiculoCreateDTO, Incidencia*
      [1794, 1821], // EntregaViaje, EstadoEntrega, UnidadMedida
      [2696, 2784], // EstadoEntregaEquipo, EstadoViaje, EntregaViajeDetalle, ViajeExtendido, EquipoPendienteViaje, AgregarFacturaViajeDTO, ConfirmarEntregaEquipoDTO
    ],
  },
  {
    file: 'taller.types.ts',
    header: [
      "import type { Cliente, Client } from './cliente.types';",
      "import type { Empleado, Employee } from './rrhh.types';",
      "import type { Product, CategoriaProducto, TipoEntidadProducto } from './producto.types';",
      "import type { EquipoEnOrdenDTO } from './fabricacion.types';",
      "// Órdenes de servicio, tareas, materiales utilizados, productos terminados.",
    ].join('\n'),
    ranges: [
      [481, 542],   // WorkOrder, WorkTask, WorkMaterial, Equipment
      [800, 865],   // ProductoTerminado (taller), MaterialUtilizado, TareaServicio, OrdenServicio
      [1016, 1047], // WorkPriority, WorkStatus, TaskStatus, EquipmentStatus
    ],
  },
  {
    file: 'fabricacion.types.ts',
    header: [
      "import type { ColorEquipo, MedidaEquipo } from './venta.types';",
      "import type { Producto } from './producto.types';",
      "import type { UnidadMedida } from './logistica.types';",
      "// Recetas de fabricación, equipos fabricados, terminaciones, costeo.",
    ].join('\n'),
    ranges: [
      [2211, 2220], // RecetaItem
      [2462, 2536], // DetalleRecetaDTO, DetalleRecetaCreateDTO, RecetaFabricacionDTO, RecetaFabricacionListDTO, RecetaFabricacionCreateDTO, RecetaFabricacionUpdateDTO
      [2539, 2691], // TipoEquipo, EstadoAsignacionEquipo, HistorialEstadoEquipo, EquipoFabricadoDTO, EquipoFabricadoListDTO, EquipoFabricadoCreateDTO, EquipoFabricadoUpdateDTO, EstadoFabricacion, EquipoCreationResponseDTO, TipoTerminacion, FabricacionBaseRequestDTO, AplicarTerminacionDTO, EtapaTerminacionDTO, HistorialFabricacionDTO, ValidacionStockDTO
      [2876, 2905], // DesgloseModeloDTO, EquipoEnOrdenDTO
      [3809, 3822], // CosteoRecetaDTO
    ],
  },
  {
    file: 'documentoComercial.types.ts',
    header: [
      "import type { ColorEquipo, MedidaEquipo, MetodoPago } from './venta.types';",
      "import type { EstadoFabricacion } from './fabricacion.types';",
      "// Documentos comerciales: presupuesto, nota de pedido, factura, nota de crédito.",
    ].join('\n'),
    ranges: [
      [1050, 1055], // CreateClientRequest (legacy del bloque de Create*Request)
      [2222, 2235], // TipoItemDocumento, EstadoDocumento, TipoDocumento
      [2248, 2447], // DocumentoComercial, CreateNotaCredito, ... DeudaClienteError
      [2449, 2460], // OpcionFinanciamientoDTO
    ],
  },
  {
    file: 'deposito.types.ts',
    header: [
      "import type { DetalleCompraDTO } from './compra.types';",
      "import type { TipoEquipo } from './fabricacion.types';",
      "// Depósitos, ubicaciones, movimientos por depósito, transferencias, auditoría, recepciones.",
    ].join('\n'),
    ranges: [
      [2827, 2874], // Deposito, DepositoCreateDTO, StockDeposito, StockDepositoCreateDTO
      [2907, 2932], // UbicacionEquipo, UbicacionEquipoCreateDTO, TipoMovimientoStockDeposito header
      [2933, 2933],
      [2935, 2975], // MovimientoStockDeposito, TipoMovimientoEquipo, MovimientoEquipo
      [2982, 3083], // Distribucion, Recepcion, Transferencia, ConfirmarRecepcion, ItemRecepcion
      [3085, 3124], // AuditoriaMovimientoDTO, AuditoriaMovimientoFiltroDTO
      [3127, 3178], // StockGlobalProductoDTO, ResumenStockDepositoDTO, ResumenDepositoDTO, SincronizacionStockDTO, ReconciliacionResultDTO, ReconciliacionProductoDTO
    ],
  },
  {
    file: 'cheque.types.ts',
    header: [
      "// Bancos, cuentas bancarias, cheques (propios y de terceros), endosos.",
    ].join('\n'),
    ranges: [
      [3187, 3232], // Banco, BancoCreateDTO, CuentaBancaria, CuentaBancariaCreateDTO
      [3238, 3431], // TipoChequeType, EstadoChequeType, Cheque, ChequeCreate/Update/CambioEstado/Historial/Filter/Resumen/Endoso/Cadena/Disponible
      [3695, 3720], // ChequeEstadoResumenDTO, ResumenChequesDTO, ChequeStatusAggregation (live entre flujoCaja blocks pero son cheque-related)
    ],
  },
  {
    file: 'reconciliacion-stock.types.ts',
    header: [
      "// Reconciliación de stock V2: ajustes por depósito, diferencias, aprobaciones.",
    ].join('\n'),
    ranges: [
      [3439, 3601],
    ],
  },
  {
    file: 'flujoCaja.types.ts',
    header: [
      "import type { MetodoPago } from './venta.types';",
      "import type { EstadoChequeType, ChequeStatusAggregation, ResumenChequesDTO } from './cheque.types';",
      "// Flujo de caja: movimientos enriquecidos, KPIs, agregaciones por método de pago.",
    ].join('\n'),
    ranges: [
      [3606, 3692], // OrigenMovimiento, CategoriaGastoExtra, CategoriaCobroExtra, EstadoMovimiento, FlujoCajaMovimientoEnhanced, SaldoPorMetodoPagoDTO, PaymentMethodAggregation
      // Skip [3695,3720] — moved to cheque.types
      [3722, 3807], // EvolucionDiariaDTO, TimeSeriesData, FlujoCajaResponseEnhanced, FlujoCajaKPIs
      [3824, 3861], // TipoMovimientoBackend, CreateMovimientoExtraDTO, UpdateMovimientoExtraDTO, CategoriasDisponiblesDTO
    ],
  },
  {
    file: 'admin.types.ts',
    header: [
      "// Catálogos de sistema: usuarios, roles, permisos, parámetros, módulos, dashboard, búsqueda.",
    ].join('\n'),
    ranges: [
      [217, 258],   // User, Role, Permission, SystemParameter
      [1503, 1514], // Usuario
      [1839, 1844], // Rol
      [2184, 2210], // ParametroSistema, Configuracion, Permiso
      [2787, 2811], // TipoRol, Modulo, UserRole
      [2813, 2822], // DashboardMetric
      // Skip [3695,3720] — moved to cheque.types
      [3879, 3898], // SearchSuggestion, ProveedorOfertaDTO
    ],
  },
];

const buildBody = (entry) =>
  entry.header + '\n\n' + slice(...entry.ranges) + '\n' + (entry.footer || '');

// Validation: ensure each file's body stays under 600 LOC including header.
let allOK = true;
for (const entry of plan) {
  const lc = buildBody(entry).split('\n').length;
  if (lc > 600) {
    console.error(`[ERR] ${entry.file} = ${lc} LOC (over 600)`);
    allOK = false;
  } else {
    console.log(`[OK]  ${entry.file} = ${lc} LOC`);
  }
}
if (!allOK) {
  console.error('Some files exceed 600 LOC. Aborting.');
  process.exit(1);
}

// Backup the original (only if no backup exists yet).
if (!fs.existsSync(BACKUP)) {
  fs.copyFileSync(SRC, BACKUP);
  console.log(`Backup written to ${BACKUP}`);
}

// Transformations applied to specific files after extraction.
const transforms = {
  'venta.types.ts': (text) =>
    // Replace the narrow `export type MetodoPago = | 'X' | 'Y' | ...;` with
    // a const-as-value declaration so consumers can use MetodoPago.X (value)
    // AND MetodoPago (type). The original prestamo.types provided the const;
    // we now provide it canonically here on top of the wider union.
    text.replace(
      /export type MetodoPago =\s*\n(?:\s*\|\s*'[^']+'\s*\n)+\s*\|\s*'[^']+';/m,
      [
        "export const MetodoPago = {",
        "  EFECTIVO: 'EFECTIVO',",
        "  TARJETA_CREDITO: 'TARJETA_CREDITO',",
        "  TARJETA_DEBITO: 'TARJETA_DEBITO',",
        "  TRANSFERENCIA: 'TRANSFERENCIA',",
        "  TRANSFERENCIA_BANCARIA: 'TRANSFERENCIA_BANCARIA',",
        "  CHEQUE: 'CHEQUE',",
        "  MERCADO_PAGO: 'MERCADO_PAGO',",
        "  FINANCIAMIENTO: 'FINANCIAMIENTO',",
        "  FINANCIACION_PROPIA: 'FINANCIACION_PROPIA',",
        "  CUENTA_CORRIENTE: 'CUENTA_CORRIENTE',",
        "} as const;",
        "export type MetodoPago = typeof MetodoPago[keyof typeof MetodoPago];",
      ].join('\n'),
    ),
};

// Write each domain file.
for (const entry of plan) {
  let body = buildBody(entry);
  if (transforms[entry.file]) body = transforms[entry.file](body);
  fs.writeFileSync(path.join(DIR, entry.file), body, 'utf8');
}

// Build the new index.ts as a barrel.
const barrel = [
  '// Barrel exports per domain. Originally a 3,898-LOC monolith — split by',
  '// FRONT-004 audit. Domain split is approximate; cross-domain types use',
  "// `import type` to keep the boundary loose.",
  '',
  "export * from './balance.types';",
  "export * from './amortizacion.types';",
  "export * from './provision.types';",
  "export * from './tipoProvision.types';",
  "export * from './auth.types';",
  "export * from './tenant.types';",
  "export * from './lead.types';",
  "export type { LeadDTO as Lead } from './lead.types';",
  "// prestamo.types renames its narrow MetodoPago/METODO_PAGO_LABELS to *Prestamo",
  "// suffix so the wider declarations from venta.types win the barrel resolution.",
  "export * from './prestamo.types';",
  "export * from './pagination.types';",
  "export * from './shared.enums';",
  '',
  '// Domain types (ex-monolith).',
  "export * from './admin.types';",
  "export * from './cliente.types';",
  "export * from './producto.types';",
  "export * from './venta.types';",
  "export * from './compra.types';",
  "export * from './garantia.types';",
  "export * from './rrhh.types';",
  "export * from './logistica.types';",
  "export * from './taller.types';",
  "export * from './fabricacion.types';",
  "export * from './documentoComercial.types';",
  "export * from './deposito.types';",
  "export * from './cheque.types';",
  "export * from './reconciliacion-stock.types';",
  "export * from './flujoCaja.types';",
  '',
  "export * from './stockPlanificacion.types';",
  "export * from './posicionPatrimonial.types';",
  "export * from './cajasAhorro.types';",
  "export * from './cajasPesos.types';",
  "export * from './caja.types';",
  '',
].join('\n');

fs.writeFileSync(SRC, barrel, 'utf8');
console.log(`\nNew barrel: ${SRC}`);
console.log('Done.');
