import api from '../config';

export interface DocumentoEntrega {
  id: number;
  entregaId?: number;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  descripcion?: string;
  fechaCreacion?: string;
  urlDescarga?: string;
}

const BASE_PATH = (entregaId: number) => `/api/entregas-viaje/${entregaId}/documentos`;

export const entregaViajeDocumentoApi = {
  upload: async (
    entregaId: number,
    file: File,
    descripcion?: string
  ): Promise<DocumentoEntrega> => {
    const formData = new FormData();
    formData.append('file', file);
    if (descripcion) formData.append('descripcion', descripcion);

    // Forzar multipart/form-data (axios reemplaza el valor con el boundary correcto).
    // Sin esto, gana el default 'application/json' del axios instance y el server tira 403.
    // Timeout extendido: fotos de cámara (2-5 MB) sobre 4G pueden tardar bastante.
    const response = await api.post<DocumentoEntrega>(BASE_PATH(entregaId), formData, {
      timeout: 120000,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getByEntrega: async (entregaId: number): Promise<DocumentoEntrega[]> => {
    const response = await api.get<DocumentoEntrega[]>(BASE_PATH(entregaId));
    return response.data;
  },

  download: async (entregaId: number, documentoId: number): Promise<Blob> => {
    try {
      const response = await api.get(`${BASE_PATH(entregaId)}/${documentoId}/download`, {
        responseType: 'blob',
        validateStatus: () => true, // Aceptar cualquier status code
      });

      // Validar status code
      if (response.status !== 200) {
        // Intentar parsear el error desde el blob
        let errorMessage = `Error al descargar (${response.status})`;

        try {
          const text = await response.data.text();
          // Intentar parsear como JSON
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          } catch {
            // Si no es JSON, usar el texto directo
            if (text && text.length > 0) {
              errorMessage = text.substring(0, 200); // Limitar tamaño
            }
          }
        } catch {
          // Si no se puede leer el blob, usar mensaje genérico
        }

        throw new Error(errorMessage);
      }

      // Validar que el blob no esté vacío
      if (!response.data || response.data.size === 0) {
        throw new Error('El servidor retornó un archivo vacío. Intenta de nuevo o contacta soporte.');
      }

      // Validar que no sea un error HTML/XML
      const contentType = (response.headers['content-type'] as string) || '';
      if (contentType.includes('text/html') || contentType.includes('text/xml')) {
        throw new Error('El servidor retornó un error. Por favor intenta de nuevo.');
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error desconocido al descargar el documento');
    }
  },

  delete: async (entregaId: number, documentoId: number): Promise<void> => {
    await api.delete(`${BASE_PATH(entregaId)}/${documentoId}`);
  },
};
