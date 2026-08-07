import type { TipoActivoAmortizable } from './amortizacion.types';

export interface ActivoPorTipoDTO {
  tipo: TipoActivoAmortizable;
  valorBrutoPesos: number;
  amortizacionAcumuladaPesos: number;
  valorNetoPesos: number;
}

export interface DesgloseFijoDTO {
  valorBrutoPesos: number;
  amortizacionAcumuladaPesos: number;
  valorNetoPesos: number;
  porTipo: ActivoPorTipoDTO[];
}

export interface DesgloseStockDTO {
  materialesPesos: number;
  materialesTotalUnidades: number;
  fabricacionPesos: number;
  fabricacionTotalEquipos: number;
  comercializacionProductosTerminadosPesos: number;
  comercializacionEquiposDisponiblesPesos: number;
  comercializacionTotalEquipos: number;
}

export interface PosicionPatrimonialDTO {
  calculadoEn: string;
  empresaId: number;
  /** Disponibilidades: cajas en pesos OPERATIVAS activas. Suma al total de activos. */
  cajasPesosTotal: number;
  /** Cajas de ahorro en USD activas. Informativo, no suma al total. */
  cajasDolaresTotal: number;
  stockMaterialesPesos: number;
  stockFabricacionPesos: number;
  stockComercializacionPesos: number;
  creditosACobrarPesos: number;
  patrimonioFijoPesos: number;
  totalActivosPesos: number;
  cuentasXPagarPesos: number;
  provisionesRRHHPesos: number;
  totalPasivosPesos: number;
  patrimonioNetoPesos: number;
  desgloseFijo: DesgloseFijoDTO;
  desgloseStock: DesgloseStockDTO;
}
