-- ============================================================================
-- Seed inicial de catálogos del Manual de Puestos para RIPSER (empresa_id = 1)
-- ============================================================================
-- - Idempotente: usa INSERT IGNORE contra el UNIQUE (empresa_id, codigo).
-- - Sólo carga lo "universal" (bandas, niveles, severidades, EPP básico, etc.).
--   Lo específico del Excel (29 puestos + áreas/sectores propios de RIPSER)
--   se va a cargar después con el importador.
-- - Si necesitás otra empresa, reemplazá @EMPRESA_ID antes de ejecutar.
-- ============================================================================

SET @EMPRESA_ID = 1;

-- ============== UNIDADES DE NEGOCIO ==============
INSERT IGNORE INTO unidades_negocio (empresa_id, codigo, nombre, descripcion, activo)
VALUES
  (@EMPRESA_ID, 'PRINCIPAL', 'Principal', 'Unidad de negocio principal', 1);

-- ============== LUGARES DE TRABAJO ==============
INSERT IGNORE INTO lugares_trabajo (empresa_id, codigo, nombre, direccion, activo)
VALUES
  (@EMPRESA_ID, 'CASA_CENTRAL', 'Casa Central', NULL, 1);

-- ============== ÁREAS (genéricas) ==============
INSERT IGNORE INTO areas (empresa_id, codigo, nombre, descripcion, activo)
VALUES
  (@EMPRESA_ID, 'DIRECCION',     'Dirección',            'Conducción estratégica de la empresa', 1),
  (@EMPRESA_ID, 'ADMINISTRACION','Administración y Finanzas', NULL, 1),
  (@EMPRESA_ID, 'COMERCIAL',     'Comercial',            NULL, 1),
  (@EMPRESA_ID, 'OPERACIONES',   'Operaciones',          NULL, 1),
  (@EMPRESA_ID, 'PRODUCCION',    'Producción',           NULL, 1),
  (@EMPRESA_ID, 'LOGISTICA',     'Logística',            NULL, 1),
  (@EMPRESA_ID, 'RRHH',          'Recursos Humanos',     NULL, 1),
  (@EMPRESA_ID, 'IT',            'Tecnología',           NULL, 1);

-- ============== BANDAS JERÁRQUICAS ==============
-- Convención: D = Dirección, D-1 = primer nivel debajo, etc.
INSERT IGNORE INTO bandas_jerarquicas (empresa_id, codigo, nombre, orden, descripcion, activo)
VALUES
  (@EMPRESA_ID, 'D',   'Dirección',                       0, NULL, 1),
  (@EMPRESA_ID, 'D-1', 'Gerencias / Jefaturas',           1, NULL, 1),
  (@EMPRESA_ID, 'D-2', 'Mandos medios / Supervisión',     2, NULL, 1),
  (@EMPRESA_ID, 'D-3', 'Analistas / Especialistas',       3, NULL, 1),
  (@EMPRESA_ID, 'D-4', 'Operativos / Asistentes',         4, NULL, 1);

-- ============== NIVELES JERÁRQUICOS ==============
INSERT IGNORE INTO niveles_jerarquicos (empresa_id, codigo, nombre, orden, activo)
VALUES
  (@EMPRESA_ID, 'DIRECCION',    'Dirección',                0, 1),
  (@EMPRESA_ID, 'GERENCIA',     'Gerencia',                 1, 1),
  (@EMPRESA_ID, 'JEFATURA',     'Jefatura / Responsable',   2, 1),
  (@EMPRESA_ID, 'SUPERVISION',  'Supervisión',              3, 1),
  (@EMPRESA_ID, 'ANALISTA',     'Analista / Especialista',  4, 1),
  (@EMPRESA_ID, 'OPERATIVO',    'Operativo',                5, 1);

-- ============== NIVELES DE EDUCACIÓN ==============
INSERT IGNORE INTO niveles_educacion (empresa_id, codigo, nombre, orden, activo)
VALUES
  (@EMPRESA_ID, 'PRIMARIO',      'Primario completo',     0, 1),
  (@EMPRESA_ID, 'SECUNDARIO',    'Secundario completo',   1, 1),
  (@EMPRESA_ID, 'TERCIARIO',     'Terciario',             2, 1),
  (@EMPRESA_ID, 'UNIVERSITARIO', 'Universitario',         3, 1),
  (@EMPRESA_ID, 'POSGRADO',      'Posgrado',              4, 1);

-- ============== TIPOS DE FORMACIÓN ==============
INSERT IGNORE INTO tipos_formacion (empresa_id, codigo, nombre, activo)
VALUES
  (@EMPRESA_ID, 'TECNICA',      'Técnica',              1),
  (@EMPRESA_ID, 'PROFESIONAL',  'Profesional',          1),
  (@EMPRESA_ID, 'ESPECIFICA',   'Específica del rubro', 1),
  (@EMPRESA_ID, 'IDIOMAS',      'Idiomas',              1),
  (@EMPRESA_ID, 'GESTION',      'Gestión / Liderazgo',  1);

-- ============== NIVELES DE EXPERIENCIA ==============
INSERT IGNORE INTO niveles_experiencia (empresa_id, codigo, nombre, anios_minimos, orden, activo)
VALUES
  (@EMPRESA_ID, 'SIN_EXP',     'Sin experiencia',           0,  0, 1),
  (@EMPRESA_ID, 'INICIAL',     'Inicial (0-1 año)',         0,  1, 1),
  (@EMPRESA_ID, 'INTERMEDIO',  'Intermedio (1-3 años)',     1,  2, 1),
  (@EMPRESA_ID, 'AVANZADO',    'Avanzado (3-5 años)',       3,  3, 1),
  (@EMPRESA_ID, 'SENIOR',      'Senior (5-10 años)',        5,  4, 1),
  (@EMPRESA_ID, 'EXPERTO',     'Experto (10+ años)',       10,  5, 1);

-- ============== COMPETENCIAS CORPORATIVAS ==============
INSERT IGNORE INTO competencias (empresa_id, codigo, nombre, tipo, descripcion, activo)
VALUES
  (@EMPRESA_ID, 'C_ORIENT_RES',    'Orientación a resultados',     'CORPORATIVA', NULL, 1),
  (@EMPRESA_ID, 'C_TRABAJO_EQ',    'Trabajo en equipo',            'CORPORATIVA', NULL, 1),
  (@EMPRESA_ID, 'C_COMPROMISO',    'Compromiso organizacional',    'CORPORATIVA', NULL, 1),
  (@EMPRESA_ID, 'C_INTEGRIDAD',    'Integridad y ética',           'CORPORATIVA', NULL, 1),
  (@EMPRESA_ID, 'C_ADAPTACION',    'Adaptación al cambio',         'CORPORATIVA', NULL, 1),
  (@EMPRESA_ID, 'C_COMUNICACION',  'Comunicación efectiva',        'CORPORATIVA', NULL, 1);

-- ============== COMPETENCIAS JERÁRQUICAS ==============
INSERT IGNORE INTO competencias (empresa_id, codigo, nombre, tipo, descripcion, activo)
VALUES
  (@EMPRESA_ID, 'J_LIDERAZGO',     'Liderazgo de equipos',         'JERARQUICA', NULL, 1),
  (@EMPRESA_ID, 'J_DECISIONES',    'Toma de decisiones',           'JERARQUICA', NULL, 1),
  (@EMPRESA_ID, 'J_PLANIFICACION', 'Planificación y organización', 'JERARQUICA', NULL, 1),
  (@EMPRESA_ID, 'J_DELEGACION',    'Delegación efectiva',          'JERARQUICA', NULL, 1),
  (@EMPRESA_ID, 'J_DESARROLLO',    'Desarrollo de colaboradores',  'JERARQUICA', NULL, 1),
  (@EMPRESA_ID, 'J_ESTRATEGICO',   'Pensamiento estratégico',      'JERARQUICA', NULL, 1);

-- ============== COMPETENCIAS FUNCIONALES (genéricas) ==============
INSERT IGNORE INTO competencias (empresa_id, codigo, nombre, tipo, descripcion, activo)
VALUES
  (@EMPRESA_ID, 'F_ANALISIS',      'Capacidad de análisis',        'FUNCIONAL', NULL, 1),
  (@EMPRESA_ID, 'F_NEGOCIACION',   'Negociación',                  'FUNCIONAL', NULL, 1),
  (@EMPRESA_ID, 'F_ATENCION_CLI',  'Atención al cliente',          'FUNCIONAL', NULL, 1),
  (@EMPRESA_ID, 'F_DETALLE',       'Atención al detalle',          'FUNCIONAL', NULL, 1),
  (@EMPRESA_ID, 'F_RESOL_PROB',    'Resolución de problemas',      'FUNCIONAL', NULL, 1),
  (@EMPRESA_ID, 'F_INICIATIVA',    'Iniciativa / Proactividad',    'FUNCIONAL', NULL, 1);

-- ============== RIESGOS LABORALES (genéricos) ==============
INSERT IGNORE INTO riesgos (empresa_id, codigo, nombre, nivel_severidad, descripcion, activo)
VALUES
  (@EMPRESA_ID, 'R_CAIDAS',        'Caídas al mismo nivel',           'MEDIO',   NULL, 1),
  (@EMPRESA_ID, 'R_CAIDAS_ALT',    'Caídas desde altura',             'ALTO',    NULL, 1),
  (@EMPRESA_ID, 'R_GOLPES',        'Golpes y contusiones',            'MEDIO',   NULL, 1),
  (@EMPRESA_ID, 'R_CORTES',        'Cortes con herramientas / vidrio','MEDIO',   NULL, 1),
  (@EMPRESA_ID, 'R_RUIDO',         'Exposición a ruido',              'MEDIO',   NULL, 1),
  (@EMPRESA_ID, 'R_POLVO',         'Exposición a polvo / particulado','MEDIO',   NULL, 1),
  (@EMPRESA_ID, 'R_QUIMICOS',      'Manipulación de químicos',        'ALTO',    NULL, 1),
  (@EMPRESA_ID, 'R_ELECTRICO',     'Riesgo eléctrico',                'ALTO',    NULL, 1),
  (@EMPRESA_ID, 'R_ERGONOMICO',    'Postura / ergonomía',             'MEDIO',   NULL, 1),
  (@EMPRESA_ID, 'R_PSICOSOCIAL',   'Estrés / carga mental',           'MEDIO',   NULL, 1),
  (@EMPRESA_ID, 'R_VEHICULAR',     'Tránsito vehicular',              'ALTO',    NULL, 1);

-- ============== EPP ==============
INSERT IGNORE INTO epp (empresa_id, codigo, nombre, descripcion, activo)
VALUES
  (@EMPRESA_ID, 'EPP_CASCO',       'Casco de seguridad',          NULL, 1),
  (@EMPRESA_ID, 'EPP_ANTIPARRAS',  'Antiparras / protección ocular', NULL, 1),
  (@EMPRESA_ID, 'EPP_AUDITIVO',    'Protección auditiva',         NULL, 1),
  (@EMPRESA_ID, 'EPP_RESPIRATORIO','Protección respiratoria / barbijo', NULL, 1),
  (@EMPRESA_ID, 'EPP_GUANTES',     'Guantes de seguridad',        NULL, 1),
  (@EMPRESA_ID, 'EPP_CALZADO',     'Calzado de seguridad',        NULL, 1),
  (@EMPRESA_ID, 'EPP_FAJA',        'Faja lumbar',                 NULL, 1),
  (@EMPRESA_ID, 'EPP_ARNES',       'Arnés de seguridad',          NULL, 1),
  (@EMPRESA_ID, 'EPP_CHALECO',     'Chaleco reflectivo',          NULL, 1),
  (@EMPRESA_ID, 'EPP_PROTECTOR',   'Protector facial',            NULL, 1);

-- ============================================================================
-- Verificación: contar lo cargado por catálogo
-- ============================================================================
-- SELECT 'unidades_negocio' AS catalogo, COUNT(*) FROM unidades_negocio WHERE empresa_id = @EMPRESA_ID
-- UNION ALL SELECT 'lugares_trabajo',  COUNT(*) FROM lugares_trabajo  WHERE empresa_id = @EMPRESA_ID
-- UNION ALL SELECT 'areas',            COUNT(*) FROM areas            WHERE empresa_id = @EMPRESA_ID
-- UNION ALL SELECT 'bandas_jerarquicas', COUNT(*) FROM bandas_jerarquicas WHERE empresa_id = @EMPRESA_ID
-- UNION ALL SELECT 'niveles_jerarquicos', COUNT(*) FROM niveles_jerarquicos WHERE empresa_id = @EMPRESA_ID
-- UNION ALL SELECT 'niveles_educacion', COUNT(*) FROM niveles_educacion WHERE empresa_id = @EMPRESA_ID
-- UNION ALL SELECT 'tipos_formacion',   COUNT(*) FROM tipos_formacion   WHERE empresa_id = @EMPRESA_ID
-- UNION ALL SELECT 'niveles_experiencia', COUNT(*) FROM niveles_experiencia WHERE empresa_id = @EMPRESA_ID
-- UNION ALL SELECT 'competencias',      COUNT(*) FROM competencias      WHERE empresa_id = @EMPRESA_ID
-- UNION ALL SELECT 'riesgos',           COUNT(*) FROM riesgos           WHERE empresa_id = @EMPRESA_ID
-- UNION ALL SELECT 'epp',               COUNT(*) FROM epp               WHERE empresa_id = @EMPRESA_ID;
