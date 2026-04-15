# Módulo de Clientes y Leads — Instructivo de Usuario

## Descripción general

El módulo agrupa la gestión completa del ciclo comercial con personas: desde el primer contacto como **lead** (prospecto) hasta su conversión en **cliente** activo, con seguimiento de cuenta corriente, visitas y carpeta de historial.

---

## SECCIÓN: LEADS (Prospectos)

### ¿Qué es un lead?
Un lead es una persona o empresa que mostró interés en los productos/servicios pero aún no es cliente. Se gestiona en un embudo de ventas con diferentes etapas.

---

### 1. Vista Kanban

Tablero visual donde cada columna representa un estado del embudo de ventas.

**Acceso:** Menú Clientes → Leads (vista tablero)

**Acciones disponibles:**
- Arrastrar leads entre columnas para cambiar estado
- Crear nuevo lead desde el tablero
- Abrir detalle de un lead
- Ver indicadores de prioridad (HOT / WARM / COLD)

---

### 2. Vista Tabla de Leads

Lista completa de leads con filtros y búsqueda avanzada.

**Acciones disponibles:**
- Buscar por nombre, teléfono o email
- Filtrar por estado, prioridad, canal de origen, usuario asignado
- Ordenar por fecha, score o prioridad
- Acceder al detalle o edición de cada lead

---

### 3. Crear / Editar Lead

**Campos principales:**
- Nombre y apellido
- Teléfono y email
- Ciudad y provincia
- **Canal de origen:** Web, Teléfono, Email, WhatsApp, Referido, Facebook, Instagram, Recompra
- **Prioridad:** HOT (urgente), WARM (interesado), COLD (frío)
- Producto o receta de interés
- Presupuesto estimado
- Usuario asignado
- Fecha de próximo seguimiento
- Observaciones

---

### 4. Detalle de Lead

Vista completa del lead con:
- Información de contacto
- Estado actual y historial de cambios de estado
- Historial de interacciones (llamadas, emails, visitas, etc.)
- Recordatorios activos y próximos
- Presupuestos asociados
- Botón para convertir en cliente

---

### 5. Interacciones con el Lead

Registro de cada contacto realizado con el prospecto.

**Tipos de interacción:** Llamada, Email, WhatsApp, Reunión, Visita, Otro

**Campos:**
- Tipo y fecha
- Descripción
- Resultado: Exitoso, Sin respuesta, Reagendar, No interesado, Interesado
- Próxima acción (fecha y descripción)

---

### 6. Recordatorios

Sistema de alertas para no perder el seguimiento de un lead.

**Tipos:** Email, SMS, Tarea, Notificación, WhatsApp, Llamada

**Acceso global:** Menú Clientes → Recordatorios Globales

Desde esta vista podés ver todos los recordatorios del día/semana de todos los leads asignados a tu usuario.

---

### 7. Convertir Lead a Cliente

Cuando el lead concreta la compra o confirma su interés formal:

1. Ir al detalle del lead
2. Presionar "Convertir a Cliente"
3. Completar los datos adicionales del cliente (CUIT, límite de crédito, segmento, etc.)
4. El lead queda en estado CONVERTIDO y se crea automáticamente el cliente vinculado

---

### 8. Métricas de Leads

Dashboard con indicadores del embudo comercial:
- Cantidad de leads por estado
- Tasa de conversión
- Leads por canal de origen
- Seguimiento de meta de presupuestos

---

### Estados del Lead

| Estado | Descripción |
|--------|-------------|
| PRIMER_CONTACTO | Recién ingresado |
| MOSTRO_INTERES | Demostró interés en productos |
| CLIENTE_POTENCIAL | Alta probabilidad de compra |
| CLIENTE_POTENCIAL_CALIFICADO | Confirmó intención, negoció condiciones |
| VENTA | Compra realizada (próximo a convertirse) |
| CONVERTIDO | Ya es cliente del sistema |
| PERDIDO | No prosperó, pero sin descartar |
| DESCARTADO | Sin posibilidad de conversión |

---

## SECCIÓN: CLIENTES

### 1. Gestión de Clientes

Lista y administración de todos los clientes activos.

**Acceso:** Menú Clientes → Gestión Clientes

**Acciones disponibles:**
- Crear nuevo cliente (o proviene de conversión de lead)
- Editar datos del cliente
- Ver detalle completo
- Cambiar estado del cliente
- Buscar por nombre, CUIT, ciudad o provincia
- Filtrar por tipo, estado y segmento

**Estados del cliente:**
| Estado | Descripción |
|--------|-------------|
| ACTIVO | Cliente operativo |
| INACTIVO | Sin actividad reciente |
| SUSPENDIDO | Suspendido temporalmente |
| MOROSO | Con deuda vencida |

**Segmentos:**
| Segmento | Descripción |
|----------|-------------|
| VIP | Cliente estratégico de alto valor |
| PREMIUM | Cliente importante |
| STANDARD | Cliente regular |
| BASICO | Cliente de bajo volumen |

---

### 2. Detalle del Cliente

Vista completa con toda la información del cliente:
- Datos personales/empresariales (nombre, CUIT, contacto)
- Límite de crédito y saldo actual
- Historial de documentos comerciales (presupuestos, facturas, etc.)
- Historial de contactos
- Cuenta corriente
- Alerta de riesgo de churn (si aplica)

---

### 3. Carpeta del Cliente

Vista organizada de todos los documentos y registros del cliente:
- Presupuestos emitidos
- Notas de pedido
- Facturas
- Notas de crédito
- Préstamos activos
- Garantías vigentes

---

### 4. Agenda de Visitas

Planificación y registro de visitas comerciales a clientes.

**Acciones disponibles:**
- Programar nueva visita
- Registrar resultado de la visita
- Ver calendario de visitas

---

### 5. Cuenta Corriente del Cliente

Registro de todos los movimientos económicos del cliente.

**Acciones disponibles:**
- Ver saldo actual
- Consultar movimientos por período
- Ver detalle de cada débito/crédito
- Filtrar por tipo de movimiento

**Tipos de movimiento:**
| Tipo | Descripción |
|------|-------------|
| DÉBITO | Deuda generada por una venta/factura |
| CRÉDITO | Pago recibido del cliente |

---

## Flujo: del lead al cliente activo

```
1. Ingresa Lead
   └── Canal: web, teléfono, referido, redes sociales, etc.

2. Seguimiento comercial
   └── Registrar interacciones (llamadas, visitas, emails)
   └── Crear recordatorios de seguimiento
   └── Asignar usuario responsable

3. Avanzar en el embudo
   └── Cambiar estado según progreso (Kanban o edición)

4. Convertir a cliente
   └── Al concretar la compra o confirmar contrato

5. Gestión como cliente
   └── Cuenta corriente, historial de ventas, carpeta de documentos
```

---

## Preguntas frecuentes

**¿Puedo crear un cliente directamente sin pasar por lead?**
Sí. Desde Gestión de Clientes podés crear un cliente nuevo directamente.

**¿Qué es el riesgo de churn?**
Es una alerta automática que indica que un cliente tiene señales de abandono (sin compras recientes, saldo negativo, etc.).

**¿Puedo ver todos los recordatorios juntos sin entrar a cada lead?**
Sí. Desde Menú Clientes → Recordatorios Globales tenés una vista consolidada de todos los recordatorios pendientes.

**¿Cómo sé si un cliente llegó por conversión de lead?**
En el detalle del cliente aparece el lead de origen vinculado.
