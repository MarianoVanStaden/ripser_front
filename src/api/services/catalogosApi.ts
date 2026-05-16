import api from '../config';
import type {
  Area,
  BandaJerarquica,
  Competencia,
  CreateBandaJerarquicaPayload,
  CreateCompetenciaPayload,
  CreateDepartamentoPayload,
  CreateLugarTrabajoPayload,
  CreateNivelEducacionPayload,
  CreateNivelExperienciaPayload,
  CreateNivelJerarquicoPayload,
  CreateRiesgoPayload,
  CreateSectorPayload,
  CatalogoBase,
  CatalogoCreatePayload,
  Departamento,
  Epp,
  LugarTrabajo,
  NivelEducacion,
  NivelExperiencia,
  NivelJerarquico,
  Riesgo,
  Sector,
  TipoFormacion,
  UnidadNegocio,
} from '../../types/catalogos.types';

/**
 * Factory para los 13 catálogos del Manual de Puestos. Todos exponen el
 * mismo CRUD bajo `/api/catalogos/{path}` y los tipos extras se inyectan
 * sólo en los payload de create/update.
 */
function buildCatalogoApi<T extends CatalogoBase, C extends CatalogoCreatePayload>(path: string) {
  const BASE = `/api/catalogos/${path}`;
  return {
    list: async (soloActivos = false): Promise<T[]> => {
      const params = soloActivos ? { activo: true } : undefined;
      const r = await api.get<T[]>(BASE, { params });
      return r.data;
    },
    getById: async (id: number): Promise<T> => {
      const r = await api.get<T>(`${BASE}/${id}`);
      return r.data;
    },
    create: async (payload: C): Promise<T> => {
      const r = await api.post<T>(BASE, payload);
      return r.data;
    },
    update: async (id: number, payload: C): Promise<T> => {
      const r = await api.put<T>(`${BASE}/${id}`, payload);
      return r.data;
    },
    delete: async (id: number): Promise<void> => {
      await api.delete(`${BASE}/${id}`);
    },
  };
}

export const unidadNegocioApi = buildCatalogoApi<UnidadNegocio, CatalogoCreatePayload>('unidades-negocio');
export const lugarTrabajoApi = buildCatalogoApi<LugarTrabajo, CreateLugarTrabajoPayload>('lugares-trabajo');
export const areaApi = buildCatalogoApi<Area, CatalogoCreatePayload>('areas');
export const departamentoApi = buildCatalogoApi<Departamento, CreateDepartamentoPayload>('departamentos');
export const sectorApi = buildCatalogoApi<Sector, CreateSectorPayload>('sectores');
export const bandaJerarquicaApi = buildCatalogoApi<BandaJerarquica, CreateBandaJerarquicaPayload>('bandas-jerarquicas');
export const nivelJerarquicoApi = buildCatalogoApi<NivelJerarquico, CreateNivelJerarquicoPayload>('niveles-jerarquicos');
export const competenciaApi = buildCatalogoApi<Competencia, CreateCompetenciaPayload>('competencias');
export const riesgoApi = buildCatalogoApi<Riesgo, CreateRiesgoPayload>('riesgos');
export const eppApi = buildCatalogoApi<Epp, CatalogoCreatePayload>('epp');
export const nivelEducacionApi = buildCatalogoApi<NivelEducacion, CreateNivelEducacionPayload>('niveles-educacion');
export const tipoFormacionApi = buildCatalogoApi<TipoFormacion, CatalogoCreatePayload>('tipos-formacion');
export const nivelExperienciaApi = buildCatalogoApi<NivelExperiencia, CreateNivelExperienciaPayload>('niveles-experiencia');

export type CatalogoApi<T extends CatalogoBase, C extends CatalogoCreatePayload> =
  ReturnType<typeof buildCatalogoApi<T, C>>;
