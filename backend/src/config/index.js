/**
 * @file config/index.js
 * @description Configuración centralizada de la aplicación.
 * Lee las variables de entorno y exporta un objeto con todos los parámetros
 * de configuración utilizados a lo largo del backend.
 *
 * Variables de entorno esperadas:
 *  - PORT            Puerto en el que escucha el servidor (default: 4000)
 *  - NODE_ENV        Entorno de ejecución: 'development' | 'production' (default: 'development')
 *  - JWT_SECRET      Secreto para firmar/verificar tokens JWT (mín. 32 chars en producción)
 *  - COOKIE_SECRET   Secreto para firmar cookies
 *  - FRONTEND_URL    URL del frontend permitida por CORS (default: http://localhost:5173)
 */
require('dotenv').config();

module.exports = {
  /** Puerto del servidor HTTP */
  PORT: process.env.PORT || 4000,

  /** Entorno de ejecución ('development' | 'production') */
  NODE_ENV: process.env.NODE_ENV || 'development',

  /** Clave secreta para firmar los JWT — cambiar en producción (mín. 32 chars) */
  JWT_SECRET: process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION_MIN_32_CHARS',

  /** Tiempo de expiración del JWT — RS-05: máximo 1 hora */
  JWT_EXPIRES_IN: '1h',

  /** Clave secreta para las cookies firmadas — cambiar en producción */
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'CHANGE_THIS_COOKIE_SECRET_IN_PRODUCTION',

  /**
   * Tiempo máximo de inactividad antes de expirar la sesión — RS-04.
   * Configurable por variable de entorno SESSION_TIMEOUT_MS (en milisegundos).
   * Por defecto: 5 min en producción, 30 min en desarrollo local.
   */
  SESSION_TIMEOUT_MS: process.env.SESSION_TIMEOUT_MS
    ? parseInt(process.env.SESSION_TIMEOUT_MS)
    : (process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 30 * 60 * 1000),

  /** Número máximo de intentos de login antes de bloquear — RS-07 */
  LOGIN_MAX_ATTEMPTS: 5,

  /** Duración del bloqueo por exceso de intentos fallidos — RS-07: 5 minutos */
  LOGIN_BLOCK_DURATION_MS: 5 * 60 * 1000,

  /** URL del frontend usada en la configuración de CORS */
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  /** Factor de coste para el hashing de contraseñas con bcrypt — RF-02: mín. 12 */
  BCRYPT_ROUNDS: 12,
};
