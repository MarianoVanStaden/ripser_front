# 🚀 Connecting Frontend to Your Spring Boot Backend

## Current Status

✅ **Frontend**: Running on `http://localhost:5174`  
❌ **Backend**: Needs to be started on `http://localhost:8080`

## Quick Start Guide

### 1. Start Your Spring Boot Backend

Navigate to your backend directory and start the server:

```bash
cd C:\Users\maria\ripser_backend
```

Then run one of these commands:

**Option A: Using Maven Wrapper (Recommended)**
```bash
./mvnw spring-boot:run
```

**Option B: Using Maven**
```bash
mvn spring-boot:run
```

**Option C: Using IDE**
- Open your Spring Boot project in your IDE
- Run the main application class

### 2. Verify Backend is Running

Your backend should be accessible at: `http://localhost:8080`

Test the connection:
```bash
curl http://localhost:8080/api/clients
```

### 3. Check the Dashboard

1. Open your browser and go to: `http://localhost:5174`
2. You should see the Dashboard with connection status
3. If backend is running, the status should show "Backend Connected"

## API Endpoints Expected

Your Spring Boot backend should expose these REST endpoints:

```
GET    /api/clients           - Get all clients
POST   /api/clients           - Create new client
GET    /api/clients/{id}      - Get client by ID
PUT    /api/clients/{id}      - Update client
DELETE /api/clients/{id}      - Delete client

GET    /api/employees         - Get all employees
POST   /api/employees         - Create new employee
GET    /api/employees/{id}    - Get employee by ID
PUT    /api/employees/{id}    - Update employee
DELETE /api/employees/{id}    - Delete employee

GET    /api/products          - Get all products
POST   /api/products          - Create new product
GET    /api/products/{id}     - Get product by ID
PUT    /api/products/{id}     - Update product
DELETE /api/products/{id}     - Delete product

GET    /api/categories        - Get all categories
POST   /api/categories        - Create new category
GET    /api/categories/{id}   - Get category by ID
PUT    /api/categories/{id}   - Update category
DELETE /api/categories/{id}   - Delete category

GET    /api/suppliers         - Get all suppliers
POST   /api/suppliers         - Create new supplier
GET    /api/suppliers/{id}    - Get supplier by ID
PUT    /api/suppliers/{id}    - Update supplier
DELETE /api/suppliers/{id}    - Delete supplier

GET    /api/orders           - Get all orders
POST   /api/orders           - Create new order
GET    /api/orders/{id}      - Get order by ID
PUT    /api/orders/{id}      - Update order
DELETE /api/orders/{id}      - Delete order

GET    /api/sales            - Get all sales
POST   /api/sales            - Create new sale
GET    /api/sales/{id}       - Get sale by ID
PUT    /api/sales/{id}       - Update sale
DELETE /api/sales/{id}       - Delete sale

GET    /api/services         - Get all services
POST   /api/services         - Create new service
GET    /api/services/{id}    - Get service by ID
PUT    /api/services/{id}    - Update service
DELETE /api/services/{id}    - Delete service

GET    /api/stock-movements       - Get all stock movements
POST   /api/stock-movements       - Create new stock movement
GET    /api/stock-movements/{id}  - Get stock movement by ID
PUT    /api/stock-movements/{id}  - Update stock movement
DELETE /api/stock-movements/{id}  - Delete stock movement

GET    /api/warehouses       - Get all warehouses
POST   /api/warehouses       - Create new warehouse
GET    /api/warehouses/{id}  - Get warehouse by ID
PUT    /api/warehouses/{id}  - Update warehouse
DELETE /api/warehouses/{id}  - Delete warehouse

GET    /api/vehicles         - Get all vehicles
POST   /api/vehicles         - Create new vehicle
GET    /api/vehicles/{id}    - Get vehicle by ID
PUT    /api/vehicles/{id}    - Update vehicle
DELETE /api/vehicles/{id}    - Delete vehicle

GET    /api/trips            - Get all trips
POST   /api/trips            - Create new trip
GET    /api/trips/{id}       - Get trip by ID
PUT    /api/trips/{id}       - Update trip
DELETE /api/trips/{id}       - Delete trip

GET    /api/deliveries       - Get all deliveries
POST   /api/deliveries       - Create new delivery
GET    /api/deliveries/{id}  - Get delivery by ID
PUT    /api/deliveries/{id}  - Update delivery
DELETE /api/deliveries/{id}  - Delete delivery
```

## CORS Configuration

Make sure your Spring Boot backend has CORS configured to allow requests from the frontend.

Add this to your Spring Boot configuration:

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://localhost:5174")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

## Troubleshooting

### Backend Not Starting?
1. Check if port 8080 is available
2. Verify Java version compatibility
3. Check for compilation errors in your backend code
4. Ensure all dependencies are properly configured

### CORS Errors?
1. Add the CORS configuration above to your backend
2. Make sure the frontend URL is included in allowed origins
3. Check browser developer tools for specific CORS errors

### API Endpoints Not Found?
1. Verify your controller classes have `@RestController` annotation
2. Check that your controllers are mapped to `/api/**` paths
3. Ensure your controllers are in the component scan path

## Next Steps

Once your backend is running:

1. ✅ Dashboard will show real data from your database
2. ✅ Client management will work with your actual Client entity
3. ✅ All CRUD operations will persist to your database
4. ✅ Navigate between different sections using the sidebar

The frontend is fully configured to work with your Spring Boot backend structure!

## Need Help?

1. Click the "Setup" button in the Dashboard for interactive help
2. Check the browser's developer console for error messages
3. Verify backend logs for any error messages
4. Use the "Test Connection" feature in the setup dialog

## ✅ Completed Modules

### Logistics Module (Fully Integrated)

The logistics module has been completed with full backend integration:

#### 🏪 Stock Management (`/logistica/stock`)
- ✅ Real-time stock levels from `/api/products`
- ✅ Stock movements tracking via `/api/stock-movements`
- ✅ Low stock alerts and inventory warnings
- ✅ Product categorization and supplier information
- ✅ Stock adjustment workflows

#### 📦 Inventory Management (`/logistica/inventario`)
- ✅ Complete inventory overview with real-time data
- ✅ Inventory adjustments (damage, theft, recounts)
- ✅ Stock movement history and audit trail
- ✅ Automated stock calculations
- ✅ Category-based inventory filtering

#### 🚚 Trip Management (`/logistica/viajes`)
- ✅ Trip planning and vehicle assignment
- ✅ Delivery route optimization
- ✅ Driver assignment and trip status tracking
- ✅ Real-time trip monitoring

#### 📋 Delivery Control (`/logistica/entregas`)
- ✅ Delivery scheduling and tracking
- ✅ Customer delivery confirmations
- ✅ Delivery status management
- ✅ Proof of delivery handling

All logistics modules include:
- 🔄 **Fallback Support**: Works with mock data if backend is unavailable
- 📱 **Responsive Design**: Mobile-friendly interface
- ⚡ **Real-time Updates**: Live data synchronization
- 🛡️ **Error Handling**: Graceful error management
- 📊 **Analytics Ready**: Structured for reporting features

### Backend Integration Status

| Module | Frontend | Backend API | Status |
|--------|----------|-------------|--------|
| Dashboard | ✅ | ✅ | Complete |
| Clients | ✅ | ✅ | Complete |
| Stock Management | ✅ | ✅ | Complete |
| Inventory | ✅ | ✅ | Complete |
| Trip Management | ✅ | ✅ | Complete |
| Delivery Control | ✅ | ✅ | Complete |
| Suppliers | ✅ | ✅ | Complete |
| Products | ✅ | ✅ | Complete |
| Categories | ✅ | ✅ | Complete |
| Employees | ✅ | ⏳ | Pending |
| Sales | ✅ | ⏳ | Pending |
| Services | ✅ | ⏳ | Pending |
