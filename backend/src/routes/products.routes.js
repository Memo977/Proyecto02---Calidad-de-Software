/**
 * @file routes/products.routes.js
 * @description Rutas CRUD para la gestión de productos del inventario.
 * Todas las rutas requieren autenticación JWT y el permiso RBAC correspondiente.
 * Las operaciones de escritura también requieren protección CSRF.
 *
 * RF-03: Gestión de productos (listar, crear, editar, eliminar).
 * RF-05: Control de acceso basado en permisos validado en backend.
 */

// routes/products.routes.js
const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { csrfProtection } = require('../middleware/security.middleware');
const { productValidators } = require('../validators');

/** Todas las rutas de este router requieren sesión activa */
router.use(authenticate);

/**
 * @route GET /api/products
 * @desc  Lista todos los productos. Requiere: VIEW_PRODUCTS
 * @access Privado
 */
router.get('/', requirePermission('VIEW_PRODUCTS'), productsController.getAll);

/**
 * @route GET /api/products/:id
 * @desc  Retorna un producto por ID. Requiere: VIEW_PRODUCTS
 * @access Privado
 */
router.get('/:id', requirePermission('VIEW_PRODUCTS'), productsController.getById);

/**
 * @route POST /api/products
 * @desc  Crea un nuevo producto. Requiere: CREATE_PRODUCT + CSRF token
 * @access Privado
 */
router.post('/', csrfProtection, requirePermission('CREATE_PRODUCT'), productValidators, productsController.create);

/**
 * @route PUT /api/products/:id
 * @desc  Actualiza un producto existente. Requiere: EDIT_PRODUCT + CSRF token
 * @access Privado
 */
router.put('/:id', csrfProtection, requirePermission('EDIT_PRODUCT'), productValidators, productsController.update);

/**
 * @route DELETE /api/products/:id
 * @desc  Elimina un producto. Requiere: DELETE_PRODUCT + CSRF token
 * @access Privado
 */
router.delete('/:id', csrfProtection, requirePermission('DELETE_PRODUCT'), productsController.remove);

module.exports = router;
