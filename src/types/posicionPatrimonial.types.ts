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
  /** Financiamiento/deuda: cajas tipo CREDITO activas (vive en negativo). Resta al total de activos. */
  cajasCreditoTotal: number;
  /** Cajas de ahorro en USD activas (nativo en dólares). */
  cajasDolaresTotal: number;
  /** cajasDolaresTotal × cotización oficial. Suma a activos; null si la API no respondió. */
  cajasDolaresEnPesos: number | null;
  /** Cotización usada. Null si la API no respondió. */
  cotizacionDolar: number | null;
  stockMaterialesPesos: number;
  stockFabricacionPesos: number;
  stockComercializacionPesos: number;
  creditosACobrarPesos: number;
  patrimonioFijoPesos: number;
  totalActivosPesos: number;
  cuentasXPagarPesos: number;
  totalPasivosPesos: number;
  patrimonioNetoPesos: number;
  desgloseFijo: DesgloseFijoDTO;
  desgloseStock: DesgloseStockDTO;
}
