/**
 * @file routes/auth.routes.js
 * @description Rutas de autenticación de la API.
 * Expone los endpoints para login, logout y consulta del usuario actual.
 *
 * Seguridad aplicada:
 *  - RS-07: Rate limiting a nivel de router en el endpoint de login
 *    (max 5 intentos por ventana de 5 minutos por IP).
 *  - Validación de entrada con express-validator.
 *  - El middleware `authenticate` protege las rutas que requieren sesión activa.
 */

// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { loginValidators } = require('../validators');
const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Limitador de tasa a nivel de router para el endpoint de login.
 * RS-07: Bloquea la IP tras el máximo de intentos configurado.
 * Las peticiones exitosas no cuentan para el límite (`skipSuccessfulRequests: true`).
 *
 * @type {import('express').RequestHandler}
 */
const loginLimiter = rateLimit({
  windowMs: config.LOGIN_BLOCK_DURATION_MS,   // Ventana de tiempo (5 minutos)
  max: config.LOGIN_MAX_ATTEMPTS,              // Máximo de intentos por IP
  skipSuccessfulRequests: true,                // Los logins exitosos no consumen cuota
  handler: (req, res) => {
    res.status(429).json({ error: 'Demasiados intentos. Bloqueado por 5 minutos.' });
  },
  standardHeaders: true,   // Enviar cabeceras RateLimit-* estándar
  legacyHeaders: false,     // No enviar cabeceras X-RateLimit-* deprecadas
});

/**
 * @route POST /api/auth/login
 * @desc  Autentica al usuario y establece las cookies de sesión.
 * @access Público
 */
router.post('/login', loginLimiter, loginValidators, authController.login);

/**
 * @route POST /api/auth/logout
 * @desc  Cierra la sesión del usuario y revoca el token activo.
 * @access Privado (requiere autenticación)
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route GET /api/auth/me
 * @desc  Retorna los datos del usuario autenticado actualmente.
 * @access Privado (requiere autenticación)
 */
router.get('/me', authenticate, authController.me);

module.exports = router;
