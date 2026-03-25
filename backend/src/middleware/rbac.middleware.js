/**
 * @file middleware/rbac.middleware.js
 * @description Middleware de Control de Acceso Basado en Roles (RBAC).
 * Proporciona dos guardias reutilizables:
 *  - `requirePermission`: verifica que el usuario posea todos los permisos indicados.
 *  - `requireRole`: verifica que el usuario tenga al menos uno de los roles permitidos.
 *
 * Cumple con el requisito RF-05: el control de acceso se aplica y valida
 * exclusivamente en el backend, no por el frontend.
 * Todos los accesos denegados quedan registrados en el log de auditoría.
 */

const { logEvent } = require('./audit.middleware');

/**
 * Genera un middleware que verifica que el usuario autenticado posea TODOS
 * los permisos especificados. Si alguno falta, responde con 403 Forbidden
 * y registra el intento de acceso no autorizado.
 *
 * RF-05: RBAC validado en el backend.
 *
 * @param {...string} requiredPermissions - Nombres de los permisos requeridos
 * @returns {import('express').RequestHandler} Middleware de Express
 *
 * @example
 * // Solo usuarios con permiso VIEW_USERS pueden acceder
 * router.get('/', requirePermission('VIEW_USERS'), usersController.getAll);
 *
 * @example
 * // Requiere ambos permisos simultáneamente
 * router.post('/', requirePermission('CREATE_USER', 'MANAGE_ROLES'), handler);
 */
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida.' });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));

    if (!hasPermission) {
      await logEvent(req, 'ACCESS_DENIED',
        `Acceso denegado a ${req.method} ${req.originalUrl}. Permisos requeridos: ${requiredPermissions.join(', ')}`,
        req.user.id
      );
      return res.status(403).json({
        error: 'Acceso denegado. Permisos insuficientes.',
        required: requiredPermissions,
      });
    }
    next();
  };
};

/**
 * Genera un middleware que verifica que el usuario autenticado tenga al menos
 * uno de los roles especificados. Si no, responde con 403 Forbidden y registra
 * el acceso denegado.
 *
 * @param {...string} roles - Roles permitidos (p.ej. 'SuperAdmin', 'Admin')
 * @returns {import('express').RequestHandler} Middleware de Express
 *
 * @example
 * // Solo SuperAdmin puede acceder
 * router.get('/admin', requireRole('SuperAdmin'), handler);
 */
const requireRole = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida.' });
    }
    if (!roles.includes(req.user.role)) {
      await logEvent(req, 'ACCESS_DENIED',
        `Acceso denegado. Rol requerido: ${roles.join(' o ')}. Rol actual: ${req.user.role}`,
        req.user.id
      );
      return res.status(403).json({ error: 'Rol insuficiente.' });
    }
    next();
  };
};

module.exports = { requirePermission, requireRole };
