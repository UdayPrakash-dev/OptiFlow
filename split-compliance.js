const fs = require('fs');
let content = fs.readFileSync('back-end-new/src/routes/compliance.routes.js', 'utf8');

function processFeature(feature, functionsList, routesComment, includeUpload = false) {
  let controllerContent = `import path from 'path';\n`;
  controllerContent += `import fs from 'fs';\n`;
  controllerContent += `import { pipeline } from 'stream/promises';\n`;
  controllerContent += `import { prisma } from '../config/prisma.js';\n`;
  controllerContent += `import { requireRoles } from '../middleware/authorize.js';\n`;
  controllerContent += `import { NotFoundError, BadRequestError, ForbiddenError, ValidationError } from '../utils/errors.js';\n`;
  controllerContent += `import { validateRequired, validateEnum } from '../utils/validation.js';\n`;
  controllerContent += `import { ROLES, normalizeRole } from '../utils/roles.js';\n`;
  controllerContent += `import { createAuditLog, AUDIT_ACTIONS } from '../utils/audit.js';\n\n`;
  
  if (includeUpload) {
     controllerContent += `import { env } from '../config/env.js';\n\n`;
  }

  let body = '';
  functionsList.forEach(fn => {
      const match = new RegExp(`async function ${fn}\\([\\s\\S]*?\\n\\}`).exec(content) || new RegExp(`function ${fn}\\([\\s\\S]*?\\n\\}`).exec(content);
      if(match) {
          body += match[0].replace(/^(async )?function/, 'export $1function') + '\n\n';
      }
  });

  controllerContent += body;
  fs.writeFileSync(`back-end-new/src/controllers/${feature}.controller.js`, controllerContent);

  let routesContent = `import { Router } from 'express';\n`;
  routesContent += `import { authenticate } from '../middleware/authenticate.js';\n`;
  routesContent += `import { requireRoles } from '../middleware/authorize.js';\n`;
  routesContent += `import { ROLES } from '../utils/roles.js';\n`;
  if (includeUpload) {
     routesContent += `import multer from 'multer';\n`;
     routesContent += `import fs from 'fs';\n`;
     routesContent += `import { env } from '../config/env.js';\n`;
  }
  routesContent += `import {\n  ${functionsList.join(',\n  ')}\n} from '../controllers/${feature}.controller.js';\n\n`;
  routesContent += `const router = Router();\n\n`;
  
  if (includeUpload) {
    routesContent += `
// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = env.UPLOAD_DIR;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, \`\${uniqueSuffix}-\${file.originalname}\`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});
\n`;
  }

  const routeMatch = new RegExp(routesComment + `[\\s\\S]*?(?=\\/\\/ |export default router)`).exec(content);
  if(routeMatch) {
      routesContent += routeMatch[0] + '\n\n';
  }
  routesContent += `export default router;\n`;
  
  fs.writeFileSync(`back-end-new/src/routes/${feature}.routes.js`, routesContent);
}

processFeature('compliance-rules', ['listComplianceRules', 'getComplianceRuleById', 'createComplianceRule', 'updateComplianceRule', 'deleteComplianceRule'], '// Rules');
processFeature('compliance-violations', ['listComplianceViolations', 'getComplianceViolationById', 'createComplianceViolation', 'updateComplianceViolation', 'deleteComplianceViolation'], '// Violations');
processFeature('compliance-evidence', ['listEvidence', 'getEvidenceById', 'createEvidence', 'updateEvidence', 'deleteEvidence', 'uploadEvidenceFile', 'streamEvidenceFile'], '// Evidence', true);
processFeature('compliance-categories', ['listComplianceCategories', 'getComplianceCategoryById', 'createComplianceCategory', 'updateComplianceCategory', 'deleteComplianceCategory'], '// Categories routes');
processFeature('compliance-bindings', ['listComplianceBindings', 'getComplianceBindingById', 'createComplianceBinding', 'deleteComplianceBinding'], '// Bindings routes');
