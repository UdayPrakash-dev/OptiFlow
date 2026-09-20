import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { config } from '#config/env.js';
import { requestIdMiddleware } from '#platform/http/middleware/requestId.js';
import { requestLogger } from '#platform/http/middleware/requestLogger.js';
import { errorHandler } from '#platform/http/middleware/errorHandler.js';
import { respondSuccess } from '#platform/http/respond.js';
import { AppError } from '#platform/errors/AppError.js';

/**
 * Express application factory.
 * Sets up middleware pipeline, health check routes, API routers, and central error handling.
 */
export function createApp() {
  const app = express();

  // Trust proxy in containerized / reverse-proxy environments for accurate client IPs
  app.set('trust proxy', 1);

  // Security headers & Cross-Origin Resource Sharing
  app.use(helmet());
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true
  }));

  // Body parsing and cookies
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser(config.COOKIE_SECRET));

  // Request correlation and structured logging
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // Liveness check (process alive, no external dependencies)
  app.get('/healthz', (_req, res) => {
    respondSuccess(res, { status: 'healthy', uptime: process.uptime() });
  });

  // Readiness check (ready to accept traffic)
  app.get('/readyz', (_req, res) => {
    respondSuccess(res, { status: 'ready' });
  });

  // API v1 root banner
  app.get('/api/v1', (_req, res) => {
    respondSuccess(res, {
      service: 'OptiFlow API',
      version: '1.0.0',
      environment: config.NODE_ENV
    });
  });

  // Catch-all for unmapped routes -> 404
  app.use((req, _res, next) => {
    next(AppError.notFound('Endpoint', req.originalUrl));
  });

  // Central error handler (must be last middleware)
  app.use(errorHandler);

  return app;
}
