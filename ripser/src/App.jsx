import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
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
