const fs = require('fs');
let content = fs.readFileSync('back-end-new/prisma/schema.prisma', 'utf8');

function ensureUpdatedAt(model) {
  const regex = new RegExp(`model ${model} \\{[^}]*\\}`, 'g');
  content = content.replace(regex, (match) => {
    if (!match.includes('updatedAt')) {
      return match.replace(/}$/, '  updatedAt DateTime @updatedAt\n}');
    }
    return match;
  });
}

['ComplianceRule', 'ComplianceBinding', 'ComplianceViolation', 'ComplianceEvidence', 'Attachment', 'AuditLog', 'ProcessInstance', 'ProcessInstanceStep'].forEach(ensureUpdatedAt);

fs.writeFileSync('back-end-new/prisma/schema.prisma', content);
