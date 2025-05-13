import { Routes, Route } from 'react-router-dom';
import Sidebar from './componentes/Sidebar';
import Inicio from './views/Inicio/Inicio';
import Tesoreria from './views/Administracion/Tesoreria';
import Gastos from './views/Administracion/Gastos';
import Cobros from './views/Administracion/Cobros';
import Ventas from './views/Administracion/Ventas';
import Amortizaciones from './views/Tesoreria/Amortizaciones';
import Bancos from './views/Tesoreria/Bancos';
import Cheques from './views/Tesoreria/Cheques';
import Efectivo from './views/Tesoreria/Efectivo';
import MercadoPago from './views/Tesoreria/MercadoPago';

import ArmadoViajes from './views/Logistica/ArmadoViajes';
import EstadisticasyEstacionamientos from './views/Logistica/EstadisticasyEstacionamientos';
import RendicionViajes from './views/Logistica/RendicionViajes';
import SolucionViajes from './views/Logistica/SolucionViajes';
import VehiculosyViajeros from './views/Logistica/VehiculosyViajeros';
import Viajes from './views/Logistica/Viajes';




function App() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/gastos" element={<Gastos />} />
          <Route path="/cobros" element={<Cobros />} />
          <Route path="/tesoreria" element={<Tesoreria />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/amortizaciones" element={<Amortizaciones />} />
          <Route path="/bancos" element={<Bancos />} />
          <Route path="/cheques" element={<Cheques />} />
          <Route path="/efectivo" element={<Efectivo />} />
          <Route path="/mercado-pago" element={<MercadoPago />} />

          <Route path="/viajes" element={<Viajes />} />
          <Route path="/armado-viajes" element={<ArmadoViajes/>} />
          <Route path="/estacionamientos" element={<EstadisticasyEstacionamientos />} />
          <Route path="/rendicion" element={<RendicionViajes />} />
          <Route path="/vehiculos" element={<VehiculosyViajeros />} />
          <Route path="/solucion-viaje" element={<SolucionViajes />} />



        </Routes>
      </div>
    </div>
  );
}

export default App;

