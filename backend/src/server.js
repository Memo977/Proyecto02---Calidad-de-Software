/**
 * @file server.js
 * @description Punto de entrada del servidor HTTP.
 * Arranca la aplicación Express en el puerto configurado e implementa un
 * apagado graceful (graceful shutdown) al recibir señales SIGTERM o SIGINT,
 * asegurando que las conexiones activas se cierren correctamente antes de
 * terminar el proceso.
 */

const app = require('./app');
const config = require('./config');

/** Inicia el servidor en el puerto indicado por la configuración */
const server = app.listen(config.PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║        SecureApp — Backend API           ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  URL:  http://localhost:${config.PORT}              ║`);
  console.log(`║  ENV:  ${config.NODE_ENV.padEnd(34)}║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});

/**
 * Maneja la señal SIGTERM (p.ej. enviada por Docker o Kubernetes al detener
 * el contenedor) para cerrar el servidor de forma ordenada.
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});

/**
 * Maneja la señal SIGINT (p.ej. Ctrl+C en consola) para cerrar el servidor
 * de forma ordenada durante el desarrollo.
 */
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
