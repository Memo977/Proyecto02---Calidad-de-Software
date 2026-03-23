/**
 * @file middleware/contenttype.middleware.js
 * @description Middleware que impone el Content-Type correcto en peticiones mutantes.
 * Rechaza cualquier solicitud POST/PUT/PATCH cuyo Content-Type no sea
 * 'application/json', devolviendo un error 415 Unsupported Media Type.
 *
 * Mejora de seguridad: evita ataques de tipo content sniffing o payloads
 * enviados en un formato no esperado por la API.
 * Los métodos seguros (GET, HEAD, OPTIONS, DELETE) no requieren cuerpo y son omitidos.
 */

/**
 * Verifica que el Content-Type de la petición sea 'application/json'.
 * Si no lo es (y el método requiere cuerpo), responde con HTTP 415.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const requireJson = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS', 'DELETE'];
  if (safeMethods.includes(req.method)) return next();

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return res.status(415).json({
      error: 'Content-Type debe ser application/json.',
    });
  }
  next();
};

module.exports = { requireJson };