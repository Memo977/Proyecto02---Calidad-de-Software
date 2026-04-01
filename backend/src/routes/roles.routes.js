/**
 * @file routes/roles.routes.js
 * @description Rutas para la gestión de roles y permisos del sistema.
 * Todas las rutas requieren autenticación. Las operaciones de lectura
 * requieren el permiso VIEW_ROLES y la modificación de permisos requiere
 * MANAGE_ROLES (tipicamente reservado para SuperAdmin).
 *
 * RF-05: Control de acceso RBAC aplicado en backend.
 */

const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/roles.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { csrfProtection } = require('../middleware/security.middleware');

/** Todas las rutas de este router requieren sesión activa */
router.use(authenticate);

// RF-05: RBAC en backend — solo SuperAdmin puede gestionar roles/permisos

/**
 * @route GET /api/roles
 * @desc  Lista todos los roles con sus permisos y conteo de usuarios. Requiere: VIEW_ROLES
 * @access Privado
 */
router.get('/',                    requirePermission('VIEW_ROLES'),   rolesController.getRoles);

/**
 * @route GET /api/roles/permissions
 * @desc  Lista todos los permisos disponibles en el sistema. Requiere: VIEW_ROLES
 * @access Privado
 */
router.get('/permissions',         requirePermission('VIEW_ROLES'),   rolesController.getPermissions);

/**
 * @route PUT /api/roles/:id/permissions
 * @desc  Reemplaza los permisos de un rol. Requiere: MANAGE_ROLES + CSRF token
 * @access Privado (solo SuperAdmin)
 */
router.put('/:id/permissions',     csrfProtection, requirePermission('MANAGE_ROLES'), rolesController.updateRolePermissions);

module.exports = router;
