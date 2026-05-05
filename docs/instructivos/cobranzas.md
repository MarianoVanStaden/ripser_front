# Módulo de Cobranzas — Manual de Usuario

## ¿Qué hace este módulo?

Gestiona la recuperación de cuotas vencidas de **créditos personales**. Cuando un préstamo entra en mora, el sistema abre una **gestión de cobranza**, en la que cada usuario va registrando llamadas, visitas, promesas de pago y recordatorios hasta que la deuda se recupera, se deriva a legal o se da por incobrable.

El módulo tiene tres pantallas, ligadas entre sí:

```
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│  Resumen Cobranzas   │ →  │  Listado Gestiones   │ →  │  Detalle de Gestión  │
│  (KPIs + deep-links) │    │  (filtros + bulk)    │    │  (acciones, promesas)│
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
        ↑                              ↑                              │
        └──────────────────────────────┴──────────────────────────────┘
                            (botones "Volver")
```

---

## 1. Resumen de Cobranzas

**Ruta:** `/cobranzas/resumen` · **Menú:** Cobranzas → Resumen Cobranzas

Panel de KPIs de toda la cartera morosa. Cada card es un **link clickeable**: al apretarla, te lleva al Listado con el filtro ya aplicado.

### KPIs principales

| KPI | Significado | Click te lleva a |
|---|---|---|
| **Gestiones Activas** | Total de gestiones con `activa = true`. | Listado, todas las activas. |
| **Monto Total Pendiente** | Suma de `montoPendiente` de las activas. | Listado ordenado por monto descendente. |
| **Promesas Incumplidas** | Clientes que prometieron pagar y no lo hicieron (`fechaPromesa < hoy` y siguen VIGENTE/INCUMPLIDA). | Listado filtrado por promesas incumplidas. |
| **Vencidas Hoy** | Gestiones cuya `fechaProximaGestion <= hoy` (atrasadas o de hoy). | Listado con preset "Vencidas". |
| **Recordatorios Pendientes** | Recordatorios sin completar asignados al usuario. | Listado filtrado por gestiones con recordatorios pendientes. |
| **Promesas Vencen Hoy** | Promesas VIGENTES con `fechaPromesa = hoy` (revisar si cumplieron). | Listado filtrado por promesas que vencen hoy. |
| **Sin Gestión con Mora** | Préstamos con cuotas vencidas que **no** tienen gestión activa abierta. Indicador de huecos. | Listado de activas (referencial). |
| **Cuotas Vencidas Total** | Cantidad de cuotas en estado VENCIDA en toda la empresa. | Listado de gestiones con mora. |

### Por Estado

Debajo de los KPIs principales, hay una grilla con la cantidad de gestiones activas en cada estado. Click en cada card → Listado filtrado por ese estado.

> **Tip:** El botón **Actualizar** recarga los KPIs sin recargar la página. Conviene apretarlo después de cerrar gestiones masivamente.

---

## 2. Listado de Gestiones

**Ruta:** `/cobranzas/lista` · **Menú:** Cobranzas → Gestiones Cobranzas

Tabla paginada con todas las gestiones, filtros server-side y operaciones masivas.

### Filtros disponibles

Todos los filtros se reflejan en la URL — podés copiar y pegar el link para compartir una vista filtrada.

| Filtro | Cómo se usa |
|---|---|
| **Buscar por cliente** | Cuadro de búsqueda. Hace match sobre nombre, apellido y teléfono del cliente. Tiene debounce de 300 ms. |
| **Solo activas** | Switch arriba. Cuando está activado (default) consulta `/api/gestiones-cobranza`; apagado consulta `/historial` (incluye cerradas). |
| **Estado** | Chips multi-selección. Selecciona uno o varios estados. |
| **Próxima gestión** (presets) | Chips: Vencidas / Hoy / Mañana / Esta semana / Próximos 7 / Este mes / Sin fecha. Mutuamente excluyentes con el rango personalizado. |
| **Rango personalizado** | Selectores Desde/Hasta. Al elegir uno, los chips de preset se desactivan. |
| **Prioridad** | Chips Alta / Media / Baja, multi-selección. |
| **Filtros activos (deep-links)** | Cuando llegás desde una card del Resumen (ej: "Promesas incumplidas"), aparece un chip extra con `onDelete` para sacar el filtro. |

### Semántica de los presets de fecha

Atención: los presets filtran por **`fechaProximaGestion`**, no por fecha de creación ni de vencimiento de cuotas.

- **Vencidas**: `fechaProximaGestion < hoy` (gestiones atrasadas).
- **Hoy**: `fechaProximaGestion = hoy` exacto.
- **Mañana**: `fechaProximaGestion = hoy + 1`.
- **Esta semana**: lunes a domingo de la semana en curso.
- **Próximos 7**: hoy hasta hoy+7.
- **Este mes**: día 1 al último día del mes en curso.
- **Sin fecha**: gestiones donde `fechaProximaGestion` está vacío.

> Si "Hoy" trae muchos registros, es porque la `fechaProximaGestion` de esas gestiones se setea automáticamente al registrar acciones con próximo contacto = hoy o promesas de pago con `fechaPromesa = hoy`.

### Columnas de la tabla

`Cliente · Teléfono · Días Mora · Monto Pendiente · Estado · Prioridad · Próxima Gestión · Acc. (acciones registradas) · Recor. (recordatorios pendientes) · Acciones`

Las columnas con flecha en el header son ordenables (Días Mora, Monto, Estado, Prioridad, Próxima Gestión). El orden default es por fecha de apertura descendente.

### Acciones por fila

| Icono | Acción |
|---|---|
| 📞 (verde) | Registrar acción de cobranza (abre diálogo). |
| ⏰ (naranja) | Crear recordatorio. |
| ✅ (azul) | Cerrar gestión: abre menú con los estados de cierre (Recuperada / Incobrable / En Legal / Acuerdo Cuotas). |
| 👁 | Ver detalle. |
| Click en la fila | También navega al detalle. |

Las gestiones cerradas (`activa = false`) muestran los iconos de acción/recordatorio/cierre **deshabilitados**.

### Operaciones masivas (bulk)

Al tildar el checkbox de una o más filas, aparece una **barra fija arriba de la tabla** con:

- **Cambiar prioridad**: aplica Alta / Media / Baja a todas las seleccionadas.
- **Cerrar selección**: cierra todas con el mismo estado de cierre. Pide confirmación.

Cada operación corre fila por fila en su propia transacción — si una falla, el resto se procesa igual y al final ves un snackbar con el resultado (ej: "12 gestiones cerradas, 1 falló"). El backend devuelve la lista de IDs ok/falla.

> **Nota:** las gestiones ya cerradas no se pueden seleccionar para bulk (el checkbox aparece deshabilitado).

### Botón "Nueva Gestión" (arriba a la derecha)

Abre el diálogo para crear una gestión manualmente, eligiendo un crédito personal **en mora** o **en legal** que aún no tenga gestión activa abierta. Campos: prioridad (opcional, sino se calcula por días de mora), monto pendiente (autocompleta con el saldo del préstamo), próxima gestión, observaciones.

> Lo normal es que las gestiones se creen automáticamente; este diálogo cubre los casos en que el motor no las abrió o se cerró antes de tiempo.

---

## 3. Detalle de Gestión

**Ruta:** `/cobranzas/:id`

Vista completa de una gestión. Se accede desde el listado o desde la pantalla del préstamo.

### Header

Nombre del cliente, número de gestión, número de préstamo (clickeable para ir al detalle del préstamo) y botón **Cerrar Gestión** (si está activa).

### Card de información

| Campo | Qué muestra |
|---|---|
| **Estado** | Chip coloreado con el estado actual. |
| **Prioridad** | Alta / Media / Baja. |
| **Días Vencido** | Snapshot al momento de apertura. |
| **Mora Actual (live)** | Suma calculada en vivo de cuotas VENCIDA + PARCIAL del préstamo. **Es el monto real adeudado, usalo para hablar con el cliente.** |
| **Días Mora Real** | Días desde la cuota vencida más antigua, calculado en vivo. |
| **Próximo Vencimiento** | Próxima cuota PENDIENTE/PARCIAL (info para anticipar). |
| **Teléfono** · **Próxima Gestión** | Datos de contacto y agenda. |
| **Promesa de Pago** | Card específica (ver más abajo). |
| **Observaciones** | Texto libre cargado al crear/editar la gestión. |

### Tabs

Cuatro pestañas, cada una sobre un aspecto de la gestión:

#### Tab "Acciones"

Historial inmutable de cada contacto realizado con el cliente.

Botón **Registrar Acción** abre un diálogo con:
- **Tipo**: Llamada / WhatsApp / SMS / Email / Visita Domicilio / Carta Documento / Notificación Legal / Acuerdo Pago / Otro.
- **Fecha y hora**: por default, ahora.
- **Resultado**: Contactado / No Contesta / Número Equivocado / Prometió Pago / Acuerdo Parcial / Negó Pago / Sin Fondos / Visita Realizada / Sin Resultado.
- **Duración (min)**: para llamadas.
- **Descripción**: texto libre.
- **Fecha próximo contacto**: si la cargás, **se copia a `fechaProximaGestion` de la gestión** (si el switch "Actualizar gestión" está activo, default).
- **Fecha promete pago**: aparece sólo cuando el resultado es Prometió Pago. Si "Actualizar gestión" está activo, además **cambia el estado de la gestión a PROMETIO_PAGO**.

Las acciones son inmutables — sólo se pueden eliminar (icono basurero), no editar. Esto es a propósito para mantener trazabilidad.

#### Tab "Recordatorios"

Lista de recordatorios pendientes y completados de la gestión. El número del tab muestra los pendientes.

Botón **Nuevo Recordatorio**:
- Fecha y hora del recordatorio.
- Tipo: Email / SMS / Tarea / Notificación / WhatsApp / Llamada.
- Prioridad: Alta / Media / Baja.
- Mensaje libre.
- Usuario asignado (opcional).

Acciones por recordatorio:
- ✅ Marcar como completado (no se puede deshacer).
- 🗑 Eliminar.

#### Tab "Historial Promesas"

Listado completo de todas las promesas de pago registradas en la gestión, con su estado (Vigente / Cumplida / Incumplida / Cancelada). Botón **Nueva Promesa** abre el diálogo (igual que la card de promesa).

#### Tab "Timeline"

Log inmutable de **todos los eventos relevantes** que pasaron sobre la gestión, con fecha y descripción. Es el registro completo a usar para auditoría o discusión interna. Eventos típicos:

- `GESTION_ABIERTA`, `GESTION_CERRADA`
- `CUOTA_VENCIDA`, `CUOTAS_EN_MORA_ACTUALIZADO`
- `PROMESA_REGISTRADA`, `PROMESA_INCUMPLIDA`, `PROMESA_CUMPLIDA`, `PROMESA_CANCELADA`
- `PAGO_PARCIAL_REGISTRADO`, `PAGO_TOTAL_REGISTRADO`
- `PRIORIDAD_ESCALADA`, `AGENTE_ASIGNADO`
- `ACUERDO_CUOTAS_CREADO`, `DERIVADO_LEGAL`

> Los eventos los genera el backend automáticamente. No se pueden editar desde la UI.

### Card de Promesa Vigente

En la card de info principal, debajo, hay una sección con la **promesa vigente** (sólo puede haber una por gestión a la vez):

- Sin promesa vigente → botón **Registrar Promesa**.
- Con promesa vigente → muestra fecha, monto, observaciones, días que faltan/se atrasaron, y botón **Cancelar promesa**.

El diálogo de **Registrar Promesa** pide:
- Fecha prometida (debe ser **mayor** a hoy).
- Monto prometido.
- Cuotas incluidas (selector múltiple sobre las cuotas pendientes/parciales del préstamo).
- Observaciones.

Al registrar:
- Si había una promesa vigente anterior, **se cancela automáticamente**.
- El estado de la gestión pasa a **PROMETIO_PAGO**.
- La `fechaProximaGestion` se setea = `fechaPromesa`.
- Se emite un evento `PROMESA_REGISTRADA` en el timeline.

---

## Estados de la gestión

| Estado | Cuándo aplica |
|---|---|
| **NUEVA** | Recién creada, sin acciones registradas. |
| **EN_GESTION** | Ya hay contacto pero todavía no hay acuerdo. |
| **PROMETIO_PAGO** | Cliente comprometió fecha y monto (hay promesa VIGENTE). |
| **ACUERDO_CUOTAS** | Acuerdo formal de cuotas — estado de cierre. |
| **EN_LEGAL** | Derivada a estudio jurídico — estado de cierre. |
| **RECUPERADA** | Deuda cobrada — estado de cierre. |
| **INCOBRABLE** | Sin recupero posible — estado de cierre. |

Sólo NUEVA, EN_GESTION y PROMETIO_PAGO mantienen la gestión `activa = true`. Los demás cierran la gestión.

---

## Prioridades

| Prioridad | Asignación automática (motor de cobranzas) |
|---|---|
| **Alta** | Días de mora >= 60. Próxima gestión sugerida en 1 día. |
| **Media** | Mora 30–59. Próxima gestión sugerida en 3 días. |
| **Baja** | Mora < 30. Próxima gestión sugerida en 7 días. |

El motor de cobranzas re-calcula la prioridad automáticamente cada vez que se ejecuta. Si se escala (ej: pasa de Media a Alta), se registra un evento `PRIORIDAD_ESCALADA` en el timeline.

---

## Tipos de acción y resultado

### Tipos de acción

| Tipo | Uso |
|---|---|
| LLAMADA | Llamada telefónica. |
| WHATSAPP | Mensaje por WhatsApp. |
| SMS | Mensaje de texto. |
| EMAIL | Correo electrónico. |
| VISITA_DOMICILIO | Visita presencial. |
| CARTA_DOCUMENTO | Carta documento formal. |
| NOTIFICACION_LEGAL | Notificación legal enviada. |
| ACUERDO_PAGO | Acuerdo registrado. |
| OTRO | Cualquier otro contacto. |

### Resultados posibles

| Resultado | Descripción |
|---|---|
| CONTACTADO | Se habló con el cliente. |
| NO_CONTESTA | No atendió. |
| NUMERO_EQUIVOCADO | El número no corresponde. |
| PROMETIO_PAGO | Comprometió fecha (habilita campo "fecha promete pago"). |
| ACUERDO_PARCIAL | Acordó pagar parte de la deuda. |
| NEGO_PAGO | Se negó. |
| SIN_FONDOS | Manifestó no tener fondos. |
| VISITA_REALIZADA | Se concretó la visita. |
| SIN_RESULTADO | Acción realizada sin resultado claro. |

---

## Promesas de pago

| Estado | Significado |
|---|---|
| VIGENTE | Fecha aún no llegó. |
| CUMPLIDA | El cliente pagó según lo prometido. |
| INCUMPLIDA | Pasó la fecha sin pago. |
| CANCELADA | Promesa anulada manualmente o reemplazada por una nueva. |

> **Importante:** sólo puede haber **una promesa VIGENTE por gestión**. Si registrás una nueva mientras hay otra vigente, la anterior se cancela automáticamente.

El motor de cobranzas marca como INCUMPLIDAS las promesas VIGENTES con `fechaPromesa < hoy`.

---

## Flujo típico end-to-end

```
1. Apertura de la gestión
   └── Automática: el motor abre la gestión cuando el préstamo entra en mora.
   └── Manual: botón "Nueva Gestión" en el listado.

2. Primer contacto
   └── Detalle → tab Acciones → "Registrar Acción"
       (LLAMADA / WHATSAPP / VISITA, según corresponda)
   └── Si no atiende: cargar resultado NO_CONTESTA y "fecha próximo contacto".
       → la gestión queda agendada para el día siguiente.

3. Cliente promete pagar
   └── Tab Acciones → "Registrar Acción" con resultado PROMETIO_PAGO,
       cargar "fecha promete pago".
   └── O directamente: botón "Registrar Promesa" en la card de promesa
       (recomendado: te permite seleccionar las cuotas exactas).
   └── Estado de la gestión → PROMETIO_PAGO.

4. Seguimiento
   └── El día de la promesa: revisar KPI "Promesas Vencen Hoy" en el Resumen.
   └── Si pagó: cobrar en el módulo de Préstamos. La promesa se marca CUMPLIDA
       y el motor cierra la gestión como RECUPERADA si quedan saldadas las cuotas.
   └── Si no pagó: el motor marca la promesa como INCUMPLIDA al día siguiente.
       → aparece en KPI "Promesas Incumplidas". Re-gestionar.

5. Cierre
   └── Recuperada: cliente pagó toda la deuda.
   └── Acuerdo Cuotas: se firmó un nuevo plan, la gestión se cierra
       y el préstamo continúa por el flujo normal.
   └── En Legal: se deriva a estudio jurídico.
   └── Incobrable: se da por perdida (después de agotar las gestiones).
```

---

## Recordatorios vs. Próxima Gestión

Es importante no confundirlos:

- **Próxima gestión (`fechaProximaGestion`)**: es **una sola fecha por gestión** — la próxima vez que hay que tocar este caso. Define en qué chip de preset (Hoy / Mañana / etc.) aparece la gestión.
- **Recordatorios**: son **N notificaciones por gestión**, cada una con fecha, hora, tipo, prioridad y mensaje. Pueden estar asignadas a otro usuario. Sirven para "avisame el martes a las 10 que llame a Pérez".

---

## Roles y permisos

- **COBRANZAS** (rol específico): aterriza en `/cobranzas/resumen` al loguearse. Tiene acceso a todo el módulo.
- **ADMIN** y otros roles con permiso de ADMINISTRACION: ven el módulo en el menú lateral y pueden operar.

---

## Preguntas frecuentes

**¿Por qué el filtro "Hoy" me trae tantos registros?**
Porque `fechaProximaGestion` se actualiza automáticamente al registrar acciones con próximo contacto = hoy, o al crear una promesa con `fechaPromesa = hoy`. Si querés ver "lo que tengo que hacer hoy o se atrasó", usá el preset **Vencidas** o el KPI **Vencidas Hoy** del resumen (`fechaProximaGestion <= hoy`).

**¿Puedo editar una acción ya registrada?**
No. Las acciones son inmutables para mantener la trazabilidad. Sí podés eliminarlas (icono basurero) si fueron un error.

**¿Y si el cliente paga durante la gestión?**
El pago se carga en el módulo de Préstamos. La gestión puede cerrarse manualmente como RECUPERADA, y el motor de cobranzas también la cierra automáticamente cuando detecta que ya no hay mora.

**¿Qué pasa si abro una gestión y ya había una activa?**
El sistema rechaza la creación con error: **"Ya existe una gestión activa para el préstamo X"**. Sólo se permite una activa por préstamo a la vez.

**¿Cómo reasigno una gestión a otro agente?**
Por ahora la reasignación se hace vía API (PUT a la gestión con `agenteId`). En la UI todavía no hay un selector explícito.

**¿Puedo ver gestiones cerradas?**
Sí: en el Listado, apagá el switch **Solo activas**. Esto consulta el endpoint de historial e incluye Recuperadas, Incobrables, En Legal y Acuerdo Cuotas.

**¿Por qué algunas cards del Resumen no son clickeables?**
Si una card no responde al click, es porque el filtro correspondiente todavía no está soportado en el backend. Un tooltip te lo aclara.

**¿Las operaciones bulk afectan gestiones cerradas?**
No. El checkbox aparece deshabilitado en filas cerradas, y las operaciones bulk de cierre validan que la gestión esté activa antes de cerrarla.
