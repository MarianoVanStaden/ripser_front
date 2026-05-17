import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addCorporateHeader, addCorporateFooter } from '../utils/pdfExportUtils';
import type { PuestoResponseDTO } from '../types';

// ── Paleta corporativa (igual que pdfService.ts) ─────────────────────
const DARK_BLUE:  [number,number,number] = [20,  66,  114];
const LIGHT_BLUE: [number,number,number] = [205, 226, 239];
const WHITE:      [number,number,number] = [255, 255, 255];
const BLACK:      [number,number,number] = [0,   0,   0  ];
const MED_GRAY:   [number,number,number] = [128, 128, 128];
const ALT_ROW:    [number,number,number] = [245, 249, 253];

const MARGIN = 11;
const PAGE_BTM = 22;

// ── Helpers ───────────────────────────────────────────────────────────

function safe(doc: jsPDF, y: number, need: number): number {
  const h = doc.internal.pageSize.getHeight();
  if (y + need > h - PAGE_BTM) { doc.addPage(); return MARGIN + 5; }
  return y;
}

function lastY(doc: jsPDF): number {
  return (doc as any).lastAutoTable?.finalY ?? MARGIN;
}

/** Fila de sección azul (encabezado de bloque). */
function sectionHeader(doc: jsPDF, y: number, title: string): number {
  y = safe(doc, y, 10);
  autoTable(doc, {
    startY: y,
    body: [[{ content: title, styles: { halign: 'left', fontStyle: 'bold', fontSize: 9,
        fillColor: DARK_BLUE, textColor: WHITE, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 } } }]],
    theme: 'plain',
    margin: { left: MARGIN, right: MARGIN },
  });
  return lastY(doc) + 1;
}

/** Lista de ítems (bullets) como tabla de 1 columna. */
function bulletList(doc: jsPDF, y: number, items: string[]): number {
  if (!items.length) return y;
  y = safe(doc, y, items.length * 6 + 4);
  autoTable(doc, {
    startY: y,
    body: items.map((txt, i) => [{
      content: `${i + 1}.  ${txt}`,
      styles: { fontSize: 8, cellPadding: { top: 1.5, bottom: 1.5, left: 6, right: 4 },
        fillColor: i % 2 === 0 ? WHITE : ALT_ROW, textColor: BLACK },
    }]),
    theme: 'plain',
    margin: { left: MARGIN, right: MARGIN },
  });
  return lastY(doc) + 3;
}

/** Tabla de 2 columnas label / valor. */
function infoTable(doc: jsPDF, y: number, rows: [string, string][], col0W = 50): number {
  if (!rows.length) return y;
  y = safe(doc, y, rows.length * 7 + 2);
  autoTable(doc, {
    startY: y,
    body: rows.map(([label, val]) => [
      { content: label, styles: { fontStyle: 'bold', fillColor: LIGHT_BLUE, fontSize: 8,
          cellPadding: { top: 2, bottom: 2, left: 4, right: 2 }, textColor: BLACK } },
      { content: val,   styles: { fillColor: WHITE, fontSize: 8,
          cellPadding: { top: 2, bottom: 2, left: 3, right: 4 }, textColor: BLACK } },
    ]),
    theme: 'grid',
    styles: { lineColor: MED_GRAY, lineWidth: 0.15 },
    columnStyles: { 0: { cellWidth: col0W } },
    margin: { left: MARGIN, right: MARGIN },
  });
  return lastY(doc) + 3;
}

// ── Exportación principal ─────────────────────────────────────────────

export function generarPuestoPDF(dto: PuestoResponseDTO): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = addCorporateHeader(doc, `DESCRIPCIÓN DE PUESTO — ${dto.nombre.toUpperCase()}`);
  y += 2;

  // ── 1. IDENTIFICACIÓN ──────────────────────────────────────────────
  y = sectionHeader(doc, y, 'Identificación del Puesto');
  const banda = [dto.bandaJerarquicaCodigo, dto.nivelJerarquicoNombre].filter(Boolean).join(' · ') || '—';
  y = infoTable(doc, y, [
    ['Área',              dto.areaNombre            || '—'],
    ['Departamento',      dto.departamentoNombre     || '—'],
    ['Sector',            dto.sectorNombre           || '—'],
    ['Unidad de Negocio', dto.unidadNegocioNombre    || '—'],
    ['Lugar de Trabajo',  dto.lugarTrabajoNombre     || '—'],
    ['Banda / Nivel',     banda],
    ['Reporta a',         dto.reportaAPuestoNombre   || '—'],
    ['Vol. Dotación',     dto.volumenDotacion != null ? String(dto.volumenDotacion) : '—'],
    ['CIUO',              dto.ciuo                   || '—'],
    ['Versión',           `v${dto.version}`],
    ['Estado',            dto.activo ? 'Activo' : 'Inactivo'],
  ], 44);

  // ── 2. MISIÓN ──────────────────────────────────────────────────────
  if (dto.mision) {
    y = sectionHeader(doc, y, 'Misión del Puesto');
    y = safe(doc, y, 14);
    autoTable(doc, {
      startY: y,
      body: [[{ content: dto.mision, styles: { fontSize: 8, fontStyle: 'italic',
          fillColor: WHITE, textColor: BLACK, cellPadding: { top: 3, bottom: 3, left: 5, right: 5 } } }]],
      theme: 'plain',
      margin: { left: MARGIN, right: MARGIN },
    });
    y = lastY(doc) + 3;
  }

  // ── 3. OBJETIVO GENERAL ────────────────────────────────────────────
  if (dto.objetivoGeneral) {
    y = sectionHeader(doc, y, 'Objetivo General');
    y = safe(doc, y, 10);
    autoTable(doc, {
      startY: y,
      body: [[{ content: dto.objetivoGeneral, styles: { fontSize: 8,
          fillColor: WHITE, textColor: BLACK, cellPadding: { top: 3, bottom: 3, left: 5, right: 5 } } }]],
      theme: 'plain',
      margin: { left: MARGIN, right: MARGIN },
    });
    y = lastY(doc) + 3;
  }

  // ── 4. OBJETIVOS ESPECÍFICOS ───────────────────────────────────────
  const objetivos = (dto.objetivos ?? []).map(o => o.descripcion).filter(Boolean);
  if (objetivos.length) {
    y = sectionHeader(doc, y, 'Objetivos Específicos');
    y = bulletList(doc, y, objetivos);
  }

  // ── 5. TAREAS Y FUNCIONES ──────────────────────────────────────────
  const tareas = (dto.tareas ?? [])
    .filter(t => t.activo !== false)
    .sort((a, b) => a.orden - b.orden);
  if (tareas.length) {
    y = sectionHeader(doc, y, 'Tareas y Funciones');
    y = bulletList(doc, y, tareas.map(t => t.nombre));
  }

  // ── 6. RESPONSABILIDADES Y AUTORIDADES ────────────────────────────
  const resps = (dto.responsabilidades ?? []).filter(r => r.tipo === 'RESPONSABILIDAD').map(r => r.descripcion);
  const auths = (dto.responsabilidades ?? []).filter(r => r.tipo === 'AUTORIDAD').map(r => r.descripcion);
  if (resps.length || auths.length) {
    y = sectionHeader(doc, y, 'Responsabilidades y Autoridades');
    if (resps.length) {
      y = safe(doc, y, 8);
      autoTable(doc, {
        startY: y,
        body: [[{ content: 'Responsabilidades', styles: { fontStyle: 'bold', fontSize: 8,
            fillColor: LIGHT_BLUE, textColor: DARK_BLUE, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 } } }]],
        theme: 'plain', margin: { left: MARGIN, right: MARGIN },
      });
      y = bulletList(doc, lastY(doc) + 1, resps);
    }
    if (auths.length) {
      y = safe(doc, y, 8);
      autoTable(doc, {
        startY: y,
        body: [[{ content: 'Autoridades', styles: { fontStyle: 'bold', fontSize: 8,
            fillColor: LIGHT_BLUE, textColor: DARK_BLUE, cellPadding: { top: 2, bottom: 2, left: 4, right: 4 } } }]],
        theme: 'plain', margin: { left: MARGIN, right: MARGIN },
      });
      y = bulletList(doc, lastY(doc) + 1, auths);
    }
  }

  // ── 7. COMPETENCIAS ────────────────────────────────────────────────
  if (dto.competencias?.length) {
    y = sectionHeader(doc, y, 'Competencias Requeridas');
    y = safe(doc, y, dto.competencias.length * 7 + 10);
    autoTable(doc, {
      startY: y,
      head: [[
        { content: 'Competencia', styles: { fillColor: DARK_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 } },
        { content: 'Tipo',        styles: { fillColor: DARK_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8, halign: 'center' } },
        { content: 'Nivel',       styles: { fillColor: DARK_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8, halign: 'center' } },
        { content: 'Observaciones', styles: { fillColor: DARK_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 } },
      ]],
      body: dto.competencias.map((c, i) => [
        { content: c.competenciaNombre ?? '—', styles: { fontSize: 8, fillColor: i%2===0?WHITE:ALT_ROW } },
        { content: c.competenciaTipo   ?? '—', styles: { fontSize: 8, fillColor: i%2===0?WHITE:ALT_ROW, halign: 'center' as const } },
        { content: c.nivelRequerido    != null ? `${c.nivelRequerido}` : '—',
          styles: { fontSize: 8, fillColor: i%2===0?WHITE:ALT_ROW, halign: 'center' as const } },
        { content: c.observaciones     ?? '—', styles: { fontSize: 8, fillColor: i%2===0?WHITE:ALT_ROW } },
      ]),
      theme: 'grid',
      styles: { lineColor: MED_GRAY, lineWidth: 0.15 },
      columnStyles: { 1: { cellWidth: 32 }, 2: { cellWidth: 18 } },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = lastY(doc) + 3;
  }

  // ── 8. HABILIDADES Y CONOCIMIENTOS ────────────────────────────────
  const habs = (dto.habilidades ?? []).map(h => h.descripcion).filter(Boolean);
  const cons = (dto.conocimientos ?? []).map(c => c.descripcion).filter(Boolean);
  if (habs.length || cons.length) {
    y = sectionHeader(doc, y, 'Habilidades y Conocimientos');
    const maxR = Math.max(habs.length, cons.length);
    const rows = Array.from({ length: maxR }, (_, i) => [
      { content: habs[i] ? `• ${habs[i]}` : '',
        styles: { fontSize: 8, fillColor: i%2===0?WHITE:ALT_ROW, cellPadding: { top: 2, bottom: 2, left: 5, right: 3 } } },
      { content: cons[i] ? `• ${cons[i]}` : '',
        styles: { fontSize: 8, fillColor: i%2===0?WHITE:ALT_ROW, cellPadding: { top: 2, bottom: 2, left: 5, right: 3 } } },
    ]);
    y = safe(doc, y, maxR * 7 + 10);
    autoTable(doc, {
      startY: y,
      head: [[
        { content: 'Habilidades',   styles: { fillColor: DARK_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 } },
        { content: 'Conocimientos', styles: { fillColor: DARK_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 } },
      ]],
      body: rows,
      theme: 'grid',
      styles: { lineColor: MED_GRAY, lineWidth: 0.15 },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = lastY(doc) + 3;
  }

  // ── 9. INTERACCIÓN SOCIAL ──────────────────────────────────────────
  const internos = (dto.contactos ?? []).filter(c => c.tipo === 'INTERNO').map(c => c.descripcion);
  const externos = (dto.contactos ?? []).filter(c => c.tipo === 'EXTERNO').map(c => c.descripcion);
  if (internos.length || externos.length) {
    y = sectionHeader(doc, y, 'Interacción Social');
    const contRows: [string, string][] = [];
    if (internos.length) contRows.push(['Contactos internos', internos.join('; ')]);
    if (externos.length) contRows.push(['Contactos externos', externos.join('; ')]);
    y = infoTable(doc, y, contRows, 44);
  }

  // ── 10. RIESGOS ────────────────────────────────────────────────────
  if (dto.riesgos?.length) {
    y = sectionHeader(doc, y, 'Riesgos y Condiciones de Trabajo');
    y = safe(doc, y, dto.riesgos.length * 7 + 10);
    autoTable(doc, {
      startY: y,
      head: [[
        { content: 'Riesgo',     styles: { fillColor: DARK_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 } },
        { content: 'Severidad',  styles: { fillColor: DARK_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8, halign: 'center' } },
        { content: 'Observaciones', styles: { fillColor: DARK_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 } },
      ]],
      body: dto.riesgos.map((r, i) => [
        { content: r.riesgoNombre  ?? '—', styles: { fontSize: 8, fillColor: i%2===0?WHITE:ALT_ROW } },
        { content: r.nivelSeveridad ?? '—',
          styles: { fontSize: 8, fillColor: i%2===0?WHITE:ALT_ROW, halign: 'center' as const } },
        { content: r.observaciones ?? '—', styles: { fontSize: 8, fillColor: i%2===0?WHITE:ALT_ROW } },
      ]),
      theme: 'grid',
      styles: { lineColor: MED_GRAY, lineWidth: 0.15 },
      columnStyles: { 1: { cellWidth: 28 } },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = lastY(doc) + 3;
  }

  // ── 11. EPP ────────────────────────────────────────────────────────
  if (dto.epps?.length) {
    y = sectionHeader(doc, y, 'Elementos de Protección Personal (EPP)');
    y = safe(doc, y, dto.epps.length * 7 + 10);
    autoTable(doc, {
      startY: y,
      head: [[
        { content: 'EPP', styles: { fillColor: DARK_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 } },
        { content: 'Obligatorio', styles: { fillColor: DARK_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8, halign: 'center' } },
      ]],
      body: dto.epps.map((e, i) => [
        { content: e.eppNombre ?? '—', styles: { fontSize: 8, fillColor: i%2===0?WHITE:ALT_ROW } },
        { content: e.obligatorio ? 'Sí' : 'No',
          styles: { fontSize: 8, fillColor: i%2===0?WHITE:ALT_ROW, halign: 'center' as const } },
      ]),
      theme: 'grid',
      styles: { lineColor: MED_GRAY, lineWidth: 0.15 },
      columnStyles: { 1: { cellWidth: 28 } },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = lastY(doc) + 3;
  }

  // ── 12. REQUERIMIENTOS FORMALES ────────────────────────────────────
  const reqRows: [string, string][] = [];
  if (dto.nivelEducacionNombre)   reqRows.push(['Educación',   dto.nivelEducacionNombre]);
  if (dto.tipoFormacionNombre)    reqRows.push(['Formación',   dto.tipoFormacionNombre]);
  if (dto.nivelExperienciaNombre) reqRows.push(['Experiencia', dto.nivelExperienciaNombre]);
  if (dto.observacionesRequisitos) reqRows.push(['Observaciones', dto.observacionesRequisitos]);
  if (reqRows.length) {
    y = sectionHeader(doc, y, 'Requerimientos Formales');
    y = infoTable(doc, y, reqRows, 38);
  }

  // ── 13. REEMPLAZOS ─────────────────────────────────────────────────
  const rReemplaza   = (dto.reemplaza       ?? []).map(r => r.puestoRelacionadoNombre).filter(Boolean);
  const rReemplazado = (dto.reemplazadoPor  ?? []).map(r => r.puestoRelacionadoNombre).filter(Boolean);
  if (rReemplaza.length || rReemplazado.length) {
    y = sectionHeader(doc, y, 'Reemplazos');
    const rRows: [string, string][] = [];
    if (rReemplaza.length)   rRows.push(['Reemplaza a',       rReemplaza.join(', ')]);
    if (rReemplazado.length) rRows.push(['Reemplazado por',   rReemplazado.join(', ')]);
    y = infoTable(doc, y, rRows, 44);
  }

  // ── FOOTER ─────────────────────────────────────────────────────────
  addCorporateFooter(doc);

  doc.save(`Manual_Puesto_${dto.nombre.replace(/\s+/g, '_')}_v${dto.version}.pdf`);
}
