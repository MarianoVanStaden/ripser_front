// FRONT-003: extracted from AsistenciasPage.tsx — Excel + PDF exporters for
// the Reportes tab.  Pure-ish: each function builds a workbook/document in
// memory and triggers a browser download.  The orchestrator owns the menu
// anchor reset (it knows when the export "finished" from a UX standpoint).
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import type { RegistroAsistencia, Empleado } from '../../../types';
import { getEmpleadoNombre } from './utils';

export interface ReportStats {
  totalAsistencias: number;
  totalHoras: number;
  totalHorasExtras: number;
  promedioHoras: number;
  tardanzas: number;
  inasistencias: number;
  empleadosUnicos: number;
}

export interface ExportOptions {
  asistencias: RegistroAsistencia[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  excepciones: any[];
  reportStats: ReportStats;
  reportEmpleadoFilter: Empleado | null;
  reportFechaDesde: string;
  reportFechaHasta: string;
  reportTipoFilter: string;
}

const findExcepcionForAsistencia = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  excepciones: any[],
  asistencia: RegistroAsistencia
) => {
  if (!Array.isArray(excepciones)) return null;
  return (
    excepciones.find(
      (ex) =>
        ex.empleadoId === asistencia.empleado?.id &&
        dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(asistencia.fecha).format('YYYY-MM-DD')
    ) ?? null
  );
};

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const buildReportFileName = (
  ext: 'xlsx' | 'pdf',
  fechaDesde: string,
  fechaHasta: string
) =>
  `Reporte_Asistencias_${dayjs(fechaDesde).format('DDMMYYYY')}_${dayjs(fechaHasta).format(
    'DDMMYYYY'
  )}.${ext}`;

interface ExcelRow {
  Fecha: string;
  Día: string;
  Empleado: string;
  Estado: string;
  'Hora Entrada': string;
  'Hora Salida': string;
  'Horas Trabajadas': string;
  'Horas Extras': string;
  Observaciones: string;
}

const EMPTY_ROW: ExcelRow = {
  Fecha: '',
  Día: '',
  Empleado: '',
  Estado: '',
  'Hora Entrada': '',
  'Hora Salida': '',
  'Horas Trabajadas': '',
  'Horas Extras': '',
  Observaciones: '',
};

export const exportAsistenciasToExcel = async (opts: ExportOptions): Promise<void> => {
  const { asistencias, excepciones, reportStats, reportFechaDesde, reportFechaHasta } = opts;

  const data: ExcelRow[] = asistencias.map((asistencia) => {
    const excepcion = findExcepcionForAsistencia(excepciones, asistencia);
    return {
      Fecha: dayjs(asistencia.fecha).format('DD/MM/YYYY'),
      Día: dayjs(asistencia.fecha).format('dddd'),
      Empleado: asistencia.empleado ? getEmpleadoNombre(asistencia.empleado) : 'N/A',
      Estado: excepcion ? excepcion.tipo : 'PRESENTE',
      'Hora Entrada': asistencia.horaEntrada || '-',
      'Hora Salida': asistencia.horaSalida || '-',
      'Horas Trabajadas': asistencia.horasTrabajadas.toFixed(2),
      'Horas Extras': asistencia.horasExtras.toFixed(2),
      Observaciones: excepcion
        ? excepcion.observaciones || excepcion.motivo || '-'
        : asistencia.observaciones || '-',
    };
  });

  data.push({ ...EMPTY_ROW });
  data.push({ ...EMPTY_ROW, Fecha: 'RESUMEN' });
  data.push({
    Fecha: 'Total Horas Trabajadas',
    Día: reportStats.totalHoras.toFixed(2),
    Empleado: 'Total Horas Extras',
    Estado: reportStats.totalHorasExtras.toFixed(2),
    'Hora Entrada': 'Promedio Diario',
    'Hora Salida': reportStats.promedioHoras.toFixed(2),
    'Horas Trabajadas': 'Días Trabajados',
    'Horas Extras': asistencias.length.toString(),
    Observaciones: '',
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Asistencias');
  const headers = Object.keys(data[0] ?? EMPTY_ROW);
  worksheet.addRow(headers);
  data.forEach((row) =>
    worksheet.addRow(headers.map((h) => (row as unknown as Record<string, string>)[h] ?? ''))
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, buildReportFileName('xlsx', reportFechaDesde, reportFechaHasta));
};

export const exportAsistenciasToPDF = (opts: ExportOptions): void => {
  const {
    asistencias,
    excepciones,
    reportStats,
    reportEmpleadoFilter,
    reportFechaDesde,
    reportFechaHasta,
    reportTipoFilter,
  } = opts;

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Reporte de Asistencias', 14, 22);

  doc.setFontSize(11);
  doc.text(
    `Período: ${dayjs(reportFechaDesde).format('DD/MM/YYYY')} - ${dayjs(reportFechaHasta).format(
      'DD/MM/YYYY'
    )}`,
    14,
    30
  );
  if (reportEmpleadoFilter) {
    doc.text(`Empleado: ${getEmpleadoNombre(reportEmpleadoFilter)}`, 14, 36);
  }
  if (reportTipoFilter !== 'TODOS') {
    doc.text(`Tipo: ${reportTipoFilter}`, 14, reportEmpleadoFilter ? 42 : 36);
  }

  const tableData = asistencias.map((asistencia) => {
    const excepcion = findExcepcionForAsistencia(excepciones, asistencia);
    return [
      dayjs(asistencia.fecha).format('DD/MM/YYYY'),
      asistencia.empleado ? getEmpleadoNombre(asistencia.empleado) : 'N/A',
      excepcion ? excepcion.tipo : 'PRESENTE',
      asistencia.horaEntrada || '-',
      asistencia.horaSalida || '-',
      asistencia.horasTrabajadas.toFixed(1) + 'h',
      asistencia.horasExtras > 0 ? '+' + asistencia.horasExtras.toFixed(1) + 'h' : '-',
    ];
  });

  autoTable(doc, {
    head: [['Fecha', 'Empleado', 'Estado', 'Entrada', 'Salida', 'Horas', 'Extras']],
    body: tableData,
    startY: reportEmpleadoFilter || reportTipoFilter !== 'TODOS' ? 48 : 38,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [63, 81, 181] },
  });

  // jspdf-autotable mutates the doc instance to expose lastAutoTable; the
  // typings don't surface it, so we bridge with a localized cast.
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.text('Resumen:', 14, finalY);
  doc.setFontSize(10);
  doc.text(`Total Horas Trabajadas: ${reportStats.totalHoras.toFixed(2)} horas`, 14, finalY + 7);
  doc.text(`Total Horas Extras: ${reportStats.totalHorasExtras.toFixed(2)} horas`, 14, finalY + 14);
  doc.text(`Promedio Diario: ${reportStats.promedioHoras.toFixed(2)} horas`, 14, finalY + 21);
  doc.text(`Días Trabajados: ${asistencias.length}`, 14, finalY + 28);
  doc.text(`Tardanzas: ${reportStats.tardanzas}`, 100, finalY + 7);
  doc.text(`Inasistencias: ${reportStats.inasistencias}`, 100, finalY + 14);

  doc.save(buildReportFileName('pdf', reportFechaDesde, reportFechaHasta));
};
