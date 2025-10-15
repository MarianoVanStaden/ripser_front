# Módulo de Fabricación - Guía de Implementación

## ✅ Archivos Ya Creados

1. **API Services**
   - ✅ `recetaFabricacionApi.ts` - Servicios API para recetas
   - ✅ `equipoFabricadoApi.ts` - Servicios API para equipos

2. **Componentes de Recetas**
   - ✅ `RecetasList.tsx` - Listado con DataGrid y filtros
   - ✅ `RecetaDetail.tsx` - Detalle completo con tabla de materiales
   - ✅ `RecetaForm.tsx` - Formulario para crear/editar

3. **Configuración**
   - ✅ `index.ts` - Archivo de exportaciones
   - ✅ `App.tsx` - Rutas configuradas

## 📋 Archivos Pendientes de Crear

Necesitas crear los siguientes archivos en `src/components/Fabricacion/`:

### 1. EquiposList.tsx
**Descripción:** Listado de equipos fabricados con DataGrid, filtros y acciones.

**Características clave:**
- DataGrid con paginación
- Filtros: tipo, estado, cliente, responsable
- Acciones: Ver, Editar, Completar, Cancelar, Asignar/Desasignar Cliente, Eliminar
- Chips de colores para estados
- Confirmaciones para acciones críticas

**Estructura similar a RecetasList.tsx pero con:**
```typescript
// Columnas específicas:
- numeroHeladera
- tipo (Chip con colores)
- modelo
- estado (EN_PROCESO, COMPLETADO, CANCELADO)
- asignado (boolean)
- clienteNombre
- responsableNombre
- fechaCreacion
- fechaFinalizacion
- acciones (múltiples botones)

// Endpoints a usar:
- equipoFabricadoApi.findAll()
- equipoFabricadoApi.completarFabricacion()
- equipoFabricadoApi.cancelarFabricacion()
- equipoFabricadoApi.asignarEquipo()
- equipoFabricadoApi.desasignarEquipo()
- equipoFabricadoApi.delete()
```

### 2. EquipoDetail.tsx
**Descripción:** Vista detallada de un equipo fabricado.

**Características clave:**
- Card con información técnica (tipo, modelo, medida, color)
- Chip con estado actual
- Información de receta asociada (si existe)
- Información de cliente asignado (si existe)
- Información de responsable
- Historial de fechas (creación, finalización)
- Botones de acciones: Completar, Cancelar, Asignar/Desasignar, Editar

**Estructura:**
```typescript
// Secciones:
1. Header con nombre y estado
2. Grid con 2 Cards:
   - Información Técnica
   - Información de Fabricación (receta, responsable, fechas)
3. Card de Cliente (si está asignado)
4. Botones de acciones según el estado

// Endpoints:
- equipoFabricadoApi.findById()
- equipoFabricadoApi.completarFabricacion()
- equipoFabricadoApi.cancelarFabricacion()
- equipoFabricadoApi.asignarEquipo() (con dialog para seleccionar cliente)
- equipoFabricadoApi.desasignarEquipo()
```

### 3. EquipoForm.tsx
**Descripción:** Formulario para crear/editar equipos fabricados.

**Características clave:**
- React Hook Form + Yup validation
- Selección de receta base (Autocomplete opcional)
- Campos: tipo, modelo, equipo, medida, color, numeroHeladera, cantidad
- Selección de responsable (Autocomplete con empleados)
- Selección de cliente (Autocomplete opcional para asignación directa)
- Estado inicial (si es edición)

**Validaciones Yup:**
```typescript
const schema = yup.object().shape({
  tipo: yup.string().required('El tipo es obligatorio'),
  modelo: yup.string().required('El modelo es obligatorio'),
  numeroHeladera: yup.string().required('El número de heladera es obligatorio'),
  cantidad: yup.number().min(1).required('La cantidad es obligatoria'),
  // resto de campos opcionales
});
```

**Campos del formulario:**
- Autocomplete para receta (opcional, carga de recetaFabricacionApi.findAllActive())
- Select para tipo (HELADERA, COOLBOX, EXHIBIDOR, OTRO)
- TextField para modelo, equipo, medida, color, numeroHeladera
- TextField number para cantidad
- Autocomplete para responsable (carga de empleadoApi)
- Autocomplete para cliente (carga de clienteApi)
- Select para estado (si es edición)

### 4. DashboardFabricacion.tsx
**Descripción:** Panel de control con KPIs y gráficos.

**Características clave:**
- Cards de KPIs (total equipos, en proceso, completados, cancelados)
- Gráfico de barras/pie: Equipos por tipo
- Gráfico de líneas: Equipos completados por mes
- Tabla: Recetas más utilizadas
- Tabla: Equipos recientes
- Filtros por rango de fechas

**Estructura sugerida:**
```typescript
<Box>
  {/* KPIs Row */}
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography>Total Equipos</Typography>
          <Typography variant="h4">{totalEquipos}</Typography>
        </CardContent>
      </Card>
    </Grid>
    {/* 3 KPIs más... */}
  </Grid>

  {/* Gráficos Row */}
  <Grid container spacing={3} mt={2}>
    <Grid item xs={12} md={6}>
      <Paper>
        <Typography variant="h6">Equipos por Tipo</Typography>
        {/* Gráfico de Pie/Bar usando @mui/x-charts o recharts */}
      </Paper>
    </Grid>
    <Grid item xs={12} md={6}>
      <Paper>
        <Typography variant="h6">Producción Mensual</Typography>
        {/* Gráfico de líneas */}
      </Paper>
    </Grid>
  </Grid>

  {/* Tablas Row */}
  <Grid container spacing={3} mt={2}>
    <Grid item xs={12} md={6}>
      <Paper>
        <Typography variant="h6">Recetas Más Usadas</Typography>
        <Table>...</Table>
      </Paper>
    </Grid>
    <Grid item xs={12} md={6}>
      <Paper>
        <Typography variant="h6">Equipos Recientes</Typography>
        <Table>...</Table>
      </Paper>
    </Grid>
  </Grid>
</Box>
```

**Datos a cargar:**
```typescript
// Usar Promise.all para cargar todo en paralelo
const [equipos, recetas] = await Promise.all([
  equipoFabricadoApi.findAll(0, 1000),
  recetaFabricacionApi.findAll(0, 1000),
]);

// Calcular métricas:
const enProceso = equipos.content.filter(e => e.estado === 'EN_PROCESO').length;
const completados = equipos.content.filter(e => e.estado === 'COMPLETADO').length;
const cancelados = equipos.content.filter(e => e.estado === 'CANCELADO').length;

// Agrupar por tipo para gráfico
const porTipo = equipos.content.reduce((acc, eq) => {
  acc[eq.tipo] = (acc[eq.tipo] || 0) + 1;
  return acc;
}, {});

// Para gráfico de líneas, agrupar por mes
const porMes = equipos.content
  .filter(e => e.estado === 'COMPLETADO')
  .reduce((acc, eq) => {
    const mes = dayjs(eq.fechaFinalizacion).format('YYYY-MM');
    acc[mes] = (acc[mes] || 0) + 1;
    return acc;
  }, {});
```

## 📦 Dependencias Adicionales

Si aún no las tienes instaladas:

```bash
npm install @mui/x-data-grid @mui/x-charts
# o
npm install @mui/x-data-grid recharts
```

Para formularios:
```bash
npm install react-hook-form @hookform/resolvers yup
```

## 🎨 Paleta de Colores para Estados

```typescript
// Para EstadoFabricacion
const estadoColors = {
  EN_PROCESO: 'info',      // Azul
  COMPLETADO: 'success',   // Verde
  CANCELADO: 'error',      // Rojo
};

// Para TipoEquipo
const tipoColors = {
  HELADERA: 'primary',     // Azul primario
  COOLBOX: 'secondary',    // Morado/secundario
  EXHIBIDOR: 'success',    // Verde
  OTRO: 'warning',         // Naranja
};

// Para boolean asignado
const asignadoColors = {
  true: 'success',
  false: 'default',
};
```

## 🔗 Rutas Ya Configuradas en App.tsx

```
/fabricacion/dashboard             → DashboardFabricacion
/fabricacion/recetas               → RecetasList
/fabricacion/recetas/:id           → RecetaDetail
/fabricacion/recetas/nueva         → RecetaForm (create)
/fabricacion/recetas/editar/:id    → RecetaForm (edit)
/fabricacion/equipos               → EquiposList
/fabricacion/equipos/:id           → EquipoDetail
/fabricacion/equipos/nuevo         → EquipoForm (create)
/fabricacion/equipos/editar/:id    → EquipoForm (edit)
```

## 🚀 Próximos Pasos

1. Crear los 4 archivos pendientes siguiendo las plantillas de arriba
2. Usar los archivos ya creados (RecetasList, RecetaDetail, RecetaForm) como referencia
3. Probar la integración completa con el backend
4. Agregar el módulo al Sidebar para navegación
5. Ajustar estilos según el tema del sistema

## 💡 Consejos de Implementación

- **Reutiliza componentes**: Los patrones de RecetasList/Detail/Form son replicables para Equipos
- **Manejo de errores**: Siempre usa try/catch y muestra Snackbars con el error
- **Loading states**: Usa CircularProgress mientras cargan los datos
- **Confirmaciones**: Para acciones críticas (eliminar, cancelar) usa Dialog de confirmación
- **Navegación**: Usa useNavigate() de react-router-dom
- **TypeScript**: Aprovecha los tipos ya definidos en los archivos API

## 📚 Referencias

- Material UI: https://mui.com/
- React Hook Form: https://react-hook-form.com/
- Yup Validation: https://github.com/jquense/yup
- MUI X Charts: https://mui.com/x/react-charts/
- Recharts (alternativa): https://recharts.org/

---

**Nota:** Este módulo está diseñado para integrarse perfectamente con el backend Spring Boot ya implementado. Todos los endpoints están probados y funcionando.
