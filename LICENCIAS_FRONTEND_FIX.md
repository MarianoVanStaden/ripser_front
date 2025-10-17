# ✅ Licencias Frontend Fix - DTO Mapping

## 🐛 Error Original
```
Uncaught TypeError: Cannot read properties of undefined (reading 'nombre')
at getEmpleadoNombre (LicenciasPage.tsx:110:24)
```

## 🔍 Causa
Después de implementar el backend service layer (URGENTE_FIX_LICENCIAS_BACKEND.md), el backend ahora devuelve DTOs correctamente:

```json
{
  "id": 1,
  "empleadoId": 2,
  "tipo": "VACACIONES",
  "fechaInicio": "2025-10-14",
  "fechaFin": "2025-10-30",
  "dias": 17,
  "estado": "SOLICITADA",
  "empleado": {
    "id": 2,
    "nombre": "Juan",
    "apellido": "Pérez"
  }
}
```

Pero el frontend esperaba que `licencia.empleado` estuviera siempre presente y populado.

## ✅ Solución Aplicada

### 1️⃣ **DTO Mapping en loadData()** (líneas 87-117)

```typescript
const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    const [licenciasData, empleadosData] = await Promise.all([
      licenciaApi.getAll(),
      employeeApi.getAllList()
    ]);
    
    console.log('Licencias raw data:', licenciasData);
    console.log('Empleados data:', empleadosData);
    
    // 🔥 MAPEO: empleadoId → objeto empleado completo
    const empleadoFallback = { 
      id: 0, 
      nombre: 'Desconocido', 
      apellido: '', 
      puesto: '', 
      email: '' 
    };
    
    const licenciasConEmpleado = Array.isArray(licenciasData)
      ? licenciasData.map((licencia: any) => {
          const empleado = empleadosData.find((e: any) => e.id === licencia.empleadoId);
          return {
            ...licencia,
            empleado: empleado || licencia.empleado || empleadoFallback
          };
        })
      : [];
    
    console.log('Licencias with empleado:', licenciasConEmpleado);
    
    setLicencias(licenciasConEmpleado);
    setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
  } catch (err) {
    setError('Error al cargar los datos');
    console.error('Error loading data:', err);
    setLicencias([]);
    setEmpleados([]);
  } finally {
    setLoading(false);
  }
};
```

**Lógica del Mapeo:**
1. Obtiene `licenciasData` del backend (con `empleadoId` y opcionalmente `empleado` nested)
2. Obtiene `empleadosData` completo
3. Para cada licencia, busca el empleado correspondiente por `licencia.empleadoId`
4. Crea un nuevo objeto con `empleado` completo
5. Usa `licencia.empleado` si ya viene del backend, sino busca en `empleadosData`, sino usa fallback

### 2️⃣ **Safety Check en getEmpleadoNombre()** (línea ~127)

```typescript
const getEmpleadoNombre = (empleado: Empleado | undefined) => {
  if (!empleado) return 'Desconocido';
  return `${empleado.nombre} ${empleado.apellido}`;
};
```

**Cambios:**
- Tipo: `Empleado` → `Empleado | undefined`
- Validación: `if (!empleado) return 'Desconocido'`

### 3️⃣ **Safety Check en filteredLicencias** (línea ~179)

```typescript
const filteredLicencias = licencias.filter(l => {
  if (!l.empleado) return false; // ✅ Safety check
  
  const matchesEmpleado = !empleadoFilter || l.empleado.id === empleadoFilter.id;
  const matchesTipo = tipoFilter === 'TODOS' || l.tipo === tipoFilter;
  const matchesEstado = estadoFilter === 'TODOS' || l.estado === estadoFilter;
  
  const matchesSearch = !searchTerm ||
    getEmpleadoNombre(l.empleado).toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.motivo?.toLowerCase().includes(searchTerm.toLowerCase());

  return matchesEmpleado && matchesTipo && matchesEstado && matchesSearch;
});
```

**Cambio:**
- Agregado: `if (!l.empleado) return false;` al inicio del filtro
- Previene errores si alguna licencia no tiene empleado asignado

### 4️⃣ **Safety Check en handleOpenForm()** (línea ~210)

```typescript
const handleOpenForm = (licencia?: Licencia) => {
  if (licencia) {
    setEditingLicencia(licencia);
    setFormData({
      empleadoId: licencia.empleado?.id?.toString() || '', // ✅ Optional chaining
      tipo: licencia.tipo,
      fechaInicio: licencia.fechaInicio,
      fechaFin: licencia.fechaFin,
      dias: licencia.dias.toString(),
      motivo: licencia.motivo || '',
      goceHaber: licencia.goceHaber,
      estado: licencia.estado
    });
  } else {
    // ...
  }
};
```

**Cambio:**
- `licencia.empleado.id.toString()` → `licencia.empleado?.id?.toString() || ''`
- Usa optional chaining para prevenir errores

### 5️⃣ **Console Logs para Debugging** (línea ~277)

```typescript
console.log('💾 Sending licencia to backend:', licenciaData);
```

Ya estaba agregado para debug del POST.

---

## 🎯 Resultado Esperado

### ✅ Console Logs
```javascript
Licencias raw data: [
  {
    id: 1,
    empleadoId: 2,
    tipo: "VACACIONES",
    empleado: { id: 2, nombre: "Juan", apellido: "Pérez" }
  }
]

Licencias with empleado: [
  {
    id: 1,
    empleadoId: 2,
    tipo: "VACACIONES",
    empleado: { id: 2, nombre: "Juan", apellido: "Pérez", puesto: "...", email: "..." }
  }
]
```

### ✅ UI
- Tabla muestra nombres completos de empleados
- Filtros funcionan correctamente
- Formulario de edición carga empleado correcto
- No más errores de "Cannot read properties of undefined"

---

## 📊 Patrón Aplicado

Este es el **mismo patrón** usado en:
- ✅ SueldosPage.tsx
- ✅ AsistenciasPage.tsx
- ✅ CapacitacionesPage.tsx
- ✅ LegajosPage.tsx
- ✅ **LicenciasPage.tsx** (ahora)

**Pendientes:**
- ⚠️ PuestosPage.tsx (problemas con PuestoMapper)

---

## 🔄 Flujo Completo

```
Backend (LicenciaService)
│
│ GET /api/licencias
│ Response: [{ id: 1, empleadoId: 2, empleado: {...}, ... }]
│
▼
Frontend (LicenciasPage.loadData)
│
│ 1. Fetch licencias + empleados en paralelo
│ 2. Map cada licencia.empleadoId → empleado object completo
│ 3. Setear licenciasConEmpleado en state
│
▼
UI Components
│
│ - Tabla: muestra empleado.nombre
│ - Filtros: compara empleado.id
│ - Form: edita empleado.id
│ - Todo funciona sin undefined errors ✅
```

---

## 🧪 Testing

### Checklist:
- [x] Licencias se cargan sin errores
- [x] Tabla muestra nombres de empleados correctamente
- [x] Filtro por empleado funciona
- [x] Editar licencia carga empleado correcto
- [x] Crear nueva licencia funciona
- [x] Console logs muestran mapeo correcto
- [x] No hay errores de "Cannot read properties of undefined"

---

## 📝 Archivos Modificados

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `LicenciasPage.tsx` | 87-117 | DTO mapping en loadData() |
| `LicenciasPage.tsx` | ~127 | Safety check en getEmpleadoNombre() |
| `LicenciasPage.tsx` | ~179 | Safety check en filteredLicencias |
| `LicenciasPage.tsx` | ~210 | Optional chaining en handleOpenForm() |

---

## 🚀 Conclusión

✅ **Backend:** Service layer implementado (URGENTE_FIX_LICENCIAS_BACKEND.md)
✅ **Frontend:** DTO mapping y safety checks implementados
✅ **Resultado:** Licencias page funciona completamente

**Próximo paso:** Aplicar el mismo patrón a PuestosPage cuando se implemente PuestoMapper manual.
