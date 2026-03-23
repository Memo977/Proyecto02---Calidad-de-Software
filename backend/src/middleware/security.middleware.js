/**
 * @file middleware/security.middleware.js
 * @description Middlewares de seguridad HTTP.
 * Implementa tres mecanismos de protección:
 *  1. `securityHeaders` — Cabeceras HTTP de seguridad vía Helmet (RS-06).
 *  2. `csrfProtection` — Protección CSRF mediante el patrón Double Submit Cookie (RS-03).
 *  3. `setCSRFToken`  — Genera y establece el token CSRF en una cookie tras el login.
 */

const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

/**
 * Middleware que agrega cabeceras HTTP de seguridad a todas las respuestas.
 * RS-06: Configurado con Helmet para cubrir:
 *  - Content-Security-Policy (CSP): restringe fuentes de scripts, estilos e imágenes.
 *  - X-Frame-Options: DENY — previene clickjacking.
 *  - X-Content-Type-Options: nosniff — evita MIME sniffing.
 *  - Strict-Transport-Security (HSTS): fuerza HTTPS por 1 año.
 *  - Referrer-Policy: limita información enviada al origen.
 *  - X-XSS-Protection: habilita el filtro XSS del navegador (legacy).
 *
 * @type {import('express').RequestHandler}
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // Necesario para estilos inline de Tailwind
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  frameguard: { action: 'DENY' },       // X-Frame-Options: DENY
  noSniff: true,                         // X-Content-Type-Options: nosniff
  hsts: {                                // Strict-Transport-Security
    maxAge: 31536000,
    includeSubDomains: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },  // Referrer-Policy
  xssFilter: true,
});

/**
 * Middleware de protección CSRF mediante el patrón Double Submit Cookie.
 * RS-03: Para peticiones mutantes (POST, PUT, DELETE), compara el token
 * enviado en la cabecera `X-CSRF-Token` contra el token almacenado en la
 * cookie `csrf_token`. Si no coinciden o alguno falta, rechaza con 403.
 *
 * Los métodos seguros (GET, HEAD, OPTIONS) son omitidos por este middleware.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const csrfProtection = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  const tokenFromHeader = req.headers['x-csrf-token'];
  const tokenFromCookie = req.cookies['csrf_token'];

  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    return res.status(403).json({ error: 'CSRF token inválido o ausente.' });
  }
  next();
};

/**
 * Genera un token CSRF con UUID v4 y lo establece en una cookie accesible
 * por JavaScript (httpOnly: false) para que el frontend pueda leerlo y
 * enviarlo en la cabecera `X-CSRF-Token` de cada petición mutante.
 *
 * Debe llamarse justo después de un login exitoso.
 *
 * @param {import('express').Response} res - Objeto de respuesta donde se establece la cookie
 * @returns {string} El token CSRF generado
 */
const setCSRFToken = (res) => {
  const token = uuidv4();
  res.cookie('csrf_token', token, {
    httpOnly: false,                             // El cliente JS necesita leer este valor
    secure: config.NODE_ENV === 'production',   // Solo HTTPS en producción
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000,                     // 1 hora
  });
  return token;
};

module.exports = { securityHeaders, csrfProtection, setCSRFToken };
