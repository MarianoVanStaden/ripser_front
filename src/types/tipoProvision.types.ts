export interface TipoProvisionDTO {
  id: number;
  empresaId: number;
  codigo: string;
  nombre: string;
  cuentaEnPatrimonio: boolean;
  activo: boolean;
  fechaCreacion: string;
}

export interface CrearTipoProvisionDTO {
  codigo: string;
  nombre: string;
  cuentaEnPatrimonio: boolean;
}

export interface ActualizarTipoProvisionDTO {
  codigo?: string;
  nombre?: string;
  cuentaEnPatrimonio?: boolean;
  activo?: boolean;
}
