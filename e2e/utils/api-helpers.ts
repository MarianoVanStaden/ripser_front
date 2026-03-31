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
  }

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

  readonly productos = {
    create: async (data: object) => {
      const res = await this.client.post('/api/productos', data);
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
      return res.data;
    },

    convertToNotaPedido: async (data: {
      presupuestoId: number;
      metodoPago: string;
      tipoIva: string;
    }) => {
      const res = await this.client.post('/api/documentos/nota-pedido', data);
      return res.data;
    },

    convertToFactura: async (data: { notaPedidoId: number }) => {
      const res = await this.client.post('/api/documentos/factura', data);
      return res.data;
    },

    createNotaCredito: async (data: {
      facturaId: number;
      usuarioId: number;
      observaciones?: string;
    }) => {
      const res = await this.client.post('/api/documentos/nota-credito', data);
      return res.data;
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
