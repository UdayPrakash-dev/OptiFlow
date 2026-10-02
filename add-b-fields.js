const fs = require('fs');
let schema = fs.readFileSync('back-end-new/prisma/schema.prisma', 'utf8');

function addFieldToModel(modelName, fieldDefinition) {
    const regex = new RegExp(`(model ${modelName} \\{[^}]*)`, 'g');
    schema = schema.replace(regex, `$1\n  ${fieldDefinition}`);
}

addFieldToModel('ComplianceBinding', 'companyId String\n  company   Company @relation(fields: [companyId], references: [id])');
addFieldToModel('Attachment', 'storageKey String');
addFieldToModel('Notification', 'companyId String\n  company   Company @relation(fields: [companyId], references: [id])');

fs.writeFileSync('back-end-new/prisma/schema.prisma', schema);
