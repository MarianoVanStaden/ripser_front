const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ShadingType, HeadingLevel, PageBreak } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerShading = { fill: "2E75B6", type: ShadingType.CLEAR };

// Create modules table
function createModulesTable() {
  const modules = [
    ["CRM & Leads", "Gestion de clientes, contactos, interacciones y leads"],
    ["Ventas", "Notas de pedido, presupuestos, documentos comerciales"],
    ["Fabricacion", "Recetas, ordenes de fabricacion, etapas"],
    ["Stock", "Productos, stock objetivo, motor inteligente de planificacion"],
    ["Logistica", "Viajes, vehiculos, entregas en tiempo real"],
    ["RRHH", "Empleados, legajos, asistencia, sueldos"],
    ["Finanzas", "Cajas, bancos, transferencias, flujo de caja"],
    ["Prestamos", "Prestamos personales, cuotas"],
    ["Proveedores", "Gestion, compras, evaluaciones"]
  ];

  const rows = [];
  rows.push(new TableRow({
    children: [
      new TableCell({
        borders, shading: headerShading, width: { size: 2000, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph(new TextRun({ text: "Modulo", bold: true, color: "FFFFFF", size: 20 }))]
      }),
      new TableCell({
        borders, shading: headerShading, width: { size: 7360, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph(new TextRun({ text: "Descripcion", bold: true, color: "FFFFFF", size: 20 }))]
      })
    ]
  }));

  modules.forEach((mod, idx) => {
    const shading = idx % 2 === 0 ? { fill: "F8F8F8", type: ShadingType.CLEAR } : { fill: "FFFFFF", type: ShadingType.CLEAR };
    rows.push(new TableRow({
      children: [
        new TableCell({
          borders, shading, width: { size: 2000, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph(new TextRun({ text: mod[0], bold: true, size: 20 }))]
        }),
        new TableCell({
          borders, shading, width: { size: 7360, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph(new TextRun({ text: mod[1], size: 20 }))]
        })
      ]
    }));
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 7360],
    rows
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "404040" },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 } }
    ]
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0, format: "bullet", text: "•", alignment: "left",
        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
      }]
    }]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      new Paragraph({ children: [new TextRun("")], spacing: { before: 800 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "YSY SOFTWARE", bold: true, size: 52, color: "2E75B6" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Plataforma SaaS Multi-Tenant de Gestion Integral", size: 28, color: "404040" })],
        spacing: { before: 100, after: 600 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "para PyMEs Industriales y Comerciales", size: 26, italics: true, color: "666666" })],
        spacing: { before: 0, after: 1200 }
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 800 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "DOCUMENTO TECNICO", bold: true, size: 24, color: "2E75B6" })],
        spacing: { before: 0, after: 200 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Junio 2025", size: 22, color: "666666" })]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Resumen Ejecutivo")]
      }),
      new Paragraph({
        children: [new TextRun("YSY Software es una plataforma SaaS multi-tenant que integra la gestion comercial, productiva, logistica y administrativa en un unico sistema modular, escalable y adaptado al contexto argentino.")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 100, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Hitos Clave")]
      }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Producto en produccion comercial activa (TRL 9)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("2 clientes pagantes: Ripser + Policonsultorio medico (1+ ano de uso)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Equipo de 4 profesionales con paridad de genero")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Modelo SaaS validado con ingresos recurrentes")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Crecimiento organico por referencia")] }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 150, after: 150 } }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("1. Descripcion del Producto")]
      }),
      new Paragraph({
        children: [new TextRun("YSY Software reemplaza multiples sistemas desconectados por una solucion unificada, modular y adaptable.")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 100, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Modulos del Sistema")]
      }),
      createModulesTable(),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 150, after: 150 } }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("2. Diferenciadores Clave")]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("1. Trazabilidad End-to-End")]
      }),
      new Paragraph({
        children: [new TextRun("Un lead en el CRM se transforma automaticamente en oferta, orden de fabricacion, descuento de stock, transporte y entrega. Todo en el mismo sistema con visibilidad en tiempo real.")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 100, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("2. Motor Inteligente de Stock")]
      }),
      new Paragraph({
        children: [new TextRun("Algoritmo propio que sugiere automaticamente acciones de fabricacion segun demanda real. Reemplaza la intuicion con datos, evita sobrestock y quiebres.")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 100, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("3. Arquitectura Multi-Tenant Modular")]
      }),
      new Paragraph({
        children: [new TextRun("Una instalacion para multiples empresas con datos aislados. Cada cliente activa solo los modulos que necesita. Escalable desde PyMEs chicas hasta grupos economicos.")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 100, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("4. Implementacion Rapida y Soporte Directo")]
      }),
      new Paragraph({
        children: [new TextRun("Implementacion en semanas. Soporte directo del equipo. Adaptado al contexto argentino: fiscal, logistico, laboral. En espanol, mismo huso horario.")]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("3. Arquitectura Tecnica")]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Backend")]
      }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Java 21 + Spring Boot 3.2 con Virtual Threads")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("MySQL con Flyway para migraciones")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Autenticacion: JWT + Spring Security")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Multi-tenancy: ThreadLocal context con filtrado automatico")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("104 controladores, 110 servicios, 122 entidades JPA")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Monitoreo: Sentry + Prometheus")] }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 100, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Frontend")]
      }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("React 19 + TypeScript + Vite 7")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Material-UI 6.5 para componentes")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("React Router para navegacion modular")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("React Hook Form + Yup para validacion")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("TanStack React Query para state management")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Exportacion a PDF y Excel")] }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 100, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("DevOps & Deployment")]
      }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Docker multi-stage")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("CI/CD con GitHub Actions")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Ambientes separados: dev, staging, prod")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Cloud deployment")] }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 150, after: 150 } }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("4. Estado de Desarrollo (TRL 9)")]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Producto")]
      }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Todos los modulos operativos en produccion")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Arquitectura consolidada con despliegue cloud")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("CI/CD activo, testing continuo")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Monitoreo en tiempo real")] }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 100, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Mercado & Traccion")]
      }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Ripser: PyME industrial en Mar del Plata, onboarding activo")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Policonsultorio: 1+ ano de uso continuo")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Ingresos recurrentes validados")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Crecimiento organico por referencia")] }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 100, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Equipo")]
      }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("4 profesionales con paridad de genero")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Vinculacion con UNMDP e Instituto IDRA")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Experiencia en desarrollo, analisis de negocios")] }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 150, after: 150 } }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("5. Vision de Crecimiento")]
      }),
      new Paragraph({
        children: [new TextRun("Proximos 12-24 meses:")]
      }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Captacion de 8-15 nuevos clientes PyME")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Incorporacion de perfiles comerciales y tecnicos")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Formalizacion de vinculaciones academicas")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Busqueda de financiamiento para escalar")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Registro de marca y software protegido")] })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("YSY_Documento_Tecnico.docx", buffer);
  console.log("Document created: YSY_Documento_Tecnico.docx");
}).catch(err => {
  console.error("Error creating document:", err);
});
