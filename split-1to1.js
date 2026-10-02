const fs = require('fs');

function splitOneToOne(feature) {
  let content = fs.readFileSync(`back-end-new/src/routes/${feature}.routes.js`, 'utf8');

  // Find all function names
  const functionRegex = /async function ([a-zA-Z0-9_]+)\(|function ([a-zA-Z0-9_]+)\(/g;
  let match;
  const functions = [];
  while ((match = functionRegex.exec(content)) !== null) {
    functions.push(match[1] || match[2]);
  }

  // controller content
  let controllerContent = content;
  controllerContent = controllerContent.replace(/import { Router } from 'express';\n?/, '');
  controllerContent = controllerContent.replace(/import { authenticate } from '..\/middleware\/authenticate.js';\n?/, '');
  controllerContent = controllerContent.replace(/import { requireRoles } from '..\/middleware\/authorize.js';\n?/, '');
  controllerContent = controllerContent.replace(/import { authenticatePlatformAdmin } from '..\/middleware\/authenticatePlatformAdmin.js';\n?/, '');
  controllerContent = controllerContent.replace(/const router = Router\(\);\n?/, '');
  
  // Replace async function with export async function
  controllerContent = controllerContent.replace(/async function /g, 'export async function ');
  // Replace function with export function (for sync ones)
  controllerContent = controllerContent.replace(/^function /gm, 'export function ');

  // Remove router blocks
  controllerContent = controllerContent.replace(/\/\/ (Platform|Executive|Notifications|Attachments).*Routes[\s\S]*/i, '');
  controllerContent = controllerContent.replace(/router\.[a-z]+\([\s\S]*?(?=\n\n|\n$)/g, '');
  controllerContent = controllerContent.replace(/export default router;/g, '');
  
  fs.writeFileSync(`back-end-new/src/controllers/${feature}.controller.js`, controllerContent);

  // Now generate routes file
  let routesContent = `import { Router } from 'express';\n`;
  if (content.includes('import { authenticate }')) routesContent += `import { authenticate } from '../middleware/authenticate.js';\n`;
  if (content.includes('import { authenticatePlatformAdmin }')) routesContent += `import { authenticatePlatformAdmin } from '../middleware/authenticatePlatformAdmin.js';\n`;
  if (content.includes('import { requireRoles }')) routesContent += `import { requireRoles } from '../middleware/authorize.js';\n`;
  if (content.includes('import { ROLES }')) routesContent += `import { ROLES } from '../utils/roles.js';\n`;
  routesContent += `import {\n  ${functions.join(',\n  ')}\n} from '../controllers/${feature}.controller.js';\n\n`;
  routesContent += `const router = Router();\n\n`;

  // Find all route declarations
  const routeRegex = /router\.[a-z]+\([\s\S]*?\);/g;
  let routeMatch;
  while ((routeMatch = routeRegex.exec(content)) !== null) {
      routesContent += routeMatch[0] + '\n';
  }
  
  routesContent += `\nexport default router;\n`;
  
  fs.writeFileSync(`back-end-new/src/routes/${feature}.routes.js`, routesContent);
}

['platform', 'executive', 'notifications', 'attachments'].forEach(splitOneToOne);
