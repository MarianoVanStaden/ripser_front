import type { Cliente, ContactoCliente, CuentaCorriente, CreateClienteRequest, CreateContactoClienteRequest, CreateCuentaCorrienteRequest } from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';
import { arrayToPage } from '../../types/pagination.types';

// Mock data
const mockClientes: Cliente[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: 'Juan Carlos',
    apellido: 'Pérez',
    razonSocial: undefined,
    cuit: '20123456781',
    email: 'juan.perez@email.com',
    telefono: '+54 11 4567-8901',
    direccion: 'Av. Corrientes 1234',
    ciudad: 'Buenos Aires',
    provincia: 'CABA',
    codigoPostal: '1043',
    tipo: 'PERSONA_FISICA',
    estado: 'ACTIVO',
    limiteCredito: 50000,
    saldoActual: 12500,
    fechaAlta: '2024-01-15T10:30:00',
    fechaActualizacion: '2024-12-01T15:20:00',
    contactos: [],
    cuentaCorriente: [],
    ventas: []
  },
  {
    id: 2,
    empresaId: 1,
    nombre: 'Tecnología Global',
    apellido: undefined,
    razonSocial: 'Tecnología Global S.A.',
    cuit: '30712345679',
    email: 'contacto@tecglobal.com',
    telefono: '+54 11 5678-9012',
    direccion: 'Av. Santa Fe 2100',
    ciudad: 'Buenos Aires',
    provincia: 'CABA',
    codigoPostal: '1123',
    tipo: 'PERSONA_JURIDICA',
    estado: 'ACTIVO',
    limiteCredito: 200000,
    saldoActual: 75000,
    fechaAlta: '2024-03-20T09:15:00',
    fechaActualizacion: '2024-12-02T11:45:00',
    contactos: [],
    cuentaCorriente: [],
    ventas: []
  },
  {
    id: 3,
    empresaId: 1,
    nombre: 'María Elena',
    apellido: 'González',
    razonSocial: undefined,
    cuit: '27987654321',
    email: 'maria.gonzalez@email.com',
    telefono: '+54 11 6789-0123',
    direccion: 'Calle Falsa 123',
    ciudad: 'La Plata',
    provincia: 'BUENOS_AIRES',
    codigoPostal: '1900',
    tipo: 'PERSONA_FISICA',
    estado: 'MOROSO',
    limiteCredito: 30000,
    saldoActual: 45000,
    fechaAlta: '2024-02-10T14:22:00',
    fechaActualizacion: '2024-11-28T16:10:00',
    contactos: [],
    cuentaCorriente: [],
    ventas: []
  },
  {
    id: 4,
    empresaId: 1,
    nombre: 'Comercial del Sur',
    apellido: undefined,
    razonSocial: 'Comercial del Sur S.R.L.',
    cuit: '30654321987',
    email: 'info@comercialsur.com',
    telefono: '+54 221 789-0123',
    direccion: 'Ruta 2 Km 45',
    ciudad: 'Chascomús',
    provincia: 'BUENOS_AIRES',
    codigoPostal: '7130',
    tipo: 'PERSONA_JURIDICA',
    estado: 'SUSPENDIDO',
    limiteCredito: 100000,
    saldoActual: 25000,
    fechaAlta: '2024-05-08T08:00:00',
    fechaActualizacion: '2024-11-15T12:30:00',
    contactos: [],
    cuentaCorriente: [],
    ventas: []
  },
  {
    id: 5,
    empresaId: 1,
    nombre: 'Roberto',
    apellido: 'Silva',
    razonSocial: undefined,
    cuit: '20456789123',
    email: 'roberto.silva@email.com',
    telefono: '+54 11 7890-1234',
    direccion: 'Av. Rivadavia 5678',
    ciudad: 'Buenos Aires',
    provincia: 'CABA',
    codigoPostal: '1407',
    tipo: 'PERSONA_FISICA',
    estado: 'INACTIVO',
    limiteCredito: 25000,
    saldoActual: 0,
    fechaAlta: '2024-07-12T13:45:00',
    fechaActualizacion: '2024-10-20T09:15:00',
    contactos: [],
    cuentaCorriente: [],
    ventas: []
  }
];

const mockContactos: ContactoCliente[] = [
  {
    id: 1,
    clienteId: 1,
    fechaContacto: '2024-12-01T10:00:00',
    tipoContacto: 'LLAMADA',
    descripcion: 'Consulta sobre nuevo pedido de productos',
    resultado: 'Cliente interesado, solicita presupuesto',
    proximoContacto: '2024-12-10T14:00:00'
  },
  {
    id: 2,
    clienteId: 1,
    fechaContacto: '2024-11-28T15:30:00',
    tipoContacto: 'EMAIL',
    descripcion: 'Envío de catálogo de productos actualizados',
    resultado: 'Email enviado correctamente',
    proximoContacto: undefined
  },
  {
    id: 3,
    clienteId: 2,
    fechaContacto: '2024-12-02T09:15:00',
    tipoContacto: 'VISITA',
    descripcion: 'Reunión en oficinas del cliente para presentar nuevos servicios',
    resultado: 'Reunión exitosa, solicitan propuesta formal',
    proximoContacto: '2024-12-15T10:00:00'
  }
];

const mockCuentaCorriente: CuentaCorriente[] = [
  {
    id: 1,
    clienteId: 1,
    fecha: '2024-12-01T00:00:00',
    tipo: 'DEBITO',
    importe: 15000,
    concepto: 'Factura Nº 001-00123456',
    numeroComprobante: 'FAC-001-123456',
    saldo: 12500
  },
  {
    id: 2,
    clienteId: 1,
    fecha: '2024-11-25T00:00:00',
    tipo: 'CREDITO',
    importe: 5000,
    concepto: 'Pago recibo Nº 456',
    numeroComprobante: 'REC-456',
    saldo: -2500
  },
  {
    id: 3,
    clienteId: 2,
    fecha: '2024-12-02T00:00:00',
    tipo: 'DEBITO',
    importe: 80000,
    concepto: 'Factura servicios técnicos',
    numeroComprobante: 'FAC-002-789012',
    saldo: 75000
  }
];

let nextClienteId = 6;
let nextContactoId = 4;
let nextCuentaCorrienteId = 4;

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockClienteApi = {
  // Get all clients
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<Cliente>> => {
    await delay(500);
    return arrayToPage(mockClientes, pagination.page || 0, pagination.size || 20);
  },

  // Get client by ID
  getById: async (id: number): Promise<Cliente> => {
    await delay(300);
    const cliente = mockClientes.find(c => c.id === id);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    return { ...cliente };
  },

  // Create new client
  create: async (cliente: CreateClienteRequest): Promise<Cliente> => {
    await delay(800);
    const newCliente: Cliente = {
      id: nextClienteId++,
      empresaId: 1,
      ...cliente,
      saldoActual: 0,
      fechaAlta: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      contactos: [],
      cuentaCorriente: [],
      ventas: []
    };
    mockClientes.push(newCliente);
    return { ...newCliente };
  },

  // Update client
  update: async (id: number, cliente: Partial<CreateClienteRequest>): Promise<Cliente> => {
    await delay(600);
    const index = mockClientes.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente no encontrado');
    }
    
    const updatedCliente = {
      ...mockClientes[index],
      ...cliente,
      fechaActualizacion: new Date().toISOString()
    };
    
    mockClientes[index] = updatedCliente;
    return { ...updatedCliente };
  },

  // Delete client
  delete: async (id: number): Promise<void> => {
    await delay(400);
    const index = mockClientes.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente no encontrado');
    }
    mockClientes.splice(index, 1);
  },

  // Search clients
  search: async (query: string, pagination: PaginationParams = {}): Promise<PageResponse<Cliente>> => {
    await delay(300);
    const lowercaseQuery = query.toLowerCase();
    const results = mockClientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(lowercaseQuery) ||
      (cliente.apellido && cliente.apellido.toLowerCase().includes(lowercaseQuery)) ||
      (cliente.razonSocial && cliente.razonSocial.toLowerCase().includes(lowercaseQuery)) ||
      (cliente.email && cliente.email.toLowerCase().includes(lowercaseQuery)) ||
      (cliente.cuit && cliente.cuit.includes(query))
    );
    return arrayToPage(results, pagination.page || 0, pagination.size || 20);
  },

  // Get clients by state
  getByEstado: async (estado: string, pagination: PaginationParams = {}): Promise<PageResponse<Cliente>> => {
    await delay(300);
    const results = mockClientes.filter(c => c.estado === estado);
    return arrayToPage(results, pagination.page || 0, pagination.size || 20);
  },

  // Get clients by type
  getByTipo: async (tipo: string, pagination: PaginationParams = {}): Promise<PageResponse<Cliente>> => {
    await delay(300);
    const results = mockClientes.filter(c => c.tipo === tipo);
    return arrayToPage(results, pagination.page || 0, pagination.size || 20);
  },

  // Update client credit limit
  updateCreditLimit: async (id: number, limite: number): Promise<Cliente> => {
    await delay(400);
    const index = mockClientes.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente no encontrado');
    }
    
    mockClientes[index].limiteCredito = limite;
    mockClientes[index].fechaActualizacion = new Date().toISOString();
    return { ...mockClientes[index] };
  },

  // Update client state
  updateEstado: async (id: number, estado: string): Promise<Cliente> => {
    await delay(400);
    const index = mockClientes.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente no encontrado');
    }
    
    mockClientes[index].estado = estado as any;
    mockClientes[index].fechaActualizacion = new Date().toISOString();
    return { ...mockClientes[index] };
  }
};

export const mockContactoClienteApi = {
  // Get all contacts
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<ContactoCliente>> => {
    await delay(400);
    return arrayToPage(mockContactos, pagination.page || 0, pagination.size || 20);
  },

  // Get contact by ID
  getById: async (id: number): Promise<ContactoCliente> => {
    await delay(300);
    const contacto = mockContactos.find(c => c.id === id);
    if (!contacto) {
      throw new Error('Contacto no encontrado');
    }
    return { ...contacto };
  },

  // Get contacts by client ID
  getByClienteId: async (clienteId: number): Promise<ContactoCliente[]> => {
    await delay(300);
    return mockContactos.filter(c => c.clienteId === clienteId);
  },

  // Create new contact
  create: async (contacto: CreateContactoClienteRequest): Promise<ContactoCliente> => {
    await delay(600);
    const newContacto: ContactoCliente = {
      id: nextContactoId++,
      ...contacto
    };
    mockContactos.push(newContacto);
    return { ...newContacto };
  },

  // Update contact
  update: async (id: number, contacto: Partial<CreateContactoClienteRequest>): Promise<ContactoCliente> => {
    await delay(500);
    const index = mockContactos.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Contacto no encontrado');
    }
    
    const updatedContacto = {
      ...mockContactos[index],
      ...contacto
    };
    
    mockContactos[index] = updatedContacto;
    return { ...updatedContacto };
  },

  // Delete contact
  delete: async (id: number): Promise<void> => {
    await delay(300);
    const index = mockContactos.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Contacto no encontrado');
    }
    mockContactos.splice(index, 1);
  }
};

export const mockCuentaCorrienteApi = {
  // Get all movements
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<CuentaCorriente>> => {
    await delay(400);
    return arrayToPage(mockCuentaCorriente, pagination.page || 0, pagination.size || 20);
  },

  // Get movement by ID
  getById: async (id: number): Promise<CuentaCorriente> => {
    await delay(300);
    const movimiento = mockCuentaCorriente.find(m => m.id === id);
    if (!movimiento) {
      throw new Error('Movimiento no encontrado');
    }
    return { ...movimiento };
  },

  // Get movements by client ID
  getByClienteId: async (clienteId: number): Promise<CuentaCorriente[]> => {
    await delay(300);
    return mockCuentaCorriente.filter(m => m.clienteId === clienteId);
  },

  // Create new movement
  create: async (movimiento: CreateCuentaCorrienteRequest): Promise<CuentaCorriente> => {
    await delay(600);
    
    // Calculate new balance
    const clienteMovimientos = mockCuentaCorriente.filter(m => m.clienteId === movimiento.clienteId);
    const currentBalance = clienteMovimientos.reduce((total, mov) => {
      return mov.tipo === 'DEBITO' ? total + mov.importe : total - mov.importe;
    }, 0);
    
    const newBalance = movimiento.tipo === 'DEBITO' 
      ? currentBalance + movimiento.importe 
      : currentBalance - movimiento.importe;
    
    const newMovimiento: CuentaCorriente = {
      id: nextCuentaCorrienteId++,
      ...movimiento,
      saldo: newBalance
    };
    
    mockCuentaCorriente.push(newMovimiento);
    
    // Update client balance
    const clienteIndex = mockClientes.findIndex(c => c.id === movimiento.clienteId);
    if (clienteIndex !== -1) {
      mockClientes[clienteIndex].saldoActual = newBalance;
    }
    
    return { ...newMovimiento };
  },

  // Update movement
  update: async (id: number, movimiento: Partial<CreateCuentaCorrienteRequest>): Promise<CuentaCorriente> => {
    await delay(500);
    const index = mockCuentaCorriente.findIndex(m => m.id === id);
    if (index === -1) {
      throw new Error('Movimiento no encontrado');
    }
    
    const updatedMovimiento = {
      ...mockCuentaCorriente[index],
      ...movimiento
    };
    
    mockCuentaCorriente[index] = updatedMovimiento;
    return { ...updatedMovimiento };
  },

  // Delete movement
  delete: async (id: number): Promise<void> => {
    await delay(300);
    const index = mockCuentaCorriente.findIndex(m => m.id === id);
    if (index === -1) {
      throw new Error('Movimiento no encontrado');
    }
    mockCuentaCorriente.splice(index, 1);
  }
};
