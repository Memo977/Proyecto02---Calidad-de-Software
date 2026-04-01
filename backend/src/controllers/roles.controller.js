/**
 * @file controllers/roles.controller.js
 * @description Controlador para la gestión de roles y permisos del sistema.
 * Permite consultar roles existentes, listar permisos disponibles y modificar
 * los permisos asignados a un rol específico.
 *
 * Acceso restringido a usuarios con permiso MANAGE_ROLES (generalmente SuperAdmin).
 * Los cambios quedan registrados en el log de auditoría (RF-06).
 */

const { PrismaClient } = require('@prisma/client');
const { logEvent } = require('../middleware/audit.middleware');

const prisma = new PrismaClient();

/**
 * Retorna todos los roles del sistema con sus permisos asociados y el conteo
 * de usuarios actualmente asignados a cada rol.
 *
 * @route GET /api/roles
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 Array de roles con permisos y _count.users
 * @response 500 Error interno del servidor
 */
exports.getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } }
      }
    });
    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener roles.' });
  }
};

/**
 * Retorna todos los permisos disponibles en el sistema, ordenados alfabéticamente.
 * Útil para construir la interfaz de edición de permisos de un rol.
 *
 * @route GET /api/roles/permissions
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 Array de permisos { id, name }
 * @response 500 Error interno del servidor
 */
exports.getPermissions = async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({ orderBy: { name: 'asc' } });
    return res.json(permissions);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener permisos.' });
  }
};

/**
 * Reemplaza completamente los permisos asignados a un rol.
 * Primero elimina todos los permisos existentes y luego inserta los nuevos,
 * garantizando que la lista quede exactamente como se indica en el body.
 * Registra el evento ROLE_PERMISSIONS_CHANGED en el log de auditoría.
 *
 * RF-05: Solo usuarios con MANAGE_ROLES pueden usar esta ruta (aplicado en el router).
 *
 * @route PUT /api/roles/:id/permissions
 * @param {import('express').Request}  req  - req.params.id: ID del rol | Body: { permissionIds: number[] }
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 Rol actualizado con sus nuevos permisos
 * @response 404 Rol no encontrado
 * @response 500 Error interno del servidor
 */
exports.updateRolePermissions = async (req, res) => {
  const roleId = parseInt(req.params.id);
  const { permissionIds } = req.body;

  try {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return res.status(404).json({ error: 'Rol no encontrado.' });

    // Eliminar asociaciones actuales para reemplazarlas completamente
    await prisma.rolePermission.deleteMany({ where: { roleId } });

    // Insertar los nuevos permisos seleccionados
    for (const permId of permissionIds) {
      await prisma.rolePermission.create({
        data: { roleId, permissionId: parseInt(permId) }
      });
    }

    await logEvent(req, 'ROLE_PERMISSIONS_CHANGED',
      `Permisos del rol ${role.name} actualizados`,
      req.user.id
    );

    const updated = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } }
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar permisos del rol.' });
  }
};
