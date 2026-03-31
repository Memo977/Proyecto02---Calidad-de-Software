/**
 * @file controllers/users.controller.js
 * @description Controlador CRUD para la gestión de usuarios del sistema.
 * Implementa el requisito RF-04: operaciones de listado, consulta, creación,
 * edición y eliminación de usuarios, protegidas por autenticación y RBAC.
 *
 * Todas las contraseñas se almacenan con hashing bcrypt (RF-02, cost ≥ 12).
 * Las operaciones que modifican datos quedan registradas en el log de auditoría (RF-06).
 */

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const config = require('../config');
const { logEvent } = require('../middleware/audit.middleware');

const prisma = new PrismaClient();

/**
 * Proyección de campos del modelo User utilizada en todas las consultas.
 * Excluye la contraseña hasheada y expone los permisos del rol asociado.
 *
 * @type {import('@prisma/client').Prisma.UserSelect}
 */
const userSelect = {
  id: true,
  username: true,
  email: true,
  lastLoginAt: true,
  lastLoginIp: true,
  createdAt: true,
  role: {
    select: {
      id: true,
      name: true,
      permissions: { select: { permission: { select: { name: true } } } }
    }
  }
};

/**
 * Retorna la lista completa de usuarios, ordenada por fecha de creación descendente.
 * Los permisos del rol se aplanan en un array de strings para facilitar su uso.
 *
 * RF-04: Listar usuarios.
 *
 * @route GET /api/users
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 Array de objetos usuario (sin campo password)
 * @response 500 Error interno del servidor
 */
exports.getAll = async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'desc' } });
    const formatted = users.map(u => ({
      ...u,
      permissions: u.role.permissions.map(rp => rp.permission.name)
    }));
    return res.json(formatted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
};

/**
 * Retorna un usuario específico por su ID.
 *
 * @route GET /api/users/:id
 * @param {import('express').Request}  req  - req.params.id: ID del usuario
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 Objeto usuario con permisos aplanados
 * @response 404 Usuario no encontrado
 * @response 500 Error interno del servidor
 */
exports.getById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: userSelect,
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json({ ...user, permissions: user.role.permissions.map(rp => rp.permission.name) });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener usuario.' });
  }
};

/**
 * Crea un nuevo usuario en el sistema.
 * La contraseña es hasheada con bcrypt usando el factor de coste configurado (≥ 12).
 * Registra el evento USER_CREATED en el log de auditoría.
 *
 * RF-04: Crear usuario.
 * RF-02: Contraseñas hasheadas con bcrypt (cost ≥ 12).
 *
 * @route POST /api/users
 * @param {import('express').Request}  req  - Body: { username, password, email, roleId }
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 201 Objeto usuario creado (sin password)
 * @response 400 Errores de validación
 * @response 409 Username o email ya existe
 * @response 500 Error interno del servidor
 */
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password, email, roleId } = req.body;
  try {
    // RF-02: hash bcrypt con factor de coste ≥ 12
    const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, email, roleId: parseInt(roleId) },
      select: userSelect,
    });
    await logEvent(req, 'USER_CREATED', `Usuario creado: ${username}`, req.user.id);
    return res.status(201).json({ ...user, permissions: user.role.permissions.map(rp => rp.permission.name) });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Username o email ya existe.' });
    return res.status(500).json({ error: 'Error al crear usuario.' });
  }
};

/**
 * Actualiza los datos de un usuario existente.
 * Si se proporciona una nueva contraseña, es hasheada antes de guardarse.
 * Si se cambia el rol, registra un evento ROLE_CHANGED adicional en auditoría.
 *
 * RF-04: Editar usuario.
 *
 * @route PUT /api/users/:id
 * @param {import('express').Request}  req  - req.params.id + Body: { username?, email?, roleId?, password? }
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 Objeto usuario actualizado (sin password)
 * @response 400 Errores de validación
 * @response 404 Usuario no encontrado
 * @response 409 Username o email ya existe
 * @response 500 Error interno del servidor
 */
exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, roleId, password } = req.body;
  const userId = parseInt(req.params.id);
  try {
    const data = { username, email };
    if (roleId) data.roleId = parseInt(roleId);
    if (password) data.password = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    });

    if (roleId) {
      await logEvent(req, 'ROLE_CHANGED', `Rol de usuario ${username} actualizado`, req.user.id);
    } else {
      await logEvent(req, 'USER_UPDATED', `Usuario actualizado: ${username}`, req.user.id);
    }

    return res.json({ ...user, permissions: user.role.permissions.map(rp => rp.permission.name) });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Username o email ya existe.' });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
};

/**
 * Elimina un usuario del sistema.
 * Un usuario no puede eliminarse a sí mismo para evitar quedarse sin acceso.
 * La eliminación queda registrada en el log de auditoría.
 *
 * RF-04: Eliminar usuario.
 *
 * @route DELETE /api/users/:id
 * @param {import('express').Request}  req  - req.params.id: ID del usuario a eliminar
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 { message: 'Usuario eliminado correctamente.' }
 * @response 400 Intento de auto-eliminación
 * @response 404 Usuario no encontrado
 * @response 500 Error interno del servidor
 */
exports.remove = async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo.' });

    await prisma.user.delete({ where: { id: userId } });
    await logEvent(req, 'USER_DELETED', `Usuario eliminado: ${user.username}`, req.user.id);
    return res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
};
