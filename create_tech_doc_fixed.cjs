const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ShadingType, HeadingLevel, PageBreak, VerticalAlign } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 6, color: "2E75B6" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerShading = { fill: "2E75B6", type: ShadingType.CLEAR };

function createModulesTable() {
  const modules = [
    { name: "CRM & Leads", desc: "Gestión de clientes, contactos, interacciones y leads" },
    { name: "Ventas", desc: "Notas de pedido, presupuestos, documentos comerciales" },
    { name: "Fabricación", desc: "Recetas productivas, órdenes de fabricación" },
    { name: "Stock", desc: "Productos, stock objetivo, motor inteligente de planificación" },
    { name: "Logística", desc: "Viajes, vehículos, entregas en tiempo real" },
    { name: "RRHH", desc: "Empleados, legajos, asistencia, sueldos" },
    { name: "Finanzas", desc: "Cajas, bancos, transferencias, flujo de caja" },
    { name: "Préstamos", desc: "Préstamos personales, cuotas, refinanciación" },
    { name: "Proveedores", desc: "Gestión, compras, evaluaciones" }
  ];

  const rows = [];

  // Header
  rows.push(new TableRow({
    children: [
      new TableCell({
        borders,
        shading: headerShading,
        width: { size: 2000, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Módulo", bold: true, color: "FFFFFF", size: 22 })]
        })]
      }),
      new TableCell({
        borders,
        shading: headerShading,
        width: { size: 7360, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Descripción", bold: true, color: "FFFFFF", size: 22 })]
        })]
      })
    ]
  }));

  // Data rows
  modules.forEach((mod, idx) => {
    const bgShading = idx % 2 === 0 ? { fill: "F0F5FA", type: ShadingType.CLEAR } : { fill: "FFFFFF", type: ShadingType.CLEAR };

    rows.push(new TableRow({
      children: [
        new TableCell({
          borders,
          shading: bgShading,
          width: { size: 2000, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: mod.name, bold: true, size: 22, color: "2E75B6" })]
          })]
        }),
        new TableCell({
          borders,
          shading: bgShading,
          width: { size: 7360, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: mod.desc, size: 22 })]
          })]
        })
      ]
    }));
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 7360],
    rows: rows
  });
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 32, bold: true, font: "Calibri", color: "2E75B6" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 28, bold: true, font: "Calibri", color: "404040" },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 }
      }
    ]
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0,
        format: "bullet",
        text: "•",
        alignment: "left",
        style: {
          paragraph: {
            indent: { left: 720, hanging: 360 }
          }
        }
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
      // PORTADA
      new Paragraph({ children: [new TextRun("")], spacing: { before: 800 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "YSY SOFTWARE", bold: true, size: 56, color: "2E75B6" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Plataforma SaaS Multi-Tenant de Gestión Integral", size: 28, color: "404040" })],
        spacing: { before: 100, after: 400 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "para PyMEs Industriales y Comerciales", size: 26, italics: true, color: "666666" })],
        spacing: { before: 0, after: 1200 }
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 800 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "DOCUMENTO TÉCNICO", bold: true, size: 28, color: "2E75B6" })],
        spacing: { before: 0, after: 200 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Junio 2025", size: 24, color: "666666" })]
      }),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // RESUMEN EJECUTIVO
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Resumen Ejecutivo")]
      }),
      new Paragraph({
        children: [new TextRun("YSY Software es una plataforma SaaS multi-tenant que integra la gestión comercial, productiva, logística y administrativa en un único sistema modular, escalable y adaptado al contexto argentino.")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 150, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Hitos Clave")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Producto en producción comercial activa (TRL 9) desde 2024")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("2 clientes pagantes validados: Ripser + Policonsultorio médico (1+ año de uso continuo)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Equipo de 4 profesionales multidisciplinarios con paridad de género")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Modelo de negocio SaaS validado con ingresos recurrentes, sin deuda")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Crecimiento orgánico: segundo cliente adquirido por referencia del primero")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 150, after: 150 } }),

      // DESCRIPCIÓN DEL PRODUCTO
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("1. Descripción del Producto")]
      }),
      new Paragraph({
        children: [new TextRun("YSY Software reemplaza múltiples sistemas desconectados (planillas, ERPs genéricos, sistemas de CRM aislados) por una solución unificada, modular y adaptable que permite a las PyMEs industriales y comerciales gestionar su ciclo completo de operaciones.")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 120, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Módulos del Sistema")]
      }),
      createModulesTable(),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 150, after: 150 } }),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // DIFERENCIADORES
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("2. Diferenciadores Clave")]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("1. Trazabilidad End-to-End")]
      }),
      new Paragraph({
        children: [new TextRun("Un lead capturado en el CRM se transforma automáticamente en oferta, orden de fabricación con su receta productiva, descuento de stock, asignación de transporte y entrega al cliente final, todo dentro del mismo sistema con visibilidad en tiempo real en cada etapa. Nadie en el segmento PyME ofrece este nivel de integración nativa.")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 120, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("2. Motor Inteligente de Planificación de Stock")]
      }),
      new Paragraph({
        children: [new TextRun("Algoritmo propio que evalúa stock objetivo vs disponible vs producción en curso, y sugiere automáticamente acciones de fabricación (FABRICAR, TERMINAR_BASE, MANTENER) por cada variante de producto. Reemplaza la planificación manual basada en intuición y evita los dos costos más caros: capital inmovilizado por sobrestock y ventas perdidas por quiebres.")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 120, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("3. Arquitectura Multi-Tenant Modular Nativa")]
      }),
      new Paragraph({
        children: [new TextRun("Una misma instalación gestiona varias empresas o sucursales con datos completamente aislados. Cada cliente activa solo los módulos que necesita, escalando a medida que crece. Baja la barrera de entrada para PyMEs chicas (no pagan por lo que no usan) y sirve a grupos económicos con varias unidades de negocio.")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 120, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("4. Implementación Rápida y Soporte Directo")]
      }),
      new Paragraph({
        children: [new TextRun("Implementación en semanas (no meses), con onboarding personalizado y soporte directo del equipo de desarrollo —sin intermediarios. Adaptado a la realidad fiscal, logística y operativa argentina, en español y mismo huso horario.")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 150, after: 150 } }),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // ARQUITECTURA TÉCNICA
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("3. Arquitectura Técnica")]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Backend")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Java 21 + Spring Boot 3.2 con Virtual Threads (Project Loom)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Base de datos: MariaDB con Flyway para migraciones (70+ versiones)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Autenticación: JWT + Spring Security con BCrypt")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Multi-tenancy: ThreadLocal context, filtrado automático por empresa")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("104 controladores REST, 110 servicios de negocio, 122 entidades JPA")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Monitoreo: Sentry + Prometheus + Spring Boot Actuator")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 120, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Frontend")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("React 19.1 + TypeScript + Vite 7")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Material-UI 6.5 para componentes profesionales")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("React Router DOM para navegación, React Hook Form para validación")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("TanStack React Query para state management del servidor")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Exportación a PDF (jsPDF) y Excel (ExcelJS)")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 120, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("DevOps & Deployment")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Docker multi-stage (builder + production/development)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("CI/CD con GitHub Actions: Unit Tests, Integration Tests, Build automático")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Ambientes separados: dev, staging, producción")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Cloud deployment con configuration as code")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 150, after: 150 } }),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // ESTADO DE DESARROLLO
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("4. Estado de Desarrollo (TRL 9)")]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Producto")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Todos los módulos operativos en producción")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Arquitectura consolidada con despliegue cloud automatizado")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("CI/CD activo, testing continuo (unit + integration)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Monitoreo en tiempo real (Sentry, Prometheus)")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 120, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Mercado & Tracción")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Ripser (PyME industrial, Mar del Plata): 3+ meses en onboarding, todos los módulos activos")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Policonsultorio médico: 1+ año de uso continuo sin interrupción")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Ingresos recurrentes validados")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Ajuste producto-mercado demostrado por crecimiento orgánico")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 120, after: 100 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Equipo")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("4 profesionales con paridad de género (50% mujeres)")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Vinculación con Universidad Nacional de Mar del Plata (UNMDP) e Instituto IDRA")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Experiencia en desarrollo de software, análisis de negocios y gestión")]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { before: 150, after: 150 } }),

      // VISIÓN DE CRECIMIENTO
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("5. Visión de Crecimiento")]
      }),
      new Paragraph({
        children: [new TextRun("Próximos 12-24 meses:")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Captación de 8-15 nuevos clientes PyME en Mar del Plata y región")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Incorporación de perfiles comerciales y técnicos")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Formalización de vinculaciones con UNMDP, Red Intecmar e incubadoras")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Búsqueda de financiamiento para acelerar go-to-market")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Registro de marca y software como obra protegida")]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("YSY_Documento_Tecnico.docx", buffer);
  console.log("✓ Document created successfully: YSY_Documento_Tecnico.docx");
}).catch(err => {
  console.error("✗ Error creating document:", err);
});
