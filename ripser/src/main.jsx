import React from 'react';
import ReactDOM from 'react-dom/client'; // Para React 18+
import { BrowserRouter } from 'react-router-dom'; // Asegúrate de importar BrowserRouter

import App from './App'; // Tu componente principal de la aplicación

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);


