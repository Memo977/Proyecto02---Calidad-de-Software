/**
 * @file main.jsx
 * @description Punto de entrada de la aplicación React.
 * Monta el árbol de componentes en el elemento raíz del DOM (`#root`),
 * definido en `index.html`. Usa `React.StrictMode` para detectar efectos
 * secundarios y APIs deprecadas durante el desarrollo.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
