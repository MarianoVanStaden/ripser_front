declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface RowInput {
    [key: string]: any;
  }

  interface CellDef {
    content?: string | number;
    colSpan?: number;
    rowSpan?: number;
    styles?: Partial<Styles>;
  }

  interface Styles {
    font?: string;
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
    fontSize?: number;
    cellPadding?: number | {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
    cellWidth?: 'auto' | 'wrap' | number;
    minCellHeight?: number;
    minCellWidth?: number;
    halign?: 'left' | 'center' | 'right' | 'justify';
    valign?: 'top' | 'middle' | 'bottom';
    fillColor?: number | [number, number, number] | string;
    textColor?: number | [number, number, number] | string;
    lineColor?: number | [number, number, number] | string;
    lineWidth?: number;
  }

  interface ColumnStyles {
    [key: string | number]: Partial<Styles>;
  }

  interface UserOptions {
    includeHiddenHtml?: boolean;
    useCss?: boolean;
    theme?: 'striped' | 'grid' | 'plain';
    startY?: number | false;
    margin?: number | {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    pageBreak?: 'auto' | 'avoid' | 'always';
    rowPageBreak?: 'auto' | 'avoid';
    tableWidth?: 'auto' | 'wrap' | number;
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableLineWidth?: number;
    tableLineColor?: number | [number, number, number] | string;

    head?: (CellDef | string | number)[][];
    body?: (CellDef | string | number)[][];
    foot?: (CellDef | string | number)[][];

    html?: string | HTMLTableElement;

    styles?: Partial<Styles>;
    headStyles?: Partial<Styles>;
    bodyStyles?: Partial<Styles>;
    footStyles?: Partial<Styles>;
    alternateRowStyles?: Partial<Styles>;
    columnStyles?: ColumnStyles;

    didParseCell?: (data: CellHookData) => void;
    willDrawCell?: (data: CellHookData) => void;
    didDrawCell?: (data: CellHookData) => void;
    didDrawPage?: (data: HookData) => void;
  }

  interface CellHookData {
    cell: Cell;
    row: Row;
    column: Column;
    section: 'head' | 'body' | 'foot';
  }

  interface HookData {
    table: any;
    pageNumber: number;
    pageCount: number;
    settings: any;
    doc: jsPDF;
    cursor: { x: number; y: number };
  }

  interface Cell {
    raw: string | number | CellDef;
    content: string;
    styles: Styles;
    text: string[];
    section: 'head' | 'body' | 'foot';
    x: number;
    y: number;
    width: number;
    height: number;
    textPos: { x: number; y: number };
    padding: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  }

  interface Row {
    raw: any;
    cells: { [key: string]: Cell };
    section: 'head' | 'body' | 'foot';
    index: number;
    height: number;
  }

  interface Column {
    dataKey: string | number;
    index: number;
    width: number;
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): jsPDF;
}
