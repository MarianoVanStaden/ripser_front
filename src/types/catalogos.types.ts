// Catálogos del Manual de Puestos (multi-tenant, administrables por UI).
// Espejo de `dto/catalogos/*` en el back.

export interface CatalogoBase {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface CatalogoCreatePayload {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

// === Simples (sólo campos base) ===
export type UnidadNegocio = CatalogoBase;
export type Area = CatalogoBase;
export type Epp = CatalogoBase;
export type TipoFormacion = CatalogoBase;

// === Con campos extra ===
export interface LugarTrabajo extends CatalogoBase {
  direccion?: string;
  sucursalId?: number;
}
export interface CreateLugarTrabajoPayload extends CatalogoCreatePayload {
  direccion?: string;
  sucursalId?: number;
}

export interface BandaJerarquica extends CatalogoBase {
  orden: number;
}
export interface CreateBandaJerarquicaPayload extends CatalogoCreatePayload {
  orden?: number;
}

export interface NivelJerarquico extends CatalogoBase {
  orden?: number;
}
export interface CreateNivelJerarquicoPayload extends CatalogoCreatePayload {
  orden?: number;
}

export interface NivelEducacion extends CatalogoBase {
  orden?: number;
}
export interface CreateNivelEducacionPayload extends CatalogoCreatePayload {
  orden?: number;
}

export interface NivelExperiencia extends CatalogoBase {
  orden?: number;
  aniosMinimos?: number;
}
export interface CreateNivelExperienciaPayload extends CatalogoCreatePayload {
  orden?: number;
  aniosMinimos?: number;
}

export interface Departamento extends CatalogoBase {
  areaId?: number;
  areaNombre?: string;
}
export interface CreateDepartamentoPayload extends CatalogoCreatePayload {
  areaId?: number;
}

export interface Sector extends CatalogoBase {
  departamentoId?: number;
  departamentoNombre?: string;
}
export interface CreateSectorPayload extends CatalogoCreatePayload {
  departamentoId?: number;
}

export type TipoCompetencia = 'CORPORATIVA' | 'JERARQUICA' | 'FUNCIONAL';
export interface Competencia extends CatalogoBase {
  tipo: TipoCompetencia;
  nivelJerarquicoMinimoId?: number;
  nivelJerarquicoMinimoNombre?: string;
}
export interface CreateCompetenciaPayload extends CatalogoCreatePayload {
  tipo: TipoCompetencia;
  nivelJerarquicoMinimoId?: number;
}

export type NivelSeveridad = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
export interface Riesgo extends CatalogoBase {
  nivelSeveridad?: NivelSeveridad;
}
export interface CreateRiesgoPayload extends CatalogoCreatePayload {
  nivelSeveridad?: NivelSeveridad;
}
