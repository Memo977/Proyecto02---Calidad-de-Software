/**
 * @file validators/index.js
 * @description Cadenas de validación de entrada para las rutas de la API.
 * Utiliza `express-validator` para validar y sanear los datos de las peticiones
 * ANTES de que lleguen a los controladores, aplicando la validación tanto en el
 * frontend como en el backend (RF-03, RF-04).
 *
 * Validadores exportados:
 *  - `productValidators`      — Validaciones para crear/actualizar un producto
 *  - `createUserValidators`   — Validaciones para crear un usuario
 *  - `updateUserValidators`   — Validaciones para actualizar un usuario (todos opcionales)
 *  - `loginValidators`        — Validaciones para el formulario de login
 */

const { body } = require('express-validator');

/**
 * Reglas de validación para crear o actualizar un producto.
 * RS-02: Los campos de texto son escapados para prevenir inyección de HTML/XSS.
 *
 * RF-03: Validación de productos aplicada en backend.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const productValidators = [
  body('code')
    .trim()
    .notEmpty().withMessage('El código es requerido.')
    .isAlphanumeric().withMessage('El código debe ser alfanumérico.')
    .isLength({ min: 2, max: 20 }).withMessage('El código debe tener entre 2 y 20 caracteres.'),
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido.')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.')
    .escape(),  // RS-02: Escapar HTML para prevenir XSS
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres.')
    .escape(),  // RS-02
  body('quantity')
    .notEmpty().withMessage('La cantidad es requerida.')
    .isInt({ min: 0 }).withMessage('La cantidad debe ser un número entero no negativo.'),
  body('price')
    .notEmpty().withMessage('El precio es requerido.')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo.'),
];

/**
 * Reglas de validación para la creación de un nuevo usuario.
 * Todos los campos son obligatorios. La contraseña debe cumplir requisitos
 * de complejidad (mayúscula, minúscula y número).
 *
 * RF-04: Validación de usuarios aplicada en backend.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const createUserValidators = [
  body('username')
    .trim()
    .notEmpty().withMessage('El username es requerido.')
    .isAlphanumeric().withMessage('El username solo puede contener letras y números.')
    .isLength({ min: 3, max: 50 }).withMessage('El username debe tener entre 3 y 50 caracteres.'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido.')
    .isEmail().withMessage('Email inválido.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida.')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número.'),
  body('roleId')
    .notEmpty().withMessage('El rol es requerido.')
    .isInt({ min: 1 }).withMessage('Rol inválido.'),
];

/**
 * Reglas de validación para la actualización parcial de un usuario.
 * Todos los campos son opcionales; se validan solo si son enviados.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const updateUserValidators = [
  body('username')
    .optional()
    .trim()
    .isAlphanumeric().withMessage('El username solo puede contener letras y números.')
    .isLength({ min: 3, max: 50 }).withMessage('El username debe tener entre 3 y 50 caracteres.'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email inválido.')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Debe contener mayúscula, minúscula y número.'),
  body('roleId')
    .optional()
    .isInt({ min: 1 }).withMessage('Rol inválido.'),
];

/**
 * Reglas de validación para el formulario de inicio de sesión.
 * El username es escapado para prevenir inyección (RS-02).
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const loginValidators = [
  body('username').trim().notEmpty().withMessage('Username requerido.').escape(),
  body('password').notEmpty().withMessage('Contraseña requerida.'),
];

module.exports = { productValidators, createUserValidators, updateUserValidators, loginValidators };
