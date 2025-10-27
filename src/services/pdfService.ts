import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DocumentoComercial, OpcionFinanciamientoDTO, Cliente } from '../types';

/**
 * Servicio para generar PDFs de presupuestos
 */

interface PresupuestoPDFData {
  presupuesto: DocumentoComercial;
  cliente: Cliente;
  opcionesFinanciamiento: OpcionFinanciamientoDTO[];
}

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
 * Genera y descarga un PDF del presupuesto
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
  const margin = 15;
  let yPosition = margin;

  // --- ENCABEZADO ---
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('P. Mauro Villanueva', margin, yPosition);

  doc.setFontSize(14);
  doc.text(`PRESUPUESTO ${getCurrentMonthYear()}`, pageWidth - margin, yPosition, { align: 'right' });

  yPosition += 10;

  // Línea separadora
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 8;

  // --- DATOS DEL CLIENTE ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const leftColumn = margin;
  const rightColumn = pageWidth / 2 + 5;

  // Columna izquierda
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', leftColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(presupuesto.clienteNombre || cliente.nombre || 'N/A', leftColumn + 20, yPosition);

  yPosition += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('N°Presupuesto:', leftColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(presupuesto.numeroDocumento || 'N/A', leftColumn + 30, yPosition);

  // Columna derecha
  yPosition -= 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', rightColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(presupuesto.fechaEmision), rightColumn + 15, yPosition);

  yPosition += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('DNI:', rightColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.cuit || 'N/A', rightColumn + 15, yPosition);

  yPosition += 6;

  // Más datos del cliente
  doc.setFont('helvetica', 'bold');
  doc.text('Teléfono:', leftColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.telefono || 'N/A', leftColumn + 20, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Email:', rightColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.email || 'N/A', rightColumn + 15, yPosition);

  yPosition += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Dirección:', leftColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.direccion || 'N/A', leftColumn + 20, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Cod postal:', rightColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.codigoPostal || 'N/A', rightColumn + 22, yPosition);

  yPosition += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Provincia:', leftColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.provincia || 'N/A', leftColumn + 20, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text('Localidad:', rightColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.ciudad || 'N/A', rightColumn + 22, yPosition);

  yPosition += 10;

  // --- TABLA DE PRODUCTOS ---
  const tableData: string[][] = presupuesto.detalles.map(detalle => [
    detalle.productoId?.toString() || detalle.recetaId?.toString() || '-',
    detalle.descripcion || '',
    detalle.cantidad.toString(),
    formatCurrency(detalle.precioUnitario),
    '$0', // IVA por línea (según el ejemplo siempre es $0)
    formatCurrency(detalle.subtotal)
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Código', 'Descripción', 'Cantidad', 'Precio Unitario', 'IVA', 'Precio Total']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },  // Código
      1: { halign: 'left', cellWidth: 70 },    // Descripción
      2: { halign: 'center', cellWidth: 20 },  // Cantidad
      3: { halign: 'right', cellWidth: 30 },   // Precio Unitario
      4: { halign: 'right', cellWidth: 20 },   // IVA
      5: { halign: 'right', cellWidth: 30 },   // Precio Total
    },
    margin: { left: margin, right: margin },
  });

  // Obtener la posición Y después de la tabla
  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // --- TOTAL CONTADO EFECTIVO ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const totalText = `TOTAL CONTADO EFECTIVO: ${formatCurrency(presupuesto.subtotal)}`;
  doc.text(totalText, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;

  // --- FORMAS DE FINANCIACIÓN ---
  if (opcionesFinanciamiento && opcionesFinanciamiento.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FORMAS DE FINANCIACIÓN', margin, yPosition);

    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Ordenar opciones por ordenPresentacion si existe
    const opcionesOrdenadas = [...opcionesFinanciamiento].sort((a, b) =>
      (a.ordenPresentacion || 999) - (b.ordenPresentacion || 999)
    );

    opcionesOrdenadas.forEach(opcion => {
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      let descripcionOpcion = '';

      // Formatear la descripción según el tipo de financiación
      if (opcion.nombre.toLowerCase().indexOf('entrega') !== -1) {
        descripcionOpcion = `- ${opcion.nombre}: ${formatCurrency(opcion.montoTotal)}`;
      } else if (opcion.cantidadCuotas > 0) {
        const tipoCuota = opcion.nombre.toLowerCase().indexOf('semanal') !== -1 ? 'semanales' :
                         opcion.nombre.toLowerCase().indexOf('mensual') !== -1 ? 'mensuales' : 'cuotas';
        descripcionOpcion = `- ${opcion.cantidadCuotas} cuotas ${tipoCuota} de ${formatCurrency(opcion.montoCuota)}`;
      } else {
        descripcionOpcion = `- ${opcion.nombre}: ${formatCurrency(opcion.montoTotal)}`;
      }

      doc.text(descripcionOpcion, margin + 3, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
  }

  // --- NOTA FINAL ---
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const nota = 'Nota: Presupuesto sujeto a modificación. El precio se congela una vez confirmada la compra. No pedimos señas ni anticipos.';

  // Dividir el texto en líneas para que no se salga del margen
  const notaLines = doc.splitTextToSize(nota, pageWidth - (margin * 2));
  doc.text(notaLines, margin, yPosition);

  // --- PIE DE PÁGINA ---
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado el ${formatDate(new Date().toISOString())}`, pageWidth / 2, footerY, { align: 'center' });

  // --- DESCARGAR PDF ---
  const nombreCliente = presupuesto.clienteNombre?.replace(/\s+/g, '_') || 'Cliente';
  const fecha = formatDate(presupuesto.fechaEmision).replace(/\//g, '-');
  const nombreArchivo = `Presupuesto_${nombreCliente}_${fecha}.pdf`;

  doc.save(nombreArchivo);
};
