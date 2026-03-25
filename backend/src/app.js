/**
 * @file app.js
 * @description Configuración principal de la aplicación Express.
 * Registra todos los middlewares globales (seguridad, CORS, parseo de cuerpo,
 * cookies) y monta las rutas de la API bajo el prefijo /api.
 * También define los manejadores de error 404 y 500 globales.
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { securityHeaders } = require('./middleware/security.middleware');
const { requireJson } = require('./middleware/contenttype.middleware');
const config = require('./config');

const app = express();

/* ── Seguridad ─────────────────────────────────────────────────────────────── */

/** Agrega cabeceras HTTP de seguridad (Helmet): CSP, X-Frame-Options, HSTS, etc. */
app.use(securityHeaders);

/**
 * Configura CORS para que únicamente el frontend autorizado pueda hacer
 * peticiones con credenciales (cookies).
 */
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
}));

/* ── Parseo de cuerpo y cookies ────────────────────────────────────────────── */

/** Parsea cuerpos JSON con límite de 10 KB para mitigar ataques de payload masivo */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

/** Lee y parsea las cookies enviadas por el cliente */
app.use(cookieParser());

/** Indica a Express que confíe en el primer proxy inverso (necesario en Docker/Nginx) */
app.set('trust proxy', 1);

/**
 * Rechaza peticiones sin Content-Type: application/json en rutas /api.
 * Mejora de seguridad para evitar ataques de tipo MIME sniffing o payloads inesperados.
 */
app.use('/api', requireJson);

/* ── Rutas de la API ───────────────────────────────────────────────────────── */

app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/users',    require('./routes/users.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/audit',    require('./routes/audit.routes'));
app.use('/api/roles',    require('./routes/roles.routes'));

/* ── Health check ──────────────────────────────────────────────────────────── */

/**
 * Endpoint de salud utilizado por Docker Compose y balanceadores de carga
 * para verificar que el servicio está operativo.
 * @route GET /health
 * @returns {{ status: 'ok' }} 200 OK si el servidor está en ejecución
 */
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

/* ── Manejadores de error globales ─────────────────────────────────────────── */

/** Responde 404 para cualquier ruta no registrada */
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

/**
 * Manejador de errores centralizado.
 * Captura errores lanzados por cualquier ruta o middleware y responde con
 * el código HTTP apropiado y un mensaje de error.
 *
 * @param {Error} err   - Objeto de error capturado
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor.' });
});

module.exports = app;