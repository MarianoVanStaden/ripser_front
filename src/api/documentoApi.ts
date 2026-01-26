import axios from "axios";
import type {
  DocumentoComercial,
  EstadoDocumento,
  DetalleDocumentoDTO
} from "../types";

type DocumentoPresupuestoPayload = {
  clienteId: number;
  usuarioId: number;
  tipoIva: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
  observaciones?: string;
  detalles: DetalleDocumentoDTO[];
};

// Use environment variable for API base URL with correct endpoint
// In production with Nginx proxy, use relative URLs
const API_URL = (import.meta.env.VITE_API_URL || "/api") + "/documentos";

export const documentoApi = {
  // Get documents by type (PRESUPUESTO, NOTA_PEDIDO, FACTURA)
  getByTipo: async (tipo: "PRESUPUESTO" | "NOTA_PEDIDO" | "FACTURA"): Promise<DocumentoComercial[]> => {
    try {
      const res = await axios.get(`${API_URL}/tipo/${tipo}`);
      return res.data;
    } catch (error) {
      console.error(`Error fetching documentos by tipo ${tipo}:`, error);
      throw error;
    }
  },

  // Create a new presupuesto
  createPresupuesto: async (data: DocumentoPresupuestoPayload): Promise<DocumentoComercial> => {
    try {
      const res = await axios.post(`${API_URL}/presupuesto`, {
        ...data,
        tipoIva: data.tipoIva ?? 'IVA_21',
      });
      return res.data;
    } catch (error) {
      console.error("Error creating presupuesto:", error);
      throw error;
    }
  },

  // Update the estado of a documento
  updateEstado: async (id: number, estado: EstadoDocumento): Promise<DocumentoComercial> => {
    try {
      const res = await axios.put(`${API_URL}/${id}/estado`, estado, {
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    } catch (error) {
      console.error("Error updating estado:", error);
      throw error;
    }
  },

  // Get documento by ID
  getById: async (id: number): Promise<DocumentoComercial> => {
    try {
      const res = await axios.get(`${API_URL}/${id}`);
      return res.data;
    } catch (error) {
      console.error("Error fetching documento by ID:", error);
      throw error;
    }
  },

  // Get documentos by cliente
  getByCliente: async (clienteId: number): Promise<DocumentoComercial[]> => {
    try {
      const res = await axios.get(`${API_URL}/cliente/${clienteId}`);
      return res.data;
    } catch (error) {
      console.error("Error fetching documentos by cliente:", error);
      throw error;
    }
  },

  // Convert presupuesto to nota de pedido
  convertToNotaPedido: async (dto: {
    presupuestoId: number;
    metodoPago: string;
    tipoIva: string;
  }): Promise<DocumentoComercial> => {
    try {
      const res = await axios.post(`${API_URL}/nota-pedido`, dto);
      return res.data;
    } catch (error) {
      console.error("Error converting to nota de pedido:", error);
      throw error;
    }
  },

  // Convert nota de pedido to factura
  convertToFactura: async (dto: {
    notaPedidoId: number;
    descuento?: number;
  }): Promise<DocumentoComercial> => {
    try {
      const res = await axios.post(`${API_URL}/factura`, dto);
      return res.data;
    } catch (error) {
      console.error("Error converting to factura:", error);
      throw error;
    }
  },
};