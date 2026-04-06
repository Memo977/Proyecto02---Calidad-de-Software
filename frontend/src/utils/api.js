/**
 * @file utils/api.js
 * @description Cliente HTTP centralizado para comunicarse con el backend.
 * Configura una instancia de Axios con la URL base de la API y agrega
 * interceptores para:
 *  1. Leer el token CSRF de la cookie y enviarlo en la cabecera `X-CSRF-Token`
 *     en cada petición mutante (RS-03).
 *  2. Redirigir automáticamente al login cuando el backend retorna 401
 *     (sesión expirada o inválida).
 *
 * El uso de `withCredentials: true` es necesario para que el navegador envíe
 * y reciba las cookies HttpOnly de sesión en peticiones cross-origin.
 */

import axios from 'axios';

/**
 * Instancia de Axios configurada para todas las peticiones al backend.
 * - baseURL '/api' es resuelta por el proxy de Vite en desarrollo y por Nginx en producción.
 * - withCredentials permite el envío de cookies en peticiones cross-origin.
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

/**
 * Interceptor de petición: adjunta el token CSRF a cada petición.
 * RS-03: Lee el token CSRF de la cookie `csrf_token` (accesible por JS porque
 * httpOnly: false) y lo envía en la cabecera `X-CSRF-Token` para que el
 * middleware de protección CSRF del backend pueda verificarlo.
 */
api.interceptors.request.use((config) => {
  const csrf = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];
  if (csrf) {
    config.headers['X-CSRF-Token'] = csrf;
  }
  return config;
});

/**
 * Interceptor de respuesta: maneja errores 401 globalmente.
 * Si el backend retorna 401 (token expirado, sesión inválida, etc.)
 * y el usuario no está ya en la página de login, redirige automáticamente
 * a `/login` para forzar una nueva autenticación.
 */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const is401 = err.response?.status === 401;
    const notOnLogin = window.location.pathname !== '/login';
    // /auth/me ya maneja su propio estado en AuthContext (setUser null)
    // No redirigir desde aquí para evitar race condition con React StrictMode
    const isAuthMe = err.config?.url?.includes('/auth/me');

    if (is401 && notOnLogin && !isAuthMe) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
