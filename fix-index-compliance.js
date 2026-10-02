const fs = require('fs');
let indexContent = fs.readFileSync('back-end-new/src/routes/index.js', 'utf8');

indexContent = indexContent.replace(/import complianceRoutes from '\.\/compliance\.routes\.js';\n/, 
  "import complianceRulesRoutes from './compliance-rules.routes.js';\n" +
  "import complianceViolationsRoutes from './compliance-violations.routes.js';\n" +
  "import complianceEvidenceRoutes from './compliance-evidence.routes.js';\n" +
  "import complianceCategoriesRoutes from './compliance-categories.routes.js';\n" +
  "import complianceBindingsRoutes from './compliance-bindings.routes.js';\n"
);

indexContent = indexContent.replace(/router\.use\(complianceRoutes\);\n/, 
  "router.use(complianceRulesRoutes);\n" +
  "router.use(complianceViolationsRoutes);\n" +
  "router.use(complianceEvidenceRoutes);\n" +
  "router.use(complianceCategoriesRoutes);\n" +
  "router.use(complianceBindingsRoutes);\n"
);

fs.writeFileSync('back-end-new/src/routes/index.js', indexContent);
