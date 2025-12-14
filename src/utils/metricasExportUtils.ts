import * as XLSX from 'xlsx';
import type {
  LeadMetricasResponseDTO,
  EmbudoVentasDTO,
  MetricaPorCanalDTO,
  MetricaPorPrioridadDTO,
  MetricaGeograficaDTO,
  MetricaPorVendedorDTO,
  ProductoInteresItemDTO,
  EquipoInteresItemDTO,
  TendenciaMensualDTO
} from '../api/services/leadMetricasApi';

/**
 * Exporta las métricas de leads a un archivo Excel
 * @param metricas - Datos completos de métricas
 * @param nombreArchivo - Nombre del archivo a generar
 */
export const exportarMetricasExcel = (
  metricas: LeadMetricasResponseDTO,
  nombreArchivo: string = 'metricas-leads.xlsx'
) => {
  // Crear un nuevo libro de Excel
  const workbook = XLSX.utils.book_new();

  // === Hoja 1: Resumen General ===
  const resumenData = [
    ['RESUMEN GENERAL DE MÉTRICAS DE LEADS'],
    [],
    ['Tasa de Conversión'],
    ['Total Leads', metricas.tasaConversion.totalLeads],
    ['Leads Convertidos', metricas.tasaConversion.leadsConvertidos],
    ['Tasa de Conversión (%)', metricas.tasaConversion.tasaConversion.toFixed(2)],
    ['Tasa Mes Anterior (%)', metricas.tasaConversion.tasaConversionMesAnterior.toFixed(2)],
    ['Variación (%)', metricas.tasaConversion.variacionPorcentual.toFixed(2)],
    [],
    ['Tiempo de Conversión'],
    ['Promedio (días)', metricas.tiempoConversion.promedioTiempoConversion.toFixed(0)],
    ['Mínimo (días)', metricas.tiempoConversion.tiempoConversionMinimo],
    ['Máximo (días)', metricas.tiempoConversion.tiempoConversionMaximo],
    ['Promedio Mes Anterior (días)', metricas.tiempoConversion.promedioMesAnterior.toFixed(0)],
    ['Variación (%)', metricas.tiempoConversion.variacionPorcentual.toFixed(2)],
    [],
    ['Presupuesto vs Realizado'],
    ['Valor Estimado Total', metricas.presupuestoVsRealizado.valorEstimadoTotal.toFixed(2)],
    ['Valor Realizado', metricas.presupuestoVsRealizado.valorRealizado.toFixed(2)],
    ['Diferencia', metricas.presupuestoVsRealizado.diferencia.toFixed(2)],
    ['% Cumplimiento', metricas.presupuestoVsRealizado.porcentajeCumplimiento.toFixed(2)]
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

  // === Hoja 2: Embudo de Ventas ===
  const embudoData = [
    ['Estado Lead', 'Cantidad', 'Porcentaje (%)', 'Orden']
  ];
  metricas.embudoVentas.forEach((item: EmbudoVentasDTO) => {
    embudoData.push([
      item.estadoLead,
      item.cantidad,
      item.porcentaje.toFixed(2),
      item.orden
    ]);
  });
  const wsEmbudo = XLSX.utils.aoa_to_sheet(embudoData);
  XLSX.utils.book_append_sheet(workbook, wsEmbudo, 'Embudo de Ventas');

  // === Hoja 3: Métricas por Canal ===
  const canalData = [
    ['Canal', 'Total Leads', 'Convertidos', 'Tasa Conv. (%)', 'Tiempo Prom. (días)']
  ];
  metricas.metricasPorCanal.forEach((canal: MetricaPorCanalDTO) => {
    canalData.push([
      canal.canal,
      canal.totalLeads,
      canal.leadsConvertidos,
      canal.tasaConversion.toFixed(2),
      canal.promedioTiempoConversion.toFixed(0)
    ]);
  });
  const wsCanal = XLSX.utils.aoa_to_sheet(canalData);
  XLSX.utils.book_append_sheet(workbook, wsCanal, 'Por Canal');

  // === Hoja 4: Métricas por Prioridad ===
  const prioridadData = [
    ['Prioridad', 'Total Leads', 'Convertidos', 'Tasa Conv. (%)', 'Valor Prom. Estimado']
  ];
  metricas.metricasPorPrioridad.forEach((prio: MetricaPorPrioridadDTO) => {
    prioridadData.push([
      prio.prioridad,
      prio.totalLeads,
      prio.leadsConvertidos,
      prio.tasaConversion.toFixed(2),
      prio.promedioValorEstimado.toFixed(2)
    ]);
  });
  const wsPrioridad = XLSX.utils.aoa_to_sheet(prioridadData);
  XLSX.utils.book_append_sheet(workbook, wsPrioridad, 'Por Prioridad');

  // === Hoja 5: Distribución Geográfica ===
  const geoData = [
    ['Provincia', 'Total Leads', 'Convertidos', 'Tasa Conv. (%)', 'Valor Estimado Total']
  ];
  metricas.distribucionGeografica.forEach((geo: MetricaGeograficaDTO) => {
    geoData.push([
      geo.provincia,
      geo.totalLeads,
      geo.leadsConvertidos,
      geo.tasaConversion.toFixed(2),
      geo.valorEstimadoTotal.toFixed(2)
    ]);
  });
  const wsGeo = XLSX.utils.aoa_to_sheet(geoData);
  XLSX.utils.book_append_sheet(workbook, wsGeo, 'Por Provincia');

  // === Hoja 6: Productos de Interés ===
  const productosData = [
    ['Producto ID', 'Nombre', 'Cantidad Leads', 'Convertidos', 'Tasa Conv. (%)', 'Valor Estimado Total']
  ];
  metricas.productosInteres.productos.forEach((prod: ProductoInteresItemDTO) => {
    productosData.push([
      prod.productoId,
      prod.productoNombre,
      prod.cantidadLeads,
      prod.cantidadConvertidos,
      prod.tasaConversion.toFixed(2),
      prod.valorEstimadoTotal.toFixed(2)
    ]);
  });
  const wsProductos = XLSX.utils.aoa_to_sheet(productosData);
  XLSX.utils.book_append_sheet(workbook, wsProductos, 'Productos');

  // === Hoja 7: Equipos de Interés ===
  const equiposData = [
    ['Equipo ID', 'Nombre', 'Cantidad Leads', 'Convertidos', 'Tasa Conv. (%)']
  ];
  metricas.productosInteres.equipos.forEach((equipo: EquipoInteresItemDTO) => {
    equiposData.push([
      equipo.equipoId,
      equipo.equipoNombre,
      equipo.cantidadLeads,
      equipo.cantidadConvertidos,
      equipo.tasaConversion.toFixed(2)
    ]);
  });
  const wsEquipos = XLSX.utils.aoa_to_sheet(equiposData);
  XLSX.utils.book_append_sheet(workbook, wsEquipos, 'Equipos');

  // === Hoja 8: Vendedores ===
  const vendedoresData = [
    ['Vendedor ID', 'Nombre', 'Total Leads', 'Convertidos', 'Tasa Conv. (%)', 'Valor Estimado', 'Valor Realizado']
  ];
  metricas.metricasPorVendedor.forEach((vend: MetricaPorVendedorDTO) => {
    vendedoresData.push([
      vend.vendedorId,
      vend.vendedorNombre,
      vend.totalLeads,
      vend.leadsConvertidos,
      vend.tasaConversion.toFixed(2),
      vend.valorEstimadoTotal.toFixed(2),
      vend.valorRealizado.toFixed(2)
    ]);
  });
  const wsVendedores = XLSX.utils.aoa_to_sheet(vendedoresData);
  XLSX.utils.book_append_sheet(workbook, wsVendedores, 'Vendedores');

  // === Hoja 9: Tendencias - Leads por Mes ===
  const leadsData = [['Mes', 'Cantidad']];
  metricas.tendenciasTemporales.leadsPorMes.forEach((tendencia: TendenciaMensualDTO) => {
    leadsData.push([tendencia.mes, tendencia.cantidad]);
  });
  const wsLeads = XLSX.utils.aoa_to_sheet(leadsData);
  XLSX.utils.book_append_sheet(workbook, wsLeads, 'Leads por Mes');

  // === Hoja 10: Tendencias - Conversiones por Mes ===
  const conversionesData = [['Mes', 'Cantidad']];
  metricas.tendenciasTemporales.conversionesPorMes.forEach((tendencia: TendenciaMensualDTO) => {
    conversionesData.push([tendencia.mes, tendencia.cantidad]);
  });
  const wsConversiones = XLSX.utils.aoa_to_sheet(conversionesData);
  XLSX.utils.book_append_sheet(workbook, wsConversiones, 'Conversiones por Mes');

  // Generar el archivo Excel
  XLSX.writeFile(workbook, nombreArchivo);
};

/**
 * Exporta las métricas a formato CSV (solo resumen)
 * @param metricas - Datos completos de métricas
 * @param nombreArchivo - Nombre del archivo a generar
 */
export const exportarMetricasCSV = (
  metricas: LeadMetricasResponseDTO,
  nombreArchivo: string = 'metricas-leads.csv'
) => {
  const csvData = [
    ['Métrica', 'Valor'],
    ['Total Leads', metricas.tasaConversion.totalLeads.toString()],
    ['Leads Convertidos', metricas.tasaConversion.leadsConvertidos.toString()],
    ['Tasa de Conversión (%)', metricas.tasaConversion.tasaConversion.toFixed(2)],
    ['Tiempo Prom. Conversión (días)', metricas.tiempoConversion.promedioTiempoConversion.toFixed(0)],
    ['Valor Estimado Total', metricas.presupuestoVsRealizado.valorEstimadoTotal.toFixed(2)],
    ['Valor Realizado', metricas.presupuestoVsRealizado.valorRealizado.toFixed(2)],
    ['% Cumplimiento', metricas.presupuestoVsRealizado.porcentajeCumplimiento.toFixed(2)]
  ];

  const csv = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nombreArchivo;
  link.click();
};

/**
 * Formatea fecha para nombres de archivo
 */
export const generarNombreArchivo = (extension: 'xlsx' | 'csv' = 'xlsx'): string => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `metricas-leads-${año}${mes}${dia}.${extension}`;
};
