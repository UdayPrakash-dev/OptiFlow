const fs = require('fs');
let content = fs.readFileSync('back-end-new/prisma/seed.ts', 'utf8');

content = content.replace(/const projectQ3 = await prisma.project.create\({\s*}\);/g, 'const projectQ3 = await prisma.project.create({ data: { companyId: acmeCorp.id, teamId: teamSales.id, name: "Q3 Marketing Campaign", status: ProjectStatus.Active, startDate: new Date(), targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), createdById: userAlice.id } });');
content = content.replace(/const projectMobile = await prisma.project.create\({\s*}\);/g, 'const projectMobile = await prisma.project.create({ data: { companyId: acmeCorp.id, teamId: teamSales.id, name: "Mobile App V2", status: ProjectStatus.Active, startDate: new Date(), targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), createdById: userAlice.id } });');
content = content.replace(/const projectSOC2 = await prisma.project.create\({\s*}\);/g, 'const projectSOC2 = await prisma.project.create({ data: { companyId: acmeCorp.id, teamId: teamSales.id, name: "SOC2 Compliance Audit", status: ProjectStatus.Active, startDate: new Date(), targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), createdById: userAlice.id } });');
content = content.replace(/const projectCRM = await prisma.project.create\({\s*}\);/g, 'const projectCRM = await prisma.project.create({ data: { companyId: acmeCorp.id, teamId: teamSales.id, name: "CRM Migration", status: ProjectStatus.Active, startDate: new Date(), targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), createdById: userAlice.id } });');

content = content.replace(/const step1 = await prisma.processTemplateStep.create\({\s*data: { templateId: processTemplate.id, stepOrder: 1, name: "Vendor Information & Audit Intake", stepType: StepType.Input_Required },\s*}\);/g, 'const step1 = await prisma.processTemplateStep.create({ data: { companyId: acmeCorp.id, templateId: processTemplate.id, stepOrder: 1, name: "Vendor Information & Audit Intake", stepType: StepType.Input_Required } });');
content = content.replace(/const step2 = await prisma.processTemplateStep.create\({ data: { templateId: processTemplate.id, stepOrder: 2, name: "Security Officer Sign-off", stepType: StepType.Approval } }\);/g, 'const step2 = await prisma.processTemplateStep.create({ data: { companyId: acmeCorp.id, templateId: processTemplate.id, stepOrder: 2, name: "Security Officer Sign-off", stepType: StepType.Approval } });');

// also replace duplicate companyId in evidence
content = content.replace(/companyId: acmeCorp.id,\s*companyId: acmeCorp.id,/g, 'companyId: acmeCorp.id,');
// and in processInstance
content = content.replace(/companyId: acmeCorp.id,\s*companyId: acmeCorp.id,/g, 'companyId: acmeCorp.id,');

// Check compliance binding and rules
content = content.replace(/await prisma.complianceBinding.create\({\s*data: { ruleId: rule2FA.id, scopeType: ScopeType.Company, scopeId: acmeCorp.id },\s*}\);/g, 'await prisma.complianceBinding.create({ data: { companyId: acmeCorp.id, ruleId: rule2FA.id, scopeType: ScopeType.Company, scopeId: acmeCorp.id } });');

fs.writeFileSync('back-end-new/prisma/seed.ts', content);
