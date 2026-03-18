# Contexto: Clientes

## Descripcion General
El modulo de Clientes gestiona el ciclo de vida completo de los clientes de la empresa: desde la creacion y edicion de datos, carpeta documental, agenda de visitas, hasta la cuenta corriente y creditos personales. Incluye busqueda avanzada con typeahead, segmentacion de clientes, indicadores de riesgo de churn, y gestion de contactos. En la barra lateral, los Leads aparecen dentro de la seccion CLIENTES.

## Archivos del Modulo
- Componentes: `src/components/Clientes/ClientesPage.tsx`, `src/components/Clientes/ClienteFormPage.tsx`, `src/components/Clientes/ClienteDetailPage.tsx`, `src/components/Clientes/CarpetaClienteSelector.tsx`, `src/components/Clientes/CarpetaClientePage.tsx`, `src/components/Clientes/AgendaVisitasPage.tsx`, `src/components/Clientes/CuentaCorrientePage.tsx`, `src/components/Clientes/CreditoPersonalPage.tsx`, `src/components/Clientes/CreditosPage.tsx`, `src/components/Clientes/ContactosTab.tsx`, `src/components/Clientes/CuentaCorrienteTab.tsx`, `src/components/Clientes/ClienteSegmentoBadge.tsx`, `src/components/Clientes/ChurnRiskIndicator.tsx`, `src/components/Clientes/index.ts`
- API Services: `src/api/services/clienteApi.ts`, `src/api/services/clienteApiWithFallback.ts`, `src/api/services/contactoClienteApi.ts`, `src/api/services/contactoClienteApiWithFallback.ts`, `src/api/services/creditoClienteApi.ts`, `src/api/services/cuentaCorrienteApi.ts`, `src/api/services/documentoClienteApi.ts`
- Hooks: `src/hooks/useClienteSearch.ts`
- Types: `Cliente`, `TipoCliente`, `EstadoCliente`, `ContactoCliente`, `CreditoCliente`, `CuentaCorriente`, `DocumentoCliente` (desde `src/types`)

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /clientes/gestion | ClientesPage | PrivateRoute |
| /clientes/nuevo | ClienteFormPage | PrivateRoute |
| /clientes/editar/:id | ClienteFormPage | PrivateRoute |
| /clientes/detalle/:id | ClienteDetailPage | PrivateRoute |
| /clientes/carpeta | CarpetaClienteSelector | PrivateRoute |
| /clientes/carpeta/:id | CarpetaClientePage | PrivateRoute |
| /clientes/agenda | AgendaVisitasPage | PrivateRoute |
| /clientes/cuenta-corriente | CuentaCorrientePage | PrivateRoute |
| /clientes/credito | CreditoPersonalPage | PrivateRoute |

## Endpoints API Consumidos

### clienteApi (`/api/clientes`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/clientes` | Listar clientes paginados con filtros (sucursalId, tipo, estado, term) |
| GET | `/api/clientes/{id}` | Obtener cliente por ID |
| POST | `/api/clientes` | Crear nuevo cliente |
| PUT | `/api/clientes/{id}` | Actualizar cliente |
| DELETE | `/api/clientes/{id}` | Eliminar cliente |
| GET | `/api/clientes/search?q=...&page=0&size=10` | Busqueda typeahead para autocompletar |

### contactoClienteApi (`/api/clientes/contactos`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/clientes/contactos` | Listar contactos paginados con filtros (clienteId, fechaInicio, fechaFin) |
| GET | `/api/clientes/{clienteId}/contactos` | Contactos de un cliente especifico |
| POST | `/api/clientes/contactos` | Crear contacto |
| PUT | `/api/clientes/contactos/{id}` | Actualizar contacto |
| DELETE | `/api/clientes/contactos/{id}` | Eliminar contacto |

### creditoClienteApi (`/api/creditos-cliente`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/creditos-cliente` | Listar creditos paginados |
| GET | `/api/creditos-cliente/{id}` | Obtener credito por ID |
| POST | `/api/creditos-cliente` | Crear credito |
| PUT | `/api/creditos-cliente/{id}/anular` | Anular credito |
| GET | `/api/creditos-cliente/cliente/{clienteId}` | Creditos de un cliente |

### cuentaCorrienteApi (`/api/cuentas-corriente`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/cuentas-corriente` | Listar movimientos paginados (vista admin) |
| GET | `/api/cuentas-corriente/cliente/{clienteId}` | Movimientos de un cliente |
| POST | `/api/cuentas-corriente` | Crear movimiento |

### documentoClienteApi (`/api/documentos-cliente`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/documentos-cliente/upload` | Subir documento (multipart/form-data) con categoria y descripcion |
| GET | `/api/documentos-cliente/cliente/{clienteId}` | Documentos de un cliente |
| GET | `/api/documentos-cliente/{id}` | Obtener documento por ID |
| GET | `/api/documentos-cliente/download/{id}` | Descargar documento (blob) |
| DELETE | `/api/documentos-cliente/{id}` | Eliminar documento |

## Tipos Principales

### ClienteFilterParams
```typescript
interface ClienteFilterParams {
  sucursalId?: number | null;
  tipo?: TipoCliente;
  estado?: EstadoCliente;
  term?: string;
}
```

### ClientePayload (para crear/actualizar)
```typescript
type ClientePayload = Partial<Omit<Cliente, 'id' | 'fechaAlta' | 'fechaActualizacion'>>;
```

### ContactoCliente
Registro de contactos/visitas/llamadas realizadas a un cliente, con campos `clienteId`, `fechaInicio`, `fechaFin`.

### CreditoCliente / CreditoCreateDTO
Creditos otorgados a clientes, con estado y posibilidad de anulacion.

### DocumentoCliente
Documentos adjuntos al cliente con categoria, descripcion, y soporte de upload/download.

## Permisos y Roles
- **Modulo**: CLIENTES
- **Roles con acceso**: ADMIN, OFICINA, VENDEDOR, ADMIN_EMPRESA, GERENTE_SUCURSAL

## Multi-tenant
- `clienteApi.getAll()` acepta `sucursalId` como filtro para segmentar clientes por sucursal.
- El header `X-Empresa-Id` asegura que solo se muestren clientes de la empresa activa.
- `contactoClienteApi` tambien filtra por `clienteId` que ya pertenece a la empresa del tenant.
- Los documentos de cliente se almacenan vinculados al `clienteId`, por lo que heredan el aislamiento por empresa.

## Dependencias entre Modulos
- **Ventas**: Los presupuestos, facturas y ventas referencian `clienteId`. La pagina de detalle del cliente puede mostrar historico de ventas.
- **Leads**: Los leads se convierten en clientes via `leadApi.convertir()`, creando un nuevo registro de cliente.
- **Cheques**: Los cheques pueden estar vinculados a clientes por `clienteId`.
- **Dashboard**: El dashboard principal muestra el total de clientes como KPI.

## Patrones Especificos
- **useClienteSearch**: Hook de busqueda typeahead con debounce de 300ms, cancelacion de requests anteriores via `AbortController`, y minimo de 3 caracteres para activar la busqueda. Usa `clienteApi.searchByQuery()`.
- **clienteApiWithFallback**: Version del API de clientes con fallback para compatibilidad cuando endpoints no estan disponibles.
- **contactoClienteApiWithFallback**: Version del API de contactos con fallback similar.
- **CarpetaCliente**: Vista consolidada de toda la informacion del cliente (datos, contactos, documentos, cuenta corriente, creditos) en una sola pagina.
- **Segmentacion**: `ClienteSegmentoBadge` muestra visualmente el segmento del cliente.
- **Riesgo de Churn**: `ChurnRiskIndicator` muestra un indicador visual del riesgo de perdida del cliente.
- **Paginacion**: Las APIs de clientes usan paginacion server-side con `PageResponse<T>` conteniendo `content`, `totalElements`, `totalPages`, `size`, `number`.
- **Leads en sidebar**: En la barra lateral, la seccion CLIENTES incluye tanto los items de gestion de clientes como los de leads.
