/**
 * @file controllers/products.controller.js
 * @description Controlador CRUD para la gestión de productos del inventario.
 * Implementa el requisito RF-03: operaciones de listado, consulta, creación,
 * actualización y eliminación de productos.
 *
 * Todas las operaciones de escritura quedan registradas en el log de auditoría
 * y están protegidas por autenticación JWT y permisos RBAC (ver products.routes.js).
 */

const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { logEvent } = require('../middleware/audit.middleware');

const prisma = new PrismaClient();

/**
 * Retorna todos los productos ordenados por fecha de creación descendente.
 *
 * RF-03: Listar productos.
 *
 * @route GET /api/products
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 Array de productos
 * @response 500 Error interno del servidor
 */
exports.getAll = async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener productos.' });
  }
};

/**
 * Retorna un producto específico por su ID.
 *
 * @route GET /api/products/:id
 * @param {import('express').Request}  req  - req.params.id: ID del producto
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 Objeto producto
 * @response 404 Producto no encontrado
 * @response 500 Error interno del servidor
 */
exports.getById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado.' });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener producto.' });
  }
};

/**
 * Crea un nuevo producto en el inventario.
 * Los campos de texto son saneados (trim) y los numéricos son convertidos al
 * tipo correcto antes de persistirse.
 * Registra el evento PRODUCT_CREATED en el log de auditoría.
 *
 * RF-03: Crear producto.
 *
 * @route POST /api/products
 * @param {import('express').Request}  req  - Body: { code, name, description?, quantity, price }
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 201 Objeto producto creado
 * @response 400 Errores de validación
 * @response 409 El código de producto ya existe
 * @response 500 Error interno del servidor
 */
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { code, name, description, quantity, price } = req.body;
  try {
    const product = await prisma.product.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        quantity: parseInt(quantity),
        price: parseFloat(price),
      }
    });
    await logEvent(req, 'PRODUCT_CREATED', `Producto creado: ${code} - ${name}`, req.user.id);
    return res.status(201).json(product);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'El código de producto ya existe.' });
    return res.status(500).json({ error: 'Error al crear producto.' });
  }
};

/**
 * Actualiza los datos de un producto existente.
 * Registra el evento PRODUCT_UPDATED en el log de auditoría.
 *
 * RF-03: Actualizar producto.
 *
 * @route PUT /api/products/:id
 * @param {import('express').Request}  req  - req.params.id + Body: { code, name, description?, quantity, price }
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 Objeto producto actualizado
 * @response 400 Errores de validación
 * @response 404 Producto no encontrado
 * @response 409 El código de producto ya existe
 * @response 500 Error interno del servidor
 */
exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const productId = parseInt(req.params.id);
  const { code, name, description, quantity, price } = req.body;
  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        quantity: parseInt(quantity),
        price: parseFloat(price),
      }
    });
    await logEvent(req, 'PRODUCT_UPDATED', `Producto actualizado: ${code} - ${name}`, req.user.id);
    return res.json(product);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'El código de producto ya existe.' });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Producto no encontrado.' });
    return res.status(500).json({ error: 'Error al actualizar producto.' });
  }
};

/**
 * Elimina un producto del inventario.
 * Registra el evento PRODUCT_DELETED en el log de auditoría.
 *
 * RF-03: Eliminar producto.
 *
 * @route DELETE /api/products/:id
 * @param {import('express').Request}  req  - req.params.id: ID del producto a eliminar
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 *
 * @response 200 { message: 'Producto eliminado correctamente.' }
 * @response 404 Producto no encontrado
 * @response 500 Error interno del servidor
 */
exports.remove = async (req, res) => {
  const productId = parseInt(req.params.id);
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado.' });
    await prisma.product.delete({ where: { id: productId } });
    await logEvent(req, 'PRODUCT_DELETED', `Producto eliminado: ${product.code} - ${product.name}`, req.user.id);
    return res.json({ message: 'Producto eliminado correctamente.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar producto.' });
  }
};
