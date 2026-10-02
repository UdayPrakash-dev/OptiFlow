const fs = require('fs');
let lines = fs.readFileSync('back-end-new/prisma/schema.prisma', 'utf8').split('\n');

function insertIntoModel(modelName, newLines) {
  let inModel = false;
  let modelEndLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(`model ${modelName} {`)) {
      inModel = true;
    } else if (inModel) {
      if (lines[i].trim().startsWith('@@') || lines[i].trim() === '}') {
        modelEndLine = i;
        break;
      }
    }
  }
  if (modelEndLine !== -1) {
    lines.splice(modelEndLine, 0, ...newLines.map(l => '  ' + l));
  }
}

insertIntoModel('ComplianceBinding', ['companyId String']);
insertIntoModel('Notification', ['companyId String']);
insertIntoModel('Attachment', ['storageKey String']);
insertIntoModel('Project', ['createdById String']);
insertIntoModel('ProcessInstance', ['title String']);

const updateAtModels = [
  'Plan', 'Subscription', 'Company', 'RoleTemplate', 'Role', 
  'ComplianceCategory', 'ComplianceRule', 'ComplianceViolation', 'ComplianceEvidence', 'Attachment'
];

for (const m of updateAtModels) {
  insertIntoModel(m, ['updatedAt DateTime @updatedAt']);
}

fs.writeFileSync('back-end-new/prisma/schema.prisma', lines.join('\n'));
