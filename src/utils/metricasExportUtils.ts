import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { addCorporateHeader, addCorporateFooter } from './pdfExportUtils';

// Colores corporativos de Ripser (local copy para los autoTable calls)
const COLORS = {
  darkBlue: [20, 66, 114] as [number, number, number],      // #144272 - Barra superior
  lightBlue: [205, 226, 239] as [number, number, number],   // #CDE2EF - Fondo
  white: [255, 255, 255] as [number, number, number],       // #FFFFFF
  black: [0, 0, 0] as [number, number, number],             // #000000
  darkGray: [64, 64, 64] as [number, number, number],       // #404040
  mediumGray: [128, 128, 128] as [number, number, number],  // #808080
  red: [255, 0, 0] as [number, number, number],             // #FF0000
  green: [0, 128, 0] as [number, number, number],           // #008000
};

/**
 * Exporta las métricas de leads a un archivo Excel
 * @param metricas - Datos completos de métricas
 * @param nombreArchivo - Nombre del archivo a generar
 * @param metaMensualLeads - Meta mensual de leads (opcional)
 * @param metaPresupuestoMensual - Meta mensual de presupuesto (opcional)
 * @param sucursalNombre - Nombre de la sucursal filtrada (opcional)
 */
export const exportarMetricasExcel = async (
  metricas: LeadMetricasResponseDTO,
  nombreArchivo: string = 'metricas-leads.xlsx',
  metaMensualLeads?: number,
  metaPresupuestoMensual?: number,
  sucursalNombre?: string
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();

  // === Hoja 1: Resumen General ===
  // Calcular KPIs adicionales
  const totalLeads = metricas.tasaConversion?.totalLeads ?? 0;
  const convertidos = metricas.tasaConversion?.leadsConvertidos ?? 0;
  const perdidosDescartados = metricas.embudoVentas
    .filter(e => ['PERDIDO', 'DESCARTADO'].includes(e.estadoLead))
    .reduce((sum, e) => sum + e.cantidad, 0);
  const leadsEnPipeline = totalLeads - convertidos - perdidosDescartados;

  const cantidadConversiones = metricas.presupuestoVsRealizado?.cantidadPresupuestosRealizados ?? 0;
  const valorRealizado = metricas.presupuestoVsRealizado?.valorRealizadoTotal ?? 0;
  const valorPromedioPorConversion = cantidadConversiones > 0 ? valorRealizado / cantidadConversiones : 0;

  const resumenData: any[] = [
    ['RESUMEN GENERAL DE MÉTRICAS DE LEADS'],
    [],
  ];

  // Agregar información de sucursal si está disponible
  if (sucursalNombre) {
    resumenData.push(['SUCURSAL:', sucursalNombre]);
    resumenData.push(['Fecha de generación:', new Date().toLocaleString('es-AR')]);
    resumenData.push([]);
  }

  // Agregar métricas principales
  resumenData.push(['Tasa de Conversión']);
  resumenData.push(['Total Leads', totalLeads]);
  resumenData.push(['Leads Convertidos', convertidos]);
  resumenData.push(['Leads en Pipeline Activo', leadsEnPipeline]);
  resumenData.push(['Tasa de Conversión (%)', (metricas.tasaConversion?.tasaConversion ?? 0).toFixed(2)]);
  resumenData.push(['Tasa Mes Anterior (%)', (metricas.tasaConversion?.tasaConversionMesAnterior ?? 0).toFixed(2)]);
  resumenData.push(['Variación (%)', (metricas.tasaConversion?.variacionPorcentual ?? 0).toFixed(2)]);
  resumenData.push([]);
  resumenData.push(['Tiempo de Conversión']);
  resumenData.push(['Promedio (días)', (metricas.tiempoConversion?.promedioGeneral ?? 0).toFixed(0)]);
  resumenData.push(['Mínimo (días)', metricas.tiempoConversion?.minimoTiempo ?? 0]);
  resumenData.push(['Máximo (días)', metricas.tiempoConversion?.maximoTiempo ?? 0]);
  resumenData.push(['Mediana (días)', (metricas.tiempoConversion?.medianaGeneral ?? 0).toFixed(0)]);
  resumenData.push([]);
  resumenData.push(['Presupuesto vs Realizado']);
  resumenData.push(['Presupuesto Estimado Total', (metricas.presupuestoVsRealizado?.presupuestoEstimadoTotal ?? 0).toFixed(2)]);
  resumenData.push(['Valor Realizado Total', valorRealizado.toFixed(2)]);
  resumenData.push(['Valor Promedio por Conversión', valorPromedioPorConversion.toFixed(2)]);
  resumenData.push(['Diferencia', (metricas.presupuestoVsRealizado?.diferencia ?? 0).toFixed(2)]);
  resumenData.push(['Tasa Realización (%)', (metricas.presupuestoVsRealizado?.tasaRealizacion ?? 0).toFixed(2)]);
  resumenData.push(['Cant. Presupuestos Estimados', metricas.presupuestoVsRealizado?.cantidadPresupuestosEstimados ?? 0]);
  resumenData.push(['Cant. Presupuestos Realizados', cantidadConversiones]);

  // Agregar metas si están disponibles
  if (metaMensualLeads !== undefined && metaMensualLeads > 0) {
    const cumplimientoLeads = (totalLeads / metaMensualLeads * 100).toFixed(2);
    resumenData.push(
      [],
      ['Meta de Leads'],
      ['Meta Mensual de Leads', metaMensualLeads],
      ['Cumplimiento de Meta (%)', cumplimientoLeads]
    );
  }

  if (metaPresupuestoMensual !== undefined && metaPresupuestoMensual > 0) {
    const cumplimientoPresupuesto = (valorRealizado / metaPresupuestoMensual * 100).toFixed(2);
    resumenData.push(
      [],
      ['Meta de Ventas'],
      ['Meta Mensual de Presupuesto', metaPresupuestoMensual.toFixed(2)],
      ['Cumplimiento de Meta (%)', cumplimientoPresupuesto]
    );
  }
  const wsResumen = workbook.addWorksheet('Resumen');
  resumenData.forEach(row => wsResumen.addRow(row));

  // === Hoja 2: Embudo de Ventas ===
  const embudoData = [
    ['Estado Lead', 'Cantidad', 'Porcentaje (%)', 'Orden']
  ];
  metricas.embudoVentas.forEach((item: EmbudoVentasDTO) => {
    embudoData.push([
      item.estadoLead,
      item.cantidad.toString(),
      item.porcentaje.toFixed(2),
      item.orden.toString()
    ]);
  });
  const wsEmbudo = workbook.addWorksheet('Embudo de Ventas');
  embudoData.forEach(row => wsEmbudo.addRow(row));

  // === Hoja 3: Métricas por Canal ===
  const canalData = [
    ['Canal', 'Total Leads', 'Convertidos', 'Tasa Conv. (%)', 'Tiempo Prom. (días)']
  ];
  metricas.metricasPorCanal.forEach((canal: MetricaPorCanalDTO) => {
    canalData.push([
      canal.canal || 'Sin especificar',
      (canal.totalLeads ?? 0).toString(),
      (canal.leadsConvertidos ?? 0).toString(),
      (canal.tasaConversion ?? 0).toFixed(2),
      (canal.promedioTiempoConversion ?? 0).toFixed(0)
    ]);
  });
  const wsCanal = workbook.addWorksheet('Por Canal');
  canalData.forEach(row => wsCanal.addRow(row));

  // === Hoja 4: Métricas por Prioridad ===
  const prioridadData = [
    ['Prioridad', 'Total Leads', 'Convertidos', 'Tasa Conv. (%)', 'Valor Prom. Estimado']
  ];
  metricas.metricasPorPrioridad.forEach((prio: MetricaPorPrioridadDTO) => {
    prioridadData.push([
      prio.prioridad || 'Sin especificar',
      (prio.cantidad ?? 0).toString(),
      (prio.convertidos ?? 0).toString(),
      (prio.tasaConversion ?? 0).toFixed(2),
      (prio.promedioValorEstimado ?? 0).toFixed(2)
    ]);
  });
  const wsPrioridad = workbook.addWorksheet('Por Prioridad');
  prioridadData.forEach(row => wsPrioridad.addRow(row));

  // === Hoja 5: Distribución Geográfica ===
  const geoData = [
    ['Provincia', 'Total Leads', 'Convertidos', 'Tasa Conv. (%)', 'Valor Estimado Total']
  ];
  metricas.distribucionGeografica.forEach((geo: MetricaGeograficaDTO) => {
    geoData.push([
      geo.provincia || 'Sin especificar',
      (geo.totalLeads ?? 0).toString(),
      (geo.leadsConvertidos ?? 0).toString(),
      (geo.tasaConversion ?? 0).toFixed(2),
      (geo.valorEstimadoTotal ?? 0).toFixed(2)
    ]);
  });
  const wsGeo = workbook.addWorksheet('Por Provincia');
  geoData.forEach(row => wsGeo.addRow(row));

  // === Hoja 6: Productos de Interés ===
  const productosData = [
    ['Producto ID', 'Nombre', 'Cantidad Leads', 'Convertidos', 'Tasa Conv. (%)', 'Valor Estimado Total']
  ];
  metricas.productosInteres.productos.forEach((prod: ProductoInteresItemDTO) => {
    // Los campos pueden venir con diferentes nombres del backend, usar fallbacks
    const cantidadLeads = prod.cantidadLeads ?? prod.cantidad ?? prod.cantidadSolicitudes ?? 0;
    const cantidadConvertidos = prod.cantidadConvertidos ?? prod.convertidos ?? prod.cantidadConvertida ?? 0;

    productosData.push([
      (prod.productoId ?? 0).toString(),
      prod.productoNombre || 'Sin nombre',
      cantidadLeads.toString(),
      cantidadConvertidos.toString(),
      (prod.tasaConversion ?? 0).toFixed(2),
      (prod.valorEstimadoTotal ?? 0).toFixed(2)
    ]);
  });
  const wsProductos = workbook.addWorksheet('Productos');
  productosData.forEach(row => wsProductos.addRow(row));

  // === Hoja 7: Equipos de Interés ===
  const equiposData = [
    ['Equipo ID', 'Nombre', 'Cantidad Leads', 'Convertidos', 'Tasa Conv. (%)']
  ];
  metricas.productosInteres.equipos.forEach((equipo: EquipoInteresItemDTO) => {
    // Los campos pueden venir con diferentes nombres del backend, usar fallbacks
    const cantidadLeads = equipo.cantidadLeads ?? equipo.cantidad ?? equipo.cantidadSolicitudes ?? 0;
    const cantidadConvertidos = equipo.cantidadConvertidos ?? equipo.convertidos ?? equipo.cantidadConvertida ?? 0;

    equiposData.push([
      (equipo.equipoId ?? 0).toString(),
      equipo.equipoNombre || 'Sin nombre',
      cantidadLeads.toString(),
      cantidadConvertidos.toString(),
      (equipo.tasaConversion ?? 0).toFixed(2)
    ]);
  });
  const wsEquipos = workbook.addWorksheet('Equipos');
  equiposData.forEach(row => wsEquipos.addRow(row));

  // === Hoja 8: Vendedores ===
  const vendedoresData = [
    ['Vendedor ID', 'Nombre', 'Total Leads', 'Convertidos', 'Tasa Conv. (%)', 'Valor Estimado', 'Valor Realizado']
  ];
  metricas.metricasPorVendedor.forEach((vend: MetricaPorVendedorDTO) => {
    vendedoresData.push([
      (vend.vendedorId ?? 0).toString(),
      vend.vendedorNombre || 'Sin nombre',
      (vend.totalLeads ?? 0).toString(),
      (vend.leadsConvertidos ?? 0).toString(),
      (vend.tasaConversion ?? 0).toFixed(2),
      (vend.valorEstimadoTotal ?? 0).toFixed(2),
      (vend.valorRealizado ?? 0).toFixed(2)
    ]);
  });
  const wsVendedores = workbook.addWorksheet('Vendedores');
  vendedoresData.forEach(row => wsVendedores.addRow(row));

  // === Hoja 9: Tendencias - Leads por Mes ===
  const leadsData = [['Mes', 'Cantidad']];
  metricas.tendenciasTemporales.leadsPorMes.forEach((tendencia: TendenciaMensualDTO) => {
    leadsData.push([tendencia.mes, tendencia.cantidad.toString()]);
  });
  const wsLeads = workbook.addWorksheet('Leads por Mes');
  leadsData.forEach(row => wsLeads.addRow(row));

  // === Hoja 10: Tendencias - Conversiones por Mes ===
  const conversionesData = [['Mes', 'Cantidad']];
  metricas.tendenciasTemporales.conversionesPorMes.forEach((tendencia: TendenciaMensualDTO) => {
    conversionesData.push([tendencia.mes, tendencia.cantidad.toString()]);
  });
  const wsConversiones = workbook.addWorksheet('Conversiones por Mes');
  conversionesData.forEach(row => wsConversiones.addRow(row));

  // Generar el archivo Excel
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  link.click();
  URL.revokeObjectURL(url);
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
    ['Tiempo Prom. Conversión (días)', metricas.tiempoConversion.promedioGeneral.toFixed(0)],
    ['Presupuesto Estimado Total', metricas.presupuestoVsRealizado.presupuestoEstimadoTotal.toFixed(2)],
    ['Valor Realizado Total', metricas.presupuestoVsRealizado.valorRealizadoTotal.toFixed(2)],
    ['Tasa Realización (%)', metricas.presupuestoVsRealizado.tasaRealizacion.toFixed(2)]
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
export const generarNombreArchivo = (extension: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): string => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `metricas-leads-${año}${mes}${dia}.${extension}`;
};

/**
 * Exporta las métricas de leads a un archivo PDF con formato corporativo
 * @param metricas - Datos completos de métricas
 * @param nombreArchivo - Nombre del archivo a generar
 * @param metaMensualLeads - Meta mensual de leads (opcional)
 * @param metaPresupuestoMensual - Meta mensual de presupuesto (opcional)
 */
export const exportarMetricasPDF = async (
  metricas: LeadMetricasResponseDTO,
  nombreArchivo: string = 'metricas-leads.pdf',
  metaMensualLeads?: number,
  metaPresupuestoMensual?: number,
  sucursalNombre?: string,
  chartImages?: {
    embudoImgData?: string | null;
    canalImgData?: string | null;
    prioridadImgData?: string | null;
    tendenciasImgData?: string | null;
  }
): Promise<void> => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight(); // used for chart overflow checks

    // Agregar encabezado corporativo
    let yPosition = addCorporateHeader(doc, 'Informe de Métricas de Leads');

    // Agregar información de sucursal si está disponible
    if (sucursalNombre) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.darkBlue);
      doc.text(`Sucursal: ${sucursalNombre}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 7;
    }

    // === INDICADORES CLAVE (KPIs) ===
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.darkBlue);
    doc.text('INDICADORES CLAVE', 15, yPosition);
    yPosition += 7;

    // Calcular KPIs adicionales
    const totalLeads = metricas.tasaConversion?.totalLeads ?? 0;
    const convertidos = metricas.tasaConversion?.leadsConvertidos ?? 0;
    const perdidosDescartados = metricas.embudoVentas
      .filter(e => ['PERDIDO', 'DESCARTADO'].includes(e.estadoLead))
      .reduce((sum, e) => sum + e.cantidad, 0);
    const leadsEnPipeline = totalLeads - convertidos - perdidosDescartados;

    const cantidadConversiones = metricas.presupuestoVsRealizado?.cantidadPresupuestosRealizados ?? 0;
    const valorRealizado = metricas.presupuestoVsRealizado?.valorRealizadoTotal ?? 0;
    const valorPromedioPorConversion = cantidadConversiones > 0 ? valorRealizado / cantidadConversiones : 0;

    const kpiRows: any[] = [
      ['Total Leads', totalLeads.toString()],
      ['Leads Convertidos', convertidos.toString()],
      ['Leads en Pipeline Activo', leadsEnPipeline.toString()],
      ['Tasa de Conversión', `${(metricas.tasaConversion?.tasaConversion ?? 0).toFixed(2)}%`],
      ['Tiempo Promedio Conversión', `${(metricas.tiempoConversion?.promedioGeneral ?? 0).toFixed(0)} días`],
    ];

    // Agregar metas si están disponibles
    if (metaMensualLeads !== undefined && metaMensualLeads > 0) {
      const cumplimientoLeads = (totalLeads / metaMensualLeads * 100).toFixed(1);
      kpiRows.push(['Meta de Leads', `${metaMensualLeads} leads`]);
      kpiRows.push(['Cumplimiento Meta Leads', `${cumplimientoLeads}%`]);
    }

    kpiRows.push(['Valor Estimado Total', `$${(metricas.presupuestoVsRealizado?.presupuestoEstimadoTotal ?? 0).toLocaleString('es-AR')}`]);
    kpiRows.push(['Valor Realizado Total', `$${valorRealizado.toLocaleString('es-AR')}`]);
    kpiRows.push(['Valor Promedio por Conversión', `$${valorPromedioPorConversion.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`]);
    kpiRows.push(['% Realización (Est vs Real)', `${(metricas.presupuestoVsRealizado?.tasaRealizacion ?? 0).toFixed(1)}%`]);

    // Agregar meta de presupuesto si está disponible
    if (metaPresupuestoMensual !== undefined && metaPresupuestoMensual > 0) {
      const cumplimientoPresupuesto = (valorRealizado / metaPresupuestoMensual * 100).toFixed(1);
      kpiRows.push(['Meta de Ventas', `$${metaPresupuestoMensual.toLocaleString('es-AR')}`]);
      kpiRows.push(['Cumplimiento Meta Ventas', `${cumplimientoPresupuesto}%`]);
    }

    autoTable(doc, {
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: kpiRows,
      theme: 'plain',
      headStyles: {
        fillColor: COLORS.darkBlue,
        textColor: COLORS.white,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBlue
      },
      margin: { left: 15, right: 15 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Helper local para insertar gráfico con aspect ratio correcto
    const insertChart = (imgData: string, label: string) => {
      const maxWidth = pageWidth - 30;
      const props = (doc as any).getImageProperties(imgData);
      const aspectRatio = props.width / props.height;
      let finalWidth = maxWidth;
      let finalHeight = maxWidth / aspectRatio;
      if (finalHeight > 110) {
        finalHeight = 110;
        finalWidth = finalHeight * aspectRatio;
      }
      const xOffset = 15 + (maxWidth - finalWidth) / 2;
      const needed = 5 + 8 + finalHeight + 10;
      if (yPosition + needed > pageHeight - 20) {
        doc.addPage(); yPosition = addCorporateHeader(doc, 'Informe de Métricas de Leads (cont.)');
      }
      yPosition += 5;
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.darkBlue);
      doc.text(label, 15, yPosition); yPosition += 8;
      doc.addImage(imgData, 'PNG', xOffset, yPosition, finalWidth, finalHeight);
      yPosition += finalHeight + 10;
    };

    // === EMBUDO DE VENTAS ===
    if (chartImages?.embudoImgData) {
      insertChart(chartImages.embudoImgData, 'Embudo de Ventas');
    }
    if (yPosition > 240) {
      doc.addPage();
      yPosition = addCorporateHeader(doc, 'Informe de Métricas de Leads (cont.)');
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.darkBlue);
    doc.text('EMBUDO DE VENTAS', 15, yPosition);
    yPosition += 7;

    autoTable(doc, {
      startY: yPosition,
      head: [['Estado', 'Cantidad', 'Porcentaje']],
      body: metricas.embudoVentas.map((item: EmbudoVentasDTO) => [
        item.estadoLead || 'Sin estado',
        (item.cantidad ?? 0).toString(),
        `${(item.porcentaje ?? 0).toFixed(2)}%`
      ]),
      theme: 'plain',
      headStyles: { 
        fillColor: COLORS.darkBlue,
        textColor: COLORS.white,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBlue
      },
      margin: { left: 15, right: 15 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // === MÉTRICAS POR CANAL ===
    if (chartImages?.canalImgData) {
      insertChart(chartImages.canalImgData, 'Métricas por Canal');
    }
    if (yPosition > 240) {
      doc.addPage();
      yPosition = addCorporateHeader(doc, 'Informe de Métricas de Leads (cont.)');
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.darkBlue);
    doc.text('MÉTRICAS POR CANAL', 15, yPosition);
    yPosition += 7;

    autoTable(doc, {
      startY: yPosition,
      head: [['Canal', 'Total Leads', 'Convertidos', 'Tasa Conv.', 'Tiempo Prom.']],
      body: metricas.metricasPorCanal.map((canal: MetricaPorCanalDTO) => [
        canal.canal || 'Sin especificar',
        (canal.totalLeads ?? 0).toString(),
        (canal.leadsConvertidos ?? 0).toString(),
        `${(canal.tasaConversion ?? 0).toFixed(1)}%`,
        `${(canal.promedioTiempoConversion ?? 0).toFixed(0)} días`
      ]),
      theme: 'plain',
      headStyles: { 
        fillColor: COLORS.darkBlue,
        textColor: COLORS.white,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBlue
      },
      margin: { left: 15, right: 15 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // === MÉTRICAS POR PRIORIDAD ===
    if (chartImages?.prioridadImgData) {
      insertChart(chartImages.prioridadImgData, 'Métricas por Prioridad');
    }
    if (yPosition > 240) {
      doc.addPage();
      yPosition = addCorporateHeader(doc, 'Informe de Métricas de Leads (cont.)');
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.darkBlue);
    doc.text('MÉTRICAS POR PRIORIDAD', 15, yPosition);
    yPosition += 7;

    autoTable(doc, {
      startY: yPosition,
      head: [['Prioridad', 'Total Leads', 'Convertidos', 'Tasa Conv.', 'Valor Prom.']],
      body: metricas.metricasPorPrioridad.map((prio: MetricaPorPrioridadDTO) => [
        prio.prioridad || 'Sin especificar',
        (prio.cantidad ?? 0).toString(),
        (prio.convertidos ?? 0).toString(),
        `${(prio.tasaConversion ?? 0).toFixed(1)}%`,
        `$${(prio.promedioValorEstimado ?? 0).toLocaleString('es-AR')}`
      ]),
      theme: 'plain',
      headStyles: { 
        fillColor: COLORS.darkBlue,
        textColor: COLORS.white,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBlue
      },
      margin: { left: 15, right: 15 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Tendencias Temporales chart
    if (chartImages?.tendenciasImgData) {
      insertChart(chartImages.tendenciasImgData, 'Tendencias Temporales');
    }

    // === TOP 5 EQUIPOS ===
    if (metricas.productosInteres.equipos.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = addCorporateHeader(doc, 'Informe de Métricas de Leads (cont.)');
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.darkBlue);
      doc.text('TOP 5 EQUIPOS DE INTERÉS', 15, yPosition);
      yPosition += 7;

      const topEquipos = [...metricas.productosInteres.equipos]
        .sort((a, b) => {
          const aLeads = a.cantidadLeads ?? a.cantidad ?? a.cantidadSolicitudes ?? 0;
          const bLeads = b.cantidadLeads ?? b.cantidad ?? b.cantidadSolicitudes ?? 0;
          return bLeads - aLeads;
        })
        .slice(0, 5);

      autoTable(doc, {
        startY: yPosition,
        head: [['Equipo', 'Leads', 'Convertidos', 'Tasa Conv.']],
        body: topEquipos.map((equipo: EquipoInteresItemDTO) => {
          const cantidadLeads = equipo.cantidadLeads ?? equipo.cantidad ?? equipo.cantidadSolicitudes ?? 0;
          const cantidadConvertidos = equipo.cantidadConvertidos ?? equipo.convertidos ?? equipo.cantidadConvertida ?? 0;

          return [
            equipo.equipoNombre || 'Sin nombre',
            cantidadLeads.toString(),
            cantidadConvertidos.toString(),
            `${(equipo.tasaConversion ?? 0).toFixed(1)}%`
          ];
        }),
        theme: 'plain',
        headStyles: { 
          fillColor: COLORS.darkBlue,
          textColor: COLORS.white,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: COLORS.lightBlue
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // === TOP 5 PRODUCTOS ===
    if (metricas.productosInteres.productos.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = addCorporateHeader(doc, 'Informe de Métricas de Leads (cont.)');
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.darkBlue);
      doc.text('TOP 5 PRODUCTOS DE INTERÉS', 15, yPosition);
      yPosition += 7;

      const topProductos = [...metricas.productosInteres.productos]
        .sort((a, b) => {
          const aLeads = a.cantidadLeads ?? a.cantidad ?? a.cantidadSolicitudes ?? 0;
          const bLeads = b.cantidadLeads ?? b.cantidad ?? b.cantidadSolicitudes ?? 0;
          return bLeads - aLeads;
        })
        .slice(0, 5);

      autoTable(doc, {
        startY: yPosition,
        head: [['Producto', 'Leads', 'Convertidos', 'Tasa Conv.', 'Valor Est.']],
        body: topProductos.map((prod: ProductoInteresItemDTO) => {
          const cantidadLeads = prod.cantidadLeads ?? prod.cantidad ?? prod.cantidadSolicitudes ?? 0;
          const cantidadConvertidos = prod.cantidadConvertidos ?? prod.convertidos ?? prod.cantidadConvertida ?? 0;

          return [
            prod.productoNombre || 'Sin nombre',
            cantidadLeads.toString(),
            cantidadConvertidos.toString(),
            `${(prod.tasaConversion ?? 0).toFixed(1)}%`,
            `$${(prod.valorEstimadoTotal ?? 0).toLocaleString('es-AR')}`
          ];
        }),
        theme: 'plain',
        headStyles: { 
          fillColor: COLORS.darkBlue,
          textColor: COLORS.white,
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: COLORS.lightBlue
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // === RANKING DE VENDEDORES (Top 10) ===
    if (metricas.metricasPorVendedor.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = addCorporateHeader(doc, 'Informe de Métricas de Leads (cont.)');
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.darkBlue);
      doc.text('TOP 10 VENDEDORES', 15, yPosition);
      yPosition += 7;

      const topVendedores = [...metricas.metricasPorVendedor]
        .sort((a, b) => (b.leadsConvertidos ?? 0) - (a.leadsConvertidos ?? 0))
        .slice(0, 10);

      autoTable(doc, {
        startY: yPosition,
        head: [['Vendedor', 'Leads', 'Conv.', 'Tasa', 'Val. Est.', 'Val. Real.']],
        body: topVendedores.map((vend: MetricaPorVendedorDTO) => [
          vend.vendedorNombre || 'Sin nombre',
          (vend.totalLeads ?? 0).toString(),
          (vend.leadsConvertidos ?? 0).toString(),
          `${(vend.tasaConversion ?? 0).toFixed(1)}%`,
          `$${((vend.valorEstimadoTotal ?? 0) / 1000).toFixed(0)}k`,
          `$${((vend.valorRealizado ?? 0) / 1000).toFixed(0)}k`
        ]),
        theme: 'plain',
        headStyles: { 
          fillColor: COLORS.darkBlue,
          textColor: COLORS.white,
          fontSize: 7,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 7
        },
        alternateRowStyles: {
          fillColor: COLORS.lightBlue
        },
        margin: { left: 15, right: 15 }
      });
    }

    // Footer corporativo
    addCorporateFooter(doc);

    // Guardar el PDF
    doc.save(nombreArchivo);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('No se pudo generar el archivo PDF. Verifique que los datos estén completos.');
  }
};
