import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DocumentoComercial, OpcionFinanciamientoDTO, Cliente } from '../types';
import type { CuotaPrestamoDTO, PrestamoPersonalDTO } from '../types/prestamo.types';
import {
  ESTADO_CUOTA_LABELS,
  ESTADO_PRESTAMO_LABELS,
  TIPO_FINANCIACION_LABELS,
} from '../types/prestamo.types';
import { addCorporateHeader, addCorporateFooter } from '../utils/pdfExportUtils';
import {
  PORCENTAJE_ENTREGA_PROPIO,
  calcularFinanciamientoPropio,
  getMetodoPagoLabel,
  isFinanciamientoPropio,
} from '../utils/financiamiento';

/**
 * Servicio para generar PDFs de documentos comerciales
 * Formato: Replicando el diseño de "P. Mauro Villanueva - PRESUPUESTOS.pdf"
 */

interface DocumentoPDFData {
  documento: DocumentoComercial;
  cliente: Cliente;
  opcionesFinanciamiento?: OpcionFinanciamientoDTO[];
  opcionSeleccionada?: OpcionFinanciamientoDTO;
}

// Alias para mantener compatibilidad
interface PresupuestoPDFData {
  presupuesto: DocumentoComercial;
  cliente: Cliente;
  opcionesFinanciamiento: OpcionFinanciamientoDTO[];
}

// Colores del diseño original
const COLORS = {
  darkBlue: [20, 66, 114] as [number, number, number],      // #144272 - Barra superior
  lightBlue: [205, 226, 239] as [number, number, number],   // #CDE2EF - Fondo celdas
  white: [255, 255, 255] as [number, number, number],       // #FFFFFF
  black: [0, 0, 0] as [number, number, number],             // #000000
  darkGray: [64, 64, 64] as [number, number, number],       // #404040 - Texto encabezado tabla
  mediumGray: [128, 128, 128] as [number, number, number],  // #808080 - Bordes
};

/**
 * Formatea un número como moneda argentina
 */
const formatCurrency = (value: number | null | undefined): string => {
  return `$${Number(value ?? 0).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
};

/**
 * Formatea una fecha en formato DD/MM/YYYY
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = ('0' + date.getDate()).slice(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Obtiene el nombre del mes actual en español
 */
const getCurrentMonthYear = (): string => {
  const months = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  const date = new Date();
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const calcularEntregaInicial = (total: number): number => {
  return Math.round(total * PORCENTAJE_ENTREGA_PROPIO);
};

const PAGE_MARGIN_BOTTOM = 25;

const TOTAL_ROW_STYLE = {
  halign: 'right' as const,
  fontStyle: 'bold' as const,
  fontSize: 10,
  fillColor: COLORS.white,
  textColor: COLORS.black,
};

const TOTAL_LABEL_STYLE = {
  ...TOTAL_ROW_STYLE,
  halign: 'center' as const,
};

// Devuelve las filas a insertar en el bloque de totales del PDF.
// Si el documento tiene un descuento aplicado, se agregan filas Subtotal y
// Descuento antes del total final; si no, se conserva una sola fila como antes.
const buildTotalsRows = (documento: DocumentoComercial, totalLabel: string): any[][] => {
  const subtotalBruto = Number(documento.subtotal ?? 0);
  const descuentoTipo = documento.descuentoTipo ?? 'NONE';
  const descuentoMonto = Number(documento.descuentoMonto ?? 0);
  const descuentoValor = Number(documento.descuentoValor ?? 0);
  const tieneDescuento = descuentoTipo !== 'NONE' && descuentoMonto > 0;

  if (!tieneDescuento) {
    return [[
      { content: totalLabel, styles: TOTAL_LABEL_STYLE },
      { content: formatCurrency(subtotalBruto), styles: TOTAL_ROW_STYLE },
    ]];
  }

  const totalNeto = Math.max(0, subtotalBruto - descuentoMonto);
  const descuentoLabel = descuentoTipo === 'PORCENTAJE'
    ? `Descuento (${descuentoValor}%)`
    : 'Descuento';

  return [
    [
      { content: 'Subtotal', styles: { ...TOTAL_LABEL_STYLE, fontStyle: 'normal' as const } },
      { content: formatCurrency(subtotalBruto), styles: { ...TOTAL_ROW_STYLE, fontStyle: 'normal' as const } },
    ],
    [
      { content: descuentoLabel, styles: { ...TOTAL_LABEL_STYLE, fontStyle: 'normal' as const } },
      { content: `- ${formatCurrency(descuentoMonto)}`, styles: { ...TOTAL_ROW_STYLE, fontStyle: 'normal' as const } },
    ],
    [
      { content: totalLabel, styles: TOTAL_LABEL_STYLE },
      { content: formatCurrency(totalNeto), styles: TOTAL_ROW_STYLE },
    ],
  ];
};

const ensureSpace = (doc: jsPDF, yPosition: number, neededHeight: number, margin: number): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPosition + neededHeight > pageHeight - PAGE_MARGIN_BOTTOM) {
    doc.addPage();
    return margin;
  }
  return yPosition;
};

interface RenderOpcionParams {
  doc: jsPDF;
  opcion: OpcionFinanciamientoDTO;
  yPosition: number;
  margin: number;
  baseImporte: number;
  showOpcionTag?: string;
}

/**
 * Pinta una "tarjeta" con la información de una opción de financiamiento.
 * Si la opción es financiamiento propio con > 1 cuota, muestra entrega 40% +
 * cuota estimada calculada sobre el saldo (no sobre el total).
 */
const renderOpcionFinanciamiento = ({
  doc,
  opcion,
  yPosition,
  margin,
  baseImporte,
  showOpcionTag,
}: RenderOpcionParams): number => {
  const propio = isFinanciamientoPropio(opcion.metodoPago) && opcion.cantidadCuotas > 1;
  const calc = propio
    ? calcularFinanciamientoPropio(baseImporte, opcion.tasaInteres, opcion.cantidadCuotas)
    : null;

  const tableWidth = doc.internal.pageSize.getWidth() - (margin + 1) * 2;

  // Encabezado de la opción
  yPosition = ensureSpace(doc, yPosition, 30, margin);
  autoTable(doc, {
    startY: yPosition,
    body: [[
      {
        content: showOpcionTag ? `${showOpcionTag} ${opcion.nombre}` : opcion.nombre,
        styles: {
          halign: 'left',
          fontStyle: 'bold' as const,
          fontSize: 9,
          fillColor: COLORS.lightBlue,
          textColor: COLORS.darkBlue,
          cellPadding: 2,
        },
      },
      {
        content: propio ? `Total estimado: ${formatCurrency(calc!.totalEstimado)}` : `Total: ${formatCurrency(opcion.montoTotal)}`,
        styles: {
          halign: 'right',
          fontStyle: 'bold' as const,
          fontSize: 9,
          fillColor: COLORS.lightBlue,
          textColor: COLORS.darkBlue,
          cellPadding: 2,
        },
      },
    ]],
    theme: 'grid',
    styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
    columnStyles: { 0: { cellWidth: tableWidth - 50 }, 1: { cellWidth: 50 } },
    margin: { left: margin + 1, right: margin + 1 },
  });
  yPosition = (doc as any).lastAutoTable.finalY;

  // Línea con método y cuotas
  const tipoCuotaText = (() => {
    if (opcion.cantidadCuotas <= 1) return 'Pago único';
    const nombreLower = (opcion.nombre || '').toLowerCase();
    if (nombreLower.indexOf('cheque') !== -1) return `${opcion.cantidadCuotas} cheques`;
    if (nombreLower.indexOf('semanal') !== -1) return `${opcion.cantidadCuotas} cuotas semanales`;
    return `${opcion.cantidadCuotas} cuotas`;
  })();

  autoTable(doc, {
    startY: yPosition,
    body: [[
      {
        content: `Método: ${getMetodoPagoLabel(opcion.metodoPago)}`,
        styles: { halign: 'left', fontSize: 8, fillColor: COLORS.white, cellPadding: 2 },
      },
      {
        content: tipoCuotaText,
        styles: { halign: 'center', fontSize: 8, fillColor: COLORS.white, cellPadding: 2 },
      },
      {
        content: propio
          ? `Cuota estimada: ${formatCurrency(calc!.cuotaEstimada)}`
          : (opcion.cantidadCuotas > 1 ? `Cuota: ${formatCurrency(opcion.montoCuota)}` : `Importe: ${formatCurrency(opcion.montoTotal)}`),
        styles: { halign: 'right', fontSize: 8, fillColor: COLORS.white, cellPadding: 2 },
      },
    ]],
    theme: 'grid',
    styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: (tableWidth - 50) * 0.5 },
      1: { cellWidth: (tableWidth - 50) * 0.5 },
      2: { cellWidth: 50 },
    },
    margin: { left: margin + 1, right: margin + 1 },
  });
  yPosition = (doc as any).lastAutoTable.finalY;

  // Bloque de financiamiento propio: entrega + saldo
  if (propio && calc) {
    autoTable(doc, {
      startY: yPosition,
      body: [
        [
          {
            content: `Entrega inicial estimada (40%): ${formatCurrency(calc.entrega)}`,
            styles: { halign: 'left', fontSize: 8, fillColor: COLORS.white, cellPadding: 2 },
          },
          {
            content: `Saldo a financiar: ${formatCurrency(calc.saldo)}`,
            styles: { halign: 'right', fontSize: 8, fillColor: COLORS.white, cellPadding: 2 },
          },
        ],
        [
          {
            content: `Interés ${opcion.tasaInteres}% sobre saldo → ${formatCurrency(calc.saldoConInteres)}`,
            styles: {
              halign: 'left',
              fontSize: 8,
              fontStyle: 'italic' as const,
              fillColor: COLORS.white,
              cellPadding: 2,
            },
            colSpan: 2,
          },
        ],
      ],
      theme: 'grid',
      styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
      columnStyles: { 0: { cellWidth: tableWidth / 2 }, 1: { cellWidth: tableWidth / 2 } },
      margin: { left: margin + 1, right: margin + 1 },
    });
    yPosition = (doc as any).lastAutoTable.finalY;
  }

  // Descripción
  if (opcion.descripcion && opcion.descripcion.trim().length > 0) {
    autoTable(doc, {
      startY: yPosition,
      body: [[
        {
          content: opcion.descripcion,
          styles: {
            halign: 'left',
            fontSize: 7,
            fontStyle: 'italic' as const,
            fillColor: COLORS.white,
            textColor: COLORS.darkGray,
            cellPadding: 2,
          },
        },
      ]],
      theme: 'grid',
      styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
      margin: { left: margin + 1, right: margin + 1 },
    });
    yPosition = (doc as any).lastAutoTable.finalY;
  }

  return yPosition + 1;
};

/**
 * Genera y descarga un PDF del presupuesto replicando el formato original
 */
export const generarPresupuestoPDF = (data: PresupuestoPDFData): void => {
  const { presupuesto, cliente, opcionesFinanciamiento } = data;

  // Crear documento PDF (A4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let yPosition = margin;

  // ===== BARRA SUPERIOR AZUL CON LOGO =====
  doc.setFillColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 25, 'F');

  // Logo texto "Ripser" en cursiva
  doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.setFontSize(24);
  doc.setFont('times', 'italic');
  doc.text('Ripser', margin + 5, yPosition + 12);

  // "INSTALACIONES COMERCIALES" debajo del logo
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('INSTALACIONES', margin + 5, yPosition + 16);
  doc.text('COMERCIALES', margin + 5, yPosition + 19);

  // Información de contacto (derecha)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const contactX = pageWidth - margin - 5;
  doc.text('@RipserInstalacionesComerciales', contactX, yPosition + 10, { align: 'right' });
  doc.text('www.ripser.com.ar', contactX, yPosition + 14, { align: 'right' });
  doc.text('+54 2235332796', contactX, yPosition + 18, { align: 'right' });

  // Fondo gris claro para el resto del documento
  doc.setFillColor(COLORS.lightBlue[0], COLORS.lightBlue[1], COLORS.lightBlue[2]);
  doc.rect(margin, yPosition + 25, pageWidth - (margin * 2), pageHeight - yPosition - 35, 'F');

  yPosition += 30;

  // ===== TÍTULO "PRESUPUESTO [MES] [AÑO]" =====
  doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.rect(margin + 1, yPosition, pageWidth - (margin * 2) - 2, 8, 'F');

  doc.setTextColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`PRESUPUESTO ${getCurrentMonthYear()}`, pageWidth / 2, yPosition + 5.5, { align: 'center' });

  yPosition += 10;

  // ===== DATOS DEL CLIENTE EN TABLA =====
  const clienteData = [
    [
      { content: 'Cliente:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: presupuesto.clienteNombre || cliente.nombre || '', styles: { fillColor: COLORS.white } },
      { content: 'N°Presupuesto:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: presupuesto.numeroDocumento || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Fecha:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: formatDate(presupuesto.fechaEmision), styles: { fillColor: COLORS.white }, colSpan: 3 }
    ],
    [
      { content: 'DNI:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.cuit || '', styles: { fillColor: COLORS.white }, colSpan: 3 }
    ],
    [
      { content: 'Telefono:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.telefono || '', styles: { fillColor: COLORS.white } },
      { content: 'Dirección:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.direccion || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Email:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.email || '', styles: { fillColor: COLORS.white } },
      { content: 'Cod postal:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.codigoPostal || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Provincia:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.provincia || '', styles: { fillColor: COLORS.white } },
      { content: '', styles: { fillColor: COLORS.lightBlue } },
      { content: '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Localidad:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.ciudad || '', styles: { fillColor: COLORS.white }, colSpan: 3 }
    ]
  ];

  autoTable(doc, {
    startY: yPosition,
    body: clienteData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: COLORS.black,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 'auto' }
    },
    margin: { left: margin + 1, right: margin + 1 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 5;

  // ===== TABLA DE PRODUCTOS =====
  // Agregar filas vacías hasta completar 10 filas (como en el original)
  const maxRows = 10;
  const productosData: any[] = presupuesto.detalles.map(detalle => {
    // Construir la descripción con el número de heladera si existe
    let descripcionCompleta = detalle.descripcion || '';
    const detalleConEquipos = detalle as any;
    if (detalleConEquipos.equiposNumerosHeladera && detalleConEquipos.equiposNumerosHeladera.length > 0) {
      descripcionCompleta += `\nN° Heladera: ${detalleConEquipos.equiposNumerosHeladera.join(', ')}`;
    }

    return [
      { content: detalle.productoId?.toString() || detalle.recetaId?.toString() || '', styles: { halign: 'center' } },
      { content: descripcionCompleta, styles: { halign: 'left', fontStyle: 'bold' as const } },
      { content: detalle.cantidad.toString(), styles: { halign: 'center' } },
      { content: formatCurrency(detalle.precioUnitario), styles: { halign: 'right' } },
      { content: '$0', styles: { halign: 'right' } },
      { content: formatCurrency(detalle.subtotal), styles: { halign: 'right' } }
    ];
  });

  // Rellenar con filas vacías si hay menos de 10 productos
  while (productosData.length < maxRows) {
    productosData.push([
      { content: '', styles: { halign: 'center' } },
      { content: '', styles: { halign: 'left' } },
      { content: '', styles: { halign: 'center' } },
      { content: '', styles: { halign: 'right' } },
      { content: '', styles: { halign: 'right' } },
      { content: '', styles: { halign: 'right' } }
    ]);
  }

  autoTable(doc, {
    startY: yPosition,
    head: [[
      { content: 'Codigo', styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'Descripción', styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'Cantidad', styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'Precio Unitario', styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'IVA', styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'Precio Total', styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } }
    ]],
    body: productosData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: COLORS.black,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
      fillColor: COLORS.white
    },
    headStyles: {
      fontStyle: 'bold' as const,
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 248, 250]  // Ligero gris alternado
    },
    columnStyles: {
      0: { cellWidth: 15 },   // Codigo
      1: { cellWidth: 80 },   // Descripción
      2: { cellWidth: 18 },   // Cantidad
      3: { cellWidth: 28 },   // Precio Unitario
      4: { cellWidth: 15 },   // IVA
      5: { cellWidth: 28 }    // Precio Total
    },
    margin: { left: margin + 1, right: margin + 1 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 2;

  // ===== TOTAL CONTADO EFECTIVO (con desglose de descuento si aplica) =====
  autoTable(doc, {
    startY: yPosition,
    body: buildTotalsRows(presupuesto, 'TOTAL CONTADO EFECTIVO'),
    theme: 'grid',
    styles: {
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 156 },
      1: { cellWidth: 28 }
    },
    margin: { left: margin + 1, right: margin + 1 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 2;

  // ===== OPCIONES DE FINANCIACIÓN =====
  if (opcionesFinanciamiento && opcionesFinanciamiento.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      body: [[
        {
          content: 'OPCIONES DE FINANCIACION',
          styles: {
            halign: 'center',
            fontStyle: 'bold' as const,
            fontSize: 10,
            fillColor: COLORS.darkBlue,
            textColor: COLORS.white,
          },
        },
      ]],
      theme: 'grid',
      styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
      margin: { left: margin + 1, right: margin + 1 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 1;

    const opcionesOrdenadas = [...opcionesFinanciamiento].sort(
      (a, b) => (a.ordenPresentacion || 999) - (b.ordenPresentacion || 999)
    );

    opcionesOrdenadas.forEach((opcion, index) => {
      yPosition = renderOpcionFinanciamiento({
        doc,
        opcion,
        yPosition,
        margin,
        baseImporte: Math.max(0, Number(presupuesto.subtotal ?? 0) - Number(presupuesto.descuentoMonto ?? 0)),
        showOpcionTag: `Opción ${index + 1}:`,
      });
    });

    // Nota legal sobre estimativos para financiamiento propio
    const tieneFinanciamientoPropio = opcionesOrdenadas.some(
      (o) => isFinanciamientoPropio(o.metodoPago) && o.cantidadCuotas > 1
    );
    if (tieneFinanciamientoPropio) {
      yPosition = ensureSpace(doc, yPosition, 10, margin);
      autoTable(doc, {
        startY: yPosition,
        body: [[
          {
            content:
              `* Para financiamiento propio se requiere una entrega inicial del 40% al recibir el producto. La cuota estimada se calcula sobre el saldo restante (60%) más el interés indicado. Importes sujetos a confirmación.`,
            styles: {
              halign: 'left',
              fontSize: 7,
              fontStyle: 'italic' as const,
              fillColor: COLORS.white,
              textColor: COLORS.darkGray,
              cellPadding: 2,
            },
          },
        ]],
        theme: 'grid',
        styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
        margin: { left: margin + 1, right: margin + 1 },
      });
      yPosition = (doc as any).lastAutoTable.finalY;
    }
  }

  // ===== PIE DE PÁGINA AZUL CON NOTA =====
  const footerY = pageHeight - 15;
  doc.setFillColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
  doc.rect(margin, footerY, pageWidth - (margin * 2), 10, 'F');

  doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const notaText = 'Presupuesto sujeto a modificación. El precio se congela una vez confirmada la compra. No pedimos señas ni anticipos.';
  doc.text(notaText, pageWidth / 2, footerY + 6, { align: 'center' });

  // --- DESCARGAR PDF ---
  const nombreCliente = presupuesto.clienteNombre?.replace(/\s+/g, '_') || 'Cliente';
  const fecha = formatDate(presupuesto.fechaEmision).replace(/\//g, '-');
  const nombreArchivo = `Presupuesto_${nombreCliente}_${fecha}.pdf`;

  doc.save(nombreArchivo);
};

/**
 * Genera y descarga un PDF de Nota de Pedido
 */
export const generarNotaPedidoPDF = (data: DocumentoPDFData): void => {
  generarDocumentoComercialPDF({
    ...data,
    tipoDocumento: 'NOTA DE PEDIDO',
    nombreArchivo: 'NotaPedido'
  });
};

/**
 * Genera y descarga un PDF de Venta/Factura
 */
export const generarVentaPDF = (data: DocumentoPDFData): void => {
  generarDocumentoComercialPDF({
    ...data,
    tipoDocumento: 'FACTURA',
    nombreArchivo: 'Factura'
  });
};

/**
 * Función genérica para generar PDFs de documentos comerciales
 */
const generarDocumentoComercialPDF = (data: DocumentoPDFData & { tipoDocumento: string; nombreArchivo: string }): void => {
  const { documento, cliente, opcionSeleccionada, tipoDocumento, nombreArchivo } = data;

  // Crear documento PDF (A4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let yPosition = margin;

  // ===== BARRA SUPERIOR AZUL CON LOGO =====
  doc.setFillColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 25, 'F');

  // Logo texto "Ripser" en cursiva
  doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.setFontSize(24);
  doc.setFont('times', 'italic');
  doc.text('Ripser', margin + 5, yPosition + 12);

  // "INSTALACIONES COMERCIALES" debajo del logo
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('INSTALACIONES', margin + 5, yPosition + 16);
  doc.text('COMERCIALES', margin + 5, yPosition + 19);

  // Información de contacto (derecha)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const contactX = pageWidth - margin - 5;
  doc.text('@RipserInstalacionesComerciales', contactX, yPosition + 10, { align: 'right' });
  doc.text('www.ripser.com.ar', contactX, yPosition + 14, { align: 'right' });
  doc.text('+54 2235332796', contactX, yPosition + 18, { align: 'right' });

  // Fondo gris claro para el resto del documento
  doc.setFillColor(COLORS.lightBlue[0], COLORS.lightBlue[1], COLORS.lightBlue[2]);
  doc.rect(margin, yPosition + 25, pageWidth - (margin * 2), pageHeight - yPosition - 35, 'F');

  yPosition += 30;

  // ===== TÍTULO =====
  doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.rect(margin + 1, yPosition, pageWidth - (margin * 2) - 2, 8, 'F');

  doc.setTextColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${tipoDocumento} ${getCurrentMonthYear()}`, pageWidth / 2, yPosition + 5.5, { align: 'center' });

  yPosition += 10;

  // ===== DATOS DEL CLIENTE EN TABLA =====
  const clienteData = [
    [
      { content: 'Cliente:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: documento.clienteNombre || cliente.nombre || '', styles: { fillColor: COLORS.white } },
      { content: `N°${tipoDocumento === 'FACTURA' ? 'Factura' : tipoDocumento === 'NOTA DE PEDIDO' ? 'Pedido' : 'Documento'}:`, styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: documento.numeroDocumento || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Fecha:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: formatDate(documento.fechaEmision), styles: { fillColor: COLORS.white }, colSpan: 3 }
    ],
    [
      { content: 'DNI:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.cuit || '', styles: { fillColor: COLORS.white }, colSpan: 3 }
    ],
    [
      { content: 'Telefono:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.telefono || '', styles: { fillColor: COLORS.white } },
      { content: 'Dirección:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.direccion || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Email:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.email || '', styles: { fillColor: COLORS.white } },
      { content: 'Cod postal:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.codigoPostal || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Provincia:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.provincia || '', styles: { fillColor: COLORS.white } },
      { content: '', styles: { fillColor: COLORS.lightBlue } },
      { content: '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Localidad:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: cliente.ciudad || '', styles: { fillColor: COLORS.white }, colSpan: 3 }
    ]
  ];

  autoTable(doc, {
    startY: yPosition,
    body: clienteData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: COLORS.black,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 'auto' }
    },
    margin: { left: margin + 1, right: margin + 1 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 5;

  // ===== TABLA DE PRODUCTOS =====
  const maxRows = 10;
  const productosData: any[] = documento.detalles.map(detalle => {
    // Construir la descripción con el número de heladera si existe
    let descripcionCompleta = detalle.descripcion || '';
    const detalleConEquipos = detalle as any;
    if (detalleConEquipos.equiposNumerosHeladera && detalleConEquipos.equiposNumerosHeladera.length > 0) {
      descripcionCompleta += `\nN° Heladera: ${detalleConEquipos.equiposNumerosHeladera.join(', ')}`;
    }

    return [
      { content: detalle.productoId?.toString() || detalle.recetaId?.toString() || '', styles: { halign: 'center' } },
      { content: descripcionCompleta, styles: { halign: 'left', fontStyle: 'bold' as const } },
      { content: detalle.cantidad.toString(), styles: { halign: 'center' } },
      { content: formatCurrency(detalle.precioUnitario), styles: { halign: 'right' } },
      { content: '$0', styles: { halign: 'right' } },
      { content: formatCurrency(detalle.subtotal), styles: { halign: 'right' } }
    ];
  });

  // Rellenar con filas vacías
  while (productosData.length < maxRows) {
    productosData.push([
      { content: '', styles: { halign: 'center' } },
      { content: '', styles: { halign: 'left' } },
      { content: '', styles: { halign: 'center' } },
      { content: '', styles: { halign: 'right' } },
      { content: '', styles: { halign: 'right' } },
      { content: '', styles: { halign: 'right' } }
    ]);
  }

  autoTable(doc, {
    startY: yPosition,
    head: [[
      { content: 'Codigo', styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'Descripción', styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'Cantidad', styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'Precio Unitario', styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'IVA', styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'Precio Total', styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } }
    ]],
    body: productosData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: COLORS.black,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
      fillColor: COLORS.white
    },
    headStyles: {
      fontStyle: 'bold' as const,
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 248, 250]
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 80 },
      2: { cellWidth: 18 },
      3: { cellWidth: 28 },
      4: { cellWidth: 15 },
      5: { cellWidth: 28 }
    },
    margin: { left: margin + 1, right: margin + 1 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 2;

  // ===== TOTAL (con desglose de descuento si aplica) =====
  autoTable(doc, {
    startY: yPosition,
    body: buildTotalsRows(documento, 'PRECIO DE LISTA'),
    theme: 'grid',
    styles: {
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 156 },
      1: { cellWidth: 28 }
    },
    margin: { left: margin + 1, right: margin + 1 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 2;

  // ===== FORMA DE PAGO / OPCIÓN DE FINANCIAMIENTO SELECCIONADA =====
  if (opcionSeleccionada) {
    autoTable(doc, {
      startY: yPosition,
      body: [[
        {
          content: 'FINANCIAMIENTO SELECCIONADO',
          styles: {
            halign: 'center',
            fontStyle: 'bold' as const,
            fontSize: 10,
            fillColor: COLORS.darkBlue,
            textColor: COLORS.white,
          },
        },
      ]],
      theme: 'grid',
      styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
      margin: { left: margin + 1, right: margin + 1 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 1;

    yPosition = renderOpcionFinanciamiento({
      doc,
      opcion: opcionSeleccionada,
      yPosition,
      margin,
      baseImporte: Math.max(0, Number(documento.subtotal ?? 0) - Number(documento.descuentoMonto ?? 0)),
    });

    if (isFinanciamientoPropio(opcionSeleccionada.metodoPago) && opcionSeleccionada.cantidadCuotas > 1) {
      yPosition = ensureSpace(doc, yPosition, 10, margin);
      autoTable(doc, {
        startY: yPosition,
        body: [[
          {
            content:
              `* Entrega inicial del 40% al recibir el producto. La cuota estimada se calcula sobre el saldo (60%) más el interés indicado. Importes estimativos sujetos a confirmación.`,
            styles: {
              halign: 'left',
              fontSize: 7,
              fontStyle: 'italic' as const,
              fillColor: COLORS.white,
              textColor: COLORS.darkGray,
              cellPadding: 2,
            },
          },
        ]],
        theme: 'grid',
        styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
        margin: { left: margin + 1, right: margin + 1 },
      });
    }
  } else if (documento.metodoPago) {
    // Fallback: el documento tiene método de pago seteado pero no se pudo cargar
    // la opción puntual (caso típico cuando se eligió "Financiamiento" sin opción específica).
    autoTable(doc, {
      startY: yPosition,
      body: [[
        {
          content: 'FORMA DE PAGO',
          styles: {
            halign: 'center',
            fontStyle: 'bold' as const,
            fontSize: 10,
            fillColor: COLORS.darkBlue,
            textColor: COLORS.white,
          },
        },
      ]],
      theme: 'grid',
      styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
      margin: { left: margin + 1, right: margin + 1 },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 1;

    const propio = isFinanciamientoPropio(documento.metodoPago);
    const baseFinanciamiento = Math.max(0, Number(documento.subtotal ?? 0) - Number(documento.descuentoMonto ?? 0));
    const entregaEstimada = propio ? calcularEntregaInicial(baseFinanciamiento) : null;

    autoTable(doc, {
      startY: yPosition,
      body: [
        [
          {
            content: 'Método:',
            styles: {
              halign: 'left',
              fontStyle: 'bold' as const,
              fontSize: 9,
              fillColor: COLORS.lightBlue,
              cellPadding: 2,
            },
          },
          {
            content: getMetodoPagoLabel(documento.metodoPago),
            styles: { halign: 'left', fontSize: 9, fillColor: COLORS.white, cellPadding: 2 },
          },
        ],
        ...(propio && entregaEstimada !== null
          ? [[
              {
                content: 'Entrega inicial estimada (40%):',
                styles: {
                  halign: 'left' as const,
                  fontStyle: 'bold' as const,
                  fontSize: 8,
                  fillColor: COLORS.lightBlue,
                  cellPadding: 2,
                },
              },
              {
                content: formatCurrency(entregaEstimada),
                styles: { halign: 'right' as const, fontSize: 8, fillColor: COLORS.white, cellPadding: 2 },
              },
            ]]
          : []),
      ],
      theme: 'grid',
      styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 124 } },
      margin: { left: margin + 1, right: margin + 1 },
    });
    yPosition = (doc as any).lastAutoTable.finalY;

    if (propio) {
      yPosition = ensureSpace(doc, yPosition, 10, margin);
      autoTable(doc, {
        startY: yPosition,
        body: [[
          {
            content:
              `* Plan de cuotas a definir con el cliente. La entrega inicial es estimativa (40% del total) y el saldo se financia con el interés acordado sobre el saldo restante.`,
            styles: {
              halign: 'left',
              fontSize: 7,
              fontStyle: 'italic' as const,
              fillColor: COLORS.white,
              textColor: COLORS.darkGray,
              cellPadding: 2,
            },
          },
        ]],
        theme: 'grid',
        styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
        margin: { left: margin + 1, right: margin + 1 },
      });
    }
  }

  // ===== PIE DE PÁGINA AZUL CON NOTA =====
  const footerY = pageHeight - 15;
  doc.setFillColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
  doc.rect(margin, footerY, pageWidth - (margin * 2), 10, 'F');

  doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const notaText = tipoDocumento === 'FACTURA'
    ? 'Gracias por su compra. El precio está congelado según el acuerdo.'
    : 'Pedido sujeto a confirmación de stock. El precio se congela una vez confirmado el pedido.';
  doc.text(notaText, pageWidth / 2, footerY + 6, { align: 'center' });

  // --- DESCARGAR PDF ---
  const nombreCliente = documento.clienteNombre?.replace(/\s+/g, '_') || 'Cliente';
  const fecha = formatDate(documento.fechaEmision).replace(/\//g, '-');
  const archivoNombre = `${nombreArchivo}_${nombreCliente}_${fecha}.pdf`;

  doc.save(archivoNombre);
};

/**
 * Genera un PDF con el estado actual de un crédito personal:
 * datos del cliente, datos del crédito, tabla de cuotas (con estado/montos)
 * y totales. Reutiliza el header/footer corporativo de pdfExportUtils para
 * mantener el mismo look & feel que los PDF del módulo de Ventas.
 *
 * No lo guarda en disco — devuelve la instancia de jsPDF para que el caller
 * decida (save / output / preview).
 */
export const generarCreditoPDF = (
  prestamo: PrestamoPersonalDTO,
  cuotas: CuotaPrestamoDTO[],
): jsPDF => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  let y = addCorporateHeader(doc, 'Estado del Crédito Personal');

  // ---- Bloque Cliente ----
  doc.setFillColor(...COLORS.white);
  doc.rect(margin + 1, y, pageWidth - (margin * 2) - 2, 22, 'F');
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', margin + 4, y + 5);

  doc.setTextColor(...COLORS.black);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nombre: ${prestamo.clienteNombre}`, margin + 4, y + 11);
  if (prestamo.codigoClienteRojas) {
    doc.text(`Código Rojas: ${prestamo.codigoClienteRojas}`, margin + 4, y + 16);
  }
  doc.text(`Préstamo #${prestamo.id}`, pageWidth - margin - 4, y + 11, { align: 'right' });
  if (prestamo.documentoId) {
    doc.text(`Factura: #${prestamo.documentoId}`, pageWidth - margin - 4, y + 16, { align: 'right' });
  }
  y += 24;

  // ---- Bloque Crédito ----
  doc.setFillColor(...COLORS.white);
  doc.rect(margin + 1, y, pageWidth - (margin * 2) - 2, 30, 'F');
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CRÉDITO', margin + 4, y + 5);

  doc.setTextColor(...COLORS.black);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const colW = (pageWidth - margin * 2 - 8) / 3;
  const c1 = margin + 4;
  const c2 = c1 + colW;
  const c3 = c2 + colW;

  doc.text(`Monto total: ${formatCurrency(prestamo.montoTotal)}`, c1, y + 11);
  doc.text(`Cuotas: ${prestamo.cuotasPagadas}/${prestamo.cantidadCuotas}`, c2, y + 11);
  doc.text(`Valor cuota: ${formatCurrency(prestamo.valorCuota)}`, c3, y + 11);

  doc.text(`Financiación: ${TIPO_FINANCIACION_LABELS[prestamo.tipoFinanciacion] || prestamo.tipoFinanciacion}`, c1, y + 17);
  doc.text(`Estado: ${ESTADO_PRESTAMO_LABELS[prestamo.estado] || prestamo.estado}`, c2, y + 17);
  const fechaEntregaTxt = prestamo.fechaEntrega
    ? formatDate(prestamo.fechaEntrega)
    : 'Pendiente de entrega';
  doc.text(`Fecha entrega: ${fechaEntregaTxt}`, c3, y + 17);

  doc.text(`Cobrado: ${formatCurrency(prestamo.montoPagado)}`, c1, y + 23);
  doc.text(`Saldo: ${formatCurrency(prestamo.saldoPendiente)}`, c2, y + 23);
  if (prestamo.diasVencido && prestamo.diasVencido > 0) {
    doc.setTextColor(...COLORS.darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text(`Días vencido: ${prestamo.diasVencido}`, c3, y + 23);
    doc.setTextColor(...COLORS.black);
    doc.setFont('helvetica', 'normal');
  }
  y += 32;

  // ---- Tabla de cuotas ----
  const cuotasOrdenadas = [...cuotas].sort((a, b) => a.numeroCuota - b.numeroCuota);
  const rows = cuotasOrdenadas.map(c => [
    c.numeroCuota.toString(),
    formatDate(c.fechaVencimiento),
    formatCurrency(c.montoCuota),
    formatCurrency(c.montoPagado),
    formatCurrency(Math.max(0, Number(c.montoCuota) - Number(c.montoPagado))),
    ESTADO_CUOTA_LABELS[c.estado] || c.estado,
    c.diasMora && c.diasMora > 0 ? c.diasMora.toString() : '-',
  ]);

  autoTable(doc, {
    head: [['#', 'Vencimiento', 'Monto', 'Pagado', 'Saldo', 'Estado', 'Días mora']],
    body: rows,
    startY: y,
    margin: { left: margin + 1, right: margin + 1, bottom: PAGE_MARGIN_BOTTOM },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, textColor: COLORS.black },
    headStyles: {
      fillColor: COLORS.darkBlue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'center' },
      6: { halign: 'center', cellWidth: 18 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const estado = cuotasOrdenadas[data.row.index]?.estado;
        if (estado === 'PAGADA') {
          data.cell.styles.textColor = [0, 128, 0];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'VENCIDA') {
          data.cell.styles.textColor = [200, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'PARCIAL') {
          data.cell.styles.textColor = [200, 130, 0];
        } else if (estado === 'REFINANCIADA') {
          data.cell.styles.textColor = [120, 60, 160];
        }
      }
    },
  });

  // ---- Totales ----
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  let yT = finalY + 6;

  const pageHeight = doc.internal.pageSize.getHeight();
  if (yT + 30 > pageHeight - PAGE_MARGIN_BOTTOM) {
    doc.addPage();
    yT = margin + 5;
  }

  const cuotasPagadas = cuotasOrdenadas.filter(c => c.estado === 'PAGADA').length;
  const cuotasVencidas = cuotasOrdenadas.filter(c => c.estado === 'VENCIDA').length;
  const cuotasPendientes = cuotasOrdenadas.filter(c => c.estado === 'PENDIENTE').length;

  doc.setFillColor(...COLORS.white);
  doc.rect(margin + 1, yT, pageWidth - (margin * 2) - 2, 22, 'F');

  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RESUMEN', margin + 4, yT + 5);

  doc.setTextColor(...COLORS.black);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Pagadas: ${cuotasPagadas}`, c1, yT + 11);
  doc.text(`Pendientes: ${cuotasPendientes}`, c2, yT + 11);
  doc.text(`Vencidas: ${cuotasVencidas}`, c3, yT + 11);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total cobrado: ${formatCurrency(prestamo.montoPagado)}`, c1, yT + 17);
  doc.text(`Saldo pendiente: ${formatCurrency(prestamo.saldoPendiente)}`, c2, yT + 17);
  if (prestamo.vencimientoActual) {
    doc.text(`Próximo vence: ${formatDate(prestamo.vencimientoActual)}`, c3, yT + 17);
  }

  addCorporateFooter(doc);
  return doc;
};
