# Módulo de Administración — Instructivo de Usuario

## Descripción general

El módulo de Administración centraliza la gestión financiera de la empresa, la configuración del sistema y la administración de usuarios, roles, empresas y sucursales. Incluye balances, flujo de caja, amortizaciones, posición patrimonial y gestión bancaria.

---

## Estructura del módulo

| Sección | Qué gestiona |
|---------|-------------|
| **Usuarios y Roles** | Accesos al sistema, permisos |
| **Finanzas** | Balance, flujo de caja, amortizaciones, patrimonio |
| **Bancos** | Cuentas bancarias, cajas de ahorro en USD |
| **Empresa** | Datos de empresa, sucursales, depósitos |
| **Sistema** | Parámetros de configuración general |

---

## SECCIÓN: USUARIOS Y ROLES

### 1. Usuarios

Gestión de las cuentas de acceso al sistema.

**Acceso:** Menú Administración → Usuarios

**Acciones disponibles:**
- Crear nuevo usuario
- Editar datos (nombre, email, roles)
- Activar / desactivar usuario
- Ver último acceso
- Restablecer contraseña

**Campos:**
- Nombre de usuario
- Email
- Nombre y apellido
- Roles asignados
- Estado: activo / inactivo

---

### 2. Roles

Definición de perfiles de acceso con sus permisos específicos.

**Acceso:** Menú Administración → Roles

**Acciones disponibles:**
- Crear nuevo rol
- Asignar permisos por módulo y acción
- Editar permisos de un rol existente
- Asignar roles a usuarios

**Nota:** Los permisos controlan qué módulos y acciones puede usar cada usuario. Un usuario puede tener múltiples roles.

---

## SECCIÓN: FINANZAS

### 3. Flujo de Caja

Resumen de los movimientos de dinero del período.

**Acceso:** Menú Administración → Flujo de Caja

**Contenido:**
- Ingresos del período (cobros de ventas, préstamos, etc.)
- Egresos del período (pagos a proveedores, sueldos, gastos)
- Saldo neto
- Evolución gráfica por período

---

### 4. Balance Anual / Mensual

Cierre contable mensual y anual de la empresa.

**Acceso:** Menú Administración → Balance Anual

**Acciones disponibles:**
- Ver balance por año y mes
- Ingresar o actualizar datos del período (cuando está en estado BORRADOR)
- Cerrar el período (pasa a estado CERRADO)
- Auditar el balance (pasa a estado AUDITADO)
- Ingresar el valor del dólar del período

**Estados del balance:**
| Estado | Descripción |
|--------|-------------|
| BORRADOR | En elaboración, editable |
| CERRADO | Período cerrado, no editable |
| AUDITADO | Revisado y validado |

**Campos del balance mensual:**
- Saldo inicial (pesos y dólares)
- Total cobrado (ventas, cuotas, etc.)
- Total gastos
- Total amortizado
- Cuentas a cobrar
- Patrimonio neto
- Valor del dólar del período

---

### 5. Amortizaciones

Registro y seguimiento de las amortizaciones de activos.

**Acceso:** Menú Administración → Amortizaciones

**Acciones disponibles:**
- Ver amortizaciones por año y mes
- Registrar nuevas amortizaciones
- Consultar el detalle de cada activo amortizado
- Ver saldo residual por activo

---

### 6. Posición Patrimonial

Vista consolidada del patrimonio de la empresa.

**Acceso:** Menú Administración → Posición Patrimonial

**Contenido:**
- Activos totales (inventario, equipos, cuentas a cobrar, bancos)
- Pasivos (deudas a proveedores, préstamos)
- Patrimonio neto
- Evolución histórica

---

## SECCIÓN: BANCOS

### 7. Bancos

Catálogo de bancos con los que opera la empresa.

**Acceso:** Menú Administración → Bancos

**Acciones disponibles:**
- Registrar nuevos bancos
- Editar datos del banco
- Activar / desactivar

---

### 8. Cuentas Bancarias

Gestión de las cuentas bancarias de la empresa.

**Acceso:** Menú Administración → Cuentas Bancarias

**Acciones disponibles:**
- Crear nueva cuenta bancaria
- Editar número de cuenta, CBU, banco y tipo
- Ver saldo de cada cuenta
- Registrar movimientos manuales
- Conciliar con extractos bancarios

---

### 9. Cajas de Ahorro en USD

Gestión de cajas de ahorro en dólares.

**Acceso:** Menú Administración → Cajas de Ahorro USD

**Acciones disponibles:**
- Crear nueva caja de ahorro
- Ver saldo actual en dólares
- Registrar depósitos, extracciones y conversiones
- Ver historial de movimientos

**Tipos de movimiento:**
| Tipo | Descripción |
|------|-------------|
| DEPOSITO | Ingreso de dólares |
| EXTRACCION | Retiro de dólares |
| CONVERSION_AMORTIZACION | Conversión ligada a una amortización mensual |

---

## SECCIÓN: EMPRESA

### 10. Empresas

Gestión de las empresas del sistema (multi-empresa).

**Acceso:** Menú Administración → Empresas

**Acciones disponibles:**
- Ver y editar datos de la empresa (razón social, CUIT, domicilio, etc.)
- Gestionar múltiples empresas si el sistema opera en modo multi-tenant

---

### 11. Sucursales

Alta y gestión de las sucursales o puntos de operación.

**Acceso:** Menú Administración → Sucursales

**Acciones disponibles:**
- Crear nueva sucursal
- Editar nombre, domicilio y teléfono
- Activar / desactivar sucursal
- Ver empleados y depósitos asociados

---

### 12. Selector de Empresa/Sucursal (Super Admin)

Herramienta exclusiva para administradores con acceso a múltiples empresas.

**Acceso:** Menú Administración → Cambiar Contexto

**Función:**
Permite cambiar entre empresas o sucursales para gestionar distintos contextos desde una misma sesión. Solo visible para usuarios con rol de Super Administrador.

---

## SECCIÓN: SISTEMA

### 13. Configuración del Sistema

Parámetros generales que controlan el comportamiento del sistema.

**Acceso:** Menú Administración → Configuración Sistema

**Tipos de parámetros:**
| Tipo | Descripción |
|------|-------------|
| STRING | Texto (por ejemplo: nombre de la empresa en documentos) |
| NUMBER | Número (tasa de IVA, límite de crédito por defecto) |
| BOOLEAN | Activar/desactivar funcionalidades |
| JSON | Configuraciones complejas |

**Parámetros comunes:**
- Meta de presupuestos del mes
- Meta de leads del mes
- Valor del dólar por defecto
- Opciones de financiamiento activas

---

## Multi-empresa / Multi-sucursal

El sistema opera en modo **multi-tenant**: cada empresa y sucursal tiene sus propios datos aislados. Todas las solicitudes al servidor incluyen automáticamente el contexto de empresa y sucursal activos.

**Lo que esto significa para el usuario:**
- Solo ves los datos de tu empresa y sucursal actual
- Los usuarios pueden tener acceso a múltiples empresas/sucursales
- El Super Admin puede cambiar de contexto desde el Selector

---

## Preguntas frecuentes

**¿Quién puede crear usuarios?**
Solo usuarios con permiso de administración de usuarios (generalmente el rol Administrador o Super Admin).

**¿Puedo cerrar el balance de un mes anterior?**
Sí. El balance puede cerrar en cualquier momento mientras esté en estado BORRADOR. Una vez CERRADO, no se puede editar.

**¿Qué pasa si cierro mal un balance?**
Un balance CERRADO puede volver a BORRADOR si tenés el permiso de auditoría. Consultá con el administrador del sistema.

**¿Las cajas de ahorro en USD se consolidan con el patrimonio?**
Sí. El saldo en dólares se convierte usando el valor del dólar registrado en el período para incluirse en la posición patrimonial.

**¿Qué diferencia hay entre un usuario RRHH y un usuario Administración?**
Los usuarios de RRHH se crean en el módulo de RRHH y representan a empleados. Los usuarios de Administración son las cuentas de acceso al sistema con sus permisos configurados.
