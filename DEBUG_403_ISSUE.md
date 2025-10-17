# Debugging 403 Forbidden Error

## Issue
`POST http://localhost:5173/api/movimientos-stock/iniciar-recuento` returns **403 Forbidden**

## Root Cause Analysis

### ✅ Backend Configuration (Correct)
- Controller has `/api` prefix: `@RequestMapping("/api/movimientos-stock")` ✅
- Context path is `/RipserApp` in `application.properties` ✅
- CORS is configured to allow `localhost:5173` ✅
- Security requires `USER` or `ADMIN` role for `/api/**` endpoints ✅

### ✅ Frontend Configuration (Correct)
- Vite proxy configured: `/api` → `http://localhost:8080/RipserApp` ✅
- Axios interceptor attaches JWT token ✅
- API calls use relative URLs like `/api/movimientos-stock/...` ✅

## Possible Causes

### 1. **Backend Not Restarted** ⚠️
The new endpoints were added but Spring Boot wasn't restarted.

**Solution:**
```bash
# Stop the backend if running
# Then restart it
cd c:\Users\maria\ripser_back
mvn spring-boot:run
# OR if using IDE, restart the Spring Boot application
```

### 2. **User Lacks Required Role** ⚠️
The logged-in user doesn't have `ROLE_USER` or `ROLE_ADMIN`.

**Check in Browser Console:**
Look for this log message when making the request:
```
[JWT] { sub: 'username', roles: [...], exp: '...' }
```

**Solution:**
If roles are missing or incorrect, update the user in the database:
```sql
-- Check user roles
SELECT u.username, r.name
FROM usuarios u
JOIN usuarios_roles ur ON u.id = ur.usuario_id
JOIN roles r ON ur.rol_id = r.id
WHERE u.username = 'your_username';

-- Add ADMIN role if missing (assuming role_id 1 is ADMIN)
INSERT INTO usuarios_roles (usuario_id, rol_id)
VALUES ((SELECT id FROM usuarios WHERE username = 'your_username'), 1);
```

### 3. **JWT Token Expired** ⚠️
Token expired and refresh failed.

**Check in Browser Console:**
Look for these messages:
- `🔄 Access token expired, attempting refresh...`
- `❌ Token refresh failed`

**Solution:**
- Log out and log back in to get a fresh token
- Check `localStorage` for `auth_token` and `auth_refresh_token`

### 4. **Repository Methods Not Found** ⚠️
The new repository queries use `Producto` entity but the import might be missing.

**Check:**
Open `MovimientoStockRepository.java` and verify the imports include:
```java
import com.ripser_back.entities.Producto;
```

## Step-by-Step Debugging

### Step 1: Check Browser Console
Open DevTools (F12) and look for:
```
Attaching token to request: eyJhbGc... /api/movimientos-stock/iniciar-recuento
[JWT] { sub: 'admin', roles: ['ROLE_ADMIN'], exp: '2025-10-08T...' }
```

If you see "No token available", you're not logged in.

### Step 2: Check Backend Logs
Look for these in Spring Boot console:
```
DEBUG com.ripser_back.controllers.MovimientoStockController - iniciarRecuento called
```

If you don't see this, the request isn't reaching the controller.

### Step 3: Test with curl
```bash
# Get your token from localStorage in browser console
# localStorage.getItem('auth_token')

# Test the endpoint
curl -X POST http://localhost:8080/RipserApp/api/movimientos-stock/iniciar-recuento \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"categoriaId": null, "notas": "Test recount"}'
```

Expected response: `201 Created` with recount data

### Step 4: Verify Endpoint Registration
In Spring Boot logs at startup, look for:
```
Mapped "{[/api/movimientos-stock/iniciar-recuento],methods=[POST]}" ...
Mapped "{[/api/movimientos-stock/recuentos-pendientes],methods=[GET]}" ...
Mapped "{[/api/movimientos-stock/completar-recuento/{movimientoId}],methods=[PUT]}" ...
```

If these are missing, the controller wasn't loaded.

## Quick Fix Checklist

- [ ] **Restart Spring Boot backend**
- [ ] Check browser console for JWT token and roles
- [ ] Verify user has ROLE_USER or ROLE_ADMIN in database
- [ ] Clear browser cache and localStorage, then login again
- [ ] Check Spring Boot startup logs for endpoint mappings
- [ ] Verify all new Java files were compiled (check `target/classes/`)

## Most Likely Solution

**99% of the time, it's one of these:**

1. **Backend not restarted** - Restart Spring Boot
2. **User needs ADMIN role** - Update database or login as admin user
3. **Token expired** - Logout and login again

## Test the Fix

After applying fixes:

1. **Login** to the app (if not already)
2. Go to **Inventario** page (`/logistica/inventario`)
3. Click **"Iniciar Recuento"**
4. Select category or leave blank
5. Click **"Iniciar Recuento"**
6. Should see success message with number of products

Then check **Tareas de Recuento** page (`/logistica/recuentos`) to see pending tasks.
