import axios from 'axios';
import type { AxiosError, AxiosInstance } from 'axios';

/**
 * DTO PÚBLICO - Tiposcrip correspondence con FichaEquipoPublicDTO de backend.
 *
 * Solo campos públicos, sin datos sensibles.
 */
export interface FichaEquipoPublicDTO {
  numeroHeladera: string;
  modelo: string;
  tipo: 'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO';
  medida: string;
  color: string;
  motor: string;
  gas: string;
  sistema: string;
  humedad?: string;
  estructura?: string;
  gabinete?: string;
  iluminacion?: string;
  transformador?: string;
  leds?: string;
  vidrios?: string;
  paneles?: string;
  puertas?: string;
  revestimiento?: string;
  estanteriasCantidad?: number;
  estanteriasFormato?: string;
  alto: number;
  ancho: number;
  profundidad: number;
  clienteNombre: string | null;
  localidad: string | null;
  provincia: string | null;
  fechaFabricacion: string | null; // ISO date (YYYY-MM-DD)
  fechaEntrega: string | null;
  recuperadoEn: string; // ISO datetime
}

/**
 * Cliente HTTP SIN interceptores de autenticación.
 *
 * Importante:
 * - No incluye Bearer token
 * - No incluye X-Empresa-Id
 * - Rate-limited por backend (100 req/min)
 * - CORS habilitado para dominios públicos
 *
 * Separado de `api.ts` (que incluye interceptores de auth) para
 * garantizar que no se exponen secretos en llamadas públicas.
 */
const publicClient: AxiosInstance = axios.create({
  baseURL: `${window.location.origin}/api/public`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de respuesta para logging de errores públicos.
 *
 * Garantiza que los errores 404, 429 (rate limit), 5xx se manejan
 * correctamente en la UI sin exponer detalles internos.
 */
publicClient.interceptors.response.use(
  response => response,
  error => {
    const axiosError = error as AxiosError;

    // Log para debugging (sin exposición de datos sensibles)
    if (axiosError.response?.status === 404) {
      console.warn(`[PublicEquipo] 404 - Equipo no encontrado`);
    } else if (axiosError.response?.status === 429) {
      console.warn(`[PublicEquipo] 429 - Rate limit excedido. Intenta en unos segundos.`);
    } else if (axiosError.response?.status === 500) {
      console.error(`[PublicEquipo] 500 - Error del servidor`);
    } else if (axiosError.message === 'Network Error') {
      console.error(`[PublicEquipo] Error de red - verifica tu conexión`);
    }

    return Promise.reject(error);
  }
);

/**
 * API pública para fichas técnicas de equipos.
 *
 * ENDPOINT:
 * GET /api/public/equipos/{numeroHeladera}/ficha
 *
 * CARACTERÍSTICAS:
 * - ✅ Sin autenticación
 * - ✅ Optimizado para móviles (QR)
 * - ✅ Rate-limited
 * - ✅ Error handling robusto
 * - ✅ CORS enabled
 */
export const publicEquipoApi = {
  /**
   * Obtiene la ficha técnica pública de un equipo.
   *
   * @param numeroHeladera Número único del equipo (ej: COOL-0042)
   * @returns Ficha técnica con datos públicos
   * @throws AxiosError en caso de error (404, 429, 5xx, timeout, etc)
   *
   * EJEMPLOS DE USO:
   *
   * // Success path:
   * try {
   *   const ficha = await publicEquipoApi.getFichaPublica('COOL-0042');
   *   console.log(ficha.modelo); // RFR-2200X
   * } catch (error) {
   *   if (error.response?.status === 404) {
   *     // Equipo no existe
   *   } else if (error.response?.status === 429) {
   *     // Rate limit - esperar antes de reintentar
   *   } else {
   *     // Error genérico
   *   }
   * }
   */
  async getFichaPublica(numeroHeladera: string): Promise<FichaEquipoPublicDTO> {
    if (!numeroHeladera || numeroHeladera.trim() === '') {
      throw new Error('numeroHeladera es requerido');
    }

    const response = await publicClient.get<FichaEquipoPublicDTO>(
      `/equipos/${numeroHeladera.trim()}/ficha`
    );

    return response.data;
  },

  /**
   * Health check del servicio público.
   *
   * Usado para verificar que el servicio está disponible antes de
   * hacer requests de datos.
   *
   * @returns { status: 'UP', service: 'PublicEquipo', ... }
   */
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    const response = await publicClient.get('/equipos/health');
    return response.data;
  },
};

// Export para uso en otros módulos
export { publicClient };
