import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

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

/**
 * Exporta datos a un archivo Excel (.xlsx)
 * @param config Configuración de la exportación
 */
export const exportToExcel = (config: ExcelExportConfig): void => {
  try {
    const workbook = XLSX.utils.book_new();

    // Agregar metadata como primera hoja si existe
    if (config.metadata) {
      const metadataRows = [
        ['Reporte generado'],
        [''],
        ...(config.metadata.title ? [['Título', config.metadata.title]] : []),
        ...(config.metadata.generatedBy ? [['Generado por', config.metadata.generatedBy]] : []),
        [
          'Fecha de generación',
          config.metadata.generatedAt || dayjs().format('DD/MM/YYYY HH:mm:ss'),
        ],
        [''],
      ];

      if (config.metadata.filters) {
        metadataRows.push(['Filtros aplicados'], ['']);
        Object.entries(config.metadata.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            metadataRows.push([key, String(value)]);
          }
        });
      }

      const metadataSheet = XLSX.utils.aoa_to_sheet(metadataRows);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Información');
    }

    // Agregar cada hoja de datos
    config.sheets.forEach((sheetConfig) => {
      const worksheet = XLSX.utils.json_to_sheet(sheetConfig.data, {
        header: sheetConfig.columns,
      });

      // Aplicar formato automático de ancho de columnas
      const maxWidths: number[] = [];

      // Calcular ancho basado en headers
      if (sheetConfig.columns) {
        sheetConfig.columns.forEach((col, idx) => {
          maxWidths[idx] = col.length;
        });
      }

      // Calcular ancho basado en datos
      sheetConfig.data.forEach((row) => {
        Object.values(row).forEach((val, idx) => {
          const cellLength = String(val || '').length;
          maxWidths[idx] = Math.max(maxWidths[idx] || 0, cellLength);
        });
      });

      // Aplicar anchos (máximo 50 caracteres)
      worksheet['!cols'] = maxWidths.map((w) => ({ wch: Math.min(w + 2, 50) }));

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetConfig.name);
    });

    // Generar archivo
    const fileName = config.fileName.endsWith('.xlsx')
      ? config.fileName
      : `${config.fileName}.xlsx`;

    XLSX.writeFile(workbook, fileName);
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
export const exportSimpleTable = (
  data: any[],
  fileName: string,
  sheetName: string = 'Datos'
): void => {
  exportToExcel({
    fileName,
    sheets: [
      {
        name: sheetName,
        data,
      },
    ],
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
