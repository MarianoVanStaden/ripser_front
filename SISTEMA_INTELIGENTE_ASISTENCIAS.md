# 🤖 Sistema Inteligente de Asistencias - Guía de Implementación Frontend

## 📋 Resumen del Cambio

### ❌ Sistema Anterior
- Registro manual diario de cada asistencia
- Repetición de datos constante
- Alto riesgo de errores humanos

### ✅ Nuevo Sistema Inteligente
- **Configuración única**: Horario semanal por empleado
- **Generación automática**: Asistencias creadas a las 00:01 AM diariamente
- **Excepciones únicamente**: Solo se registran variaciones (faltas, tardanzas, horas extras)
- **Recálculo automático**: Al crear/editar/eliminar excepciones

---

## 🗂️ Archivos Creados

### 1. `configuracionAsistenciaApi.ts`
Maneja la configuración de horarios semanales por empleado.

**Endpoints:**
- `getAll()` - Listar configuraciones
- `getById(id)` - Obtener por ID
- `getByEmpleado(empleadoId)` - Obtener configuración de un empleado
- `create(data)` - Crear configuración personalizada
- `createHorarioEstandar(empleadoId)` - Crear horario L-V 8:00-17:00
- `update(id, data)` - Actualizar configuración
- `delete(id)` - Eliminar configuración

### 2. `excepcionAsistenciaApi.ts`
Maneja excepciones (variaciones del horario normal).

**Tipos de Excepciones:**
- `INASISTENCIA` - No vino a trabajar
- `LLEGADA_TARDE` - Llegó después de la hora
- `SALIDA_ANTICIPADA` - Se fue antes de la hora
- `HORAS_EXTRAS` - Trabajó horas adicionales
- `PERMISO` - Permiso por horas
- `MODIFICACION_HORARIO` - Cambió el horario ese día específico

**Endpoints:**
- `getAll()` - Listar excepciones
- `getById(id)` - Obtener por ID
- `getByEmpleado(empleadoId)` - Excepciones de un empleado
- `getByPeriodo(desde, hasta)` - Excepciones por período
- `create(data)` - Crear excepción (recalcula asistencia automáticamente)
- `update(id, data)` - Actualizar excepción (recalcula automáticamente)
- `delete(id)` - Eliminar excepción (restaura horario normal)

### 3. `asistenciaAutomaticaApi.ts`
Operaciones de generación y recálculo automático.

**Endpoints:**
- `generar(empleadoId, desde, hasta)` - Generar asistencias para período
- `recalcular(empleadoId, desde, hasta)` - Recalcular asistencias existentes
- `ejecutarGeneracionDiaria()` - Simular proceso automático diario
- `debeTrabajar(empleadoId, fecha)` - Verificar si debe trabajar ese día

---

## 🎨 Componentes UI Sugeridos

### 📅 Pantalla Principal: Tabs

```tsx
<Tabs value={tabValue}>
  <Tab label="Resumen Diario" />         // Vista general del día
  <Tab label="Configurar Horarios" />     // Configuración semanal
  <Tab label="Excepciones" />             // Registro de excepciones
  <Tab label="Reportes" />                // Estadísticas y análisis
</Tabs>
```

### 1️⃣ Tab: Resumen Diario

**KPIs:**
- Presentes (chip verde)
- Tardanzas (chip naranja)
- Ausencias (chip rojo)
- Horas extras totales (chip azul)

**Tabla:**
- Columnas: Empleado | Estado | Entrada | Salida | Horas | Tipo Registro | Acciones
- Badges para indicar excepciones
- Iconos: 🤖 Automático | ✏️ Manual | ⚠️ Modificado

**Funcionalidades:**
- Selector de fecha
- Botón "Generar Automáticas" (ejecuta proceso diario manualmente)
- Botón "Registrar Excepción" por empleado

### 2️⃣ Tab: Configurar Horarios

**Lista de Empleados:**
```tsx
<Table>
  <TableRow>
    <TableCell>Juan Pérez</TableCell>
    <TableCell>L-V: 09:00-18:00</TableCell>
    <TableCell><Chip label="Configurado" color="success" /></TableCell>
    <TableCell><Button>Editar</Button></TableCell>
  </TableRow>
  <TableRow>
    <TableCell>María González</TableCell>
    <TableCell>-</TableCell>
    <TableCell><Chip label="Sin Configurar" color="warning" /></TableCell>
    <TableCell><Button>Crear Estándar</Button></TableCell>
  </TableRow>
</Table>
```

**Dialog de Configuración:**
```tsx
<Dialog>
  <DialogTitle>Configurar Horario - Juan Pérez</DialogTitle>
  <DialogContent>
    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dia => (
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <FormControlLabel
            control={<Checkbox checked={horario[dia].trabaja} />}
            label={dia}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField 
            type="time" 
            label="Entrada"
            disabled={!horario[dia].trabaja}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField 
            type="time" 
            label="Salida"
            disabled={!horario[dia].trabaja}
          />
        </Grid>
      </Grid>
    ))}
  </DialogContent>
</Dialog>
```

### 3️⃣ Tab: Excepciones

**Selector de Tipo Dinámico:**
```tsx
<FormControl>
  <Select value={tipoExcepcion} onChange={handleTipoChange}>
    <MenuItem value="INASISTENCIA">Inasistencia</MenuItem>
    <MenuItem value="LLEGADA_TARDE">Llegada Tarde</MenuItem>
    <MenuItem value="SALIDA_ANTICIPADA">Salida Anticipada</MenuItem>
    <MenuItem value="HORAS_EXTRAS">Horas Extras</MenuItem>
    <MenuItem value="PERMISO">Permiso</MenuItem>
    <MenuItem value="MODIFICACION_HORARIO">Modificación de Horario</MenuItem>
  </Select>
</FormControl>

{/* Campos dinámicos según tipo */}
{tipoExcepcion === 'LLEGADA_TARDE' && (
  <TextField type="time" label="Hora de Llegada Real" />
)}

{tipoExcepcion === 'HORAS_EXTRAS' && (
  <TextField type="number" label="Horas Extras Trabajadas" />
)}

{tipoExcepcion === 'INASISTENCIA' && (
  <>
    <TextField label="Motivo" />
    <FormControlLabel
      control={<Checkbox />}
      label="Ausencia Justificada"
    />
  </>
)}
```

**Lista de Excepciones del Mes:**
```tsx
<Table>
  <TableHead>
    <TableRow>
      <TableCell>Fecha</TableCell>
      <TableCell>Empleado</TableCell>
      <TableCell>Tipo</TableCell>
      <TableCell>Detalles</TableCell>
      <TableCell>Justificado</TableCell>
      <TableCell>Acciones</TableCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {excepciones.map(exc => (
      <TableRow>
        <TableCell>{dayjs(exc.fecha).format('DD/MM/YYYY')}</TableCell>
        <TableCell>{exc.empleadoNombre} {exc.empleadoApellido}</TableCell>
        <TableCell>
          <Chip 
            label={exc.tipo} 
            color={getColorByTipo(exc.tipo)}
          />
        </TableCell>
        <TableCell>{getDetalles(exc)}</TableCell>
        <TableCell>
          {exc.justificado ? 
            <CheckCircleIcon color="success" /> : 
            <CancelIcon color="error" />
          }
        </TableCell>
        <TableCell>
          <IconButton onClick={() => handleEdit(exc)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(exc)}>
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 🔄 Flujos de Trabajo

### Flujo 1: Configuración Inicial de Empleado Nuevo

```typescript
const configurarEmpleadoNuevo = async (empleadoId: number) => {
  try {
    // 1. Verificar si ya tiene configuración
    const config = await configuracionAsistenciaApi.getByEmpleado(empleadoId);
    console.log('Ya tiene configuración:', config);
  } catch (error: any) {
    if (error.response?.status === 404) {
      // 2. No tiene configuración, crear horario estándar
      const nuevaConfig = await configuracionAsistenciaApi
        .createHorarioEstandar(empleadoId);
      
      console.log('✅ Horario estándar creado:', nuevaConfig);
      
      // 3. Generar asistencias retroactivas del mes actual
      const desde = dayjs().startOf('month').format('YYYY-MM-DD');
      const hasta = dayjs().format('YYYY-MM-DD');
      
      await asistenciaAutomaticaApi.generar(empleadoId, desde, hasta);
      console.log('✅ Asistencias retroactivas generadas');
    }
  }
};
```

### Flujo 2: Registrar Inasistencia

```typescript
const registrarInasistencia = async (empleadoId: number, fecha: string) => {
  try {
    // 1. Verificar si debe trabajar ese día
    const debeTrabajar = await asistenciaAutomaticaApi
      .debeTrabajar(empleadoId, fecha);
    
    if (!debeTrabajar) {
      setError('El empleado no tiene programado trabajar ese día');
      return;
    }
    
    // 2. Crear excepción
    const excepcion: ExcepcionAsistenciaDTO = {
      empleadoId,
      fecha,
      tipo: 'INASISTENCIA',
      motivo: 'Enfermedad',
      justificado: true,
      observaciones: 'Presentó certificado médico'
    };
    
    await excepcionAsistenciaApi.create(excepcion);
    
    // 3. ✅ El sistema recalcula automáticamente el registro de asistencia
    console.log('✅ Excepción registrada y asistencia recalculada');
    
    // 4. Recargar datos
    await loadAsistenciasByPeriodo();
    
  } catch (error) {
    console.error('Error al registrar inasistencia:', error);
  }
};
```

### Flujo 3: Registrar Llegada Tarde

```typescript
const registrarLlegadaTarde = async (
  empleadoId: number, 
  fecha: string, 
  horaLlegada: string
) => {
  const excepcion: ExcepcionAsistenciaDTO = {
    empleadoId,
    fecha,
    tipo: 'LLEGADA_TARDE',
    horaEntradaReal: horaLlegada, // ej: "10:30"
    motivo: 'Problemas de tráfico',
    justificado: false
  };
  
  await excepcionAsistenciaApi.create(excepcion);
  
  // ✅ Sistema recalcula automáticamente:
  // - Actualiza hora de entrada en el registro de asistencia
  // - Recalcula horas trabajadas
  // - Calcula minutos de tardanza
};
```

### Flujo 4: Actualizar Configuración de Horario

```typescript
const actualizarHorario = async (
  configId: number, 
  nuevaConfig: ConfiguracionAsistenciaDTO
) => {
  try {
    // 1. Actualizar configuración
    await configuracionAsistenciaApi.update(configId, nuevaConfig);
    
    // 2. Recalcular asistencias futuras
    const desde = dayjs().add(1, 'day').format('YYYY-MM-DD');
    const hasta = dayjs().add(30, 'days').format('YYYY-MM-DD');
    
    await asistenciaAutomaticaApi.recalcular(
      nuevaConfig.empleadoId, 
      desde, 
      hasta
    );
    
    console.log('✅ Horario actualizado y asistencias recalculadas');
    
  } catch (error) {
    console.error('Error al actualizar horario:', error);
  }
};
```

---

## ✅ Validaciones

### En Configuración de Horarios

```typescript
const validarConfiguracion = (config: ConfiguracionAsistenciaDTO): string | null => {
  for (const dia of ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']) {
    const horario = config[dia];
    
    if (horario?.trabaja) {
      if (!horario.horaEntrada || !horario.horaSalida) {
        return `${dia}: Si trabaja, debe especificar entrada y salida`;
      }
      
      if (horario.horaSalida <= horario.horaEntrada) {
        return `${dia}: La hora de salida debe ser posterior a la entrada`;
      }
    }
  }
  
  return null; // ✅ Válido
};
```

### En Excepciones

```typescript
const validarExcepcion = (exc: ExcepcionAsistenciaDTO): string | null => {
  switch (exc.tipo) {
    case 'INASISTENCIA':
      // No requiere horarios
      break;
      
    case 'LLEGADA_TARDE':
      if (!exc.horaEntradaReal) {
        return 'Debe especificar la hora de llegada';
      }
      break;
      
    case 'SALIDA_ANTICIPADA':
      if (!exc.horaSalidaReal) {
        return 'Debe especificar la hora de salida';
      }
      break;
      
    case 'HORAS_EXTRAS':
      if (!exc.horasExtras || exc.horasExtras <= 0) {
        return 'Debe especificar las horas extras trabajadas';
      }
      break;
      
    case 'PERMISO':
    case 'MODIFICACION_HORARIO':
      if (!exc.horaEntradaReal || !exc.horaSalidaReal) {
        return 'Debe especificar entrada y salida';
      }
      break;
  }
  
  return null; // ✅ Válido
};
```

---

## 🎨 Helpers de UI

### Obtener Chip de Estado

```typescript
const getEstadoChip = (estado: string) => {
  const config = {
    PRESENTE: { color: 'success', icon: <CheckCircleIcon />, label: 'Presente' },
    TARDANZA: { color: 'warning', icon: <WarningIcon />, label: 'Tardanza' },
    AUSENTE_JUSTIFICADO: { color: 'info', icon: <EventBusyIcon />, label: 'Ausente Justificado' },
    AUSENTE_INJUSTIFICADO: { color: 'error', icon: <CancelIcon />, label: 'Ausente' },
    FERIADO: { color: 'default', icon: <CalendarIcon />, label: 'Feriado' },
    DIA_NO_LABORABLE: { color: 'default', icon: <EventBusyIcon />, label: 'No Laborable' }
  };
  
  const cfg = config[estado] || config.PRESENTE;
  return <Chip size="small" color={cfg.color} icon={cfg.icon} label={cfg.label} />;
};
```

### Obtener Icono de Tipo de Registro

```typescript
const getTipoRegistroIcon = (tipo: string) => {
  const icons = {
    AUTOMATICO: <AutoModeIcon fontSize="small" color="action" />,
    MANUAL: <ManualModeIcon fontSize="small" color="primary" />,
    MODIFICADO: <EditIcon fontSize="small" color="warning" />
  };
  
  return icons[tipo] || null;
};
```

### Formatear Detalles de Excepción

```typescript
const getDetallesExcepcion = (exc: ExcepcionAsistenciaDTO): string => {
  switch (exc.tipo) {
    case 'LLEGADA_TARDE':
      return `Llegó a las ${exc.horaEntradaReal}`;
    case 'SALIDA_ANTICIPADA':
      return `Salió a las ${exc.horaSalidaReal}`;
    case 'HORAS_EXTRAS':
      return `${exc.horasExtras}h extras`;
    case 'PERMISO':
      return `${exc.horaEntradaReal} - ${exc.horaSalidaReal}`;
    case 'MODIFICACION_HORARIO':
      return `Nuevo horario: ${exc.horaEntradaReal} - ${exc.horaSalidaReal}`;
    case 'INASISTENCIA':
    default:
      return exc.motivo || '-';
  }
};
```

---

## 🧪 Testing Manual

### 1. Crear Configuración Estándar
```http
POST /api/configuracion-asistencia/horario-estandar/1
```

### 2. Ejecutar Generación Diaria
```http
POST /api/asistencia-automatica/ejecutar-generacion-diaria
```

### 3. Ver Asistencias Generadas
```http
GET /api/registro-asistencia/periodo?fechaInicio=2025-10-14&fechaFin=2025-10-14
```

### 4. Registrar Inasistencia
```http
POST /api/excepciones-asistencia
{
  "empleadoId": 1,
  "fecha": "2025-10-14",
  "tipo": "INASISTENCIA",
  "motivo": "Enfermedad",
  "justificado": true
}
```

### 5. Verificar Recálculo
```http
GET /api/registro-asistencia/periodo?fechaInicio=2025-10-14&fechaFin=2025-10-14
```
La asistencia del día debe estar eliminada o marcada como ausente.

---

## 📝 Notas Importantes

1. **Formatos de Fecha/Hora:**
   - Fechas: `YYYY-MM-DD` (ISO 8601)
   - Horas: `HH:mm:ss` o `HH:mm`

2. **Recálculo Automático:**
   - Al crear/editar/eliminar excepciones, el sistema recalcula automáticamente
   - NO necesitas llamar endpoints adicionales

3. **Configuración + Excepción:**
   - La configuración define el horario "normal"
   - Las excepciones modifican días específicos
   - El sistema combina ambos para generar el registro final

4. **Endpoint Existente:**
   - `GET /api/registro-asistencia/periodo` sigue funcionando
   - Ahora retorna asistencias automáticas + modificadas por excepciones

---

## 🚀 Próximos Pasos

1. ✅ Crear servicios API (completado)
2. 🔄 Actualizar `AsistenciasPage.tsx` con tabs
3. 🔄 Implementar tab "Configurar Horarios"
4. 🔄 Implementar tab "Excepciones"
5. 🔄 Implementar tab "Resumen Diario"
6. 🔄 Testing completo del flujo

---

**¿Quieres que implemente algún tab específico primero?** 🎯
