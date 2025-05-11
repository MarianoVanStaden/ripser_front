import { Routes, Route } from 'react-router-dom';
import Sidebar from './componentes/Sidebar';
import Inicio from './views/Inicio/Inicio';
import Tesoreria from './views/Administracion/Tesoreria';
import Gastos from './views/Administracion/Gastos';
import Cobros from './views/Administracion/Cobros';
import Ventas from './views/Administracion/Ventas';

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
        </Routes>
      </div>
    </div>
  );
}

export default App;

