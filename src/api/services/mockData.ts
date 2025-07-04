import type { Cliente, ContactoCliente, CuentaCorriente, CreateClienteRequest, CreateContactoClienteRequest, CreateCuentaCorrienteRequest } from '../../types';

// Mock data for testing
export const mockClientes: Cliente[] = [
  {
    id: 1,
    nombre: 'Juan Carlos',
    apellido: 'Pérez',
    cuit: '20-12345678-9',
    email: 'juan.perez@email.com',
    telefono: '+54 11 1234-5678',
    direccion: 'Av. Corrientes 1234',
    ciudad: 'Buenos Aires',
    provincia: 'CABA',
    codigoPostal: '1043',
    tipo: 'PERSONA_FISICA',
    estado: 'ACTIVO',
    limiteCredito: 50000,
    saldoActual: 15000,
    fechaAlta: '2024-01-15T10:00:00',
    fechaActualizacion: '2024-12-01T14:30:00'
  },
  {
    id: 2,
    nombre: 'Distribuidora San Martín',
    razonSocial: 'Distribuidora San Martín S.R.L.',
    cuit: '30-67890123-4',
    email: 'ventas@distribuidorasanmartin.com',
    telefono: '+54 11 9876-5432',
    direccion: 'Av. San Martín 567',
    ciudad: 'San Martín',
    provincia: 'Buenos Aires',
    codigoPostal: '1650',
    tipo: 'PERSONA_JURIDICA',
    estado: 'ACTIVO',
    limiteCredito: 200000,
    saldoActual: 85000,
    fechaAlta: '2023-08-20T09:15:00',
    fechaActualizacion: '2024-11-15T16:45:00'
  },
  {
    id: 3,
    nombre: 'María Elena',
    apellido: 'González',
    cuit: '27-87654321-0',
    email: 'maria.gonzalez@gmail.com',
    telefono: '+54 351 444-7890',
    direccion: 'Belgrano 890',
    ciudad: 'Córdoba',
    provincia: 'Córdoba',
    codigoPostal: '5000',
    tipo: 'PERSONA_FISICA',
    estado: 'MOROSO',
    limiteCredito: 30000,
    saldoActual: 35000,
    fechaAlta: '2023-03-10T11:30:00',
    fechaActualizacion: '2024-10-20T13:20:00'
  },
  {
    id: 4,
    nombre: 'Comercial Norte',
    razonSocial: 'Comercial Norte S.A.',
    cuit: '30-11223344-5',
    email: 'info@comercialnorte.com.ar',
    telefono: '+54 381 555-0123',
    direccion: 'Ruta Nacional 9 Km 1200',
    ciudad: 'San Miguel de Tucumán',
    provincia: 'Tucumán',
    codigoPostal: '4000',
    tipo: 'PERSONA_JURIDICA',
    estado: 'SUSPENDIDO',
    limiteCredito: 150000,
    saldoActual: 0,
    fechaAlta: '2022-11-05T08:00:00',
    fechaActualizacion: '2024-09-10T10:15:00'
  },
  {
    id: 5,
    nombre: 'Roberto',
    apellido: 'Martínez',
    cuit: '20-99887766-3',
    email: 'roberto.martinez@hotmail.com',
    telefono: '+54 261 333-4567',
    direccion: 'Las Heras 456',
    ciudad: 'Mendoza',
    provincia: 'Mendoza',
    codigoPostal: '5500',
    tipo: 'PERSONA_FISICA',
    estado: 'INACTIVO',
    limiteCredito: 25000,
    saldoActual: 5000,
    fechaAlta: '2024-05-22T14:00:00',
    fechaActualizacion: '2024-08-30T09:45:00'
  }
];

export const mockContactos: ContactoCliente[] = [
  {
    id: 1,
    clienteId: 1,
    fechaContacto: '2024-12-01T10:00:00',
    tipoContacto: 'LLAMADA',
    descripcion: 'Contacto para seguimiento de pago pendiente. Cliente confirmó que realizará el pago la próxima semana.',
    resultado: 'Compromiso de pago para el 15/12/2024',
    proximoContacto: '2024-12-15T09:00:00'
  },
  {
    id: 2,
    clienteId: 1,
    fechaContacto: '2024-11-20T14:30:00',
    tipoContacto: 'EMAIL',
    descripcion: 'Envío de catálogo de nuevos productos y lista de precios actualizada.',
    resultado: 'Cliente interesado en productos de la línea premium'
  },
  {
    id: 3,
    clienteId: 2,
    fechaContacto: '2024-11-25T11:15:00',
    tipoContacto: 'VISITA',
    descripcion: 'Visita comercial para presentar nueva línea de productos y negociar condiciones de compra.',
    resultado: 'Pedido confirmado por $45,000. Entrega programada para el 10/12/2024',
    proximoContacto: '2024-12-10T08:00:00'
  },
  {
    id: 4,
    clienteId: 3,
    fechaContacto: '2024-10-15T16:00:00',
    tipoContacto: 'LLAMADA',
    descripcion: 'Gestión de cobranza. Cliente solicita refinanciación de deuda.',
    resultado: 'Acuerdo de refinanciación en 6 cuotas'
  }
];

export const mockCuentaCorriente: CuentaCorriente[] = [
  {
    id: 1,
    clienteId: 1,
    fecha: '2024-12-01T00:00:00',
    tipo: 'DEBITO',
    importe: 25000,
    concepto: 'Factura Nº 001-00001234 - Venta de mercadería',
    numeroComprobante: 'FAC-001234',
    saldo: 15000
  },
  {
    id: 2,
    clienteId: 1,
    fecha: '2024-11-15T00:00:00',
    tipo: 'CREDITO',
    importe: 10000,
    concepto: 'Pago recibido - Transferencia bancaria',
    numeroComprobante: 'REC-000567',
    saldo: -10000
  },
  {
    id: 3,
    clienteId: 2,
    fecha: '2024-11-30T00:00:00',
    tipo: 'DEBITO',
    importe: 45000,
    concepto: 'Factura Nº 001-00001256 - Pedido especial',
    numeroComprobante: 'FAC-001256',
    saldo: 85000
  },
  {
    id: 4,
    clienteId: 2,
    fecha: '2024-11-01T00:00:00',
    tipo: 'DEBITO',
    importe: 40000,
    concepto: 'Factura Nº 001-00001201 - Compra mensual',
    numeroComprobante: 'FAC-001201',
    saldo: 40000
  },
  {
    id: 5,
    clienteId: 3,
    fecha: '2024-10-10T00:00:00',
    tipo: 'DEBITO',
    importe: 15000,
    concepto: 'Factura Nº 001-00001145 - Venta de productos',
    numeroComprobante: 'FAC-001145',
    saldo: 35000
  },
  {
    id: 6,
    clienteId: 3,
    fecha: '2024-09-15T00:00:00',
    tipo: 'DEBITO',
    importe: 20000,
    concepto: 'Factura Nº 001-00001098 - Compra de insumos',
    numeroComprobante: 'FAC-001098',
    saldo: 20000
  }
];

// Mock API functions
export const mockClienteApi = {
  getAll: async (): Promise<Cliente[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return [...mockClientes];
  },

  getById: async (id: number): Promise<Cliente> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const cliente = mockClientes.find(c => c.id === id);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    return { ...cliente };
  },

  create: async (cliente: CreateClienteRequest): Promise<Cliente> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newCliente: Cliente = {
      ...cliente,
      id: Math.max(...mockClientes.map(c => c.id)) + 1,
      saldoActual: 0,
      fechaAlta: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    };
    mockClientes.push(newCliente);
    return { ...newCliente };
  },

  update: async (id: number, cliente: CreateClienteRequest): Promise<Cliente> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const index = mockClientes.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente no encontrado');
    }
    const updatedCliente: Cliente = {
      ...mockClientes[index],
      ...cliente,
      fechaActualizacion: new Date().toISOString()
    };
    mockClientes[index] = updatedCliente;
    return { ...updatedCliente };
  },

  delete: async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockClientes.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente no encontrado');
    }
    mockClientes.splice(index, 1);
  },

  search: async (query: string): Promise<Cliente[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const lowercaseQuery = query.toLowerCase();
    return mockClientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(lowercaseQuery) ||
      (cliente.apellido && cliente.apellido.toLowerCase().includes(lowercaseQuery)) ||
      (cliente.razonSocial && cliente.razonSocial.toLowerCase().includes(lowercaseQuery)) ||
      (cliente.cuit && cliente.cuit.includes(query)) ||
      (cliente.email && cliente.email.toLowerCase().includes(lowercaseQuery))
    );
  }
};

export const mockContactoClienteApi = {
  getByClienteId: async (clienteId: number): Promise<ContactoCliente[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockContactos.filter(c => c.clienteId === clienteId);
  },

  create: async (contacto: CreateContactoClienteRequest): Promise<ContactoCliente> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const newContacto: ContactoCliente = {
      ...contacto,
      id: Math.max(...mockContactos.map(c => c.id)) + 1
    };
    mockContactos.push(newContacto);
    return { ...newContacto };
  },

  update: async (id: number, contacto: CreateContactoClienteRequest): Promise<ContactoCliente> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const index = mockContactos.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Contacto no encontrado');
    }
    const updatedContacto: ContactoCliente = {
      ...mockContactos[index],
      ...contacto
    };
    mockContactos[index] = updatedContacto;
    return { ...updatedContacto };
  },

  delete: async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = mockContactos.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Contacto no encontrado');
    }
    mockContactos.splice(index, 1);
  }
};

export const mockCuentaCorrienteApi = {
  getByClienteId: async (clienteId: number): Promise<CuentaCorriente[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockCuentaCorriente.filter(c => c.clienteId === clienteId);
  },

  create: async (movimiento: CreateCuentaCorrienteRequest): Promise<CuentaCorriente> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Calculate new balance
    const clienteMovimientos = mockCuentaCorriente.filter(m => m.clienteId === movimiento.clienteId);
    const currentBalance = clienteMovimientos.reduce((total, mov) => {
      return mov.tipo === 'DEBITO' ? total + mov.importe : total - mov.importe;
    }, 0);
    
    const newBalance = movimiento.tipo === 'DEBITO' 
      ? currentBalance + movimiento.importe 
      : currentBalance - movimiento.importe;

    const newMovimiento: CuentaCorriente = {
      ...movimiento,
      id: Math.max(...mockCuentaCorriente.map(c => c.id)) + 1,
      saldo: newBalance
    };
    
    mockCuentaCorriente.push(newMovimiento);
    
    // Update client balance
    const cliente = mockClientes.find(c => c.id === movimiento.clienteId);
    if (cliente) {
      cliente.saldoActual = newBalance;
    }
    
    return { ...newMovimiento };
  }
};
