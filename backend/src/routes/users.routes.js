/**
 * @file routes/users.routes.js
 * @description Rutas CRUD para la gestión de usuarios del sistema.
 * Todas las rutas requieren autenticación JWT. Las operaciones de escritura
 * requieren adicionalmente protección CSRF y el permiso RBAC correspondiente.
 *
 * RF-04: Gestión de usuarios (listar, crear, editar, eliminar).
 * RF-05: Control de acceso basado en permisos validado en backend.
 */

const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { csrfProtection } = require('../middleware/security.middleware');
const { createUserValidators, updateUserValidators } = require('../validators');

/** Todas las rutas de este router requieren sesión activa */
router.use(authenticate);

// RF-05: RBAC aplicado en backend — el frontend no controla el acceso real

/**
 * @route GET /api/users
 * @desc  Lista todos los usuarios. Requiere: VIEW_USERS
 * @access Privado
 */
router.get('/', requirePermission('VIEW_USERS'), usersController.getAll);

/**
 * @route GET /api/users/:id
 * @desc  Retorna un usuario por ID. Requiere: VIEW_USERS
 * @access Privado
 */
router.get('/:id', requirePermission('VIEW_USERS'), usersController.getById);

/**
 * @route POST /api/users
 * @desc  Crea un nuevo usuario. Requiere: CREATE_USER + CSRF token
 * @access Privado
 */
router.post('/', csrfProtection, requirePermission('CREATE_USER'), createUserValidators, usersController.create);

/**
 * @route PUT /api/users/:id
 * @desc  Actualiza un usuario existente. Requiere: EDIT_USER + CSRF token
 * @access Privado
 */
router.put('/:id', csrfProtection, requirePermission('EDIT_USER'), updateUserValidators, usersController.update);

/**
 * @route DELETE /api/users/:id
 * @desc  Elimina un usuario. Requiere: DELETE_USER + CSRF token
 * @access Privado
 */
router.delete('/:id', csrfProtection, requirePermission('DELETE_USER'), usersController.remove);

module.exports = router;
