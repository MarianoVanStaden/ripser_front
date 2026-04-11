import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Colores corporativos de Ripser
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
 * Agrega el encabezado corporativo de Ripser a un PDF
 * @param pdf Instancia de jsPDF
 * @param title Título del documento (ej: "Informe de Ventas")
 * @returns La posición Y donde debe comenzar el contenido
 */
export const addCorporateHeader = (pdf: jsPDF, title: string): number => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  let yPosition = margin;

  // Barra superior azul con logo
  pdf.setFillColor(...COLORS.darkBlue);
  pdf.rect(margin, yPosition, pageWidth - (margin * 2), 25, 'F');

  // Logo texto "Ripser" en cursiva
  pdf.setTextColor(...COLORS.white);
  pdf.setFontSize(24);
  pdf.setFont('times', 'italic');
  pdf.text('Ripser', margin + 5, yPosition + 12);

  // "INSTALACIONES COMERCIALES" debajo del logo
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('INSTALACIONES', margin + 5, yPosition + 16);
  pdf.text('COMERCIALES', margin + 5, yPosition + 19);

  // Información de contacto (derecha)
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  const contactX = pageWidth - margin - 5;
  pdf.text('@RipserInstalacionesComerciales', contactX, yPosition + 10, { align: 'right' });
  pdf.text('www.ripser.com.ar', contactX, yPosition + 14, { align: 'right' });
  pdf.text('+54 2235332796', contactX, yPosition + 18, { align: 'right' });

  // Fondo gris claro para el resto del documento
  pdf.setFillColor(...COLORS.lightBlue);
  pdf.rect(margin, yPosition + 25, pageWidth - (margin * 2), pageHeight - yPosition - 35, 'F');

  yPosition += 30;

  // Título del documento en caja blanca
  pdf.setFillColor(...COLORS.white);
  pdf.rect(margin + 1, yPosition, pageWidth - (margin * 2) - 2, 8, 'F');

  pdf.setTextColor(...COLORS.darkBlue);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title.toUpperCase(), pageWidth / 2, yPosition + 5.5, { align: 'center' });

  yPosition += 10;

  // Fecha de generación
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.black);
  pdf.text(`Fecha de generación: ${new Date().toLocaleString('es-AR')}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  return yPosition;
};

/**
 * Agrega el footer corporativo de Ripser a un PDF
 * @param pdf Instancia de jsPDF
 */
export const addCorporateFooter = (pdf: jsPDF): void => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const footerY = pageHeight - 15;

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...COLORS.darkGray);
  pdf.text('Ripser - Instalaciones Comerciales', pageWidth / 2, footerY, { align: 'center' });
};

/**
 * Genera un PDF del informe de ventas completo
 * @param reportData Datos del reporte agrupados
 * @param filters Filtros aplicados
 * @param totals Totales calculados
 */
export const generateSalesReportPDF = async (
  reportData: Record<string, { count: number; total: number }>,
  filters: {
    searchTerm: string;
    statusFilter: string;
    paymentMethodFilter: string;
    clientFilter: string;
    vendedorFilter: string;
    dateFromFilter: Date | null;
    dateToFilter: Date | null;
  },
  totals: {
    totalRevenue: number;
    totalTransactions: number;
    averageOrderValue: number;
  },
  groupBy: string,
  chartImages?: {
    chartImgData: string | null;
    chartLabel: string;
  }
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Agregar encabezado corporativo
  let yPosition = addCorporateHeader(pdf, 'Informe de Ventas');

  // Filtros aplicados
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Filtros Aplicados:', 15, yPosition);
  yPosition += 7;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');

  if (filters.searchTerm) {
    pdf.text(`Búsqueda: ${filters.searchTerm}`, 20, yPosition);
    yPosition += 5;
  }
  if (filters.statusFilter !== 'all') {
    pdf.text(`Estado: ${filters.statusFilter}`, 20, yPosition);
    yPosition += 5;
  }
  if (filters.paymentMethodFilter !== 'all') {
    pdf.text(`Método de Pago: ${filters.paymentMethodFilter}`, 20, yPosition);
    yPosition += 5;
  }
  if (filters.dateFromFilter || filters.dateToFilter) {
    const fromDate = filters.dateFromFilter ? filters.dateFromFilter.toLocaleDateString() : 'Inicio';
    const toDate = filters.dateToFilter ? filters.dateToFilter.toLocaleDateString() : 'Fin';
    pdf.text(`Período: ${fromDate} - ${toDate}`, 20, yPosition);
    yPosition += 5;
  }

  yPosition += 5;

  // Totales
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Resumen General:', 15, yPosition);
  yPosition += 7;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Ingresos Totales: $${totals.totalRevenue.toLocaleString()}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Total de Ventas: ${totals.totalTransactions}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Valor Promedio: $${totals.averageOrderValue.toFixed(2)}`, 20, yPosition);
  yPosition += 10;

  // Gráfico (si fue capturado)
  if (chartImages?.chartImgData) {
    yPosition = insertChartImage(pdf, chartImages.chartImgData, chartImages.chartLabel,
      yPosition, pageWidth, pageHeight);
  }

  // Tabla de datos agrupados
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Ventas por ${groupBy}:`, 15, yPosition);
  yPosition += 7;

  // Encabezados de tabla
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  const col1 = 15;
  const col2 = 90;
  const col3 = 130;
  const col4 = 170;

  pdf.text(groupBy, col1, yPosition);
  pdf.text('Cantidad', col2, yPosition);
  pdf.text('Total', col3, yPosition);
  pdf.text('Porcentaje', col4, yPosition);
  yPosition += 5;

  // Línea separadora
  pdf.setLineWidth(0.5);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 5;

  // Datos de la tabla
  pdf.setFont('helvetica', 'normal');

  Object.entries(reportData).forEach(([key, value]) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = 20;
    }

    const percentage = totals.totalRevenue > 0 ? ((value.total / totals.totalRevenue) * 100).toFixed(2) : '0';

    // Truncate key if too long
    const displayKey = key.length > 30 ? key.substring(0, 27) + '...' : key;

    pdf.text(displayKey, col1, yPosition);
    pdf.text(value.count.toString(), col2, yPosition);
    pdf.text(`$${value.total.toLocaleString()}`, col3, yPosition);
    pdf.text(`${percentage}%`, col4, yPosition);
    yPosition += 6;
  });

  // Línea separadora final
  yPosition += 2;
  pdf.setLineWidth(0.5);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 5;

  // Totales finales
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL', col1, yPosition);
  pdf.text(totals.totalTransactions.toString(), col2, yPosition);
  pdf.text(`$${totals.totalRevenue.toLocaleString()}`, col3, yPosition);
  pdf.text('100%', col4, yPosition);

  // Footer corporativo
  addCorporateFooter(pdf);

  // Save PDF
  pdf.save(`informe-ventas-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Genera un PDF del detalle de una venta específica
 * @param sale Datos de la venta
 * @param opcionesFinanciamiento Opciones de financiamiento si existen
 * @param getClientFullName Función para obtener el nombre completo del cliente
 * @param getUsuarioFullName Función para obtener el nombre completo del usuario
 * @param getStatusLabel Función para obtener la etiqueta del estado
 * @param getPaymentMethodLabel Función para obtener la etiqueta del método de pago
 */
export const generateSaleDetailPDF = async (
  sale: any,
  opcionesFinanciamiento: any[] | undefined,
  getClientFullName: (cliente: any) => string,
  getUsuarioFullName: (usuario: any) => string,
  getStatusLabel: (status: string) => string,
  getPaymentMethodLabel: (method: string) => string
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Agregar encabezado corporativo
  let yPosition = addCorporateHeader(pdf, `Detalle de Venta #${sale.id}`);

  // Información General
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Información General', 15, yPosition);
  yPosition += 7;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Número: ${sale.numeroVenta || 'N/A'}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Fecha: ${new Date(sale.fechaVenta).toLocaleString()}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Estado: ${getStatusLabel(sale.estado)}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Método de Pago: ${getPaymentMethodLabel(sale.metodoPago)}`, 20, yPosition);
  yPosition += 10;

  // Cliente y Vendedor
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Cliente y Vendedor', 15, yPosition);
  yPosition += 7;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Cliente: ${getClientFullName(sale.cliente)}`, 20, yPosition);
  yPosition += 6;

  if (sale.cliente?.email) {
    pdf.text(`Email: ${sale.cliente.email}`, 20, yPosition);
    yPosition += 6;
  }

  pdf.text(`Vendedor: ${getUsuarioFullName(sale.usuario)}`, 20, yPosition);
  yPosition += 10;

  // Productos
  if (sale.detalleVentas && sale.detalleVentas.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Productos (${sale.detalleVentas.length} artículos)`, 15, yPosition);
    yPosition += 7;

    // Tabla de productos
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const prodCol1 = 15;
    const prodCol2 = 100;
    const prodCol3 = 125;
    const prodCol4 = 150;
    const prodCol5 = 175;

    pdf.text('Producto', prodCol1, yPosition);
    pdf.text('Cant.', prodCol2, yPosition);
    pdf.text('Precio', prodCol3, yPosition);
    pdf.text('Desc.', prodCol4, yPosition);
    pdf.text('Subtotal', prodCol5, yPosition);
    yPosition += 4;

    pdf.setLineWidth(0.3);
    pdf.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 4;

    pdf.setFont('helvetica', 'normal');

    sale.detalleVentas.forEach((item: any) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      let productName = '';
      if (item.tipoItem === 'EQUIPO') {
        productName = item.recetaNombre || item.descripcionEquipo || 'Equipo';
      } else {
        productName = item.producto?.nombre || item.productoNombre || 'Producto';
      }

      // Truncate product name if too long
      if (productName.length > 40) {
        productName = productName.substring(0, 37) + '...';
      }

      pdf.text(productName, prodCol1, yPosition);
      pdf.text(item.cantidad.toString(), prodCol2, yPosition);
      pdf.text(`$${item.precioUnitario?.toFixed(2) || '0.00'}`, prodCol3, yPosition);
      pdf.text(`${item.descuento || 0}%`, prodCol4, yPosition);
      pdf.text(`$${item.subtotal?.toFixed(2) || '0.00'}`, prodCol5, yPosition);
      yPosition += 5;

      // Si es equipo y tiene números de heladera, agregar esa info
      if (item.tipoItem === 'EQUIPO' && item.equiposNumerosHeladera && item.equiposNumerosHeladera.length > 0) {
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Equipos: ${item.equiposNumerosHeladera.join(', ')}`, prodCol1 + 5, yPosition);
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        yPosition += 4;
      }
    });

    yPosition += 2;
    pdf.setLineWidth(0.3);
    pdf.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 5;
  }

  // Opciones de Financiamiento
  if (opcionesFinanciamiento && opcionesFinanciamiento.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Opciones de Financiamiento', 15, yPosition);
    yPosition += 7;

    pdf.setFontSize(8);
    opcionesFinanciamiento.forEach((opcion: any) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      const isSelected = opcion.esSeleccionada;
      if (isSelected) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }

      pdf.text(`${opcion.nombre}${isSelected ? ' (Seleccionada)' : ''}`, 20, yPosition);
      yPosition += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.text(`  Método: ${getPaymentMethodLabel(opcion.metodoPago)} | Cuotas: ${opcion.cantidadCuotas} | Tasa: ${opcion.tasaInteres}%`, 20, yPosition);
      yPosition += 5;
      pdf.text(`  Monto Total: $${opcion.montoTotal?.toLocaleString()} | Monto Cuota: $${opcion.montoCuota?.toLocaleString()}`, 20, yPosition);
      yPosition += 7;
    });
  }

  // Notas
  if (sale.notas) {
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notas', 15, yPosition);
    yPosition += 7;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Split long notes into multiple lines
    const notesLines = pdf.splitTextToSize(sale.notas, pageWidth - 40);
    notesLines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, 20, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
  }

  // Total
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const totalText = `Total: $${(sale.total || 0).toLocaleString()}`;
  pdf.text(totalText, pageWidth - 20, yPosition, { align: 'right' });

  // Footer corporativo
  addCorporateFooter(pdf);

  // Save PDF
  pdf.save(`venta-${sale.numeroVenta || sale.id}-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Genera un PDF de la lista de ventas (Registro de Ventas)
 * @param sales Lista de ventas filtradas
 * @param filters Filtros aplicados
 * @param totals Totales calculados
 * @param getClientFullName Función para obtener el nombre completo del cliente
 * @param getUsuarioFullName Función para obtener el nombre completo del usuario
 * @param getStatusLabel Función para obtener la etiqueta del estado
 * @param getPaymentMethodLabel Función para obtener la etiqueta del método de pago
 */
export const generateSalesListPDF = async (
  sales: any[],
  filters: {
    searchTerm: string;
    statusFilter: string;
    paymentMethodFilter: string;
    clientFilter: string;
    dateFromFilter: string;
    dateToFilter: string;
  },
  totals: {
    totalRevenue: number;
    totalTransactions: number;
    averageOrderValue: number;
  },
  getClientFullName: (cliente: any) => string,
  getUsuarioFullName: (usuario: any) => string,
  getStatusLabel: (status: string) => string,
  getPaymentMethodLabel: (method: any) => string
) => {
  const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation for better table fit
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Agregar encabezado corporativo
  let yPosition = addCorporateHeader(pdf, 'Registro de Ventas');

  // Filtros aplicados
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Filtros Aplicados:', 15, yPosition);
  yPosition += 7;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');

  if (filters.searchTerm) {
    pdf.text(`Búsqueda: ${filters.searchTerm}`, 20, yPosition);
    yPosition += 5;
  }
  if (filters.statusFilter !== 'all') {
    pdf.text(`Estado: ${filters.statusFilter}`, 20, yPosition);
    yPosition += 5;
  }
  if (filters.paymentMethodFilter !== 'all') {
    pdf.text(`Método de Pago: ${filters.paymentMethodFilter}`, 20, yPosition);
    yPosition += 5;
  }
  if (filters.dateFromFilter || filters.dateToFilter) {
    const fromDate = filters.dateFromFilter || 'Inicio';
    const toDate = filters.dateToFilter || 'Fin';
    pdf.text(`Período: ${fromDate} - ${toDate}`, 20, yPosition);
    yPosition += 5;
  }

  yPosition += 5;

  // Totales
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Resumen General:', 15, yPosition);
  yPosition += 7;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Ingresos Totales: $${totals.totalRevenue.toLocaleString()}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Total de Ventas: ${totals.totalTransactions}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Valor Promedio: $${totals.averageOrderValue.toFixed(2)}`, 20, yPosition);
  yPosition += 10;

  // Tabla de ventas
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Lista de Ventas:', 15, yPosition);
  yPosition += 7;

  // Encabezados de tabla
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  const col1 = 15;  // ID
  const col2 = 35;  // Fecha
  const col3 = 75;  // Cliente
  const col4 = 140; // Vendedor
  const col5 = 190; // Estado
  const col6 = 225; // Total
  const col7 = 260; // Método de Pago

  pdf.text('ID', col1, yPosition);
  pdf.text('Fecha', col2, yPosition);
  pdf.text('Cliente', col3, yPosition);
  pdf.text('Vendedor', col4, yPosition);
  pdf.text('Estado', col5, yPosition);
  pdf.text('Total', col6, yPosition);
  pdf.text('Método Pago', col7, yPosition);
  yPosition += 4;

  // Línea separadora
  pdf.setLineWidth(0.5);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 5;

  // Datos de la tabla
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);

  sales.forEach((sale) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;

      // Reprint headers
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ID', col1, yPosition);
      pdf.text('Fecha', col2, yPosition);
      pdf.text('Cliente', col3, yPosition);
      pdf.text('Vendedor', col4, yPosition);
      pdf.text('Estado', col5, yPosition);
      pdf.text('Total', col6, yPosition);
      pdf.text('Método Pago', col7, yPosition);
      yPosition += 4;
      pdf.setLineWidth(0.5);
      pdf.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 5;
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
    }

    const id = `#${sale.id}`;
    const fecha = sale.fechaVenta ? new Date(sale.fechaVenta).toLocaleDateString() : '-';
    const cliente = getClientFullName(sale.cliente);
    const vendedor = getUsuarioFullName(sale.usuario || sale.empleado);
    const estado = getStatusLabel(sale.estado);
    const total = `$${(sale.total || 0).toLocaleString()}`;
    const metodoPago = getPaymentMethodLabel(sale.metodoPago);

    // Truncate long names
    const clienteTrunc = cliente.length > 30 ? cliente.substring(0, 27) + '...' : cliente;
    const vendedorTrunc = vendedor.length > 23 ? vendedor.substring(0, 20) + '...' : vendedor;
    const metodoPagoTrunc = metodoPago.length > 20 ? metodoPago.substring(0, 17) + '...' : metodoPago;

    pdf.text(id, col1, yPosition);
    pdf.text(fecha, col2, yPosition);
    pdf.text(clienteTrunc, col3, yPosition);
    pdf.text(vendedorTrunc, col4, yPosition);
    pdf.text(estado, col5, yPosition);
    pdf.text(total, col6, yPosition);
    pdf.text(metodoPagoTrunc, col7, yPosition);
    yPosition += 5;
  });

  // Línea separadora final
  yPosition += 2;
  if (yPosition > pageHeight - 30) {
    pdf.addPage();
    yPosition = 20;
  }
  pdf.setLineWidth(0.5);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 5;

  // Totales finales
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL', col1, yPosition);
  pdf.text(totals.totalTransactions.toString(), col5, yPosition);
  pdf.text(`$${totals.totalRevenue.toLocaleString()}`, col6, yPosition);

  // Footer corporativo
  addCorporateFooter(pdf);

  // Save PDF
  pdf.save(`registro-ventas-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Genera un PDF de la lista de compras/pedidos
 * @param ordenes Lista de órdenes filtradas
 * @param filters Filtros aplicados
 * @param stats Estadísticas calculadas
 */
export const generatePurchaseOrdersListPDF = async (
  ordenes: any[],
  filters: {
    searchTerm: string;
    estadoFilter: string;
    supplierFilter: string;
    fechaDesde: string;
    fechaHasta: string;
  },
  stats: {
    pendientes: number;
    enTransito: number;
    recibidas: number;
    totalAmount: number;
  }
) => {
  const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Agregar encabezado corporativo
  let yPosition = addCorporateHeader(pdf, 'Compras y Pedidos');

  // Filtros aplicados
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Filtros Aplicados:', 15, yPosition);
  yPosition += 7;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');

  if (filters.searchTerm) {
    pdf.text(`Búsqueda: ${filters.searchTerm}`, 20, yPosition);
    yPosition += 5;
  }
  if (filters.estadoFilter) {
    pdf.text(`Estado: ${filters.estadoFilter}`, 20, yPosition);
    yPosition += 5;
  }
  if (filters.supplierFilter) {
    pdf.text(`Proveedor: ${filters.supplierFilter}`, 20, yPosition);
    yPosition += 5;
  }
  if (filters.fechaDesde || filters.fechaHasta) {
    const fromDate = filters.fechaDesde || 'Inicio';
    const toDate = filters.fechaHasta || 'Fin';
    pdf.text(`Período: ${fromDate} - ${toDate}`, 20, yPosition);
    yPosition += 5;
  }

  yPosition += 5;

  // Resumen
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Resumen:', 15, yPosition);
  yPosition += 7;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Órdenes Pendientes: ${stats.pendientes}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Órdenes en Tránsito: ${stats.enTransito}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Órdenes Recibidas: ${stats.recibidas}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Monto Total: $${stats.totalAmount.toLocaleString()}`, 20, yPosition);
  yPosition += 10;

  // Tabla de órdenes
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Lista de Órdenes:', 15, yPosition);
  yPosition += 7;

  // Encabezados de tabla
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  const col1 = 15;  // Número
  const col2 = 45;  // Proveedor
  const col3 = 120; // F. Creación
  const col4 = 165; // F. Entrega Est.
  const col5 = 210; // Estado
  const col6 = 250; // Total

  pdf.text('Número', col1, yPosition);
  pdf.text('Proveedor', col2, yPosition);
  pdf.text('F. Creación', col3, yPosition);
  pdf.text('F. Entrega Est.', col4, yPosition);
  pdf.text('Estado', col5, yPosition);
  pdf.text('Total', col6, yPosition);
  yPosition += 4;

  // Línea separadora
  pdf.setLineWidth(0.5);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 5;

  // Datos de la tabla
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);

  ordenes.forEach((orden) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;

      // Reprint headers
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Número', col1, yPosition);
      pdf.text('Proveedor', col2, yPosition);
      pdf.text('F. Creación', col3, yPosition);
      pdf.text('F. Entrega Est.', col4, yPosition);
      pdf.text('Estado', col5, yPosition);
      pdf.text('Total', col6, yPosition);
      yPosition += 4;
      pdf.setLineWidth(0.5);
      pdf.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 5;
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
    }

    const numero = orden.numero || `OC-${orden.id}`;
    const proveedor = orden.proveedor?.razonSocial || 'N/A';
    const fechaCreacion = orden.fechaCreacion ? new Date(orden.fechaCreacion).toLocaleDateString() : '-';
    const fechaEntrega = orden.fechaEntregaEstimada ? new Date(orden.fechaEntregaEstimada).toLocaleDateString() : '-';
    const estado = orden.estado || 'N/A';
    const total = `$${(orden.total || 0).toLocaleString()}`;

    // Truncate long names
    const proveedorTrunc = proveedor.length > 35 ? proveedor.substring(0, 32) + '...' : proveedor;

    pdf.text(numero, col1, yPosition);
    pdf.text(proveedorTrunc, col2, yPosition);
    pdf.text(fechaCreacion, col3, yPosition);
    pdf.text(fechaEntrega, col4, yPosition);
    pdf.text(estado, col5, yPosition);
    pdf.text(total, col6, yPosition);
    yPosition += 5;
  });

  // Línea separadora final
  yPosition += 2;
  if (yPosition > pageHeight - 30) {
    pdf.addPage();
    yPosition = 20;
  }
  pdf.setLineWidth(0.5);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 5;

  // Totales finales
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL', col1, yPosition);
  pdf.text(ordenes.length.toString(), col5, yPosition);
  pdf.text(`$${stats.totalAmount.toLocaleString()}`, col6, yPosition);

  // Footer corporativo
  addCorporateFooter(pdf);

  // Save PDF
  pdf.save(`compras-pedidos-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Genera un PDF del detalle de una orden de compra
 * @param orden Datos de la orden
 */
export const generatePurchaseOrderDetailPDF = async (orden: any) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Agregar encabezado corporativo
  let yPosition = addCorporateHeader(pdf, `Orden de Compra ${orden.numero || `OC-${orden.id}`}`);

  // Información General
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Información General', 15, yPosition);
  yPosition += 7;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Proveedor: ${orden.proveedor?.razonSocial || 'N/A'}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Estado: ${orden.estado || 'N/A'}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Fecha Creación: ${orden.fechaCreacion ? new Date(orden.fechaCreacion).toLocaleDateString() : '-'}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Entrega Estimada: ${orden.fechaEntregaEstimada ? new Date(orden.fechaEntregaEstimada).toLocaleDateString() : '-'}`, 20, yPosition);
  yPosition += 6;

  if (orden.fechaEntregaReal) {
    pdf.text(`Entrega Real: ${new Date(orden.fechaEntregaReal).toLocaleDateString()}`, 20, yPosition);
    yPosition += 6;
  }

  if (orden.observaciones) {
    yPosition += 2;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Observaciones:', 20, yPosition);
    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    const observacionesLines = pdf.splitTextToSize(orden.observaciones, pageWidth - 40);
    observacionesLines.forEach((line: string) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, 20, yPosition);
      yPosition += 5;
    });
  }

  yPosition += 5;

  // Items de la Orden
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Items de la Orden', 15, yPosition);
  yPosition += 7;

  // Tabla de items
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  const itemCol1 = 15;
  const itemCol2 = 120;
  const itemCol3 = 145;
  const itemCol4 = 175;

  pdf.text('Descripción', itemCol1, yPosition);
  pdf.text('Cantidad', itemCol2, yPosition);
  pdf.text('Precio Unit.', itemCol3, yPosition);
  pdf.text('Subtotal', itemCol4, yPosition);
  yPosition += 4;

  pdf.setLineWidth(0.3);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 4;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  if (orden.items && orden.items.length > 0) {
    orden.items.forEach((item: any) => {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      const descripcion = item.descripcion || 'N/A';
      const descripcionTrunc = descripcion.length > 50 ? descripcion.substring(0, 47) + '...' : descripcion;

      pdf.text(descripcionTrunc, itemCol1, yPosition);
      pdf.text(item.cantidad.toString(), itemCol2, yPosition);
      pdf.text(`$${item.precioUnitario.toLocaleString()}`, itemCol3, yPosition);
      pdf.text(`$${item.subtotal.toLocaleString()}`, itemCol4, yPosition);
      yPosition += 5;
    });
  }

  // Línea separadora
  yPosition += 2;
  pdf.setLineWidth(0.3);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 5;

  // Total
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL', itemCol1, yPosition);
  pdf.text(`$${(orden.total || 0).toLocaleString()}`, itemCol4, yPosition);

  // Footer corporativo
  addCorporateFooter(pdf);

  // Save PDF
  pdf.save(`orden-compra-${orden.numero || orden.id}-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Genera un PDF del inventario de stock
 * @param products Lista de productos
 * @param filters Filtros aplicados
 * @param stats Estadísticas calculadas
 */
export const generateStockInventoryPDF = async (
  products: any[],
  filters: {
    searchTerm: string;
    categoriaFilter: string;
    estadoFilter: string;
  },
  stats: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  }
) => {
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Agregar encabezado corporativo
  let yPosition = addCorporateHeader(pdf, 'Inventario de Stock');

  // Filtros aplicados
  if (filters.searchTerm || filters.categoriaFilter !== 'all' || filters.estadoFilter !== 'all') {
    pdf.setFillColor(...COLORS.white);
    pdf.rect(15, yPosition, pageWidth - 30, 3, 'F');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.darkBlue);
    pdf.text('Filtros Aplicados:', 17, yPosition + 2);
    yPosition += 5;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.black);

    if (filters.searchTerm) {
      pdf.text(`• Búsqueda: ${filters.searchTerm}`, 20, yPosition);
      yPosition += 4;
    }
    if (filters.categoriaFilter !== 'all') {
      pdf.text(`• Categoría: ${filters.categoriaFilter}`, 20, yPosition);
      yPosition += 4;
    }
    if (filters.estadoFilter !== 'all') {
      pdf.text(`• Estado: ${filters.estadoFilter}`, 20, yPosition);
      yPosition += 4;
    }
    yPosition += 3;
  }

  // Resumen en cajas blancas
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 22, 'F');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Resumen de Inventario:', 17, yPosition + 4);
  yPosition += 8;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.black);
  
  const col1Stats = 20;
  const col2Stats = pageWidth / 2;
  
  pdf.text(`Total de Productos: ${stats.totalProducts}`, col1Stats, yPosition);
  pdf.text(`Stock Bajo: ${stats.lowStock}`, col2Stats, yPosition);
  yPosition += 5;
  pdf.text(`Sin Stock: ${stats.outOfStock}`, col1Stats, yPosition);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text(`Valor Total: $${stats.totalValue.toLocaleString()}`, col2Stats, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.black);
  yPosition += 8;

  // Tabla de productos
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 3, 'F');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Detalle de Inventario:', 17, yPosition + 2);
  yPosition += 6;

  // Encabezados de tabla con fondo azul
  pdf.setFillColor(...COLORS.darkBlue);
  pdf.rect(15, yPosition - 1, pageWidth - 30, 5, 'F');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.white);
  const col1 = 17;
  const col2 = 87;
  const col3 = 147;
  const col4 = 182;
  const col5 = 217;
  const col6 = 252;

  pdf.text('Producto', col1, yPosition + 2.5);
  pdf.text('Categoría', col2, yPosition + 2.5);
  pdf.text('Stock Actual', col3, yPosition + 2.5);
  pdf.text('Stock Mín.', col4, yPosition + 2.5);
  pdf.text('Precio', col5, yPosition + 2.5);
  pdf.text('Estado', col6, yPosition + 2.5);
  yPosition += 5;

  // Datos de la tabla
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(...COLORS.black);

  let rowColor = true;
  products.forEach((product) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
      
      // Reprint headers
      pdf.setFillColor(...COLORS.darkBlue);
      pdf.rect(15, yPosition - 1, pageWidth - 30, 5, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.white);
      pdf.text('Producto', col1, yPosition + 2.5);
      pdf.text('Categoría', col2, yPosition + 2.5);
      pdf.text('Stock Actual', col3, yPosition + 2.5);
      pdf.text('Stock Mín.', col4, yPosition + 2.5);
      pdf.text('Precio', col5, yPosition + 2.5);
      pdf.text('Estado', col6, yPosition + 2.5);
      yPosition += 5;
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...COLORS.black);
      rowColor = true;
    }

    // Alternar color de fila
    if (rowColor) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, yPosition - 1, pageWidth - 30, 4, 'F');
    }
    rowColor = !rowColor;

    const nombre = product.nombre || 'N/A';
    const categoria = product.categoriaProducto?.nombre || 'Sin categoría';
    const stockActual = product.stockActual || 0;
    const stockMinimo = product.stockMinimo || 0;
    const precio = `$${(product.precio || 0).toLocaleString()}`;

    let estado = 'Disponible';
    let estadoColor = COLORS.green;
    if (!product.activo) {
      estado = 'Inactivo';
      estadoColor = COLORS.darkGray;
    } else if (stockActual === 0) {
      estado = 'Sin Stock';
      estadoColor = COLORS.red;
    } else if (stockActual <= stockMinimo) {
      estado = 'Stock Bajo';
      estadoColor = COLORS.red;
    }

    const nombreTrunc = nombre.length > 35 ? nombre.substring(0, 32) + '...' : nombre;
    const categoriaTrunc = categoria.length > 30 ? categoria.substring(0, 27) + '...' : categoria;

    pdf.setTextColor(...COLORS.black);
    pdf.text(nombreTrunc, col1, yPosition + 2);
    pdf.text(categoriaTrunc, col2, yPosition + 2);
    pdf.text(stockActual.toString(), col3, yPosition + 2);
    pdf.text(stockMinimo.toString(), col4, yPosition + 2);
    pdf.text(precio, col5, yPosition + 2);
    
    pdf.setTextColor(...estadoColor);
    pdf.text(estado, col6, yPosition + 2);
    
    yPosition += 4;
  });

  // Footer corporativo
  addCorporateFooter(pdf);

  pdf.save(`inventario-stock-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Genera un PDF del inventario de equipos
 * @param equipos Lista de equipos
 * @param filters Filtros aplicados
 * @param stats Estadísticas calculadas
 */
export const generateEquiposInventoryPDF = async (
  equipos: any[],
  filters: {
    searchTerm: string;
    tipoFilter: string;
    estadoFilter: string;
    asignadoFilter: string;
  },
  stats: {
    totalEquipos: number;
    disponibles: number;
    asignados: number;
    enProceso: number;
  }
) => {
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Agregar encabezado corporativo
  let yPosition = addCorporateHeader(pdf, 'Inventario de Equipos');

  // Filtros aplicados
  if (filters.searchTerm || filters.tipoFilter !== 'all' || filters.estadoFilter !== 'all' || filters.asignadoFilter !== 'all') {
    pdf.setFillColor(...COLORS.white);
    pdf.rect(15, yPosition, pageWidth - 30, 3, 'F');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.darkBlue);
    pdf.text('Filtros Aplicados:', 17, yPosition + 2);
    yPosition += 5;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.black);

    if (filters.searchTerm) {
      pdf.text(`• Búsqueda: ${filters.searchTerm}`, 20, yPosition);
      yPosition += 4;
    }
    if (filters.tipoFilter !== 'all') {
      pdf.text(`• Tipo: ${filters.tipoFilter}`, 20, yPosition);
      yPosition += 4;
    }
    if (filters.estadoFilter !== 'all') {
      pdf.text(`• Estado: ${filters.estadoFilter}`, 20, yPosition);
      yPosition += 4;
    }
    if (filters.asignadoFilter !== 'all') {
      pdf.text(`• Asignación: ${filters.asignadoFilter === 'asignado' ? 'Asignados' : 'No Asignados'}`, 20, yPosition);
      yPosition += 4;
    }
    yPosition += 3;
  }

  // Resumen en cajas blancas
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 18, 'F');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Resumen de Equipos:', 17, yPosition + 4);
  yPosition += 8;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.black);
  
  const col1Stats = 20;
  const col2Stats = pageWidth / 2;
  
  pdf.text(`Total de Equipos: ${stats.totalEquipos}`, col1Stats, yPosition);
  pdf.text(`Asignados: ${stats.asignados}`, col2Stats, yPosition);
  yPosition += 5;
  pdf.text(`Disponibles: ${stats.disponibles}`, col1Stats, yPosition);
  pdf.text(`En Proceso: ${stats.enProceso}`, col2Stats, yPosition);
  yPosition += 8;

  // Tabla de equipos
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 3, 'F');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Detalle de Equipos:', 17, yPosition + 2);
  yPosition += 6;

  // Encabezados de tabla con fondo azul
  pdf.setFillColor(...COLORS.darkBlue);
  pdf.rect(15, yPosition - 1, pageWidth - 30, 5, 'F');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.white);
  const col1 = 17;
  const col2 = 62;
  const col3 = 107;
  const col4 = 157;
  const col5 = 202;
  const col6 = 257;

  pdf.text('Número Heladera', col1, yPosition + 2.5);
  pdf.text('Tipo', col2, yPosition + 2.5);
  pdf.text('Modelo', col3, yPosition + 2.5);
  pdf.text('Estado', col4, yPosition + 2.5);
  pdf.text('Cliente', col5, yPosition + 2.5);
  pdf.text('Fecha Fab.', col6, yPosition + 2.5);
  yPosition += 5;

  // Datos de la tabla
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(...COLORS.black);

  let rowColor = true;
  equipos.forEach((equipo) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;

      // Reprint headers
      pdf.setFillColor(...COLORS.darkBlue);
      pdf.rect(15, yPosition - 1, pageWidth - 30, 5, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.white);
      pdf.text('Número Heladera', col1, yPosition + 2.5);
      pdf.text('Tipo', col2, yPosition + 2.5);
      pdf.text('Modelo', col3, yPosition + 2.5);
      pdf.text('Estado', col4, yPosition + 2.5);
      pdf.text('Cliente', col5, yPosition + 2.5);
      pdf.text('Fecha Fab.', col6, yPosition + 2.5);
      yPosition += 5;
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...COLORS.black);
      rowColor = true;
    }

    // Alternar color de fila
    if (rowColor) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, yPosition - 1, pageWidth - 30, 4, 'F');
    }
    rowColor = !rowColor;

    const numeroHeladera = equipo.numeroHeladera || 'N/A';
    const tipo = equipo.tipo || 'N/A';
    const modelo = equipo.modelo || 'N/A';
    const estado = equipo.estadoFabricacion || 'N/A';
    const cliente = equipo.clienteNombre || (equipo.asignadoAClienteId ? 'Asignado' : 'Sin asignar');
    const fecha = equipo.fechaFabricacion ? new Date(equipo.fechaFabricacion).toLocaleDateString() : '-';

    const clienteTrunc = cliente.length > 25 ? cliente.substring(0, 22) + '...' : cliente;

    pdf.setTextColor(...COLORS.black);
    pdf.text(numeroHeladera, col1, yPosition + 2);
    pdf.text(tipo, col2, yPosition + 2);
    pdf.text(modelo, col3, yPosition + 2);
    pdf.text(estado, col4, yPosition + 2);
    pdf.text(clienteTrunc, col5, yPosition + 2);
    pdf.text(fecha, col6, yPosition + 2);
    yPosition += 4;
  });

  // Footer corporativo
  addCorporateFooter(pdf);

  pdf.save(`inventario-equipos-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Genera un PDF de la cuenta corriente de un cliente
 * @param cliente Datos del cliente
 * @param movimientos Lista de movimientos filtrados
 * @param filters Filtros aplicados
 * @param saldoTotal Saldo total
 */
export const generateCuentaCorrienteClientePDF = async (
  cliente: any,
  movimientos: any[],
  filters: {
    searchTerm: string;
    tipoFilter: string;
    fechaDesde: string;
    fechaHasta: string;
  },
  saldoTotal: number
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Agregar encabezado corporativo
  const clienteNombre = cliente.razonSocial || `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
  let yPosition = addCorporateHeader(pdf, `Cuenta Corriente - ${clienteNombre}`);

  // Datos del cliente en caja blanca
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, cliente.cuit ? 14 : 10, 'F');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Datos del Cliente:', 17, yPosition + 4);
  yPosition += 7;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.black);
  pdf.text(`Cliente: ${clienteNombre}`, 20, yPosition);
  yPosition += 4;
  
  if (cliente.cuit) {
    pdf.text(`CUIT: ${cliente.cuit}`, 20, yPosition);
    yPosition += 4;
  }
  yPosition += 3;

  // Filtros aplicados
  if (filters.searchTerm || filters.tipoFilter || filters.fechaDesde || filters.fechaHasta) {
    pdf.setFillColor(...COLORS.white);
    pdf.rect(15, yPosition, pageWidth - 30, 3, 'F');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.darkBlue);
    pdf.text('Filtros Aplicados:', 17, yPosition + 2);
    yPosition += 5;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.black);

    if (filters.searchTerm) {
      pdf.text(`• Búsqueda: ${filters.searchTerm}`, 20, yPosition);
      yPosition += 4;
    }
    if (filters.tipoFilter) {
      pdf.text(`• Tipo: ${filters.tipoFilter}`, 20, yPosition);
      yPosition += 4;
    }
    if (filters.fechaDesde || filters.fechaHasta) {
      const fromDate = filters.fechaDesde || 'Inicio';
      const toDate = filters.fechaHasta || 'Fin';
      pdf.text(`• Período: ${fromDate} - ${toDate}`, 20, yPosition);
      yPosition += 4;
    }
    yPosition += 3;
  }

  // Saldo total destacado
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 8, 'F');
  
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  const saldoColor = saldoTotal >= 0 ? COLORS.green : COLORS.red;
  pdf.setTextColor(...saldoColor);
  pdf.text(`Saldo Total: $${saldoTotal.toLocaleString()}`, pageWidth / 2, yPosition + 5, { align: 'center' });
  yPosition += 10;

  // Tabla de movimientos
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 3, 'F');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Movimientos:', 17, yPosition + 2);
  yPosition += 6;

  // Encabezados de tabla con fondo azul
  pdf.setFillColor(...COLORS.darkBlue);
  pdf.rect(15, yPosition - 1, pageWidth - 30, 5, 'F');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.white);
  const col1 = 17;
  const col2 = 52;
  const col3 = 77;
  const col4 = 137;
  const col5 = 167;
  const col6 = 192;

  pdf.text('Fecha', col1, yPosition + 2.5);
  pdf.text('Tipo', col2, yPosition + 2.5);
  pdf.text('Concepto', col3, yPosition + 2.5);
  pdf.text('Comprobante', col4, yPosition + 2.5);
  pdf.text('Importe', col5, yPosition + 2.5);
  pdf.text('Saldo', col6, yPosition + 2.5);
  yPosition += 5;

  // Datos de la tabla
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);

  let rowColor = true;
  movimientos.forEach((mov) => {
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = 20;

      // Reprint headers
      pdf.setFillColor(...COLORS.darkBlue);
      pdf.rect(15, yPosition - 1, pageWidth - 30, 5, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.white);
      pdf.text('Fecha', col1, yPosition + 2.5);
      pdf.text('Tipo', col2, yPosition + 2.5);
      pdf.text('Concepto', col3, yPosition + 2.5);
      pdf.text('Comprobante', col4, yPosition + 2.5);
      pdf.text('Importe', col5, yPosition + 2.5);
      pdf.text('Saldo', col6, yPosition + 2.5);
      yPosition += 5;
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      rowColor = true;
    }

    // Alternar color de fila
    if (rowColor) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, yPosition - 1, pageWidth - 30, 4, 'F');
    }
    rowColor = !rowColor;

    const fecha = mov.fecha ? new Date(mov.fecha).toLocaleDateString() : '-';
    const tipo = mov.tipo || 'N/A';
    const concepto = mov.concepto || '-';
    const comprobante = mov.numeroComprobante || '-';
    const importe = `$${(mov.importe || 0).toLocaleString()}`;
    const saldo = `$${(mov.saldoResultante || 0).toLocaleString()}`;

    const conceptoTrunc = concepto.length > 30 ? concepto.substring(0, 27) + '...' : concepto;
    const comprobanteTrunc = comprobante.length > 15 ? comprobante.substring(0, 12) + '...' : comprobante;

    pdf.setTextColor(...COLORS.black);
    pdf.text(fecha, col1, yPosition + 2);
    pdf.text(tipo, col2, yPosition + 2);
    pdf.text(conceptoTrunc, col3, yPosition + 2);
    pdf.text(comprobanteTrunc, col4, yPosition + 2);

    // Color según el tipo
    if (tipo === 'DEBITO') {
      pdf.setTextColor(...COLORS.red);
    } else {
      pdf.setTextColor(...COLORS.green);
    }
    pdf.text(importe, col5, yPosition + 2);
    
    pdf.setTextColor(...COLORS.black);
    pdf.text(saldo, col6, yPosition + 2);
    yPosition += 4;
  });

  // Saldo final destacado
  yPosition += 4;
  if (yPosition > pageHeight - 35) {
    pdf.addPage();
    yPosition = 20;
  }
  
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 8, 'F');
  
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...saldoColor);
  pdf.text(`SALDO FINAL: $${saldoTotal.toLocaleString()}`, pageWidth / 2, yPosition + 5, { align: 'center' });

  // Footer corporativo
  addCorporateFooter(pdf);

  pdf.save(`cuenta-corriente-cliente-${cliente.id}-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Genera un PDF de la cuenta corriente de un proveedor
 * @param proveedor Datos del proveedor
 * @param movimientos Lista de movimientos filtrados
 * @param filters Filtros aplicados
 * @param saldoTotal Saldo total
 */
export const generateCuentaCorrienteProveedorPDF = async (
  proveedor: any,
  movimientos: any[],
  filters: {
    searchTerm: string;
    tipoFilter: string;
    fechaDesde: string;
    fechaHasta: string;
  },
  saldoTotal: number
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Agregar encabezado corporativo
  const proveedorNombre = proveedor.razonSocial || proveedor.nombre || 'N/A';
  let yPosition = addCorporateHeader(pdf, `Cuenta Corriente - ${proveedorNombre}`);

  // Datos del proveedor en caja blanca
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, proveedor.cuit ? 14 : 10, 'F');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Datos del Proveedor:', 17, yPosition + 4);
  yPosition += 7;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.black);
  pdf.text(`Proveedor: ${proveedorNombre}`, 20, yPosition);
  yPosition += 4;
  
  if (proveedor.cuit) {
    pdf.text(`CUIT: ${proveedor.cuit}`, 20, yPosition);
    yPosition += 4;
  }
  yPosition += 3;

  // Filtros aplicados
  if (filters.searchTerm || filters.tipoFilter || filters.fechaDesde || filters.fechaHasta) {
    pdf.setFillColor(...COLORS.white);
    pdf.rect(15, yPosition, pageWidth - 30, 3, 'F');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.darkBlue);
    pdf.text('Filtros Aplicados:', 17, yPosition + 2);
    yPosition += 5;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.black);

    if (filters.searchTerm) {
      pdf.text(`• Búsqueda: ${filters.searchTerm}`, 20, yPosition);
      yPosition += 4;
    }
    if (filters.tipoFilter) {
      pdf.text(`• Tipo: ${filters.tipoFilter}`, 20, yPosition);
      yPosition += 4;
    }
    if (filters.fechaDesde || filters.fechaHasta) {
      const fromDate = filters.fechaDesde || 'Inicio';
      const toDate = filters.fechaHasta || 'Fin';
      pdf.text(`• Período: ${fromDate} - ${toDate}`, 20, yPosition);
      yPosition += 4;
    }
    yPosition += 3;
  }

  // Saldo total destacado (invertido para proveedores)
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 8, 'F');
  
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  const saldoColor = saldoTotal >= 0 ? COLORS.red : COLORS.green; // Invertido para proveedores
  pdf.setTextColor(...saldoColor);
  pdf.text(`Saldo Total: $${saldoTotal.toLocaleString()}`, pageWidth / 2, yPosition + 5, { align: 'center' });
  yPosition += 10;

  // Tabla de movimientos
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 3, 'F');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Movimientos:', 17, yPosition + 2);
  yPosition += 6;

  // Encabezados de tabla con fondo azul
  pdf.setFillColor(...COLORS.darkBlue);
  pdf.rect(15, yPosition - 1, pageWidth - 30, 5, 'F');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.white);
  const col1 = 17;
  const col2 = 52;
  const col3 = 77;
  const col4 = 137;
  const col5 = 167;
  const col6 = 192;

  pdf.text('Fecha', col1, yPosition + 2.5);
  pdf.text('Tipo', col2, yPosition + 2.5);
  pdf.text('Concepto', col3, yPosition + 2.5);
  pdf.text('Comprobante', col4, yPosition + 2.5);
  pdf.text('Importe', col5, yPosition + 2.5);
  pdf.text('Saldo', col6, yPosition + 2.5);
  yPosition += 5;

  // Datos de la tabla
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);

  let rowColor = true;
  movimientos.forEach((mov) => {
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = 20;

      // Reprint headers
      pdf.setFillColor(...COLORS.darkBlue);
      pdf.rect(15, yPosition - 1, pageWidth - 30, 5, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.white);
      pdf.text('Fecha', col1, yPosition + 2.5);
      pdf.text('Tipo', col2, yPosition + 2.5);
      pdf.text('Concepto', col3, yPosition + 2.5);
      pdf.text('Comprobante', col4, yPosition + 2.5);
      pdf.text('Importe', col5, yPosition + 2.5);
      pdf.text('Saldo', col6, yPosition + 2.5);
      yPosition += 5;
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      rowColor = true;
    }

    // Alternar color de fila
    if (rowColor) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, yPosition - 1, pageWidth - 30, 4, 'F');
    }
    rowColor = !rowColor;

    const fecha = mov.fecha ? new Date(mov.fecha).toLocaleDateString() : '-';
    const tipo = mov.tipo || 'N/A';
    const concepto = mov.concepto || '-';
    const comprobante = mov.numeroComprobante || '-';
    const importe = `$${(mov.importe || 0).toLocaleString()}`;
    const saldo = `$${(mov.saldoResultante || 0).toLocaleString()}`;

    const conceptoTrunc = concepto.length > 30 ? concepto.substring(0, 27) + '...' : concepto;
    const comprobanteTrunc = comprobante.length > 15 ? comprobante.substring(0, 12) + '...' : comprobante;

    pdf.setTextColor(...COLORS.black);
    pdf.text(fecha, col1, yPosition + 2);
    pdf.text(tipo, col2, yPosition + 2);
    pdf.text(conceptoTrunc, col3, yPosition + 2);
    pdf.text(comprobanteTrunc, col4, yPosition + 2);

    // Color según el tipo (invertido para proveedores)
    if (tipo === 'DEBITO') {
      pdf.setTextColor(...COLORS.green);
    } else {
      pdf.setTextColor(...COLORS.red);
    }
    pdf.text(importe, col5, yPosition + 2);
    
    pdf.setTextColor(...COLORS.black);
    pdf.text(saldo, col6, yPosition + 2);
    yPosition += 4;
  });

  // Saldo final destacado
  yPosition += 4;
  if (yPosition > pageHeight - 35) {
    pdf.addPage();
    yPosition = 20;
  }
  
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 8, 'F');
  
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...saldoColor);
  pdf.text(`SALDO FINAL: $${saldoTotal.toLocaleString()}`, pageWidth / 2, yPosition + 5, { align: 'center' });

  // Footer corporativo
  addCorporateFooter(pdf);

  pdf.save(`cuenta-corriente-proveedor-${proveedor.id}-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Genera un PDF del flujo de caja
 * @param movimientos Lista de movimientos del flujo de caja
 * @param filters Filtros aplicados
 * @param summary Resumen con totales
 */
export const generateFlujoCajaPDF = async (
  movimientos: any[],
  filters: {
    fechaDesde: string;
    fechaHasta: string;
  },
  summary: {
    totalIngresos: number;
    totalEgresos: number;
    flujoNeto: number;
    totalMovimientos: number;
  },
  chartImages?: {
    pieChartImgData?: string | null;
    barChartImgData?: string | null;
    lineChartImgData?: string | null;
  }
) => {
  const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Agregar encabezado corporativo
  let yPosition = addCorporateHeader(pdf, 'Flujo de Caja');

  // Filtros aplicados
  if (filters.fechaDesde || filters.fechaHasta) {
    pdf.setFillColor(...COLORS.white);
    pdf.rect(15, yPosition, pageWidth - 30, 3, 'F');

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.darkBlue);
    pdf.text('Período:', 17, yPosition + 2);
    yPosition += 5;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.black);

    const fromDate = filters.fechaDesde || 'Inicio';
    const toDate = filters.fechaHasta || 'Fin';
    pdf.text(`Desde: ${fromDate} - Hasta: ${toDate}`, 20, yPosition);
    yPosition += 5;
  }

  // Resumen en cajas blancas
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 22, 'F');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Resumen del Flujo de Caja:', 17, yPosition + 4);
  yPosition += 8;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.black);

  const col1Stats = 20;
  const col2Stats = pageWidth / 2;

  pdf.setTextColor(...COLORS.green);
  pdf.text(`Ingresos (Pagos de Clientes): $${summary.totalIngresos.toLocaleString()}`, col1Stats, yPosition);
  pdf.setTextColor(...COLORS.red);
  pdf.text(`Egresos (Pagos a Proveedores): $${summary.totalEgresos.toLocaleString()}`, col2Stats, yPosition);
  yPosition += 5;

  pdf.setTextColor(...COLORS.black);
  pdf.text(`Total de Movimientos: ${summary.totalMovimientos}`, col1Stats, yPosition);

  pdf.setFont('helvetica', 'bold');
  const flujoNetoColor = summary.flujoNeto >= 0 ? COLORS.green : COLORS.red;
  pdf.setTextColor(...flujoNetoColor);
  pdf.text(`Flujo Neto: $${summary.flujoNeto.toLocaleString()} ${summary.flujoNeto >= 0 ? '(Superávit)' : '(Déficit)'}`, col2Stats, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.black);
  yPosition += 10;

  // Página de gráficos (si fueron capturados)
  if (chartImages?.pieChartImgData || chartImages?.barChartImgData || chartImages?.lineChartImgData) {
    pdf.addPage();
    yPosition = addCorporateHeader(pdf, 'Flujo de Caja - Visualizaciones');
    if (chartImages.pieChartImgData) {
      yPosition = insertChartImage(pdf, chartImages.pieChartImgData,
        'Distribución por Método de Pago', yPosition, pageWidth, pageHeight, 15, 65);
    }
    if (chartImages.barChartImgData) {
      yPosition = insertChartImage(pdf, chartImages.barChartImgData,
        'Ingresos vs Egresos por Método de Pago', yPosition, pageWidth, pageHeight, 15, 65);
    }
    if (chartImages.lineChartImgData) {
      yPosition = insertChartImage(pdf, chartImages.lineChartImgData,
        'Evolución del Flujo de Caja', yPosition, pageWidth, pageHeight, 15, 65);
    }
    pdf.addPage();
    yPosition = addCorporateHeader(pdf, 'Flujo de Caja - Detalle de Movimientos');
  }

  // Tabla de movimientos
  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 3, 'F');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Detalle de Movimientos:', 17, yPosition + 2);
  yPosition += 6;

  // Encabezados de tabla con fondo azul
  pdf.setFillColor(...COLORS.darkBlue);
  pdf.rect(15, yPosition - 1, pageWidth - 30, 5, 'F');

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.white);
  const col1 = 17;
  const col2 = 47;
  const col3 = 67;
  const col4 = 97;
  const col5 = 167;
  const col6 = 217;
  const col7 = 257;

  pdf.text('Fecha', col1, yPosition + 2.5);
  pdf.text('Tipo', col2, yPosition + 2.5);
  pdf.text('Origen', col3, yPosition + 2.5);
  pdf.text('Entidad', col4, yPosition + 2.5);
  pdf.text('Concepto', col5, yPosition + 2.5);
  pdf.text('Comprobante', col6, yPosition + 2.5);
  pdf.text('Importe', col7, yPosition + 2.5);
  yPosition += 5;

  // Datos de la tabla
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);

  movimientos.forEach((mov) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;

      // Reprint headers
      pdf.setFillColor(...COLORS.darkBlue);
      pdf.rect(15, yPosition - 1, pageWidth - 30, 5, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.white);
      pdf.text('Fecha', col1, yPosition + 2.5);
      pdf.text('Tipo', col2, yPosition + 2.5);
      pdf.text('Origen', col3, yPosition + 2.5);
      pdf.text('Entidad', col4, yPosition + 2.5);
      pdf.text('Concepto', col5, yPosition + 2.5);
      pdf.text('Comprobante', col6, yPosition + 2.5);
      pdf.text('Importe', col7, yPosition + 2.5);
      yPosition += 5;
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
    }

    // Color de fila según tipo
    if (mov.tipo === 'INGRESO') {
      pdf.setFillColor(230, 255, 230); // Light green
    } else {
      pdf.setFillColor(255, 230, 230); // Light red
    }
    pdf.rect(15, yPosition - 1, pageWidth - 30, 4, 'F');

    const fecha = mov.fecha ? new Date(mov.fecha).toLocaleDateString() : '-';
    const tipo = mov.tipo || 'N/A';
    const origen = mov.origen || 'N/A';
    const entidad = mov.entidad || '-';
    const concepto = mov.concepto || '-';
    const comprobante = mov.numeroComprobante || '-';
    const importe = `$${(mov.importe || 0).toLocaleString()}`;

    const entidadTrunc = entidad.length > 35 ? entidad.substring(0, 32) + '...' : entidad;
    const conceptoTrunc = concepto.length > 25 ? concepto.substring(0, 22) + '...' : concepto;
    const comprobanteTrunc = comprobante.length > 18 ? comprobante.substring(0, 15) + '...' : comprobante;

    pdf.setTextColor(...COLORS.black);
    pdf.text(fecha, col1, yPosition + 2);
    pdf.text(tipo, col2, yPosition + 2);
    pdf.text(origen, col3, yPosition + 2);
    pdf.text(entidadTrunc, col4, yPosition + 2);
    pdf.text(conceptoTrunc, col5, yPosition + 2);
    pdf.text(comprobanteTrunc, col6, yPosition + 2);

    // Color según el tipo
    if (tipo === 'INGRESO') {
      pdf.setTextColor(...COLORS.green);
    } else {
      pdf.setTextColor(...COLORS.red);
    }
    pdf.text(importe, col7, yPosition + 2);

    yPosition += 4;
  });

  // Resumen final
  yPosition += 4;
  if (yPosition > pageHeight - 35) {
    pdf.addPage();
    yPosition = 20;
  }

  pdf.setFillColor(...COLORS.white);
  pdf.rect(15, yPosition, pageWidth - 30, 18, 'F');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('RESUMEN FINAL:', 17, yPosition + 4);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.green);
  pdf.text(`Ingresos: $${summary.totalIngresos.toLocaleString()}`, 20, yPosition);
  pdf.setTextColor(...COLORS.red);
  pdf.text(`Egresos: $${summary.totalEgresos.toLocaleString()}`, pageWidth / 2, yPosition);
  yPosition += 6;

  pdf.setTextColor(...flujoNetoColor);
  pdf.setFontSize(12);
  pdf.text(`FLUJO NETO: $${summary.flujoNeto.toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

  // Footer corporativo
  addCorporateFooter(pdf);

  pdf.save(`flujo-caja-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Genera un PDF del Dashboard de Estados de Equipos
 */
export const generateReportesEstadosPDF = async (
  estadisticas: {
    DISPONIBLE: number;
    RESERVADO: number;
    FACTURADO: number;
    EN_TRANSITO: number;
    ENTREGADO: number;
    PENDIENTE_TERMINACION: number;
    total: number;
  },
  equipos: any[],
  filters: {
    estado: string;
    tipo: string;
    modelo: string;
    fechaDesde: string;
    fechaHasta: string;
  },
  chartImages?: {
    pieChartImgData?: string | null;
    barChartImgData?: string | null;
  }
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  let yPosition = addCorporateHeader(pdf, 'Dashboard de Estados de Equipos');

  // Filtros aplicados
  const activeFilters: string[] = [];
  if (filters.estado !== 'TODOS') activeFilters.push(`Estado: ${filters.estado}`);
  if (filters.tipo !== 'TODOS') activeFilters.push(`Tipo: ${filters.tipo}`);
  if (filters.modelo) activeFilters.push(`Modelo: ${filters.modelo}`);
  if (filters.fechaDesde) activeFilters.push(`Desde: ${filters.fechaDesde}`);
  if (filters.fechaHasta) activeFilters.push(`Hasta: ${filters.fechaHasta}`);

  if (activeFilters.length > 0) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.darkBlue);
    pdf.text('Filtros aplicados:', margin, yPosition);
    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.black);
    pdf.text(activeFilters.join('   |   '), margin, yPosition);
    yPosition += 8;
  }

  // Resumen KPIs
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Resumen de Estados:', margin, yPosition);
  yPosition += 7;

  const kpis = [
    { label: 'Total Equipos', value: estadisticas.total },
    { label: 'Disponibles', value: estadisticas.DISPONIBLE },
    { label: 'Reservados', value: estadisticas.RESERVADO },
    { label: 'Facturados', value: estadisticas.FACTURADO },
    { label: 'En Tránsito', value: estadisticas.EN_TRANSITO },
    { label: 'Entregados', value: estadisticas.ENTREGADO },
    { label: 'Pend. Terminación', value: estadisticas.PENDIENTE_TERMINACION },
  ];

  const colW = (pageWidth - margin * 2) / 4;
  let col = 0;
  let rowY = yPosition;

  kpis.forEach((kpi) => {
    const x = margin + col * colW;
    pdf.setFillColor(...COLORS.white);
    pdf.rect(x, rowY, colW - 2, 10, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.darkBlue);
    pdf.text(kpi.label, x + 2, rowY + 4);
    pdf.setFontSize(11);
    pdf.setTextColor(...COLORS.black);
    pdf.text(String(kpi.value), x + 2, rowY + 9);
    col++;
    if (col === 4) { col = 0; rowY += 13; }
  });
  yPosition = rowY + (col > 0 ? 13 : 0) + 5;

  // Gráficos
  if (chartImages?.pieChartImgData) {
    yPosition = insertChartImage(pdf, chartImages.pieChartImgData,
      'Distribución por Estado de Asignación', yPosition, pageWidth, pageHeight, margin);
  }
  if (chartImages?.barChartImgData) {
    yPosition = insertChartImage(pdf, chartImages.barChartImgData,
      'Cantidad por Estado de Asignación', yPosition, pageWidth, pageHeight, margin);
  }

  // Tabla de equipos
  if (yPosition + 20 > pageHeight - 20) {
    pdf.addPage();
    yPosition = 20;
  }

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text(`Detalle de Equipos (${equipos.length} registros):`, margin, yPosition);
  yPosition += 6;

  // Encabezados
  pdf.setFillColor(...COLORS.darkBlue);
  pdf.rect(margin, yPosition - 1, pageWidth - margin * 2, 5, 'F');
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.white);
  const c1 = margin + 1, c2 = margin + 28, c3 = margin + 65, c4 = margin + 95, c5 = margin + 130, c6 = margin + 155;
  pdf.text('Código', c1, yPosition + 2.5);
  pdf.text('Modelo', c2, yPosition + 2.5);
  pdf.text('Tipo', c3, yPosition + 2.5);
  pdf.text('Estado', c4, yPosition + 2.5);
  pdf.text('Asignación', c5, yPosition + 2.5);
  pdf.text('Fecha Fab.', c6, yPosition + 2.5);
  yPosition += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  let rowAlt = false;
  equipos.forEach((e) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
    }
    if (rowAlt) {
      pdf.setFillColor(240, 246, 252);
      pdf.rect(margin, yPosition - 1, pageWidth - margin * 2, 4, 'F');
    }
    rowAlt = !rowAlt;
    pdf.setTextColor(...COLORS.black);
    pdf.text(String(e.codigoEquipo || '-').substring(0, 14), c1, yPosition + 2);
    pdf.text(String(e.modelo || '-').substring(0, 22), c2, yPosition + 2);
    pdf.text(String(e.tipo || '-').substring(0, 12), c3, yPosition + 2);
    pdf.text(String(e.estado || '-').substring(0, 15), c4, yPosition + 2);
    pdf.text(String(e.estadoAsignacion || '-').substring(0, 14), c5, yPosition + 2);
    const fecha = e.fechaFabricacion ? new Date(e.fechaFabricacion).toLocaleDateString('es-AR') : '-';
    pdf.text(fecha, c6, yPosition + 2);
    yPosition += 4;
  });

  addCorporateFooter(pdf);
  pdf.save(`reporte-estados-equipos-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Genera un PDF del Reporte de Garantías
 */
export const generateGarantiaReportPDF = async (
  stats: {
    total: number;
    vigentes: number;
    vencidas: number;
    anuladas: number;
    porVencer: number;
    totalReclamos: number;
    reclamosPendientes: number;
    reclamosEnProceso: number;
    reclamosResueltos: number;
    reclamosRechazados: number;
  },
  modelStats: Array<{
    modelo: string;
    total: number;
    conReclamos: number;
    sinReclamos: number;
    tasaReclamos: string;
  }>,
  garantiasPorVencer: any[],
  reclamosRecientes: any[],
  filters: {
    periodFilter: string;
  }
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  let yPosition = addCorporateHeader(pdf, 'Reporte de Garantías');

  // Período
  const periodoLabel: Record<string, string> = {
    '30': 'Últimos 30 días', '90': 'Últimos 90 días',
    '180': 'Últimos 180 días', '365': 'Último año', 'all': 'Todo el período'
  };
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text(`Período: ${periodoLabel[filters.periodFilter] || filters.periodFilter}`, margin, yPosition);
  yPosition += 8;

  // KPIs Garantías
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Garantías:', margin, yPosition);
  yPosition += 6;

  const garantiaKPIs = [
    { label: 'Total', value: stats.total },
    { label: 'Vigentes', value: stats.vigentes },
    { label: 'Por Vencer (30d)', value: stats.porVencer },
    { label: 'Vencidas', value: stats.vencidas },
    { label: 'Anuladas', value: stats.anuladas },
  ];
  const colW = (pageWidth - margin * 2) / 5;
  garantiaKPIs.forEach((kpi, i) => {
    const x = margin + i * colW;
    pdf.setFillColor(...COLORS.white);
    pdf.rect(x, yPosition, colW - 2, 10, 'F');
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.darkBlue);
    pdf.text(kpi.label, x + 2, yPosition + 4);
    pdf.setFontSize(11);
    pdf.setTextColor(...COLORS.black);
    pdf.text(String(kpi.value), x + 2, yPosition + 9);
  });
  yPosition += 14;

  // KPIs Reclamos
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text('Reclamos:', margin, yPosition);
  yPosition += 6;

  const reclamoKPIs = [
    { label: 'Total Reclamos', value: stats.totalReclamos },
    { label: 'Pendientes', value: stats.reclamosPendientes },
    { label: 'En Proceso', value: stats.reclamosEnProceso },
    { label: 'Resueltos', value: stats.reclamosResueltos },
    { label: 'Rechazados', value: stats.reclamosRechazados },
  ];
  reclamoKPIs.forEach((kpi, i) => {
    const x = margin + i * colW;
    pdf.setFillColor(...COLORS.white);
    pdf.rect(x, yPosition, colW - 2, 10, 'F');
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.darkBlue);
    pdf.text(kpi.label, x + 2, yPosition + 4);
    pdf.setFontSize(11);
    pdf.setTextColor(...COLORS.black);
    pdf.text(String(kpi.value), x + 2, yPosition + 9);
  });
  yPosition += 16;

  // Tabla: Garantías por Modelo
  const drawTableSection = (title: string, headers: string[], rows: string[][], colPositions: number[]) => {
    if (yPosition + 20 > pageHeight - 20) { pdf.addPage(); yPosition = 20; }
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.darkBlue);
    pdf.text(title, margin, yPosition);
    yPosition += 5;

    pdf.setFillColor(...COLORS.darkBlue);
    pdf.rect(margin, yPosition - 1, pageWidth - margin * 2, 5, 'F');
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.white);
    headers.forEach((h, i) => pdf.text(h, colPositions[i], yPosition + 2.5));
    yPosition += 5;

    pdf.setFont('helvetica', 'normal');
    let alt = false;
    rows.forEach((row) => {
      if (yPosition > pageHeight - 20) { pdf.addPage(); yPosition = 20; }
      if (alt) { pdf.setFillColor(240, 246, 252); pdf.rect(margin, yPosition - 1, pageWidth - margin * 2, 4, 'F'); }
      alt = !alt;
      pdf.setTextColor(...COLORS.black);
      row.forEach((cell, i) => pdf.text(String(cell).substring(0, 30), colPositions[i], yPosition + 2));
      yPosition += 4;
    });
    yPosition += 5;
  };

  drawTableSection(
    `Garantías por Modelo (Top ${modelStats.length})`,
    ['Modelo', 'Total', 'Con Reclamos', 'Sin Reclamos', 'Tasa Reclamos'],
    modelStats.map(m => [m.modelo, String(m.total), String(m.conReclamos), String(m.sinReclamos), `${m.tasaReclamos}%`]),
    [margin + 1, margin + 70, margin + 90, margin + 115, margin + 140]
  );

  drawTableSection(
    `Garantías por Vencer (próximos 30 días) — ${garantiasPorVencer.length} registros`,
    ['N° Serie Equipo', 'Modelo', 'Fecha Vencimiento', 'Días Restantes'],
    garantiasPorVencer.map(g => {
      const dias = Math.ceil((new Date(g.fechaVencimiento).getTime() - Date.now()) / 86400000);
      return [
        String(g.equipoFabricadoNumeroSerie || g.equipoFabricadoId || '-'),
        String(g.equipoFabricadoModelo || '-'),
        new Date(g.fechaVencimiento).toLocaleDateString('es-AR'),
        String(dias),
      ];
    }),
    [margin + 1, margin + 50, margin + 110, margin + 155]
  );

  drawTableSection(
    `Reclamos Recientes — ${reclamosRecientes.length} registros`,
    ['Tipo Falla', 'Descripción', 'Estado', 'Fecha Reclamo'],
    reclamosRecientes.map(r => [
      String(r.tipoFalla || '-'),
      String(r.descripcion || '-').substring(0, 35),
      String(r.estado || '-'),
      r.fechaReclamo ? new Date(r.fechaReclamo).toLocaleDateString('es-AR') : '-',
    ]),
    [margin + 1, margin + 40, margin + 120, margin + 150]
  );

  addCorporateFooter(pdf);
  pdf.save(`reporte-garantias-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Captura un elemento HTML por ID y retorna la imagen como base64 PNG.
 * Para elementos que contienen un <canvas> (Chart.js), usa toDataURL() directamente
 * en lugar de html2canvas para evitar problemas de captura.
 * Retorna null si el elemento no se encuentra.
 */
export const captureElementAsImage = async (elementId: string): Promise<string | null> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`[captureElementAsImage] Elemento "${elementId}" no encontrado`);
    return null;
  }
  try {
    // Si contiene un <canvas> (Chart.js), capturar directamente desde el canvas
    // Es más confiable que html2canvas para gráficos Chart.js
    const chartCanvas = element.querySelector('canvas');
    if (chartCanvas && chartCanvas.width > 0 && chartCanvas.height > 0) {
      // Crear canvas temporal con fondo blanco para que el PNG no sea transparente
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = chartCanvas.width;
      tempCanvas.height = chartCanvas.height;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(chartCanvas, 0, 0);
        return tempCanvas.toDataURL('image/png');
      }
    }
    // Para SVG (Recharts) y componentes MUI customizados: usar html2canvas
    const captured = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    return captured.toDataURL('image/png');
  } catch (error) {
    console.error(`[captureElementAsImage] Error al capturar "${elementId}":`, error);
    return null;
  }
};

/**
 * Inserta una imagen de gráfico en el PDF con label encima.
 * Calcula el alto automáticamente respetando la relación de aspecto de la imagen.
 * Maneja el overflow añadiendo una nueva página si es necesario.
 * @returns nueva posición Y después de insertar el gráfico
 */
const insertChartImage = (
  pdf: jsPDF,
  imgData: string,
  label: string,
  yPosition: number,
  pageWidth: number,
  pageHeight: number,
  margin: number = 15,
  maxChartHeight: number = 110
): number => {
  const maxWidth = pageWidth - margin * 2;

  // Calcular dimensiones respetando la relación de aspecto
  const props = pdf.getImageProperties(imgData);
  const aspectRatio = props.width / props.height;
  let finalWidth = maxWidth;
  let finalHeight = maxWidth / aspectRatio;

  // Si supera el alto máximo, reducir ambas dimensiones proporcionalmente
  if (finalHeight > maxChartHeight) {
    finalHeight = maxChartHeight;
    finalWidth = finalHeight * aspectRatio;
  }

  // Centrar horizontalmente si el ancho fue reducido
  const xOffset = margin + (maxWidth - finalWidth) / 2;

  const totalNeeded = 5 + 8 + finalHeight + 10;
  if (yPosition + totalNeeded > pageHeight - 20) {
    pdf.addPage();
    yPosition = 20;
  }

  yPosition += 5; // margen superior

  // Label sobre el gráfico
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.darkBlue);
  pdf.text(label, margin, yPosition);
  yPosition += 8;

  pdf.addImage(imgData, 'PNG', xOffset, yPosition, finalWidth, finalHeight);
  yPosition += finalHeight + 10; // margen inferior

  return yPosition;
};

/**
 * Captura un elemento HTML y lo convierte en imagen para PDF
 * Útil para capturar gráficos y visualizaciones
 * @param elementId ID del elemento HTML a capturar
 */
export const captureElementAsPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Elemento con ID ${elementId} no encontrado`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20; // margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
};
