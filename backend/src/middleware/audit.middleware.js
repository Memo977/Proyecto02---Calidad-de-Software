/**
 * @file middleware/audit.middleware.js
 * @description Middleware y utilidades para el registro de eventos de auditoría.
 * Cumple con el requisito RF-06: registrar eventos de seguridad con marca de
 * tiempo y dirección IP de origen en la tabla AuditLog de la base de datos.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Obtiene la dirección IP real del cliente, considerando proxies inversos.
 * Busca en orden: X-Forwarded-For → X-Real-IP → socket remoto.
 *
 * @param {import('express').Request} req - Objeto de solicitud de Express
 * @returns {string} Dirección IP del cliente o 'unknown' si no se puede determinar
 */
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

/**
 * Registra un evento de seguridad/auditoría en la base de datos.
 * RF-06: Cada evento queda persistido con timestamp, IP de origen y la ruta
 * que lo generó, facilitando la trazabilidad de acciones sensibles.
 *
 * Los errores internos de este log son silenciosos (solo se imprimen en consola)
 * para no interrumpir el flujo principal de la aplicación.
 *
 * @param {import('express').Request} req  - Objeto de solicitud (para obtener IP y ruta)
 * @param {string} event                   - Identificador del evento (p.ej. 'LOGIN_SUCCESS')
 * @param {string|null} [details=null]     - Descripción adicional del evento
 * @param {number|null} [userId=null]      - ID del usuario que originó el evento (si aplica)
 * @returns {Promise<void>}
 */
const logEvent = async (req, event, details = null, userId = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || req.user?.id || null,
        event,
        details,
        ipAddress: getClientIp(req),
        path: req.originalUrl || null,
      },
    });
  } catch (err) {
    console.error('[AUDIT ERROR]', err.message);
  }
};

module.exports = { logEvent, getClientIp };
