import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './componentes/Sidebar.jsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '20px' }}>
        <h2>Bienvenida al panel</h2>
      </main>
    </div>

    </>
  )
}

export default App

//// App.jsx
//import { Routes, Route } from 'react-router-dom';
//import Sidebar from './componentes/Sidebar.jsx';
//import Gastos from './vistas/Gastos.jsx';
//import Viajes from './vistas/Viajes.jsx';
// import otras vistas que necesites

//function App() {
  //return (
    //<div className="flex">
      //<Sidebar />
      //<div className="flex-1 p-4">
        //<Routes>
         // <Route path="/gastos" element={<Gastos />} />
          //<Route path="/viajes" element={<Viajes />} />
          //{/* agregá más rutas según lo que tengas */}
        //</Routes>
 //     </div>
 //   </div>
//  );
//}

//export default App;
