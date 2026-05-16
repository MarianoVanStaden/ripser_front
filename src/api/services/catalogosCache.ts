import {
  areaApi,
  bandaJerarquicaApi,
  competenciaApi,
  departamentoApi,
  eppApi,
  lugarTrabajoApi,
  nivelEducacionApi,
  nivelExperienciaApi,
  nivelJerarquicoApi,
  riesgoApi,
  sectorApi,
  tipoFormacionApi,
  unidadNegocioApi,
} from './catalogosApi';
import type {
  Area,
  BandaJerarquica,
  Competencia,
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

export interface CatalogosSnapshot {
  unidadesNegocio: UnidadNegocio[];
  lugaresTrabajo: LugarTrabajo[];
  areas: Area[];
  departamentos: Departamento[];
  sectores: Sector[];
  bandas: BandaJerarquica[];
  niveles: NivelJerarquico[];
  competencias: Competencia[];
  riesgos: Riesgo[];
  epp: Epp[];
  nivelesEducacion: NivelEducacion[];
  tiposFormacion: TipoFormacion[];
  nivelesExperiencia: NivelExperiencia[];
}

const TTL_MS = 5 * 60 * 1000;

let _cache: { snapshot: CatalogosSnapshot; fetchedAt: number } | null = null;
let _inflight: Promise<CatalogosSnapshot> | null = null;

export function invalidateCatalogosCache(): void {
  _cache = null;
}

/**
 * Devuelve los 13 catálogos del Manual de Puestos.
 * Cachea en memoria hasta 5 minutos; deduplica llamadas en vuelo simultáneas.
 * No incluye la lista de Puestos activos (cambia más seguido — cargar por separado).
 */
export async function fetchCatalogosSnapshot(): Promise<CatalogosSnapshot> {
  if (_cache && Date.now() - _cache.fetchedAt < TTL_MS) {
    return _cache.snapshot;
  }
  if (!_inflight) {
    _inflight = (async () => {
      try {
        const [
          unidadesNegocio, lugaresTrabajo, areas, departamentos, sectores,
          bandas, niveles, competencias, riesgos, epp,
          nivelesEducacion, tiposFormacion, nivelesExperiencia,
        ] = await Promise.all([
          unidadNegocioApi.list(true),
          lugarTrabajoApi.list(true),
          areaApi.list(true),
          departamentoApi.list(true),
          sectorApi.list(true),
          bandaJerarquicaApi.list(true),
          nivelJerarquicoApi.list(true),
          competenciaApi.list(true),
          riesgoApi.list(true),
          eppApi.list(true),
          nivelEducacionApi.list(true),
          tipoFormacionApi.list(true),
          nivelExperienciaApi.list(true),
        ]);
        const snapshot: CatalogosSnapshot = {
          unidadesNegocio, lugaresTrabajo, areas, departamentos, sectores,
          bandas, niveles, competencias, riesgos, epp,
          nivelesEducacion, tiposFormacion, nivelesExperiencia,
        };
        _cache = { snapshot, fetchedAt: Date.now() };
        return snapshot;
      } finally {
        _inflight = null;
      }
    })();
  }
  return _inflight;
}
