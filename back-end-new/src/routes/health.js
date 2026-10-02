import { Router } from 'express';
import { prisma } from '../config/prisma.js';

const router = Router();

/**
 * GET /health
 * Performs a health check including safe database ping
 */
router.get(['/health', '/api/health'], async (req, res, next) => {
  try {
    // Ping database safely with SELECT 1
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: 'degraded',
        database: 'disconnected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
