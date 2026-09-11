import axios, { AxiosInstance } from 'axios';
import { ENV } from './env';

/**
 * ApiHelpers — direct REST API client for test setup and teardown.
 *
 * Purpose: seed or clean up data WITHOUT going through the UI.
 * This makes tests faster and more deterministic.
 *
 * Usage:
 *   const api = new ApiHelpers();
 *   await api.authenticate();
 *   const cliente = await api.clientes.create(DataFactory.cliente());
 *   // ... run test ...
 *   await api.clientes.delete(cliente.id);
 */
export class ApiHelpers {
  private readonly client: AxiosInstance;
  private token: string | null = null;

  /** Token real de la sesión — los specs híbridos lo inyectan al browser. */
  get authToken(): string | null {
    return this.token;
  }

  constructor() {
    this.client = axios.create({
      baseURL: ENV.API_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-Empresa-Id': String(ENV.EMPRESA_ID),
      },
    });

    // Attach the Bearer token to every request once authenticated
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  // ─── Authentication ────────────────────────────────────────────────────────

  async authenticate(
    username = ENV.USERNAME,
    password = ENV.PASSWORD
  ): Promise<void> {
    const { data } = await this.client.post('/api/auth/login', {
      usernameOrEmail: username,
      password,
    });
    this.token = data.accessToken ?? data.token;
    // Id real del usuario autenticado — los specs lo usan en payloads que
    // referencian usuario (un id hardcodeado no sobrevive entre DBs).
    this.userId = data.user?.id ?? data.id ?? null;
  }

  /** Id del usuario autenticado (seteado por authenticate()). */
  userId: number | null = null;

  // ─── Clientes ──────────────────────────────────────────────────────────────

  readonly clientes = {
    create: async (data: object) => {
      const res = await this.client.post('/api/clientes', data);
      return res.data;
    },

    update: async (id: number, data: object) => {
      const res = await this.client.put(`/api/clientes/${id}`, data);
      return res.data;
    },

    delete: async (id: number) => {
      await this.client.delete(`/api/clientes/${id}`);
    },

    findByDni: async (dni: string) => {
      const res = await this.client.get('/api/clientes', { params: { dni } });
      return res.data?.content?.[0] ?? null;
    },
  };

  // ─── Productos ─────────────────────────────────────────────────────────────

  /** Cache de la categoría default para seeds (el DTO la exige desde sep-2026). */
  private seedCategoriaId: number | null = null;

  private async ensureCategoriaProducto(): Promise<number> {
    if (this.seedCategoriaId != null) return this.seedCategoriaId;
    // Reusar una existente si hay; si no, crear una propia del harness.
    try {
      const res = await this.client.get('/api/categorias-productos');
      const list = res.data?.content ?? res.data ?? [];
      if (Array.isArray(list) && list.length > 0 && list[0].id != null) {
        this.seedCategoriaId = list[0].id;
        return this.seedCategoriaId!;
      }
    } catch {
      /* cae al create */
    }
    const created = await this.categoriasProducto.create({
      nombre: `E2E Seeds ${Date.now()}`,
      descripcion: 'categoría creada por el harness e2e',
      activo: true,
      esReventa: false,
    });
    this.seedCategoriaId = created.id ?? created.data?.id;
    return this.seedCategoriaId!;
  }

  readonly productos = {
    /**
     * Contrato ProductoCreateDTO (sep-2026): `stockActual` (no `stock`) y
     * `categoriaProductoId` son @NotNull. Normalizamos acá para que los specs
     * y la DataFactory viejos sigan andando sin tocar cada call site.
     */
    create: async (data: Record<string, unknown>) => {
      const payload: Record<string, unknown> = { ...data };
      if (payload.stock != null && payload.stockActual == null) {
        payload.stockActual = payload.stock;
        delete payload.stock;
      }
      if (payload.categoriaProductoId == null) {
        payload.categoriaProductoId = await this.ensureCategoriaProducto();
      }
      const res = await this.client.post('/api/productos', payload);
      return res.data;
    },

    update: async (id: number, data: object) => {
      const res = await this.client.put(`/api/productos/${id}`, data);
      return res.data;
    },

    delete: async (id: number) => {
      await this.client.delete(`/api/productos/${id}`);
    },

    getLowStock: async () => {
      const res = await this.client.get('/api/productos/bajo-stock');
      return res.data;
    },
  };

  // ─── Productos Terminados (reventa) ───────────────────────────────────────

  readonly productosTerminados = {
    create: async (data: object) => {
      const res = await this.client.post('/api/productos-terminados', data);
      return res.data;
    },

    update: async (id: number, data: object) => {
      const res = await this.client.put(`/api/productos-terminados/${id}`, data);
      return res.data;
    },

    delete: async (id: number) => {
      await this.client.delete(`/api/productos-terminados/${id}`);
    },

    getById: async (id: number) => {
      const res = await this.client.get(`/api/productos-terminados/${id}`);
      return res.data;
    },
  };

  // ─── Categorías de Producto ───────────────────────────────────────────────

  readonly categoriasProducto = {
    create: async (data: object) => {
      const res = await this.client.post('/api/categorias-productos', data);
      return res.data;
    },

    delete: async (id: number) => {
      await this.client.delete(`/api/categorias-productos/${id}`);
    },
  };

  // ─── Leads ─────────────────────────────────────────────────────────────────

  readonly leads = {
    create: async (data: object) => {
      const res = await this.client.post('/api/leads', data);
      return res.data;
    },

    update: async (id: number, data: object) => {
      const res = await this.client.put(`/api/leads/${id}`, data);
      return res.data;
    },

    delete: async (id: number) => {
      await this.client.delete(`/api/leads/${id}`);
    },

    getById: async (id: number) => {
      const res = await this.client.get(`/api/leads/${id}`);
      return res.data;
    },
  };

  // ─── Equipos Fabricados ─────────────────────────────────────────────────────

  readonly equipos = {
    create: async (data: object) => {
      const res = await this.client.post('/api/equipos-fabricados', data);
      return res.data;
    },

    update: async (id: number, data: object) => {
      const res = await this.client.put(`/api/equipos-fabricados/${id}`, data);
      return res.data;
    },

    delete: async (id: number) => {
      await this.client.delete(`/api/equipos-fabricados/${id}`);
    },

    getById: async (id: number) => {
      const res = await this.client.get(`/api/equipos-fabricados/${id}`);
      return res.data;
    },
  };

  // ─── Órdenes de Servicio ────────────────────────────────────────────────────

  readonly ordenes = {
    create: async (data: object) => {
      const res = await this.client.post('/api/ordenes-servicio', data);
      return res.data;
    },

    update: async (id: number, data: object) => {
      const res = await this.client.put(`/api/ordenes-servicio/${id}`, data);
      return res.data;
    },

    delete: async (id: number) => {
      await this.client.delete(`/api/ordenes-servicio/${id}`);
    },
  };

  // ─── Garantías ──────────────────────────────────────────────────────────────

  readonly garantias = {
    create: async (data: object) => {
      const res = await this.client.post('/api/garantias', data);
      return res.data;
    },

    delete: async (id: number) => {
      await this.client.delete(`/api/garantias/${id}`);
    },

    getById: async (id: number) => {
      const res = await this.client.get(`/api/garantias/${id}`);
      return res.data;
    },
  };

  // ─── Ventas ────────────────────────────────────────────────────────────────

  readonly presupuestos = {
    create: async (data: object) => {
      const res = await this.client.post('/api/presupuestos', data);
      return res.data;
    },

    delete: async (id: number) => {
      await this.client.delete(`/api/presupuestos/${id}`);
    },
  };

  // ─── Documentos Comerciales ────────────────────────────────────────────────

  /**
   * El API de documentos cambió de shape (sep-2026): las conversiones
   * devuelven `{ documento: DocumentoComercialDTO, ... }` y el número vive en
   * `numeroDocumento` (no `numero`). Normalizamos para que los specs sigan
   * leyendo `doc.id` / `doc.numero`.
   */
  private unwrapDocumento(data: any) {
    const doc = data?.documento ?? data;
    if (doc && doc.numero == null && doc.numeroDocumento != null) {
      doc.numero = doc.numeroDocumento;
    }
    return doc;
  }

  readonly documentos = {
    createPresupuesto: async (data: {
      clienteId: number;
      usuarioId: number;
      tipoIva: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
      detalles: Array<{
        tipoItem: 'PRODUCTO';
        productoId: number;
        cantidad: number;
        precioUnitario: number;
        descripcion: string;
      }>;
      observaciones?: string;
    }) => {
      const res = await this.client.post('/api/documentos/presupuesto', data);
      return this.unwrapDocumento(res.data);
    },

    convertToNotaPedido: async (data: {
      presupuestoId: number;
      metodoPago: string;
      tipoIva: string;
    }) => {
      const res = await this.client.post('/api/documentos/nota-pedido', data);
      return this.unwrapDocumento(res.data);
    },

    /** PUT /api/documentos/{id}/estado — body: el enum EstadoDocumento como JSON string. */
    updateEstado: async (id: number, estado: string) => {
      const res = await this.client.put(`/api/documentos/${id}/estado`, JSON.stringify(estado), {
        headers: { 'Content-Type': 'application/json' },
      });
      return this.unwrapDocumento(res.data);
    },

    convertToFactura: async (data: { notaPedidoId: number }) => {
      // Regla de negocio (sep-2026): la nota de pedido debe estar APROBADA
      // antes de convertirse a factura. La suite modela la cadena completa,
      // así que aprobamos como paso previo (idempotente si ya está aprobada).
      await this.documentos
        .updateEstado(data.notaPedidoId, 'APROBADO')
        .catch(() => {});
      const res = await this.client.post('/api/documentos/factura', data);
      return this.unwrapDocumento(res.data);
    },

    createNotaCredito: async (data: {
      facturaId: number;
      usuarioId: number;
      observaciones?: string;
    }) => {
      const res = await this.client.post('/api/documentos/nota-credito', data);
      return this.unwrapDocumento(res.data);
    },

    getByTipo: async (tipo: string) => {
      const res = await this.client.get(
        `/api/documentos/tipo/${encodeURIComponent(tipo)}`,
        { params: { page: 0, size: 100 } }
      );
      return res.data?.content ?? res.data;
    },

    getByCliente: async (clienteId: number) => {
      const res = await this.client.get(`/api/documentos/cliente/${clienteId}`);
      return res.data;
    },

    getById: async (id: number) => {
      const res = await this.client.get(`/api/documentos/${id}`);
      return res.data;
    },
  };
}
