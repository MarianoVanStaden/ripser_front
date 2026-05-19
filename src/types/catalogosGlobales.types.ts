// Catálogos globales (no multi-tenant) — Fase 3 RRHH.
// Mapeados directo desde los DTOs del backend en /api/catalogos/...

export interface Pais {
  id: number;
  codigoIso?: string | null;
  nombre: string;
  codigoTelefonico?: string | null;
  activo: boolean;
}

export interface Provincia {
  id: number;
  paisId: number;
  paisNombre?: string | null;
  nombre: string;
  codigo?: string | null;
  activo: boolean;
}

// Banco vive en su propio módulo (cheques/cuentas bancarias) — no en
// /api/catalogos. Mapea contra el BancoDTO existente del backend, que tiene
// nombre_corto + timestamps además de los campos básicos del catálogo.
export interface Banco {
  id: number;
  codigo?: string | null;
  nombre: string;
  nombreCorto?: string | null;
  activo: boolean;
  fechaAlta?: string | null;
  fechaActualizacion?: string | null;
}

export interface ObraSocial {
  id: number;
  codigo?: string | null;
  nombre: string;
  activo: boolean;
}

export interface Art {
  id: number;
  codigo?: string | null;
  nombre: string;
  activo: boolean;
}

// Payloads de creación (omiten id; permiten activo opcional).
export type PaisPayload = Omit<Pais, 'id' | 'activo'> & { activo?: boolean };
export type ProvinciaPayload = Omit<Provincia, 'id' | 'activo' | 'paisNombre'> & { activo?: boolean };
export type BancoPayload = Omit<Banco, 'id' | 'activo'> & { activo?: boolean };
export type ObraSocialPayload = Omit<ObraSocial, 'id' | 'activo'> & { activo?: boolean };
export type ArtPayload = Omit<Art, 'id' | 'activo'> & { activo?: boolean };
