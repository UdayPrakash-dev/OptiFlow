const fs = require('fs');
const content = fs.readFileSync('back-end-new/src/controllers/users.controller.js', 'utf8');

let newContent = content.replace(/import { Router } from 'express';\n/, '');
newContent = newContent.replace(/import { authenticate } from '..\/middleware\/authenticate.js';\n/, '');
newContent = newContent.replace(/import { requireRoles } from '..\/middleware\/requireRoles.js';\n/, '');
newContent = newContent.replace(/const router = Router\(\);\n/, '');

newContent = newContent.replace(/async function listUsers/g, 'export async function listUsers');
newContent = newContent.replace(/async function listUserRoleMappings/g, 'export async function listUserRoleMappings');
newContent = newContent.replace(/async function getUserById/g, 'export async function getUserById');
newContent = newContent.replace(/async function createUser/g, 'export async function createUser');
newContent = newContent.replace(/async function updateUser/g, 'export async function updateUser');
newContent = newContent.replace(/async function deactivateUser/g, 'export async function deactivateUser');

const routerRegex = /\/\/ User Routes[\s\S]*export default router;/;
newContent = newContent.replace(routerRegex, '');

fs.writeFileSync('back-end-new/src/controllers/users.controller.js', newContent);
