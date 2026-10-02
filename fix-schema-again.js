const fs = require('fs');
let schema = fs.readFileSync('back-end-new/prisma/schema.prisma', 'utf8');

function addFieldToModel(modelName, fieldDefinition) {
    const regex = new RegExp(`(model ${modelName} \\{[^}]*)`, 'g');
    schema = schema.replace(regex, `$1\n  ${fieldDefinition}`);
}

addFieldToModel('Company', 'updatedAt DateTime @updatedAt');
addFieldToModel('Subscription', 'updatedAt DateTime @updatedAt');
addFieldToModel('Plan', 'updatedAt DateTime @updatedAt');
addFieldToModel('Role', 'updatedAt DateTime @updatedAt');
addFieldToModel('RoleTemplate', 'updatedAt DateTime @updatedAt');
addFieldToModel('Project', 'createdById String');

fs.writeFileSync('back-end-new/prisma/schema.prisma', schema);
