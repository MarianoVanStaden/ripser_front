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
        </Routes>
      </div>
    </div>
  );
}

export default App;

