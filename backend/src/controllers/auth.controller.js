/**
 * @file controllers/auth.controller.js
 * @description Controlador de autenticación.
 * Gestiona el inicio de sesión, cierre de sesión y consulta del usuario actual.
 *
 * Características de seguridad implementadas:
 *  - Rate limiting persistente en BD (sobrevive reinicios del servidor).
 *  - Bloqueo temporal del usuario/IP tras demasiados intentos fallidos (RS-07).
 *  - Hashing de contraseñas con bcrypt (RF-02).
 *  - JWT HttpOnly cookie con renovación de actividad.
 *  - Blacklist de tokens revocados para invalidar sesiones al hacer logout.
 *  - Token CSRF generado tras login exitoso (RS-03).
 *  - Registro completo de eventos en el log de auditoría (RF-06).
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const config = require('../config');
const { logEvent, getClientIp } = require('../middleware/audit.middleware');
const { setCSRFToken } = require('../middleware/security.middleware');

const prisma = new PrismaClient();

// ─── Rate limiting PERSISTENTE en BD ─────────────────────────────────────────

/**
 * Verifica si un usuario o dirección IP está bloqueado por exceso de
 * intentos de login fallidos en el período de bloqueo configurado.
 *
 * @param {string} identifier - Nombre de usuario intentado
 * @param {string} ipAddress  - IP del cliente
 * @returns {Promise<boolean>} true si está bloqueado, false en caso contrario
 */
const isBlocked = async (identifier, ipAddress) => {
  const since = new Date(Date.now() - config.LOGIN_BLOCK_DURATION_MS);
  const recentFailures = await prisma.loginAttempt.count({
    where: {
      OR: [{ identifier }, { ipAddress }],
      success: false,
      createdAt: { gte: since },
    },
  });
  return recentFailures >= config.LOGIN_MAX_ATTEMPTS;
};

/**
 * Registra un intento de login (exitoso o fallido) en la base de datos.
 *
 * @param {string}  identifier - Nombre de usuario intentado
 * @param {string}  ipAddress  - IP del cliente
 * @param {boolean} success    - true si el intento fue exitoso
 * @returns {Promise<void>}
 */
const recordAttempt = async (identifier, ipAddress, success) => {
  await prisma.loginAttempt.create({
    data: { identifier, ipAddress, success },
  });
};

/**
 * Elimina todos los intentos de login asociados a un identificador o IP.
 * Se llama tras un login exitoso para reiniciar el contador de bloqueo.
 *
 * @param {string} identifier - Nombre de usuario
 * @param {string} ipAddress  - IP del cliente
 * @returns {Promise<void>}
 */
const clearAttempts = async (identifier, ipAddress) => {
  await prisma.loginAttempt.deleteMany({
    where: { OR: [{ identifier }, { ipAddress }] },
  });
};

/**
 * Elimina intentos de login con más de 1 hora de antigüedad para evitar
 * que la tabla crezca sin control.
 *
 * @returns {Promise<void>}
 */
const cleanOldAttempts = async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: oneHourAgo } },
  });
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Procesa el inicio de sesión de un usuario.
 *
 * Flujo:
 * 1. Valida los campos de entrada con express-validator.
 * 2. Verifica si el usuario/IP está bloqueado por intentos fallidos.
 * 3. Busca el usuario en la BD e incluye su rol y permisos.
 * 4. Compara la contraseña con bcrypt.
 * 5. En caso de éxito: limpia intentos previos, firma un JWT, lo guarda en
 *    cookie HttpOnly, genera el token CSRF y actualiza lastLoginAt/lastLoginIp.
 * 6. Registra el resultado (éxito o fallo) en el log de auditoría.
 *
 * @route POST /api/auth/login
 * @param {import('express').Request}  req  - Body: { username: string, password: string }
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 { user: { id, username, email, role, permissions } }
 * @response 400 Errores de validación
 * @response 401 Credenciales inválidas
 * @response 429 Bloqueado por demasiados intentos fallidos
 * @response 500 Error interno del servidor
 */
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password } = req.body;
  const ip = getClientIp(req);

  // Verificar bloqueo en BD (persiste entre reinicios)
  const blocked = await isBlocked(username, ip);
  if (blocked) {
    await logEvent(req, 'LOGIN_BLOCKED', `Usuario ${username} bloqueado por demasiados intentos fallidos`);
    return res.status(429).json({ error: 'Demasiados intentos fallidos. Bloqueado por 5 minutos.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    if (!user) {
      await recordAttempt(username, ip, false);
      await logEvent(req, 'LOGIN_FAILED', `Usuario no encontrado: ${username}`);
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      await recordAttempt(username, ip, false);
      await logEvent(req, 'LOGIN_FAILED', `Contraseña incorrecta para: ${username}`, user.id);

      // Verificar si este intento agotó el límite
      const blocked2 = await isBlocked(username, ip);
      if (blocked2) {
        await logEvent(req, 'LOGIN_BLOCKED', `${username} bloqueado tras 5 intentos`, user.id);
        return res.status(429).json({ error: 'Demasiados intentos fallidos. Bloqueado por 5 minutos.' });
      }
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Login exitoso — limpiar intentos previos y registros antiguos
    await clearAttempts(username, ip);
    await cleanOldAttempts();

    /** Lista de nombres de permisos del rol del usuario */
    const permissions = user.role.permissions.map(rp => rp.permission.name);

    /** Payload incluido en el JWT (sin información sensible) */
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role.name,
      permissions,
      lastActivity: Date.now(),
    };

    const token = jwt.sign(payload, config.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: config.JWT_EXPIRES_IN,
    });

    // Guardar JWT en cookie HttpOnly para evitar acceso desde JS del cliente
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,  // 1 hora
    });

    // Generar y enviar token CSRF (RS-03)
    setCSRFToken(res);

    // Actualizar metadatos de último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    await recordAttempt(username, ip, true);
    await logEvent(req, 'LOGIN_SUCCESS', `Login exitoso: ${username}`, user.id);

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        permissions,
      },
    });
  } catch (err) {
    console.error('[AUTH ERROR]', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// ─── Logout con blacklist de token ───────────────────────────────────────────

/**
 * Cierra la sesión del usuario actual.
 * Agrega el JWT activo a la blacklist de tokens revocados para que no pueda
 * reutilizarse, limpia los tokens expirados de la blacklist y elimina las cookies.
 *
 * @route POST /api/auth/logout
 * @param {import('express').Request}  req  - Debe incluir la cookie `access_token`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 { message: 'Sesión cerrada correctamente.' }
 */
exports.logout = async (req, res) => {
  const token = req.cookies['access_token'];

  if (token) {
    try {
      const decoded = jwt.decode(token);
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 60 * 60 * 1000);

      // Guardar token revocado para que no pueda reutilizarse (blacklist)
      await prisma.revokedToken.upsert({
        where: { token },
        update: {},
        create: { token, expiresAt },
      });

      // Limpiar tokens expirados para no acumular registros innecesarios
      await prisma.revokedToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
    } catch (err) {
      console.error('[LOGOUT ERROR]', err.message);
    }
  }

  await logEvent(req, 'LOGOUT', `Cierre de sesión: ${req.user?.username}`, req.user?.id);
  res.clearCookie('access_token');
  res.clearCookie('csrf_token');
  return res.json({ message: 'Sesión cerrada correctamente.' });
};

/**
 * Devuelve la información del usuario autenticado actualmente.
 * El middleware `authenticate` ya ha decodificado y adjuntado el usuario a `req.user`.
 *
 * @route GET /api/auth/me
 * @param {import('express').Request}  req  - req.user poblado por el middleware authenticate
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 { user: { id, username, role, permissions, ... } }
 */
exports.me = async (req, res) => {
  return res.json({ user: req.user });
};