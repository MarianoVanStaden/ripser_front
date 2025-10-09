# API Connection Guide for Tareas de Recuento and Armado de Viajes

## ✅ COMPLETED: Tareas de Recuento (RecountTasksPage)

### Backend Implementation
- **Enum**: Added `RECUENTO` to `TipoMovimientoStock` enum
- **Repository**: Added `findRecuentosPendientes()` query
- **Controller**: Added 3 endpoints:
  - `POST /api/movimientos-stock/iniciar-recuento`
  - `GET /api/movimientos-stock/recuentos-pendientes`
  - `PUT /api/movimientos-stock/completar-recuento/{movimientoId}`

### Frontend Implementation
- **API Service**: `movimientoStockApi.ts` already connected (lines 87-110)
- **Components**:
  - `InventoryPage.tsx` - Uses `iniciarRecuento()` (line 241) ✅
  - `RecountTasksPage.tsx` - Uses `getRecuentosPendientes()` and `completarRecuento()` ✅

### ✅ STATUS: **FULLY CONNECTED AND WORKING**

---

## ✅ COMPLETED: Armado de Viajes (TripsPage)

### Backend Implementation
Backend already exists with full functionality:
- **Controller**: `ViajeController.java` at `/viajes`
- **Endpoints**:
  - `GET /viajes` - Get all trips
  - `GET /viajes/{id}` - Get trip by ID
  - `POST /viajes` - Create new trip
  - `PUT /viajes/{id}` - Update trip
  - `DELETE /viajes/{id}` - Delete trip
  - `GET /viajes/conductor/{conductorId}` - Get trips by driver
  - `GET /viajes/vehiculo/{vehiculoId}` - Get trips by vehicle
  - `PATCH /viajes/{id}/estado?estado={estado}` - Update trip status

### Frontend Updates Applied
1. **API Service** (`stockApi.ts`): Updated `tripApi` to use `/viajes` endpoints ✅
2. **Types** (`types/index.ts`): Updated to match backend DTOs ✅
   - `Trip` interface updated with Spanish field names
   - `TripStatus` enum updated (PLANIFICADO, EN_CURSO, COMPLETADO, CANCELADO)
   - `CreateTripRequest` updated with required fields

### 🔧 TODO: Update TripsPage.tsx

Replace mock data with real API calls in `TripsPage.tsx`:

```typescript
// At the top, import the API
import { tripApi, vehicleApi, employeeApi } from '../../api/services';

// Replace loadData function (around line 211):
const loadData = async () => {
  try {
    setLoading(true);
    setError(null);

    // Load real data from backend
    const [tripsData, vehiclesData, driversData] = await Promise.all([
      tripApi.getAll(),
      vehicleApi.getAll(),
      employeeApi.getAll() // Or filter by logistics department
    ]);

    setTrips(tripsData);
    setVehicles(vehiclesData);
    setDrivers(driversData.filter(e => e.department === 'Logística'));

  } catch (err) {
    setError('Error al cargar los datos');
    console.error('Error loading data:', err);
  } finally {
    setLoading(false);
  }
};

// Replace handleSave function (around line 268):
const handleSave = async () => {
  try {
    setLoading(true);

    const tripData: CreateTripRequest = {
      fechaViaje: new Date(formData.startDate).toISOString(),
      destino: formData.observations, // Or add a destino field
      conductorId: parseInt(formData.driverId),
      vehiculoId: parseInt(formData.vehicleId),
      estado: formData.status as TripStatus,
      observaciones: formData.observations,
    };

    if (editingTrip) {
      await tripApi.update(editingTrip.id, tripData);
    } else {
      await tripApi.create(tripData);
    }

    setDialogOpen(false);
    await loadData(); // Reload data

  } catch (err) {
    setError('Error al guardar el viaje');
    console.error('Error saving trip:', err);
  } finally {
    setLoading(false);
  }
};

// Replace handleDelete function:
const handleDelete = async (id: number) => {
  if (!confirm('¿Está seguro de eliminar este viaje?')) return;

  try {
    setLoading(true);
    await tripApi.delete(id);
    await loadData(); // Reload data
  } catch (err) {
    setError('Error al eliminar el viaje');
    console.error('Error deleting trip:', err);
  } finally {
    setLoading(false);
  }
};

// Add status update function:
const handleUpdateStatus = async (id: number, newStatus: TripStatus) => {
  try {
    setLoading(true);
    await tripApi.updateStatus(id, newStatus);
    await loadData(); // Reload data
  } catch (err) {
    setError('Error al actualizar el estado');
    console.error('Error updating status:', err);
  } finally {
    setLoading(false);
  }
};
```

### Field Mapping (Backend DTO → Frontend Display)

| Backend Field | Frontend Field | Description |
|--------------|---------------|-------------|
| `numeroViaje` | `tripNumber` | Trip ID/number |
| `fechaViaje` | `startDate` | Trip date |
| `destino` | - | Destination (needs to be added to form) |
| `conductorId` | `driverId` | Driver ID |
| `conductorNombre` | - | Driver name (display only) |
| `vehiculoId` | `vehicleId` | Vehicle ID |
| `vehiculoPatente` | - | License plate (display only) |
| `estado` | `status` | Trip status |
| `observaciones` | `observations` | Notes/observations |
| `entregas` | `deliveries` | List of deliveries |

---

## How to Use

### For Recount Tasks:
1. Go to **Inventario** page (`/logistica/inventario`)
2. Click **"Iniciar Recuento"** button
3. Select category (or leave blank for all products)
4. Add notes and click "Iniciar Recuento"
5. Go to **Tareas de Recuento** page (`/logistica/recuentos`)
6. Complete each recount task by entering the physical count

### For Trips:
1. Make sure Spring Boot backend is running
2. Go to **Viajes** page (`/logistica/viajes`)
3. After implementing the TODO above, you can:
   - View all trips
   - Create new trips
   - Update trip status
   - Delete trips
   - Filter by status

---

## Testing the Connection

### Test Recount Tasks:
```bash
# Check if backend is running
curl http://localhost:8080/api/movimientos-stock/recuentos-pendientes

# Should return an empty array [] or list of pending recounts
```

### Test Trips:
```bash
# Check if backend is running
curl http://localhost:8080/viajes

# Should return list of trips or empty array []
```

---

## Notes

- Both backends use Spring Boot on port 8080
- Frontend proxies API requests through Vite (check `vite.config.ts`)
- Recount functionality is **fully working** end-to-end
- Trips functionality needs **TripsPage.tsx** updates to connect to backend
