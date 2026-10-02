import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import orgRoutes from './org.routes.js';
import projectsRoutes from './projects.routes.js';
import tasksRoutes from './tasks.routes.js';
import notificationsRoutes from './notifications.routes.js';
import complianceRoutes from './compliance.routes.js';
import processRoutes from './process.routes.js';
import platformRoutes from './platform.routes.js';
import executiveRoutes from './executive.routes.js';
import attachmentsRoutes from './attachments.routes.js';

const router = Router();

/**
 * GET /api / GET /api/status
 * Verifies that the central router is mounted and accessible.
 */
router.get(['/api', '/api/status'], (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'OptiFlow API',
      version: '1.0.0',
      status: 'active',
      timestamp: new Date().toISOString(),
    },
  });
});

// Feature Routers
router.use(authRoutes);
router.use(usersRoutes);
router.use(orgRoutes);
router.use(projectsRoutes);
router.use(tasksRoutes);
router.use(notificationsRoutes);
router.use(complianceRoutes);
router.use(processRoutes);
router.use(platformRoutes);
router.use(executiveRoutes);
router.use(attachmentsRoutes);

export default router;
