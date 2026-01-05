import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

// Colores del diseño Ripser (matching presupuesto style)
const COLORS = {
  darkBlue: [20, 66, 114],      // #144272 - Barra superior
  lightBlue: [205, 226, 239],   // #CDE2EF - Fondo documento
  white: [255, 255, 255],       // #FFFFFF
  black: [0, 0, 0],             // #000000
  darkGray: [64, 64, 64],       // #404040 - Texto encabezado tabla
  mediumGray: [128, 128, 128],  // #808080 - Bordes
};

/**
 * Interfaz para configurar la exportación a PDF
 */
export interface PDFExportConfig {
  fileName: string;
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  metadata?: {
    generatedBy?: string;
    generatedAt?: string;
    filters?: Record<string, any>;
  };
  tables: Array<{
    headers: string[];
    rows: any[][];
    title?: string;
    showFooter?: boolean;
    footerText?: string;
  }>;
}

/**
 * Exporta datos a un archivo PDF con el estilo de marca Ripser
 * @param config Configuración de la exportación
 */
export const exportToPDF = (config: PDFExportConfig): void => {
  try {
    const doc = new jsPDF({
      orientation: config.orientation || 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let currentY = margin;

    // ===== BARRA SUPERIOR AZUL CON LOGO =====
    doc.setFillColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 25, 'F');

    // Logo texto "Ripser" en cursiva
    doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
    doc.setFontSize(24);
    doc.setFont('times', 'italic');
    doc.text('Ripser', margin + 5, currentY + 12);

    // "INSTALACIONES COMERCIALES" debajo del logo
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('INSTALACIONES', margin + 5, currentY + 16);
    doc.text('COMERCIALES', margin + 5, currentY + 19);

    // Información de contacto (derecha)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const contactX = pageWidth - margin - 5;
    doc.text('@RipserInstalacionesComerciales', contactX, currentY + 10, { align: 'right' });
    doc.text('www.ripser.com.ar', contactX, currentY + 14, { align: 'right' });
    doc.text('+54 2235332796', contactX, currentY + 18, { align: 'right' });

    // Fondo gris claro para el resto del documento
    doc.setFillColor(COLORS.lightBlue[0], COLORS.lightBlue[1], COLORS.lightBlue[2]);
    doc.rect(margin, currentY + 25, pageWidth - (margin * 2), pageHeight - currentY - 35, 'F');

    currentY += 30;

    // ===== TÍTULO PRINCIPAL =====
    doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
    doc.rect(margin + 1, currentY, pageWidth - (margin * 2) - 2, 8, 'F');

    doc.setTextColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(config.title, pageWidth / 2, currentY + 5.5, { align: 'center' });

    currentY += 10;

    // Subtítulo si existe
    if (config.subtitle) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
      doc.text(config.subtitle, pageWidth / 2, currentY, { align: 'center' });
      currentY += 6;
    }

    // ===== METADATA =====
    if (config.metadata) {
      const metadataRows: any[] = [];

      if (config.metadata.generatedBy) {
        metadataRows.push([
          { content: 'Generado por:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
          { content: config.metadata.generatedBy, styles: { fillColor: COLORS.white } }
        ]);
      }

      const generatedAt = config.metadata.generatedAt || dayjs().format('DD/MM/YYYY HH:mm:ss');
      metadataRows.push([
        { content: 'Fecha de generación:', styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
        { content: generatedAt, styles: { fillColor: COLORS.white } }
      ]);

      // Filtros aplicados
      if (config.metadata.filters && Object.keys(config.metadata.filters).length > 0) {
        Object.entries(config.metadata.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            metadataRows.push([
              { content: `${key}:`, styles: { fontStyle: 'bold', fillColor: COLORS.lightBlue } },
              { content: String(value), styles: { fillColor: COLORS.white } }
            ]);
          }
        });
      }

      if (metadataRows.length > 0) {
        autoTable(doc, {
          startY: currentY,
          body: metadataRows,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
            textColor: COLORS.black,
            lineColor: COLORS.mediumGray,
            lineWidth: 0.1,
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 'auto' }
          },
          margin: { left: margin + 1, right: margin + 1 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 5;
      }
    }

    // ===== AGREGAR CADA TABLA =====
    config.tables.forEach((tableConfig, index) => {
      // Verificar si necesitamos una nueva página
      if (currentY > doc.internal.pageSize.height - 40) {
        doc.addPage();
        currentY = margin + 35;

        // Recrear fondo en nueva página
        doc.setFillColor(COLORS.lightBlue[0], COLORS.lightBlue[1], COLORS.lightBlue[2]);
        doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2), 'F');
      }

      // Título de la tabla si existe
      if (tableConfig.title) {
        doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
        doc.rect(margin + 1, currentY, pageWidth - (margin * 2) - 2, 6, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
        doc.text(tableConfig.title, pageWidth / 2, currentY + 4, { align: 'center' });
        currentY += 8;
      }

      // Generar tabla
      autoTable(doc, {
        head: [tableConfig.headers],
        body: tableConfig.rows,
        startY: currentY,
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
          fillColor: COLORS.darkGray,
          textColor: COLORS.white,
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 248, 250],
        },
        margin: { left: margin + 1, right: margin + 1 },
        didDrawPage: (data) => {
          // Pie de página
          const pageCount = (doc as any).internal.getNumberOfPages();
          const pageHeight = doc.internal.pageSize.height;

          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            doc.internal.pageSize.width / 2,
            pageHeight - 5,
            { align: 'center' }
          );
        },
      });

      // Actualizar posición Y después de la tabla
      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Footer de la tabla si existe
      if (tableConfig.showFooter && tableConfig.footerText) {
        doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
        doc.rect(margin + 1, currentY - 5, pageWidth - (margin * 2) - 2, 5, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
        doc.text(tableConfig.footerText, margin + 3, currentY - 2);
        currentY += 3;
      }
    });

    // ===== PIE DE PÁGINA AZUL =====
    const footerY = pageHeight - 15;
    doc.setFillColor(COLORS.darkBlue[0], COLORS.darkBlue[1], COLORS.darkBlue[2]);
    doc.rect(margin, footerY, pageWidth - (margin * 2), 10, 'F');

    doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Documento generado automáticamente por el sistema Ripser',
      pageWidth / 2,
      footerY + 6,
      { align: 'center' }
    );

    // Guardar archivo
    const fileName = config.fileName.endsWith('.pdf')
      ? config.fileName
      : `${config.fileName}.pdf`;

    doc.save(fileName);
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    throw new Error('No se pudo generar el archivo PDF');
  }
};

/**
 * Exporta una tabla simple a PDF
 * @param data Array de objetos con los datos
 * @param columns Array de configuración de columnas
 * @param fileName Nombre del archivo (sin extensión)
 * @param title Título del documento
 */
export const exportSimpleTableToPDF = (
  data: any[],
  columns: Array<{ key: string; header: string }>,
  fileName: string,
  title: string
): void => {
  const headers = columns.map((col) => col.header);
  const rows = data.map((row) => columns.map((col) => row[col.key] ?? ''));

  exportToPDF({
    fileName,
    title,
    tables: [
      {
        headers,
        rows,
      },
    ],
  });
};

/**
 * Formatea un valor para exportación a PDF
 * @param value Valor a formatear
 * @param type Tipo de dato
 */
export const formatPDFValue = (
  value: any,
  type?: 'date' | 'datetime' | 'number' | 'currency' | 'percentage' | 'boolean'
): string => {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'date':
      return dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY') : String(value);
    case 'datetime':
      return dayjs(value).isValid()
        ? dayjs(value).format('DD/MM/YYYY HH:mm:ss')
        : String(value);
    case 'number':
      return typeof value === 'number'
        ? value.toLocaleString('es-AR')
        : String(value);
    case 'currency':
      return typeof value === 'number'
        ? `$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : String(value);
    case 'percentage':
      return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : String(value);
    case 'boolean':
      return value ? 'Sí' : 'No';
    default:
      return String(value);
  }
};

/**
 * Convierte datos de tabla a formato exportable para PDF
 */
export const prepareTableDataForPDF = <T extends Record<string, any>>(
  data: T[],
  columnConfig: Array<{
    key: keyof T;
    header: string;
    format?: 'date' | 'datetime' | 'number' | 'currency' | 'percentage' | 'boolean';
    transform?: (value: any, row: T) => any;
  }>
): { headers: string[]; rows: string[][] } => {
  const headers = columnConfig.map((col) => col.header);

  const rows = data.map((row) =>
    columnConfig.map((config) => {
      const value = row[config.key];
      const transformedValue = config.transform ? config.transform(value, row) : value;
      return formatPDFValue(transformedValue, config.format);
    })
  );

  return { headers, rows };
};

/**
 * Crea un PDF con estadísticas resumidas
 */
export const exportStatisticsPDF = (config: {
  fileName: string;
  title: string;
  statistics: Array<{ label: string; value: string | number }>;
  additionalTables?: PDFExportConfig['tables'];
}): void => {
  const statsRows = config.statistics.map((stat) => [stat.label, String(stat.value)]);

  const tables: PDFExportConfig['tables'] = [
    {
      headers: ['Métrica', 'Valor'],
      rows: statsRows,
      title: 'Resumen Estadístico',
    },
  ];

  if (config.additionalTables) {
    tables.push(...config.additionalTables);
  }

  exportToPDF({
    fileName: config.fileName,
    title: config.title,
    tables,
  });
};
