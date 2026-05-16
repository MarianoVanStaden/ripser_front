-- ============================================================
-- SEED RIPSER — Catálogos específicos + 29 Puestos
-- empresa_id = 1 | Generado automáticamente desde CSV
-- ============================================================
SET @EMP = 1;

-- ÁREAS
INSERT IGNORE INTO areas (empresa_id,codigo,nombre,activo) VALUES (@EMP,'ADM','Administracion y Finanzas',1);
INSERT IGNORE INTO areas (empresa_id,codigo,nombre,activo) VALUES (@EMP,'OPS','Operaciones',1);
INSERT IGNORE INTO areas (empresa_id,codigo,nombre,activo) VALUES (@EMP,'DIR','Dirección',1);
INSERT IGNORE INTO areas (empresa_id,codigo,nombre,activo) VALUES (@EMP,'MKT','MKT y Ventas',1);

-- DEPARTAMENTOS
INSERT IGNORE INTO departamentos (empresa_id,codigo,nombre,activo,area_id) SELECT @EMP,'GG','Gerencia General',1,id FROM areas WHERE empresa_id=@EMP AND codigo='DIR';
INSERT IGNORE INTO departamentos (empresa_id,codigo,nombre,activo,area_id) SELECT @EMP,'OPSD','Operaciones',1,id FROM areas WHERE empresa_id=@EMP AND codigo='OPS';
INSERT IGNORE INTO departamentos (empresa_id,codigo,nombre,activo,area_id) SELECT @EMP,'ADMF','Administracion y Finanzas',1,id FROM areas WHERE empresa_id=@EMP AND codigo='ADM';
INSERT IGNORE INTO departamentos (empresa_id,codigo,nombre,activo,area_id) SELECT @EMP,'MKTV','MKT y Ventas',1,id FROM areas WHERE empresa_id=@EMP AND codigo='MKT';
INSERT IGNORE INTO departamentos (empresa_id,codigo,nombre,activo,area_id) SELECT @EMP,'PROD','Producción',1,id FROM areas WHERE empresa_id=@EMP AND codigo='OPS';
INSERT IGNORE INTO departamentos (empresa_id,codigo,nombre,activo,area_id) SELECT @EMP,'LOG','Logistica',1,id FROM areas WHERE empresa_id=@EMP AND codigo='OPS';

-- SECTORES
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'PLEG','Plegado',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'MKT-S','Marketing',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='MKTV';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'OPS-S','Operaciones',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='OPSD';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'PROD-S','Producción',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'COB','Cobranzas',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='ADMF';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'VTA','Ventas',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='MKTV';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'HER','Herreria',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'FRIG','Mecanica',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'ADM-S','Administracion',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='ADMF';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'VID','Vidrieria',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'COMP','Compras',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='ADMF';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'ARM','Armado',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'GG-S','Gerencia General',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='GG';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'INSP','Inspeccion Final',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'LOG-S','Logistica',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='LOG';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'PV','Post-Venta',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='LOG';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'AISL','Aislaciones',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD';
INSERT IGNORE INTO sectores (empresa_id,codigo,nombre,activo,departamento_id) SELECT @EMP,'CARP','Carpinteria',1,id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD';

-- LUGARES DE TRABAJO
INSERT IGNORE INTO lugares_trabajo (empresa_id,codigo,nombre,activo) VALUES (@EMP,'TALLER-GUANAHANI','Taller Guanahani',1);
INSERT IGNORE INTO lugares_trabajo (empresa_id,codigo,nombre,activo) VALUES (@EMP,'TALLER-SAVIO','Taller Savio',1);
INSERT IGNORE INTO lugares_trabajo (empresa_id,codigo,nombre,activo) VALUES (@EMP,'VARIOS','Varios',1);

-- COMPETENCIAS RIPSER (tipo CORPORATIVA o FUNCIONAL)
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-05','Pensamiento Estratégico',1,'CORPORATIVA');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-08','Calidad de Decisión',1,'FUNCIONAL');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-11','Planificación y Organización',1,'FUNCIONAL');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-06','Trabajo en equipo',1,'CORPORATIVA');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-01','Compromiso',1,'CORPORATIVA');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-12','Productividad',1,'FUNCIONAL');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-14','Responsabilidad',1,'FUNCIONAL');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-09','Habilidades Técnico / Funcionales',1,'FUNCIONAL');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-10','Orientación al Cliente',1,'FUNCIONAL');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-04','Liderazgo',1,'CORPORATIVA');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-07','Adaptabilidad y Flexibilidad',1,'FUNCIONAL');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-13','Productividad y Responsabilidad',1,'FUNCIONAL');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-02','Calidad del trabajo',1,'CORPORATIVA');
INSERT IGNORE INTO competencias (empresa_id,codigo,nombre,activo,tipo) VALUES (@EMP,'COMP-03','Integridad',1,'CORPORATIVA');

-- RIESGOS RIPSER
INSERT IGNORE INTO riesgos (empresa_id,codigo,nombre,activo,nivel_severidad) VALUES (@EMP,'RIESG-R01','Cortes en extremidades',1,'ALTO');
INSERT IGNORE INTO riesgos (empresa_id,codigo,nombre,activo,nivel_severidad) VALUES (@EMP,'RIESG-R02','Golpes contra objetos',1,'MEDIO');
INSERT IGNORE INTO riesgos (empresa_id,codigo,nombre,activo,nivel_severidad) VALUES (@EMP,'RIESG-R03','Polvo',1,'BAJO');
INSERT IGNORE INTO riesgos (empresa_id,codigo,nombre,activo,nivel_severidad) VALUES (@EMP,'RIESG-R04','Quemaduras',1,'ALTO');

-- EPP RIPSER
INSERT IGNORE INTO epp (empresa_id,codigo,nombre,activo) VALUES (@EMP,'EPP-R01','Barbijo rígido',1);
INSERT IGNORE INTO epp (empresa_id,codigo,nombre,activo) VALUES (@EMP,'EPP-R02','Calzado',1);
INSERT IGNORE INTO epp (empresa_id,codigo,nombre,activo) VALUES (@EMP,'EPP-R03','Delantal descarne',1);
INSERT IGNORE INTO epp (empresa_id,codigo,nombre,activo) VALUES (@EMP,'EPP-R04','Faja de Seguridad',1);
INSERT IGNORE INTO epp (empresa_id,codigo,nombre,activo) VALUES (@EMP,'EPP-R05','Gafas de Seguridad',1);
INSERT IGNORE INTO epp (empresa_id,codigo,nombre,activo) VALUES (@EMP,'EPP-R06','Guante anti corte',1);
INSERT IGNORE INTO epp (empresa_id,codigo,nombre,activo) VALUES (@EMP,'EPP-R07','Guantes',1);
INSERT IGNORE INTO epp (empresa_id,codigo,nombre,activo) VALUES (@EMP,'EPP-R08','Guantes cuero (p/ Soldar)',1);
INSERT IGNORE INTO epp (empresa_id,codigo,nombre,activo) VALUES (@EMP,'EPP-R09','Máscara Facial c/ Filtro',1);
INSERT IGNORE INTO epp (empresa_id,codigo,nombre,activo) VALUES (@EMP,'EPP-R10','Mascara p/soldar',1);



-- ===========================================================
-- SEED RIPSER — 29 Puestos + hijos  (SELECT-based ID lookup)
-- Requiere: seed_catalogos_rrhh.sql + seed_ripser_catalogos_puestos_part1.sql
-- Idempotente: puede correrse varias veces sin duplicados
-- ===========================================================
SET @EMP = 1;

-- ── Director General ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Director General','Dirigir las operaciones diarias de la organización, alinearlas con la estrategia definida y supervisar al equipo para alcanzar los objetivos.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='DIR' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='GG' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='GG-S' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-01' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Oficinas Centrales' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Director General');
SET @p_Director_General = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Director General' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Director_General AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Director_General AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Director_General AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Director_General AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Director_General AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Director_General AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Director_General AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Director_General AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Director_General AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Director_General,@EMP,'Establecer la visión y estrategia: Definir la dirección de la empresa a corto, mediano y largo plazo y formular planes para alcanzarla.',0,1),
  (@p_Director_General,@EMP,'Asegurar la salud financiera: Gestionar el presupuesto, controlar los gastos y usar la contabilidad para tomar decisiones estratégicas y maximizar la rentabilidad.',1,1),
  (@p_Director_General,@EMP,'Impulsar el crecimiento y la innovación: Identificar nuevas oportunidades de mercado, mejorar los ingresos y adoptar nuevas tecnologías para mantener la competitividad.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Director_General,@EMP,'Planificación y estrategia: Definir la visión, los objetivos y las metas de la empresa a corto y largo plazo; desarrollar e implementar planes estratégicos y tácticos.',0,0,1),
  (@p_Director_General,@EMP,'Gestión de operaciones: Supervisar todas las actividades operativas, financieras, de producción, ventas y mercadeo para asegurar la eficiencia y el cumplimiento de los objetivos.',1,0,1),
  (@p_Director_General,@EMP,'Liderazgo y gestión de personal: Liderar, motivar y gestionar al equipo de trabajo; supervisar la contratación, impulsar la capacitación y el desarrollo del personal.',2,0,1),
  (@p_Director_General,@EMP,'Control y finanzas: Monitorear el presupuesto y los costos, asegurar la rentabilidad de la empresa y analizar los resultados financieros para tomar decisiones informadas.',3,0,1),
  (@p_Director_General,@EMP,'Tomar decisiones estrategicas en funcion del analisis de la información financiera, operativa y del mercado que se eleva.',4,0,1),
  (@p_Director_General,@EMP,'Representación y relaciones: Actuar como portavoz de la empresa; mantener y desarrollar relaciones con clientes, proveedores, socios estratégicos.',5,0,1),
  (@p_Director_General,@EMP,'Optimizar procesos para impulsar el crecimiento y la eficiencia, siempre orientado hacia la calidad y la mejora continua.',6,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Director_General,@EMP,'RESPONSABILIDAD','Cumplimiento: Asegurar que la empresa cumpla con todas las normas legales, regulatorias y de calidad.',0,1),
  (@p_Director_General,@EMP,'RESPONSABILIDAD','Mantener alineados los objetivos estrategicos declarados con las operaciones de todas las areas en vistas de poder conseguir los resultados esperados.',1,1),
  (@p_Director_General,@EMP,'RESPONSABILIDAD','Formular los planes operativos y objetivos SMART que permitan en el corto, mediano y loargo plazo, conseguir los resultados enfocados en la calidad y productividad.',2,1),
  (@p_Director_General,@EMP,'RESPONSABILIDAD','Gestionar los presupuestos y contemplar los costos de forma de mantener una salud financiera que permita el crecimiento y desarrollo de la empresa.',3,1),
  (@p_Director_General,@EMP,'RESPONSABILIDAD','Crear una cultura y mindset cuyos pilares sean la calidad y la mejora continua, con agilidad, adaptable y que sea de aprendizaje permanente.',4,1),
  (@p_Director_General,@EMP,'RESPONSABILIDAD','Incorporar cambios que mejoren los resultados con un enfoque basado en la calidad de lso productos y servicios y la mejora constante tanto sea en los procesos como en la personas y en los resultados.',5,1),
  (@p_Director_General,@EMP,'RESPONSABILIDAD','Autoridad para ejecutar los cambios necesarios (contrataciones y egresos de personal, marco disciplinario, asignaciones, modificaciones a la estructura de personal, horarios, tareas, etc).',6,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Director_General,@EMP,'Liderazgo',0,1),
  (@p_Director_General,@EMP,'Comunicación',1,1),
  (@p_Director_General,@EMP,'Organización y planificación',2,1),
  (@p_Director_General,@EMP,'Negociación',3,1),
  (@p_Director_General,@EMP,'Creatividad e Intuición',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Director_General,@EMP,'Conocimiento empresarial',0,1),
  (@p_Director_General,@EMP,'Dirección Estratégica',1,1),
  (@p_Director_General,@EMP,'Gestión Financiera',2,1),
  (@p_Director_General,@EMP,'Resolución de Problemas',3,1),
  (@p_Director_General,@EMP,'Relaciones Públicas',4,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Director_General,@EMP,'INTERNO','Toda la organización',0,1),
  (@p_Director_General,@EMP,'EXTERNO','Proveedores Externos - Organizaciones, Agencias y Organismos.',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Director_General,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Director_General,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Director_General,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Director_General,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Liderazgo' LIMIT 1),@EMP,1),
  (@p_Director_General,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Pensamiento Estratégico' LIMIT 1),@EMP,1),
  (@p_Director_General,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en Equipo' LIMIT 1),@EMP,1);


-- ── Lider de Administración ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Lider de Administración','Asegurar la eficiencia, integridad y trazabilidad de la información administrativa y financiera de la empresa, mediante la gestión, análisis y diseño de sistemas y herramientas que optimicen los procesos operativos, productivos y logísticos, garantizando que los datos se transformen en información confiable para la toma de decisiones y la mejora continua.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='ADM' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='ADMF' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='ADM-S' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-1' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-02' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Oficinas Centrales' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Lider de Administración');
SET @p_Lider_de_Administraci_n = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Lider de Administración' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Lider_de_Administraci_n AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Lider_de_Administraci_n AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Lider_de_Administraci_n AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Lider_de_Administraci_n AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Lider_de_Administraci_n AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Lider_de_Administraci_n AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Lider_de_Administraci_n AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Lider_de_Administraci_n AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Lider_de_Administraci_n AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Lider_de_Administraci_n,@EMP,'Optimizar la gestión de datos.',0,1),
  (@p_Lider_de_Administraci_n,@EMP,'Automatizar procesos administrativos y logísticos.',1,1),
  (@p_Lider_de_Administraci_n,@EMP,'Fortalecer la trazabilidad y la comunicación interáreas.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Lider_de_Administraci_n,@EMP,'Registrar, controlar y analizar datos administrativos y financieros',0,0,1),
  (@p_Lider_de_Administraci_n,@EMP,'Diseñar, desarrollar y mantener herramientas digitales para facilitar los procesos administrativos.',1,0,1),
  (@p_Lider_de_Administraci_n,@EMP,'Generar reportes periódicos y tableros de control',2,0,1),
  (@p_Lider_de_Administraci_n,@EMP,'Detectar oportunidades de mejora en los procesos administrativos',3,0,1),
  (@p_Lider_de_Administraci_n,@EMP,'Mantener la seguridad y respaldo de la información',4,0,1),
  (@p_Lider_de_Administraci_n,@EMP,'Centralizar la información operativa y logística, garantizando la trazabilidad desde la producción hasta la entrega final',5,0,1),
  (@p_Lider_de_Administraci_n,@EMP,'Coordinar la carga, actualización y validación de datos provenientes de diferentes sectores (producción, logística, ventas, finanzas).',6,0,1),
  (@p_Lider_de_Administraci_n,@EMP,'Realizar las Notas de Pedido para los clientes en cada compra que realicen',7,0,1),
  (@p_Lider_de_Administraci_n,@EMP,'Gestión de pagos de impuestos, servicios, suministros y seguros',8,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Lider_de_Administraci_n,@EMP,'RESPONSABILIDAD','Garantizar la exactitud, integridad y disponibilidad de la información financiera y operativa.',0,1),
  (@p_Lider_de_Administraci_n,@EMP,'RESPONSABILIDAD','Resguardar la confidencialidad y seguridad de la información sensible de la empresa.',1,1),
  (@p_Lider_de_Administraci_n,@EMP,'RESPONSABILIDAD','Proponer y ejecutar mejoras continuas en los procesos administrativos, operativos y tecnológicos.',2,1),
  (@p_Lider_de_Administraci_n,@EMP,'RESPONSABILIDAD','Definir y modificar estructuras de hojas, bases de datos y sistemas internos, dentro de los lineamientos de la empresa.',3,1),
  (@p_Lider_de_Administraci_n,@EMP,'RESPONSABILIDAD','Solicitar información o validaciones a las áreas operativas, de producción o logística, cuando sea necesario para el control de datos.',4,1),
  (@p_Lider_de_Administraci_n,@EMP,'RESPONSABILIDAD','Proponer nuevos procedimientos o herramientas tecnológicas al área de dirección o gerencia.',5,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Lider_de_Administraci_n,@EMP,'Capacidad analítica',0,1),
  (@p_Lider_de_Administraci_n,@EMP,'Pensamiento sistémico para diseñar procesos eficientes.',1,1),
  (@p_Lider_de_Administraci_n,@EMP,'Organización y planificación',2,1),
  (@p_Lider_de_Administraci_n,@EMP,'Comunicación efectiva',3,1),
  (@p_Lider_de_Administraci_n,@EMP,'Orientación a la mejora continua y a la eficiencia de los procesos.',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Lider_de_Administraci_n,@EMP,'Gestión administrativa y financiera',0,1),
  (@p_Lider_de_Administraci_n,@EMP,'Sistemas internos y estructuras de bases de datos.',1,1),
  (@p_Lider_de_Administraci_n,@EMP,'Análisis y visualización de datos',2,1),
  (@p_Lider_de_Administraci_n,@EMP,'Conocimiento en herramientas informáticas y de gestión.',3,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Lider_de_Administraci_n,@EMP,'INTERNO','Toda la organización',0,1),
  (@p_Lider_de_Administraci_n,@EMP,'EXTERNO','Proveedores Externos.',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Lider_de_Administraci_n,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Lider_de_Administraci_n,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Lider_de_Administraci_n,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Lider_de_Administraci_n,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Liderazgo' LIMIT 1),@EMP,1),
  (@p_Lider_de_Administraci_n,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Pensamiento Estratégico' LIMIT 1),@EMP,1),
  (@p_Lider_de_Administraci_n,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en Equipo' LIMIT 1),@EMP,1);


-- ── Responsable de Produccion ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Responsable de Produccion','Planificar, coordinar y supervisar las actividades de producción de las distintas líneas (SAVIO y GUANAHANI), asegurando el cumplimiento de los planes de fabricación, los estándares de calidad, seguridad, costos y tiempos establecidos.
Promover la mejora continua de los procesos productivos y logisticos, el uso eficiente de los recursos y la alineación con los objetivos estratégicos de la empresa.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='PROD-S' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-1' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-02' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Responsable de Produccion');
SET @p_Responsable_de_Produccion = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Responsable de Produccion' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Responsable_de_Produccion AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Responsable_de_Produccion AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Responsable_de_Produccion AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Responsable_de_Produccion AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Responsable_de_Produccion AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Responsable_de_Produccion AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Responsable_de_Produccion AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Responsable_de_Produccion AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Responsable_de_Produccion AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Produccion,@EMP,'Asegurar el cumplimiento del programa de producción mensual, garantizando la disponibilidad de materiales, el uso eficiente de los recursos y el cumplimiento de los plazos establecidos, manteniendo la calidad del producto conforme a las especificaciones técnicas',0,1),
  (@p_Responsable_de_Produccion,@EMP,'Incrementar la eficiencia global de los procesos productivos (OEE) mediante la mejora de métodos de trabajo, reducción de tiempos improductivos y control de desperdicios',1,1),
  (@p_Responsable_de_Produccion,@EMP,'Consolidar un equipo de trabajo autónomo, capacitado y orientado a resultados, promoviendo la estandarización de procesos, la aplicación de herramientas Lean Manufacturing y 5S, y la comunicación efectiva entre sectores, con foco en seguridad, orden y calidad.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Responsable_de_Produccion,@EMP,'Elaborar y controlar el plan de producción semanal y mensual.',0,0,1),
  (@p_Responsable_de_Produccion,@EMP,'Coordinar con los supervisores de planta y logística la disponibilidad de materiales, insumos y recursos humanos.',1,0,1),
  (@p_Responsable_de_Produccion,@EMP,'Garantizar el cumplimiento de las normas de calidad, seguridad e higiene industrial',2,0,1),
  (@p_Responsable_de_Produccion,@EMP,'Monitorear indicadores de desempeño (OEE,Monitorear indicadores de desempeño (OEE, productividad, scrap, ausentismo, cumplimiento de plan). productividad, scrap, ausentismo, cumplimiento de plan).',3,0,1),
  (@p_Responsable_de_Produccion,@EMP,'Analizar desvíos y proponer acciones correctivas y preventivas',4,0,1),
  (@p_Responsable_de_Produccion,@EMP,'Promover la estandarización de procesos y la implementación de mejoras técnicas y organizativas.',5,0,1),
  (@p_Responsable_de_Produccion,@EMP,'Supervisar el mantenimiento preventivo y correctivo de equipos de la empresa',6,0,1),
  (@p_Responsable_de_Produccion,@EMP,'Asegurar la capacitación técnica del personal de planta.',7,0,1),
  (@p_Responsable_de_Produccion,@EMP,'Reportar resultados y avances al Gerente General y coordinar con el área de Mejora Continua',8,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Produccion,@EMP,'RESPONSABILIDAD','R.Cumplir y hacer cumplir el plan de producción según los programas establecidos, asegurando los volúmenes, la calidad y los plazos definidos por la Gerencia General.',0,1),
  (@p_Responsable_de_Produccion,@EMP,'RESPONSABILIDAD','R.Coordinar y supervisar al personal de planta, garantizando el cumplimiento de las normas de seguridad, orden, limpieza y disciplina operativa.',1,1),
  (@p_Responsable_de_Produccion,@EMP,'RESPONSABILIDAD','R.Controlar los indicadores de desempeño productivo (KPI) tales como productividad, eficiencia, scrap y cumplimiento de mantenimiento preventivo en los vehiculos a cargo.',2,1),
  (@p_Responsable_de_Produccion,@EMP,'RESPONSABILIDAD','R.Optimizar los procesos productivos, aplicando herramientas de mejora continua (Lean Manufacturing, 5S, TPM) y reduciendo desperdicios y tiempos improductivos.',3,1),
  (@p_Responsable_de_Produccion,@EMP,'RESPONSABILIDAD','R.Planificar y organizar la producción, asignando recursos humanos, máquinas y materiales conforme a las prioridades operativas.',4,1),
  (@p_Responsable_de_Produccion,@EMP,'AUTORIDAD','A.Detener la producción ante la detección de desviaciones críticas de calidad, seguridad o incumplimiento de normas internas.',5,1),
  (@p_Responsable_de_Produccion,@EMP,'AUTORIDAD','A.Evaluar y aprobar el desempeño del personal a cargo, proponiendo capacitaciones, promociones o medidas disciplinarias cuando corresponda',6,1),
  (@p_Responsable_de_Produccion,@EMP,'AUTORIDAD','A.Solicitar recursos, herramientas y mantenimiento de equipos necesarios para cumplir con los objetivos de producción.',7,1),
  (@p_Responsable_de_Produccion,@EMP,'AUTORIDAD','A.Proponer mejoras técnicas y organizativas que incrementen la eficiencia, calidad o seguridad del proceso productivo',8,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Produccion,@EMP,'Liderazgo',0,1),
  (@p_Responsable_de_Produccion,@EMP,'comunicación efectiva',1,1),
  (@p_Responsable_de_Produccion,@EMP,'organización y analisis de procesos',2,1),
  (@p_Responsable_de_Produccion,@EMP,'orientacion a resultados y mejora continua',3,1),
  (@p_Responsable_de_Produccion,@EMP,'trabajo en equipoy toma de decisiones',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Produccion,@EMP,'Planificación y control de producción',0,1),
  (@p_Responsable_de_Produccion,@EMP,'Lean Manufacturing / 5S / TPM',1,1),
  (@p_Responsable_de_Produccion,@EMP,'Control de calidad y gestión de indicadores (KPIs)',2,1),
  (@p_Responsable_de_Produccion,@EMP,'seguridad industrial',3,1),
  (@p_Responsable_de_Produccion,@EMP,'Excel, o software de gestión de planta',4,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Produccion,@EMP,'INTERNO','Toda la organización',0,1),
  (@p_Responsable_de_Produccion,@EMP,'EXTERNO','Proveedores Externos.',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Responsable_de_Produccion,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Produccion,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Produccion,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Produccion,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Liderazgo' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Produccion,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Pensamiento Estratégico' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Produccion,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en Equipo' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Responsable_de_Produccion,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Responsable_de_Produccion,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1);


-- ── Coordinador de Logística ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Coordinador de Logística','Coordinar y supervisar de manera integral las operaciones de transporte y distribución de mercaderías, garantizando la eficiencia y seguridad. Gestionar los recursos y equipos necesarios para cumplir con los requerimientos operativos, manteniendo una comunicación constante y efectiva ante cualquier eventualidad que surja durante el proceso logístico.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='LOG' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='LOG-S' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-1' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-03' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Oficinas Centrales' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Coordinador de Logística');
SET @p_Coordinador_de_Log_stica = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Coordinador de Logística' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Coordinador_de_Log_stica AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Coordinador_de_Log_stica AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Coordinador_de_Log_stica AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Coordinador_de_Log_stica AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Coordinador_de_Log_stica AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Coordinador_de_Log_stica AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Coordinador_de_Log_stica AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Coordinador_de_Log_stica AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Coordinador_de_Log_stica AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Coordinador_de_Log_stica,@EMP,'Asegurar la eficiencia operativa de la gestion de entrega de productos',0,1),
  (@p_Coordinador_de_Log_stica,@EMP,'Planificar y coordinar la entrega de pedidos de los clientes en tiempo y forma',1,1),
  (@p_Coordinador_de_Log_stica,@EMP,'Mejorar la comunicación y coordinación interna',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Coordinador_de_Log_stica,@EMP,'Planificar y coordinar viajes de entrega de productos',0,0,1),
  (@p_Coordinador_de_Log_stica,@EMP,'Supervisar la preparación y disponibilidad de equipos para la entrega',1,0,1),
  (@p_Coordinador_de_Log_stica,@EMP,'Preparar la documentación necesaria para el viaje',2,0,1),
  (@p_Coordinador_de_Log_stica,@EMP,'Monitorear el desarrollo de los viajes',3,0,1),
  (@p_Coordinador_de_Log_stica,@EMP,'Evaluar el desempeño operativo del equipo de envios',4,0,1),
  (@p_Coordinador_de_Log_stica,@EMP,'Mantener contacto con los transportistas y direccion, siendo un nexo entre estos',5,0,1),
  (@p_Coordinador_de_Log_stica,@EMP,'Coordinar con el área administrativa la facturación, control de costos y registro de los viajes realizados.',6,0,1),
  (@p_Coordinador_de_Log_stica,@EMP,'Asignar y coordinar los recursos humanos (choferes, ayudantes) de acuerdo con las necesidades operativas del área',7,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Coordinador_de_Log_stica,@EMP,'RESPONSABILIDAD','Asegurar la correcta ejecución de las operaciones logísticas, garantizando la entrega puntual y segura de la mercadería.',0,1),
  (@p_Coordinador_de_Log_stica,@EMP,'RESPONSABILIDAD','Mantener una comunicación efectiva con las distintas áreas para resolver imprevistos y asegurar la continuidad operativa.',1,1),
  (@p_Coordinador_de_Log_stica,@EMP,'RESPONSABILIDAD','Asignar y coordinar tareas del personal operativo involucrado en las operaciones logísticas.',2,1),
  (@p_Coordinador_de_Log_stica,@EMP,'RESPONSABILIDAD','Reportar directamente a la jefatura o gerencia sobre el estado de las operaciones y resultados obtenidos.',3,1),
  (@p_Coordinador_de_Log_stica,@EMP,'RESPONSABILIDAD','Monitorear costos logísticos',4,1),
  (@p_Coordinador_de_Log_stica,@EMP,'RESPONSABILIDAD','Tomar decisiones inmediatas ante imprevistos',5,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Coordinador_de_Log_stica,@EMP,'coordinación de equipos',0,1),
  (@p_Coordinador_de_Log_stica,@EMP,'Comunicación efectiva',1,1),
  (@p_Coordinador_de_Log_stica,@EMP,'Organización y planificación',2,1),
  (@p_Coordinador_de_Log_stica,@EMP,'Adaptabilidad y proactividad',3,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Coordinador_de_Log_stica,@EMP,'procesos logísticos y de transporte',0,1),
  (@p_Coordinador_de_Log_stica,@EMP,'gestión de inventarios y control de stock.',1,1),
  (@p_Coordinador_de_Log_stica,@EMP,'reglamentaciones de tránsito y transporte.',2,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Coordinador_de_Log_stica,@EMP,'INTERNO','Toda la organización',0,1),
  (@p_Coordinador_de_Log_stica,@EMP,'EXTERNO','Proveedores Externos.',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Coordinador_de_Log_stica,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Coordinador_de_Log_stica,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Coordinador_de_Log_stica,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Coordinador_de_Log_stica,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad de Decisión' LIMIT 1),@EMP,1),
  (@p_Coordinador_de_Log_stica,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Planificación y Organización' LIMIT 1),@EMP,1),
  (@p_Coordinador_de_Log_stica,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad y Responsabilidad' LIMIT 1),@EMP,1);


-- ── Administrativo de Post-Venta ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Administrativo de Post-Venta','Garantizar una atención eficiente y personalizada a los clientes una vez concretada la venta, asegurando la correcta coordinación de entregas, el seguimiento de cada envío y la comunicación fluida entre el cliente y la empresa, con el objetivo de mantener la satisfacción del cliente y la continuidad del vínculo comercial.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='LOG' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='PV' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-2' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-04' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Oficinas Centrales' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Administrativo de Post-Venta');
SET @p_Administrativo_de_Post_Venta = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Administrativo de Post-Venta' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Administrativo_de_Post_Venta AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Administrativo_de_Post_Venta AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Administrativo_de_Post_Venta AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Administrativo_de_Post_Venta AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Administrativo_de_Post_Venta AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Administrativo_de_Post_Venta AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Administrativo_de_Post_Venta AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Administrativo_de_Post_Venta AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Administrativo_de_Post_Venta AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Administrativo_de_Post_Venta,@EMP,'Asegurar la satisfacción del cliente',0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Garantizar la comunicación efectiva de los plazos de entrega y el estado de los pagos.',1,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Mantener un control actualizado de las entregas y gestiones postventa, registrando incidencias, reclamos y acciones tomadas para mejorar la calidad del servicio.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Administrativo_de_Post_Venta,@EMP,'Contactar a los clientes para informar la fecha estimada de entrega de los productos.',0,0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Realizar el seguimiento de cada entrega hasta su recepción conforme.',1,0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Gestionar y registrar reclamos o incidencias postventa, coordinando soluciones con las áreas correspondientes.',2,0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Recordar a los clientes sus fechas de pago de las cuotas del credito personal contraido.',3,0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Completar y enviar al cliente el PDF con la informacion actualizada de su credito personal cada vez que realiza un pago',4,0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Enviar los comprobantes de pago al area administrativa para su acreditacion',5,0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Coordinar con el área de Logística ante demoras, reprogramaciones o inconvenientes en los envíos.',6,0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Mantener actualizada la base de datos de clientes (planilla de creditos personales) y estados de entrega.',7,0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Colaborar con el área comercial para informar sobre el estado de los clientes y sus experiencias postventa.',8,0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Elaborar reportes periódicos sobre entregas, reclamos y gestiones postventa.',9,0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Participar en la mejora continua de los procesos de atención postventa y satisfacción del cliente.',10,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Administrativo_de_Post_Venta,@EMP,'RESPONSABILIDAD','Asegurar la correcta comunicación con los clientes respecto al estado y entrega de los productos.',0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'RESPONSABILIDAD','Gestionar adecuadamente los reclamos o incidencias postventa.',1,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'RESPONSABILIDAD','Mantener una coordinación fluida con las áreas de Logística, Ventas y Cobranzas para asegurar la continuidad del proceso comercial.',2,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'RESPONSABILIDAD','Registrar y actualizar correctamente toda la información relacionada con los clientes y entregas en los sistemas internos.',3,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'RESPONSABILIDAD','Proteger la imagen de la empresa mediante una atención cordial, responsable y orientada a la satisfacción del cliente.',4,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'RESPONSABILIDAD','Solicitar información o acciones al área de Logística y Cobranzas para resolver reclamos o confirmar entregas.',5,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'RESPONSABILIDAD','Priorizar gestiones según urgencia o impacto en la satisfacción del cliente.',6,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Administrativo_de_Post_Venta,@EMP,'Comunicación asertiva',0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Capacidad de organización y seguimiento',1,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Orientación al cliente',2,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Toma de decisiones.',3,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Administrativo_de_Post_Venta,@EMP,'Resolución de reclamos.',0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Circuitos de facturación, cobranzas y entrega de productos.',1,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Garantías, devoluciones y reclamos comerciales.',2,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'Procesos de venta, entrega, facturación y cobranzas.',3,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Administrativo_de_Post_Venta,@EMP,'INTERNO','Toda la organización',0,1),
  (@p_Administrativo_de_Post_Venta,@EMP,'EXTERNO','Clientes',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Administrativo_de_Post_Venta,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Administrativo_de_Post_Venta,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Administrativo_de_Post_Venta,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Administrativo_de_Post_Venta,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Adaptabilidad y Flexibilidad' LIMIT 1),@EMP,1),
  (@p_Administrativo_de_Post_Venta,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Habilidades Técnico / Funcionales' LIMIT 1),@EMP,1),
  (@p_Administrativo_de_Post_Venta,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad y Responsabilidad' LIMIT 1),@EMP,1);


-- ── Administrativo de Compras ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Administrativo de Compras','Contribuir a la optimización de la cadena de suministro mediante una gestión administrativa rigurosa del proceso de compras, manteniendo una comunicación fluida con proveedores y áreas internas para asegurar que las necesidades se cubran en tiempo, forma y al costo más competitivo.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='ADM' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='ADMF' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='COMP' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-2' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-04' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Oficinas Centrales' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Administrativo de Compras');
SET @p_Administrativo_de_Compras = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Administrativo de Compras' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Administrativo_de_Compras AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Administrativo_de_Compras AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Administrativo_de_Compras AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Administrativo_de_Compras AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Administrativo_de_Compras AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Administrativo_de_Compras AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Administrativo_de_Compras AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Administrativo_de_Compras AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Administrativo_de_Compras AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Administrativo_de_Compras,@EMP,'Asegurar la Continuidad del Abastecimiento (Entregas a Tiempo)',0,1),
  (@p_Administrativo_de_Compras,@EMP,'Garantizar la Precisión y Trazabilidad del Proceso de Compras',1,1),
  (@p_Administrativo_de_Compras,@EMP,'Velar por el Cumplimiento de las Condiciones Pactadas (Costo y Calidad)',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Administrativo_de_Compras,@EMP,'Gestión y Emisión de Órdenes de Compra (OC).',0,0,1),
  (@p_Administrativo_de_Compras,@EMP,'Solicitud de Cotizaciones y Comparativa de Precios.',1,0,1),
  (@p_Administrativo_de_Compras,@EMP,'Seguimiento y Activación de Pedidos.',2,0,1),
  (@p_Administrativo_de_Compras,@EMP,'Verificación de Documentación y Recepción.',3,0,1),
  (@p_Administrativo_de_Compras,@EMP,'Gestión de Incidencias y Reclamos.',4,0,1),
  (@p_Administrativo_de_Compras,@EMP,'Generación de Informes y Gestión de Archivos.',5,0,1),
  (@p_Administrativo_de_Compras,@EMP,'Mantenimiento de la Base de Datos de Proveedores.',6,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Administrativo_de_Compras,@EMP,'RESPONSABILIDAD','Gestionar el Ciclo de Compras (completo)',0,1),
  (@p_Administrativo_de_Compras,@EMP,'RESPONSABILIDAD','Gestion de Solicitudes y recepcion de Bienes.',1,1),
  (@p_Administrativo_de_Compras,@EMP,'RESPONSABILIDAD','Confeccionar y envio de Ordenes de Compra',2,1),
  (@p_Administrativo_de_Compras,@EMP,'RESPONSABILIDAD','Coordinacion y Negociacion con Proveedores',3,1),
  (@p_Administrativo_de_Compras,@EMP,'RESPONSABILIDAD','Elaboracion de registros e Informes.',4,1),
  (@p_Administrativo_de_Compras,@EMP,'RESPONSABILIDAD','Gestion de Incidencias y Mejora Continua.',5,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Administrativo_de_Compras,@EMP,'Organización y Planificación',0,1),
  (@p_Administrativo_de_Compras,@EMP,'Atención al Detalle',1,1),
  (@p_Administrativo_de_Compras,@EMP,'Proactividad e Iniciativa',2,1),
  (@p_Administrativo_de_Compras,@EMP,'Habilidades de Comunicación',3,1),
  (@p_Administrativo_de_Compras,@EMP,'Capacidad de Resolución',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Administrativo_de_Compras,@EMP,'Excel',0,1),
  (@p_Administrativo_de_Compras,@EMP,'Sistemas ERP',1,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Administrativo_de_Compras,@EMP,'INTERNO','Toda la organización',0,1),
  (@p_Administrativo_de_Compras,@EMP,'EXTERNO','Proveedores',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Administrativo_de_Compras,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Administrativo_de_Compras,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Administrativo_de_Compras,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Administrativo_de_Compras,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Adaptabilidad y Flexibilidad' LIMIT 1),@EMP,1),
  (@p_Administrativo_de_Compras,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Habilidades Técnico / Funcionales' LIMIT 1),@EMP,1),
  (@p_Administrativo_de_Compras,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad y Responsabilidad' LIMIT 1),@EMP,1);


-- ── Lider Comercial ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Lider Comercial','Dirigir, planificar y coordinar las estrategias comerciales y de comunicación de la empresa con el fin de incrementar las ventas, consolidar la presencia de marca y asegurar la satisfacción del cliente.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='MKT' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='MKTV' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='VTA' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-1' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-02' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Oficinas Centrales' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Lider Comercial');
SET @p_Lider_Comercial = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Lider Comercial' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Lider_Comercial AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Lider_Comercial AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Lider_Comercial AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Lider_Comercial AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Lider_Comercial AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Lider_Comercial AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Lider_Comercial AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Lider_Comercial AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Lider_Comercial AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Lider_Comercial,@EMP,'Diseñar y ejecutar planes estratégicos de ventas que permitan cumplir los objetivos comerciales y de rentabilidad.',0,1),
  (@p_Lider_Comercial,@EMP,'Liderar el desarrollo de campañas de marketing (digital, institucional y promocional) que fortalezcan la imagen de marca y generen demanda.',1,1),
  (@p_Lider_Comercial,@EMP,'Medir y reportar resultados de las acciones de marketing y ventas para la toma de decisiones basadas en datos.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Lider_Comercial,@EMP,'Supervisar y acompañar al equipo de ventas en la planificación, prospección y cierre de operaciones.',0,0,1),
  (@p_Lider_Comercial,@EMP,'Establecer objetivos individuales y grupales, con seguimiento de indicadores de desempeño (KPIs).',1,0,1),
  (@p_Lider_Comercial,@EMP,'Asegurar la correcta atención y satisfacción de los clientes, impulsando la fidelización y postventa.',2,0,1),
  (@p_Lider_Comercial,@EMP,'Controlar y optimizar los procesos de venta: cotización, seguimiento, cierre.',3,0,1),
  (@p_Lider_Comercial,@EMP,'Liderar, motivar y capacitar al personal del área comercial y de marketing.',4,0,1),
  (@p_Lider_Comercial,@EMP,'Fomentar el trabajo en equipo y la cultura orientada a resultados.',5,0,1),
  (@p_Lider_Comercial,@EMP,'Promover reuniones periódicas de revisión de desempeño, avances y estrategias.',6,0,1),
  (@p_Lider_Comercial,@EMP,'Gestionar el desarrollo de materiales promocionales, catálogos y presentaciones comerciales.',7,0,1),
  (@p_Lider_Comercial,@EMP,'Evaluar el retorno de inversión (ROI) de las campañas y acciones de marketing.',8,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Lider_Comercial,@EMP,'RESPONSABILIDAD','Tomar decisiones sobre estrategias de ventas.',0,1),
  (@p_Lider_Comercial,@EMP,'RESPONSABILIDAD','Definir precios, descuentos o condiciones comerciales especiales, conforme a las políticas aprobadas por la dirección.',1,1),
  (@p_Lider_Comercial,@EMP,'RESPONSABILIDAD','Proponer nuevas incorporaciones o cambios en el equipo bajo su responsabilidad.',2,1),
  (@p_Lider_Comercial,@EMP,'RESPONSABILIDAD','Negociar con clientes y distribuidores dentro de los límites establecidos por la empresa.',3,1),
  (@p_Lider_Comercial,@EMP,'RESPONSABILIDAD','Formar, motivar y evaluar al personal a su cargo, promoviendo un ambiente de trabajo colaborativo y orientado a resultados.',4,1),
  (@p_Lider_Comercial,@EMP,'RESPONSABILIDAD','Presentar planes, informes y propuestas de mejora.',5,1),
  (@p_Lider_Comercial,@EMP,'RESPONSABILIDAD','Supervisar el desempeño del equipo comercial y de marketing, estableciendo metas claras y medibles.',6,1),
  (@p_Lider_Comercial,@EMP,'RESPONSABILIDAD','Controlar la ejecución de campañas publicitarias y promociones, asegurando su correcta implementación.',7,1),
  (@p_Lider_Comercial,@EMP,'RESPONSABILIDAD','Coordinar la gestión de presupuestos, proyecciones de ventas y reportes periódicos de resultados.',8,1),
  (@p_Lider_Comercial,@EMP,'RESPONSABILIDAD','Velar por el cumplimiento de procedimientos internos, políticas de precios y estándares de calidad del servicio.',9,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Lider_Comercial,@EMP,'Liderazgo',0,1),
  (@p_Lider_Comercial,@EMP,'Planeación estratégica.',1,1),
  (@p_Lider_Comercial,@EMP,'Trabajo en equipo.',2,1),
  (@p_Lider_Comercial,@EMP,'Adaptabilidad y flexibilidad.',3,1),
  (@p_Lider_Comercial,@EMP,'Persuasión.',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Lider_Comercial,@EMP,'Marketing estratégico y operativo.',0,1),
  (@p_Lider_Comercial,@EMP,'Marketing digital.',1,1),
  (@p_Lider_Comercial,@EMP,'Gestión comercial y ventas.',2,1),
  (@p_Lider_Comercial,@EMP,'Gestión de proyectos.',3,1),
  (@p_Lider_Comercial,@EMP,'Toma de decisiones',4,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Lider_Comercial,@EMP,'INTERNO','Marketing, administración y producción.',0,1),
  (@p_Lider_Comercial,@EMP,'EXTERNO','Clientes y Distribuidores.',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Lider_Comercial,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Lider_Comercial,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Lider_Comercial,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Lider_Comercial,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Liderazgo' LIMIT 1),@EMP,1),
  (@p_Lider_Comercial,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Pensamiento Estratégico' LIMIT 1),@EMP,1),
  (@p_Lider_Comercial,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en Equipo' LIMIT 1),@EMP,1);


-- ── Asesor Comercial ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Asesor Comercial','Contribuir al cumplimiento de los objetivos estratégicos de la organización, tanto en términos de volumen como de calidad en las ventas, combinando habilidades comerciales con una fuerte orientación al cliente, representando la imagen de la empresa desde el primer contacto, el seguimiento y trasncurso, hasta el cierre de la misma.',2,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='MKT' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='MKTV' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='VTA' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-2' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-05' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Oficinas Centrales' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Asesor Comercial');
SET @p_Asesor_Comercial = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Asesor Comercial' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Asesor_Comercial AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Asesor_Comercial AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Asesor_Comercial AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Asesor_Comercial AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Asesor_Comercial AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Asesor_Comercial AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Asesor_Comercial AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Asesor_Comercial AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Asesor_Comercial AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Asesor_Comercial,@EMP,'Planificar y desarrollar las estrategias de ventas para que sean claras, prácticas y acertadas para el cumplimiento de los objetivos propuestos.',0,1),
  (@p_Asesor_Comercial,@EMP,'Llevar adelante la Gestión de Clientes, asesorando y acomapañando a los clientes en cada momento de la conversacion.',1,1),
  (@p_Asesor_Comercial,@EMP,'Colaborar con el equipo comercial para el logro de los objetivos propios del área.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Asesor_Comercial,@EMP,'Mantener las vias de contacto depuradas, organizadas y contestadas.',0,0,1),
  (@p_Asesor_Comercial,@EMP,'Brindar un servicio de atencion al cliente preciso y con claridad',1,0,1),
  (@p_Asesor_Comercial,@EMP,'Trabajar con todo el equipo de ventas para cualquier tipo de situacion, a modo de apoyo, consulta, o decision.',2,0,1),
  (@p_Asesor_Comercial,@EMP,'Agendar los contactos de los clientes',3,0,1),
  (@p_Asesor_Comercial,@EMP,'Cargar las ventas realizadas.',4,0,1),
  (@p_Asesor_Comercial,@EMP,'Proponer nuevas estrategias de venta.',5,0,1),
  (@p_Asesor_Comercial,@EMP,'Conocer el detalle tecnico de los productos que se comercializan.',6,0,1),
  (@p_Asesor_Comercial,@EMP,'Participar y desarrollar anuncios publicitarios.',7,0,1),
  (@p_Asesor_Comercial,@EMP,'Conocer la metodologia de trabajo de la organización en cuento a los procesos de borde en el proceso comercial.',8,0,1),
  (@p_Asesor_Comercial,@EMP,'Utilizacion estrategica de las herramientas comerciales de canales digitales.',9,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Asesor_Comercial,@EMP,'RESPONSABILIDAD','Toma decisiones respectivas a los descuentos.',0,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Asesor_Comercial,@EMP,'Comunicacion efectiva.',0,1),
  (@p_Asesor_Comercial,@EMP,'Orientación a resultados.',1,1),
  (@p_Asesor_Comercial,@EMP,'Atencion al cliente',2,1),
  (@p_Asesor_Comercial,@EMP,'Habilidades de control y organización.',3,1),
  (@p_Asesor_Comercial,@EMP,'Trabajo en equipo.',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Asesor_Comercial,@EMP,'Cierre de Ventas',0,1),
  (@p_Asesor_Comercial,@EMP,'Excel',1,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Asesor_Comercial,@EMP,'INTERNO','Logística, Administración y Marketing',0,1),
  (@p_Asesor_Comercial,@EMP,'EXTERNO','Clientes',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Asesor_Comercial,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Asesor_Comercial,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Asesor_Comercial,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Asesor_Comercial,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Planificación y Organización' LIMIT 1),@EMP,1),
  (@p_Asesor_Comercial,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Habilidades Técnico / Funcionales' LIMIT 1),@EMP,1),
  (@p_Asesor_Comercial,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Orientacion al Cliente' LIMIT 1),@EMP,1);


-- ── Responsable de Marketing ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Responsable de Marketing','Planificar, coordinar y ejecutar las estrategias de marketing y comunicación, con el objetivo de fortalecer la presencia de la marca, posicionar los productos en el mercado y acompañar los objetivos comerciales de la empresa, generando acciones que conecten la identidad de la marca con sus clientes actuales y potenciales, impulsando la visibilidad, la confianza y la preferencia por nuestros equipos y soluciones.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='MKT' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='MKTV' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='MKT-S' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-2' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-03' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Oficinas Centrales' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Responsable de Marketing');
SET @p_Responsable_de_Marketing = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Responsable de Marketing' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Responsable_de_Marketing AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Responsable_de_Marketing AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Responsable_de_Marketing AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Responsable_de_Marketing AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Responsable_de_Marketing AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Responsable_de_Marketing AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Responsable_de_Marketing AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Responsable_de_Marketing AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Responsable_de_Marketing AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Marketing,@EMP,'Desarrollar y ejecutar estrategias integrales de marketing.',0,1),
  (@p_Responsable_de_Marketing,@EMP,'Coordinar la comunicación interna y externa de la marca.',1,1),
  (@p_Responsable_de_Marketing,@EMP,'Analizar y optimizar los resultados de las acciones de marketing, utilizando indicadores que permitan mejorar continuamente la eficacia de las campañas y la gestión de recursos.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Responsable_de_Marketing,@EMP,'Gestionar las redes sociales y plataformas digitales',0,0,1),
  (@p_Responsable_de_Marketing,@EMP,'Desarrollar campañas publicitarias y promociones orientadas a distintos segmentos de clientes.',1,0,1),
  (@p_Responsable_de_Marketing,@EMP,'Coordinar y llevar acabo la producción de contenido visual, fotográfico y audiovisual.',2,0,1),
  (@p_Responsable_de_Marketing,@EMP,'Monitorear el rendimiento de campañas y publicaciones, realizando reportes periódicos de resultados y propuestas de mejora.',3,0,1),
  (@p_Responsable_de_Marketing,@EMP,'Supervisar y realizar el diseño y actualización de materiales institucionales: catálogos, presentaciones, folletos, piezas gráficas, etc.',4,0,1),
  (@p_Responsable_de_Marketing,@EMP,'Colaborar con el área comercial en la elaboración de estrategias de comunicación de productos, promociones y lanzamientos.',5,0,1),
  (@p_Responsable_de_Marketing,@EMP,'Administrar el presupuesto asignado al área de marketing.',6,0,1),
  (@p_Responsable_de_Marketing,@EMP,'Diseñar y ejecutar el plan de marketing y comunicación de la empresa.',7,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Marketing,@EMP,'RESPONSABILIDAD','Responsable de la planificación, ejecución y seguimiento de todas las acciones de marketing de la empresa.',0,1),
  (@p_Responsable_de_Marketing,@EMP,'RESPONSABILIDAD','Tiene autoridad para proponer estrategias, campañas y acciones de comunicación alineadas con los objetivos institucionales.',1,1),
  (@p_Responsable_de_Marketing,@EMP,'RESPONSABILIDAD','Responsable del cumplimiento de los plazos y estándares de calidad de las piezas y acciones de marketing.',2,1),
  (@p_Responsable_de_Marketing,@EMP,'RESPONSABILIDAD','Responsable de la correcta gestión del presupuesto del área y la contratación de servicios o proveedores relacionados.',3,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Marketing,@EMP,'Orientación a resultados.',0,1),
  (@p_Responsable_de_Marketing,@EMP,'Creatividad e innovación.',1,1),
  (@p_Responsable_de_Marketing,@EMP,'Organización y planificación.',2,1),
  (@p_Responsable_de_Marketing,@EMP,'Comunicación efectiva.',3,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Marketing,@EMP,'Herramientas de marketing digital.',0,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Marketing,@EMP,'INTERNO','Logística, Administración y Producción.',0,1),
  (@p_Responsable_de_Marketing,@EMP,'EXTERNO','Proveedores externos',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Responsable_de_Marketing,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Marketing,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Marketing,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Marketing,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Liderazgo' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Marketing,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Pensamiento Estratégico' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Marketing,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad de Decisión' LIMIT 1),@EMP,1);


-- ── Supervisor de Produccion ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Supervisor de Produccion','Supervisar y coordinar las operaciones de fabricación de heladeras comerciales y exibidores, garantizando el cumplimiento del plan de producción establecido.
Asegurar la disponibilidad de materiales e insumos, la correcta gestión de stock y la organización eficiente del trabajo diario y semanal, cumpliendo con los estándares de calidad, seguridad y eficiencia definidos por la empresa.',2,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='PROD-S' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-2' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-03' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Varios' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Supervisor de Produccion');
SET @p_Supervisor_de_Produccion = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Supervisor de Produccion' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Supervisor_de_Produccion AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Supervisor_de_Produccion AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Supervisor_de_Produccion AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Supervisor_de_Produccion AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Supervisor_de_Produccion AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Supervisor_de_Produccion AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Supervisor_de_Produccion AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Supervisor_de_Produccion AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Supervisor_de_Produccion AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Supervisor_de_Produccion,@EMP,'Cumplir el plan de producción asignado, dentro de los parámetros de calidad y tiempos definidos',0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Mantener niveles de stock óptimos de materiales e insumos, evitando faltantes o excesos',1,1),
  (@p_Supervisor_de_Produccion,@EMP,'Promover la eficiencia productiva mediante la reducción de tiempos improductivos, el orden y la aplicación de herramientas de mejora continua (5S, Lean, estandarización).',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Supervisor_de_Produccion,@EMP,'Planificar ,Organizar y distribuir las tareas del personal de planta de acuerdo al plan de producción.',0,0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Controlar la ejecución de las operaciones productivas, verificando cumplimiento de especificaciones, tiempos y métodos de trabajo.',1,0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Realizar los pedidos de materiales e insumos necesarios, asegurando la correcta gestión de stock.',2,0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Supervisar el cumplimiento de las normas de calidad, seguridad, orden y limpieza en el área.',3,0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Registrar datos de producción, analizar desvíos y reportar resultados diarios al Responsable de Producción.',4,0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Revisar los equipos terminados y dar conformidad antes de embalarse (o enviarse a otro taller).',5,0,1),
  (@p_Supervisor_de_Produccion,@EMP,'controlar el cumplimiento de orden y limpieza en la planta',6,0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Completar documentación del sector (formularios, planillas, registros y toda documentacion requerida)',7,0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Verificar que los procesos y productos  cumplan con las especificaciones técnicas',8,0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Asegurar que el personal cumpla con las normas de seguridad industrial',9,0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Mantener una comunicación fluida con departamentos internos para alinear los objetivos',10,0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Participar activamente en proyectos de mejora continua, proponiendo ideas para optimizar procesos',11,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Supervisor_de_Produccion,@EMP,'RESPONSABILIDAD','Asignar tareas y distribuir el personal en función de las necesidades operativas.',0,1),
  (@p_Supervisor_de_Produccion,@EMP,'RESPONSABILIDAD','Solicitar compras o reposiciones de materiales e insumos productivos.',1,1),
  (@p_Supervisor_de_Produccion,@EMP,'RESPONSABILIDAD','Detener un proceso o línea ante desviaciones graves de calidad o seguridad.',2,1),
  (@p_Supervisor_de_Produccion,@EMP,'RESPONSABILIDAD','Proponer mejoras técnicas y organizativas en los métodos de trabajo.',3,1),
  (@p_Supervisor_de_Produccion,@EMP,'RESPONSABILIDAD','Evaluar el desempeño operativo y conductual del personal a su cargo, proponiendo acciones de capacitación o corrección.',4,1),
  (@p_Supervisor_de_Produccion,@EMP,'RESPONSABILIDAD','Solicitar que una tarea mal hecha se realice correctamente',5,1),
  (@p_Supervisor_de_Produccion,@EMP,'RESPONSABILIDAD','Asignar los recursos a su cargo para mantener los sectores limpios y ordenados',6,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Supervisor_de_Produccion,@EMP,'Liderazgo operativo y comunicación clara',0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Resolución de problemas en tiempo real',1,1),
  (@p_Supervisor_de_Produccion,@EMP,'Organización y control de tareas',2,1),
  (@p_Supervisor_de_Produccion,@EMP,'Trabajo en equipo y orientación a resultados',3,1),
  (@p_Supervisor_de_Produccion,@EMP,'Responsabilidad y disciplina operativa',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Supervisor_de_Produccion,@EMP,'Procesos de fabricación de heladeras o productos metálicos',0,1),
  (@p_Supervisor_de_Produccion,@EMP,'Planificación y control de producción',1,1),
  (@p_Supervisor_de_Produccion,@EMP,'Control de stock y gestión de materiales',2,1),
  (@p_Supervisor_de_Produccion,@EMP,'Procedimientos de calidad y normas de seguridad industrial',3,1),
  (@p_Supervisor_de_Produccion,@EMP,'Herramientas de mejora continua (Lean, 5S)',4,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Supervisor_de_Produccion,@EMP,'INTERNO','Deptos Internos',0,1),
  (@p_Supervisor_de_Produccion,@EMP,'EXTERNO','Proveedores externos',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Supervisor_de_Produccion,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Supervisor_de_Produccion,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Supervisor_de_Produccion,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Supervisor_de_Produccion,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Liderazgo' LIMIT 1),@EMP,1),
  (@p_Supervisor_de_Produccion,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Pensamiento Estratégico' LIMIT 1),@EMP,1),
  (@p_Supervisor_de_Produccion,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad y Responsabilidad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Supervisor_de_Produccion,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Supervisor_de_Produccion,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1);


-- ── Supervisor de Logística ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Supervisor de Logística','Planificar, coordinar y supervisar las operaciones logísticas de la planta, asegurando el flujo eficiente de materiales, componentes y productos terminados desde la recepción hasta el despacho al cliente o al deposito de stock. 
Garantizar la disponibilidad de insumos para producción, el orden en los almacenes, la trazabilidad de materiales y el cumplimiento de los procedimientos de calidad, seguridad y entrega establecidos por la empresa.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='LOG' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='LOG-S' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-2' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-03' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Supervisor de Logística');
SET @p_Supervisor_de_Log_stica = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Supervisor de Logística' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Supervisor_de_Log_stica AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Supervisor_de_Log_stica AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Supervisor_de_Log_stica AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Supervisor_de_Log_stica AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Supervisor_de_Log_stica AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Supervisor_de_Log_stica AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Supervisor_de_Log_stica AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Supervisor_de_Log_stica AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Supervisor_de_Log_stica AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Supervisor_de_Log_stica,@EMP,'Cumplir con los tiempos de despacho y entrega de productos terminados según las órdenes de venta y requerimientos de logística comercial.',0,1),
  (@p_Supervisor_de_Log_stica,@EMP,'Lograr un traslado eficiente de los productos de la compañía de la manera mas eficiente y al menor costo.',1,1),
  (@p_Supervisor_de_Log_stica,@EMP,'Brindar soluciones eficientes y de calidad a nuestros clientes generando lazos de confianza por nuestro buen trato y sentido de responsabilidad.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Supervisor_de_Log_stica,@EMP,'Supervisar las actividades de recepción, almacenamiento, abastecimiento interno y despacho de materiales y producto terminado.',0,0,1),
  (@p_Supervisor_de_Log_stica,@EMP,'Controlar la exactitud de inventarios físicos y registros en sistema, reportando desvíos o faltantes',1,0,1),
  (@p_Supervisor_de_Log_stica,@EMP,'Coordinar la logística interna con Producción  para garantizar el flujo continuo de materiales.',2,0,1),
  (@p_Supervisor_de_Log_stica,@EMP,'Coordinar la logística interna con Producción y administracion de ventas para garantizar los cumplimientos de entrega.',3,0,1),
  (@p_Supervisor_de_Log_stica,@EMP,'Asegurar el cumplimiento de las normas de seguridad, orden, limpieza y señalización en las áreas logísticas.',4,0,1),
  (@p_Supervisor_de_Log_stica,@EMP,'capacitar l personal a cargo en lo que respecta a las labores propias del sector',5,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Supervisor_de_Log_stica,@EMP,'RESPONSABILIDAD','Asignar tareas al personal de logística y distribuir la carga de trabajo diaria',0,1),
  (@p_Supervisor_de_Log_stica,@EMP,'RESPONSABILIDAD','Solicitar compras o reposiciones de materiales, repuestos o insumos necesarios para mantener los vehiculos a cargo siempre en condiciones para viajar',1,1),
  (@p_Supervisor_de_Log_stica,@EMP,'RESPONSABILIDAD','Detener el movimiento o despacho de materiales y producto terminado ante riesgos de seguridad o discrepancias de calidad.',2,1),
  (@p_Supervisor_de_Log_stica,@EMP,'RESPONSABILIDAD','Aprobar la salida o devolución de materiales en coordinación con Producción, post venta y Calidad.',3,1),
  (@p_Supervisor_de_Log_stica,@EMP,'RESPONSABILIDAD','Proponer y liderar acciones de mejora en layout, control de stock, manipulación y transporte interno.',4,1),
  (@p_Supervisor_de_Log_stica,@EMP,'RESPONSABILIDAD','capacitar al personal a cargo.',5,1),
  (@p_Supervisor_de_Log_stica,@EMP,'RESPONSABILIDAD','cambiar ruta asignada ante imprevistos, inconvenientes informados',6,1),
  (@p_Supervisor_de_Log_stica,@EMP,'RESPONSABILIDAD','responsable de rendir los gastos a direccion de cada viaje informando desvios y novedades',7,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Supervisor_de_Log_stica,@EMP,'Organización y planificación operativa',0,1),
  (@p_Supervisor_de_Log_stica,@EMP,'Liderazgo y comunicación efectiva',1,1),
  (@p_Supervisor_de_Log_stica,@EMP,'Capacidad de análisis y resolución de problemas',2,1),
  (@p_Supervisor_de_Log_stica,@EMP,'Enfoque en la mejora continua y disciplina operativa',3,1),
  (@p_Supervisor_de_Log_stica,@EMP,'Trabajo en equipo y orientación a resultados',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Supervisor_de_Log_stica,@EMP,'Gestión de inventarios y control de stock',0,1),
  (@p_Supervisor_de_Log_stica,@EMP,'Recepción, almacenamiento y despacho de materiales',1,1),
  (@p_Supervisor_de_Log_stica,@EMP,'Normas de seguridad vial, industrial y manipulación de cargas',2,1),
  (@p_Supervisor_de_Log_stica,@EMP,'refrigeracion, armado de vidrio DVH,electricidad y electronica, mantenimiento preventivo vehicular,',3,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Supervisor_de_Log_stica,@EMP,'INTERNO','Deptos Internos',0,1),
  (@p_Supervisor_de_Log_stica,@EMP,'EXTERNO','Proveedores externos y Clientes',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Supervisor_de_Log_stica,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Supervisor_de_Log_stica,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Supervisor_de_Log_stica,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Supervisor_de_Log_stica,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Liderazgo' LIMIT 1),@EMP,1),
  (@p_Supervisor_de_Log_stica,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Pensamiento Estratégico' LIMIT 1),@EMP,1),
  (@p_Supervisor_de_Log_stica,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad y Responsabilidad' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Supervisor_de_Log_stica,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1);


-- ── Oficial Vidriero ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Oficial Vidriero','Realizar el armado, preparación, instalación, sellado y control de calidad de los vidrios utilizados en las heladeras exhibidoras, garantizando exactitud en los cortes, hermeticidad en los sellados y cumplimiento de los estándares de seguridad, estética y funcionamiento establecidos por la empresa.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='VID' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Vidriero');
SET @p_Oficial_Vidriero = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Vidriero' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Oficial_Vidriero AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Oficial_Vidriero AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Oficial_Vidriero AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Oficial_Vidriero AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Oficial_Vidriero AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Oficial_Vidriero AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Oficial_Vidriero AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Oficial_Vidriero AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Oficial_Vidriero AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Vidriero,@EMP,'Asegurar que el 100% de los vidrios, puertas y paños se armen conforme a las especificaciones técnicas, sin defectos visibles y con la hermeticidad correcta según estándares de la empresa',0,1),
  (@p_Oficial_Vidriero,@EMP,'Minimizar roturas y rechazos de vidrio logrando un índice de desperdicio menor al % establecido por Producción, aplicando buenas prácticas de manipulación y optimización de cortes',1,1),
  (@p_Oficial_Vidriero,@EMP,'Realizar los armados y colocaciones requeridos por el plan de producción diario y semanal, garantizando tiempos de entrega internos y coordinación con montaje y control final.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Oficial_Vidriero,@EMP,'Ejecutar el corte, pulido y armado de vidrios según planos o especificaciones.',0,0,1),
  (@p_Oficial_Vidriero,@EMP,'Preparar y aplicar siliconas, selladores y burletes garantizando hermeticidad y presentación comercial.',1,0,1),
  (@p_Oficial_Vidriero,@EMP,'Realizar el armado de puertas vidriadas, laterales, frentes y tapas de acuerdo con los modelos de heladeras.',2,0,1),
  (@p_Oficial_Vidriero,@EMP,'Controlar la calidad final del vidrio: rayas, golpes, nivelación, limpieza y acabados.',3,0,1),
  (@p_Oficial_Vidriero,@EMP,'Cumplir normas de seguridad, manipulación y protección de materiales frágiles.',4,0,1),
  (@p_Oficial_Vidriero,@EMP,'Mantener herramientas, mesa de corte, ventosas y máquinas en condiciones óptimas.',5,0,1),
  (@p_Oficial_Vidriero,@EMP,'Registrar trabajos y comunicar defectos o desvíos al Supervisor de Producción.',6,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Oficial_Vidriero,@EMP,'AUTORIDAD','A. Rechazar vidrios que no cumplan estándares de calidad.',0,1),
  (@p_Oficial_Vidriero,@EMP,'AUTORIDAD','A. Detener el proceso cuando existan riesgos de rotura o condiciones inseguras.',1,1),
  (@p_Oficial_Vidriero,@EMP,'AUTORIDAD','A. Solicitar materiales, insumos o repuestos necesarios para la tarea.',2,1),
  (@p_Oficial_Vidriero,@EMP,'RESPONSABILIDAD','Proponer mejoras en métodos, presentación o reducción de desperdicios.',3,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Vidriero,@EMP,'Precisión y atención al detalle.',0,1),
  (@p_Oficial_Vidriero,@EMP,'Prolijidad manual.',1,1),
  (@p_Oficial_Vidriero,@EMP,'Responsabilidad y seguridad operativa.',2,1),
  (@p_Oficial_Vidriero,@EMP,'Trabajo en equipo.',3,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Vidriero,@EMP,'Manejo de mesas de corte y herramientas específicas (corta vidrios, ventosas, espátulas, pistolas de silicona).',0,1),
  (@p_Oficial_Vidriero,@EMP,'Técnicas de armado de puertas y paños vidriados.',1,1),
  (@p_Oficial_Vidriero,@EMP,'Aplicación de selladores y adhesivos estructurales.',2,1),
  (@p_Oficial_Vidriero,@EMP,'Lectura de planos básicos y medidas.',3,1),
  (@p_Oficial_Vidriero,@EMP,'Normas de seguridad en manipulación de materiales frágiles.',4,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Oficial_Vidriero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Oficial_Vidriero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Oficial_Vidriero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Oficial_Vidriero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Oficial_Vidriero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Oficial_Vidriero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Oficial_Vidriero,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1),
  (@p_Oficial_Vidriero,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Cortes en extremidades' LIMIT 1),@EMP,1),
  (@p_Oficial_Vidriero,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Polvo' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Oficial_Vidriero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Vidriero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Gafas de Seguridad' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Vidriero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Máscara Facial c/ Filtro' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Vidriero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guante anti corte' LIMIT 1),@EMP,1,1);


-- ── Auxiliar Vidriero ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Auxiliar Vidriero','Asistir al Vidriero Oficial en las tareas de preparación, manipulación, limpieza y armado de vidrios, colaborando en el proceso completo de fabricación, asegurando orden, seguridad y soporte operativo para garantizar un flujo productivo eficiente.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='VID' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar Vidriero');
SET @p_Auxiliar_Vidriero = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar Vidriero' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Auxiliar_Vidriero AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Auxiliar_Vidriero AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Auxiliar_Vidriero AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Auxiliar_Vidriero AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Auxiliar_Vidriero AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Auxiliar_Vidriero AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Auxiliar_Vidriero AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Auxiliar_Vidriero AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Auxiliar_Vidriero AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Vidriero,@EMP,'Preparar materiales, herramientas y piezas de manera correcta y oportuna, garantizando que el Vidriero Oficial mantenga el ritmo de trabajo según la planificación diaria.',0,1),
  (@p_Auxiliar_Vidriero,@EMP,'Asegurar un área de trabajo limpia, ordenada, con herramientas en condiciones y con cumplimiento de normas de seguridad y manipulación de vidrio (5S)',1,1),
  (@p_Auxiliar_Vidriero,@EMP,'Cumplir con las tareas de limpieza, preparación y apoyo en armado con cero errores críticos, contribuyendo a la calidad del producto final y al flujo productivo',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Auxiliar_Vidriero,@EMP,'Preparar materiales, herramientas y superficies de trabajo',0,0,1),
  (@p_Auxiliar_Vidriero,@EMP,'Manipular vidrios junto con el vidriero of, trasladarlos y posicionarlos siguiendo instrucciones del Vidriero Oficial.',1,0,1),
  (@p_Auxiliar_Vidriero,@EMP,'Realizar limpieza previa y final de vidrios y estructuras.',2,0,1),
  (@p_Auxiliar_Vidriero,@EMP,'Asistir en la colocación de burletes, siliconas y selladores.',3,0,1),
  (@p_Auxiliar_Vidriero,@EMP,'Mantener el área de vidrio organizada, segura y con insumos disponibles.',4,0,1),
  (@p_Auxiliar_Vidriero,@EMP,'Detectar defectos visibles y comunicar inconsistencias al Vidriero Oficial o Supervisor.',5,0,1),
  (@p_Auxiliar_Vidriero,@EMP,'Cumplir normas de seguridad, uso de EPP y procedimientos de manipulación.',6,0,1),
  (@p_Auxiliar_Vidriero,@EMP,'completar registros de producción',7,0,1),
  (@p_Auxiliar_Vidriero,@EMP,'Pulir cantos de vidrio',8,0,1),
  (@p_Auxiliar_Vidriero,@EMP,'armar paquetes de estantes de los modelos a entregar',9,0,1),
  (@p_Auxiliar_Vidriero,@EMP,'mantener el stock requerido completo',10,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Vidriero,@EMP,'AUTORIDAD','A. Detener una operación cuando detecte riesgo de rotura o situaciones inseguras.',0,1),
  (@p_Auxiliar_Vidriero,@EMP,'AUTORIDAD','A. Informar a supervisor  sobre materiales faltantes o herramientas defectuosas.',1,1),
  (@p_Auxiliar_Vidriero,@EMP,'AUTORIDAD','A. Rechazar materiales dañados antes del armado.',2,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Vidriero,@EMP,'Atención y seguimiento de instrucciones.',0,1),
  (@p_Auxiliar_Vidriero,@EMP,'Responsabilidad y disciplina operativa.',1,1),
  (@p_Auxiliar_Vidriero,@EMP,'Prolijidad y cuidado del material.',2,1),
  (@p_Auxiliar_Vidriero,@EMP,'Trabajo en equipo.',3,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Vidriero,@EMP,'Manipulación segura de vidrios y cargas frágiles.',0,1),
  (@p_Auxiliar_Vidriero,@EMP,'Nociones básicas de herramientas manuales.',1,1),
  (@p_Auxiliar_Vidriero,@EMP,'Orden y preparación de materiales.',2,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Auxiliar_Vidriero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Vidriero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Vidriero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Vidriero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Vidriero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Vidriero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Auxiliar_Vidriero,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Vidriero,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Cortes en extremidades' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Vidriero,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Polvo' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Auxiliar_Vidriero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Auxiliar_Vidriero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Gafas de Seguridad' LIMIT 1),@EMP,1,1),
  (@p_Auxiliar_Vidriero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Máscara Facial c/ Filtro' LIMIT 1),@EMP,1,1),
  (@p_Auxiliar_Vidriero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guante anti corte' LIMIT 1),@EMP,1,1);


-- ── Oficial Herrero ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Oficial Herrero','Fabricar, armar y reparar estructuras metálicas y componentes utilizados en la producción de heladeras y  exhibidoras, garantizando exactitud dimensional, soldaduras seguras, acabados de calidad y cumplimiento de las especificaciones técnicas y de seguridad industrial.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='HER' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Herrero');
SET @p_Oficial_Herrero = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Herrero' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Oficial_Herrero AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Oficial_Herrero AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Oficial_Herrero AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Oficial_Herrero AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Oficial_Herrero AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Oficial_Herrero AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Oficial_Herrero AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Oficial_Herrero AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Oficial_Herrero AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Herrero,@EMP,'Alcanzar el 100% de las estructuras asignadas en tiempo y forma, garantizando dimensiones correctas, soldaduras seguras y calidad de presentación.',0,1),
  (@p_Oficial_Herrero,@EMP,'Lograr un índice de retrabajo inferior al estándar establecido, asegurando cordones uniformes, uniones sólidas y ensamblajes precisos que eviten correcciones posteriores.',1,1),
  (@p_Oficial_Herrero,@EMP,'Reducir el desperdicio de metales, discos, electrodos y gases mediante técnicas de trabajo eficientes y correcta planificación de cortes.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Oficial_Herrero,@EMP,'Ejecutar trabajos de soldadura MIG/MAG, TIG o eléctrica, según los requerimientos del modelo de heladera.',0,0,1),
  (@p_Oficial_Herrero,@EMP,'Realizar cortes, desbastado, perforados y ensamblaje de estructuras metálicas.',1,0,1),
  (@p_Oficial_Herrero,@EMP,'Interpretar planos y órdenes de fabricación, asegurando medidas y tolerancias correctas.',2,0,1),
  (@p_Oficial_Herrero,@EMP,'Controlar la calidad de las uniones y estructuras: solidez, presentación, plomos, escuadras y limpieza',3,0,1),
  (@p_Oficial_Herrero,@EMP,'Preparar superficies metálicas para pintura o montaje (lijado, desbaste, limpieza).',4,0,1),
  (@p_Oficial_Herrero,@EMP,'Mantener herramientas, soldadoras y equipos de herrería en condiciones seguras.',5,0,1),
  (@p_Oficial_Herrero,@EMP,'Cumplir normas de seguridad industrial, manipulación de piezas calientes y uso de EPP.',6,0,1),
  (@p_Oficial_Herrero,@EMP,'Reportar trabajos terminados y comunicar desvíos al Supervisor de Producción.',7,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Oficial_Herrero,@EMP,'RESPONSABILIDAD','Rechazar materiales metálicos defectuosos o fuera de especificación.',0,1),
  (@p_Oficial_Herrero,@EMP,'RESPONSABILIDAD','Detener trabajos cuando detecte riesgos de seguridad o defectos críticos.',1,1),
  (@p_Oficial_Herrero,@EMP,'RESPONSABILIDAD','Solicitar insumos, electrodos, gases o herramientas necesarias.',2,1),
  (@p_Oficial_Herrero,@EMP,'RESPONSABILIDAD','Definir métodos de trabajo más eficientes dentro de los procedimientos establecidos.',3,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Herrero,@EMP,'Precisión y prolijidad.',0,1),
  (@p_Oficial_Herrero,@EMP,'Orientación a resultados y tiempos de producción.',1,1),
  (@p_Oficial_Herrero,@EMP,'Capacidad de resolución de problemas.',2,1),
  (@p_Oficial_Herrero,@EMP,'Responsabilidad y trabajo en equipo.',3,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Herrero,@EMP,'Lectura de planos industriales.',0,1),
  (@p_Oficial_Herrero,@EMP,'Uso de herramientas de herrería: amoladoras, taladros, plegadoras, sierras, escuadras.',1,1),
  (@p_Oficial_Herrero,@EMP,'Técnicas de soldadura y control de calidad de cordones.',2,1),
  (@p_Oficial_Herrero,@EMP,'Seguridad industrial, manipulación de piezas calientes y chispas.',3,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Oficial_Herrero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Oficial_Herrero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Oficial_Herrero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Oficial_Herrero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Oficial_Herrero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Oficial_Herrero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Oficial_Herrero,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1),
  (@p_Oficial_Herrero,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Quemaduras' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Oficial_Herrero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Herrero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Mascara p/soldar' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Herrero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guantes cuero (p/ Soldar)' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Herrero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Delantal descarne' LIMIT 1),@EMP,1,1);


-- ── Auxiliar Herrero ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Auxiliar Herrero','Asistir al Herrero Oficial en las tareas de preparación, corte, limpieza, transporte y posicionamiento de piezas metálicas, asegurando un flujo de trabajo seguro, ordenado y eficiente dentro del proceso de fabricación de heladeras.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='HER' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar Herrero');
SET @p_Auxiliar_Herrero = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar Herrero' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Auxiliar_Herrero AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Auxiliar_Herrero AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Auxiliar_Herrero AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Auxiliar_Herrero AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Auxiliar_Herrero AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Auxiliar_Herrero AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Auxiliar_Herrero AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Auxiliar_Herrero AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Auxiliar_Herrero AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Herrero,@EMP,'Organizar insumos, piezas y herramientas de modo que el Herrero Oficial no sufra demoras por falta de preparación.',0,1),
  (@p_Auxiliar_Herrero,@EMP,'Realizar cortes simples, limpieza de piezas, movimientos de estructuras y apoyo en soldadura sin errores críticos y cumpliendo todas las normas de seguridad.',1,1),
  (@p_Auxiliar_Herrero,@EMP,'Aumentar la eficiencia del sector mediante asistencia oportuna, orden del área y disminución de tiempos improductivos.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Auxiliar_Herrero,@EMP,'Preparar materiales, herramientas y piezas para el Herrero Oficial.',0,0,1),
  (@p_Auxiliar_Herrero,@EMP,'Realizar cortes simples, perforaciones básicas y limpieza de piezas bajo supervisión.',1,0,1),
  (@p_Auxiliar_Herrero,@EMP,'Transportar y posicionar estructuras metálicas, asegurando manipulación segura.',2,0,1),
  (@p_Auxiliar_Herrero,@EMP,'Realizar desbaste, lijado y preparación previa a la soldadura o pintura.',3,0,1),
  (@p_Auxiliar_Herrero,@EMP,'Mantener el área de herrería ordenada, limpia y cumpliendo normas de seguridad.',4,0,1),
  (@p_Auxiliar_Herrero,@EMP,'Informar defectos visibles o desvíos en materiales o piezas.',5,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Herrero,@EMP,'RESPONSABILIDAD','Detener una operación si detecta riesgos para sí mismo, el oficial o terceros.',0,1),
  (@p_Auxiliar_Herrero,@EMP,'RESPONSABILIDAD','Solicitar reposición de herramientas consumibles o elementos de protección.',1,1),
  (@p_Auxiliar_Herrero,@EMP,'RESPONSABILIDAD','Rechazar piezas dañadas antes de su armado.',2,1),
  (@p_Auxiliar_Herrero,@EMP,'RESPONSABILIDAD','completar planillas de produccion',3,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Herrero,@EMP,'Muy buena predisposición al aprendizaje.',0,1),
  (@p_Auxiliar_Herrero,@EMP,'Orden, prolijidad y disciplina operativa.',1,1),
  (@p_Auxiliar_Herrero,@EMP,'Seguimiento de instrucciones y trabajo en equipo.',2,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Herrero,@EMP,'Herramientas manuales (amoladora, taladro, lima, sierra).',0,1),
  (@p_Auxiliar_Herrero,@EMP,'Conceptos básicos de soldadura.',1,1),
  (@p_Auxiliar_Herrero,@EMP,'Seguridad industrial y manipulación de metales.',2,1),
  (@p_Auxiliar_Herrero,@EMP,'matematicas basica',3,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Auxiliar_Herrero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Herrero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Herrero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Herrero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Herrero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Herrero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Auxiliar_Herrero,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Herrero,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Quemaduras' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Auxiliar_Herrero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1);


-- ── Oficial Plegador ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Oficial Plegador',NULL,1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='PLEG' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Savio' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Plegador');
SET @p_Oficial_Plegador = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Plegador' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Oficial_Plegador AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Oficial_Plegador AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Oficial_Plegador AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Oficial_Plegador AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Oficial_Plegador AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Oficial_Plegador AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Oficial_Plegador AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Oficial_Plegador AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Oficial_Plegador AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Plegador,@EMP,'Cumplir el 100 % del plan de producción diario y semanal asignado, dentro de los parámetros de calidad y tiempos definidos',0,1),
  (@p_Oficial_Plegador,@EMP,'Mantener niveles de stock óptimos de materiales e insumos, evitando faltantes o excesos',1,1),
  (@p_Oficial_Plegador,@EMP,'Promover la eficiencia productiva mediante la reducción de tiempos improductivos, el orden y la aplicación de herramientas de mejora continua (5S, Lean, estandarización).',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Oficial_Plegador,@EMP,'chequear que heladeras se van a producir',0,0,1),
  (@p_Oficial_Plegador,@EMP,'cortar todas las chapas de cada equipo siguiendo las hoja de produccion',1,0,1),
  (@p_Oficial_Plegador,@EMP,'pasar todas las chapas al plegador junto con las hoja de produccion',2,0,1),
  (@p_Oficial_Plegador,@EMP,'contar con stock de todas las medidas a producir',3,0,1),
  (@p_Oficial_Plegador,@EMP,'limpiar sector de trabajo',4,0,1),
  (@p_Oficial_Plegador,@EMP,'completar planilas',5,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Oficial_Plegador,@EMP,'RESPONSABILIDAD','verificar que realizo correctamente todos los cortes',0,1),
  (@p_Oficial_Plegador,@EMP,'RESPONSABILIDAD','supervisar al ayudante/plegador',1,1),
  (@p_Oficial_Plegador,@EMP,'RESPONSABILIDAD','informar a un supervisor cualquier problema o defecto con materiales o producto finalizado',2,1),
  (@p_Oficial_Plegador,@EMP,'RESPONSABILIDAD','mantener el orden y limpieza de su puesto (cumplindo las normas 5s)',3,1),
  (@p_Oficial_Plegador,@EMP,'RESPONSABILIDAD','completar documento o registro',4,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Plegador,@EMP,'responsabilidad sobre su trabajo y ayudante',0,1),
  (@p_Oficial_Plegador,@EMP,'atencion al detalle',1,1),
  (@p_Oficial_Plegador,@EMP,'Organización: Capacidad para estimar el tiempo',2,1),
  (@p_Oficial_Plegador,@EMP,'Habilidades manuales: Destreza manual y precisión para trabajar con exactitud',3,1),
  (@p_Oficial_Plegador,@EMP,'presicion en el uso de herramientas de medicion y corte',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Plegador,@EMP,'conocimientos del uso de plegadora y guillotina',0,1),
  (@p_Oficial_Plegador,@EMP,'saber leer e interpretar planos , matematica basica',1,1),
  (@p_Oficial_Plegador,@EMP,'seguridad industrial',2,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Oficial_Plegador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Oficial_Plegador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Oficial_Plegador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Oficial_Plegador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Oficial_Plegador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Oficial_Plegador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Oficial_Plegador,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1),
  (@p_Oficial_Plegador,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Cortes en extremidades' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Oficial_Plegador,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Plegador,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guantes' LIMIT 1),@EMP,1,1);


-- ── Auxiliar Plegador ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Auxiliar Plegador','Tomar las chapas que le pase el chapista oficial marcarlas y plegarlas según corresponda.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='PLEG' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Savio' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar Plegador');
SET @p_Auxiliar_Plegador = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar Plegador' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Auxiliar_Plegador AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Auxiliar_Plegador AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Auxiliar_Plegador AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Auxiliar_Plegador AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Auxiliar_Plegador AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Auxiliar_Plegador AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Auxiliar_Plegador AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Auxiliar_Plegador AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Auxiliar_Plegador AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Plegador,@EMP,'Cumplir el 100 % del plan de producción diario y semanal asignado, dentro de los parámetros de calidad y tiempos definidos',0,1),
  (@p_Auxiliar_Plegador,@EMP,'Verificar que el armador pegador tenga los paneles de chapa para su posterior pegado y terminar los ajustes finales del carpintero',1,1),
  (@p_Auxiliar_Plegador,@EMP,'Promover la eficiencia productiva mediante la reducción de tiempos improductivos, el orden y la aplicación de herramientas de mejora continua (5S, Lean, estandarización).',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Auxiliar_Plegador,@EMP,'plegar las chapas que el chapista oficial le de',0,0,1),
  (@p_Auxiliar_Plegador,@EMP,'verificar que las chapas concidan con la hoja de produccion',1,0,1),
  (@p_Auxiliar_Plegador,@EMP,'dar chapas con primeros pliegues al carpintero para que las marque según corresponda luego recibirlas para el ultimo plegado',2,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Plegador,@EMP,'RESPONSABILIDAD','mantener su lugar limpio y seguro según normas 5s',0,1),
  (@p_Auxiliar_Plegador,@EMP,'RESPONSABILIDAD','verificar que las chapas plegadas cumplan el control de calidad (golpes, rayas, etc)',1,1),
  (@p_Auxiliar_Plegador,@EMP,'RESPONSABILIDAD','completar documento o registro',2,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Plegador,@EMP,'observar detalles y errores',0,1),
  (@p_Auxiliar_Plegador,@EMP,'Prolijo',1,1),
  (@p_Auxiliar_Plegador,@EMP,'presicion en el uso de herramientas de medicion y corte',2,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Plegador,@EMP,'plegadora y guillotina',0,1),
  (@p_Auxiliar_Plegador,@EMP,'seguridad industrial',1,1),
  (@p_Auxiliar_Plegador,@EMP,'saber leer planos',2,1),
  (@p_Auxiliar_Plegador,@EMP,'matematica basica',3,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Auxiliar_Plegador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Plegador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Plegador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Plegador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Plegador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Plegador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Auxiliar_Plegador,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Plegador,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Cortes en extremidades' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Auxiliar_Plegador,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Auxiliar_Plegador,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guantes' LIMIT 1),@EMP,1,1);


-- ── Oficial Armador ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Oficial Armador','Lograr un emsamble prolijo y de calidad armando heladeras con los paneles que le provee el armador ayudante y estantes o lateros según corresponda.
Armar los burletes y herrajes en puertas según los parametros provistos por la empresa dentro de los parametros de calidad estipulados.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='ARM' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Savio' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Armador');
SET @p_Oficial_Armador = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Armador' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Oficial_Armador AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Oficial_Armador AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Oficial_Armador AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Oficial_Armador AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Oficial_Armador AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Oficial_Armador AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Oficial_Armador AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Oficial_Armador AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Oficial_Armador AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Armador,@EMP,'Cumplir el 100 % del plan de producción diario y semanal asignado, dentro de los parámetros de calidad y tiempos definidos',0,1),
  (@p_Oficial_Armador,@EMP,'verificar esten todos los paneneles de los equipos a armar',1,1),
  (@p_Oficial_Armador,@EMP,'Sugerir la eficiencia productiva mediante la reducción de tiempos improductivos, el orden y la aplicación de herramientas de mejora continua (5S, Lean, estandarización).',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Oficial_Armador,@EMP,'armar puertas (burletes y herrajes)',0,0,1),
  (@p_Oficial_Armador,@EMP,'armado de heladeras según hoja de ruta',1,0,1),
  (@p_Oficial_Armador,@EMP,'completar registros',2,0,1),
  (@p_Oficial_Armador,@EMP,'verificar que las medidas conicidan con lo estipulado en el pedido',3,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Oficial_Armador,@EMP,'RESPONSABILIDAD','mantener su lugar limpio y seguro según normas 5s',0,1),
  (@p_Oficial_Armador,@EMP,'RESPONSABILIDAD','verificar defectos de heladeras terminadas',1,1),
  (@p_Oficial_Armador,@EMP,'RESPONSABILIDAD','completar documentos o registros',2,1),
  (@p_Oficial_Armador,@EMP,'RESPONSABILIDAD','Proponer mejoras en métodos de inspección, orden del área y procesos de terminación.',3,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Armador,@EMP,'observar detalles y errores',0,1),
  (@p_Oficial_Armador,@EMP,'prolijo',1,1),
  (@p_Oficial_Armador,@EMP,'Habilidades manuales: Destreza manual y precisión para trabajar con exactitud',2,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Armador,@EMP,'armado de heladeras',0,1),
  (@p_Oficial_Armador,@EMP,'saber leer planos',1,1),
  (@p_Oficial_Armador,@EMP,'matematica basica',2,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Oficial_Armador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Oficial_Armador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Oficial_Armador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Oficial_Armador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Oficial_Armador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Oficial_Armador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Oficial_Armador,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Oficial_Armador,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Armador,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guantes' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Armador,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Gafas de Seguridad' LIMIT 1),@EMP,1,1);


-- ── Auxiliar Armador ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Auxiliar Armador','Lograr un emsamble prolijo y de calidad armando heladeras con los paneles y estantes o lateros según corresponda.
Armar los burletes y herrajes en puertas según los parametros provistos por la empresa dentro de los parametros de calidad estipulados.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='ARM' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Savio' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar Armador');
SET @p_Auxiliar_Armador = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar Armador' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Auxiliar_Armador AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Auxiliar_Armador AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Auxiliar_Armador AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Auxiliar_Armador AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Auxiliar_Armador AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Auxiliar_Armador AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Auxiliar_Armador AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Auxiliar_Armador AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Auxiliar_Armador AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Armador,@EMP,'Cumplir el 100 % del plan de producción diario y semanal asignado, dentro de los parámetros de calidad y tiempos definidos',0,1),
  (@p_Auxiliar_Armador,@EMP,'verificar esten todos materiales para sus funciones',1,1),
  (@p_Auxiliar_Armador,@EMP,'Promover la eficiencia productiva mediante la reducción de tiempos improductivos, el orden y la aplicación de herramientas de mejora continua (5S, Lean, estandarización).',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Auxiliar_Armador,@EMP,'corte de aislacion',0,0,1),
  (@p_Auxiliar_Armador,@EMP,'pegado de paneles',1,0,1),
  (@p_Auxiliar_Armador,@EMP,'armado de lateros o rejillas según corresponda',2,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Armador,@EMP,'RESPONSABILIDAD','mantener su lugar limpio y seguro según normas 5s',0,1),
  (@p_Auxiliar_Armador,@EMP,'RESPONSABILIDAD','verificar que los paneles pegados esten en las condiciones adecuada, revisar lateros o rejillas antes de pasarsela al armador oficial',1,1),
  (@p_Auxiliar_Armador,@EMP,'RESPONSABILIDAD','completar documentos o registros',2,1),
  (@p_Auxiliar_Armador,@EMP,'RESPONSABILIDAD','Proponer mejoras en métodos de inspección, orden del área y procesos de terminación.',3,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Armador,@EMP,'observar detalles y errores',0,1),
  (@p_Auxiliar_Armador,@EMP,'atento',1,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Armador,@EMP,'uso de atornilladores y pegamento',0,1),
  (@p_Auxiliar_Armador,@EMP,'seguridad industrial',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Auxiliar_Armador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Armador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Armador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Armador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Armador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Armador,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Auxiliar_Armador,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Auxiliar_Armador,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Auxiliar_Armador,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guantes' LIMIT 1),@EMP,1,1),
  (@p_Auxiliar_Armador,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Gafas de Seguridad' LIMIT 1),@EMP,1,1);


-- ── Oficial Frigorista ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Oficial Frigorista','Ejecutar las tareas técnicas de refrigeración en la fabricación de heladeras exhibidoras: armado del circuito frigorífico, soldaduras en cobre, colocación de componentes, carga de refrigerante, control de presiones, búsqueda de fugas y pruebas de funcionamiento, garantizando la performance térmica, seguridad y calidad del producto final.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='FRIG' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Frigorista');
SET @p_Oficial_Frigorista = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Frigorista' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Oficial_Frigorista AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Oficial_Frigorista AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Oficial_Frigorista AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Oficial_Frigorista AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Oficial_Frigorista AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Oficial_Frigorista AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Oficial_Frigorista AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Oficial_Frigorista AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Oficial_Frigorista AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Frigorista,@EMP,'Asegurar que el 100% de los equipos armados cumplan con los valores de vacío, presiones y carga de refrigerante especificados, sin fugas y con funcionamiento térmico correcto desde la primera prueba.',0,1),
  (@p_Oficial_Frigorista,@EMP,'Realizar las tareas de armado frigorífico, soldadura, carga y pruebas funcionales respetando los tiempos establecidos en el plan de producción diario y semanal, manteniendo estándares de calidad.',1,1),
  (@p_Oficial_Frigorista,@EMP,'Minimizar fallas de armado, fugas y correcciones posteriores logrando un índice de retrabajo inferior al valor definido por Producción, aplicando buenas prácticas de soldadura, montaje y control.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Oficial_Frigorista,@EMP,'Armar y soldar el circuito frigorífico (tuberías de cobre, filtro, capilar, evaporador, condensador, motor).',0,0,1),
  (@p_Oficial_Frigorista,@EMP,'Realizar soldadura fuerte con plata, cortes, uniones y expansión de caños según especificaciones técnicas.',1,0,1),
  (@p_Oficial_Frigorista,@EMP,'Ejecutar vacío profundo del sistema, control de estanqueidad y detección de fugas.',2,0,1),
  (@p_Oficial_Frigorista,@EMP,'Cargar refrigerantes según el tipo y peso especificado por ingeniería o el plan de producción.',3,0,1),
  (@p_Oficial_Frigorista,@EMP,'Realizar pruebas funcionales: Presiones de alta y baja',4,0,1),
  (@p_Oficial_Frigorista,@EMP,'Realizar pruebas funcionales: Consumo eléctrico',5,0,1),
  (@p_Oficial_Frigorista,@EMP,'Realizar pruebas funcionales: Arranque y operación del compresor',6,0,1),
  (@p_Oficial_Frigorista,@EMP,'Completar registros técnicos y reportar desviaciones al Supervisor de Producción.',7,0,1),
  (@p_Oficial_Frigorista,@EMP,'Cumplir normas de seguridad asociadas al uso de gases refrigerantes, elementos calientes, herramientas y electricidad.',8,0,1),
  (@p_Oficial_Frigorista,@EMP,'Mantener el área de trabajo ordenada y los equipos de refrigeración en condiciones operativas.',9,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Oficial_Frigorista,@EMP,'RESPONSABILIDAD','Rechazar componentes frigoríficos defectuosos o fuera de especificación.',0,1),
  (@p_Oficial_Frigorista,@EMP,'RESPONSABILIDAD','Detener un proceso por riesgo de fuga, mala soldadura o inconvenientes de seguridad.',1,1),
  (@p_Oficial_Frigorista,@EMP,'RESPONSABILIDAD','Solicitar insumos críticos (cobre, consumibles de soldadura, vacío, refrigerante, válvulas).',2,1),
  (@p_Oficial_Frigorista,@EMP,'RESPONSABILIDAD','Proponer mejoras técnicas e identificar problemas en el circuito frigorífico.',3,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Frigorista,@EMP,'Detección de fallas.',0,1),
  (@p_Oficial_Frigorista,@EMP,'Precisión técnica y prolijidad en las soldaduras.',1,1),
  (@p_Oficial_Frigorista,@EMP,'Responsabilidad y orden.',2,1),
  (@p_Oficial_Frigorista,@EMP,'Capacidad de trabajo bajo presión productiva.',3,1),
  (@p_Oficial_Frigorista,@EMP,'Comunicación técnica con Producción y Control Final.',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Frigorista,@EMP,'Refrigeración comercial, llenado gas R404A',0,1),
  (@p_Oficial_Frigorista,@EMP,'Lectura de planos frigoríficos.',1,1),
  (@p_Oficial_Frigorista,@EMP,'Manejo de manómetros, bomba de vacío, balanza electrónica, detector de fugas.',2,1),
  (@p_Oficial_Frigorista,@EMP,'Técnicas de soldadura fuerte con plata y manipulación de cobre.',3,1),
  (@p_Oficial_Frigorista,@EMP,'Seguridad en refrigeración y manejo de gases inflamables.',4,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Oficial_Frigorista,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Oficial_Frigorista,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Oficial_Frigorista,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Oficial_Frigorista,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Oficial_Frigorista,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Oficial_Frigorista,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Oficial_Frigorista,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1),
  (@p_Oficial_Frigorista,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Cortes en extremidades' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Oficial_Frigorista,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Frigorista,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guantes' LIMIT 1),@EMP,1,1);


-- ── Auxiliar Frigorista ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Auxiliar Frigorista','Asistir al Frigorista Oficial en tareas de apoyo operativo: preparación de materiales, corte de caños, limpieza, sujeción de componentes, armado básico y pruebas auxiliares, garantizando orden, seguridad y continuidad en el proceso de fabricación de heladeras.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='FRIG' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar Frigorista');
SET @p_Auxiliar_Frigorista = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar Frigorista' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Auxiliar_Frigorista AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Auxiliar_Frigorista AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Auxiliar_Frigorista AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Auxiliar_Frigorista AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Auxiliar_Frigorista AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Auxiliar_Frigorista AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Auxiliar_Frigorista AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Auxiliar_Frigorista AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Auxiliar_Frigorista AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Frigorista,@EMP,'Garantizar que el Frigorista Oficial disponga de caños, componentes, herramientas y consumibles en tiempo y forma, evitando demoras en el proceso de armado frigorífico.',0,1),
  (@p_Auxiliar_Frigorista,@EMP,'Cumplir correctamente con cortes, limpieza, sujeción de piezas, posicionamiento de componentes y apoyo en montaje sin errores críticos y con cero incidentes de seguridad.',1,1),
  (@p_Auxiliar_Frigorista,@EMP,'Asegurar que el sector esté ordenado, con herramientas limpias y correctamente ubicadas, promoviendo eficiencia operativa y condiciones seguras de trabajo.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Auxiliar_Frigorista,@EMP,'Preparar caños de cobre (corte, limpieza, ranurado) según indicaciones del oficial.',0,0,1),
  (@p_Auxiliar_Frigorista,@EMP,'Asistir en el armado del circuito: sujeción de piezas, colocación de aislantes, posicionamiento de componentes.',1,0,1),
  (@p_Auxiliar_Frigorista,@EMP,'Realizar tareas básicas de montaje frigorífico',2,0,1),
  (@p_Auxiliar_Frigorista,@EMP,'Mantener el área de trabajo ordenada y los equipos limpios',3,0,1),
  (@p_Auxiliar_Frigorista,@EMP,'Asegurar disponibilidad de herramientas, gases y materiales.',4,0,1),
  (@p_Auxiliar_Frigorista,@EMP,'Informar defectos visibles o riesgos de seguridad.',5,0,1),
  (@p_Auxiliar_Frigorista,@EMP,'Cumplir normas de seguridad, manejo de herramientas, EPP y manipulación de gases.',6,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Frigorista,@EMP,'RESPONSABILIDAD','Detener una operación cuando existan riesgos de quemaduras, fuga, incendio o accidente.',0,1),
  (@p_Auxiliar_Frigorista,@EMP,'RESPONSABILIDAD','Rechazar materiales con defectos evidentes antes del armado.',1,1),
  (@p_Auxiliar_Frigorista,@EMP,'RESPONSABILIDAD','Solicitar reposición de herramientas o consumibles.',2,1),
  (@p_Auxiliar_Frigorista,@EMP,'RESPONSABILIDAD','Completar registros de produccion',3,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Frigorista,@EMP,'Aprendizaje rápido y predisposición técnica.',0,1),
  (@p_Auxiliar_Frigorista,@EMP,'Orden y responsabilidad.',1,1),
  (@p_Auxiliar_Frigorista,@EMP,'Trabajo en equipo.',2,1),
  (@p_Auxiliar_Frigorista,@EMP,'Capacidad de seguir instrucciones precisas.',3,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Frigorista,@EMP,'Manejo básico de herramientas de refrigeración.',0,1),
  (@p_Auxiliar_Frigorista,@EMP,'Nociones de soldadura y manipulación de cobre.',1,1),
  (@p_Auxiliar_Frigorista,@EMP,'Seguridad con gases refrigerantes y equipos presurizados.',2,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Auxiliar_Frigorista,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Frigorista,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Frigorista,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Frigorista,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Frigorista,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Frigorista,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Auxiliar_Frigorista,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Frigorista,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Cortes en extremidades' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Auxiliar_Frigorista,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Auxiliar_Frigorista,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guantes' LIMIT 1),@EMP,1,1);


-- ── Oficial Aislación ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Oficial Aislación','Preparar, armar y completar los paneles térmicos de las heladeras exhibidoras asegurando un aislamiento uniforme, hermético y de alta eficiencia térmica.
Garantizar la correcta preparación de cavidades, aplicación de aislantes, cierre de paneles y validación dimensional, cumpliendo con los estándares de calidad, seguridad y especificaciones técnicas definidas por la empresa.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='AISL' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Aislación');
SET @p_Oficial_Aislaci_n = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Aislación' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Oficial_Aislaci_n AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Oficial_Aislaci_n AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Oficial_Aislaci_n AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Oficial_Aislaci_n AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Oficial_Aislaci_n AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Oficial_Aislaci_n AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Oficial_Aislaci_n AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Oficial_Aislaci_n AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Oficial_Aislaci_n AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Aislaci_n,@EMP,'Fabricar paneles térmicos sin fallas internas, según plan de produccion',0,1),
  (@p_Oficial_Aislaci_n,@EMP,'Cumplir al 100% con el plan de producción diario, manteniendo tiempos de ciclo y rendimiento definidos.',1,1),
  (@p_Oficial_Aislaci_n,@EMP,'Mantener el área de aislación ordenada, segura y con disponibilidad de materiales críticos, reduciendo pérdidas y tiempos improductivos.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Oficial_Aislaci_n,@EMP,'Preparar estructuras y cavidades para el proceso de aislación (limpieza, control de medidas, colocación de soportes).',0,0,1),
  (@p_Oficial_Aislaci_n,@EMP,'Colocar correctamente los elementos internos: aislante , refuerzo estructural',1,0,1),
  (@p_Oficial_Aislaci_n,@EMP,'Ejecutar el cierre de paneles térmicos, asegurando alineación, sellado y fijación correcta.',2,0,1),
  (@p_Oficial_Aislaci_n,@EMP,'Controlar dimensiones, escuadras, plomos y la presentación general del panel.',3,0,1),
  (@p_Oficial_Aislaci_n,@EMP,'Registrar paneles conformes y reportar no conformidades al Supervisor de Producción.',4,0,1),
  (@p_Oficial_Aislaci_n,@EMP,'Mantener herramientas, mesas de trabajo y moldes en condiciones seguras y limpias.',5,0,1),
  (@p_Oficial_Aislaci_n,@EMP,'Cumplir con normas de seguridad industrial, uso de EPP y manipulación de químicos.',6,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Oficial_Aislaci_n,@EMP,'RESPONSABILIDAD','Rechazar materiales aislantes o paneles que presenten fallas visibles o deformaciones.',0,1),
  (@p_Oficial_Aislaci_n,@EMP,'RESPONSABILIDAD','Detener el proceso si identifica riesgos de fuga de químicos, fallas de inyección o condiciones inseguras.',1,1),
  (@p_Oficial_Aislaci_n,@EMP,'RESPONSABILIDAD','Solicitar reposición de insumos críticos',2,1),
  (@p_Oficial_Aislaci_n,@EMP,'RESPONSABILIDAD','Proponer mejoras en métodos de armado, tiempos de ciclo y organización del área.',3,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Aislaci_n,@EMP,'Prolijidad y atención al detalle.',0,1),
  (@p_Oficial_Aislaci_n,@EMP,'Detección de fallas.',1,1),
  (@p_Oficial_Aislaci_n,@EMP,'Orden, limpieza y cumplimiento estricto de procedimientos.',2,1),
  (@p_Oficial_Aislaci_n,@EMP,'Trabajo en equipo y comunicación clara.',3,1),
  (@p_Oficial_Aislaci_n,@EMP,'Capacidad de trabajo en entornos repetitivos bajo estándares de calidad.',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Aislaci_n,@EMP,'Técnicas de colocación de aislantes.',0,1),
  (@p_Oficial_Aislaci_n,@EMP,'Lectura básica de planos y cotas.',1,1),
  (@p_Oficial_Aislaci_n,@EMP,'Identificación de defectos de fabricación.',2,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Oficial_Aislaci_n,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Oficial_Aislaci_n,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Oficial_Aislaci_n,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Oficial_Aislaci_n,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Oficial_Aislaci_n,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Oficial_Aislaci_n,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Oficial_Aislaci_n,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Oficial_Aislaci_n,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Aislaci_n,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guantes' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Aislaci_n,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Gafas de Seguridad' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Aislaci_n,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Barbijo rigido' LIMIT 1),@EMP,1,1);


-- ── Oficial Carpintero ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Oficial Carpintero','obtener cortes y terminaciones  prolijas y de calidad tanto en los frentes de melamina de las heladeras como en el armado de los armazones estructurales.
optimizar los cortes de madera para evitar tener desperdicios y aprovechar la materia prima al maximo posible.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='CARP' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Carpintero');
SET @p_Oficial_Carpintero = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Oficial Carpintero' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Oficial_Carpintero AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Oficial_Carpintero AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Oficial_Carpintero AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Oficial_Carpintero AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Oficial_Carpintero AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Oficial_Carpintero AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Oficial_Carpintero AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Oficial_Carpintero AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Oficial_Carpintero AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Carpintero,@EMP,'Cumplir el 100 % del plan de producción diario y semanal asignado, dentro de los parámetros de calidad y tiempos definidos',0,1),
  (@p_Oficial_Carpintero,@EMP,'Mantener niveles de stock óptimos de materiales e insumos, evitando faltantes o excesos',1,1),
  (@p_Oficial_Carpintero,@EMP,'Promover la eficiencia productiva mediante la reducción de tiempos improductivos, el orden y la aplicación de herramientas de mejora continua (5S, Lean, estandarización).',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Oficial_Carpintero,@EMP,'Cortar pinos para el armado de armazones',0,0,1),
  (@p_Oficial_Carpintero,@EMP,'Armar armazones de los gabinetes de aislacion',1,0,1),
  (@p_Oficial_Carpintero,@EMP,'cortar planchas de melamina según plan de produccion',2,0,1),
  (@p_Oficial_Carpintero,@EMP,'tener preparados frentes, tapas y laterales de las heladeras exibidorasen las medidas solicitadas por prodccion',3,0,1),
  (@p_Oficial_Carpintero,@EMP,'contar con stock de todas las medidas a producir',4,0,1),
  (@p_Oficial_Carpintero,@EMP,'limpiar sector de trabajo',5,0,1),
  (@p_Oficial_Carpintero,@EMP,'completar planillas',6,0,1),
  (@p_Oficial_Carpintero,@EMP,'mantener los equipos en condiciones',7,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Oficial_Carpintero,@EMP,'RESPONSABILIDAD','Proponer mejoras en métodos de inspección, orden del área y procesos de terminación.',0,1),
  (@p_Oficial_Carpintero,@EMP,'RESPONSABILIDAD','Informar desvios en la fabricacion y en el estado de las herramientas de trabajos',1,1),
  (@p_Oficial_Carpintero,@EMP,'RESPONSABILIDAD','Mantener los stock minimos de MP y producto eleborado según plan para el sector',2,1),
  (@p_Oficial_Carpintero,@EMP,'RESPONSABILIDAD','Guardar los PT de forma segura que no se dañe',3,1),
  (@p_Oficial_Carpintero,@EMP,'RESPONSABILIDAD','Utilizar los elementos de proteccion provistos por la empresa',4,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Carpintero,@EMP,'Prolijo',0,1),
  (@p_Oficial_Carpintero,@EMP,'Observador',1,1),
  (@p_Oficial_Carpintero,@EMP,'presicion en el uso de herramientas de medicion y corte',2,1),
  (@p_Oficial_Carpintero,@EMP,'Organización: Capacidad para estimar el tiempo',3,1),
  (@p_Oficial_Carpintero,@EMP,'Habilidades manuales: Destreza manual y precisión para trabajar con exactitud',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Oficial_Carpintero,@EMP,'uso de escuadradora, tupi , maquina combinada, uso de herramientas manuales',0,1),
  (@p_Oficial_Carpintero,@EMP,'carpinteria',1,1),
  (@p_Oficial_Carpintero,@EMP,'saber leer einterpretar planos , matematica basica',2,1),
  (@p_Oficial_Carpintero,@EMP,'ensambles de madera',3,1),
  (@p_Oficial_Carpintero,@EMP,'seguridad industrial',4,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Oficial_Carpintero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Oficial_Carpintero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Oficial_Carpintero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Oficial_Carpintero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Oficial_Carpintero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Oficial_Carpintero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Oficial_Carpintero,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Oficial_Carpintero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Carpintero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guantes' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Carpintero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Gafas de Seguridad' LIMIT 1),@EMP,1,1),
  (@p_Oficial_Carpintero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Barbijo rigido' LIMIT 1),@EMP,1,1);


-- ── Auxiliar Carpintero ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Auxiliar Carpintero','armar frentes y pisos de heladeras según hoja de ruta',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='CARP' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar Carpintero');
SET @p_Auxiliar_Carpintero = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar Carpintero' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Auxiliar_Carpintero AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Auxiliar_Carpintero AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Auxiliar_Carpintero AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Auxiliar_Carpintero AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Auxiliar_Carpintero AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Auxiliar_Carpintero AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Auxiliar_Carpintero AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Auxiliar_Carpintero AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Auxiliar_Carpintero AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Carpintero,@EMP,'Cumplir el 100 % del plan de producción diario y semanal asignado, dentro de los parámetros de calidad y tiempos definidos',0,1),
  (@p_Auxiliar_Carpintero,@EMP,'revisar stock del trabajo a realizar en la semana y comunicar al suoervisor de produccion cualquier faltante',1,1),
  (@p_Auxiliar_Carpintero,@EMP,'Promover la eficiencia productiva mediante la reducción de tiempos improductivos, el orden y la aplicación de herramientas de mejora continua (5S, Lean, estandarización).',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Auxiliar_Carpintero,@EMP,'chequear que heladeras se van a producir',0,0,1),
  (@p_Auxiliar_Carpintero,@EMP,'cortar toda la madera y armar frentes y pisos',1,0,1),
  (@p_Auxiliar_Carpintero,@EMP,'recibir chapas del plegador para marcar devolver para plegado final y por ultimo colocar en frentes y pisos',2,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Carpintero,@EMP,'RESPONSABILIDAD','tener listo frente y pisos para cuando el armador los necesite',0,1),
  (@p_Auxiliar_Carpintero,@EMP,'RESPONSABILIDAD','suplantar al supervisor de produccion cuando no este disponible',1,1),
  (@p_Auxiliar_Carpintero,@EMP,'RESPONSABILIDAD','informar a un supervisor cualquier problema o defecto con materiales o producto finalizado',2,1),
  (@p_Auxiliar_Carpintero,@EMP,'RESPONSABILIDAD','mantener el orden y limpieza de su puesto (cumplindo las normas 5s)',3,1),
  (@p_Auxiliar_Carpintero,@EMP,'RESPONSABILIDAD','completar documento o registro',4,1),
  (@p_Auxiliar_Carpintero,@EMP,'RESPONSABILIDAD','Proponer mejoras en métodos de inspección, orden del área y procesos de terminación.',5,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Carpintero,@EMP,'prolijidad con el ensamblado de frentes y pisos',0,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_Carpintero,@EMP,'en carpinteria y uso de herramientas varios',0,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Auxiliar_Carpintero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Carpintero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Carpintero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Carpintero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Carpintero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_Carpintero,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Auxiliar_Carpintero,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Auxiliar_Carpintero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Auxiliar_Carpintero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guantes' LIMIT 1),@EMP,1,1),
  (@p_Auxiliar_Carpintero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Gafas de Seguridad' LIMIT 1),@EMP,1,1),
  (@p_Auxiliar_Carpintero,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Barbijo rigido' LIMIT 1),@EMP,1,1);


-- ── Empaque y Revisado ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Empaque y Revisado','Realizar la inspección final de las heladeras fabricadas verificando su estado general, funcionamiento y cumplimiento de las especificaciones de calidad.
Asegurar que cada equipo esté limpio, libre de defectos y en condiciones óptimas para la venta antes de ser embalado, garantizando los estándares establecidos por el Sistema de Gestión de Calidad.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='PROD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='INSP' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Empaque y Revisado');
SET @p_Empaque_y_Revisado = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Empaque y Revisado' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Empaque_y_Revisado AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Empaque_y_Revisado AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Empaque_y_Revisado AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Empaque_y_Revisado AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Empaque_y_Revisado AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Empaque_y_Revisado AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Empaque_y_Revisado AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Empaque_y_Revisado AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Empaque_y_Revisado AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Empaque_y_Revisado,@EMP,'Garantizar que el 100% de las heladeras inspeccionadas cumplan los requisitos de calidad definidos por la empresa antes de su embalaje.',0,1),
  (@p_Empaque_y_Revisado,@EMP,'Detectar y reportar oportunamente defectos, fallas o desviaciones, evitando la salida de productos no conformes.',1,1),
  (@p_Empaque_y_Revisado,@EMP,'Mantener un área de trabajo limpia, segura y organizada, alineada a los estándares de orden y 5S',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Empaque_y_Revisado,@EMP,'Realizar la inspección visual completa de cada heladera terminada (acabados, vidrios, luces, armado, detalles,revestimientos ).',0,0,1),
  (@p_Empaque_y_Revisado,@EMP,'colocar revestimientos',1,0,1),
  (@p_Empaque_y_Revisado,@EMP,'colocar etiquetas identificatorias de la empresa',2,0,1),
  (@p_Empaque_y_Revisado,@EMP,'verificar el correcto funcionamiento de los equpos antes de embalar, asegurando el funcionamiento del motor, luces y conexiones seguras sin riesgo electrico.',3,0,1),
  (@p_Empaque_y_Revisado,@EMP,'Limpiar el producto antes del proceso de embalado, garantizando presentación comercial óptima',4,0,1),
  (@p_Empaque_y_Revisado,@EMP,'Completar el checklist de control final y registrar la conformidad del producto como apto para la venta',5,0,1),
  (@p_Empaque_y_Revisado,@EMP,'Identificar productos no conformes y comunicar las fallas al Supervisor de Producción y al sector correspondiente.',6,0,1),
  (@p_Empaque_y_Revisado,@EMP,'Cumplir las normas de seguridad, orden, limpieza y procedimientos',7,0,1),
  (@p_Empaque_y_Revisado,@EMP,'Embalar los PT asegurando la proteccion ante golpes y lluvia',8,0,1),
  (@p_Empaque_y_Revisado,@EMP,'Revision de estantes',9,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Empaque_y_Revisado,@EMP,'RESPONSABILIDAD','Rechazar cualquier producto que presente fallas, daños o desviaciones respecto a las especificaciones.',0,1),
  (@p_Empaque_y_Revisado,@EMP,'RESPONSABILIDAD','Solicitar correcciones al área correspondiente (soldadura, armado, revestimientos, vidrios ,puertas, electricidad, etc.).',1,1),
  (@p_Empaque_y_Revisado,@EMP,'RESPONSABILIDAD','Detener el proceso de embalado ante riesgos de seguridad o productos no conformes y dar aviso a supervisor',2,1),
  (@p_Empaque_y_Revisado,@EMP,'RESPONSABILIDAD','Proponer mejoras en métodos de inspección, orden del área y procesos de terminación.',3,1),
  (@p_Empaque_y_Revisado,@EMP,'RESPONSABILIDAD','Informar desvíos, tendencias de fallas y oportunidades de mejora al Supervisor de Producción y al área de Calidad',4,1),
  (@p_Empaque_y_Revisado,@EMP,'RESPONSABILIDAD','completar documentos de liberacion',5,1),
  (@p_Empaque_y_Revisado,@EMP,'RESPONSABILIDAD','completar documentos de mejora de calidad',6,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Empaque_y_Revisado,@EMP,'Atención al detalle',0,1),
  (@p_Empaque_y_Revisado,@EMP,'Responsabilidad y cumplimiento',1,1),
  (@p_Empaque_y_Revisado,@EMP,'Prolijidad y estándares de limpieza',2,1),
  (@p_Empaque_y_Revisado,@EMP,'Capacidad de detección de fallas',3,1),
  (@p_Empaque_y_Revisado,@EMP,'Trabajo en equipo y comunicación clara',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Empaque_y_Revisado,@EMP,'Control visual y dimensional básico',0,1),
  (@p_Empaque_y_Revisado,@EMP,'Conexiones eléctricas simples y criterios de seguridad eléctrica',1,1),
  (@p_Empaque_y_Revisado,@EMP,'Procedimientos de inspección y registro',2,1),
  (@p_Empaque_y_Revisado,@EMP,'Estándares de limpieza y terminación',3,1),
  (@p_Empaque_y_Revisado,@EMP,'Uso de checklist y documentación rutinaria',4,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Empaque_y_Revisado,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Empaque_y_Revisado,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Empaque_y_Revisado,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Empaque_y_Revisado,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Empaque_y_Revisado,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Empaque_y_Revisado,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Empaque_y_Revisado,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Empaque_y_Revisado,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Empaque_y_Revisado,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Guantes' LIMIT 1),@EMP,1,1);


-- ── Chofer ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Chofer','Ejecutar el transporte interno(local) y externo(viajes en ruta) de materiales, insumos y productos terminados, garantizando entregas seguras, eficientes y en tiempo.
Asegurar el correcto cuidado del vehículo asignado, el cumplimiento de las normas de tránsito, seguridad industrial y los procedimientos de logística establecidos por la empresa.',2,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='LOG' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='LOG-S' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Chofer');
SET @p_Chofer = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Chofer' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Chofer AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Chofer AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Chofer AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Chofer AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Chofer AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Chofer AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Chofer AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Chofer AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Chofer AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Chofer,@EMP,'cumplir con el 100% de las entregas pactadas con los equipos sanos en el  tiempo acordado',0,1),
  (@p_Chofer,@EMP,'lograr la satisfaccion del cliente por el trato, servicio y resolucion de problemas a la hora de entregar los equipos',1,1),
  (@p_Chofer,@EMP,'Garantizar en el trayecto de viaje una entrega segura del producto transportado, el vehiculo y los valores de la empresa',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Chofer,@EMP,'Transportar insumos y producto terminado asignados',0,0,1),
  (@p_Chofer,@EMP,'Carga y descarga de los productos',1,0,1),
  (@p_Chofer,@EMP,'Mantener los vehiculos en condiciones',2,0,1),
  (@p_Chofer,@EMP,'Completar ducomentos provistos por la empresa',3,0,1),
  (@p_Chofer,@EMP,'Revision de los elementos provistos para el viaje',4,0,1),
  (@p_Chofer,@EMP,'Mantener los sectores de logistica ordenados y limpios',5,0,1),
  (@p_Chofer,@EMP,'Asegurar la carga de forma segura con suncho y elementos de sujecion provistos por la empresa',6,0,1),
  (@p_Chofer,@EMP,'Verificar que se realice  la cobranza de los equipos entregados y servis',7,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Chofer,@EMP,'RESPONSABILIDAD','Conducir de forma segura bajo las normas viales vigente',0,1),
  (@p_Chofer,@EMP,'RESPONSABILIDAD','Transportar equipos he insumos de forma segura y eficiente',1,1),
  (@p_Chofer,@EMP,'RESPONSABILIDAD','Cuidar los vehiculos, herramientas, artefactos para garantias provistaas por la empresa limpios y en buenas condiciones',2,1),
  (@p_Chofer,@EMP,'RESPONSABILIDAD','Asignar quien tomara el volante en caso de estar imposibilitao de hacerlo, y controlar que ambos esten descansados al emprender el viaje',3,1),
  (@p_Chofer,@EMP,'RESPONSABILIDAD','Rendicion de gastos de viaticos y cobranzas',4,1),
  (@p_Chofer,@EMP,'RESPONSABILIDAD','Entregar el vehiculo con tanque lleno',5,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Chofer,@EMP,'Proactivo',0,1),
  (@p_Chofer,@EMP,'Atento',1,1),
  (@p_Chofer,@EMP,'Cordial',2,1),
  (@p_Chofer,@EMP,'Amable',3,1),
  (@p_Chofer,@EMP,'comercial',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Chofer,@EMP,'Carnet de conducir B1 o superior',0,1),
  (@p_Chofer,@EMP,'Reparacion he instalacion de heladeras comerciales',1,1),
  (@p_Chofer,@EMP,'Mantenimiento preventivo de vehiculos',2,1),
  (@p_Chofer,@EMP,'leyes de transito',3,1),
  (@p_Chofer,@EMP,'mecanica basica',4,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Chofer,@EMP,'EXTERNO','Clientes',0,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Chofer,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Chofer,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Chofer,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Chofer,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Chofer,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Chofer,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Chofer,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Chofer,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Chofer,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Faja de Seguridad' LIMIT 1),@EMP,1,1);


-- ── Auxiliar de Chofer ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Auxiliar de Chofer','Ejecutar el transporte interno(local) y externo(viajes en ruta) de materiales, insumos y productos terminados, garantizando entregas seguras, eficientes y en tiempo.
Asegurar el correcto cuidado del vehículo asignado, el cumplimiento de las normas de tránsito, seguridad industrial y los procedimientos de logística establecidos por la empresa.',2,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='LOG' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='LOG-S' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-3' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-06' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Taller Guanahani' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar de Chofer');
SET @p_Auxiliar_de_Chofer = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Auxiliar de Chofer' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Auxiliar_de_Chofer AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Auxiliar_de_Chofer AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Auxiliar_de_Chofer AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Auxiliar_de_Chofer AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Auxiliar_de_Chofer AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Auxiliar_de_Chofer AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Auxiliar_de_Chofer AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Auxiliar_de_Chofer AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Auxiliar_de_Chofer AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_de_Chofer,@EMP,'cumplir con el 100% de las entregas pactadas con los equipos sanos en el  tiempo acordado',0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'lograr la satisfaccion del cliente por el trato, servicio y resolucion de problemas a la hora de entregar los equipos y o servise',1,1),
  (@p_Auxiliar_de_Chofer,@EMP,'ser soporte del chofer facilitando sus laboras como copiloto , verificando rutas y trayectos , estaciones de servicio cercanas y llevando de manera prolija los gastos en viaje',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Auxiliar_de_Chofer,@EMP,'Carga y descarga de los productos',0,0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'instalar equipos en cliente',1,0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'Mantener los vehiculos en condiciones',2,0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'Completar documentos provistos por la empresa',3,0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'Revision de los elementos provistos para el viaje',4,0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'Mantener los sectores de logistica ordenados y limpios',5,0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'Asegurar la carga de forma segura con suncho y elementos de sujecion provistos por la empresa',6,0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'Verificar que se realice  la cobranza de los equipos entregados y servis.',7,0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'Registrar incidencias en el viaje',8,0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'informar al area de logistica cuando esta por llegar la mercaderia a destino y cuando parte a nuevo destino',9,0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'guardar recibos de gastos y viaticos',10,0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'explicar al cliente el funcionamiento del equipo instalado',11,0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'revisar el equipo entregado, repasar posible suciedad, colocar los estantes a los productos instalados',12,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Auxiliar_de_Chofer,@EMP,'RESPONSABILIDAD','Asistir al conductor en lo que necesite',0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'RESPONSABILIDAD','verificar la ruta para trasportar equipos he insumos de forma segura y eficiente',1,1),
  (@p_Auxiliar_de_Chofer,@EMP,'RESPONSABILIDAD','Cuidar los vehiculos, herramientas, artefactos para garantias provistaas por la empresa tenerlos  limpios y en buenas condiciones',2,1),
  (@p_Auxiliar_de_Chofer,@EMP,'RESPONSABILIDAD','Asignar quien tomara el volante en caso de estar imposibilitao de hacerlo, y controlar que ambos esten descansados al emprender el viaje',3,1),
  (@p_Auxiliar_de_Chofer,@EMP,'RESPONSABILIDAD','Guardar comprobantes para Rendicion de gastos de viaticos y cobranzas',4,1),
  (@p_Auxiliar_de_Chofer,@EMP,'RESPONSABILIDAD','Entregar el vehiculo con tanque lleno',5,1),
  (@p_Auxiliar_de_Chofer,@EMP,'RESPONSABILIDAD','consultar al encargado de logistica rutas seguras',6,1),
  (@p_Auxiliar_de_Chofer,@EMP,'RESPONSABILIDAD','cargar los datos en el tricom',7,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_de_Chofer,@EMP,'Proactivo',0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'Atento',1,1),
  (@p_Auxiliar_de_Chofer,@EMP,'Cordial',2,1),
  (@p_Auxiliar_de_Chofer,@EMP,'Amable',3,1),
  (@p_Auxiliar_de_Chofer,@EMP,'comercial',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Auxiliar_de_Chofer,@EMP,'Carnet de conducir B1 o superior',0,1),
  (@p_Auxiliar_de_Chofer,@EMP,'Reparacion he instalacion de heladeras comerciales',1,1),
  (@p_Auxiliar_de_Chofer,@EMP,'Mantenimiento preventivo de vehiculos',2,1),
  (@p_Auxiliar_de_Chofer,@EMP,'leyes de transito',3,1),
  (@p_Auxiliar_de_Chofer,@EMP,'mecanica basica',4,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Auxiliar_de_Chofer,@EMP,'EXTERNO','Clientes',0,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Auxiliar_de_Chofer,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Auxiliar_de_Chofer,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_de_Chofer,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_de_Chofer,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en equipo' LIMIT 1),@EMP,1),
  (@p_Auxiliar_de_Chofer,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Responsabilidad' LIMIT 1),@EMP,1),
  (@p_Auxiliar_de_Chofer,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad' LIMIT 1),@EMP,1);

INSERT INTO puesto_riesgo (puesto_id,riesgo_id,empresa_id,activo) VALUES
  (@p_Auxiliar_de_Chofer,(SELECT id FROM riesgos WHERE empresa_id=@EMP AND nombre='Golpes contra objetos' LIMIT 1),@EMP,1);

INSERT INTO puesto_epp (puesto_id,epp_id,empresa_id,activo,obligatorio) VALUES
  (@p_Auxiliar_de_Chofer,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Calzado' LIMIT 1),@EMP,1,1),
  (@p_Auxiliar_de_Chofer,(SELECT id FROM epp WHERE empresa_id=@EMP AND nombre='Faja de Seguridad' LIMIT 1),@EMP,1,1);


-- ── Responsable de Operaciones y Desarrollo Organizacional ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Responsable de Operaciones y Desarrollo Organizacional','Supervisar las operaciones diarias para asegurar la eficiencia y el rendimiento general de la empresa, desarrollando estrategias, gestionando recursos, optimizando flujos de trabajo y liderando equipos.
Evalúa las necesidades de la empresa, diseñar e implementar estrategias para mejorar la eficacia y el desempeño, lidera la gestión del cambio, y desarrollar programas de capacitación y desarrollo de talento.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='OPS' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='OPSD' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='OPS-S' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-1' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-02' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Oficinas Centrales' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Responsable de Operaciones y Desarrollo Organizacional');
SET @p_Responsable_de_Operaciones_y_Desarrollo_Organizacional = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Responsable de Operaciones y Desarrollo Organizacional' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Aumentar la productividad: Optimizando los recursos y procesos y para que se realicen de forma más rápida y efectiva, mejorando los costos y detectando ineficiencias.',0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Diseñar, gestionar y mantener un Sistema de Gestión Documental (SGD) para los procesos operativos y administrativos a través de Procedimientos e Instructivos validados y aprobados.',1,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Mejorar la calidad: Asegurando que los procesos cumplan con estándares de calidad y generen resultados óptimos, identificando áreas de mejora y diseñando soluciones desde herramientas de Mejora Continua.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Análisis y evaluación: Investigar y evaluar los procesos existentes para comprender cómo funcionan, identificar puntos débiles, riesgos y oportunidades de mejora.',0,0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Documentación: Crear y actualizar la documentación de los procesos en un Sistema de Gestión Documental, incluyendo Procedimientos, Manuales, Políticas e Instructivos de trabajo.',1,0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Optimización: Diseñar y proponer soluciones para mejorar los procesos, buscando hacerlos más eficientes, productivos y alineados con los objetivos estratégicos.',2,0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Implementación: Colaborar en la puesta en marcha de nuevos procesos y en la implementación de las mejoras definidas, asegurando que se sigan los pasos correctos y los estándares establecidos.',3,0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Gestión de cambio: Capacitar al personal involucrado para que adopten y comprendan los nuevos procesos, facilitando la transición, fomentando una cultura organizacional de mejora continua.',4,0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Monitoreo y control: Auditar y realizar el  seguimientos necesario para asegurar el cumplimiento de los procesos actualizados y que las mejoras sean sostenibles a largo plazo.',5,0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Detectar necesidades de Capacitación y Formación del personal involucrado en los cambios requeridos y llevar adelante las gestiones requeridas para eliminar el GAP que pudiera evidenciarse.',6,0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Identificar riesgos: Descubrir vulnerabilidades en los procesos que puedan generar problemas.',7,0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Planificación y estrategia: Formular e implementar políticas y procedimientos, y participar en la planificación estratégica para alcanzar los objetivos estratégicos establecidos.',8,0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Análisis de rendimiento: Solicitar y revisar informes para medir la productividad, identificar áreas de mejora y evaluar el logro de metas.',9,0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Monitorear y evaluar el desempeño de los empleados y la efectividad de los programas implementados, utilizando datos y retroalimentación para realizar ajustes.',10,0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Asegurar que la estrategia de la empresa esté alineada con el personal, las recompensas, las métricas y los procesos de gestión.',11,0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Trabajar estrechamente con otros departamentos y la alta dirección para obtener apoyo y asegurar la implementación exitosa de las iniciativas.',12,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'RESPONSABILIDAD','Impulsar el cambio organizacional hacia la mejora continua y el enfoque a procesos.',0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'RESPONSABILIDAD','Liderar y generar las actividades de formacion y capacitacion para mejorar las habiliadades necesarias para incrementar la performance y la calidad de los procesos.',1,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'RESPONSABILIDAD','Asegurar la particpacion de los colaboradores en la Gestion de Cambio.',2,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'RESPONSABILIDAD','Lograr disciplina y estandarizacion en las activades que sinergien hacia los procesos de mejora y calidad.',3,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'RESPONSABILIDAD','Diseñar procesos internos conforme la politica de calidad establecidad, siguiendo los lineamientos y directrices especificadas, logrando que la organización se convierta en una empresa agil, adaptable y de aprendizaje permanente.',4,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Planificación Estratégica',0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Comunicación',1,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Organización y planificación',2,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Normas de Gestión de Calidad',0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Armado, Diseño y Gestión de Tableros de Comando',1,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Mejora Continua',2,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Metodologías Agiles.',3,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'Estadística aplicada.',4,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'INTERNO','Toda la organización',0,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,@EMP,'EXTERNO','Proveedores Externos.',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Liderazgo' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Pensamiento Estratégico' LIMIT 1),@EMP,1),
  (@p_Responsable_de_Operaciones_y_Desarrollo_Organizacional,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Trabajo en Equipo' LIMIT 1),@EMP,1);


-- ── Analista de Cobranzas ──
INSERT INTO puestos (empresa_id,nombre,mision,volumen_dotacion,activo,version,area_id,departamento_id,sector_id,banda_jerarquica_id,nivel_jerarquico_id,lugar_trabajo_id)
SELECT @EMP,'Analista de Cobranzas','Gestionar de forma integral la cartera de cuentas por cobrar, realizando el seguimiento de pagos, la comunicación con clientes y la resolución de incidencias de cobranza, con el fin de asegurar la recuperación de ingresos y mantener un flujo financiero estable para la empresa.',1,1,1,(SELECT id FROM areas WHERE empresa_id=@EMP AND codigo='ADM' LIMIT 1),(SELECT id FROM departamentos WHERE empresa_id=@EMP AND codigo='ADMF' LIMIT 1),(SELECT id FROM sectores WHERE empresa_id=@EMP AND codigo='COB' LIMIT 1),(SELECT id FROM bandas_jerarquicas WHERE empresa_id=@EMP AND codigo='D-2' LIMIT 1),(SELECT id FROM niveles_jerarquicos WHERE empresa_id=@EMP AND codigo='NIV-04' LIMIT 1),(SELECT id FROM lugares_trabajo WHERE empresa_id=@EMP AND nombre='Oficinas Centrales' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM puestos WHERE empresa_id=@EMP AND nombre='Analista de Cobranzas');
SET @p_Analista_de_Cobranzas = (SELECT id FROM puestos WHERE empresa_id=@EMP AND nombre='Analista de Cobranzas' LIMIT 1);

DELETE FROM objetivos_puesto    WHERE puesto_id=@p_Analista_de_Cobranzas AND empresa_id=@EMP;
DELETE FROM tareas_puesto        WHERE puesto_id=@p_Analista_de_Cobranzas AND empresa_id=@EMP;
DELETE FROM responsabilidades_puesto WHERE puesto_id=@p_Analista_de_Cobranzas AND empresa_id=@EMP;
DELETE FROM habilidades_puesto   WHERE puesto_id=@p_Analista_de_Cobranzas AND empresa_id=@EMP;
DELETE FROM conocimientos_puesto WHERE puesto_id=@p_Analista_de_Cobranzas AND empresa_id=@EMP;
DELETE FROM contactos_puesto     WHERE puesto_id=@p_Analista_de_Cobranzas AND empresa_id=@EMP;
DELETE FROM puesto_competencia   WHERE puesto_id=@p_Analista_de_Cobranzas AND empresa_id=@EMP;
DELETE FROM puesto_riesgo        WHERE puesto_id=@p_Analista_de_Cobranzas AND empresa_id=@EMP;
DELETE FROM puesto_epp           WHERE puesto_id=@p_Analista_de_Cobranzas AND empresa_id=@EMP;

INSERT INTO objetivos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Analista_de_Cobranzas,@EMP,'Asegurar la recuperacion oportuna de los Creditos Personales otorgados, realizando el seguimiento de las cuentas por cobrar y gestionando los pagos pendientes.',0,1),
  (@p_Analista_de_Cobranzas,@EMP,'Reducir los niveles de morosidad, mediante la comunicación proactiva con los clientes y la implementacion de acciones de seguimiento y recordatorios de pago.',1,1),
  (@p_Analista_de_Cobranzas,@EMP,'Detectar situaciones de riesgo o retrasos en los pagos, facilitando la toma de decisiones financieras dentro de la empresa.',2,1);

INSERT INTO tareas_puesto (puesto_id,empresa_id,nombre,orden,obligatoria,activo) VALUES
  (@p_Analista_de_Cobranzas,@EMP,'Realizar el seguimiento periodico de las cuentas por cobrar, verificando y agendando vencimientos y detectando pagos pendientes.',0,0,1),
  (@p_Analista_de_Cobranzas,@EMP,'Contactar a clientes por distintos medios (WhatsApp, telefonicamente, etc) para recordar vencimientos y gestionar cobranzas.',1,0,1),
  (@p_Analista_de_Cobranzas,@EMP,'Registrar y actualizar la informacion de pagos recibidos en las planillas correspondientes.',2,0,1),
  (@p_Analista_de_Cobranzas,@EMP,'Controlar el estado de cuenta de los clientes, identificando atrasos o diferencias en los pagos.',3,0,1),
  (@p_Analista_de_Cobranzas,@EMP,'Gestionar acuerdos de refinanciacion para la cancelacion de deuda, realizando seguimiento hasta su cumplimiento.',4,0,1);

INSERT INTO responsabilidades_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Analista_de_Cobranzas,@EMP,'RESPONSABILIDAD','Garantizar el seguimiento y gestion adecuada de la cartera de cuentas por cobrar de la empresa.',0,1),
  (@p_Analista_de_Cobranzas,@EMP,'RESPONSABILIDAD','Mantener una comunicación clara, profesional y acertiva con los clientes durante el proceso de cobranza.',1,1),
  (@p_Analista_de_Cobranzas,@EMP,'RESPONSABILIDAD','Asegurar la actualizacion correcta de la informacion de cobranzas y estados de cuenta de los clientes.',2,1),
  (@p_Analista_de_Cobranzas,@EMP,'RESPONSABILIDAD','Realizar el control y monitoreo de los pagos pendientes, identificando atrasos o situaciones de morosidad o incobrabilidad.',3,1),
  (@p_Analista_de_Cobranzas,@EMP,'RESPONSABILIDAD','Contribuir al orden administrativo y financiero mediante el registro correcto de las cobranzas realizadas.',4,1),
  (@p_Analista_de_Cobranzas,@EMP,'RESPONSABILIDAD','Contactar y realizar gestiones de cobranza directamente con los clientes haciendo uso de los medios establecidos por la empresa.',5,1),
  (@p_Analista_de_Cobranzas,@EMP,'RESPONSABILIDAD','Proponer acuerdos o compromisos de pago dentro de las politicas y estandares establecidos por la empresa.',6,1),
  (@p_Analista_de_Cobranzas,@EMP,'RESPONSABILIDAD','Aplicar intereses punitorios a discrecion del titular de puesto dentro de los estandares establecidos por la empresa.',7,1),
  (@p_Analista_de_Cobranzas,@EMP,'RESPONSABILIDAD','Acceder y gestionar la informacion necesaria en sistemas, registros o planillas de cobranzas para el cumplimiento de sus funciones.',8,1);

INSERT INTO habilidades_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Analista_de_Cobranzas,@EMP,'Comunicación asertiva',0,1),
  (@p_Analista_de_Cobranzas,@EMP,'Organización y planificacion',1,1),
  (@p_Analista_de_Cobranzas,@EMP,'Empatía',2,1),
  (@p_Analista_de_Cobranzas,@EMP,'Capacidad de negociacion',3,1),
  (@p_Analista_de_Cobranzas,@EMP,'Confidencialidad',4,1);

INSERT INTO conocimientos_puesto (puesto_id,empresa_id,descripcion,orden,activo) VALUES
  (@p_Analista_de_Cobranzas,@EMP,'Proactividad y seguimiento constante de los compromisos de pago',0,1),
  (@p_Analista_de_Cobranzas,@EMP,'Conocimiento de procesos administrativos y gestion de cobranzas.',1,1),
  (@p_Analista_de_Cobranzas,@EMP,'Manejo de registro y control de cuentas por cobrar.',2,1),
  (@p_Analista_de_Cobranzas,@EMP,'Herramientas informaticas',3,1),
  (@p_Analista_de_Cobranzas,@EMP,'Comprension de procedimientos administrativos y financieros basicos.',4,1);

INSERT INTO contactos_puesto (puesto_id,empresa_id,tipo,descripcion,orden,activo) VALUES
  (@p_Analista_de_Cobranzas,@EMP,'INTERNO','Administracion, Logistica, Post Venta, Comercial, Garantias.',0,1),
  (@p_Analista_de_Cobranzas,@EMP,'EXTERNO','Clientes',1,1);

INSERT INTO puesto_competencia (puesto_id,competencia_id,empresa_id,activo) VALUES
  (@p_Analista_de_Cobranzas,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Compromiso' LIMIT 1),@EMP,1),
  (@p_Analista_de_Cobranzas,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Calidad del trabajo' LIMIT 1),@EMP,1),
  (@p_Analista_de_Cobranzas,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Integridad' LIMIT 1),@EMP,1),
  (@p_Analista_de_Cobranzas,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Planificación y Organización' LIMIT 1),@EMP,1),
  (@p_Analista_de_Cobranzas,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Habilidades Técnico / Funcionales' LIMIT 1),@EMP,1),
  (@p_Analista_de_Cobranzas,(SELECT id FROM competencias WHERE empresa_id=@EMP AND nombre='Productividad y Responsabilidad' LIMIT 1),@EMP,1);

