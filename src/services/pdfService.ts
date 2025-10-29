import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DocumentoComercial, OpcionFinanciamientoDTO, Cliente } from '../types';

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
  darkBlue: [20, 66, 114],      // #144272 - Barra superior
  lightBlue: [205, 226, 239],   // #CDE2EF - Fondo celdas
  white: [255, 255, 255],       // #FFFFFF
  black: [0, 0, 0],             // #000000
  darkGray: [64, 64, 64],       // #404040 - Texto encabezado tabla
  mediumGray: [128, 128, 128],  // #808080 - Bordes
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

/**
 * Calcula la entrega inicial (40% del total)
 */
const calcularEntregaInicial = (total: number): number => {
  return Math.round(total * 0.4);
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
      { content: 'Cliente:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: presupuesto.clienteNombre || cliente.nombre || '', styles: { fillColor: COLORS.white } },
      { content: 'N°Presupuesto:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: presupuesto.numeroDocumento || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Fecha:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: formatDate(presupuesto.fechaEmision), styles: { fillColor: COLORS.white }, colSpan: 3 }
    ],
    [
      { content: 'DNI:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: cliente.cuit || '', styles: { fillColor: COLORS.white }, colSpan: 3 }
    ],
    [
      { content: 'Telefono:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: cliente.telefono || '', styles: { fillColor: COLORS.white } },
      { content: 'Dirección:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: cliente.direccion || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Email:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: cliente.email || '', styles: { fillColor: COLORS.white } },
      { content: 'Cod postal:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: cliente.codigoPostal || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Provincia:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: cliente.provincia || '', styles: { fillColor: COLORS.white } },
      { content: '', styles: { fillColor: COLORS.lightBlue } },
      { content: '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Localidad:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
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
      { content: descripcionCompleta, styles: { halign: 'left', fontStyle: 'bold' } },
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
      fontStyle: 'bold',
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

  // ===== TOTAL CONTADO EFECTIVO =====
  autoTable(doc, {
    startY: yPosition,
    body: [[
      {
        content: 'TOTAL CONTADO EFECTIVO',
        styles: {
          halign: 'center',
          fontStyle: 'bold',
          fontSize: 10,
          fillColor: COLORS.white,
          textColor: COLORS.black
        }
      },
      {
        content: formatCurrency(presupuesto.subtotal),
        styles: {
          halign: 'right',
          fontStyle: 'bold',
          fontSize: 10,
          fillColor: COLORS.white,
          textColor: COLORS.black
        }
      }
    ]],
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

  // ===== FORMAS DE FINANCIACIÓN =====
  if (opcionesFinanciamiento && opcionesFinanciamiento.length > 0) {
    // Título de la sección
    autoTable(doc, {
      startY: yPosition,
      body: [[
        {
          content: 'FORMAS DE FINANCIACION',
          styles: {
            halign: 'center',
            fontStyle: 'bold',
            fontSize: 10,
            fillColor: COLORS.darkBlue,
            textColor: COLORS.white
          }
        }
      ]],
      theme: 'grid',
      styles: {
        lineColor: COLORS.mediumGray,
        lineWidth: 0.1,
      },
      margin: { left: margin + 1, right: margin + 1 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 1;

    // Calcular entrega inicial (40%)
    const entregaInicial = calcularEntregaInicial(presupuesto.subtotal);

    // Texto de entrega inicial
    autoTable(doc, {
      startY: yPosition,
      body: [[
        {
          content: 'Se realiza una entrega en efectivo cuando se recibe el producto de:',
          styles: {
            halign: 'left',
            fontSize: 8,
            fillColor: COLORS.white,
            cellPadding: 2
          }
        },
        {
          content: formatCurrency(entregaInicial),
          styles: {
            halign: 'right',
            fontStyle: 'bold',
            fontSize: 8,
            fillColor: COLORS.white,
            cellPadding: 2
          }
        }
      ]],
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

    yPosition = (doc as any).lastAutoTable.finalY + 1;

    // Encabezado de opciones
    autoTable(doc, {
      startY: yPosition,
      body: [[
        {
          content: 'OPCION',
          styles: {
            halign: 'center',
            fontStyle: 'bold',
            fontSize: 8,
            fillColor: COLORS.lightBlue
          }
        },
        {
          content: 'El saldo restante puede financiarlo con:',
          styles: {
            halign: 'center',
            fontStyle: 'bold',
            fontSize: 8,
            fillColor: COLORS.lightBlue
          }
        },
        {
          content: 'Total:',
          styles: {
            halign: 'center',
            fontStyle: 'bold',
            fontSize: 8,
            fillColor: COLORS.lightBlue
          }
        }
      ]],
      theme: 'grid',
      styles: {
        lineColor: COLORS.mediumGray,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 141 },
        2: { cellWidth: 28 }
      },
      margin: { left: margin + 1, right: margin + 1 },
    });

    yPosition = (doc as any).lastAutoTable.finalY;

    // Ordenar opciones por ordenPresentacion
    const opcionesOrdenadas = [...opcionesFinanciamiento].sort((a, b) =>
      (a.ordenPresentacion || 999) - (b.ordenPresentacion || 999)
    );

    // Agrupar por tipo: primero cheques, luego créditos personales
    const opcionesCheques: any[] = [];
    const opcionesCreditos: any[] = [];

    opcionesOrdenadas.forEach((opcion, index) => {
      const nombreLower = opcion.nombre.toLowerCase();
      let descripcionOpcion = '';

      if (nombreLower.indexOf('cheque') !== -1) {
        descripcionOpcion = `${opcion.cantidadCuotas} Cheques a 30/60/90 dias`;
        opcionesCheques.push([
          { content: (index + 1).toString(), styles: { halign: 'center', fontSize: 8 } },
          { content: descripcionOpcion, styles: { halign: 'left', fontSize: 8 } },
          { content: formatCurrency(opcion.montoCuota), styles: { halign: 'right', fontSize: 8 } }
        ]);
      } else if (opcion.cantidadCuotas > 0) {
        const tipoCuota = nombreLower.indexOf('semanal') !== -1 ? 'cuotas semanales' :
                         nombreLower.indexOf('mensual') !== -1 ? 'cuotas mensual' : 'cuotas';
        descripcionOpcion = `${opcion.cantidadCuotas} ${tipoCuota} de`;
        opcionesCreditos.push([
          { content: (index + 1).toString(), styles: { halign: 'center', fontSize: 8 } },
          { content: descripcionOpcion, styles: { halign: 'left', fontSize: 8 } },
          { content: formatCurrency(opcion.montoCuota), styles: { halign: 'right', fontSize: 8 } }
        ]);
      }
    });

    // Agregar opciones de cheques
    if (opcionesCheques.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        body: opcionesCheques,
        theme: 'grid',
        styles: {
          lineColor: COLORS.mediumGray,
          lineWidth: 0.1,
          fillColor: COLORS.white,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 141 },
          2: { cellWidth: 28 }
        },
        margin: { left: margin + 1, right: margin + 1 },
      });

      yPosition = (doc as any).lastAutoTable.finalY;
    }

    // Separador "B - Creditos Personales"
    if (opcionesCreditos.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        body: [[
          {
            content: '',
            styles: { fillColor: COLORS.white, cellPadding: 1 }
          },
          {
            content: 'B - Creditos Personales',
            styles: {
              halign: 'center',
              fontStyle: 'bold',
              fontSize: 8,
              fillColor: COLORS.white,
              cellPadding: 1
            }
          },
          {
            content: '',
            styles: { fillColor: COLORS.white, cellPadding: 1 }
          }
        ]],
        theme: 'grid',
        styles: {
          lineColor: COLORS.mediumGray,
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 141 },
          2: { cellWidth: 28 }
        },
        margin: { left: margin + 1, right: margin + 1 },
      });

      yPosition = (doc as any).lastAutoTable.finalY;

      // Agregar opciones de créditos
      autoTable(doc, {
        startY: yPosition,
        body: opcionesCreditos,
        theme: 'grid',
        styles: {
          lineColor: COLORS.mediumGray,
          lineWidth: 0.1,
          fillColor: COLORS.white,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 141 },
          2: { cellWidth: 28 }
        },
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
      { content: 'Cliente:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: documento.clienteNombre || cliente.nombre || '', styles: { fillColor: COLORS.white } },
      { content: `N°${tipoDocumento === 'FACTURA' ? 'Factura' : tipoDocumento === 'NOTA DE PEDIDO' ? 'Pedido' : 'Documento'}:`, styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: documento.numeroDocumento || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Fecha:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: formatDate(documento.fechaEmision), styles: { fillColor: COLORS.white }, colSpan: 3 }
    ],
    [
      { content: 'DNI:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: cliente.cuit || '', styles: { fillColor: COLORS.white }, colSpan: 3 }
    ],
    [
      { content: 'Telefono:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: cliente.telefono || '', styles: { fillColor: COLORS.white } },
      { content: 'Dirección:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: cliente.direccion || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Email:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: cliente.email || '', styles: { fillColor: COLORS.white } },
      { content: 'Cod postal:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: cliente.codigoPostal || '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Provincia:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
      { content: cliente.provincia || '', styles: { fillColor: COLORS.white } },
      { content: '', styles: { fillColor: COLORS.lightBlue } },
      { content: '', styles: { fillColor: COLORS.white } }
    ],
    [
      { content: 'Localidad:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
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
      { content: descripcionCompleta, styles: { halign: 'left', fontStyle: 'bold' } },
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
      fontStyle: 'bold',
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

  // ===== TOTAL =====
  autoTable(doc, {
    startY: yPosition,
    body: [[
      {
        content: 'TOTAL CONTADO EFECTIVO',
        styles: {
          halign: 'center',
          fontStyle: 'bold',
          fontSize: 10,
          fillColor: COLORS.white,
          textColor: COLORS.black
        }
      },
      {
        content: formatCurrency(documento.subtotal),
        styles: {
          halign: 'right',
          fontStyle: 'bold',
          fontSize: 10,
          fillColor: COLORS.white,
          textColor: COLORS.black
        }
      }
    ]],
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

  // ===== OPCIÓN DE FINANCIAMIENTO SELECCIONADA =====
  if (opcionSeleccionada) {
    // Título de la sección
    autoTable(doc, {
      startY: yPosition,
      body: [[
        {
          content: 'FINANCIAMIENTO SELECCIONADO',
          styles: {
            halign: 'center',
            fontStyle: 'bold',
            fontSize: 10,
            fillColor: COLORS.darkBlue,
            textColor: COLORS.white
          }
        }
      ]],
      theme: 'grid',
      styles: {
        lineColor: COLORS.mediumGray,
        lineWidth: 0.1,
      },
      margin: { left: margin + 1, right: margin + 1 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 1;

    // Calcular entrega inicial (40%)
    const entregaInicial = calcularEntregaInicial(documento.subtotal);

    // Texto de entrega inicial
    autoTable(doc, {
      startY: yPosition,
      body: [[
        {
          content: 'Se realiza una entrega en efectivo cuando se recibe el producto de:',
          styles: {
            halign: 'left',
            fontSize: 8,
            fillColor: COLORS.white,
            cellPadding: 2
          }
        },
        {
          content: formatCurrency(entregaInicial),
          styles: {
            halign: 'right',
            fontStyle: 'bold',
            fontSize: 8,
            fillColor: COLORS.white,
            cellPadding: 2
          }
        }
      ]],
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

    yPosition = (doc as any).lastAutoTable.finalY + 1;

    // Detalle de la opción seleccionada
    const nombreLower = opcionSeleccionada.nombre.toLowerCase();
    let descripcionOpcion = '';

    if (nombreLower.indexOf('cheque') !== -1) {
      descripcionOpcion = `${opcionSeleccionada.cantidadCuotas} Cheques a 30/60/90 dias`;
    } else if (opcionSeleccionada.cantidadCuotas > 0) {
      const tipoCuota = nombreLower.indexOf('semanal') !== -1 ? 'cuotas semanales' :
                       nombreLower.indexOf('mensual') !== -1 ? 'cuotas mensuales' : 'cuotas';
      descripcionOpcion = `${opcionSeleccionada.cantidadCuotas} ${tipoCuota} de`;
    } else {
      descripcionOpcion = opcionSeleccionada.nombre;
    }

    autoTable(doc, {
      startY: yPosition,
      body: [[
        {
          content: 'El saldo restante se financiará con:',
          styles: {
            halign: 'left',
            fontStyle: 'bold',
            fontSize: 8,
            fillColor: COLORS.lightBlue,
            cellPadding: 2
          }
        },
        {
          content: '',
          styles: {
            fillColor: COLORS.lightBlue,
            cellPadding: 2
          }
        }
      ]],
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

    yPosition = (doc as any).lastAutoTable.finalY;

    autoTable(doc, {
      startY: yPosition,
      body: [[
        {
          content: descripcionOpcion,
          styles: {
            halign: 'left',
            fontSize: 8,
            fillColor: COLORS.white,
            cellPadding: 2
          }
        },
        {
          content: formatCurrency(opcionSeleccionada.montoCuota),
          styles: {
            halign: 'right',
            fontStyle: 'bold',
            fontSize: 8,
            fillColor: COLORS.white,
            cellPadding: 2
          }
        }
      ]],
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

    yPosition = (doc as any).lastAutoTable.finalY + 1;

    // Total con financiamiento
    autoTable(doc, {
      startY: yPosition,
      body: [[
        {
          content: 'TOTAL CON FINANCIAMIENTO:',
          styles: {
            halign: 'center',
            fontStyle: 'bold',
            fontSize: 9,
            fillColor: COLORS.white,
            textColor: COLORS.black
          }
        },
        {
          content: formatCurrency(opcionSeleccionada.montoTotal),
          styles: {
            halign: 'right',
            fontStyle: 'bold',
            fontSize: 9,
            fillColor: COLORS.white,
            textColor: COLORS.black
          }
        }
      ]],
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
