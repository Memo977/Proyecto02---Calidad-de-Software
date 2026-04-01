/**
 * @file routes/audit.routes.js
 * @description Rutas para consultar el log de auditoría del sistema.
 * El único endpoint disponible requiere autenticación y el permiso VIEW_AUDIT_LOG,
 * que por diseño solo se asigna al rol SuperAdmin.
 *
 * RF-06: Los logs de auditoría solo son accesibles por el SuperAdmin.
 */

const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/audit.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');

/**
 * @route GET /api/audit
 * @desc  Retorna los registros del log de auditoría con paginación y filtros opcionales.
 *        Query params: page, limit, event
 * @access Privado — Solo SuperAdmin (VIEW_AUDIT_LOG)
 */
router.get('/', authenticate, requirePermission('VIEW_AUDIT_LOG'), getAuditLogs);

module.exports = router;
