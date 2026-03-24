/**
 * @file middleware/auth.middleware.js
 * @description Middleware de autenticación basado en JWT con cookie HttpOnly.
 * Verifica la validez del token en cada petición protegida, comprueba si fue
 * revocado (blacklist), controla el timeout por inactividad y renueva
 * automáticamente el token con un timestamp actualizado.
 *
 * Requisitos de seguridad cubiertos:
 *  - RS-04: Timeout de inactividad de sesión (5 minutos)
 *  - RS-05: Solo acepta el algoritmo HS256; rechaza alg:none
 *  - Mejora #2: Blacklist de tokens revocados persistida en BD
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const { logEvent } = require('./audit.middleware');

const prisma = new PrismaClient();

/**
 * Middleware de autenticación para rutas protegidas.
 *
 * Flujo:
 * 1. Lee el JWT de la cookie `access_token`.
 * 2. Verifica la firma con HS256 (rechaza alg:none).
 * 3. Comprueba que el token no esté en la blacklist de tokens revocados.
 * 4. Valida que la sesión no haya expirado por inactividad (RS-04).
 * 5. Adjunta el usuario decodificado a `req.user`.
 * 6. Renueva el token actualizando el campo `lastActivity` para reiniciar el timer.
 *
 * @param {import('express').Request}  req  - Solicitud HTTP
 * @param {import('express').Response} res  - Respuesta HTTP
 * @param {import('express').NextFunction} next - Función para pasar al siguiente middleware
 * @returns {Promise<void>}
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies['access_token'];

    if (!token) {
      await logEvent(req, 'ACCESS_DENIED', 'No token provided', null);
      return res.status(401).json({ error: 'Autenticación requerida.' });
    }

    // RS-05: Solo acepta HS256, rechaza alg:none
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // Mejora #2: Verificar si el token fue revocado (blacklist)
      const revoked = await prisma.revokedToken.findUnique({ where: { token } });
      if (revoked) {
        res.clearCookie('access_token');
        res.clearCookie('csrf_token');
        return res.status(401).json({ error: 'Sesión inválida. Inicia sesión nuevamente.' });
      }

    // RS-04: Verificar timeout de inactividad (5 minutos)
    const now = Date.now();
    if (decoded.lastActivity && (now - decoded.lastActivity) > config.SESSION_TIMEOUT_MS) {
      res.clearCookie('access_token');
      res.clearCookie('csrf_token');
      return res.status(401).json({ error: 'Sesión expirada por inactividad.' });
    }

    /** Adjunta los datos del usuario al objeto de solicitud para uso posterior */
    req.user = decoded;

    // Renovar token con nueva lastActivity para reiniciar el contador de inactividad
    const newToken = jwt.sign(
      {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        permissions: decoded.permissions,
        lastActivity: now,
      },
      config.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: config.JWT_EXPIRES_IN }
    );

    res.cookie('access_token', newToken, {
      httpOnly: true,                                    // Inaccesible desde JS del cliente
      secure: config.NODE_ENV === 'production',          // Solo HTTPS en producción
      sameSite: 'strict',                                // Previene CSRF
      maxAge: 60 * 60 * 1000,                            // 1 hora
    });

    next();
  } catch (err) {
    res.clearCookie('access_token');
    res.clearCookie('csrf_token');
    await logEvent(req, 'ACCESS_DENIED', `Token inválido: ${err.message}`, null);
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

module.exports = { authenticate };