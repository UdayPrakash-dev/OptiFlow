const fs = require('fs');
let content = fs.readFileSync('back-end-new/prisma/seed.ts', 'utf8');

// 1. Add createdById back to ProcessTemplate
content = content.replace(/name: "Vendor Security & Compliance Onboarding",\s*version: 1,\s*isActive: true,/, 'name: "Vendor Security & Compliance Onboarding",\n      version: 1,\n      isActive: true, createdById: userAlice.id,');

// 2. Remove createdById from ComplianceRule (rule2FA)
content = content.replace(/name: "Acme Mandatory 2FA Enforcement Policy",\s*description: "All employee accounts must have 2FA tokens enabled.",\s*severity: Severity.Critical,\s*categoryId: categorySecurity.id,\s*isActive: true, createdById: userAlice.id,/g, 
`name: "Acme Mandatory 2FA Enforcement Policy",
      description: "All employee accounts must have 2FA tokens enabled.",
      severity: Severity.Critical,
      categoryId: categorySecurity.id,
      isActive: true,`);

fs.writeFileSync('back-end-new/prisma/seed.ts', content);
