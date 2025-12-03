# 🎨 Guía de Actualización de Componentes - Clientes y Leads

**Fecha:** 3 de Diciembre, 2025
**Estado:** APIs y Badges completados ✅ | Componentes pendientes de actualización

---

## ✅ Completado

### 1. **APIs Actualizadas**

#### `src/api/services/leadApi.ts` ✅
- ✅ Agregado `getByPrioridad()` - Filtrar por HOT/WARM/COLD
- ✅ Agregado `getProximosSeguimiento()` - Leads próximos a seguimiento
- ✅ Agregado métodos de **Interacciones**:
  - `getInteracciones(leadId)` - Historial
  - `createInteraccion(leadId, data)` - Agregar
  - `updateInteraccion(leadId, interaccionId, data)` - Editar
  - `deleteInteraccion(leadId, interaccionId)` - Eliminar
- ✅ Agregado métodos de **Recordatorios**:
  - `getRecordatorios(leadId)` - Lista
  - `createRecordatorio(leadId, data)` - Crear
  - `updateRecordatorio(leadId, recordatorioId, data)` - Editar
  - `deleteRecordatorio(leadId, recordatorioId)` - Eliminar
- ✅ Agregado `getStatistics()` - Dashboard de Leads

#### `src/api/services/clientApi.ts` ✅
- ✅ Agregado `getBySegmento(segmento)` - Filtrar por VIP/PREMIUM/etc
- ✅ Agregado `getClientesEnRiesgoChurn()` - ⚠️ Clientes en riesgo
- ✅ Agregado `getClientesVIP()` - Acceso rápido a VIP
- ✅ Agregado `getClientesPremium()` - Acceso rápido a Premium
- ✅ Agregado `actualizarMetricas(clienteId)` - Recalcular métricas
- ✅ Agregado `getStatistics()` - Dashboard de Clientes

### 2. **Componentes UI Nuevos** ✅

#### `src/components/leads/LeadPriorityBadge.tsx` ✅
Badge visual para prioridades de Lead:
```tsx
import { LeadPriorityBadge } from '../leads/LeadPriorityBadge';

<LeadPriorityBadge priority="HOT" size="small" />
```
- 🔥 **HOT** - Rojo (#EF4444)
- ⚡ **WARM** - Naranja (#F59E0B)
- ❄️ **COLD** - Azul (#3B82F6)

#### `src/components/clientes/ClienteSegmentoBadge.tsx` ✅
Badge visual para segmentación de Cliente:
```tsx
import { ClienteSegmentoBadge } from '../clientes/ClienteSegmentoBadge';

<ClienteSegmentoBadge segmento="VIP" size="small" showIcon={true} />
```
- 💎 **VIP** - Púrpura (#9333EA)
- ⭐ **PREMIUM** - Naranja (#EA580C)
- ⚪ **STANDARD** - Azul (#0284C7)
- ⚫ **BASICO** - Gris (#64748B)

#### `src/components/clientes/ChurnRiskIndicator.tsx` ✅
Indicador de riesgo de churn:
```tsx
import { ChurnRiskIndicator } from '../clientes/ChurnRiskIndicator';

<ChurnRiskIndicator
  enRiesgo={cliente.enRiesgoChurn}
  diasDesdeUltimaCompra={cliente.diasDesdeUltimaCompra}
  frecuenciaCompraDias={cliente.frecuenciaCompraDias}
  variant="chip" // 'chip' | 'icon' | 'full'
  size="small"
/>
```

---

## 📝 Componentes Pendientes de Actualización

### 1. **LeadsList Component**

**Ubicación:** `src/components/leads/LeadsList.tsx`

**Campos a Agregar en DataGrid:**
```tsx
import { LeadPriorityBadge } from './LeadPriorityBadge';

const columns: GridColDef[] = [
  // Columnas existentes...

  // NUEVAS COLUMNAS
  {
    field: 'prioridad',
    headerName: 'Prioridad',
    width: 120,
    renderCell: (params) => (
      params.row.prioridad ? (
        <LeadPriorityBadge priority={params.row.prioridad} size="small" />
      ) : null
    )
  },
  {
    field: 'score',
    headerName: 'Score',
    width: 80,
    renderCell: (params) => (
      <Chip
        label={params.row.score || 0}
        size="small"
        color={params.row.score >= 75 ? 'success' : params.row.score >= 50 ? 'warning' : 'default'}
      />
    )
  },
  {
    field: 'presupuestoEstimado',
    headerName: 'Presupuesto Est.',
    width: 140,
    renderCell: (params) => (
      params.row.presupuestoEstimado ? (
        <Typography variant="body2" fontWeight="600" color="primary">
          ${params.row.presupuestoEstimado.toLocaleString()}
        </Typography>
      ) : '-'
    )
  },
  {
    field: 'fechaUltimoContacto',
    headerName: 'Último Contacto',
    width: 140,
    renderCell: (params) => {
      if (!params.row.fechaUltimoContacto) return '-';
      const fecha = new Date(params.row.fechaUltimoContacto);
      const dias = Math.floor((new Date().getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <Tooltip title={fecha.toLocaleDateString()}>
          <Typography variant="caption" color={dias > 7 ? 'error' : 'text.secondary'}>
            Hace {dias} días
          </Typography>
        </Tooltip>
      );
    }
  },
  {
    field: 'fechaProximoSeguimiento',
    headerName: 'Próximo Seguimiento',
    width: 160,
    renderCell: (params) => {
      if (!params.row.fechaProximoSeguimiento) return '-';
      const fecha = new Date(params.row.fechaProximoSeguimiento);
      const hoy = new Date();
      const esPasado = fecha < hoy;
      return (
        <Chip
          label={fecha.toLocaleDateString()}
          size="small"
          color={esPasado ? 'error' : 'info'}
          variant={esPasado ? 'filled' : 'outlined'}
        />
      );
    }
  }
];
```

**Filtros a Agregar:**
```tsx
const [filtros, setFiltros] = useState({
  prioridad: null as PrioridadLeadEnum | null,
  scoreMin: 0,
  scoreMax: 100,
  // ...filtros existentes
});

// Agregar filtro dropdown de prioridad
<FormControl size="small" sx={{ minWidth: 150 }}>
  <InputLabel>Prioridad</InputLabel>
  <Select
    value={filtros.prioridad || ''}
    onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value as PrioridadLeadEnum })}
  >
    <MenuItem value="">Todas</MenuItem>
    <MenuItem value="HOT">🔥 Hot</MenuItem>
    <MenuItem value="WARM">⚡ Warm</MenuItem>
    <MenuItem value="COLD">❄️ Cold</MenuItem>
  </Select>
</FormControl>
```

---

### 2. **ClientesList Component**

**Ubicación:** `src/components/clients/ClientesList.tsx` o similar

**Campos a Agregar en DataGrid:**
```tsx
import { ClienteSegmentoBadge } from '../clientes/ClienteSegmentoBadge';
import { ChurnRiskIndicator } from '../clientes/ChurnRiskIndicator';

const columns: GridColDef[] = [
  // Columnas existentes...

  // NUEVAS COLUMNAS
  {
    field: 'segmento',
    headerName: 'Segmento',
    width: 120,
    renderCell: (params) => (
      params.row.segmento ? (
        <ClienteSegmentoBadge segmento={params.row.segmento} size="small" />
      ) : null
    )
  },
  {
    field: 'lifetimeValue',
    headerName: 'LTV',
    width: 130,
    renderCell: (params) => (
      params.row.lifetimeValue ? (
        <Typography variant="body2" fontWeight="700" color="success.main">
          ${params.row.lifetimeValue.toLocaleString()}
        </Typography>
      ) : '-'
    )
  },
  {
    field: 'ticketPromedio',
    headerName: 'Ticket Prom.',
    width: 120,
    renderCell: (params) => (
      params.row.ticketPromedio ? (
        <Typography variant="body2">
          ${params.row.ticketPromedio.toLocaleString()}
        </Typography>
      ) : '-'
    )
  },
  {
    field: 'enRiesgoChurn',
    headerName: 'Estado',
    width: 140,
    renderCell: (params) => (
      <ChurnRiskIndicator
        enRiesgo={params.row.enRiesgoChurn || false}
        diasDesdeUltimaCompra={params.row.diasDesdeUltimaCompra}
        frecuenciaCompraDias={params.row.frecuenciaCompraDias}
        variant="icon"
        size="small"
      />
    )
  },
  {
    field: 'diasDesdeUltimaCompra',
    headerName: 'Última Compra',
    width: 140,
    renderCell: (params) => {
      if (!params.row.diasDesdeUltimaCompra) return '-';
      const dias = params.row.diasDesdeUltimaCompra;
      return (
        <Typography variant="caption" color={dias > 90 ? 'error' : 'text.secondary'}>
          Hace {dias} días
        </Typography>
      );
    }
  }
];
```

**Filtros a Agregar:**
```tsx
const [filtros, setFiltros] = useState({
  segmento: null as SegmentoCliente | null,
  mostrarSoloRiesgoChurn: false,
  // ...filtros existentes
});

// Agregar filtro dropdown de segmento
<FormControl size="small" sx={{ minWidth: 150 }}>
  <InputLabel>Segmento</InputLabel>
  <Select
    value={filtros.segmento || ''}
    onChange={(e) => setFiltros({ ...filtros, segmento: e.target.value as SegmentoCliente })}
  >
    <MenuItem value="">Todos</MenuItem>
    <MenuItem value="VIP">💎 VIP</MenuItem>
    <MenuItem value="PREMIUM">⭐ Premium</MenuItem>
    <MenuItem value="STANDARD">⚪ Standard</MenuItem>
    <MenuItem value="BASICO">⚫ Básico</MenuItem>
  </Select>
</FormControl>

// Agregar checkbox para riesgo de churn
<FormControlLabel
  control={
    <Checkbox
      checked={filtros.mostrarSoloRiesgoChurn}
      onChange={(e) => setFiltros({ ...filtros, mostrarSoloRiesgoChurn: e.target.checked })}
    />
  }
  label="Solo en riesgo de churn"
/>
```

**Botón de Acción Rápida:**
```tsx
<Button
  variant="outlined"
  color="error"
  startIcon={<WarningIcon />}
  onClick={async () => {
    const clientesEnRiesgo = await clientApi.getClientesEnRiesgoChurn();
    setClientes(clientesEnRiesgo);
  }}
>
  Ver Clientes en Riesgo ({clientesEnRiesgoCount})
</Button>
```

---

### 3. **Dashboard Component**

**Ubicación:** `src/components/Dashboard/Dashboard.tsx`

**Nuevas Tarjetas KPI:**
```tsx
// En el estado
const [leadsStats, setLeadsStats] = useState<any>(null);
const [clientesStats, setClientesStats] = useState<any>(null);

// Cargar estadísticas
useEffect(() => {
  const loadStats = async () => {
    const [leads, clientes] = await Promise.all([
      leadApi.getStatistics(),
      clientApi.getStatistics()
    ]);
    setLeadsStats(leads);
    setClientesStats(clientes);
  };
  loadStats();
}, []);

// NUEVAS TARJETAS
<StatCard
  title="Leads Hot"
  value={leadsStats?.leadsPorPrioridad?.HOT || 0}
  icon={<LocalFireDepartmentIcon />}
  color="#EF4444"
  subtitle="Alta prioridad"
/>

<StatCard
  title="Clientes VIP"
  value={clientesStats?.clientesPorSegmento?.VIP || 0}
  icon={<DiamondIcon />}
  color="#9333EA"
  subtitle={`LTV Total: $${(clientesStats?.vipTotalLTV || 0).toLocaleString()}`}
/>

<StatCard
  title="Riesgo de Churn"
  value={clientesStats?.clientesEnRiesgoChurn || 0}
  icon={<WarningIcon />}
  color="#EF4444"
  subtitle="Requiere atención"
/>

<StatCard
  title="Score Promedio Leads"
  value={leadsStats?.promedioScore || 0}
  icon={<TrendingUpIcon />}
  color="#10B981"
  subtitle="Calidad de leads"
/>
```

**Nueva Sección - Tabla de Leads por Prioridad:**
```tsx
<Card sx={{ mb: 3 }}>
  <CardContent>
    <Typography variant="h6" gutterBottom>
      Distribución de Leads por Prioridad
    </Typography>
    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
      <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: '#FEE2E2', borderRadius: 1 }}>
        <Typography variant="h4" fontWeight="bold" color="#991B1B">
          {leadsStats?.leadsPorPrioridad?.HOT || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          🔥 Hot
        </Typography>
      </Box>
      <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: '#FEF3C7', borderRadius: 1 }}>
        <Typography variant="h4" fontWeight="bold" color="#92400E">
          {leadsStats?.leadsPorPrioridad?.WARM || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ⚡ Warm
        </Typography>
      </Box>
      <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: '#DBEAFE', borderRadius: 1 }}>
        <Typography variant="h4" fontWeight="bold" color="#1E3A8A">
          {leadsStats?.leadsPorPrioridad?.COLD || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ❄️ Cold
        </Typography>
      </Box>
    </Box>
  </CardContent>
</Card>
```

**Nueva Sección - Clientes en Riesgo:**
```tsx
<Card sx={{ mb: 3 }}>
  <CardContent>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6">
        ⚠️ Clientes en Riesgo de Churn
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={() => navigate('/clientes?filter=riesgo-churn')}
      >
        Ver Todos
      </Button>
    </Box>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Cliente</TableCell>
            <TableCell>Segmento</TableCell>
            <TableCell align="right">LTV</TableCell>
            <TableCell>Última Compra</TableCell>
            <TableCell>Motivo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clientesEnRiesgo.slice(0, 5).map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell>{cliente.nombre}</TableCell>
              <TableCell>
                <ClienteSegmentoBadge segmento={cliente.segmento} size="small" />
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="600">
                  ${cliente.lifetimeValue?.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  Hace {cliente.diasDesdeUltimaCompra} días
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption" color="error">
                  {cliente.frecuenciaCompraDias
                    ? `Superó ${cliente.frecuenciaCompraDias * 2} días`
                    : 'Inactivo'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </CardContent>
</Card>
```

---

## 🎯 Pasos de Implementación Recomendados

### Fase 1: Actualizar Listas (30 min)
1. ✅ Abrir `LeadsList.tsx`
2. ✅ Importar `LeadPriorityBadge`
3. ✅ Agregar columnas de prioridad, score, presupuesto
4. ✅ Agregar filtro de prioridad
5. ✅ Repetir para `ClientesList.tsx` con segmento y churn

### Fase 2: Actualizar Dashboard (20 min)
1. ✅ Importar APIs de estadísticas
2. ✅ Cargar datos con `leadApi.getStatistics()` y `clientApi.getStatistics()`
3. ✅ Agregar nuevas tarjetas KPI
4. ✅ Agregar sección de distribución de leads
5. ✅ Agregar tabla de clientes en riesgo

### Fase 3: Testing (15 min)
1. ✅ Probar filtros de prioridad en Leads
2. ✅ Probar filtros de segmento en Clientes
3. ✅ Verificar que badges se muestren correctamente
4. ✅ Verificar indicadores de churn
5. ✅ Probar navegación desde Dashboard

---

## 📦 Imports Necesarios

### Para LeadsList.tsx
```tsx
import { LeadPriorityBadge } from './LeadPriorityBadge';
import { Chip, Tooltip, Typography } from '@mui/material';
import { PrioridadLeadEnum } from '../../types/lead.types';
```

### Para ClientesList.tsx
```tsx
import { ClienteSegmentoBadge } from '../clientes/ClienteSegmentoBadge';
import { ChurnRiskIndicator } from '../clientes/ChurnRiskIndicator';
import { SegmentoCliente } from '../../types';
import { Checkbox, FormControlLabel } from '@mui/material';
```

### Para Dashboard.tsx
```tsx
import { leadApi } from '../../api/services/leadApi';
import { clientApi } from '../../api/services/clientApi';
import { ClienteSegmentoBadge } from '../clientes/ClienteSegmentoBadge';
import {
  LocalFireDepartment as LocalFireDepartmentIcon,
  Diamond as DiamondIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
```

---

## ✅ Checklist Final

### APIs ✅
- [x] leadApi.ts actualizado con interacciones y recordatorios
- [x] clientApi.ts actualizado con segmentación y churn

### Componentes UI Nuevos ✅
- [x] LeadPriorityBadge creado
- [x] ClienteSegmentoBadge creado
- [x] ChurnRiskIndicator creado

### Actualización de Componentes Existentes (Pendiente)
- [ ] LeadsList - Agregar columnas y filtros
- [ ] ClientesList - Agregar columnas y filtros
- [ ] Dashboard - Agregar métricas y visualizaciones

---

**Creado por:** Claude Code
**Fecha:** 3 de Diciembre, 2025
**Estado:** Guía completa para implementación ✅
