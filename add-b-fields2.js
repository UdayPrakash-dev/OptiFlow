const fs = require('fs');
let schema = fs.readFileSync('back-end-new/prisma/schema.prisma', 'utf8');

function addFieldToModel(modelName, fieldDefinition) {
    const regex = new RegExp(`(model ${modelName} \\{[^}]*)`, 'g');
    schema = schema.replace(regex, `$1\n  ${fieldDefinition}`);
}

const updateAtModels = [
  'Plan', 'Subscription', 'Company', 'RoleTemplate', 'Role', 
  'ComplianceCategory', 'ComplianceRule', 'ComplianceViolation', 'ComplianceEvidence', 'Attachment'
];

for (const m of updateAtModels) {
  addFieldToModel(m, 'updatedAt DateTime @updatedAt');
}

addFieldToModel('Project', 'createdById String');
addFieldToModel('ProcessInstance', 'title String');

fs.writeFileSync('back-end-new/prisma/schema.prisma', schema);
