# Contexto: Administracion y Finanzas

## Descripcion General
Modulo de administracion general del sistema que agrupa funcionalidades financieras (flujo de caja, balance anual, amortizaciones, posicion patrimonial), gestion bancaria (bancos, cuentas bancarias, cheques), gestion de usuarios y roles, configuracion de empresas y sucursales, y parametros del sistema. Es el modulo mas amplio del sistema y su acceso esta restringido principalmente a roles administrativos. Incluye una ruta especial para SuperAdmin que permite cambiar el contexto de empresa/sucursal.

## Archivos del Modulo
- Componentes:
  - `src/components/Admin/UsersPage.tsx` - Gestion de usuarios del sistema
  - `src/components/Admin/RolesPage.tsx` - Gestion de roles
  - `src/components/Admin/SettingsPage.tsx` - Parametros del sistema
  - `src/components/Admin/EmpresasPage.tsx` - Gestion de empresas (multi-tenant)
  - `src/components/Admin/SucursalesPage.tsx` - Gestion de sucursales
  - `src/components/Admin/CosteoParametrosPage.tsx` - Parametros de costeo
  - `src/components/Admin/FlujoCaja/FlujoCajaPage.tsx` - Dashboard de flujo de caja
  - `src/components/Admin/FlujoCaja/components/` - KPIs, graficos, tabla movimientos, desglose pagos
  - `src/components/Admin/FlujoCaja/charts/` - Graficos de linea, barras y torta
  - `src/components/Admin/FlujoCaja/breakdown/` - Cards de estado cheques y metodos de pago
  - `src/components/Admin/FlujoCaja/dialogs/MovimientoExtraDialog.tsx` - Dialog movimiento extra
  - `src/components/Admin/BalanceAnual/BalanceAnualPage.tsx` - Vista anual de balances mensuales
  - `src/components/Admin/BalanceAnual/BalanceMesPage.tsx` - Detalle de balance de un mes
  - `src/components/Admin/BalanceAnual/components/` - EstadoBalanceBadge, TablaBalanceAnual
  - `src/components/Admin/Amortizaciones/AmortizacionesPage.tsx` - Vista anual de amortizaciones y activos
  - `src/components/Admin/Amortizaciones/AmortizacionMesPage.tsx` - Detalle mensual de amortizaciones
  - `src/components/Admin/Amortizaciones/components/` - ActivoFormDialog, AmortizacionMesRow, CierreMensualDialog
  - `src/components/Admin/PosicionPatrimonial/PosicionPatrimonialPage.tsx` - Dashboard patrimonial
  - `src/components/Admin/PosicionPatrimonial/components/` - DesgloseFijo, DesgloseStock, ResumenPatrimonial
  - `src/components/Bancos/BancosPage.tsx` - CRUD de bancos
  - `src/components/Bancos/BancoFormDialog.tsx` - Formulario banco
  - `src/components/CuentasBancarias/CuentasBancariasPage.tsx` - CRUD de cuentas bancarias
  - `src/components/CuentasBancarias/CuentaBancariaFormDialog.tsx` - Formulario cuenta bancaria
  - `src/components/Cheques/ChequesPage.tsx` - Gestion de cheques
  - `src/components/Cheques/ChequeFormDialog.tsx` - Formulario cheque
  - `src/components/Cheques/ChequeDetailDialog.tsx` - Detalle de cheque
  - `src/components/Cheques/ChequeEstadoChip.tsx` - Chip de estado
  - `src/components/Cheques/ChequeTipoChip.tsx` - Chip de tipo
  - `src/components/Cheques/ChequeEndososChain.tsx` - Cadena visual de endosos
  - `src/components/Cheques/EndosarChequeDialog.tsx` - Dialog para endosar cheque
- API Services:
  - `src/api/services/adminFlujoCajaApi.ts`
  - `src/api/services/balanceAnualApi.ts`
  - `src/api/services/amortizacionApi.ts`
  - `src/api/services/posicionPatrimonialApi.ts`
  - `src/api/services/bancoApi.ts`
  - `src/api/services/chequeApi.ts`
  - `src/api/services/cuentaBancariaApi.ts`
  - `src/api/services/rolApi.ts`
  - `src/api/services/usuarioAdminApi.ts`
  - `src/api/services/parametroSistemaApi.ts`
  - `src/api/services/movimientoExtraApi.ts`
  - `src/services/empresaService.ts`
  - `src/services/sucursalService.ts`
  - `src/services/usuarioEmpresaService.ts`
- Hooks:
  - `src/hooks/usePermisos.ts` (compartido, usado en Bancos/Cheques/CuentasBancarias)
- Types:
  - `src/types/balance.types.ts`
  - `src/types/amortizacion.types.ts`
  - `src/types/posicionPatrimonial.types.ts`
  - `src/types/tenant.types.ts`
  - `src/types/index.ts` - Banco, CuentaBancaria, Cheque, Rol, ParametroSistema, etc.
- Utils:
  - `src/utils/priceCalculations.ts` (formatPrice, compartido)

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /admin/users | UsersPage | PrivateRoute |
| /admin/roles | RolesPage | PrivateRoute |
| /admin/settings | SettingsPage | PrivateRoute |
| /admin/flujo-caja | FlujoCajaPage | PrivateRoute |
| /admin/bancos | BancosPage | PrivateRoute |
| /admin/cuentas-bancarias | CuentasBancariasPage | PrivateRoute |
| /admin/empresas | EmpresasPage | PrivateRoute |
| /admin/sucursales | SucursalesPage | PrivateRoute |
| /admin/tenant-selector | TenantSelector | SuperAdminRoute |
| /admin/balance | BalanceAnualPage | PrivateRoute |
| /admin/balance/:anio/:mes | BalanceMesPage | PrivateRoute |
| /admin/amortizaciones | AmortizacionesPage | PrivateRoute |
| /admin/amortizaciones/:anio/:mes | AmortizacionMesPage | PrivateRoute |
| /admin/patrimonio | PosicionPatrimonialPage | PrivateRoute |

## Endpoints API Consumidos
### adminFlujoCajaApi (base: `/api/admin/flujo-caja`)
- `GET /api/admin/flujo-caja` - Flujo de caja basico (params: fechaDesde, fechaHasta)
- `GET /api/admin/flujo-caja/enhanced` - Flujo de caja con desglose completo
- `GET /api/admin/flujo-caja/saldos` - Saldos por metodo de pago
- `GET /api/admin/flujo-caja/cheques/resumen` - Resumen de cheques por estado

### balanceAnualApi (base: `/api/admin/balance-anual`)
- `GET /api/admin/balance-anual` - Balance anual (params: anio, sucursalId)
- `GET /api/admin/balance-anual/{anio}/mes/{mes}` - Balance mensual
- `POST /api/admin/balance-anual/{anio}/mes/{mes}/calcular` - Calcular balance (param: valorDolar)
- `POST /api/admin/balance-anual/{anio}/mes/{mes}` - Guardar balance mensual
- `PATCH /api/admin/balance-anual/{anio}/mes/{mes}/cerrar` - Cerrar mes

### amortizacionApi (base: `/api/admin/amortizaciones`)
- `GET /api/admin/amortizaciones/activos` - Lista de activos amortizables
- `POST /api/admin/amortizaciones/activos` - Crear activo
- `PUT /api/admin/amortizaciones/activos/{id}` - Actualizar activo
- `DELETE /api/admin/amortizaciones/activos/{id}` - Eliminar activo
- `GET /api/admin/amortizaciones` - Resumen anual (param: anio)
- `GET /api/admin/amortizaciones/{anio}/mes/{mes}` - Detalle mensual
- `POST /api/admin/amortizaciones/{anio}/mes/{mes}/activo/{activoId}` - Registrar amortizacion
- `POST /api/admin/amortizaciones/proceso-mensual` - Procesar cierre mensual

### posicionPatrimonialApi (base: `/api/admin/patrimonio`)
- `GET /api/admin/patrimonio/posicion` - Posicion patrimonial actual

### bancoApi (base: `/api/bancos`)
- `GET /api/bancos` - Listado paginado
- `GET /api/bancos/activos` - Bancos activos
- `GET /api/bancos/{id}` - Por ID
- `GET /api/bancos/codigo/{codigo}` - Por codigo
- `POST /api/bancos` - Crear
- `PUT /api/bancos/{id}` - Actualizar
- `DELETE /api/bancos/{id}` - Eliminar

### chequeApi (base: `/api/cheques`)
- `GET /api/cheques` - Listado paginado
- `GET /api/cheques/all` - Todos sin paginacion
- `GET /api/cheques/{id}` - Por ID
- `POST /api/cheques` - Crear
- `PUT /api/cheques/{id}` - Actualizar
- `DELETE /api/cheques/{id}` - Eliminar
- `PATCH /api/cheques/{id}/estado` - Cambiar estado
- `PUT /api/cheques/{id}/depositar` - Depositar
- `PUT /api/cheques/{id}/cobrar` - Cobrar
- `PUT /api/cheques/{id}/rechazar` - Rechazar
- `PUT /api/cheques/{id}/anular` - Anular
- `GET /api/cheques/{id}/historial` - Historial de estados
- `GET /api/cheques/estado/{estado}` - Por estado
- `GET /api/cheques/tipo/{tipo}` - Por tipo
- `GET /api/cheques/banco/{banco}` - Por banco
- `GET /api/cheques/cliente/{clienteId}` - Por cliente
- `GET /api/cheques/proveedor/{proveedorId}` - Por proveedor
- `GET /api/cheques/vencidos` - Vencidos
- `GET /api/cheques/proximos-vencer` - Proximos a vencer
- `GET /api/cheques/depositados-para-cobrar` - Depositados para cobrar
- `GET /api/cheques/buscar` - Busqueda con filtros multiples
- `GET /api/cheques/estadisticas/monto-por-estado` - Monto por estado
- `GET /api/cheques/estadisticas/monto-en-cartera` - Monto en cartera
- `GET /api/cheques/estadisticas/count-por-estado` - Conteo por estado
- `POST /api/cheques/{id}/endosar` - Endosar cheque
- `GET /api/cheques/{id}/endosos` - Endosos de un cheque
- `GET /api/cheques/{id}/cadena-endosos` - Cadena completa de endosos
- `GET /api/cheques/disponibles-endoso` - Cheques disponibles para endoso
- `GET /api/cheques/proveedor/{proveedorId}/endosados` - Endosados a proveedor

### cuentaBancariaApi (base: `/api/cuentas-bancarias`)
- `GET /api/cuentas-bancarias` - Todas
- `GET /api/cuentas-bancarias/activas` - Activas
- `GET /api/cuentas-bancarias/{id}` - Por ID
- `POST /api/cuentas-bancarias` - Crear
- `PUT /api/cuentas-bancarias/{id}` - Actualizar
- `DELETE /api/cuentas-bancarias/{id}` - Eliminar

### rolApi (base: `/api/admin/roles`)
- `GET /api/admin/roles` - Todos los roles
- `GET /api/admin/roles/{id}` - Rol por ID
- `GET /api/admin/roles/modulo/{modulo}` - Roles por modulo
- `POST /api/admin/roles` - Crear rol
- `PUT /api/admin/roles/{id}` - Actualizar rol
- `DELETE /api/admin/roles/{id}` - Eliminar rol

### usuarioAdminApi (base: `/api/admin/usuarios`)
- `GET /api/admin/usuarios` - Listado paginado de usuarios
- `GET /api/admin/usuarios/{id}` - Usuario por ID
- `POST /api/admin/usuarios` - Crear usuario
- `PUT /api/admin/usuarios/{id}` - Actualizar usuario
- `PATCH /api/admin/usuarios/{id}/change-password` - Cambiar contrasena
- `DELETE /api/admin/usuarios/{id}` - Eliminar usuario
- `GET /api/admin/usuarios/me` - Usuario autenticado actual

### parametroSistemaApi (base: `/api/admin/parametros`)
- `GET /api/admin/parametros` - Todos los parametros
- `GET /api/admin/parametros/clave/{clave}` - Parametro por clave
- `POST /api/admin/parametros` - Crear parametro
- `PUT /api/admin/parametros/{id}` - Actualizar parametro

### movimientoExtraApi (base: `/api/movimientos-extra`)
- `POST /api/movimientos-extra` - Crear movimiento extra
- `PUT /api/movimientos-extra/{id}` - Actualizar
- `GET /api/movimientos-extra/{id}` - Por ID
- `GET /api/movimientos-extra` - Listado paginado
- `PUT /api/movimientos-extra/{id}/anular` - Anular
- `DELETE /api/movimientos-extra/{id}` - Eliminar
- `GET /api/movimientos-extra/categorias` - Categorias disponibles
- `GET /api/movimientos-extra/por-fecha` - Filtrar por rango de fechas

### empresaService (base: `/api/empresas`)
- `GET /api/empresas` - Todas las empresas
- `GET /api/empresas/activas` - Empresas activas
- `GET /api/empresas/{id}` - Por ID
- `POST /api/empresas` - Crear
- `PUT /api/empresas/{id}` - Actualizar
- `POST /api/empresas/{id}/suspender` - Suspender
- `POST /api/empresas/{id}/reactivar` - Reactivar
- `DELETE /api/empresas/{id}` - Eliminar (soft delete)

### sucursalService (base: `/api/sucursales`)
- `GET /api/sucursales/empresa/{empresaId}` - Sucursales de una empresa
- `GET /api/sucursales/{id}` - Por ID
- `POST /api/sucursales` - Crear
- `PUT /api/sucursales/{id}` - Actualizar
- `POST /api/sucursales/{id}/establecer-principal` - Establecer como principal
- `DELETE /api/sucursales/{id}` - Eliminar (soft delete)

### usuarioEmpresaService (base: `/api/usuario-empresa`)
- `GET /api/usuario-empresa/usuario/{usuarioId}` - Empresas de un usuario
- `GET /api/usuario-empresa/empresa/{empresaId}` - Usuarios de una empresa
- `GET /api/usuario-empresa/{id}` - Por ID
- `POST /api/usuario-empresa` - Asignar usuario a empresa
- `PUT /api/usuario-empresa/{id}` - Actualizar asignacion
- `POST /api/usuario-empresa/{id}/desactivar` - Desactivar
- `POST /api/usuario-empresa/{id}/reactivar` - Reactivar
- `POST /api/usuario-empresa/{id}/cambiar-rol` - Cambiar rol
- `DELETE /api/usuario-empresa/{id}` - Eliminar asignacion

## Tipos Principales
```typescript
// Balance
EstadoBalance: 'BORRADOR' | 'CERRADO' | 'AUDITADO'
BalanceMensualDTO {
  id, empresaId, sucursalId, anio, mes, estado, valorDolar,
  // Pesos: saldoInicial, totalCobrado, totalGastos, totalAmortizado, saldoNeto, saldoFinal...
  // Dolares: mismos campos en dolares
  // Patrimoniales: cuentasXCobrar, stock*, cuentasXPagar, patrimonio, resultado
}
BalanceAnualResponseDTO { anio, empresaId, sucursalId, meses[], totalesAnuales }

// Amortizacion
TipoActivoAmortizable: 'VEHICULO' | 'HERRAMIENTAS' | 'INFRAESTRUCTURA' | 'MATERIA_PRIMA' | 'AGUINALDOS' | 'DESEMPLEO' | 'OTRO'
MetodoAmortizacion: 'PORCENTAJE_FIJO' | 'POR_KILOMETROS' | 'MONTO_FIJO_MENSUAL'
ActivoAmortizableDTO { id, empresaId, sucursalId, nombre, tipo, metodo, valorInicial, vehiculoId... }
AmortizacionMensualDTO { id, activoId, activoNombre, anio, mes, montoAmortizadoPesos, montoAmortizadoDolares... }
ResultadoCierreMensualDTO { totalAmortizadoPesos, flujoDisponiblePesos, registros[], advertencias[] }

// Posicion Patrimonial
PosicionPatrimonialDTO {
  stockMaterialesPesos, stockFabricacionPesos, stockComercializacionPesos,
  cuentasXCobrarPesos, patrimonioFijoPesos, totalActivosPesos,
  cuentasXPagarPesos, totalPasivosPesos, patrimonioNetoPesos,
  desgloseFijo (por tipo de activo), desgloseStock (materiales, fabricacion, comercializacion)
}

// Tenant
Empresa { id, nombre, cuit, razonSocial, estado: 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO' }
Sucursal { id, empresaId, codigo, nombre, esPrincipal, estado: 'ACTIVO' | 'INACTIVO' }
UsuarioEmpresa { id, usuarioId, empresaId, sucursalId, rol: RolEmpresa, esActivo }
RolEmpresa: 'SUPER_ADMIN' | 'ADMIN_EMPRESA' | 'GERENTE_SUCURSAL' | 'SUPERVISOR' | 'USUARIO_SUCURSAL'

// Flujo de Caja
FlujoCajaMovimiento { id, fecha, tipo: 'INGRESO' | 'EGRESO', origen, entidad, concepto, importe }

// Usuarios
UsuarioDTO { id, username, email, nombre, apellido, roles: TipoRol[], enabled, accountNonLocked }
TipoRol: 'ADMIN' | 'USER' | 'VENDEDOR' | 'TALLER' | 'OFICINA' | 'USUARIO' | 'ADMIN_EMPRESA' | 'GERENTE_SUCURSAL'
```

## Permisos y Roles
Modulo en sidebar: `ADMIN` (que mapea internamente a `ADMINISTRACION` en la matriz).

En `PERMISOS_POR_ROL`:
- **ADMIN**: Acceso total a todo (bypass completo de la matriz)
- **ADMIN_EMPRESA**: Unico rol con `ADMINISTRACION` explicitamente en su lista de permisos

Restriccion especial:
- `/admin/tenant-selector` (Cambiar Contexto): Solo visible para SuperAdmin. El sidebar filtra este item cuando `!esSuperAdmin`. Usa `SuperAdminRoute` como proteccion de ruta.

Nota: La seccion ADMIN del sidebar lista 13 items, incluyendo `Gestion Depositos` que apunta a `/logistica/configuracion/depositos` (ruta de otro modulo pero listada bajo admin).

## Multi-tenant
- Este modulo es el centro de la gestion multi-tenant:
  - `EmpresasPage` permite CRUD de empresas
  - `SucursalesPage` gestiona sucursales por empresa
  - `TenantSelector` permite al SuperAdmin cambiar de empresa/sucursal activa
  - `UsuarioEmpresa` vincula usuarios con empresas y roles
- `BalanceMensualDTO` incluye `sucursalId` - permite filtrar balance por sucursal
- `ActivoAmortizableDTO` incluye `sucursalId` y `vehiculoId` para vincular con vehiculos de la flota
- `FlujoCaja` opera a nivel empresa (no filtra por sucursal)
- `PosicionPatrimonial` se calcula a nivel empresa

## Dependencias entre Modulos
- **Ventas**: El flujo de caja consume movimientos de ventas (ingresos) y el balance integra datos de cuentas por cobrar.
- **Proveedores**: El flujo de caja consume movimientos de compras (egresos) y el balance integra cuentas por pagar.
- **Logistica / Stock**: La posicion patrimonial incluye desglose de stock (materiales, fabricacion, comercializacion).
- **Produccion / Equipos**: El stock de comercializacion incluye equipos disponibles para venta.
- **Transporte / Vehiculos**: Los activos amortizables pueden vincularse a vehiculos (`vehiculoId`) para amortizacion por kilometros.
- **Cheques**: Integrados en el flujo de caja; el resumen de cheques por estado aparece en el dashboard financiero.
- **RRHH**: Los usuarios del sistema se gestionan desde admin pero los empleados estan en RRHH.

## Patrones Especificos
- **Dual moneda**: Balance y amortizaciones manejan valores tanto en pesos como en dolares, con campo `valorDolar` para conversion.
- **Proceso de cierre mensual**: Las amortizaciones tienen un `procesarCierreMensual` que calcula todas las amortizaciones del mes y genera advertencias.
- **Estado de balance con workflow**: Los balances mensuales pasan por BORRADOR -> CERRADO -> AUDITADO.
- **Cheques con cadena de endosos**: Los cheques soportan endosos en cadena, con visualizacion de la cadena completa.
- **Servicios en carpetas distintas**: `empresaService`, `sucursalService` y `usuarioEmpresaService` estan en `src/services/` (no en `src/api/services/`), importando de `'../api'` en vez de `'../config'`.
- **Clase vs objeto**: `usuarioAdminApi` es una clase instanciada (patron singleton), mientras que los demas servicios usan objetos literales.
- **13 items en sidebar**: Es la seccion mas grande de la navegacion.
