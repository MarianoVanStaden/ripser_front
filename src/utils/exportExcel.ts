import dayjs from 'dayjs';

// ExcelJS is ~900kB (gzip). Only pay for it when the user actually exports.
const loadExcelJS = () => import('exceljs').then((m) => m.default ?? m);

/**
 * Interfaz para configurar la exportación a Excel
 */
export interface ExcelExportConfig {
  fileName: string;
  sheets: Array<{
    name: string;
    data: any[];
    columns?: string[];
  }>;
  metadata?: {
    title?: string;
    generatedBy?: string;
    generatedAt?: string;
    filters?: Record<string, any>;
  };
}

const downloadBuffer = (buffer: ArrayBuffer, fileName: string): void => {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Exporta datos a un archivo Excel (.xlsx)
 * @param config Configuración de la exportación
 */
export const exportToExcel = async (config: ExcelExportConfig): Promise<void> => {
  try {
    const ExcelJS = await loadExcelJS();
    const workbook = new ExcelJS.Workbook();

    // Agregar metadata como primera hoja si existe
    if (config.metadata) {
      const metadataRows: any[][] = [
        ['Reporte generado'],
        [],
        ...(config.metadata.title ? [['Título', config.metadata.title]] : []),
        ...(config.metadata.generatedBy ? [['Generado por', config.metadata.generatedBy]] : []),
        [
          'Fecha de generación',
          config.metadata.generatedAt || dayjs().format('DD/MM/YYYY HH:mm:ss'),
        ],
        [],
      ];

      if (config.metadata.filters) {
        metadataRows.push(['Filtros aplicados'], []);
        Object.entries(config.metadata.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            metadataRows.push([key, String(value)]);
          }
        });
      }

      const metadataSheet = workbook.addWorksheet('Información');
      metadataRows.forEach(row => metadataSheet.addRow(row));
    }

    // Agregar cada hoja de datos
    config.sheets.forEach((sheetConfig) => {
      const worksheet = workbook.addWorksheet(sheetConfig.name);
      const headers = sheetConfig.columns ||
        (sheetConfig.data.length > 0 ? Object.keys(sheetConfig.data[0]) : []);

      // Fila de encabezados
      worksheet.addRow(headers);

      // Filas de datos en el orden de los headers
      sheetConfig.data.forEach((row) => {
        worksheet.addRow(headers.map(h => row[h] ?? ''));
      });

      // Calcular y aplicar ancho de columnas
      const maxWidths: number[] = headers.map(h => h.length);
      sheetConfig.data.forEach((row) => {
        headers.forEach((h, idx) => {
          const cellLength = String(row[h] ?? '').length;
          maxWidths[idx] = Math.max(maxWidths[idx], cellLength);
        });
      });
      headers.forEach((_, idx) => {
        worksheet.getColumn(idx + 1).width = Math.min(maxWidths[idx] + 2, 50);
      });
    });

    const fileName = config.fileName.endsWith('.xlsx')
      ? config.fileName
      : `${config.fileName}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    downloadBuffer(buffer, fileName);
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    throw new Error('No se pudo generar el archivo Excel');
  }
};

/**
 * Exporta una tabla simple a Excel
 * @param data Array de objetos con los datos
 * @param fileName Nombre del archivo (sin extensión)
 * @param sheetName Nombre de la hoja
 */
export const exportSimpleTable = async (
  data: any[],
  fileName: string,
  sheetName: string = 'Datos'
): Promise<void> => {
  return exportToExcel({
    fileName,
    sheets: [{ name: sheetName, data }],
  });
};

/**
 * Formatea un valor para exportación a Excel
 * @param value Valor a formatear
 * @param type Tipo de dato
 */
export const formatExcelValue = (
  value: any,
  type?: 'date' | 'datetime' | 'number' | 'currency' | 'percentage'
): any => {
  if (value === null || value === undefined) return '';

  switch (type) {
    case 'date':
      return dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY') : value;
    case 'datetime':
      return dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY HH:mm:ss') : value;
    case 'number':
      return typeof value === 'number' ? value : parseFloat(value) || 0;
    case 'currency':
      return typeof value === 'number'
        ? value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : value;
    case 'percentage':
      return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : value;
    default:
      return value;
  }
};

/**
 * Convierte datos de tabla a formato exportable con formato personalizado
 */
export const prepareTableDataForExport = <T extends Record<string, any>>(
  data: T[],
  columnConfig: Array<{
    key: keyof T;
    header: string;
    format?: 'date' | 'datetime' | 'number' | 'currency' | 'percentage';
    transform?: (value: any, row: T) => any;
  }>
): any[] => {
  return data.map((row) => {
    const exportRow: Record<string, any> = {};

    columnConfig.forEach((config) => {
      const value = row[config.key];
      const transformedValue = config.transform ? config.transform(value, row) : value;
      exportRow[config.header] = formatExcelValue(transformedValue, config.format);
    });

    return exportRow;
  });
};
