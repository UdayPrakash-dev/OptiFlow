const fs = require('fs');

function fixTest(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('import complianceRoutes')) {
        content = content.replace(/import complianceRoutes from '\.\/src\/routes\/compliance\.routes\.js';/, 
        `import complianceRulesRoutes from './src/routes/compliance-rules.routes.js';
import complianceViolationsRoutes from './src/routes/compliance-violations.routes.js';
import complianceEvidenceRoutes from './src/routes/compliance-evidence.routes.js';`);
        
        content = content.replace(/app\.use\(complianceRoutes\);/g, 
        `app.use(complianceRulesRoutes);
app.use(complianceViolationsRoutes);
app.use(complianceEvidenceRoutes);`);
    }

    if (content.includes('import orgRoutes')) {
         content = content.replace(/import orgRoutes from '\.\/src\/routes\/org\.routes\.js';/, 
        `import rolesRoutes from './src/routes/roles.routes.js';
import branchesRoutes from './src/routes/branches.routes.js';
import teamsRoutes from './src/routes/teams.routes.js';
import auditLogsRoutes from './src/routes/audit-logs.routes.js';
import permissionsRoutes from './src/routes/permissions.routes.js';
import roleTemplatesRoutes from './src/routes/role-templates.routes.js';
import roleAssignmentsRoutes from './src/routes/role-assignments.routes.js';
import bootstrapRoutes from './src/routes/bootstrap.routes.js';`);

        content = content.replace(/app\.use\(orgRoutes\);/g, 
        `app.use(rolesRoutes);
app.use(branchesRoutes);
app.use(teamsRoutes);
app.use(auditLogsRoutes);
app.use(permissionsRoutes);
app.use(roleTemplatesRoutes);
app.use(roleAssignmentsRoutes);
app.use(bootstrapRoutes);`);
    }

    fs.writeFileSync(file, content);
}

fixTest('back-end-new/test-step8.js');
fixTest('back-end-new/test-section-c.js');
const fs = require('fs');

function fixSectionC(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes("import complianceCategoriesRoutes") === false && content.includes("complianceCategoriesRoutes")) {
        // already fixed
    } else if (content.includes("app.use(complianceRulesRoutes)") && !content.includes("app.use(complianceCategoriesRoutes)")) {
        content = content.replace(/import complianceEvidenceRoutes from '\.\/src\/routes\/compliance-evidence\.routes\.js';/, 
        `import complianceEvidenceRoutes from './src/routes/compliance-evidence.routes.js';
import complianceCategoriesRoutes from './src/routes/compliance-categories.routes.js';
import complianceBindingsRoutes from './src/routes/compliance-bindings.routes.js';`);

         content = content.replace(/app\.use\(complianceEvidenceRoutes\);/, 
        `app.use(complianceEvidenceRoutes);
app.use(complianceCategoriesRoutes);
app.use(complianceBindingsRoutes);`);
        fs.writeFileSync(file, content);
    }
}
fixSectionC('back-end-new/test-section-c.js');
fixTest('back-end-new/test-step5.js');
