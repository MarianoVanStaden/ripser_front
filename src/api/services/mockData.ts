// --- Mock Data for Garantía (Warranty) Module ---
import type { Garantia, ReclamoGarantia } from "../../types";

export const mockGarantias: Garantia[] = [
  {
    id: 1,
    productId: 1,
    clientId: 1,
    warrantyNumber: "GAR-0001",
    startDate: "2024-01-15",
    endDate: "2025-01-15",
    status: "ACTIVE",
    type: "MANUFACTURER",
    description: "Garantía estándar",
    claims: [],
    createdAt: "2024-01-15T00:00:00",
    updatedAt: "2024-01-15T00:00:00",
  },
  {
    id: 2,
    productId: 2,
    clientId: 2,
    warrantyNumber: "GAR-0002",
    startDate: "2023-08-20",
    endDate: "2024-08-20",
    status: "EXPIRED",
    type: "MANUFACTURER",
    description: "Garantía vencida",
    claims: [],
    createdAt: "2023-08-20T00:00:00",
    updatedAt: "2023-08-20T00:00:00",
  },
];

export const mockReclamosGarantia: ReclamoGarantia[] = [
  {
    id: 1,
    warrantyId: 1,
    claimNumber: "RC-0001",
    claimDate: "2024-06-01",
    description: "Falla en el producto. Cliente reporta mal funcionamiento.",
    status: "PENDING",
    solution: "REPAIR",
    employeeId: 1,
    resolution: "Pendiente de revisión.",
    cost: 0,
    createdAt: "2024-06-01T00:00:00",
    updatedAt: "2024-06-01T00:00:00",
  },
  {
    id: 2,
    warrantyId: 2,
    claimNumber: "RC-0002",
    claimDate: "2024-06-10",
    description: "No enciende. Producto reemplazado.",
    status: "RESOLVED",
    solution: "REPLACEMENT",
    employeeId: 2,
    resolution: "Producto reemplazado.",
    resolutionDate: "2024-06-15",
    cost: 0,
    createdAt: "2024-06-10T00:00:00",
    updatedAt: "2024-06-15T00:00:00",
  },
];
import type {
  Cliente,
  ContactoCliente,
  CuentaCorriente,
  CreateClienteRequest,
  CreateContactoClienteRequest,
  CreateCuentaCorrienteRequest,
  Supplier,
  CreateSupplierRequest,
} from "../../types";

// Mock data for testing
export const mockClientes: Cliente[] = [
  {
    id: 1,
    nombre: "Juan Carlos",
    apellido: "Pérez",
    cuit: "20-12345678-9",
    email: "juan.perez@email.com",
    telefono: "+54 11 1234-5678",
    direccion: "Av. Corrientes 1234",
    ciudad: "Buenos Aires",
    provincia: "CABA",
    codigoPostal: "1043",
    tipo: "PERSONA_FISICA",
    estado: "ACTIVO",
    limiteCredito: 50000,
    saldoActual: 15000,
    fechaAlta: "2024-01-15T10:00:00",
    fechaActualizacion: "2024-12-01T14:30:00",
  },
  {
    id: 2,
    nombre: "Distribuidora San Martín",
    razonSocial: "Distribuidora San Martín S.R.L.",
    cuit: "30-67890123-4",
    email: "ventas@distribuidorasanmartin.com",
    telefono: "+54 11 9876-5432",
    direccion: "Av. San Martín 567",
    ciudad: "San Martín",
    provincia: "Buenos Aires",
    codigoPostal: "1650",
    tipo: "PERSONA_JURIDICA",
    estado: "ACTIVO",
    limiteCredito: 200000,
    saldoActual: 85000,
    fechaAlta: "2023-08-20T09:15:00",
    fechaActualizacion: "2024-11-15T16:45:00",
  },
  {
    id: 3,
    nombre: "María Elena",
    apellido: "González",
    cuit: "27-87654321-0",
    email: "maria.gonzalez@gmail.com",
    telefono: "+54 351 444-7890",
    direccion: "Belgrano 890",
    ciudad: "Córdoba",
    provincia: "Córdoba",
    codigoPostal: "5000",
    tipo: "PERSONA_FISICA",
    estado: "MOROSO",
    limiteCredito: 30000,
    saldoActual: 35000,
    fechaAlta: "2023-03-10T11:30:00",
    fechaActualizacion: "2024-10-20T13:20:00",
  },
  {
    id: 4,
    nombre: "Comercial Norte",
    razonSocial: "Comercial Norte S.A.",
    cuit: "30-11223344-5",
    email: "info@comercialnorte.com.ar",
    telefono: "+54 381 555-0123",
    direccion: "Ruta Nacional 9 Km 1200",
    ciudad: "San Miguel de Tucumán",
    provincia: "Tucumán",
    codigoPostal: "4000",
    tipo: "PERSONA_JURIDICA",
    estado: "SUSPENDIDO",
    limiteCredito: 150000,
    saldoActual: 0,
    fechaAlta: "2022-11-05T08:00:00",
    fechaActualizacion: "2024-09-10T10:15:00",
  },
  {
    id: 5,
    nombre: "Roberto",
    apellido: "Martínez",
    cuit: "20-99887766-3",
    email: "roberto.martinez@hotmail.com",
    telefono: "+54 261 333-4567",
    direccion: "Las Heras 456",
    ciudad: "Mendoza",
    provincia: "Mendoza",
    codigoPostal: "5500",
    tipo: "PERSONA_FISICA",
    estado: "INACTIVO",
    limiteCredito: 25000,
    saldoActual: 5000,
    fechaAlta: "2024-05-22T14:00:00",
    fechaActualizacion: "2024-08-30T09:45:00",
  },
];

export const mockContactos: ContactoCliente[] = [
  {
    id: 1,
    clienteId: 1,
    fechaContacto: "2024-12-01T10:00:00",
    tipoContacto: "LLAMADA",
    descripcion:
      "Contacto para seguimiento de pago pendiente. Cliente confirmó que realizará el pago la próxima semana.",
    resultado: "Compromiso de pago para el 15/12/2024",
    proximoContacto: "2024-12-15T09:00:00",
  },
  {
    id: 2,
    clienteId: 1,
    fechaContacto: "2024-11-20T14:30:00",
    tipoContacto: "EMAIL",
    descripcion:
      "Envío de catálogo de nuevos productos y lista de precios actualizada.",
    resultado: "Cliente interesado en productos de la línea premium",
  },
  {
    id: 3,
    clienteId: 2,
    fechaContacto: "2024-11-25T11:15:00",
    tipoContacto: "VISITA",
    descripcion:
      "Visita comercial para presentar nueva línea de productos y negociar condiciones de compra.",
    resultado:
      "Pedido confirmado por $45,000. Entrega programada para el 10/12/2024",
    proximoContacto: "2024-12-10T08:00:00",
  },
  {
    id: 4,
    clienteId: 3,
    fechaContacto: "2024-10-15T16:00:00",
    tipoContacto: "LLAMADA",
    descripcion:
      "Gestión de cobranza. Cliente solicita refinanciación de deuda.",
    resultado: "Acuerdo de refinanciación en 6 cuotas",
  },
];

export const mockCuentaCorriente: CuentaCorriente[] = [
  {
    id: 1,
    clienteId: 1,
    fecha: "2024-12-01T00:00:00",
    tipo: "DEBITO",
    importe: 25000,
    concepto: "Factura Nº 001-00001234 - Venta de mercadería",
    numeroComprobante: "FAC-001234",
    saldo: 15000,
  },
  {
    id: 2,
    clienteId: 1,
    fecha: "2024-11-15T00:00:00",
    tipo: "CREDITO",
    importe: 10000,
    concepto: "Pago recibido - Transferencia bancaria",
    numeroComprobante: "REC-000567",
    saldo: -10000,
  },
  {
    id: 3,
    clienteId: 2,
    fecha: "2024-11-30T00:00:00",
    tipo: "DEBITO",
    importe: 45000,
    concepto: "Factura Nº 001-00001256 - Pedido especial",
    numeroComprobante: "FAC-001256",
    saldo: 85000,
  },
  {
    id: 4,
    clienteId: 2,
    fecha: "2024-11-01T00:00:00",
    tipo: "DEBITO",
    importe: 40000,
    concepto: "Factura Nº 001-00001201 - Compra mensual",
    numeroComprobante: "FAC-001201",
    saldo: 40000,
  },
  {
    id: 5,
    clienteId: 3,
    fecha: "2024-10-10T00:00:00",
    tipo: "DEBITO",
    importe: 15000,
    concepto: "Factura Nº 001-00001145 - Venta de productos",
    numeroComprobante: "FAC-001145",
    saldo: 35000,
  },
  {
    id: 6,
    clienteId: 3,
    fecha: "2024-09-15T00:00:00",
    tipo: "DEBITO",
    importe: 20000,
    concepto: "Factura Nº 001-00001098 - Compra de insumos",
    numeroComprobante: "FAC-001098",
    saldo: 20000,
  },
];

// Mock API functions
export const mockClienteApi = {
  getAll: async (): Promise<Cliente[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
    return [...mockClientes];
  },

  getById: async (id: number): Promise<Cliente> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const cliente = mockClientes.find((c) => c.id === id);
    if (!cliente) {
      throw new Error("Cliente no encontrado");
    }
    return { ...cliente };
  },

  create: async (cliente: CreateClienteRequest): Promise<Cliente> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newCliente: Cliente = {
      ...cliente,
      id: Math.max(...mockClientes.map((c) => c.id)) + 1,
      saldoActual: 0,
      fechaAlta: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };
    mockClientes.push(newCliente);
    return { ...newCliente };
  },

  update: async (
    id: number,
    cliente: CreateClienteRequest
  ): Promise<Cliente> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const index = mockClientes.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Cliente no encontrado");
    }
    const updatedCliente: Cliente = {
      ...mockClientes[index],
      ...cliente,
      fechaActualizacion: new Date().toISOString(),
    };
    mockClientes[index] = updatedCliente;
    return { ...updatedCliente };
  },

  delete: async (id: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockClientes.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Cliente no encontrado");
    }
    mockClientes.splice(index, 1);
  },

  search: async (query: string): Promise<Cliente[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const lowercaseQuery = query.toLowerCase();
    return mockClientes.filter(
      (cliente) =>
        cliente.nombre.toLowerCase().includes(lowercaseQuery) ||
        (cliente.apellido &&
          cliente.apellido.toLowerCase().includes(lowercaseQuery)) ||
        (cliente.razonSocial &&
          cliente.razonSocial.toLowerCase().includes(lowercaseQuery)) ||
        (cliente.cuit && cliente.cuit.includes(query)) ||
        (cliente.email && cliente.email.toLowerCase().includes(lowercaseQuery))
    );
  },
};

export const mockContactoClienteApi = {
  getByClienteId: async (clienteId: number): Promise<ContactoCliente[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockContactos.filter((c) => c.clienteId === clienteId);
  },

  create: async (
    contacto: CreateContactoClienteRequest
  ): Promise<ContactoCliente> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const newContacto: ContactoCliente = {
      ...contacto,
      id: Math.max(...mockContactos.map((c) => c.id)) + 1,
    };
    mockContactos.push(newContacto);
    return { ...newContacto };
  },

  update: async (
    id: number,
    contacto: CreateContactoClienteRequest
  ): Promise<ContactoCliente> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = mockContactos.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Contacto no encontrado");
    }
    const updatedContacto: ContactoCliente = {
      ...mockContactos[index],
      ...contacto,
    };
    mockContactos[index] = updatedContacto;
    return { ...updatedContacto };
  },

  delete: async (id: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = mockContactos.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Contacto no encontrado");
    }
    mockContactos.splice(index, 1);
  },
};

export const mockCuentaCorrienteApi = {
  getByClienteId: async (clienteId: number): Promise<CuentaCorriente[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockCuentaCorriente.filter((c) => c.clienteId === clienteId);
  },

  create: async (
    movimiento: CreateCuentaCorrienteRequest
  ): Promise<CuentaCorriente> => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Calculate new balance
    const clienteMovimientos = mockCuentaCorriente.filter(
      (m) => m.clienteId === movimiento.clienteId
    );
    const currentBalance = clienteMovimientos.reduce((total, mov) => {
      return mov.tipo === "DEBITO" ? total + mov.importe : total - mov.importe;
    }, 0);

    const newBalance =
      movimiento.tipo === "DEBITO"
        ? currentBalance + movimiento.importe
        : currentBalance - movimiento.importe;

    const newMovimiento: CuentaCorriente = {
      ...movimiento,
      id: Math.max(...mockCuentaCorriente.map((c) => c.id)) + 1,
      saldo: newBalance,
    };

    mockCuentaCorriente.push(newMovimiento);

    // Update client balance
    const cliente = mockClientes.find((c) => c.id === movimiento.clienteId);
    if (cliente) {
      cliente.saldoActual = newBalance;
    }

    return { ...newMovimiento };
  },
};

// Mock data for Suppliers
export const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: "TecnoProveedores S.A.",
    contactPerson: "Carlos Rodríguez",
    email: "carlos@tecnoproveedores.com",
    phone: "+54 11 4567-8901",
    address: "Av. Tecnología 123, CABA",
    paymentTerms: "30 días",
    rating: 4.5,
    isActive: true,
    observations:
      "Excelente proveedor de equipos tecnológicos. Muy confiable en entregas.",
    createdAt: "2023-06-15T09:00:00",
    updatedAt: "2024-11-20T14:30:00",
  },
  {
    id: 2,
    name: "Materiales del Sur",
    contactPerson: "Ana Martinez",
    email: "ana@materialesdelsur.com",
    phone: "+54 11 9876-5432",
    address: "Ruta 3 Km 45, La Plata",
    paymentTerms: "60 días",
    rating: 4.2,
    isActive: true,
    observations: "Proveedor confiable de materiales de construcción.",
    createdAt: "2023-03-10T10:15:00",
    updatedAt: "2024-10-05T16:20:00",
  },
  {
    id: 3,
    name: "Insumos Industriales",
    contactPerson: "Roberto Silva",
    email: "ventas@insumosindustriales.com",
    phone: "+54 341 123-4567",
    address: "Zona Industrial Norte, Rosario",
    paymentTerms: "45 días",
    rating: 3.8,
    isActive: true,
    observations: "Buenos precios pero a veces demoras en entregas.",
    createdAt: "2023-01-20T08:30:00",
    updatedAt: "2024-09-15T11:45:00",
  },
  {
    id: 4,
    name: "GlobalTech Ltda.",
    contactPerson: "Patricia López",
    email: "patricia@globaltech.com",
    phone: "+54 261 789-0123",
    address: "Parque Tecnológico Mendoza",
    paymentTerms: "15 días",
    rating: 4.8,
    isActive: true,
    observations:
      "Proveedor premium de tecnología. Excelente servicio postventa.",
    createdAt: "2023-09-05T14:00:00",
    updatedAt: "2024-12-01T09:10:00",
  },
  {
    id: 5,
    name: "Proveedora Central",
    contactPerson: "Miguel Torres",
    email: "miguel@proveedoracentral.com",
    phone: "+54 351 456-7890",
    address: "Av. Colón 456, Córdoba",
    paymentTerms: "30 días",
    rating: 3.5,
    isActive: false,
    observations: "Suspendido temporalmente por problemas de calidad.",
    createdAt: "2022-11-12T16:45:00",
    updatedAt: "2024-08-20T13:25:00",
  },
];

// Mock API for Suppliers
export const mockSupplierApi = {
  getAll: async (): Promise<Supplier[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...mockSuppliers];
  },

  getById: async (id: number): Promise<Supplier> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const supplier = mockSuppliers.find((s) => s.id === id);
    if (!supplier) {
      throw new Error("Proveedor no encontrado");
    }
    return { ...supplier };
  },

  create: async (supplierData: CreateSupplierRequest): Promise<Supplier> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newSupplier: Supplier = {
      id: Math.max(...mockSuppliers.map((s) => s.id)) + 1,
      ...supplierData,
      paymentTerms: "30 días",
      rating: 0,
      isActive: true,
      observations: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockSuppliers.push(newSupplier);
    return { ...newSupplier };
  },

  update: async (
    id: number,
    supplierData: Partial<CreateSupplierRequest>
  ): Promise<Supplier> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = mockSuppliers.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error("Proveedor no encontrado");
    }

    mockSuppliers[index] = {
      ...mockSuppliers[index],
      ...supplierData,
      updatedAt: new Date().toISOString(),
    };

    return { ...mockSuppliers[index] };
  },

  delete: async (id: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = mockSuppliers.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error("Proveedor no encontrado");
    }
    mockSuppliers.splice(index, 1);
  },

  search: async (query: string): Promise<Supplier[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const lowerQuery = query.toLowerCase();
    return mockSuppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(lowerQuery) ||
        supplier.contactPerson.toLowerCase().includes(lowerQuery) ||
        supplier.email.toLowerCase().includes(lowerQuery)
    );
  },

  getByStatus: async (isActive: boolean): Promise<Supplier[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockSuppliers.filter((supplier) => supplier.isActive === isActive);
  },

  updateRating: async (id: number, rating: number): Promise<Supplier> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = mockSuppliers.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error("Proveedor no encontrado");
    }

    mockSuppliers[index] = {
      ...mockSuppliers[index],
      rating,
      updatedAt: new Date().toISOString(),
    };

    return { ...mockSuppliers[index] };
  },
};

// Minimal mock products for Garantía display
export const mockProductos = [
  { id: 1, name: "Notebook Lenovo ThinkPad" },
  { id: 2, name: "Impresora HP LaserJet" },
];

// Minimal mock warranties for backend DTO compatibility
export const mockGarantiasBackend = [
  {
    id: 1,
    productId: 1,
    clientId: 1,
    warrantyNumber: "GAR-0001",
    startDate: "2024-01-15",
    endDate: "2025-01-15",
    status: "ACTIVE",
    type: "MANUFACTURER",
    description: "Garantía estándar",
    claims: [],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: 2,
    productId: 2,
    clientId: 2,
    warrantyNumber: "GAR-0002",
    startDate: "2023-08-20",
    endDate: "2025-08-20",
    status: "EXPIRED",
    type: "MANUFACTURER",
    description: "Garantía extendida",
    claims: [],
    createdAt: "2023-08-20",
    updatedAt: "2023-08-20",
  },
];

// Taller mock data
export const mockCategoriasProducto = [
  { id: 1, nombre: "Electrónica" },
  { id: 2, nombre: "Mecánica" },
];

export const mockProductosTerminados = [
  {
    id: 1,
    nombre: "Motor Eléctrico",
    descripcion: "Motor 1HP",
    precio: 12000,
    stockActual: 5,
    stockMinimo: 2,
    codigo: "MTR-001",
    categoriaProducto: { id: 1, nombre: "Electrónica" },
    activo: true,
    fechaCreacion: "2024-01-01",
  },
  {
    id: 2,
    nombre: "Bomba de Agua",
    descripcion: "Bomba sumergible",
    precio: 8000,
    stockActual: 10,
    stockMinimo: 3,
    codigo: "BMP-002",
    categoriaProducto: { id: 2, nombre: "Mecánica" },
    activo: true,
    fechaCreacion: "2024-02-01",
  },
];

export const mockMaterialesUtilizados = [
  {
    id: 1,
    ordenServicioId: 1,
    productoTerminadoId: 1,
    cantidad: 2,
    precioUnitario: 12000,
    subtotal: 24000,
  },
  {
    id: 2,
    ordenServicioId: 1,
    productoTerminadoId: 2,
    cantidad: 1,
    precioUnitario: 8000,
    subtotal: 8000,
  },
];

export const mockTareasServicio = [
  {
    id: 1,
    ordenServicioId: 1,
    descripcion: "Reemplazo de motor",
    horasEstimadas: 3,
    horasReales: 2,
    estado: "COMPLETADA",
    empleadoId: 1,
    fechaInicio: "2024-06-01",
    fechaFin: "2024-06-02",
    observaciones: "Trabajo realizado sin inconvenientes.",
  },
  {
    id: 2,
    ordenServicioId: 1,
    descripcion: "Prueba de funcionamiento",
    horasEstimadas: 1,
    horasReales: 1,
    estado: "COMPLETADA",
    empleadoId: 2,
    fechaInicio: "2024-06-02",
    fechaFin: "2024-06-02",
    observaciones: "Equipo funcionando correctamente.",
  },
];

export const mockOrdenesServicio = [
  {
    id: 1,
    numero: "OS-0001",
    clienteId: 1,
    fechaCreacion: "2024-06-01",
    estado: "CERRADA",
    descripcion: "Reparación de bomba de agua",
    materiales: mockMaterialesUtilizados,
    tareas: mockTareasServicio,
    observaciones: "Cliente satisfecho.",
  },
];

export const mockEmployees = [
  {
    id: 1,
    firstName: "Carlos",
    lastName: "Gómez",
    email: "carlos.gomez@empresa.com",
    phone: "+54 11 2222-3333",
    position: "Técnico",
    department: "Taller",
    salary: 120000,
    hireDate: "2022-01-10",
    isActive: true,
    createdAt: "2022-01-10",
    updatedAt: "2024-06-01",
  },
  {
    id: 2,
    firstName: "Lucía",
    lastName: "Fernández",
    email: "lucia.fernandez@empresa.com",
    phone: "+54 11 4444-5555",
    position: "Técnica",
    department: "Taller",
    salary: 125000,
    hireDate: "2023-03-15",
    isActive: true,
    createdAt: "2023-03-15",
    updatedAt: "2024-06-01",
  },
  {
    id: 3,
    firstName: "Miguel",
    lastName: "Pérez",
    email: "miguel.perez@empresa.com",
    phone: "+54 11 6666-7777",
    position: "Supervisor",
    department: "Taller",
    salary: 150000,
    hireDate: "2021-07-20",
    isActive: true,
    createdAt: "2021-07-20",
    updatedAt: "2024-06-01",
  },
];

export const mockPuestos = [
  {
    id: 1,
    nombre: "Técnico",
    descripcion: "Tareas técnicas",
    departamento: "Taller",
    salarioBase: 120000,
  },
  {
    id: 2,
    nombre: "Supervisor",
    descripcion: "Supervisión de equipo",
    departamento: "Taller",
    salarioBase: 150000,
  },
];

export const mockEmpleados = [
  {
    id: 1,
    nombre: "Carlos",
    apellido: "Gómez",
    dni: "20123456",
    email: "carlos.gomez@empresa.com",
    telefono: "+54 11 2222-3333",
    direccion: "Calle 123",
    fechaNacimiento: "1985-05-10",
    fechaIngreso: "2022-01-10",
    estado: "ACTIVO",
    puesto: { id: 1, nombre: "Técnico", salarioBase: 120000 },
    salario: 120000,
    asistencias: [],
    licencias: [],
    capacitaciones: [],
  },
  {
    id: 2,
    nombre: "Lucía",
    apellido: "Fernández",
    dni: "20987654",
    email: "lucia.fernandez@empresa.com",
    telefono: "+54 11 4444-5555",
    direccion: "Calle 456",
    fechaNacimiento: "1990-08-22",
    fechaIngreso: "2023-03-15",
    estado: "LICENCIA",
    puesto: { id: 1, nombre: "Técnico", salarioBase: 120000 },
    salario: 125000,
    asistencias: [],
    licencias: [],
    capacitaciones: [],
  },
  {
    id: 3,
    nombre: "Miguel",
    apellido: "Pérez",
    dni: "20333444",
    email: "miguel.perez@empresa.com",
    telefono: "+54 11 6666-7777",
    direccion: "Calle 789",
    fechaNacimiento: "1980-12-01",
    fechaIngreso: "2021-07-20",
    estado: "INACTIVO",
    puesto: { id: 2, nombre: "Supervisor", salarioBase: 150000 },
    salario: 150000,
    asistencias: [],
    licencias: [],
    capacitaciones: [],
  },
];

export const mockRegistroAsistencia = [
  {
    id: 1,
    empleado: { ...mockEmpleados[0] },
    fecha: "2025-07-01",
    horaEntrada: "08:00",
    horaSalida: "17:00",
    horasTrabajadas: 8,
    horasExtras: 1,
    observaciones: "Llegó puntual",
  },
  {
    id: 2,
    empleado: { ...mockEmpleados[1] },
    fecha: "2025-07-01",
    horaEntrada: "09:00",
    horaSalida: "18:00",
    horasTrabajadas: 7,
    horasExtras: 0,
    observaciones: "Llegó tarde",
  },
];

export const mockLicencias = [
  {
    id: 1,
    empleado: { ...mockEmpleados[1] },
    tipo: "VACACIONES",
    fechaInicio: "2025-07-10",
    fechaFin: "2025-07-20",
    dias: 10,
    motivo: "Vacaciones anuales",
    goceHaber: true,
    estado: "APROBADA",
  },
];

export const mockCapacitaciones = [
  {
    id: 1,
    empleado: { ...mockEmpleados[0] },
    nombre: "Curso de Electricidad",
    descripcion: "Capacitación en instalaciones eléctricas",
    institucion: "Instituto Técnico",
    fechaInicio: "2025-06-01",
    fechaFin: "2025-06-10",
    horas: 20,
    certificado: true,
    costo: 50000,
  },
];
