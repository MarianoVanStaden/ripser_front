import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  DocumentoComercial,
  DetalleDocumento,
  OpcionFinanciamientoDTO,
  Cliente,
  Sueldo,
  Empleado,
  CategoriaSalarial,
} from '../types';
import { PROVINCIA_LABELS } from '../types/shared.enums';
import type { LeadDTO } from '../types/lead.types';
import { CONCEPTO_SUELDO_LABELS } from '../types/remuneraciones.types';
import type { CuotaPrestamoDTO, PrestamoPersonalDTO } from '../types/prestamo.types';
import type { FichaTecnicaEquipoDTO } from '../api/services/especificacionTecnicaApi';
import {
  ESTADO_CUOTA_LABELS,
  ESTADO_PRESTAMO_LABELS,
  TIPO_FINANCIACION_LABELS,
} from '../types/prestamo.types';
import { addCorporateHeader, addCorporateFooter } from '../utils/pdfExportUtils';
import { RIPSER_LOGO_DATA_URL, RIPSER_LOGO_ASPECT } from './ripserLogo';
import {
  PORCENTAJE_ENTREGA_PROPIO,
  calculateCostoEnvio,
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
  cliente?: Cliente;
  lead?: LeadDTO;
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

// Dibuja el logo corporativo (imagen) en el extremo superior izquierdo de la barra
// azul del encabezado, reemplazando el texto "Ripser / INSTALACIONES COMERCIALES".
// barTopY es la coordenada Y del borde superior de la barra (altura 25mm).
const drawHeaderLogo = (doc: jsPDF, margin: number, barTopY: number): void => {
  const logoH = 18;
  const logoW = logoH * RIPSER_LOGO_ASPECT;
  doc.addImage(RIPSER_LOGO_DATA_URL, 'PNG', margin + 4, barTopY + (25 - logoH) / 2, logoW, logoH);
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
  // Strings de solo fecha (YYYY-MM-DD) se normalizan a hora local para evitar
  // el desfase de un día que ocurre cuando new Date() los interpreta como UTC midnight.
  const normalized = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
  const date = new Date(normalized);
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

  // Orden contable: bruto → descuento → neto gravado → IVA → total.
  // El descuento (bonificación) reduce la base imponible ANTES del IVA; el IVA
  // se liquida sobre el neto ya descontado. Total = neto + IVA.
  const subtotalNeto = Math.max(0, subtotalBruto - descuentoMonto);
  const iva = Number(documento.iva ?? 0);
  const total = subtotalNeto + iva;
  const descuentoLabel = descuentoTipo === 'PORCENTAJE'
    ? `Descuento (${descuentoValor}%)`
    : 'Descuento';
  const normalLabel = { ...TOTAL_LABEL_STYLE, fontStyle: 'normal' as const };
  const normalRow = { ...TOTAL_ROW_STYLE, fontStyle: 'normal' as const };

  return [
    [
      { content: 'Subtotal (bruto)', styles: normalLabel },
      { content: formatCurrency(subtotalBruto), styles: normalRow },
    ],
    [
      { content: descuentoLabel, styles: normalLabel },
      { content: `- ${formatCurrency(descuentoMonto)}`, styles: normalRow },
    ],
    [
      { content: 'Subtotal (neto)', styles: normalLabel },
      { content: formatCurrency(subtotalNeto), styles: normalRow },
    ],
    [
      { content: 'IVA', styles: normalLabel },
      { content: formatCurrency(iva), styles: normalRow },
    ],
    [
      { content: totalLabel, styles: TOTAL_LABEL_STYLE },
      { content: formatCurrency(total), styles: TOTAL_ROW_STYLE },
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
  costoEnvio?: number;
  showOpcionTag?: string;
  estiloSimplificado?: boolean;
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
  costoEnvio = 0,
  showOpcionTag,
  estiloSimplificado = false,
}: RenderOpcionParams): number => {
  // Si la opción trae la entrega inicial pre-calculada (viene de la calculadora
  // de exportación), se usa tal cual para cheques y créditos por igual. Si no,
  // se mantiene el cálculo legacy sólo para financiamiento propio.
  const tieneEntregaPrecalc = opcion.montoEntregaInicial != null;
  const propioLegacy =
    !tieneEntregaPrecalc && isFinanciamientoPropio(opcion.metodoPago) && opcion.cantidadCuotas > 1;
  const calc = propioLegacy
    ? calcularFinanciamientoPropio(baseImporte, opcion.tasaInteres, opcion.cantidadCuotas, 0.4, costoEnvio)
    : null;
  const mostrarDesglose = tieneEntregaPrecalc || propioLegacy;
  const entregaMonto = tieneEntregaPrecalc ? (opcion.montoEntregaInicial ?? 0) : (calc?.entrega ?? 0);
  const saldoMonto = tieneEntregaPrecalc
    ? Math.max(0, opcion.montoTotal - (opcion.montoEntregaInicial ?? 0))
    : (calc?.saldo ?? 0);
  const cuotaMonto = tieneEntregaPrecalc ? opcion.montoCuota : (calc?.cuotaEstimada ?? 0);
  const pctEntrega = tieneEntregaPrecalc ? (opcion.porcentajeEntregaInicial ?? 40) : 40;

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
        content: mostrarDesglose ? '' : `Total: ${formatCurrency(opcion.montoTotal)}`,
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
        content: mostrarDesglose
          ? `Cuota estimada: ${formatCurrency(cuotaMonto)}`
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

  // Bloque de desglose: entrega inicial (+ saldo a financiar salvo estilo simplificado)
  if (mostrarDesglose) {
    const entregaContent = estiloSimplificado
      ? `Entrega inicial: ${formatCurrency(entregaMonto)}`
      : `Entrega inicial estimada (${pctEntrega}%): ${formatCurrency(entregaMonto)}`;
    autoTable(doc, {
      startY: yPosition,
      body: [
        estiloSimplificado
          ? [
              {
                content: entregaContent,
                styles: { halign: 'left', fontSize: 8, fillColor: COLORS.white, cellPadding: 2 },
              },
            ]
          : [
              {
                content: entregaContent,
                styles: { halign: 'left', fontSize: 8, fillColor: COLORS.white, cellPadding: 2 },
              },
              {
                content: `Saldo a financiar: ${formatCurrency(saldoMonto)}`,
                styles: { halign: 'right', fontSize: 8, fillColor: COLORS.white, cellPadding: 2 },
              },
            ],
      ],
      theme: 'grid',
      styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
      columnStyles: estiloSimplificado
        ? { 0: { cellWidth: tableWidth } }
        : { 0: { cellWidth: tableWidth / 2 }, 1: { cellWidth: tableWidth / 2 } },
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
  const { presupuesto, cliente, lead, opcionesFinanciamiento } = data;
  const contacto = {
    nombre: presupuesto.clienteNombre || presupuesto.leadNombre || cliente?.nombre || (lead ? `${lead.nombre}${lead.apellido ? ' ' + lead.apellido : ''}` : '') || '',
    cuit: cliente?.cuit || '',
    telefono: cliente?.telefono || lead?.telefono || '',
    direccion: cliente?.direccion || '',
    email: cliente?.email || lead?.email || '',
    codigoPostal: cliente?.codigoPostal || '',
    provincia: cliente?.provincia || lead?.provincia || '',
    ciudad: cliente?.ciudad || lead?.ciudad || '',
  };

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

  // ===== BARRA SUPERIOR CON LOGO =====
  doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 25, 'F');

  // Logo corporativo (imagen) en el extremo superior izquierdo
  drawHeaderLogo(doc, margin, yPosition);

  // Información de contacto (derecha)
  doc.setTextColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
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
      { content: contacto.nombre, styles: { fillColor: COLORS.white } },
      { content: 'N°Presupuesto:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: presupuesto.numeroDocumento || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Fecha:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: formatDate(presupuesto.fechaEmision), styles: { fillColor: COLORS.white }, colSpan: 3 }
    ],
    [
      { content: 'DNI:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: contacto.cuit, styles: { fillColor: COLORS.white }, colSpan: 3 }
    ],
    [
      { content: 'Telefono:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: contacto.telefono, styles: { fillColor: COLORS.white } },
      { content: 'Dirección:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: contacto.direccion, styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Email:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: contacto.email, styles: { fillColor: COLORS.white } },
      { content: 'Cod postal:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: contacto.codigoPostal, styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Provincia:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: contacto.provincia, styles: { fillColor: COLORS.white } },
      { content: '', styles: { fillColor: COLORS.lightBlue } },
      { content: '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Localidad:', styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
      { content: contacto.ciudad, styles: { fillColor: COLORS.white }, colSpan: 3 }
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
      const costoEnvio = calculateCostoEnvio(presupuesto.detalles ?? []);
      const equipoBase = Math.max(0, Number(presupuesto.total ?? 0) - costoEnvio);
      yPosition = renderOpcionFinanciamiento({
        doc,
        opcion,
        yPosition,
        margin,
        baseImporte: equipoBase,
        costoEnvio,
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

  // ===== BARRA SUPERIOR CON LOGO =====
  doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 25, 'F');

  // Logo corporativo (imagen) en el extremo superior izquierdo
  drawHeaderLogo(doc, margin, yPosition);

  // Información de contacto (derecha)
  doc.setTextColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
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
    const descripcionCompleta = detalle.descripcion || '';

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

    const costoEnvio = calculateCostoEnvio(documento.detalles ?? []);
    // documento.total puede ser el total financiado (se sobreescribe en NP/presupuesto al
    // seleccionar la opción). Usar subtotal - descuento + iva para obtener el precio real.
    const equipoBase = Math.max(
      0,
      Number(documento.subtotal ?? 0) - Number(documento.descuentoMonto ?? 0) + Number(documento.iva ?? 0) - costoEnvio
    );
    yPosition = renderOpcionFinanciamiento({
      doc,
      opcion: opcionSeleccionada,
      yPosition,
      margin,
      baseImporte: equipoBase,
      costoEnvio,
      estiloSimplificado: true,
    });
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
    // La entrega inicial es 40% de los equipos (netos, sin envío) MÁS el envío completo.
    // No se aplica el 40% sobre el envío.
    const costoEnvioFallback = calculateCostoEnvio(documento.detalles ?? []);
    const equipoBaseFallback = Math.max(
      0,
      Number(documento.subtotal ?? 0) - Number(documento.descuentoMonto ?? 0) + Number(documento.iva ?? 0) - costoEnvioFallback
    );
    const entregaEstimada = propio
      ? Math.round(equipoBaseFallback * PORCENTAJE_ENTREGA_PROPIO) + costoEnvioFallback
      : null;

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
                content: 'Entrega inicial:',
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
 * datos del cliente (completos), equipos de la compra, datos del crédito,
 * tabla de cuotas (con vencimiento, fecha de pago, estado/montos) y totales.
 * Reutiliza el header/footer corporativo de pdfExportUtils para mantener el
 * mismo look & feel que los PDF del módulo de Ventas.
 *
 * `opciones.cliente` enriquece el bloque de cliente (DNI/CUIT, teléfono,
 * localidad, provincia). `opciones.equipos` son los detalles tipo EQUIPO de la
 * factura de origen (modelo, cantidad, color, medida). Ambos son opcionales:
 * si no se pasan, el PDF se genera igual con los datos que trae el préstamo.
 *
 * No lo guarda en disco — devuelve la instancia de jsPDF para que el caller
 * decida (save / output / preview).
 */
export const generarCreditoPDF = (
  prestamo: PrestamoPersonalDTO,
  cuotas: CuotaPrestamoDTO[],
  opciones?: {
    cliente?: Cliente | null;
    equipos?: DetalleDocumento[] | null;
  },
): jsPDF => {
  const cliente = opciones?.cliente ?? null;
  const equipos = (opciones?.equipos ?? []).filter(
    (d) => d.tipoItem === 'EQUIPO' || d.recetaModelo || d.recetaNombre,
  );
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  let y = addCorporateHeader(doc, 'Estado del Crédito Personal', true);

  // ---- Banner de crédito finalizado ----
  // Cobranzas envía este PDF al cliente como constancia: cuando el crédito está
  // saldado, la leyenda debe ser inconfundible.
  if (prestamo.estado === 'FINALIZADO') {
    const bannerH = 10;
    doc.setFillColor(46, 125, 50); // verde #2E7D32
    doc.rect(margin + 1, y, pageWidth - (margin * 2) - 2, bannerH, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('CRÉDITO PERSONAL FINALIZADO', pageWidth / 2, y + bannerH / 2 + 1.5, { align: 'center' });
    y += bannerH + 4;
  }

  // ---- Bloque Cliente ----
  // Datos de contacto y ubicación del cliente para que el PDF sea autosuficiente
  // (Cobranzas lo usa como estado de cuenta que se envía al cliente).
  const nombreCompleto = cliente
    ? [cliente.nombre, cliente.apellido].filter(Boolean).join(' ').trim()
    : [prestamo.clienteNombre, prestamo.clienteApellido].filter(Boolean).join(' ').trim();
  const dniCuit = cliente?.cuit?.trim() || null;
  const telefono = cliente?.telefono?.trim() || cliente?.telefonoAlternativo?.trim()
    || cliente?.whatsapp?.trim() || null;
  const localidad = cliente?.ciudad?.trim() || null;
  const provincia = cliente?.provincia ? (PROVINCIA_LABELS[cliente.provincia] || cliente.provincia) : null;

  const CLIENTE_BOX_H = 34;
  doc.setDrawColor(...COLORS.mediumGray);
  doc.setFillColor(...COLORS.darkBlue);
  doc.rect(margin + 1, y, pageWidth - (margin * 2) - 2, 7, 'F');
  doc.setFillColor(...COLORS.white);
  doc.rect(margin + 1, y + 7, pageWidth - (margin * 2) - 2, CLIENTE_BOX_H - 7, 'FD');

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', margin + 4, y + 5);
  // Meta del préstamo alineada a la derecha del encabezado de la sección.
  doc.setFontSize(9);
  doc.text(`Préstamo #${prestamo.id}`, pageWidth - margin - 4, y + 5, { align: 'right' });

  // Etiqueta/valor con la etiqueta en gris y el valor en negro para jerarquía.
  const colL = margin + 4;                                  // columna izquierda
  const colR = margin + (pageWidth - margin * 2) / 2 + 4;   // columna derecha
  const label = (txt: string, vx: number, vy: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.darkGray);
    doc.setFontSize(8);
    doc.text(txt, vx, vy);
  };
  const value = (txt: string, vx: number, vy: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(9);
    doc.text(txt, vx, vy);
  };

  let ly = y + 13;
  label('Nombre:', colL, ly);
  value(nombreCompleto || '-', colL + 20, ly);
  label('Cód. Cliente:', colR, ly);
  value(prestamo.codigoClienteRojas || '-', colR + 24, ly);

  ly += 6;
  label('DNI / CUIT:', colL, ly);
  value(dniCuit || '-', colL + 20, ly);
  label('Teléfono:', colR, ly);
  value(telefono || '-', colR + 24, ly);

  ly += 6;
  label('Localidad:', colL, ly);
  value(localidad || '-', colL + 20, ly);
  label('Provincia:', colR, ly);
  value(provincia || '-', colR + 24, ly);

  ly += 6;
  if (prestamo.documentoId) {
    label('Factura:', colL, ly);
    value(`#${prestamo.documentoId}`, colL + 20, ly);
  } else if (prestamo.numeroComprobante) {
    label('Comprob.:', colL, ly);
    value(prestamo.numeroComprobante, colL + 20, ly);
  }
  if (cliente?.email) {
    label('Email:', colR, ly);
    value(cliente.email, colR + 24, ly);
  }

  y += CLIENTE_BOX_H + 2;

  // ---- Cálculos ajustados: PAGO_INFORMADO se trata como pagado en el PDF ----
  // informar() en el backend NO toca montoPagado: el monto declarado vive en
  // montoInformado. El acumulado real de una cuota con pago informado es entonces
  // montoPagado (confirmado previo) + montoInformado (recién informado). Si ese
  // acumulado cubre la cuota, es un informe TOTAL (se muestra "Pagada"); si no,
  // es PARCIAL (se muestra "Pago parcial" con el acumulado y su saldo).
  const EPS = 0.01;
  const acumuladoInformado = (c: CuotaPrestamoDTO): number =>
    Number(c.montoPagado ?? 0) + Number(c.montoInformado ?? 0);
  const esInformadoTotal = (c: CuotaPrestamoDTO): boolean =>
    c.estado === 'PAGO_INFORMADO' && acumuladoInformado(c) >= Number(c.montoCuota) - EPS;

  const cuotasOrdenadas = [...cuotas].sort((a, b) => a.numeroCuota - b.numeroCuota);
  // El crédito al cliente por pagos informados es lo declarado (montoInformado),
  // no el valor nominal de la cuota — así un parcial suma solo lo informado.
  const montoPagoInformado = cuotasOrdenadas
    .filter(c => c.estado === 'PAGO_INFORMADO')
    .reduce((sum, c) => sum + Number(c.montoInformado ?? 0), 0);
  // Solo los informes TOTALES cuentan como cuota saldada en "Cuotas x/y".
  const cuotasPagoInformadoCount = cuotasOrdenadas.filter(esInformadoTotal).length;
  const cobradoAjustado = Number(prestamo.montoPagado) + montoPagoInformado;
  const saldoAjustado = Math.max(0, Number(prestamo.saldoPendiente) - montoPagoInformado);

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
  doc.text(`Cuotas: ${Number(prestamo.cuotasPagadas) + cuotasPagoInformadoCount}/${prestamo.cantidadCuotas}`, c2, y + 11);
  doc.text(`Valor cuota: ${formatCurrency(prestamo.valorCuota)}`, c3, y + 11);

  doc.text(`Financiación: ${TIPO_FINANCIACION_LABELS[prestamo.tipoFinanciacion] || prestamo.tipoFinanciacion}`, c1, y + 17);
  doc.text(`Estado: ${ESTADO_PRESTAMO_LABELS[prestamo.estado] || prestamo.estado}`, c2, y + 17);
  const fechaEntregaTxt = prestamo.fechaEntrega
    ? formatDate(prestamo.fechaEntrega)
    : 'Pendiente de entrega';
  doc.text(`Fecha entrega: ${fechaEntregaTxt}`, c3, y + 17);

  // Días vencido excluyendo cuotas con pago informado (actúan como pagadas en el PDF)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diasVencidoPDF = cuotasOrdenadas
    .filter(c => (c.estado === 'VENCIDA' || c.estado === 'PARCIAL') && c.fechaVencimiento)
    .reduce((max, c) => {
      const venc = new Date(c.fechaVencimiento + 'T00:00:00');
      const dias = Math.floor((hoy.getTime() - venc.getTime()) / 86400000);
      return dias > max ? dias : max;
    }, 0);

  doc.text(`Cobrado: ${formatCurrency(cobradoAjustado)}`, c1, y + 23);
  doc.text(`Saldo: ${formatCurrency(saldoAjustado)}`, c2, y + 23);
  if (diasVencidoPDF > 0) {
    doc.setTextColor(...COLORS.darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text(`Días vencido: ${diasVencidoPDF}`, c3, y + 23);
    doc.setTextColor(...COLORS.black);
    doc.setFont('helvetica', 'normal');
  }
  y += 32;

  // ---- Equipos de la compra ----
  // Detalle de los equipos que originaron el crédito (modelo, cantidad, color,
  // medida). Solo se dibuja si el caller pasó la factura de origen.
  if (equipos.length > 0) {
    const pageHeightEq = doc.internal.pageSize.getHeight();
    if (y + 20 > pageHeightEq - PAGE_MARGIN_BOTTOM) {
      doc.addPage();
      y = margin + 5;
    }
    doc.setFillColor(...COLORS.darkBlue);
    doc.rect(margin + 1, y, pageWidth - (margin * 2) - 2, 7, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('EQUIPOS DE LA COMPRA', margin + 4, y + 5);
    y += 8;

    const equipoRows = equipos.map((d) => [
      d.recetaModelo || d.recetaNombre || d.descripcionEquipo || d.descripcion || 'Equipo',
      String(d.cantidad ?? 1),
      d.color?.nombre || '-',
      d.medida?.nombre || '-',
    ]);

    autoTable(doc, {
      head: [['Modelo', 'Cantidad', 'Color', 'Medida']],
      body: equipoRows,
      startY: y,
      margin: { left: margin + 1, right: margin + 1, bottom: PAGE_MARGIN_BOTTOM },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.8, textColor: COLORS.black },
      headStyles: {
        fillColor: COLORS.darkBlue,
        textColor: COLORS.white,
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center', cellWidth: 24 },
        2: { halign: 'center', cellWidth: 45 },
        3: { halign: 'center', cellWidth: 35 },
      },
    });

    const finalYEq = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
    y = finalYEq + 6;
  }

  // ---- Tabla de cuotas ----
  // En el PDF que envía Cobranzas, una cuota cuyo pago fue informado pero aún no
  // confirmado por Administración se muestra como "Pagada" (informe TOTAL) o
  // "Pago parcial" (informe parcial): el cliente ve el estado al día aunque la
  // confirmación interna demore. El estado real en el sistema sigue siendo
  // PAGO_INFORMADO en ambos casos.
  const estadoLabelPDF = (c: CuotaPrestamoDTO): string =>
    c.estado === 'PAGO_INFORMADO'
      ? (esInformadoTotal(c) ? 'Pagada' : 'Pago parcial')
      : (ESTADO_CUOTA_LABELS[c.estado] || c.estado);

  const rows = cuotasOrdenadas.map(c => {
    const esPagoInformado = c.estado === 'PAGO_INFORMADO';
    // Informe total → cuota saldada; informe parcial → acumulado real y su saldo.
    const pagado = esPagoInformado
      ? (esInformadoTotal(c) ? Number(c.montoCuota) : acumuladoInformado(c))
      : Number(c.montoPagado);
    const saldo = Math.max(0, Number(c.montoCuota) - pagado);
    const fechaPagoDisplay = esPagoInformado
      ? (c.fechaPagoInformada ? formatDate(c.fechaPagoInformada) : '-')
      : (c.fechaPago ? formatDate(c.fechaPago) : '-');
    const comprobanteDisplay = esPagoInformado
      ? (c.comprobanteInformado || c.numeroComprobante || '-')
      : (c.numeroComprobante || '-');
    return [
      c.numeroCuota.toString(),
      c.fechaVencimiento ? formatDate(c.fechaVencimiento) : 'Pendiente',
      fechaPagoDisplay,
      formatCurrency(c.montoCuota),
      formatCurrency(pagado),
      formatCurrency(saldo),
      comprobanteDisplay,
      estadoLabelPDF(c),
      c.diasMora && c.diasMora > 0 ? c.diasMora.toString() : '-',
    ];
  });

  autoTable(doc, {
    head: [['#', 'Vencimiento', 'Fecha pago', 'Monto', 'Pagado', 'Saldo', 'Comprobante', 'Estado', 'Días mora']],
    body: rows,
    startY: y,
    margin: { left: margin + 1, right: margin + 1, bottom: PAGE_MARGIN_BOTTOM },
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.5, textColor: COLORS.black },
    headStyles: {
      fillColor: COLORS.darkBlue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'center', cellWidth: 14 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const cuota = cuotasOrdenadas[data.row.index];
        const estado = cuota?.estado;
        // Informe TOTAL se pinta como PAGADA (verde); informe PARCIAL como PARCIAL (naranja).
        if (estado === 'PAGADA' || (estado === 'PAGO_INFORMADO' && cuota && esInformadoTotal(cuota))) {
          data.cell.styles.textColor = [0, 128, 0];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'VENCIDA') {
          data.cell.styles.textColor = [200, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'PARCIAL' || estado === 'PAGO_INFORMADO') {
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

  const cuotasPagadas = cuotasOrdenadas.filter(c => c.estado === 'PAGADA' || esInformadoTotal(c)).length;
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

  // Próximo vence = primera cuota sin pago (excluye PAGADA, PAGO_INFORMADO, REFINANCIADA)
  const proximaVence = cuotasOrdenadas.find(
    c => c.estado !== 'PAGADA' && c.estado !== 'PAGO_INFORMADO' && c.estado !== 'REFINANCIADA'
  );

  doc.setFont('helvetica', 'bold');
  doc.text(`Total cobrado: ${formatCurrency(cobradoAjustado)}`, c1, yT + 17);
  doc.text(`Saldo pendiente: ${formatCurrency(saldoAjustado)}`, c2, yT + 17);
  if (proximaVence?.fechaVencimiento) {
    doc.text(`Próximo vence: ${formatDate(proximaVence.fechaVencimiento)}`, c3, yT + 17);
  }

  addCorporateFooter(doc);
  return doc;
};

// ─────────────────────────────────────────────────────────────────────────────
// FICHA TÉCNICA DEL EQUIPO FABRICADO (uso interno + control de garantía)
// ─────────────────────────────────────────────────────────────────────────────

interface FichaTecnicaPDFInput {
  ficha: FichaTecnicaEquipoDTO;
  cliente?: Pick<Cliente, 'provincia' | 'ciudad'> | null;
  fechaFabricacion?: string | null;  // YYYY-MM-DD o ISO
  fechaEntrega?: string | null;
  /** PNG base64 del QR ya rendereado en pantalla. Opcional. */
  qrDataUrl?: string;
}

/**
 * Genera la ficha técnica A4 del equipo fabricado en el formato corporativo
 * de Ripser (mismo header/footer que presupuestos y facturas). Replica la
 * planilla original que la empresa imprimía a mano:
 *   - Datos cliente / equipo arriba (CODIGO, CLIENTE, EQUIPO, MODELO, etc.)
 *   - Componentes del modelo abajo (motor, gas, sistema, ...)
 *   - Estanterías / dimensiones a la derecha
 *   - QR chico en la esquina sup-derecha del header (escanear → detail interno)
 *
 * El QR se pasa pre-rendereado como dataURL desde el caller para no atar este
 * módulo a `qrcode.react` ni levantar canvas en runtime.
 */
export const generarFichaTecnicaPDF = ({
  ficha,
  cliente,
  fechaFabricacion,
  fechaEntrega,
  qrDataUrl,
}: FichaTecnicaPDFInput): jsPDF => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  // Header corporativo (logo + contactos + título). Devuelve la y donde
  // arrancar el contenido.
  let y = addCorporateHeader(doc, 'ESPECIFICACIONES TECNICAS');

  // Si tenemos QR, va incrustado sobre la barra superior, alineado a la
  // derecha. addCorporateHeader pinta la barra azul de y=10 a y=35; el QR
  // se monta dentro de ese rectángulo, lado 22mm, con un blanco mínimo.
  if (qrDataUrl) {
    const qrSize = 22;
    const qrX = pageWidth - margin - qrSize - 1;
    const qrY = 11;
    doc.setFillColor(...COLORS.white);
    doc.rect(qrX - 0.5, qrY - 0.5, qrSize + 1, qrSize + 1, 'F');
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  }

  const e = ficha.equipo;
  const s = ficha.especificacion;

  const fmtDate = (raw?: string | null): string => {
    if (!raw) return '';
    // Delegar a formatDate que ya maneja la normalización de timezone.
    return formatDate(raw);
  };

  const labelStyle = {
    fontStyle: 'bold' as const,
    fillColor: COLORS.lightBlue,
    textColor: COLORS.black,
  };
  const valueStyle = {
    fillColor: COLORS.white,
    textColor: COLORS.black,
  };

  // ── Tabla 1: identificación del equipo ────────────────────────────────
  // 4 columnas: label-izq | valor-izq | label-der | valor-der.
  // Cada fila es un par (cliente / equipo).
  autoTable(doc, {
    startY: y,
    body: [
      [
        { content: 'N° CODIGO', styles: labelStyle },
        { content: e.numeroHeladera ?? '', styles: { ...valueStyle, fontStyle: 'bold' as const } },
        { content: 'EQUIPO', styles: labelStyle },
        { content: e.tipo ?? '', styles: valueStyle },
      ],
      [
        { content: 'CLIENTE', styles: labelStyle },
        { content: e.clienteNombre ?? '', styles: valueStyle },
        { content: 'MODELO', styles: labelStyle },
        { content: e.modelo ?? '', styles: valueStyle },
      ],
      [
        { content: 'PROVINCIA', styles: labelStyle },
        { content: cliente?.provincia ?? '', styles: valueStyle },
        { content: 'MEDIDA', styles: labelStyle },
        { content: e.medida?.nombre ?? '', styles: valueStyle },
      ],
      [
        { content: 'LOCALIDAD', styles: labelStyle },
        { content: cliente?.ciudad ?? '', styles: valueStyle },
        { content: 'COLOR', styles: labelStyle },
        { content: e.color?.nombre ?? '', styles: valueStyle },
      ],
      [
        { content: 'ENTREGA', styles: labelStyle },
        { content: fmtDate(fechaEntrega), styles: { ...valueStyle, fontStyle: 'bold' as const } },
        { content: 'FECHA', styles: labelStyle },
        { content: fmtDate(fechaFabricacion), styles: valueStyle },
      ],
    ],
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: COLORS.black,
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 60 },
      2: { cellWidth: 32 },
      3: { cellWidth: 'auto' },
    },
    margin: { left: margin + 1, right: margin + 1 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Tabla 2: componentes (col izquierda) + estantería/dimensiones (col derecha)
  // Agrupamos en filas alineadas — algunas celdas de la columna derecha
  // quedan vacías porque la columna izquierda tiene más entradas.
  const compRows: Array<[string, string, string, string]> = [
    ['MOTOR',         s?.motor ?? '',         'ESTANTERIAS',          s?.estanteriasCantidad?.toString() ?? ''],
    ['GAS',           s?.gas ?? '',           'FORMATO ESTANTERIAS',  s?.estanteriasFormato ?? ''],
    ['HUMEDAD',       s?.humedad ?? '',       'ALTO',                 s?.alto != null ? s.alto.toString().replace('.', ',') : ''],
    ['SISTEMA',       s?.sistema ?? '',       'PROFUNDIDAD',          s?.profundidad != null ? s.profundidad.toString().replace('.', ',') : ''],
    ['ESTRUCTURA',    s?.estructura ?? '',    'ANCHO',                s?.ancho != null ? s.ancho.toString().replace('.', ',') : ''],
    ['GABINETE',      s?.gabinete ?? '',      '',                     ''],
    ['ILUMINACION',   s?.iluminacion ?? '',   '',                     ''],
    ['TRANSFORMADOR', s?.transformador ?? '', '',                     ''],
    ['TIPO',          s?.leds ?? '',          '',                     ''],
    ['VIDRIO',        s?.vidrios ?? '',       '',                     ''],
    ['PANELES',       s?.paneles ?? '',       '',                     ''],
    ['PUERTAS',       s?.puertas ?? '',       '',                     ''],
    ['REVESTIMIENTO', s?.revestimiento ?? '', '',                     ''],
  ];

  autoTable(doc, {
    startY: y,
    body: compRows.map((row) => [
      { content: row[0], styles: labelStyle },
      { content: row[1], styles: valueStyle },
      {
        content: row[2],
        styles: row[2] ? labelStyle : { fillColor: COLORS.white, textColor: COLORS.black },
      },
      { content: row[3], styles: valueStyle },
    ]),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 60 },
      2: { cellWidth: 42 },
      3: { cellWidth: 'auto' },
    },
    margin: { left: margin + 1, right: margin + 1 },
  });

  // Footer azul corporativo (mismo que presupuestos/facturas).
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 15;
  doc.setFillColor(...COLORS.darkBlue);
  doc.rect(margin, footerY, pageWidth - (margin * 2), 10, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Ficha técnica generada el ${formatDate(new Date().toISOString())} — Ripser Instalaciones Comerciales`,
    pageWidth / 2,
    footerY + 6,
    { align: 'center' },
  );

  return doc;
};

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICADO DE GARANTÍA (módulo Fabricación / Ficha + QR)
// ─────────────────────────────────────────────────────────────────────────────

interface CertificadoGarantiaInput {
  ficha: FichaTecnicaEquipoDTO;
  /** Capacidad en litros — manual desde la página. Si está vacío se omite la fila. */
  litros?: string | null;
  /** Fecha que dispara el periodo de garantía (ISO). Default: hoy. */
  fecha?: string | null;
}

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatFechaLarga = (raw?: string | null): string => {
  const d = raw ? new Date(raw) : new Date();
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} de ${MESES_ES[d.getMonth()]} de ${d.getFullYear()}`;
};

export const generarCertificadoGarantiaPDF = ({
  ficha,
  litros,
  fecha,
}: CertificadoGarantiaInput): jsPDF => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  let y = addCorporateHeader(doc, 'CERTIFICADO DE GARANTÍA');
  y += 6;

  const e = ficha.equipo;
  const equipoLabel = [e.tipo, e.modelo, e.medida?.nombre]
    .filter((v) => v && String(v).trim() !== '')
    .join(' ')
    .toUpperCase();

  // ── Bloque de identificación (EQUIPO / MODELO / Litros / Fecha) ──
  // Fondo celeste corporativo suave para destacar el bloque y mejorar lectura.
  const idBlockX = margin;
  const idBlockW = pageWidth - margin * 2;
  const idRows: Array<[string, string, boolean]> = [
    ['EQUIPO:', equipoLabel, false],
    ['MODELO:', e.numeroHeladera ?? '', true],
    ...((litros && litros.trim())
      ? [['Litros:', litros.trim(), true] as [string, string, boolean]]
      : []),
    ['Fecha:', formatFechaLarga(fecha), true],
  ];
  const idBlockH = idRows.length * 6 + 6;

  doc.setFillColor(...COLORS.lightBlue);
  doc.setDrawColor(...COLORS.darkBlue);
  doc.setLineWidth(0.3);
  doc.roundedRect(idBlockX, y, idBlockW, idBlockH, 1.5, 1.5, 'FD');

  doc.setTextColor(...COLORS.black);
  const labelX = margin + 6;
  const valueX = margin + 32;
  doc.setFontSize(10);

  let rowY = y + 6;
  idRows.forEach(([label, value, italicLabel]) => {
    doc.setFont('helvetica', italicLabel ? 'bolditalic' : 'bold');
    doc.setTextColor(...COLORS.darkBlue);
    doc.text(label, labelX, rowY);
    doc.setFont('helvetica', italicLabel ? 'italic' : 'normal');
    doc.setTextColor(...COLORS.black);
    doc.text(value, valueX, rowY);
    rowY += 6;
  });

  y += idBlockH + 8;

  // ── Cuerpo del certificado ──
  // Justificado real con jsPDF: todas las líneas salvo la última se renderizan
  // con `align: 'justify' + maxWidth` para distribuir el espacio entre palabras.
  // La última línea se renderiza al ras izquierdo para evitar el típico
  // "stretch feo" de la línea final.
  const textWidth = pageWidth - margin * 2 - 10;
  const bodyX = margin + 5;
  const lineHeight = 5;

  const writeJustified = (text: string, x: number, width: number) => {
    const lines = doc.splitTextToSize(text, width) as string[];
    if (lines.length === 0) return;
    if (lines.length === 1) {
      doc.text(lines[0], x, y);
      y += lineHeight;
      return;
    }
    const allButLast = lines.slice(0, -1);
    const lastLine = lines[lines.length - 1];
    doc.text(allButLast, x, y, { align: 'justify', maxWidth: width });
    y += allButLast.length * lineHeight;
    doc.text(lastLine, x, y);
    y += lineHeight;
  };

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.black);

  writeJustified(
    'RIPSER Instalaciones OTORGA EL PRESENTE CERTIFICADO DE GARANTIA PARA TODO EL GABINETE POR EL LAPSO DE UN AÑO (1 año) CONTRA DEFECTOS DE FABRICACIÓN Y POR UN PERIODO DE SEIS MESES (6 meses) PARA COMPONENTES ELÉCTRICOS:',
    bodyX,
    textWidth,
  );
  y += 3;

  writeJustified(
    'Respaldamos nuestro "CERTIFICADO DE GARANTÍA" a partir de la fecha de facturación o nota de pedido firmada por responsable de la firma. El comprador o el usuario pierden el derecho a esta garantía en los siguientes casos:',
    bodyX,
    textWidth,
  );
  y += 3;

  const condiciones = [
    'Si cualquier reclamo no es comunicado durante el periodo de garantía.',
    'Si inmediatamente que se presente el posible daño o defecto no se solicita la asistencia de nuestros técnicos, pues solo ellos realizarán la inspección de la máquina para verificar la causa del desperfecto.',
    'Si se comprueba la intervención de personas no autorizadas por nuestro Departamento Técnico y Servicio.',
    'Si los equipos, máquinas, herramientas o alguna de sus partes han operado en condiciones diferentes o adversas a las que recomienda el fabricante.',
    'Si los equipos, máquinas o herramientas han sufrido daño ocasionado por falta de mantenimiento adecuado o por haber sido manejado por personal no capacitado.',
  ];
  const listIndent = bodyX + 6;
  const listWidth = textWidth - 6;
  condiciones.forEach((item, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.darkBlue);
    doc.text(`${i + 1}.`, bodyX + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.black);
    const lines = doc.splitTextToSize(item, listWidth) as string[];
    if (lines.length === 1) {
      doc.text(lines[0], listIndent, y);
      y += lineHeight + 1;
    } else {
      const allButLast = lines.slice(0, -1);
      const lastLine = lines[lines.length - 1];
      doc.text(allButLast, listIndent, y, { align: 'justify', maxWidth: listWidth });
      y += allButLast.length * lineHeight;
      doc.text(lastLine, listIndent, y);
      y += lineHeight + 1;
    }
  });
  y += 2;

  writeJustified(
    'Esta garantía queda sin efecto automáticamente en el momento en que los equipos, máquinas o herramientas hayan sufrido: accidentes; mal uso; voltaje inadecuado; manejo inadecuado de las herramientas, partes desgastadas por un uso normal, exceso de peso, caídas, golpes, exposición a lluvia o humedad, utilización de accesorios indebidos para estas herramientas o reparaciones por talleres no autorizados por RIPSER INSTALACIONES COMERCIALES.',
    bodyX,
    textWidth,
  );

  // ── Firma centrada (GERENTE DE PRODUCCIÓN / RIPSER Instalaciones) ──
  const firmaY = Math.max(y + 12, pageHeight - 45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GERENTE DE PRODUCCIÓN', pageWidth / 2, firmaY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('RIPSER Instalaciones.', pageWidth / 2, firmaY + 5, { align: 'center' });

  // ── Garantías + footer azul corporativo ──
  const garantiasY = pageHeight - 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.black);
  doc.text('Garantías: (223) 624 - 9353', margin + 2, garantiasY);

  const footerY = pageHeight - 12;
  doc.setFillColor(...COLORS.darkBlue);
  doc.rect(margin, footerY, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Certificado generado el ${formatDate(new Date().toISOString())} — Ripser Instalaciones Comerciales`,
    pageWidth / 2,
    footerY + 5,
    { align: 'center' },
  );

  return doc;
};

// ─────────────────────────────────────────────────────────────────────────────
// RECIBO DE HABERES (módulo Sueldos / Remuneraciones)
// ─────────────────────────────────────────────────────────────────────────────

interface ReciboHaberesInput {
  sueldo: Sueldo;
  empleado: Empleado;
  categoria?: CategoriaSalarial | null;
}

/**
 * Genera y descarga el Recibo de Haberes A4 de un sueldo, replicando el
 * formato corporativo de Ripser (mismo header/footer azul que presupuestos
 * y facturas) y la estructura visual del recibo manual que la empresa
 * llenaba en Sheets:
 *   - Encabezado azul + título "RECIBO DE HABERES {MES} {AÑO}"
 *   - Datos del empleado (nombre, DNI, categoría, período, concepto, puesto)
 *   - Tabla de conceptos con columnas SUMA / RESTA. Las filas con valor 0
 *     se omiten para que el recibo quede limpio.
 *   - Bloque de totales (subtotal haberes, total descuentos, total a cobrar)
 *   - Bloque de firmas (empleado / responsable)
 *   - Pie azul con leyenda
 */
export const generarReciboHaberesPDF = ({ sueldo, empleado, categoria }: ReciboHaberesInput): void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let y = margin;

  // ===== Header azul (igual que presupuesto) =====
  doc.setFillColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
  doc.rect(margin, y, pageWidth - margin * 2, 25, 'F');

  doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.setFontSize(24);
  doc.setFont('times', 'italic');
  doc.text('Ripser', margin + 5, y + 12);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('INSTALACIONES', margin + 5, y + 16);
  doc.text('COMERCIALES', margin + 5, y + 19);

  const contactX = pageWidth - margin - 5;
  doc.text('@RipserInstalacionesComerciales', contactX, y + 10, { align: 'right' });
  doc.text('www.ripser.com.ar', contactX, y + 14, { align: 'right' });
  doc.text('+54 2235332796', contactX, y + 18, { align: 'right' });

  // Fondo celeste claro para el cuerpo
  doc.setFillColor(COLORS.lightBlue[0], COLORS.lightBlue[1], COLORS.lightBlue[2]);
  doc.rect(margin, y + 25, pageWidth - margin * 2, pageHeight - y - 35, 'F');

  y += 30;

  // ===== Título =====
  const periodoLabel = (() => {
    // sueldo.periodo viene como YYYY-MM
    const [yyyy, mm] = (sueldo.periodo || '').split('-');
    const monthNames = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const m = Number(mm);
    return (m >= 1 && m <= 12 && yyyy) ? `${monthNames[m - 1]} ${yyyy}` : (sueldo.periodo || '');
  })();

  doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.rect(margin + 1, y, pageWidth - margin * 2 - 2, 8, 'F');
  doc.setTextColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`RECIBO DE HABERES ${periodoLabel}`, pageWidth / 2, y + 5.5, { align: 'center' });

  y += 10;

  // ===== Datos del empleado =====
  const nombreCompleto = `${empleado.apellido ?? ''}, ${empleado.nombre ?? ''}`.replace(/^,\s*/, '').trim();
  const puestoNombre = (empleado as any)?.puesto?.nombre ?? '';
  const conceptoLabel = sueldo.concepto ? (CONCEPTO_SUELDO_LABELS[sueldo.concepto] ?? sueldo.concepto) : 'Salario';

  autoTable(doc, {
    startY: y,
    body: [
      [
        { content: 'Empleado:',    styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
        { content: nombreCompleto,  styles: { fillColor: COLORS.white } },
        { content: 'N° Recibo:',   styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
        { content: sueldo.id ? String(sueldo.id) : '-', styles: { fillColor: COLORS.white } },
      ],
      [
        { content: 'DNI:',         styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
        { content: empleado.dni ?? '', styles: { fillColor: COLORS.white } },
        { content: 'Período:',     styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
        { content: periodoLabel,    styles: { fillColor: COLORS.white } },
      ],
      [
        { content: 'Categoría:',   styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
        { content: sueldo.categoriaSalarialNombre ?? categoria?.nombre ?? '-', styles: { fillColor: COLORS.white } },
        { content: 'Concepto:',    styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
        { content: conceptoLabel,   styles: { fillColor: COLORS.white } },
      ],
      [
        { content: 'Puesto:',      styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
        { content: puestoNombre,    styles: { fillColor: COLORS.white } },
        { content: 'Fecha pago:',  styles: { fontStyle: 'bold' as const, fillColor: COLORS.lightBlue } },
        { content: sueldo.fechaPago ? formatDate(sueldo.fechaPago) : 'Pendiente', styles: { fillColor: COLORS.white } },
      ],
    ],
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
      3: { cellWidth: 'auto' },
    },
    margin: { left: margin + 1, right: margin + 1 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // ===== Tabla de conceptos (SUMA / RESTA) =====
  // Solo se incluyen las filas cuyo monto efectivo es distinto de 0 (replica
  // el patrón del recibo manual original).
  const fmtCantidad = (n: number | undefined | null): string => {
    if (n === undefined || n === null || Number(n) === 0) return '-';
    return String(n);
  };

  type Row = { concepto: string; cantidad: string; tarifa: string; suma: number; resta: number };
  const rows: Row[] = [];

  const cat = categoria; // alias

  // SUMAS
  if (Number(sueldo.sueldoBasico) > 0) {
    rows.push({
      concepto: cat?.nombre ? `Sueldo Básico (${cat.nombre})` : 'Sueldo Básico',
      cantidad: '-', tarifa: '-',
      suma: Number(sueldo.sueldoBasico) || 0, resta: 0,
    });
  }
  if (Number(sueldo.presentismoMonto) > 0) {
    const pct = Number(sueldo.presentismoPct) || 0;
    rows.push({
      concepto: `Presentismo (${pct}%)`,
      cantidad: '-', tarifa: '-',
      suma: Number(sueldo.presentismoMonto) || 0, resta: 0,
    });
  }
  const heCant = Number(sueldo.horasExtraCant) || 0;
  const heMonto = Number(sueldo.horasExtras) || 0;
  if (heMonto > 0 || heCant > 0) {
    rows.push({
      concepto: 'Horas Extra',
      cantidad: fmtCantidad(heCant),
      tarifa: cat ? formatCurrency(cat.horaExtraValor) : '-',
      suma: heMonto, resta: 0,
    });
  }
  if (Number(sueldo.bonoProduccion) > 0) {
    rows.push({ concepto: 'Bono Producción', cantidad: '-', tarifa: '-', suma: Number(sueldo.bonoProduccion), resta: 0 });
  }
  if (Number(sueldo.bonoVentas) > 0) {
    rows.push({ concepto: 'Bono Ventas', cantidad: '-', tarifa: '-', suma: Number(sueldo.bonoVentas), resta: 0 });
  }
  if (Number(sueldo.bonoEspecial) > 0) {
    rows.push({ concepto: 'Bono Especial', cantidad: '-', tarifa: '-', suma: Number(sueldo.bonoEspecial), resta: 0 });
  }
  if (Number(sueldo.bonificaciones) > 0) {
    rows.push({ concepto: 'Bonificaciones', cantidad: '-', tarifa: '-', suma: Number(sueldo.bonificaciones), resta: 0 });
  }
  const kmCant = Number(sueldo.kmCant) || 0;
  const kmMonto = Number(sueldo.kmMonto) || 0;
  if (kmMonto > 0 || kmCant > 0) {
    rows.push({
      concepto: `Reintegro KM`,
      cantidad: fmtCantidad(kmCant),
      tarifa: cat ? formatCurrency(cat.kmValor) : '-',
      suma: kmMonto, resta: 0,
    });
  }
  if (Number(sueldo.comisiones) > 0) {
    rows.push({ concepto: 'Comisiones', cantidad: '-', tarifa: '-', suma: Number(sueldo.comisiones), resta: 0 });
  }

  // RESTAS
  const haCant = Number(sueldo.horasAusenteCant) || 0;
  const haMonto = Number(sueldo.horasAusenteMonto) || 0;
  if (haMonto > 0 || haCant > 0) {
    rows.push({
      concepto: 'Horas Ausente',
      cantidad: fmtCantidad(haCant),
      tarifa: cat ? formatCurrency(cat.horaAusenteValor) : '-',
      suma: 0, resta: haMonto,
    });
  }
  if (Number(sueldo.descuentosLegales) > 0) {
    rows.push({ concepto: 'Descuentos Legales', cantidad: '-', tarifa: '-', suma: 0, resta: Number(sueldo.descuentosLegales) });
  }
  if (Number(sueldo.descuentosOtros) > 0) {
    rows.push({ concepto: 'Otros Descuentos', cantidad: '-', tarifa: '-', suma: 0, resta: Number(sueldo.descuentosOtros) });
  }
  if (Number(sueldo.adelantos) > 0) {
    rows.push({ concepto: 'Adelantos del período', cantidad: '-', tarifa: '-', suma: 0, resta: Number(sueldo.adelantos) });
  }

  // Si no hay nada (sueldo en cero raro), igual mostrar al menos el básico
  if (rows.length === 0) {
    rows.push({
      concepto: cat?.nombre ? `Sueldo Básico (${cat.nombre})` : 'Sueldo Básico',
      cantidad: '-', tarifa: '-', suma: Number(sueldo.sueldoBasico) || 0, resta: 0,
    });
  }

  autoTable(doc, {
    startY: y,
    head: [[
      { content: 'Concepto',   styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'Cantidad',   styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'Tarifa',     styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'SUMA',       styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
      { content: 'RESTA',      styles: { halign: 'center', fillColor: COLORS.darkGray, textColor: COLORS.white } },
    ]],
    body: rows.map(r => [
      { content: r.concepto, styles: { halign: 'left' } },
      { content: r.cantidad, styles: { halign: 'center' } },
      { content: r.tarifa,   styles: { halign: 'right' } },
      { content: r.suma > 0  ? formatCurrency(r.suma)  : '', styles: { halign: 'right' } },
      { content: r.resta > 0 ? formatCurrency(r.resta) : '', styles: { halign: 'right' } },
    ]),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      textColor: COLORS.black,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
      fillColor: COLORS.white,
    },
    headStyles: { fontStyle: 'bold' as const, fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 248, 250] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 28 },
    },
    margin: { left: margin + 1, right: margin + 1 },
  });

  y = (doc as any).lastAutoTable.finalY + 2;

  // ===== Bloque de totales =====
  const subtotalHaberes = rows.reduce((s, r) => s + r.suma, 0);
  const totalDescuentosFinal = rows.reduce((s, r) => s + r.resta, 0);
  const totalACobrar = Number(sueldo.sueldoNeto ?? subtotalHaberes - totalDescuentosFinal);

  autoTable(doc, {
    startY: y,
    body: [
      [
        { content: 'SUBTOTAL HABERES', styles: { ...TOTAL_LABEL_STYLE, fontStyle: 'normal' as const } },
        { content: formatCurrency(subtotalHaberes), styles: { ...TOTAL_ROW_STYLE, fontStyle: 'normal' as const } },
      ],
      [
        { content: 'TOTAL DESCUENTOS', styles: { ...TOTAL_LABEL_STYLE, fontStyle: 'normal' as const } },
        { content: `- ${formatCurrency(totalDescuentosFinal)}`, styles: { ...TOTAL_ROW_STYLE, fontStyle: 'normal' as const } },
      ],
      [
        { content: 'TOTAL A COBRAR', styles: { ...TOTAL_LABEL_STYLE, fontSize: 11 } },
        { content: formatCurrency(totalACobrar), styles: { ...TOTAL_ROW_STYLE, fontSize: 11 } },
      ],
    ],
    theme: 'grid',
    styles: { lineColor: COLORS.mediumGray, lineWidth: 0.1 },
    columnStyles: { 0: { cellWidth: 156 }, 1: { cellWidth: 28 } },
    margin: { left: margin + 1, right: margin + 1 },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // ===== Observaciones (opcional) =====
  if (sueldo.observaciones && sueldo.observaciones.trim().length > 0) {
    autoTable(doc, {
      startY: y,
      body: [[
        {
          content: `Observaciones: ${sueldo.observaciones}`,
          styles: {
            halign: 'left' as const,
            fontSize: 8,
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
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  // ===== Bloque de firmas =====
  // Posicionamos a la altura disponible (mínimo 40mm antes del pie).
  const minFirmasY = pageHeight - 45;
  const firmasY = Math.max(y + 12, minFirmasY);
  const colWidth = (pageWidth - margin * 2 - 10) / 2;

  doc.setDrawColor(COLORS.black[0], COLORS.black[1], COLORS.black[2]);
  doc.setLineWidth(0.2);

  // Línea + leyenda empleado
  doc.line(margin + 10, firmasY, margin + 10 + colWidth - 20, firmasY);
  doc.setTextColor(COLORS.black[0], COLORS.black[1], COLORS.black[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma del Empleado', margin + 10 + (colWidth - 20) / 2, firmasY + 4, { align: 'center' });
  doc.text(`Aclaración: ${nombreCompleto}`, margin + 10 + (colWidth - 20) / 2, firmasY + 8, { align: 'center' });

  // Línea + leyenda responsable
  const respX = margin + 10 + colWidth + 10;
  doc.line(respX, firmasY, respX + colWidth - 20, firmasY);
  doc.text('Firma del Responsable', respX + (colWidth - 20) / 2, firmasY + 4, { align: 'center' });
  doc.text('Ripser Instalaciones Comerciales', respX + (colWidth - 20) / 2, firmasY + 8, { align: 'center' });

  // ===== Pie azul =====
  const footerY = pageHeight - 15;
  doc.setFillColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
  doc.rect(margin, footerY, pageWidth - margin * 2, 10, 'F');

  doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const notaText = 'Recibo conforme. Importes en pesos argentinos. Ripser Instalaciones Comerciales.';
  doc.text(notaText, pageWidth / 2, footerY + 6, { align: 'center' });

  // ===== Descarga =====
  const apellido = (empleado.apellido ?? 'Empleado').replace(/\s+/g, '_');
  const archivo = `Recibo_${apellido}_${sueldo.periodo || 'sin-periodo'}.pdf`;
  doc.save(archivo);
};
