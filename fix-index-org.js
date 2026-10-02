const fs = require('fs');
let indexContent = fs.readFileSync('back-end-new/src/routes/index.js', 'utf8');

indexContent = indexContent.replace(/import orgRoutes from '\.\/org\.routes\.js';\n/, 
  "import rolesRoutes from './roles.routes.js';\n" +
  "import branchesRoutes from './branches.routes.js';\n" +
  "import teamsRoutes from './teams.routes.js';\n" +
  "import auditLogsRoutes from './audit-logs.routes.js';\n" +
  "import permissionsRoutes from './permissions.routes.js';\n" +
  "import roleTemplatesRoutes from './role-templates.routes.js';\n" +
  "import roleAssignmentsRoutes from './role-assignments.routes.js';\n" +
  "import bootstrapRoutes from './bootstrap.routes.js';\n"
);

indexContent = indexContent.replace(/router\.use\(orgRoutes\);\n/, 
  "router.use(rolesRoutes);\n" +
  "router.use(branchesRoutes);\n" +
  "router.use(teamsRoutes);\n" +
  "router.use(auditLogsRoutes);\n" +
  "router.use(permissionsRoutes);\n" +
  "router.use(roleTemplatesRoutes);\n" +
  "router.use(roleAssignmentsRoutes);\n" +
  "router.use(bootstrapRoutes);\n"
);

fs.writeFileSync('back-end-new/src/routes/index.js', indexContent);
