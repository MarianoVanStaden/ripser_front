import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import type { Capacitacion, CapacitacionAsistencia } from '../types';

interface PlanillaInput {
  capacitacion: Pick<
    Capacitacion,
    'actividad' | 'nombre' | 'objetivo' | 'capacitador' | 'fechaInicio'
  >;
  asistencias: Pick<
    CapacitacionAsistencia,
    'empleadoId' | 'empleadoNombre' | 'empleadoApellido'
  >[];
}

const BORDER: [number, number, number] = [120, 120, 120];
const GREY_BG: [number, number, number] = [235, 235, 235];

const MIN_ROWS = 12;

export function generateCapacitacionPlanillaPdf({ capacitacion, asistencias }: PlanillaInput): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const marginX = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  // ── Header (logo / título / codificación) ──
  const headerTop = 12;
  const headerHeight = 22;
  const logoW = 45;
  const codeW = 60;
  const titleW = contentWidth - logoW - codeW;

  // Logo box
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.rect(marginX, headerTop, logoW, headerHeight);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(18);
  doc.setTextColor(120, 158, 196);
  doc.text('Ripser', marginX + logoW / 2, headerTop + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('INSTALACIONES COMERCIALES', marginX + logoW / 2, headerTop + 15, { align: 'center' });

  // Title box (FORMULARIO / ASISTENCIA)
  const titleX = marginX + logoW;
  doc.rect(titleX, headerTop, titleW, headerHeight / 2);
  doc.rect(titleX, headerTop + headerHeight / 2, titleW, headerHeight / 2);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FORMULARIO', titleX + titleW / 2, headerTop + headerHeight / 4 + 1.5, { align: 'center' });
  doc.setFontSize(11);
  doc.text('ASISTENCIA', titleX + titleW / 2, headerTop + (headerHeight * 3) / 4 + 1.5, { align: 'center' });

  // Code box
  const codeX = titleX + titleW;
  doc.rect(codeX, headerTop, codeW, headerHeight);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const codeLines = [
    'Cód.: F-RRHH-003',
    'Rev.: 01',
    'F. Rev: 01/12/2025',
    'Pág.: 1/1',
  ];
  codeLines.forEach((line, i) => {
    doc.text(line, codeX + 2, headerTop + 5 + i * 4.5);
  });

  // ── Metadatos de la capacitación ──
  let y = headerTop + headerHeight + 6;
  const labelW = 28;
  const rowH = 8;

  const drawMetaRow = (label: string, value: string, fullWidth = true, splitAt?: number, label2?: string, value2?: string) => {
    if (fullWidth) {
      doc.setFillColor(...GREY_BG);
      doc.rect(marginX, y, labelW, rowH, 'F');
      doc.rect(marginX, y, labelW, rowH);
      doc.rect(marginX + labelW, y, contentWidth - labelW, rowH);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(label, marginX + 2, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(value ?? '', marginX + labelW + 2, y + 5.5);
    } else if (splitAt && label2) {
      const half = splitAt;
      doc.setFillColor(...GREY_BG);
      doc.rect(marginX, y, labelW, rowH, 'F');
      doc.rect(marginX, y, labelW, rowH);
      doc.rect(marginX + labelW, y, half - labelW, rowH);
      doc.setFillColor(...GREY_BG);
      doc.rect(marginX + half, y, labelW + 8, rowH, 'F');
      doc.rect(marginX + half, y, labelW + 8, rowH);
      doc.rect(marginX + half + labelW + 8, y, contentWidth - half - labelW - 8, rowH);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(label, marginX + 2, y + 5.5);
      doc.text(label2, marginX + half + 2, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(value ?? '', marginX + labelW + 2, y + 5.5);
      doc.text(value2 ?? '', marginX + half + labelW + 10, y + 5.5);
    }
    y += rowH;
  };

  drawMetaRow('Actividad:', capacitacion.actividad || capacitacion.nombre || '');
  drawMetaRow('Objetivo:', capacitacion.objetivo || '');
  const fecha = capacitacion.fechaInicio
    ? dayjs(capacitacion.fechaInicio).format('DD/MM/YYYY')
    : '';
  drawMetaRow('Capacitador:', capacitacion.capacitador || '', false, contentWidth / 2 + marginX - marginX, 'Fecha del Curso:', fecha);

  // ── Tabla de asistencia ──
  y += 4;

  const rows = [...asistencias];
  while (rows.length < MIN_ROWS) rows.push({ empleadoId: -rows.length });

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['#ID', 'Apellido y Nombre', 'Firma']],
    body: rows.map((a, idx) => {
      const isReal = a.empleadoId && a.empleadoId > 0;
      const nombre = isReal
        ? `${a.empleadoApellido ?? ''}${a.empleadoApellido ? ', ' : ''}${a.empleadoNombre ?? ''}`.trim()
        : '';
      return [isReal ? String(idx + 1) : '', nombre, ''];
    }),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: BORDER, lineWidth: 0.2, minCellHeight: 10 },
    headStyles: { fillColor: GREY_BG, textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 'auto' },
    },
  });

  // ── Firma capacitador ──
  // @ts-expect-error: lastAutoTable is added by jspdf-autotable
  const tableEndY = doc.lastAutoTable?.finalY ?? y;
  const sigY = Math.min(tableEndY + 25, doc.internal.pageSize.getHeight() - 25);
  const sigX = pageWidth / 2 - 30;
  doc.setLineWidth(0.3);
  doc.line(sigX, sigY, sigX + 60, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Firma Capacitador', sigX + 30, sigY + 5, { align: 'center' });

  const filename = `F-RRHH-003_${(capacitacion.actividad || capacitacion.nombre || 'capacitacion')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
