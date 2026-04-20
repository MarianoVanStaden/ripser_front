import { faker } from '@faker-js/faker/locale/es';

/**
 * DataFactory — generates realistic, unique test data for each E2E run.
 *
 * Using faker/locale/es ensures Spanish names, phone formats, and addresses
 * that match what the ERP users would actually enter.
 *
 * Each factory method returns a plain object ready to use in form fills or
 * direct API seeding via ApiHelpers.
 */
export class DataFactory {
  // ─── Clientes ──────────────────────────────────────────────────────────────

  static cliente(overrides: Partial<{
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    tipo: string;
    estado: string;
    dni: string;
    direccion: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
    notas: string;
  }> = {}) {
    const suffix = DataFactory.uniqueSuffix();
    return {
      nombre: faker.person.firstName(),
      apellido: faker.person.lastName(),
      email: `test${suffix}@example.com`.toLowerCase(),
      telefono: faker.phone.number('##########'),
      tipo: 'PERSONA_FISICA' as const,
      estado: 'ACTIVO' as const,
      dni: faker.string.numeric(8),
      direccion: faker.location.streetAddress(),
      ciudad: faker.location.city(),
      provincia: faker.location.state(),
      codigoPostal: faker.location.zipCode('####'),
      notas: faker.lorem.sentence(),
      ...overrides,
    };
  }

  // ─── Productos ─────────────────────────────────────────────────────────────

  static producto(overrides: Partial<ReturnType<typeof DataFactory.producto>> = {}) {
    return {
      nombre: faker.commerce.productName(),
      descripcion: faker.commerce.productDescription(),
      precio: Number(faker.commerce.price({ min: 100, max: 50_000, dec: 2 })),
      costo: Number(faker.commerce.price({ min: 50, max: 25_000, dec: 2 })),
      stock: faker.number.int({ min: 10, max: 500 }),
      stockMinimo: faker.number.int({ min: 1, max: 5 }),
      codigo: faker.string.alphanumeric(8).toUpperCase(),
      ...overrides,
    };
  }

  static categoriaProducto(overrides: Partial<{ nombre: string; descripcion: string; activo: boolean; esReventa: boolean }> = {}) {
    return {
      nombre: this.uniqueName('Cat'),
      descripcion: faker.commerce.department(),
      activo: true,
      esReventa: false,
      ...overrides,
    };
  }

  static productoTerminado(overrides: Partial<{
    nombre: string;
    descripcion: string;
    precio: number;
    costo: number;
    stockActual: number;
    stockMinimo: number;
    codigo: string;
    categoriaProductoId: number;
    activo: boolean;
  }> = {}) {
    return {
      nombre: this.uniqueName('Reventa'),
      descripcion: faker.commerce.productDescription(),
      precio: Number(faker.commerce.price({ min: 100_000, max: 1_500_000, dec: 2 })),
      costo: Number(faker.commerce.price({ min: 50_000, max: 1_000_000, dec: 2 })),
      stockActual: faker.number.int({ min: 1, max: 50 }),
      stockMinimo: faker.number.int({ min: 1, max: 5 }),
      codigo: 'REV-' + faker.string.alphanumeric(6).toUpperCase(),
      activo: true,
      ...overrides,
    };
  }

  // ─── Ventas ────────────────────────────────────────────────────────────────

  static presupuesto(clienteId: number, items: { productoId: number; cantidad: number }[]) {
    return {
      clienteId,
      items,
      descuento: faker.number.float({ min: 0, max: 20, fractionDigits: 2 }),
      observaciones: faker.lorem.sentence(),
      validezDias: faker.helpers.arrayElement([15, 30, 60]),
    };
  }

  // ─── Leads ─────────────────────────────────────────────────────────────────

  static lead(overrides: Partial<{
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    canal: string;
    estadoLead: string;
    prioridad: string;
    provincia: string;
    fechaPrimerContacto: string;
    notas: string;
  }> = {}) {
    return {
      nombre: faker.person.firstName(),
      apellido: faker.person.lastName(),
      telefono: faker.phone.number('##########'),
      email: `lead${DataFactory.uniqueSuffix()}@example.com`.toLowerCase(),
      canal: 'WHATSAPP' as const,
      estadoLead: 'PRIMER_CONTACTO' as const,
      prioridad: 'WARM' as const,
      provincia: 'BUENOS_AIRES',
      fechaPrimerContacto: new Date().toISOString().split('T')[0],
      notas: faker.lorem.sentence(),
      ...overrides,
    };
  }

  // ─── Equipos Fabricados ────────────────────────────────────────────────────

  static equipo(overrides: Partial<{
    tipoEquipo: string;
    modelo: string;
    medida: string;
    descripcion: string;
  }> = {}) {
    return {
      tipoEquipo: 'HELADERA' as const,
      modelo: faker.helpers.arrayElement(['Modelo A', 'Modelo B', 'Modelo C']),
      medida: '1.0m',
      descripcion: faker.lorem.sentence(),
      ...overrides,
    };
  }

  // ─── Órdenes de Servicio ───────────────────────────────────────────────────

  static ordenServicio(overrides: Partial<{
    descripcionTrabajo: string;
    observaciones: string;
    estado: string;
    fechaEstimada: string;
  }> = {}) {
    const suffix = DataFactory.uniqueSuffix();
    return {
      descripcionTrabajo: `Reparación${suffix}`,
      observaciones: faker.lorem.sentence(),
      estado: 'PENDIENTE' as const,
      fechaEstimada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ...overrides,
    };
  }

  // ─── Garantías ─────────────────────────────────────────────────────────────

  static garantia(overrides: Partial<{
    equipoFabricadoId: number;
    ventaId: number;
    numeroSerie: string;
    fechaCompra: string;
    fechaVencimiento: string;
    observaciones: string;
  }> = {}) {
    const suffix = DataFactory.uniqueSuffix();
    const fechaCompra = new Date().toISOString().split('T')[0];
    const fechaVenc = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return {
      numeroSerie: `SN${suffix}`.slice(0, 20),
      fechaCompra,
      fechaVencimiento: fechaVenc,
      observaciones: faker.lorem.sentence(),
      ...overrides,
    };
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  static credentials(overrides: { username?: string; password?: string } = {}) {
    return {
      username: overrides.username ?? 'admin',
      password: overrides.password ?? 'admin123',
    };
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  /** Generates a unique suffix to avoid collisions across parallel test runs. */
  static uniqueSuffix(): string {
    return `_test_${Date.now()}_${faker.string.alphanumeric(4)}`;
  }

  /** Generates a unique name by appending a test suffix. */
  static uniqueName(base: string): string {
    return `${base}${DataFactory.uniqueSuffix()}`;
  }
}

// ─── DocumentoFactory ──────────────────────────────────────────────────────────

/**
 * DocumentoFactory — generates payloads for the documentos comerciales API.
 *
 * Each method returns a plain object matching the exact shape expected by the
 * corresponding POST /api/documentos/* endpoint.
 */
export class DocumentoFactory {
  /**
   * Payload for POST /api/documentos/presupuesto
   * Creates a presupuesto with a single product line item.
   */
  static presupuestoPayload(
    clienteId: number,
    usuarioId: number,
    productoId: number,
    precio: number
  ): {
    clienteId: number;
    usuarioId: number;
    tipoIva: 'IVA_21';
    detalles: Array<{
      tipoItem: 'PRODUCTO';
      productoId: number;
      cantidad: number;
      precioUnitario: number;
      descripcion: string;
    }>;
    observaciones: string;
  } {
    return {
      clienteId,
      usuarioId,
      tipoIva: 'IVA_21',
      detalles: [
        {
          tipoItem: 'PRODUCTO',
          productoId,
          cantidad: faker.number.int({ min: 1, max: 5 }),
          precioUnitario: precio,
          descripcion: faker.commerce.productName(),
        },
      ],
      observaciones: faker.lorem.sentence(),
    };
  }

  /**
   * Payload for POST /api/documentos/nota-pedido
   * Converts an existing presupuesto to a nota de pedido.
   */
  static notaPedidoPayload(presupuestoId: number): {
    presupuestoId: number;
    metodoPago: 'EFECTIVO';
    tipoIva: 'IVA_21';
  } {
    return {
      presupuestoId,
      metodoPago: 'EFECTIVO',
      tipoIva: 'IVA_21',
    };
  }

  /**
   * Payload for POST /api/documentos/factura
   * Converts an existing nota de pedido to a factura.
   */
  static facturaPayload(notaPedidoId: number): { notaPedidoId: number } {
    return { notaPedidoId };
  }

  /**
   * Payload for POST /api/documentos/nota-credito
   * Creates a nota de crédito against an existing factura.
   */
  static notaCreditoPayload(
    facturaId: number,
    usuarioId: number,
    observaciones?: string
  ): {
    facturaId: number;
    usuarioId: number;
    observaciones?: string;
  } {
    return {
      facturaId,
      usuarioId,
      observaciones: observaciones ?? faker.lorem.sentence(),
    };
  }
}
