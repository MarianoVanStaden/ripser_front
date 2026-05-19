import api from '../config';
import type {
  Pais, PaisPayload,
  Provincia, ProvinciaPayload,
  Banco, BancoPayload,
  ObraSocial, ObraSocialPayload,
  Art, ArtPayload,
} from '../../types/catalogosGlobales.types';

// CRUDs para los catálogos globales (Fase 3 RRHH).
// Todos los endpoints viven bajo /api/catalogos/{recurso}.

export const paisesApi = {
  list: async (): Promise<Pais[]> => (await api.get('/api/catalogos/paises')).data,
  create: async (dto: PaisPayload): Promise<Pais> => (await api.post('/api/catalogos/paises', dto)).data,
  update: async (id: number, dto: PaisPayload): Promise<Pais> =>
    (await api.put(`/api/catalogos/paises/${id}`, dto)).data,
  delete: async (id: number): Promise<void> => { await api.delete(`/api/catalogos/paises/${id}`); },
};

export const provinciasApi = {
  list: async (paisId?: number): Promise<Provincia[]> =>
    (await api.get('/api/catalogos/provincias', { params: paisId ? { paisId } : undefined })).data,
  create: async (dto: ProvinciaPayload): Promise<Provincia> =>
    (await api.post('/api/catalogos/provincias', dto)).data,
  update: async (id: number, dto: ProvinciaPayload): Promise<Provincia> =>
    (await api.put(`/api/catalogos/provincias/${id}`, dto)).data,
  delete: async (id: number): Promise<void> => { await api.delete(`/api/catalogos/provincias/${id}`); },
};

export const bancosApi = {
  list: async (): Promise<Banco[]> => (await api.get('/api/catalogos/bancos')).data,
  create: async (dto: BancoPayload): Promise<Banco> => (await api.post('/api/catalogos/bancos', dto)).data,
  update: async (id: number, dto: BancoPayload): Promise<Banco> =>
    (await api.put(`/api/catalogos/bancos/${id}`, dto)).data,
  delete: async (id: number): Promise<void> => { await api.delete(`/api/catalogos/bancos/${id}`); },
};

export const obrasSocialesApi = {
  list: async (): Promise<ObraSocial[]> => (await api.get('/api/catalogos/obras-sociales')).data,
  create: async (dto: ObraSocialPayload): Promise<ObraSocial> =>
    (await api.post('/api/catalogos/obras-sociales', dto)).data,
  update: async (id: number, dto: ObraSocialPayload): Promise<ObraSocial> =>
    (await api.put(`/api/catalogos/obras-sociales/${id}`, dto)).data,
  delete: async (id: number): Promise<void> => { await api.delete(`/api/catalogos/obras-sociales/${id}`); },
};

export const artsApi = {
  list: async (): Promise<Art[]> => (await api.get('/api/catalogos/arts')).data,
  create: async (dto: ArtPayload): Promise<Art> => (await api.post('/api/catalogos/arts', dto)).data,
  update: async (id: number, dto: ArtPayload): Promise<Art> =>
    (await api.put(`/api/catalogos/arts/${id}`, dto)).data,
  delete: async (id: number): Promise<void> => { await api.delete(`/api/catalogos/arts/${id}`); },
};
