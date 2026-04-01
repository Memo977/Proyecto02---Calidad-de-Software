/**
 * @file controllers/audit.controller.js
 * @description Controlador para consultar los registros del log de auditoría.
 * Implementa el requisito RF-06: solo el SuperAdmin (permiso VIEW_AUDIT_LOG)
 * puede visualizar el historial de eventos de seguridad del sistema.
 *
 * Soporta paginación y filtrado por tipo de evento.
 */

const { PrismaClient } = require('@prisma/client');
const { logEvent } = require('../middleware/audit.middleware');

const prisma = new PrismaClient();

/**
 * Retorna los registros del log de auditoría con soporte de paginación y
 * filtrado opcional por nombre de evento (búsqueda insensible a mayúsculas).
 *
 * RF-06: Audit log — solo SuperAdmin puede visualizar los registros.
 *
 * @route GET /api/audit
 * @param {import('express').Request}  req
 *   Query params:
 *   - `page`  {number} [default=1]  - Página actual (1-indexed)
 *   - `limit` {number} [default=50] - Registros por página
 *   - `event` {string} [opcional]   - Filtro parcial por nombre de evento
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 {
 *   logs: AuditLog[],  // Registros de la página actual, con username del usuario relacionado
 *   total: number,     // Total de registros que cumplen el filtro
 *   page: number,      // Página actual
 *   limit: number      // Límite por página
 * }
 * @response 500 Error interno del servidor
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, event } = req.query;

    /** Filtro de Prisma: si se proporciona 'event', busca coincidencias parciales */
    const where = event ? { event: { contains: event, mode: 'insensitive' } } : {};

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    const total = await prisma.auditLog.count({ where });

    return res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener logs.' });
  }
};
