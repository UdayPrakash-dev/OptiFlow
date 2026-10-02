const fs = require('fs');
let file = 'back-end-new/test-section-c.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import complianceCategoriesRoutes")) {
    content = content.replace(/import complianceEvidenceRoutes from '\.\/src\/routes\/compliance-evidence\.routes\.js';/, 
    `import complianceEvidenceRoutes from './src/routes/compliance-evidence.routes.js';
import complianceCategoriesRoutes from './src/routes/compliance-categories.routes.js';
import complianceBindingsRoutes from './src/routes/compliance-bindings.routes.js';`);
}

if (!content.includes("app.use(complianceCategoriesRoutes)")) {
     content = content.replace(/app\.use\(complianceEvidenceRoutes\);/, 
    `app.use(complianceEvidenceRoutes);
app.use(complianceCategoriesRoutes);
app.use(complianceBindingsRoutes);`);
}
fs.writeFileSync(file, content);
