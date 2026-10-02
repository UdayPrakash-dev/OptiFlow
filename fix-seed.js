const fs = require('fs');
let content = fs.readFileSync('back-end-new/prisma/seed.ts', 'utf8');

// fix role templates
content = content.replace(/label: "System Admin" }/g, 'label: "System Admin", slug: "system_admin" }');
content = content.replace(/label: "Company Owner" }/g, 'label: "Company Owner", slug: "company_owner" }');
content = content.replace(/label: "Access Governance" }/g, 'label: "Access Governance", slug: "access_governance" }');
content = content.replace(/label: "Process Admin" }/g, 'label: "Process Admin", slug: "process_admin" }');
content = content.replace(/label: "Compliance Officer" }/g, 'label: "Compliance Officer", slug: "compliance_officer" }');
content = content.replace(/label: "Project Manager" }/g, 'label: "Project Manager", slug: "project_manager" }');
content = content.replace(/label: "Team Lead" }/g, 'label: "Team Lead", slug: "team_lead" }');
content = content.replace(/label: "Team Member" }/g, 'label: "Team Member", slug: "team_member" }');
content = content.replace(/label: "Branch Manager" }/g, 'label: "Branch Manager", slug: "branch_manager" }');

// fix roles
content = content.replace(/label: "System Admin", isSystem:/g, 'label: "System Admin", name: "system_admin", isSystem:');
content = content.replace(/label: "Company Owner", isSystem:/g, 'label: "Company Owner", name: "company_owner", isSystem:');
content = content.replace(/label: "Access Governance", isSystem:/g, 'label: "Access Governance", name: "access_governance", isSystem:');
content = content.replace(/label: "Process Admin", isSystem:/g, 'label: "Process Admin", name: "process_admin", isSystem:');
content = content.replace(/label: "Compliance Officer", isSystem:/g, 'label: "Compliance Officer", name: "compliance_officer", isSystem:');
content = content.replace(/label: "Project Manager", isSystem:/g, 'label: "Project Manager", name: "project_manager", isSystem:');
content = content.replace(/label: "Team Lead", isSystem:/g, 'label: "Team Lead", name: "team_lead", isSystem:');
content = content.replace(/label: "Team Member", isSystem:/g, 'label: "Team Member", name: "team_member", isSystem:');
content = content.replace(/label: "Branch Manager", isSystem:/g, 'label: "Branch Manager", name: "branch_manager", isSystem:');

fs.writeFileSync('back-end-new/prisma/seed.ts', content);
