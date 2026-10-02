const fs = require('fs');
let content = fs.readFileSync('back-end-new/prisma/seed.ts', 'utf8');

// 1. Missing import ProjectStatus
content = content.replace(/EscalationStatus,\n} from "@prisma\/client";/, 'EscalationStatus,\n  ProjectStatus,\n} from "@prisma/client";');

// 2. complianceRule.create (rule2FA): remove createdById: userAlice.id.
content = content.replace(/isActive: true, createdById: userAlice.id,(\r?\n\s*},)/, 'isActive: true,$1');

// 3. complianceBinding.create: remove companyId: acmeCorp.id
content = content.replace(/await prisma\.complianceBinding\.create\(\{ data: \{ companyId: acmeCorp\.id, ruleId: rule2FA\.id/g, 'await prisma.complianceBinding.create({ data: { ruleId: rule2FA.id');

// 4. attachment.create: remove fileUrl
content = content.replace(/fileUrl: "\/uploads\/acme_2fa_signoff_proof\.pdf",\s*uploadedById: userDavid\.id,/g, 'uploadedById: userDavid.id,');

// 5. auditLog.createMany: remove usedPermissionSlug from every row
content = content.replace(/performedById: userAlice\.id, usedPermissionSlug: "projects\.manage" \}/g, 'performedById: userAlice.id }');
content = content.replace(/performedById: userArjun\.id, usedPermissionSlug: "process\.manage" \}/g, 'performedById: userArjun.id }');
content = content.replace(/performedById: userDavid\.id, usedPermissionSlug: "tasks\.manage" \}/g, 'performedById: userDavid.id }');

// 6. auditLog.create inside loop: remove usedPermissionSlug
content = content.replace(/userAgent: "Mozilla\/5\.0 Demo Browser",\s*usedPermissionSlug: i % 2 === 0 \? null : "tasks\.manage"/g, 'userAgent: "Mozilla/5.0 Demo Browser"');

// 7. task.create inside loop: add createdById: userBob.id
content = content.replace(/assignedToId: assignedTo\.id,\s*dueDate: new Date/g, 'assignedToId: assignedTo.id,\n        createdById: userBob.id,\n        dueDate: new Date');

// 8. Cleanup block: add await prisma.teamMember.deleteMany({});
content = content.replace(/await prisma\.team\.deleteMany\(\{.*?\}\);/g, 'await prisma.teamMember.deleteMany({});\n  await prisma.team.deleteMany({});');

// 9. replace subtask.createMany
content = content.replace(/await prisma\.subtask\.createMany\(\{\s*data: \[\s*\],\s*\}\);/g, 
`await prisma.subtask.createMany({
    data: [
      { companyId: acmeCorp.id, taskId: task1.id, title: "Subtask 1", createdById: userAlice.id, status: TaskStatus.Completed },
      { companyId: acmeCorp.id, taskId: task1.id, title: "Subtask 2", createdById: userAlice.id, status: TaskStatus.In_Review }
    ],
  });`);

fs.writeFileSync('back-end-new/prisma/seed.ts', content);
