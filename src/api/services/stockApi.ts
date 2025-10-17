import api from '../config';
import type { StockMovement, Warehouse, Vehicle, Trip, Delivery, CreateStockMovementRequest, CreateWarehouseRequest, CreateVehicleRequest, CreateTripRequest, CreateDeliveryRequest } from '../../types';

export const stockMovementApi = {
  // Get all stock movements
  getAll: async (): Promise<StockMovement[]> => {
    const response = await api.get('/api/stock-movements');
    return response.data;
  },

  // Get stock movement by ID
  getById: async (id: number): Promise<StockMovement> => {
    const response = await api.get(`/api/stock-movements/${id}`);
    return response.data;
  },

  // Create new stock movement
  create: async (movement: CreateStockMovementRequest): Promise<StockMovement> => {
    const response = await api.post('/api/stock-movements', movement);
    return response.data;
  },

  // Update stock movement
  update: async (id: number, movement: Partial<CreateStockMovementRequest>): Promise<StockMovement> => {
    const response = await api.put(`/api/stock-movements/${id}`, movement);
    return response.data;
  },

  // Delete stock movement
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/stock-movements/${id}`);
  },

  // Get movements by product
  getByProduct: async (productId: number): Promise<StockMovement[]> => {
    const response = await api.get(`/api/stock-movements/product/${productId}`);
    return response.data;
  },

  // Get movements by date range
  getByDateRange: async (startDate: string, endDate: string): Promise<StockMovement[]> => {
    const response = await api.get(`/api/stock-movements/date-range?start=${startDate}&end=${endDate}`);
    return response.data;
  },

  // Get movements by type
  getByType: async (type: string): Promise<StockMovement[]> => {
    const response = await api.get(`/api/stock-movements/type/${type}`);
    return response.data;
  }
};

export const warehouseApi = {
  // Get all warehouses
  getAll: async (): Promise<Warehouse[]> => {
    const response = await api.get('/api/warehouses');
    return response.data;
  },

  // Get warehouse by ID
  getById: async (id: number): Promise<Warehouse> => {
    const response = await api.get(`/api/warehouses/${id}`);
    return response.data;
  },

  // Create new warehouse
  create: async (warehouse: CreateWarehouseRequest): Promise<Warehouse> => {
    const response = await api.post('/api/warehouses', warehouse);
    return response.data;
  },

  // Update warehouse
  update: async (id: number, warehouse: Partial<CreateWarehouseRequest>): Promise<Warehouse> => {
    const response = await api.put(`/api/warehouses/${id}`, warehouse);
    return response.data;
  },

  // Delete warehouse
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/warehouses/${id}`);
  },

  // Get active warehouses
  getActive: async (): Promise<Warehouse[]> => {
    const response = await api.get('/api/warehouses/active');
    return response.data;
  }
};

export const vehicleApi = {
  // Get all vehicles
  getAll: async (): Promise<Vehicle[]> => {
    const response = await api.get('/vehiculos');
    return response.data;
  },

  // Get vehicle by ID
  getById: async (id: number): Promise<Vehicle> => {
    const response = await api.get(`/vehiculos/${id}`);
    return response.data;
  },

  // Create new vehicle
  create: async (vehicle: CreateVehicleRequest): Promise<Vehicle> => {
    const response = await api.post('/vehiculos', vehicle);
    return response.data;
  },

  // Update vehicle
  update: async (id: number, vehicle: Partial<CreateVehicleRequest>): Promise<Vehicle> => {
    const response = await api.put(`/vehiculos/${id}`, vehicle);
    return response.data;
  },

  // Delete vehicle
  delete: async (id: number): Promise<void> => {
    await api.delete(`/vehiculos/${id}`);
  },

  // Get vehicles by estado
  getByEstado: async (estado: string): Promise<Vehicle[]> => {
    const response = await api.get(`/vehiculos/estado/${estado}`);
    return response.data;
  }
};

export const tripApi = {
  // Get all trips
  getAll: async (): Promise<Trip[]> => {
    const response = await api.get('/viajes');
    return response.data;
  },

  // Get trip by ID
  getById: async (id: number): Promise<Trip> => {
    const response = await api.get(`/viajes/${id}`);
    return response.data;
  },

  // Create new trip
  create: async (trip: CreateTripRequest): Promise<Trip> => {
    const response = await api.post('/viajes', trip);
    return response.data;
  },

  // Update trip
  update: async (id: number, trip: Partial<CreateTripRequest>): Promise<Trip> => {
    const response = await api.put(`/viajes/${id}`, trip);
    return response.data;
  },

  // Delete trip
  delete: async (id: number): Promise<void> => {
    await api.delete(`/viajes/${id}`);
  },

  // Get trips by driver (conductor)
  getByDriver: async (conductorId: number): Promise<Trip[]> => {
    const response = await api.get(`/viajes/conductor/${conductorId}`);
    return response.data;
  },

  // Get trips by vehicle (vehiculo)
  getByVehicle: async (vehiculoId: number): Promise<Trip[]> => {
    const response = await api.get(`/viajes/vehiculo/${vehiculoId}`);
    return response.data;
  },

  // Update trip status (estado)
  updateStatus: async (id: number, estado: string): Promise<Trip> => {
    const response = await api.patch(`/viajes/${id}/estado?estado=${estado}`);
    return response.data;
  }
};

export const deliveryApi = {
  // Get all deliveries
  getAll: async (): Promise<Delivery[]> => {
    const response = await api.get('/api/deliveries');
    return response.data;
  },

  // Get delivery by ID
  getById: async (id: number): Promise<Delivery> => {
    const response = await api.get(`/api/deliveries/${id}`);
    return response.data;
  },

  // Create new delivery
  create: async (delivery: CreateDeliveryRequest): Promise<Delivery> => {
    const response = await api.post('/api/deliveries', delivery);
    return response.data;
  },

  // Update delivery
  update: async (id: number, delivery: Partial<CreateDeliveryRequest>): Promise<Delivery> => {
    const response = await api.put(`/api/deliveries/${id}`, delivery);
    return response.data;
  },

  // Delete delivery
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/deliveries/${id}`);
  },

  // Get deliveries by trip
  getByTrip: async (tripId: number): Promise<Delivery[]> => {
    const response = await api.get(`/api/deliveries/trip/${tripId}`);
    return response.data;
  },

  // Get deliveries by status
  getByStatus: async (status: string): Promise<Delivery[]> => {
    const response = await api.get(`/api/deliveries/status/${status}`);
    return response.data;
  }
};
