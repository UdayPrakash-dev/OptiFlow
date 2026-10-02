const fs = require('fs');
let content = fs.readFileSync('back-end-new/src/routes/org.routes.js', 'utf8');

function extractBlock(markerStart, markerEndRegex) {
    const startIdx = content.indexOf(markerStart);
    if(startIdx === -1) return null;
    let endIdx = -1;
    if (markerEndRegex) {
        const match = markerEndRegex.exec(content.substring(startIdx + markerStart.length));
        if (match) {
            endIdx = startIdx + markerStart.length + match.index;
        }
    }
    if (endIdx === -1) endIdx = content.length;
    return content.substring(startIdx, endIdx);
}

function processFeature(feature, functionsList, routesComment, includeRegexStr) {
  let controllerContent = `import { prisma } from '../config/prisma.js';\n`;
  controllerContent += `import { requireRoles } from '../middleware/authorize.js';\n`;
  controllerContent += `import { NotFoundError, BadRequestError, ForbiddenError, ValidationError } from '../utils/errors.js';\n`;
  controllerContent += `import { validateRequired, validateEmail } from '../utils/validation.js';\n`;
  controllerContent += `import { ROLES, normalizeRole } from '../utils/roles.js';\n`;
  controllerContent += `import { createAuditLog, AUDIT_ACTIONS } from '../utils/audit.js';\n\n`;

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
  routesContent += `import {\n  ${functionsList.join(',\n  ')}\n} from '../controllers/${feature}.controller.js';\n\n`;
  routesContent += `const router = Router();\n\n`;

  const routeMatch = new RegExp(routesComment + `[\\s\\S]*?(?=\\/\\/ |export default router)`).exec(content);
  if(routeMatch) {
      routesContent += routeMatch[0] + '\n\n';
  }
  routesContent += `export default router;\n`;
  
  fs.writeFileSync(`back-end-new/src/routes/${feature}.routes.js`, routesContent);
}

processFeature('roles', ['listRoles', 'getRoleById'], '// Roles Routes');
processFeature('branches', ['listBranches', 'getBranchById', 'createBranch', 'updateBranch', 'deleteBranch'], '// Branches Routes');
processFeature('teams', ['listTeams', 'getTeamById', 'createTeam', 'updateTeam', 'deleteTeam'], '// Teams Routes');
processFeature('audit-logs', ['listAuditLogs', 'listAuditLogsByUser', 'listAuditLogsByEntity', 'createAuditLogEndpoint'], '// Audit Logs Routes');
processFeature('permissions', ['listPermissions'], '// Permissions Routes');
processFeature('role-templates', ['listRoleTemplates'], '// Role Templates Routes');
processFeature('role-assignments', ['listRoleAssignments', 'getRoleAssignmentById', 'createRoleAssignment', 'updateRoleAssignment', 'deleteRoleAssignment'], '// Role Assignments Routes');
processFeature('bootstrap', ['getBootstrapState'], '// Bootstrap Aggregator Route');

// Create a combined org router proxy, or let index.js mount them directly.
// The instructions say: "Keep src/routes/index.js as the central mounting file."
// And "Split org.routes.js into separate modules". We'll just delete org.routes.js.
