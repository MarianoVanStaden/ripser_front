# Auditoría de Seguridad — ripser_front

Revisar todos los archivos en `src/components/`, `src/api/`, `src/context/`, `src/hooks/` y `src/utils/`.
Verificar cada punto:

---

## 1. Multi-tenant (X-Empresa-Id)

Verificar que el sistema multi-tenant esté correctamente implementado:

- [ ] `src/api/config.ts` adjunta el header `X-Empresa-Id` (desde `sessionStorage.getItem('empresaId')`) en todas las requests
- [ ] Los endpoints excluidos del header tenant están justificados (auth, validación, selección de tenant)
- [ ] Ningún componente hardcodea un `empresaId` o lo toma de parámetros del usuario
- [ ] `sessionStorage` (no `localStorage`) se usa para datos de tenant (empresaId, sucursalId) para aislamiento por tab
- [ ] Al hacer logout se limpian correctamente todos los datos de sesión (`localStorage` + `sessionStorage`)
- [ ] Los componentes que usan `useTenant()` manejan el caso donde `empresaId` aún no está disponible

---

## 2. XSS (Cross-Site Scripting)

Buscar vectores de XSS en todos los componentes:

```tsx
// MAL: inyección directa de HTML
<div dangerouslySetInnerHTML={{ __html: datosDelUsuario }} />

// BIEN: renderizar como texto (JSX escapa por defecto)
<div>{datosDelUsuario}</div>
```

Buscar y reportar:
- [ ] Uso de `dangerouslySetInnerHTML` — ¿el contenido está sanitizado?
- [ ] Inyección de datos del usuario en atributos `href` (javascript: protocol), `src`, o event handlers
- [ ] Uso de `document.write()`, `.innerHTML`, `eval()`, `Function()`, `setTimeout(string)`
- [ ] Interpolación de datos del usuario en URLs sin codificar

---

## 3. Autenticación y Autorización

Verificar que el flujo de auth sea seguro:

- [ ] Todas las rutas en `App.tsx` están envueltas en `<PrivateRoute>` (excepto `/login`)
- [ ] Rutas de SuperAdmin usan `<SuperAdminRoute>` (actualmente solo `/admin/tenant-selector`)
- [ ] El token JWT se valida al cargar la app (`AuthContext.validateToken`)
- [ ] El refresh token se maneja correctamente (no expuesto en URL ni en logs)
- [ ] Los tokens se limpian al expirar o en logout
- [ ] `usePermisos` se usa para ocultar/deshabilitar funcionalidades por rol en cada módulo
- [ ] No hay rutas accesibles sin autenticación (buscar `<Route>` sin `<PrivateRoute>`)
- [ ] El interceptor de respuesta 401 en `config.ts` redirige correctamente a login

---

## 4. Tokens y Datos Sensibles

Verificar que no se expongan datos sensibles:

- [ ] No hay tokens o credenciales hardcodeados en el código fuente
- [ ] `.env` está en `.gitignore`
- [ ] No hay `console.log` que expongan tokens completos, passwords, o datos sensibles del usuario
- [ ] Los tokens no se pasan por URL (query params)
- [ ] No hay secrets en el bundle de producción:
  ```bash
  npm run build
  # Buscar en dist/ cadenas sospechosas
  ```
- [ ] `VITE_API_BASE_URL` y otras variables de entorno no contienen credenciales

---

## 5. Validación de Inputs

Verificar que los formularios validen correctamente (react-hook-form + Yup):

- [ ] Campos requeridos están marcados como `.required()` en el schema Yup
- [ ] Longitudes máximas definidas (prevenir payloads excesivos)
- [ ] Formatos validados: email, teléfono, CUIT/CUIL donde aplique
- [ ] Valores numéricos: no negativos donde corresponda (cantidades, precios, stock)
- [ ] Fechas: formato válido (dayjs/date-fns parsing)
- [ ] Autocomplete/Select usan valores controlados (no input libre donde debería ser selección)
- [ ] Strings no vacíos donde se requieren (`.trim()` antes de enviar)

---

## 6. Dependencias

Verificar vulnerabilidades en paquetes:

```bash
npm audit
```

- [ ] No hay vulnerabilidades críticas o altas sin resolver
- [ ] Las dependencias principales están actualizadas (React, MUI, Axios, Vite)
- [ ] No hay dependencias abandonadas o con CVEs conocidos

---

## 7. Reporte

Generar un reporte con este formato:

```
## Auditoría de Seguridad — ripser_front

### Críticos (corregir antes de continuar)
- [ ] {archivo}.tsx línea {X}: {descripción del problema}

### Advertencias (corregir pronto)
- [ ] {archivo}.tsx línea {X}: {descripción del problema}

### OK
- Lista de áreas sin problemas
```

---

## 8. Corrección

Por cada problema crítico encontrado, proponer y aplicar la corrección.
Verificar al finalizar:

```bash
npx tsc --noEmit
npm run build
```

Reportar que las correcciones no introdujeron errores de compilación ni de tipos.
