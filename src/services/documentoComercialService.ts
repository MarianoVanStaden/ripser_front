import api from '../api'; // Adjust the import based on your project structure
import { DocumentoComercial, EstadoDocumento } from '../types'; // Adjust the import based on your project structure

export const changeEstadoDocumento = async (id: number, estado: EstadoDocumento): Promise<DocumentoComercial> => {
  const response = await api.put(`/documentos/${id}/estado`, estado, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Remove or comment out the old updateEstadoDocumento if it exists
// export const updateEstadoDocumento = async (id: number, data: Partial<DocumentoComercial>): Promise<DocumentoComercial> => {
//   const response = await api.put(`/documentos/${id}`, data);
//   return response.data;
// };