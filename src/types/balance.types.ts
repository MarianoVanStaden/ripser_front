export type EstadoBalance = 'BORRADOR' | 'CERRADO' | 'AUDITADO';

export interface BalanceMensualDTO {
  id: number | null;
  empresaId: number;
  sucursalId: number | null;
  anio: number;
  mes: number;
  estado: EstadoBalance;
  valorDolar: number;

  // Pesos
  saldoInicialPesos: number;
  totalCobradoPesos: number;
  totalGastosPesos: number;
  totalAmortizadoPesos: number;
  saldoNetoMesPesos: number;
  saldoFinalPesos: number;
  cuentasXCobrarPesos: number;
  stockMaterialesPesos: number;
  stockFabricacionPesos: number;
  stockComercializacionPesos: number;
  cuentasXPagarPesos: number;
  patrimonioPesos: number;
  resultadoPesos: number;

  // Dólares
  saldoInicialDolares: number;
  totalCobradoDolares: number;
  totalGastosDolares: number;
  totalAmortizadoDolares: number;
  saldoNetoMesDolares: number;
  saldoFinalDolares: number;
  cuentasXCobrarDolares: number;
  stockMaterialesDolares: number;
  stockFabricacionDolares: number;
  stockComercializacionDolares: number;
  cuentasXPagarDolares: number;
  patrimonioDolares: number;
  resultadoDolares: number;

  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface TotalesAnuales {
  totalCobradoPesos: number;
  totalGastosPesos: number;
  totalAmortizadoPesos: number;
  resultadoPesos: number;
  totalCobradoDolares: number;
  totalGastosDolares: number;
  totalAmortizadoDolares: number;
  resultadoDolares: number;
}

export interface BalanceAnualResponseDTO {
  anio: number;
  empresaId: number;
  sucursalId: number | null;
  meses: BalanceMensualDTO[];
  totalesAnuales: TotalesAnuales;
}

export interface GuardarBalanceMensualDTO {
  sucursalId?: number | null;
  valorDolar?: number;
  saldoInicialPesos?: number;
  totalCobradoPesos?: number;
  totalGastosPesos?: number;
  totalAmortizadoPesos?: number;
  saldoNetoMesPesos?: number;
  saldoFinalPesos?: number;
  cuentasXCobrarPesos?: number;
  stockMaterialesPesos?: number;
  stockFabricacionPesos?: number;
  stockComercializacionPesos?: number;
  cuentasXPagarPesos?: number;
  patrimonioPesos?: number;
  resultadoPesos?: number;
  saldoInicialDolares?: number;
  totalCobradoDolares?: number;
  totalGastosDolares?: number;
  totalAmortizadoDolares?: number;
  saldoNetoMesDolares?: number;
  saldoFinalDolares?: number;
  cuentasXCobrarDolares?: number;
  stockMaterialesDolares?: number;
  stockFabricacionDolares?: number;
  stockComercializacionDolares?: number;
  cuentasXPagarDolares?: number;
  patrimonioDolares?: number;
  resultadoDolares?: number;
}
