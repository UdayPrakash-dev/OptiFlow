import { config } from '#config/env.js';
import { logger } from '#platform/logging/logger.js';
import { createApp } from './app.js';

const app = createApp();

const server = app.listen(config.PORT, config.HOST, () => {
  logger.info(
    { port: config.PORT, host: config.HOST, env: config.NODE_ENV },
    `OptiFlow API listening on http://${config.HOST}:${config.PORT}`
  );
});

// Graceful shutdown handling
function shutdown(signal) {
  logger.info({ signal }, `Received ${signal}, starting graceful shutdown`);

  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during server close');
      process.exit(1);
    }
    logger.info('HTTP server closed successfully');
    process.exit(0);
  });

  // Force close after 10 seconds if connections fail to drain
  setTimeout(() => {
    logger.error('Shutdown timeout reached, forcing exit');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled Promise Rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception');
  process.exit(1);
});
