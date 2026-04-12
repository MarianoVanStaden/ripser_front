# Módulo de Cobranzas — Instructivo de Usuario

## Descripción general

El módulo de Cobranzas gestiona la recuperación de cuotas vencidas de préstamos. Cuando un préstamo entra en mora, se crea automáticamente una **gestión de cobranza** que permite registrar todas las acciones realizadas para cobrar la deuda: llamadas, visitas, acuerdos de pago, y escalada legal si es necesario.

---

## Pantallas disponibles

### 1. Resumen de Cobranzas

Panel con indicadores globales del estado de la cartera morosa.

**Acceso:** Menú Cobranzas → Resumen

**Contenido del panel:**
- Total de gestiones abiertas
- Monto total en mora
- Gestiones por estado y prioridad
- Tasa de recupero
- Promesas de pago vigentes
- Gestiones con vencimiento hoy / esta semana

---

### 2. Listado de Gestiones

Lista completa de todas las gestiones de cobranza.

**Acceso:** Menú Cobranzas → Lista

**Acciones disponibles:**
- Buscar por nombre o teléfono del cliente
- Filtrar por estado, prioridad y agente asignado
- Ordenar por días de mora, monto o fecha de próxima gestión
- Acceder al detalle de cada gestión

---

### 3. Detalle de Gestión de Cobranza

Vista completa de la gestión de un cliente en mora.

**Información disponible:**
- Datos del cliente y teléfono de contacto
- Préstamo asociado: monto, cuotas en mora, días de mora
- Estado de la gestión y prioridad
- Agente asignado
- Promesa de pago vigente (si existe)
- Línea de tiempo de todas las acciones realizadas
- Próxima fecha de contacto

**Acciones disponibles:**
- Registrar nueva acción (llamada, visita, email, etc.)
- Registrar promesa de pago
- Cambiar estado de la gestión
- Escalar a instancia legal
- Cerrar gestión (recuperada o incobrable)

---

## Tipos de acción de cobranza

Cada contacto o gestión realizada se registra como una acción:

| Tipo | Descripción |
|------|-------------|
| LLAMADA | Llamada telefónica al cliente |
| WHATSAPP | Mensaje por WhatsApp |
| SMS | Mensaje de texto |
| EMAIL | Correo electrónico |
| VISITA_DOMICILIO | Visita presencial al domicilio |
| CARTA_DOCUMENTO | Carta documento formal |
| NOTIFICACION_LEGAL | Notificación legal enviada |
| ACUERDO_PAGO | Acuerdo de pago formal registrado |
| OTRO | Otro tipo de gestión |

**Campos al registrar una acción:**
- Tipo de acción
- Fecha y hora
- Resultado (ver tabla abajo)
- Duración en minutos (para llamadas)
- Descripción del contacto
- Fecha del próximo contacto
- Fecha en que prometió pagar (si aplica)

---

## Resultados posibles de una acción

| Resultado | Descripción |
|-----------|-------------|
| CONTACTADO | Se habló con el cliente |
| NO_CONTESTA | No atendió / no respondió |
| PROMETIO_PAGO | Comprometió una fecha de pago |
| ACUERDO_PARCIAL | Acordó pagar parte de la deuda |
| NEGO_PAGO | Se negó a pagar |
| SIN_FONDOS | Manifestó no tener fondos |
| VISITA_REALIZADA | Se concretó la visita domiciliaria |
| SIN_RESULTADO | Acción realizada sin resultado definido |

---

## Promesas de pago

Cuando el cliente se compromete a pagar en una fecha específica, se registra una promesa de pago.

**Campos:**
- Cuotas incluidas en la promesa
- Fecha prometida
- Monto prometido

**Estados de la promesa:**
| Estado | Descripción |
|--------|-------------|
| VIGENTE | Fecha aún no llegó |
| CUMPLIDA | El cliente pagó según lo prometido |
| INCUMPLIDA | Pasó la fecha sin pago |
| CANCELADA | Promesa anulada (se renegocio o canceló) |

El sistema monitorea automáticamente si una promesa se cumple o se incumple.

---

## Estados de la gestión de cobranza

| Estado | Descripción |
|--------|-------------|
| NUEVA | Recién creada, sin acciones |
| EN_GESTION | Con acciones registradas en curso |
| PROMETIO_PAGO | Tiene promesa de pago vigente |
| ACUERDO_CUOTAS | Acuerdo formal de pago en cuotas |
| EN_LEGAL | Derivada a instancia legal |
| RECUPERADA | Deuda cobrada, gestión exitosa |
| INCOBRABLE | Se cierra sin recupero |

---

## Prioridades

| Prioridad | Cuándo se aplica |
|-----------|-----------------|
| ALTA | Mora mayor, cliente sin respuesta, alto monto |
| MEDIA | Mora moderada, cliente en contacto |
| BAJA | Mora leve, cliente comunicado |

---

## Flujo de una gestión de cobranza

```
1. Apertura automática
   └── Al vencer cuotas sin pago → se crea la gestión (estado: NUEVA)
   └── Se asigna prioridad según días de mora y monto

2. Asignación de agente
   └── Se asigna un agente de cobranza responsable

3. Gestiones de contacto
   └── Registrar cada intento de contacto (llamada, WhatsApp, visita)
   └── Estado: EN_GESTION

4. Acuerdo con el cliente
   └── Opción A: Registrar promesa de pago → estado: PROMETIO_PAGO
   └── Opción B: Formalizar plan de cuotas → estado: ACUERDO_CUOTAS

5. Monitoreo
   └── El sistema alerta si la promesa se incumple
   └── Se puede re-gestionar con nuevas acciones

6. Cierre
   └── Cliente paga → estado: RECUPERADA
   └── Sin resultado posible → estado: INCOBRABLE
   └── Escalar → estado: EN_LEGAL
```

---

## Preguntas frecuentes

**¿Se crea la gestión automáticamente?**
Sí. Cuando un préstamo supera los días de tolerancia de mora, el sistema crea automáticamente la gestión de cobranza.

**¿Puedo asignar una gestión a otro agente?**
Sí. Desde el detalle de la gestión podés reasignar al agente responsable.

**¿Qué pasa si el cliente paga durante la gestión?**
El pago se registra en el módulo de Préstamos. La gestión puede cerrarse como RECUPERADA.

**¿La línea de tiempo de acciones se puede editar?**
No. Las acciones registradas son inmutables para mantener la integridad del historial de cobranza.

**¿Qué significa "escalar a legal"?**
Es el proceso de derivar la deuda a un estudio jurídico o iniciar acciones legales. El préstamo pasa al estado EN_LEGAL.
