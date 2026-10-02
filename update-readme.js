const fs = require('fs');

const table = `
## Backend Refactoring: Routes and Controllers Separation

The backend has been refactored to separate route definitions from business logic.

| Old File | New Route File | New Controller File |
|---|---|---|
| src/routes/health.js | src/routes/health.routes.js | src/controllers/health.controller.js |
| src/routes/auth.routes.js | src/routes/auth.routes.js | src/controllers/auth.controller.js |
| src/routes/users.routes.js | src/routes/users.routes.js | src/controllers/users.controller.js |
| src/routes/projects.routes.js | src/routes/projects.routes.js | src/controllers/projects.controller.js |
| src/routes/tasks.routes.js | src/routes/tasks.routes.js | src/controllers/tasks.controller.js |
| src/routes/process.routes.js | src/routes/process.routes.js | src/controllers/process.controller.js |
| src/routes/org.routes.js | src/routes/roles.routes.js<br>src/routes/branches.routes.js<br>src/routes/teams.routes.js<br>src/routes/audit-logs.routes.js<br>src/routes/permissions.routes.js<br>src/routes/role-templates.routes.js<br>src/routes/role-assignments.routes.js<br>src/routes/bootstrap.routes.js | src/controllers/roles.controller.js<br>src/controllers/branches.controller.js<br>src/controllers/teams.controller.js<br>src/controllers/audit-logs.controller.js<br>src/controllers/permissions.controller.js<br>src/controllers/role-templates.controller.js<br>src/controllers/role-assignments.controller.js<br>src/controllers/bootstrap.controller.js |
| src/routes/compliance.routes.js | src/routes/compliance-rules.routes.js<br>src/routes/compliance-violations.routes.js<br>src/routes/compliance-evidence.routes.js<br>src/routes/compliance-categories.routes.js<br>src/routes/compliance-bindings.routes.js | src/controllers/compliance-rules.controller.js<br>src/controllers/compliance-violations.controller.js<br>src/controllers/compliance-evidence.controller.js<br>src/controllers/compliance-categories.controller.js<br>src/controllers/compliance-bindings.controller.js |
| src/routes/platform.routes.js | src/routes/platform.routes.js | src/controllers/platform.controller.js |
| src/routes/executive.routes.js | src/routes/executive.routes.js | src/controllers/executive.controller.js |
| src/routes/notifications.routes.js | src/routes/notifications.routes.js | src/controllers/notifications.controller.js |
| src/routes/attachments.routes.js | src/routes/attachments.routes.js | src/controllers/attachments.controller.js |
`;

let readme = fs.readFileSync('back-end-new/README.md', 'utf8');

if (readme.includes('## Project Structure')) {
    readme = readme.replace('## Project Structure', table + '\\n\\n## Project Structure');
} else {
    readme += '\\n\\n' + table;
}

fs.writeFileSync('back-end-new/README.md', readme);

