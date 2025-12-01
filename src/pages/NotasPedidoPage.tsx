import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('empresaId');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Attaching token to request:', token.substring(0, 20) + '...', config.url);
    }
    
    // Add tenant ID header if available
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
      console.log('Attaching tenant ID to request:', tenantId);
    } else {
      console.warn('⚠️ No tenant ID found in localStorage!');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('❌ Server error:', error.response.data);
      
      // Handle unauthorized errors
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('❌ Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ...existing code...

try {
  console.log('📝 Datos del equipo a crear:', equipoData);
  const equiposCreados = await createBatch([equipoData]);
  console.log('✅ Equipos creados:', equiposCreados);
  equiposNuevosIds.push(...equiposCreados.map((e: any) => e.id));
  equiposCreados.forEach((equipo: any) => {
    equiposCreatedMap.set(equipoKey, equipo.id);
  });
} catch (error: any) {
  console.error(`❌ Error creating equipos for receta ${receta.id}:`, error);
  
  // Handle 409 Conflict specifically
  if (error.response?.status === 409) {
    const errorMessage = error.response.data?.message || 
      'No hay suficientes componentes en stock para fabricar este equipo';
    warnings.push(
      `⚠️ No se pudo crear "${receta.nombre}" (${color} - ${medida}): ${errorMessage}. ` +
      `Iniciá el proceso de producción cuando tengas los componentes necesarios.`
    );
  } else {
    warnings.push(
      `⚠️ No se pudieron crear ${cantidadRequerida} equipo(s) "${receta.nombre}" (${color} - ${medida}). ` +
      `Error: ${error.message || 'Error desconocido'}`
    );
  }
}

// ...existing code...