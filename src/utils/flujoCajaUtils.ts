import dayjs from 'dayjs';
import type {
  FlujoCajaMovimientoEnhanced,
  FlujoCajaResponseEnhanced,
  FlujoCajaKPIs,
  PaymentMethodAggregation,
  ChequeStatusAggregation,
  TimeSeriesData,
  MetodoPago,
  EstadoChequeType,
  SaldoPorMetodoPagoDTO,
  ResumenChequesDTO,
  EvolucionDiariaDTO,
  OrigenMovimiento,
  CategoriaGastoExtra,
  CategoriaCobroExtra,
} from '../types';
import {
  MoneyOutlined as CashIcon,
  AccountBalance as BankIcon,
  Description as ChequeIcon,
  CreditCard as CreditCardIcon,
  Payment as DebitCardIcon,
  AccountBalanceWallet as FinanciacionIcon,
  MoreHoriz as OtherIcon,
  MoneyOff as MoneyOffIcon,
  AttachMoney as AttachMoneyIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';

/**
 * Obtiene la etiqueta en español para un método de pago
 */
export const getPaymentMethodLabel = (metodo: MetodoPago): string => {
  const labels: Record<MetodoPago, string> = {
    EFECTIVO: 'Efectivo',
    TRANSFERENCIA: 'Transferencia',
    CHEQUE: 'Cheque',
    TARJETA_CREDITO: 'Tarjeta Crédito',
    TARJETA_DEBITO: 'Tarjeta Débito',
    FINANCIAMIENTO: 'Financiamiento',
    FINANCIACION_PROPIA: 'Financiación Propia',
    CUENTA_CORRIENTE: 'Cuenta Corriente',
  };
  return labels[metodo] || metodo;
};

/**
 * Obtiene el icono MUI para un método de pago
 */
export const getPaymentMethodIcon = (metodo: MetodoPago) => {
  const icons: Record<MetodoPago, typeof CashIcon> = {
    EFECTIVO: CashIcon,
    TRANSFERENCIA: BankIcon,
    CHEQUE: ChequeIcon,
    TARJETA_CREDITO: CreditCardIcon,
    TARJETA_DEBITO: DebitCardIcon,
    FINANCIAMIENTO: FinanciacionIcon,
    FINANCIACION_PROPIA: FinanciacionIcon,
    CUENTA_CORRIENTE: BankIcon,
  };
  return icons[metodo] || OtherIcon;
};

/**
 * Obtiene el color consistente para un método de pago
 */
export const getPaymentMethodColor = (metodo: MetodoPago): string => {
  const colors: Record<MetodoPago, string> = {
    EFECTIVO: '#4CAF50', // verde
    TRANSFERENCIA: '#2196F3', // azul
    CHEQUE: '#FF9800', // naranja
    TARJETA_CREDITO: '#9C27B0', // morado
    TARJETA_DEBITO: '#00BCD4', // cyan
    FINANCIAMIENTO: '#FFC107', // amarillo
    FINANCIACION_PROPIA: '#FF5722', // naranja oscuro
    CUENTA_CORRIENTE: '#795548', // marrón
  };
  return colors[metodo] || '#9E9E9E';
};

/**
 * Obtiene la etiqueta en español para un estado de cheque
 */
export const getChequeEstadoLabel = (estado: EstadoChequeType): string => {
  const labels: Record<EstadoChequeType, string> = {
    RECIBIDO: 'Recibido',
    EN_CARTERA: 'En Cartera',
    DEPOSITADO: 'Depositado',
    COBRADO: 'Cobrado',
    RECHAZADO: 'Rechazado',
    ANULADO: 'Anulado',
  };
  return labels[estado] || estado;
};

/**
 * Obtiene el color para un estado de cheque
 */
export const getChequeEstadoColor = (estado: EstadoChequeType): string => {
  const colors: Record<EstadoChequeType, string> = {
    RECIBIDO: '#9C27B0', // púrpura
    EN_CARTERA: '#FFC107', // amarillo
    DEPOSITADO: '#2196F3', // azul
    COBRADO: '#4CAF50', // verde
    RECHAZADO: '#F44336', // rojo
    ANULADO: '#9E9E9E', // gris
  };
  return colors[estado] || '#9E9E9E';
};

/**
 * Agrega movimientos por método de pago
 */
export const aggregateByPaymentMethod = (
  movimientos: FlujoCajaMovimientoEnhanced[]
): PaymentMethodAggregation[] => {
  const aggregationMap = new Map<MetodoPago, PaymentMethodAggregation>();

  // Inicializar todos los métodos de pago con valores en 0
  const allMethods: MetodoPago[] = [
    'EFECTIVO',
    'TRANSFERENCIA',
    'CHEQUE',
    'TARJETA_CREDITO',
    'TARJETA_DEBITO',
    'FINANCIAMIENTO',
    'CUENTA_CORRIENTE',
  ];

  allMethods.forEach((metodo) => {
    aggregationMap.set(metodo, {
      metodoPago: metodo,
      totalIngresos: 0,
      totalEgresos: 0,
      flujoNeto: 0,
      cantidadMovimientos: 0,
      porcentajeDelTotal: 0,
    });
  });

  // Agregar movimientos por método de pago
  movimientos.forEach((mov) => {
    const metodo = mov.metodoPago || 'EFECTIVO';
    const current = aggregationMap.get(metodo)!;

    if (mov.tipo === 'INGRESO') {
      current.totalIngresos += mov.importe;
    } else {
      current.totalEgresos += mov.importe;
    }

    current.cantidadMovimientos += 1;
    current.flujoNeto = current.totalIngresos - current.totalEgresos;
  });

  // Calcular total general para porcentajes
  const totalGeneral = movimientos.reduce((sum, mov) => sum + mov.importe, 0);

  // Calcular porcentajes
  aggregationMap.forEach((agg) => {
    const totalMetodo = agg.totalIngresos + agg.totalEgresos;
    agg.porcentajeDelTotal = totalGeneral > 0 ? (totalMetodo / totalGeneral) * 100 : 0;
  });

  // Convertir a array y filtrar métodos sin movimientos
  return Array.from(aggregationMap.values()).filter((agg) => agg.cantidadMovimientos > 0);
};

/**
 * Agrega cheques por estado
 */
export const aggregateChequeStatus = (
  movimientos: FlujoCajaMovimientoEnhanced[]
): ChequeStatusAggregation[] => {
  const aggregationMap = new Map<EstadoChequeType, ChequeStatusAggregation>();

  // Inicializar todos los estados
  const allStates: EstadoChequeType[] = [
    'EN_CARTERA',
    'DEPOSITADO',
    'COBRADO',
    'RECHAZADO',
    'ANULADO',
  ];

  allStates.forEach((estado) => {
    aggregationMap.set(estado, {
      estado,
      cantidad: 0,
      montoTotal: 0,
    });
  });

  // Filtrar solo movimientos con cheques y agregar
  movimientos
    .filter((mov) => mov.metodoPago === 'CHEQUE' && mov.chequeEstado)
    .forEach((mov) => {
      const estado = mov.chequeEstado!;
      const current = aggregationMap.get(estado)!;
      current.cantidad += 1;
      current.montoTotal += mov.importe;
    });

  // Convertir a array y filtrar estados sin cheques
  return Array.from(aggregationMap.values()).filter((agg) => agg.cantidad > 0);
};

/**
 * Prepara datos de series temporales con granularidad especificada
 */
export const prepareTimeSeriesData = (
  movimientos: FlujoCajaMovimientoEnhanced[],
  granularity: 'day' | 'week' | 'month' = 'day'
): TimeSeriesData[] => {
  const timeSeriesMap = new Map<string, TimeSeriesData>();

  movimientos.forEach((mov) => {
    let dateKey: string;
    const fecha = dayjs(mov.fecha);

    // Determinar la clave de fecha según granularidad
    switch (granularity) {
      case 'week':
        dateKey = fecha.startOf('week').format('YYYY-MM-DD');
        break;
      case 'month':
        dateKey = fecha.startOf('month').format('YYYY-MM-DD');
        break;
      case 'day':
      default:
        dateKey = fecha.format('YYYY-MM-DD');
        break;
    }

    // Inicializar si no existe
    if (!timeSeriesMap.has(dateKey)) {
      timeSeriesMap.set(dateKey, {
        fecha: dateKey,
        ingresos: 0,
        egresos: 0,
        flujoNeto: 0,
      });
    }

    const current = timeSeriesMap.get(dateKey)!;

    if (mov.tipo === 'INGRESO') {
      current.ingresos += mov.importe;
    } else {
      current.egresos += mov.importe;
    }

    current.flujoNeto = current.ingresos - current.egresos;
  });

  // Convertir a array y ordenar por fecha
  return Array.from(timeSeriesMap.values()).sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
};

/**
 * Calcula KPIs del flujo de caja
 */
export const calculateKPIs = (
  response: FlujoCajaResponseEnhanced,
  paymentMethodData?: PaymentMethodAggregation[],
  chequeData?: ChequeStatusAggregation[]
): FlujoCajaKPIs => {
  const movimientos = response.movimientos;

  // KPIs básicos
  const totalIngresos = response.totalIngresos;
  const totalEgresos = response.totalEgresos;
  const flujoNeto = response.flujoNeto;
  const totalMovimientos = response.totalMovimientos;

  // Ticket promedio
  const ticketPromedio = totalMovimientos > 0
    ? (totalIngresos + totalEgresos) / totalMovimientos
    : 0;

  // Mediana
  const importes = movimientos.map((m) => m.importe).sort((a, b) => a - b);
  const medianaTransaccion = importes.length > 0
    ? importes[Math.floor(importes.length / 2)]
    : 0;

  // Mayor ingreso
  const ingresos = movimientos.filter((m) => m.tipo === 'INGRESO');
  const mayorIngresoMov = ingresos.reduce(
    (max, mov) => (mov.importe > max.importe ? mov : max),
    ingresos[0] || { importe: 0, entidad: '', metodoPago: undefined, fecha: '' }
  );

  const mayorIngreso = {
    importe: mayorIngresoMov.importe,
    entidad: mayorIngresoMov.entidad,
    metodoPago: mayorIngresoMov.metodoPago ?? undefined,
    fecha: mayorIngresoMov.fecha,
  };

  // Mayor egreso
  const egresos = movimientos.filter((m) => m.tipo === 'EGRESO');
  const mayorEgresoMov = egresos.reduce(
    (max, mov) => (mov.importe > max.importe ? mov : max),
    egresos[0] || { importe: 0, entidad: '', metodoPago: undefined, fecha: '' }
  );

  const mayorEgreso = {
    importe: mayorEgresoMov.importe,
    entidad: mayorEgresoMov.entidad,
    metodoPago: mayorEgresoMov.metodoPago ?? undefined,
    fecha: mayorEgresoMov.fecha,
  };

  // Método de pago más usado
  let metodoPagoMasUsado = {
    metodo: 'EFECTIVO' as MetodoPago,
    cantidad: 0,
    porcentaje: 0,
  };

  if (paymentMethodData && paymentMethodData.length > 0) {
    const maxMethod = paymentMethodData.reduce(
      (max, agg) => (agg.cantidadMovimientos > max.cantidadMovimientos ? agg : max),
      paymentMethodData[0]
    );

    metodoPagoMasUsado = {
      metodo: maxMethod.metodoPago,
      cantidad: maxMethod.cantidadMovimientos,
      porcentaje: maxMethod.porcentajeDelTotal,
    };
  }

  // Promedios diarios
  const fechas = movimientos.map((m) => dayjs(m.fecha).format('YYYY-MM-DD'));
  const fechasUnicas = Array.from(new Set(fechas));
  const diasConMovimientos = fechasUnicas.length || 1;

  const promedioIngresoDiario = totalIngresos / diasConMovimientos;
  const promedioEgresoDiario = totalEgresos / diasConMovimientos;

  // Cheques
  const chequesEnCartera = chequeData?.find((c) => c.estado === 'EN_CARTERA');
  const chequesEnCarteraData = chequesEnCartera
    ? { cantidad: chequesEnCartera.cantidad, monto: chequesEnCartera.montoTotal }
    : undefined;

  // Cheques vencidos (opcional, requiere campo fechaCobro)
  const chequesVencidos = undefined;

  return {
    totalIngresos,
    totalEgresos,
    flujoNeto,
    totalMovimientos,
    ticketPromedio,
    medianaTransaccion,
    mayorIngreso,
    mayorEgreso,
    metodoPagoMasUsado,
    promedioIngresoDiario,
    promedioEgresoDiario,
    chequesEnCartera: chequesEnCarteraData,
    chequesVencidos,
  };
};

/**
 * Calcula la tendencia semanal comparando con la semana anterior
 */
export const calculateWeeklyTrend = (
  movimientos: FlujoCajaMovimientoEnhanced[]
): number => {
  const now = dayjs();
  const oneWeekAgo = now.subtract(1, 'week');
  const twoWeeksAgo = now.subtract(2, 'week');

  const lastWeek = movimientos.filter((m) => {
    const fecha = dayjs(m.fecha);
    return fecha.isAfter(oneWeekAgo) && fecha.isBefore(now);
  });

  const previousWeek = movimientos.filter((m) => {
    const fecha = dayjs(m.fecha);
    return fecha.isAfter(twoWeeksAgo) && fecha.isBefore(oneWeekAgo);
  });

  const lastWeekTotal = lastWeek.reduce((sum, m) => {
    return sum + (m.tipo === 'INGRESO' ? m.importe : -m.importe);
  }, 0);

  const previousWeekTotal = previousWeek.reduce((sum, m) => {
    return sum + (m.tipo === 'INGRESO' ? m.importe : -m.importe);
  }, 0);

  if (previousWeekTotal === 0) return 0;

  return ((lastWeekTotal - previousWeekTotal) / Math.abs(previousWeekTotal)) * 100;
};

/**
 * Determina la granularidad óptima según el rango de fechas
 */
export const getOptimalGranularity = (
  fechaDesde: dayjs.Dayjs | null,
  fechaHasta: dayjs.Dayjs | null
): 'day' | 'week' | 'month' => {
  if (!fechaDesde || !fechaHasta) return 'day';

  const diffDays = fechaHasta.diff(fechaDesde, 'day');

  if (diffDays <= 31) return 'day';
  if (diffDays <= 90) return 'week';
  return 'month';
};

/**
 * Formatea un número como moneda argentina
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

/**
 * Formatea un porcentaje
 */
export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`;
};

// ==================== FUNCIONES DE CONVERSIÓN BACKEND → FRONTEND ====================

/**
 * Convierte saldosPorMetodoPago del backend a PaymentMethodAggregation del frontend
 */
export const convertSaldosToAggregation = (
  saldos: SaldoPorMetodoPagoDTO[]
): PaymentMethodAggregation[] => {
  return saldos.map((saldo) => ({
    metodoPago: saldo.metodoPago,
    totalIngresos: saldo.ingresos,
    totalEgresos: saldo.egresos,
    flujoNeto: saldo.saldo,
    cantidadMovimientos: saldo.cantidadMovimientos,
    porcentajeDelTotal: saldo.porcentaje,
  }));
};

/**
 * Convierte resumenCheques del backend a ChequeStatusAggregation[] del frontend
 */
export const convertResumenChequesToAggregation = (
  resumen: ResumenChequesDTO
): ChequeStatusAggregation[] => {
  const result: ChequeStatusAggregation[] = [];

  if (resumen.enCartera.cantidad > 0) {
    result.push({
      estado: 'EN_CARTERA',
      cantidad: resumen.enCartera.cantidad,
      montoTotal: resumen.enCartera.monto,
    });
  }

  if (resumen.depositados.cantidad > 0) {
    result.push({
      estado: 'DEPOSITADO',
      cantidad: resumen.depositados.cantidad,
      montoTotal: resumen.depositados.monto,
    });
  }

  if (resumen.cobrados.cantidad > 0) {
    result.push({
      estado: 'COBRADO',
      cantidad: resumen.cobrados.cantidad,
      montoTotal: resumen.cobrados.monto,
    });
  }

  if (resumen.rechazados.cantidad > 0) {
    result.push({
      estado: 'RECHAZADO',
      cantidad: resumen.rechazados.cantidad,
      montoTotal: resumen.rechazados.monto,
    });
  }

  if (resumen.anulados.cantidad > 0) {
    result.push({
      estado: 'ANULADO',
      cantidad: resumen.anulados.cantidad,
      montoTotal: resumen.anulados.monto,
    });
  }

  return result;
};

/**
 * Convierte evolucionDiaria del backend a TimeSeriesData[] del frontend
 */
export const convertEvolucionToTimeSeries = (
  evolucion: EvolucionDiariaDTO[]
): TimeSeriesData[] => {
  return evolucion.map((item) => ({
    fecha: item.fecha,
    ingresos: item.ingresos,
    egresos: item.egresos,
    flujoNeto: item.saldo,
  }));
};

/**
 * Calcula KPIs mejorados usando datos del backend
 */
export const calculateKPIsFromBackend = (
  response: FlujoCajaResponseEnhanced
): FlujoCajaKPIs => {
  const movimientos = response.movimientos;
  const saldos = response.saldosPorMetodoPago || [];
  const resumenCheques = response.resumenCheques;

  // KPIs básicos
  const totalIngresos = response.totalIngresos;
  const totalEgresos = response.totalEgresos;
  const flujoNeto = response.flujoNeto;
  const totalMovimientos = response.totalMovimientos;

  // Ticket promedio
  const ticketPromedio = totalMovimientos > 0
    ? (totalIngresos + totalEgresos) / totalMovimientos
    : 0;

  // Mediana
  const importes = movimientos.map((m) => m.importe).sort((a, b) => a - b);
  const medianaTransaccion = importes.length > 0
    ? importes[Math.floor(importes.length / 2)]
    : 0;

  // Mayor ingreso
  const ingresos = movimientos.filter((m) => m.tipo === 'INGRESO');
  const mayorIngresoMov = ingresos.length > 0
    ? ingresos.reduce((max, mov) => (mov.importe > max.importe ? mov : max), ingresos[0])
    : { importe: 0, entidad: '', metodoPago: undefined, fecha: '' };

  const mayorIngreso = {
    importe: mayorIngresoMov.importe,
    entidad: mayorIngresoMov.entidad || '',
    metodoPago: mayorIngresoMov.metodoPago || undefined,
    fecha: mayorIngresoMov.fecha || '',
  };

  // Mayor egreso
  const egresos = movimientos.filter((m) => m.tipo === 'EGRESO');
  const mayorEgresoMov = egresos.length > 0
    ? egresos.reduce((max, mov) => (mov.importe > max.importe ? mov : max), egresos[0])
    : { importe: 0, entidad: '', metodoPago: undefined, fecha: '' };

  const mayorEgreso = {
    importe: mayorEgresoMov.importe,
    entidad: mayorEgresoMov.entidad || '',
    metodoPago: mayorEgresoMov.metodoPago || undefined,
    fecha: mayorEgresoMov.fecha || '',
  };

  // Método de pago más usado (desde saldos del backend)
  let metodoPagoMasUsado = {
    metodo: 'EFECTIVO' as MetodoPago,
    cantidad: 0,
    porcentaje: 0,
  };

  if (saldos.length > 0) {
    const maxMethod = saldos.reduce(
      (max, s) => (s.cantidadMovimientos > max.cantidadMovimientos ? s : max),
      saldos[0]
    );

    metodoPagoMasUsado = {
      metodo: maxMethod.metodoPago,
      cantidad: maxMethod.cantidadMovimientos,
      porcentaje: maxMethod.porcentaje,
    };
  }

  // Promedios diarios
  const fechas = movimientos.map((m) => dayjs(m.fecha).format('YYYY-MM-DD'));
  const fechasUnicas = Array.from(new Set(fechas));
  const diasConMovimientos = fechasUnicas.length || 1;

  const promedioIngresoDiario = totalIngresos / diasConMovimientos;
  const promedioEgresoDiario = totalEgresos / diasConMovimientos;

  // Cheques (desde resumen del backend)
  const chequesEnCartera = resumenCheques
    ? { cantidad: resumenCheques.enCartera.cantidad, monto: resumenCheques.enCartera.monto }
    : undefined;

  const chequesVencidos = resumenCheques && resumenCheques.chequesVencidos > 0
    ? { cantidad: 0, monto: resumenCheques.chequesVencidos }
    : undefined;

  const chequesPorVencer7Dias = resumenCheques
    ? { cantidad: resumenCheques.porVencer7Dias.cantidad, monto: resumenCheques.porVencer7Dias.monto }
    : undefined;

  return {
    totalIngresos,
    totalEgresos,
    flujoNeto,
    totalMovimientos,
    ticketPromedio,
    medianaTransaccion,
    mayorIngreso,
    mayorEgreso,
    metodoPagoMasUsado,
    promedioIngresoDiario,
    promedioEgresoDiario,
    chequesEnCartera,
    chequesVencidos,
    chequesPorVencer7Dias,
  };
};

// ==================== MOVIMIENTOS EXTRAS ====================

/**
 * Obtiene la etiqueta en español para una categoría de gasto extra
 */
export const getCategoriaGastoLabel = (categoria: CategoriaGastoExtra): string => {
  const labels: Record<CategoriaGastoExtra, string> = {
    VIATICOS: 'Viáticos',
    REPARACION_VEHICULO: 'Reparación de Vehículo',
    SERVICE_MANTENIMIENTO: 'Service y Mantenimiento',
    GASTOS_OPERATIVOS: 'Gastos Operativos',
    SUELDOS_SALARIOS: 'Sueldos y Salarios',
    SERVICIOS_PUBLICOS: 'Servicios Públicos',
    ALQUILER: 'Alquiler',
    IMPUESTOS: 'Impuestos',
    HONORARIOS_PROFESIONALES: 'Honorarios Profesionales',
    SEGUROS: 'Seguros',
    PUBLICIDAD_MARKETING: 'Publicidad y Marketing',
    GASTOS_BANCARIOS: 'Gastos Bancarios',
    OTROS: 'Otros',
  };
  return labels[categoria] || categoria;
};

/**
 * Obtiene la etiqueta en español para una categoría de cobro extra
 */
export const getCategoriaCobroLabel = (categoria: CategoriaCobroExtra): string => {
  const labels: Record<CategoriaCobroExtra, string> = {
    COBRO_MANUAL: 'Cobro Manual',
    AJUSTE_POSITIVO: 'Ajuste Positivo',
    INGRESO_EXTRAORDINARIO: 'Ingreso Extraordinario',
    VENTA_ACTIVO: 'Venta de Activo',
    REEMBOLSO: 'Reembolso',
    INTERESES_GANADOS: 'Intereses Ganados',
    SUBSIDIO: 'Subsidio',
    DONACION: 'Donación',
    OTROS: 'Otros',
  };
  return labels[categoria] || categoria;
};

/**
 * Obtiene el icono MUI para un origen de movimiento
 */
export const getOrigenIcon = (origen: OrigenMovimiento) => {
  switch (origen) {
    case 'CLIENTE':
      return PersonIcon;
    case 'PROVEEDOR':
      return BusinessIcon;
    case 'GASTO_EXTRA':
      return MoneyOffIcon;
    case 'COBRO_EXTRA':
      return AttachMoneyIcon;
    default:
      return HelpOutlineIcon;
  }
};

/**
 * Obtiene la etiqueta en español para un origen de movimiento
 */
export const getOrigenLabel = (origen: OrigenMovimiento): string => {
  const labels: Record<OrigenMovimiento, string> = {
    CLIENTE: 'Cliente',
    PROVEEDOR: 'Proveedor',
    GASTO_EXTRA: 'Gasto Extra',
    COBRO_EXTRA: 'Cobro Extra',
  };
  return labels[origen] || origen;
};

/**
 * Obtiene el color para un tipo de movimiento extra
 */
export const getCategoriaColor = (tipo: 'GASTO' | 'COBRO'): string => {
  return tipo === 'GASTO' ? '#f44336' : '#4caf50';
};
